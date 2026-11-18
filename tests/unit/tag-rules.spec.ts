import { expect, test } from '../../fixtures';
import { namesHoldingASuiteTag, tagRuleBreaks, taggedTests } from '../../support/tag-rules.ts';

// Made-up tests; no browser and no application needed.
const ui = ['login', 'logged-in'];
const one = (tags: string[], project = 'logged-in') => [{ name: 'a.spec.ts › made-up test', project, tags }];

test.describe('suite tag rules', () => {
  test('the agreed tags keep every rule', () => {
    expect(tagRuleBreaks([...one(['@regression']), ...one(['@regression', '@p0']), ...one(['@regression', '@p0', '@sanity'])], ui)).toEqual([]);
  });

  test('a UI test without the regression tag is named', () => {
    expect(tagRuleBreaks(one([]), ui)).toEqual(['a.spec.ts › made-up test: every UI test needs @regression']);
  });

  test('sanity without p0, and p0 without regression, are named', () => {
    expect(tagRuleBreaks(one(['@regression', '@sanity']), ui)).toEqual(['a.spec.ts › made-up test: @sanity needs @p0']);
    expect(tagRuleBreaks(one(['@p0']), ui)).toContain('a.spec.ts › made-up test: @p0 needs @regression');
  });

  test('unit tests and set-up are not UI tests; tags from the list JSON get their at sign back', () => {
    expect(tagRuleBreaks(one([], 'unit'), ui)).toEqual([]);
    const list = { suites: [{ title: 'a.spec.ts', specs: [{ title: 't', file: 'a.spec.ts', tags: ['regression'], tests: [{ projectName: 'login' }] }] }] };
    expect(taggedTests(list)[0].tags).toEqual(['@regression']);
  });
});

test.describe('no test name holds a suite tag', () => {
  const list = (describe: string, title: string, file = 'a.spec.ts') => ({
    suites: [{ title: file, specs: [], suites: [{ title: describe, specs: [{ title, file, tags: ['regression'], tests: [{ projectName: 'unit' }] }] }] }],
  });

  test('a tag in a describe title is found, in any project', () => {
    expect(namesHoldingASuiteTag(taggedTests(list('Checks for @p0', 'one')))).toEqual(['a.spec.ts › Checks for @p0 › one']);
  });

  test('a tag in the test title or the file path is found; plain words are not', () => {
    expect(namesHoldingASuiteTag(taggedTests(list('d', 'keeps @sanity')))).toHaveLength(1);
    expect(namesHoldingASuiteTag(taggedTests(list('d', 'one', 'suites/@regression.spec.ts')))).toHaveLength(1);
    expect(namesHoldingASuiteTag(taggedTests(list('sanity and p0', 'regression')))).toEqual([]);
  });
});
