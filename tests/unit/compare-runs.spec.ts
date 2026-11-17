import { expect, test } from '../../fixtures';
import { differences, summarise } from '../../support/compare-runs.ts';

// Two made-up results files: no browser and no Toolshop needed.
const run = (status: string, step: string) => ({
  suites: [{ title: 'login.spec.ts', specs: [{ title: 'login works', file: 'login.spec.ts', tests: [
    { projectName: 'login', status, results: [{ status: 'failed', steps: [{ title: 'open' }, { title: step, error: {} }] }] },
  ] }] }],
});

test.describe('comparing two runs without reading them', () => {
  test('the same outcome and first failing step is identical', () => {
    expect(differences(summarise(run('unexpected', 'fill in')), summarise(run('unexpected', 'fill in')))).toEqual([]);
  });

  test('another first failing step is named as a difference, unless only outcomes are compared', () => {
    expect(differences(summarise(run('unexpected', 'fill in')), summarise(run('unexpected', 'submit')))).toEqual([
      '[login] login.spec.ts › login works',
    ]);
    expect(differences(summarise(run('unexpected', 'fill in'), undefined, true), summarise(run('unexpected', 'submit'), undefined, true))).toEqual([]);
  });
});
