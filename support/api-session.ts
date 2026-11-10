import type { APIRequestContext, APIResponse, Page } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { BOT_CHECK_MESSAGE, isBotCheck, mightBeBotCheck } from './bot-check';
import { cannotLogInThroughApi } from './environment-messages';
import { SESSION_TOKEN_FILE, settings } from './settings';
import type { TestAccount } from './test-accounts';

/**
 * Where each Toolshop version's site keeps the login token, from its token-storage service in Toolshop's source at
 * the pinned commit. Same key, different storage: Sprint 5 uses localStorage, the "with bugs" version sessionStorage.
 * A difference between the copies, not a planted bug.
 */
export const TOKEN_STORE: Record<string, { storage: 'localStorage' | 'sessionStorage'; key: string }> = {
  sprint5: { storage: 'localStorage', key: 'auth-token' },
  'sprint5-with-bugs': { storage: 'sessionStorage', key: 'auth-token' },
};

export function tokenStoreFor(sprint: string) {
  const store = TOKEN_STORE[sprint];
  if (!store) throw new Error(`No token store for SPRINT=${sprint}; add it to TOKEN_STORE in support/api-session.ts.`);
  return store;
}

/** Logs the account in through the API and returns its token. A refusal is an environment problem. */
export async function logInThroughApi(request: APIRequestContext, account: TestAccount): Promise<string> {
  let response: APIResponse;
  try {
    response = await request.post(`${settings.apiUrl}/users/login`, { data: account, timeout: 15_000 });
  } catch (error) {
    throw new Error(cannotLogInThroughApi((error as Error).message.split('\n')[0]));
  }
  const status = response.status();
  const body = mightBeBotCheck(status) ? await response.text().catch(() => '') : '';
  if (isBotCheck({ status, headers: response.headers(), body })) throw new Error(BOT_CHECK_MESSAGE);
  if (status !== 200) throw new Error(cannotLogInThroughApi(`HTTP ${status}`));
  const token = ((await response.json().catch(() => ({}))) as { access_token?: string }).access_token;
  if (!token) throw new Error(cannotLogInThroughApi('no token in the reply'));
  return token;
}

/** Puts the token where the site keeps it, before the site's own scripts run on every page of this tab. */
export async function giveTokenToPage(page: Page, token: string, sprint = settings.sprint): Promise<void> {
  const { storage, key } = tokenStoreFor(sprint);
  await page.addInitScript(
    ({ storage, key, token }) => window[storage as 'localStorage' | 'sessionStorage'].setItem(key, token),
    { storage, key, token },
  );
}

/** A saved session keeps cookies and localStorage but not sessionStorage, so the token is also saved on its own. */
export function saveSessionToken(token: string): void {
  writeFileSync(SESSION_TOKEN_FILE, JSON.stringify({ token }));
}

export function readSessionToken(): string | undefined {
  if (!existsSync(SESSION_TOKEN_FILE)) return undefined;
  return (JSON.parse(readFileSync(SESSION_TOKEN_FILE, 'utf8')) as { token?: string }).token;
}
