/**
 * Counts a planted-bug run (Toolshop's "with bugs" copy) from Playwright's JSON results.
 * UI tests (projects `login` and `logged-in`) get one of three outcomes: failed; not reached (they did not run,
 * because a setup step they depend on or their file's own set-up failed first, or they stopped on one of our
 * environment messages); or passed. Setup and unit projects are reported on their own line.
 * Which planted bug a failure caught is decided by a person reading the report, not here.
 * Plain TypeScript (no enums), so Node can run it directly.
 */
import { ADDRESS_FORM_REFILL, refillSummaryLine } from './address-refill.ts';
import { isEnvironmentMessage } from './environment-messages.ts';

export const UI_PROJECTS = ['login', 'logged-in'];
// Update when UI tests are added or removed (step 2 adds tests); the summary warns when the count differs.
export const EXPECTED_UI_TESTS = 30;

export type CountedTest = { title: string; project: string; status: string; errors: string[]; refills?: number };
type Outcome = 'failed' | 'not reached' | 'passed';

type JsonAnnotation = { type: string };

type JsonSuite = {
  specs?: {
    title: string;
    tests?: {
      projectName: string;
      status: string;
      annotations?: JsonAnnotation[];
      results?: { errors?: { message?: string }[]; annotations?: JsonAnnotation[] }[];
    }[];
  }[];
  suites?: JsonSuite[];
};

/** Every test in Playwright's JSON report, with the errors of its last attempt. */
export function collectTests(report: { suites?: JsonSuite[] }): CountedTest[] {
  const tests: CountedTest[] = [];
  const walk = (suite: JsonSuite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const last = test.results?.at(-1);
        const errors = (last?.errors ?? []).map((e) => e.message ?? '');
        const annotations = last?.annotations ?? test.annotations ?? [];
        const refills = annotations.filter((a) => a.type === ADDRESS_FORM_REFILL).length;
        tests.push({ title: spec.title, project: test.projectName, status: test.status, errors, refills });
      }
    }
    (suite.suites ?? []).forEach(walk);
  };
  (report.suites ?? []).forEach(walk);
  return tests;
}

const stoppedOnEnvironment = (t: CountedTest) => t.errors.some(isEnvironmentMessage);

export function totalRefills(tests: CountedTest[]): number {
  return tests.reduce((sum, t) => sum + (t.refills ?? 0), 0);
}

/** Playwright: expected (passed), flaky (passed on retry), unexpected (failed), skipped (did not run). */
export function outcomeOf(t: CountedTest): Outcome {
  if (t.status === 'skipped') return 'not reached';
  if (t.status === 'unexpected') return stoppedOnEnvironment(t) ? 'not reached' : 'failed';
  return 'passed';
}

/** The summary lines: the count of the five UI tests, the setup and unit line, the commit, one line per UI test. */
export function summaryLines(tests: CountedTest[], commit: string): string[] {
  const ui = tests.filter((t) => UI_PROJECTS.includes(t.project));
  const count = (outcome: Outcome) => ui.filter((t) => outcomeOf(t) === outcome).length;
  const others = tests.filter((t) => !UI_PROJECTS.includes(t.project));
  const projectLines = [...new Set(others.map((t) => t.project))].map((project) => {
    const own = others.filter((t) => t.project === project);
    const failed = own.filter((t) => t.status === 'unexpected');
    const environment = failed.filter(stoppedOnEnvironment).length;
    if (failed.length === 0) return `${project}: ${own.length} passed`;
    return `${project}: ${failed.length} failed of ${own.length}${environment ? ` (${environment} with an environment message)` : ''}`;
  });
  const lines = [
    `Planted-bug run: ${count('failed')} failed, ${count('not reached')} not reached, ${count('passed')} passed (of ${ui.length} UI tests)`,
  ];
  if (ui.length !== EXPECTED_UI_TESTS) {
    lines.push(`Expected ${EXPECTED_UI_TESTS} UI tests, found ${ui.length}: a spec may have failed to load.`);
  }
  lines.push(`Setup and unit: ${projectLines.join(' · ') || 'none'}`);
  lines.push(refillSummaryLine(totalRefills(tests)));
  lines.push(`Commit: ${commit}`, '');
  for (const t of ui) {
    const why =
      t.status === 'flaky' ? ' (passed on retry: flaky)' : t.status === 'unexpected' && stoppedOnEnvironment(t) ? ' (environment message)' : '';
    // A refill on the with-bugs copy may be the development server or a planted bug: a person decides.
    const refilled = t.refills ? ` (billing address refilled ${t.refills}×: development server or planted bug? a person decides)` : '';
    lines.push(`- ${outcomeOf(t)}: [${t.project}] ${t.title}${why}${refilled}`);
  }
  return lines;
}
