// Compares two Playwright JSON results files test by test, without showing what any test saw: for each test it
// compares the name, the outcome and the title of the first failing step, and prints "identical" or only the names
// of the tests that differ. Made to compare runs on the with-bugs copy, whose failures nobody reads here.
//
//   node support/compare-runs.ts <first.json> <second.json> [--files login.spec.ts,search.spec.ts] [--outcome-only]
//
// --files keeps only tests from those spec files (paths as Playwright shows them, under tests/); --outcome-only
// leaves the failing step out, for a run that kept only outcomes. Exit code: 0 identical, 1 different, 2 bad input.
import { readFileSync } from 'node:fs';

type Step = { title: string; error?: unknown };
type Result = { status: string; steps?: Step[] };
type Spec = { title: string; file: string; tests: { projectName: string; status: string; results: Result[] }[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };

/** One line per test: name, then what is compared. Exported for the unit tests. */
export function summarise(report: { suites: Suite[] }, files?: string[], outcomeOnly = false): Map<string, string> {
  const lines = new Map<string, string>();
  const walk = (suite: Suite, path: string[]) => {
    const here = suite.title && !suite.title.endsWith('.ts') ? [...path, suite.title] : path;
    for (const spec of suite.specs ?? []) {
      if (files && !files.includes(spec.file)) continue;
      for (const test of spec.tests) {
        if (test.projectName === 'unit') continue;
        const last = test.results.at(-1);
        const failingStep = last?.steps?.find((step) => step.error)?.title ?? '-';
        const name = `[${test.projectName}] ${spec.file} › ${[...here, spec.title].join(' › ')}`;
        lines.set(name, outcomeOnly ? test.status : `${test.status} | ${failingStep}`);
      }
    }
    for (const child of suite.suites ?? []) walk(child, here);
  };
  for (const suite of report.suites) walk(suite, []);
  return lines;
}

/** The names whose line differs, or that are in only one run. */
export function differences(first: Map<string, string>, second: Map<string, string>): string[] {
  const names = new Set([...first.keys(), ...second.keys()]);
  return [...names].filter((name) => first.get(name) !== second.get(name)).sort();
}

const isMain = process.argv[1]?.endsWith('compare-runs.ts');
if (isMain) {
  const [firstFile, secondFile, ...flags] = process.argv.slice(2);
  if (!firstFile || !secondFile) {
    console.error('Usage: node support/compare-runs.ts <first.json> <second.json> [--files a.spec.ts,b.spec.ts] [--outcome-only]');
    process.exit(2);
  }
  const filesFlag = flags.indexOf('--files');
  const files = filesFlag >= 0 ? flags[filesFlag + 1]?.split(',') : undefined;
  const outcomeOnly = flags.includes('--outcome-only');
  const read = (file: string) => summarise(JSON.parse(readFileSync(file, 'utf8')), files, outcomeOnly);
  const [first, second] = [read(firstFile), read(secondFile)];
  const differing = differences(first, second);
  if (differing.length === 0) {
    console.log(`identical (${first.size} UI tests compared)`);
  } else {
    console.log(`${differing.length} of ${new Set([...first.keys(), ...second.keys()]).size} UI tests differ:`);
    for (const name of differing) console.log(`  ${name}`);
    process.exit(1);
  }
}
