// Checks that the suite has the number of UI tests the planted-bug count expects (EXPECTED_UI_TESTS), so a spec that
// fails to load, or a test added or removed without updating the count, stops CI instead of passing quietly. Then
// checks the suites' tag rules (support/tag-rules.ts) and names any test that breaks them.
//   npx playwright test --list --grep-invert @seed --reporter=json > test-list.json
//   node support/check-test-count.ts test-list.json
import { readFileSync } from 'node:fs';
import { selectRun } from './apps/index.ts';
import { FORK_MESSAGE, noGivenUserOnFork } from './fork-runs.ts';
import { collectTests, EXPECTED_UI_TESTS, UI_PROJECTS } from './planted-bug-count.ts';
import { namesHoldingASuiteTag, tagRuleBreaks, taggedTests } from './tag-rules.ts';

const listFile = process.argv[2];
if (!listFile) {
  console.error('Usage: node support/check-test-count.ts <test-list.json>');
  process.exit(1);
}
if (noGivenUserOnFork(selectRun(process.env).app, process.env)) {
  console.log(`${FORK_MESSAGE} The UI tests were left out, so they are not counted.`);
  process.exit(0);
}
const list = JSON.parse(readFileSync(listFile, 'utf8'));
const found = collectTests(list).filter((t) => UI_PROJECTS.includes(t.project));
const tests = taggedTests(list);
const breaks = tagRuleBreaks(tests, UI_PROJECTS);
const taggedNames = namesHoldingASuiteTag(tests);
let failed = false;
if (found.length !== EXPECTED_UI_TESTS) {
  console.error(
    `Expected ${EXPECTED_UI_TESTS} UI tests, found ${found.length}. A spec may have failed to load, or a test was ` +
      'added or removed: update EXPECTED_UI_TESTS in support/planted-bug-count.ts in the same pull request.',
  );
  failed = true;
} else {
  console.log(`UI tests: ${found.length}, as expected (EXPECTED_UI_TESTS).`);
}
if (breaks.length > 0) {
  console.error(`Tag rules broken (support/tag-rules.ts):\n  ${breaks.join('\n  ')}`);
  failed = true;
} else {
  console.log('Tag rules kept: every UI test @regression; @sanity tests also @p0; @p0 tests also @regression.');
}
if (taggedNames.length > 0) {
  console.error(`${taggedNames.length} test names hold a suite tag (--grep would put them in that suite):\n  ${taggedNames.join('\n  ')}`);
  failed = true;
} else {
  console.log(`No test name holds a suite tag (${tests.length} tests checked).`);
}
if (failed) process.exit(1);
