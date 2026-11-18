// Checks that the suite has the number of UI tests the planted-bug count expects (EXPECTED_UI_TESTS), so a spec that
// fails to load, or a test added or removed without updating the count, stops CI instead of passing quietly.
//   npx playwright test --list --grep-invert @seed --reporter=json > test-list.json
//   node support/check-test-count.ts test-list.json
import { readFileSync } from 'node:fs';
import { selectRun } from './apps/index.ts';
import { FORK_MESSAGE, noGivenUserOnFork } from './fork-runs.ts';
import { collectTests, EXPECTED_UI_TESTS, UI_PROJECTS } from './planted-bug-count.ts';

const listFile = process.argv[2];
if (!listFile) {
  console.error('Usage: node support/check-test-count.ts <test-list.json>');
  process.exit(1);
}
if (noGivenUserOnFork(selectRun(process.env).app, process.env)) {
  console.log(`${FORK_MESSAGE} The UI tests were left out, so they are not counted.`);
  process.exit(0);
}
const found = collectTests(JSON.parse(readFileSync(listFile, 'utf8'))).filter((t) => UI_PROJECTS.includes(t.project));
if (found.length !== EXPECTED_UI_TESTS) {
  console.error(
    `Expected ${EXPECTED_UI_TESTS} UI tests, found ${found.length}. A spec may have failed to load, or a test was ` +
      'added or removed: update EXPECTED_UI_TESTS in support/planted-bug-count.ts in the same pull request.',
  );
  process.exit(1);
}
console.log(`UI tests: ${found.length}, as expected (EXPECTED_UI_TESTS).`);
