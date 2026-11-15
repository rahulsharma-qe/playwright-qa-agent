/**
 * Toolshop's site, API and version (Sprint 5 by default); all can be changed with environment variables.
 * No account values: each run makes its own.
 */
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/** Where the logged-in session is saved; written fresh on every run, git-ignored. */
export const SESSION_FILE = 'playwright/.auth/user.json';

/** The login token of this run's session account, with its login time and expiry, for pages that keep the token where a saved session cannot (git-ignored). */
export const SESSION_TOKEN_FILE = 'playwright/.auth/session-token.json';

/** One file per account a run registers; git-ignored, read only by the secret scan, never attached to the report. */
export const RUN_ACCOUNTS_DIR = 'playwright/.auth/run-accounts';

export const settings = {
  baseUrl: process.env.BASE_URL || 'https://practicesoftwaretesting.com',
  apiUrl: process.env.API_URL || 'https://api.practicesoftwaretesting.com',
  /** Which Toolshop version is under test (the same SPRINT the CI scripts use). */
  sprint: process.env.SPRINT || 'sprint5',
};

/**
 * The local copy (CI's own, and ci/start-toolshop.sh) runs Angular's development server (ng serve), which was seen
 * to rebuild the billing address form after a test had filled it (observed note 15). Only there may a test fill the
 * form again; on any other site a reset fails the test, because it could be a real bug.
 */
export const refillResetAddressForm = ['localhost', '127.0.0.1'].includes(new URL(settings.baseUrl).hostname);
