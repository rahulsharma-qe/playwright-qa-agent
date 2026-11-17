/**
 * The application under test and its environment: APP_UNDER_TEST (default toolshop) and TEST_ENV (default local,
 * the pinned copy started with ci/start-toolshop.sh, which CI tests); BASE_URL and API_URL, when set, win over the
 * environment's addresses. npm run test:public-site is TEST_ENV=public-site. No account values: each run makes its own.
 */
import dotenv from 'dotenv';
import { selectRun } from './apps/index.ts';

dotenv.config({ quiet: true });

/** Where the logged-in session is saved; written fresh on every run, git-ignored. */
export const SESSION_FILE = 'playwright/.auth/user.json';

/** The login token of this run's session account, with its login time and expiry, for pages that keep the token where a saved session cannot (git-ignored). */
export const SESSION_TOKEN_FILE = 'playwright/.auth/session-token.json';

export { RUN_ACCOUNTS_DIR } from './run-output-paths.ts';

const run = selectRun(process.env);

export const settings = {
  app: run.app,
  /** TEST_ENV: local (default), public-site or with-bugs. */
  environmentName: run.environmentName,
  /** The copy under test: its page-address prefix, token store and sign-up fields (support/apps/). */
  environment: run.environment,
  baseUrl: run.baseUrl,
  apiUrl: run.apiUrl,
  /** The application's name for this copy; for Toolshop the SPRINT the start script and image pins use. */
  sprint: run.environment.version,
};

/**
 * The local copy (CI's own, and ci/start-toolshop.sh) runs Angular's development server (ng serve), which was seen
 * to rebuild the billing address form after a test had filled it (observed note 15). Only there may a test fill the
 * form again; on any other site a reset fails the test, because it could be a real bug.
 */
export const refillResetAddressForm = ['localhost', '127.0.0.1'].includes(new URL(settings.baseUrl).hostname);
