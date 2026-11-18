// When a run cannot log in as the given test user: a pull request from a fork gets no GitHub secrets. Used by
// playwright.config.ts (leaves the projects out) and support/check-test-count.ts (does not count them). Imports types
// only, so Node runs it directly.
import type { AppProfile } from './apps/app-profile.ts';

/** The projects that need a user. */
export const NEEDS_A_USER = ['auth-setup', 'logged-in', 'login'];

export function noGivenUserOnFork(app: AppProfile, env: Record<string, string | undefined>): boolean {
  return app.testUser.mode === 'given' && !env.APP_USER_PASSWORD && env.FORK_PR === 'true';
}

export const FORK_MESSAGE = `Pull request from a fork: no secrets, so ${NEEDS_A_USER.join(', ')} are left out.`;
