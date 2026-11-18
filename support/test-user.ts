import type { APIRequestContext } from '@playwright/test';
import type { AppProfile } from './apps/app-profile.ts';
import { givenUserNotSet } from './environment-messages';
import { hideInCiLogs, registerTestCustomer, type TestAccount } from './test-accounts';

/** The two settings a given user is read from. Only these names are in the repository, never the values. */
export const GIVEN_USER_SETTINGS = { email: 'APP_USER_EMAIL', password: 'APP_USER_PASSWORD' } as const;

/** The given user from the environment (in CI, from GitHub secrets). Its password is hidden in CI logs. */
export function givenUserFrom(env: Record<string, string | undefined>): TestAccount {
  const email = env[GIVEN_USER_SETTINGS.email];
  const password = env[GIVEN_USER_SETTINGS.password];
  if (!email || !password) throw new Error(givenUserNotSet());
  hideInCiLogs(password);
  return { email, password };
}

/** Whether tests that must not share the run's user (the wrong password, orders) can register their own. */
export function canRegister(app: AppProfile): boolean {
  return app.testUser.mode === 'register' || app.testUser.canRegister;
}

/** The run's user: registered now, or the given one. */
export async function runUser(app: AppProfile, request: APIRequestContext, purpose: string): Promise<TestAccount> {
  return app.testUser.mode === 'given' ? givenUserFrom(process.env) : registerTestCustomer(request, purpose);
}
