/** Toolshop Sprint 5 site and API; both can be changed with environment variables. No account values: each run makes its own. */
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/** Where the logged-in session is saved; written fresh on every run, git-ignored. */
export const SESSION_FILE = 'playwright/.auth/user.json';

/** One file per account a run registers; git-ignored, read only by the secret scan, never attached to the report. */
export const RUN_ACCOUNTS_DIR = 'playwright/.auth/run-accounts';

export const settings = {
  baseUrl: process.env.BASE_URL || 'https://practicesoftwaretesting.com',
  apiUrl: process.env.API_URL || 'https://api.practicesoftwaretesting.com',
};
