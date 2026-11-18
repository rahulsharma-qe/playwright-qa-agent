// The suites' tag rules, checked rather than trusted: every UI test is in the full suite (@regression); a sanity test
// is also P0 (@sanity → @p0); a P0 test is also in the full suite (@p0 → @regression). So each smaller suite is
// part of the larger one. And no test's full name (file path, describe titles, test title) holds a suite tag, because
// --grep also reads names: a name with "@p0" in it would join that suite. Run by CI's count step
// (support/check-test-count.ts) on the --list JSON.
// Plain TypeScript with no imports, so Node runs it directly.

export type TaggedTest = { name: string; project: string; tags: string[] };

/** The suite tags; also what a test's full name must never hold. */
export const SUITE_TAGS = ['@sanity', '@p0', '@regression'];

type Spec = { title: string; file: string; tags?: string[]; tests: { projectName: string }[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };

/** Every test in a --list JSON, with its tags written as in the code (@regression). */
export function taggedTests(report: { suites: Suite[] }): TaggedTest[] {
  const found: TaggedTest[] = [];
  // The full name, as --grep reads it: file path, then each describe title, then the test title.
  const walk = (suite: Suite, describes: string[]) => {
    for (const spec of suite.specs ?? []) {
      const tags = (spec.tags ?? []).map((tag) => (tag.startsWith('@') ? tag : `@${tag}`));
      const name = [spec.file, ...describes, spec.title].join(' › ');
      for (const test of spec.tests) found.push({ name, project: test.projectName, tags });
    }
    for (const child of suite.suites ?? []) walk(child, [...describes, child.title]);
  };
  for (const suite of report.suites) walk(suite, []);
  return found;
}

/** One line per broken rule, naming the test; empty when every UI test keeps the rules. */
export function tagRuleBreaks(tests: TaggedTest[], uiProjects: string[]): string[] {
  const breaks: string[] = [];
  for (const { name, project, tags } of tests) {
    if (!uiProjects.includes(project)) continue;
    if (!tags.includes('@regression')) breaks.push(`${name}: every UI test needs @regression`);
    if (tags.includes('@sanity') && !tags.includes('@p0')) breaks.push(`${name}: @sanity needs @p0`);
    if (tags.includes('@p0') && !tags.includes('@regression')) breaks.push(`${name}: @p0 needs @regression`);
  }
  return [...new Set(breaks)];
}

/** Tests in any project whose full name holds a suite tag, with how many. */
export function namesHoldingASuiteTag(tests: TaggedTest[]): string[] {
  const names = tests.filter(({ name }) => SUITE_TAGS.some((tag) => new RegExp(`${tag}\\b`).test(name))).map(({ name }) => name);
  return [...new Set(names)];
}
