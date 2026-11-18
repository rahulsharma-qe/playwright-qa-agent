import { expect, test } from '../../fixtures';
import { compareReport, fromAllure, fromPlaywright } from '../../support/compare-runs.ts';

// Made-up runs; no browser and no application needed.
const SECRET_LOOKING = 'Unique-Value-7f3a9c'; // put in every made-up error and step; must never be printed

const playwright = (status: string, step: string) => ({
  suites: [{ title: 'search.spec.ts', specs: [{ title: 'search finds the product', file: 'search.spec.ts', tests: [
    { projectName: 'logged-in', status, results: [{ steps: [{ title: 'open' }, { title: step, error: { message: SECRET_LOOKING } }] }] },
  ] }] }],
});
const allure = (status: string, step: string) => ({
  byId: { a1: { id: 'a1', name: 'login works', status, steps: [{ name: step, status: 'failed', message: SECRET_LOOKING }] } },
});

test.describe('comparing two runs without reading them', () => {
  test('Playwright JSON: a changed status gives the field "status", not the value', () => {
    const { lines } = compareReport(fromPlaywright(playwright('unexpected', 'fill in')), fromPlaywright(playwright('expected', 'fill in')));
    expect(lines).toEqual(['1 of 1 tests differ (the field, never its value):', '  [logged-in] search.spec.ts › search finds the product: status']);
  });

  test('Allure report data: a changed status gives the field "status", not the value', () => {
    const { lines } = compareReport(fromAllure(allure('failed', 'fill in')), fromAllure(allure('passed', 'fill in')));
    expect(lines).toEqual(['1 of 1 tests differ (the field, never its value):', '  login works: status']);
  });

  test('the rename map: identical with the entry, different without it', () => {
    const [older, newer] = [fromAllure(allure('failed', 'Search for "Pliers"')), fromAllure(allure('failed', 'Search for a product'))];
    expect(compareReport(older, newer).lines).toEqual(['identical (1 tests compared)']);
    expect(compareReport(older, newer, false, []).lines).toContain('  login works: first failing step');
  });

  test('a unique value in the runs never appears in the output', () => {
    const outputs = [
      compareReport(fromPlaywright(playwright('unexpected', SECRET_LOOKING)), fromPlaywright(playwright('expected', 'other'))),
      compareReport(fromAllure(allure('failed', SECRET_LOOKING)), fromAllure(allure('passed', 'other'))),
    ].flatMap(({ lines }) => lines);
    expect(outputs.join('\n')).not.toContain(SECRET_LOOKING);
    expect(outputs.join('\n')).not.toContain('other');
  });

  test('steps missing from a run: outcome only, and it says so', () => {
    const noSteps = { byId: { a1: { id: 'a1', name: 'login works', status: 'failed' } } };
    expect(compareReport(fromAllure(noSteps), fromAllure(noSteps)).lines[0]).toBe('outcome only compared; first failing step not compared');
  });
});
