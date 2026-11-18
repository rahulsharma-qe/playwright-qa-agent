// Compares two runs test by test without showing what any test saw: per test, its status and the name of its first
// failing step. It prints "identical", or the names of the tests that differ with the field that differs (status,
// first failing step, or only in one run), never a value: no error, no step name, no attachment. Made to compare runs
// on the with-bugs copy, whose failures nobody reads here, and to compare a run with a kept baseline.
//
//   node support/compare-runs.ts <first> <second> [--names "title one|title two"] [--files a.spec.ts,b.spec.ts]
//                                                 [--outcome-only]
//
// Each run is either Playwright's JSON results (the playwright-json artifact) or an Allure report (the folder, or its
// test-results.json); both runs must be the same kind. --names keeps tests by title; --files keeps Playwright tests
// by spec file; --outcome-only compares status only. Exit code: 0 identical, 1 different, 2 bad input.
//
// Step renames: when our own code renames a report step, an older run's step name is mapped to the new one here, so
// a rename alone is not a difference. A pull request that renames a step says "step renamed: old → new" and adds an
// entry to STEP_RENAMES.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Older step name (pattern) → today's name. */
export const STEP_RENAMES: [RegExp, string][] = [
  // ProductListPage.search(), 6d7f92f..27ff97c
  [/^Search for ".*"$/, 'Search for a product'],
];

export type TestLine = { title: string; status: string; step?: string; hasSteps: boolean };
export type Run = Map<string, TestLine>;

export function renamed(step: string | undefined, renames = STEP_RENAMES): string | undefined {
  return step === undefined ? undefined : renames.reduce((name, [pattern, now]) => (pattern.test(name) ? now : name), step);
}

type AnyStep = { title?: string; name?: string; status?: string; error?: unknown; steps?: AnyStep[] };
const FAILED = new Set(['failed', 'broken']);

/** The deepest first failing step: its title (Playwright) or name (Allure). */
function firstFailingStep(steps: AnyStep[] | undefined): string | undefined {
  for (const step of steps ?? []) {
    const inner = firstFailingStep(step.steps);
    if (inner) return inner;
    if (step.error || (step.status && FAILED.has(step.status))) return step.title ?? step.name;
  }
  return undefined;
}

type PwSpec = { title: string; file: string; tests: { projectName: string; status: string; results: { steps?: AnyStep[] }[] }[] };
type PwSuite = { title: string; specs?: PwSpec[]; suites?: PwSuite[] };

/** Playwright's JSON results: every test outside the unit project. */
export function fromPlaywright(report: { suites: PwSuite[] }, files?: string[]): Run {
  const run: Run = new Map();
  const walk = (suite: PwSuite, describes: string[]) => {
    for (const spec of suite.specs ?? []) {
      if (files && !files.includes(spec.file)) continue;
      for (const test of spec.tests) {
        if (test.projectName === 'unit') continue;
        const steps = test.results.at(-1)?.steps;
        const name = `[${test.projectName}] ${[spec.file, ...describes, spec.title].join(' › ')}`;
        run.set(name, { title: spec.title, status: test.status, step: firstFailingStep(steps), hasSteps: true });
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...describes, child.title]);
  };
  for (const suite of report.suites) walk(suite, []);
  return run;
}

type AllureEntry = { id: string; name: string; fullName?: string; status: string; steps?: AnyStep[] };

/** An Allure report's test-results.json; steps from the entry, or from data/test-results/<id>.json when given. */
export function fromAllure(data: { byId: Record<string, AllureEntry> }, stepsOf: (id: string) => AnyStep[] | undefined = () => undefined): Run {
  const run: Run = new Map();
  for (const entry of Object.values(data.byId ?? {})) {
    const steps = entry.steps ?? stepsOf(entry.id);
    run.set(entry.fullName ?? entry.name, {
      title: entry.name,
      status: entry.status,
      step: firstFailingStep(steps),
      hasSteps: Array.isArray(steps),
    });
  }
  return run;
}

/** Keeps the tests with one of these titles. */
export function onlyTitles(run: Run, titles: string[]): Run {
  return new Map([...run].filter(([, line]) => titles.includes(line.title)));
}

/** Per test that differs: its name and the field, never a value. */
export function differences(first: Run, second: Run, outcomeOnly = false, renames = STEP_RENAMES): string[] {
  const names = [...new Set([...first.keys(), ...second.keys()])].sort();
  const found: string[] = [];
  for (const name of names) {
    const [a, b] = [first.get(name), second.get(name)];
    if (!a || !b) {
      found.push(`${name}: only in the ${a ? 'first' : 'second'} run`);
      continue;
    }
    const fields: string[] = [];
    if (a.status !== b.status) fields.push('status');
    if (!outcomeOnly && renamed(a.step, renames) !== renamed(b.step, renames)) fields.push('first failing step');
    if (fields.length) found.push(`${name}: ${fields.join(' and ')}`);
  }
  return found;
}

/** The whole printed result, for the command line and the tests. */
export function compareReport(first: Run, second: Run, outcomeOnly = false, renames = STEP_RENAMES): { lines: string[]; same: boolean } {
  const stepsMissing = [...first.values(), ...second.values()].some((line) => !line.hasSteps);
  const onlyOutcome = outcomeOnly || stepsMissing;
  const differing = differences(first, second, onlyOutcome, renames);
  const count = new Set([...first.keys(), ...second.keys()]).size;
  const lines = onlyOutcome ? ['outcome only compared; first failing step not compared'] : [];
  if (differing.length === 0) lines.push(`identical (${count} tests compared)`);
  else lines.push(`${differing.length} of ${count} tests differ (the field, never its value):`, ...differing.map((line) => `  ${line}`));
  return { lines, same: differing.length === 0 };
}

function readRun(path: string, files?: string[]): { kind: 'playwright' | 'allure'; run: Run } {
  const file = existsSync(path) && statSync(path).isDirectory() ? join(path, 'test-results.json') : path;
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new Error(`${file}: not readable as JSON`); // Node's own message would quote the file's text
  }
  if (Array.isArray(data.suites)) return { kind: 'playwright', run: fromPlaywright(data, files) };
  if (data.byId) {
    const folder = dirname(file);
    const stepsOf = (id: string) => {
      const own = join(folder, 'data', 'test-results', `${id}.json`);
      return existsSync(own) ? JSON.parse(readFileSync(own, 'utf8')).steps : undefined;
    };
    return { kind: 'allure', run: fromAllure(data, stepsOf) };
  }
  throw new Error(`${path}: neither Playwright's JSON results nor an Allure report`);
}

if (process.argv[1]?.endsWith('compare-runs.ts')) {
  const [firstPath, secondPath, ...flags] = process.argv.slice(2);
  if (!firstPath || !secondPath) {
    console.error('Usage: node support/compare-runs.ts <first> <second> [--names "a|b"] [--files a.spec.ts] [--outcome-only]');
    process.exit(2);
  }
  const value = (flag: string) => (flags.includes(flag) ? flags[flags.indexOf(flag) + 1] : undefined);
  const files = value('--files')?.split(',');
  const titles = value('--names')?.split('|');
  try {
    let [first, second] = [readRun(firstPath, files), readRun(secondPath, files)];
    if (first.kind !== second.kind) throw new Error(`the two runs are not the same kind (${first.kind}, ${second.kind})`);
    if (titles) [first, second] = [{ ...first, run: onlyTitles(first.run, titles) }, { ...second, run: onlyTitles(second.run, titles) }];
    const { lines, same } = compareReport(first.run, second.run, flags.includes('--outcome-only'));
    for (const line of lines) console.log(line);
    process.exit(same ? 0 : 1);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(2);
  }
}
