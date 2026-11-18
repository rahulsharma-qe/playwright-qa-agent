import { expect, test } from '../../fixtures';
import { countsLine } from '../../support/test-counts-summary.ts';

// A made-up results file; no browser and no application needed.
test('the run page shows UI tests and framework checks apart, never one mixed total', () => {
  const spec = (projectName: string) => ({ title: 't', tests: [{ projectName, status: 'expected', results: [{}] }] });
  const report = { suites: [{ title: 'x', specs: ['login', 'logged-in', 'logged-in', 'unit', 'unit', 'unit', 'site-check'].map(spec) }] };
  expect(countsLine(report)).toBe('3 UI tests, 3 framework checks (and 1 set-up steps)');
});
