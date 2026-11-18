// The folders a run writes and the next run must start without. Written once here: the settings, the clean-up
// script and the secret scan all read them from this file. Plain TypeScript with no imports, so Node runs it directly.

/** One file per account a run registers; git-ignored, read only by the secret scan, never attached to the report. */
export const RUN_ACCOUNTS_DIR = 'playwright/.auth/run-accounts';

/** Where the Allure reporter writes a run's results. */
export const ALLURE_RESULTS_DIR = 'allure-results';

/** Where CI asks Playwright's JSON reporter to write (RESULTS_JSON); scanned like the Allure results, then uploaded. */
export const PLAYWRIGHT_JSON_DIR = 'playwright-json';
