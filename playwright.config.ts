import { defineConfig, devices } from '@playwright/test';
import type { TestOptions } from './fixtures';
import { SESSION_FILE, settings } from './support/settings';
import { FORK_MESSAGE, NEEDS_A_USER, noGivenUserOnFork } from './support/fork-runs.ts';
import { canRegister } from './support/test-user';

const inCI = !!process.env.CI;

// A given test user (support/apps/): an application that allows no registration has one account for every test,
// so its tests run one after another, on one worker. A pull request from a fork gets no GitHub secrets, so it cannot
// log in as the given user: the projects that need a user are left out, and the run says so.
const givenUser = settings.app.testUser.mode === 'given';
const oneWorker = givenUser && !canRegister(settings.app);
const onForkWithoutUser = noGivenUserOnFork(settings.app, process.env);
// stderr, so they stay out of any --reporter=json output (CI's test count reads it from stdout).
if (oneWorker) console.error('Given test user and no registration: the tests run on one worker, one after another.');
if (onForkWithoutUser) console.error(FORK_MESSAGE);

export default defineConfig<TestOptions>({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: inCI,
  retries: inCI ? 1 : 0, // a test that passes only on retry is flaky, not passed
  workers: oneWorker ? 1 : inCI ? 2 : undefined, // light load on a shared public site
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results', detail: false }], // detail off: action steps would carry typed values
    // For the planted-bug run: a JSON file the summary script counts from.
    ...(process.env.RESULTS_JSON ? [['json', { outputFile: process.env.RESULTS_JSON }] as const] : []),
    // In CI: a pass/fail table on the GitHub Actions run page (job summary).
    ...(inCI
      ? [['@estruyf/github-actions-reporter', { title: 'Toolshop UI tests', showError: true, errorFormat: 'short' }] as const]
      : []),
  ],
  use: {
    baseURL: settings.baseUrl,
    testIdAttribute: 'data-test', // Toolshop marks elements with data-test
    locale: 'en-US', // texts and role names the tests look for stay in English
    screenshot: 'only-on-failure', // off where a login is typed (below)
    trace: 'off', // traces record typed values and tokens; only logged-in keeps them (below)
  },
  projects: [
    // First on purpose: the AI test agents' tools use the first project when none is named, and the seed
    // (tests/seed.spec.ts) is in this one. The order does not change dependencies or what runs.
    {
      name: 'logged-in',
      testIgnore: [/login\.spec\.ts/, /unit\//],
      use: {
        ...devices['Desktop Chrome'],
        storageState: SESSION_FILE,
        signedIn: true, // fixtures.ts gives these tests the saved session's token
        trace: 'retain-on-failure' as const, // no password is typed here
      },
      dependencies: ['auth-setup'],
    },
    // Plain TypeScript checks of our own helpers: no browser, no Toolshop, no dependencies.
    { name: 'unit', testMatch: /unit\/.*\.spec\.ts/ },
    { name: 'site-check', testMatch: /site-check\.setup\.ts/ },
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], screenshot: 'off' as const }, // the page shows the typed email
      dependencies: ['site-check'],
    },
    {
      // Starts logged out and does not depend on auth-setup:
      // if login is broken, these tests still run and say so.
      name: 'login',
      testMatch: /login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], screenshot: 'off' as const }, // the page shows the typed email
      dependencies: ['site-check'],
    },
  ].filter((project) => !onForkWithoutUser || !NEEDS_A_USER.includes(project.name)),
});
