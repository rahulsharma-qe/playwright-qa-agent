import type { APIRequestContext, APIResponse, Page } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { BOT_CHECK_MESSAGE, isBotCheck, mightBeBotCheck } from './bot-check';
import { cannotLogInThroughApi } from './environment-messages';
import { SESSION_TOKEN_FILE, settings } from './settings';
import { registerTestCustomer, type TestAccount } from './test-accounts';

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

/** What the API login gives back: the token, and its lifetime in seconds if the reply says. */
export type ApiLogin = { token: string; expiresInSeconds?: number };

/** Logs the account in through the API. A refusal is an environment problem. */
export async function logInThroughApi(request: APIRequestContext, account: TestAccount): Promise<ApiLogin> {
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
  const reply = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: unknown };
  if (!reply.access_token) throw new Error(cannotLogInThroughApi('no token in the reply'));
  const expiresInSeconds = typeof reply.expires_in === 'number' && reply.expires_in > 0 ? reply.expires_in : undefined;
  return { token: reply.access_token, expiresInSeconds };
}

/**
 * How long a Toolshop login lasts when the login reply does not say: measured on the normal Sprint 5 site by the QA
 * engineer, 13-11-2026 (docs/lld.md). Used only as a fallback.
 */
export const MEASURED_LOGIN_LIFETIME_SECONDS = 5 * 60;

/** A session: the token, when it was made, when it expires, and whose login it is (the run's or a test's own). */
export type SavedSession = {
  token: string;
  loggedInAt: number;
  expiresAt: number;
  expirySource: 'the login reply' | 'the measured lifetime';
  whose?: 'the run' | 'this test\'s own customer';
};

export function describeSession(login: ApiLogin, loggedInAt: number, whose: SavedSession['whose'] = 'the run'): SavedSession {
  const fromReply = login.expiresInSeconds !== undefined;
  const seconds = login.expiresInSeconds ?? MEASURED_LOGIN_LIFETIME_SECONDS;
  return {
    token: login.token,
    loggedInAt,
    expiresAt: loggedInAt + seconds * 1000,
    expirySource: fromReply ? 'the login reply' : 'the measured lifetime',
    whose,
  };
}

/**
 * The session each page was last given, so the "login expired" check after a failed test judges the session the page
 * really used: the run's, or an order test's own customer's (made later, so it expires later).
 */
const sessionsGivenToPages = new WeakMap<Page, SavedSession>();

export function rememberSessionGivenTo(page: Page, session: SavedSession): void {
  sessionsGivenToPages.set(page, session);
}

export function sessionGivenTo(page: Page): SavedSession | undefined {
  return sessionsGivenToPages.get(page);
}

export function sessionHasExpired(session: SavedSession, now: number): boolean {
  return now >= session.expiresAt;
}

/**
 * Gives this page a session of its own customer, registered and logged in through the API now. For tests that place
 * an order: two workers ordering on one account at the same moment got the same invoice number (observed note 17),
 * so orders never share an account. The password goes to the run's account files like every other, so the report's
 * redact and check steps cover it.
 */
export async function useOwnCustomer(page: Page, request: APIRequestContext, purpose: string): Promise<void> {
  const account = await registerTestCustomer(request, purpose);
  const loggedInAt = Date.now();
  const login = await logInThroughApi(request, account);
  await checkSessionThroughApi(request, login.token);
  await giveTokenToPage(page, login.token); // added after the run's session, so this token is the one the site reads
  rememberSessionGivenTo(page, describeSession(login, loggedInAt, "this test's own customer"));
}

/** The one message for a session the API or the site did not accept, with the most likely cause. */
export function sessionNotAccepted(sprint = settings.sprint): string {
  return `The session made through the API was not accepted by the site (SPRINT=${sprint}; check where this copy keeps the token)`;
}

/** The API must accept the token: GET /users/me answers 200. Same check on every copy. */
export async function checkSessionThroughApi(request: APIRequestContext, token: string): Promise<void> {
  const response = await request.get(`${settings.apiUrl}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15_000,
  });
  const status = response.status();
  const body = mightBeBotCheck(status) ? await response.text().catch(() => '') : '';
  if (isBotCheck({ status, headers: response.headers(), body })) throw new Error(BOT_CHECK_MESSAGE);
  if (status !== 200) throw new Error(`${sessionNotAccepted()} (GET /users/me answered HTTP ${status})`);
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
export function saveSession(session: SavedSession): void {
  writeFileSync(SESSION_TOKEN_FILE, JSON.stringify(session));
}

export function readSavedSession(): SavedSession | undefined {
  if (!existsSync(SESSION_TOKEN_FILE)) return undefined;
  return JSON.parse(readFileSync(SESSION_TOKEN_FILE, 'utf8')) as SavedSession;
}
