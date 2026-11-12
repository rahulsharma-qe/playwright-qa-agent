import { defineConfig, devices } from '@playwright/test';
import { SESSION_FILE, settings } from './support/settings';

const inCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: inCI,
  retries: inCI ? 1 : 0, // a test that passes only on retry is flaky, not passed
  workers: inCI ? 2 : undefined, // light load on a shared public site
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
        trace: 'retain-on-failure', // no password is typed here
      },
      dependencies: ['auth-setup'],
    },
    // Plain TypeScript checks of our own helpers: no browser, no Toolshop, no dependencies.
    { name: 'unit', testMatch: /unit\/.*\.spec\.ts/ },
    { name: 'site-check', testMatch: /site-check\.setup\.ts/ },
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], screenshot: 'off' }, // the page shows the typed email
      dependencies: ['site-check'],
    },
    {
      // Starts logged out and does not depend on auth-setup:
      // if login is broken, these tests still run and say so.
      name: 'login',
      testMatch: /login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], screenshot: 'off' }, // the page shows the typed email
      dependencies: ['site-check'],
    },
  ],
});
