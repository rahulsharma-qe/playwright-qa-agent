// The suites' tag rules, checked rather than trusted: every UI test is in the full suite (@regression); a sanity test
// is also P0 (@sanity → @p0); a P0 test is also in the full suite (@p0 → @regression). So each smaller suite is
// part of the larger one. Run by CI's count step (support/check-test-count.ts) on the --list JSON.
// Plain TypeScript with no imports, so Node runs it directly.

export type TaggedTest = { name: string; project: string; tags: string[] };

type Spec = { title: string; file: string; tags?: string[]; tests: { projectName: string }[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };

/** Every test in a --list JSON, with its tags written as in the code (@regression). */
export function taggedTests(report: { suites: Suite[] }): TaggedTest[] {
  const found: TaggedTest[] = [];
  const walk = (suite: Suite) => {
    for (const spec of suite.specs ?? []) {
      const tags = (spec.tags ?? []).map((tag) => (tag.startsWith('@') ? tag : `@${tag}`));
      for (const test of spec.tests) found.push({ name: `${spec.file} › ${spec.title}`, project: test.projectName, tags });
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of report.suites) walk(suite);
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
