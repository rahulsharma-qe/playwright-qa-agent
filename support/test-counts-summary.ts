// The run page's count line, with UI tests and framework checks apart, never one mixed total:
//   node support/test-counts-summary.ts <results.json>   →  "31 UI tests, 57 framework checks (and 2 set-up steps)"
// UI tests are the login and logged-in projects; framework checks are the unit tests of our own helpers.
import { appendFileSync, readFileSync } from 'node:fs';
import { collectTests, UI_PROJECTS } from './planted-bug-count.ts';

export function countsLine(report: Parameters<typeof collectTests>[0]): string {
  const tests = collectTests(report);
  const ui = tests.filter((t) => UI_PROJECTS.includes(t.project)).length;
  const checks = tests.filter((t) => t.project === 'unit').length;
  const setUp = tests.length - ui - checks;
  return `${ui} UI tests, ${checks} framework checks (and ${setUp} set-up steps)`;
}

if (process.argv[1]?.endsWith('test-counts-summary.ts')) {
  const line = countsLine(JSON.parse(readFileSync(process.argv[2], 'utf8')));
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
}
