import type { APIRequestContext, APIResponse } from '@playwright/test';
import { randomBytes, randomInt } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOT_CHECK_MESSAGE, isBotCheck, mightBeBotCheck } from './bot-check';
import { cannotRegister } from './environment-messages';
import { RUN_ACCOUNTS_DIR, settings } from './settings';

export type TestAccount = { email: string; password: string };

/**
 * What each Toolshop version needs at sign-up besides name, email and password, taken from its API contract in
 * Toolshop's source at the pinned commit (never from its planted bugs). Sprint 5 needs nothing more; the "with
 * bugs" version needs address, city and country as separate fields, so it gets made-up values.
 */
export const SIGN_UP_FIELDS: Record<string, Record<string, string>> = {
  sprint5: {},
  'sprint5-with-bugs': { address: '1 Test Street', city: 'Testville', state: 'Test', country: 'NL', postcode: '1000' },
};

/** The shortest email limit among the versions above (the "with bugs" version allows 60 characters). */
export const MAX_EMAIL_LENGTH = 60;

export function signUpFieldsFor(sprint: string): Record<string, string> {
  const fields = SIGN_UP_FIELDS[sprint];
  if (!fields) throw new Error(`No sign-up fields for SPRINT=${sprint}; add them to SIGN_UP_FIELDS in support/test-accounts.ts.`);
  return fields;
}

/** A short, unique email on a reserved domain: pqa-<run id>-<purpose>-<time><random>@example.com. */
export function testEmail(purpose: string, runId = process.env.GITHUB_RUN_ID || 'local'): string {
  const email = `pqa-${runId}-${purpose}-${Date.now().toString(36)}${randomBytes(2).toString('hex')}@example.com`;
  if (email.length > MAX_EMAIL_LENGTH) throw new Error(`Test email is longer than ${MAX_EMAIL_LENGTH} characters: ${email}`);
  return email;
}

/**
 * Registers a new Toolshop customer through the API, for this run only.
 * Nobody else knows the account, so it cannot be locked by other visitors, and a site reset cannot remove it
 * before the run needs it. The email uses a reserved domain, so no real inbox gets anything.
 * A refused sign-up stops the run with an environment message.
 */
export async function registerTestCustomer(request: APIRequestContext, purpose: string): Promise<TestAccount> {
  const extraFields = signUpFieldsFor(settings.sprint);
  const account = { email: testEmail(purpose), password: generatePassword() };

  hideInCiLogs(account.password);
  saveForSecretScan(`${purpose}-${Date.now()}-${randomBytes(3).toString('hex')}`, account);

  let response: APIResponse;
  try {
    response = await request.post(`${settings.apiUrl}/users/register`, {
      data: { first_name: 'QA', last_name: 'Run', ...extraFields, ...account },
      timeout: 15_000,
    });
  } catch (error) {
    throw new Error(cannotRegister((error as Error).message.split('\n')[0]));
  }
  const status = response.status();
  const body = mightBeBotCheck(status) ? await response.text().catch(() => '') : '';
  if (isBotCheck({ status, headers: response.headers(), body })) throw new Error(BOT_CHECK_MESSAGE);
  if (status === 422) {
    // Most often the Toolshop copy and SPRINT do not match (for example the with-bugs copy started, SPRINT unset).
    throw new Error(cannotRegister(`HTTP 422; check that SPRINT (${settings.sprint}) matches the Toolshop copy you started`));
  }
  if (status !== 201) throw new Error(cannotRegister(`HTTP ${status}`));
  return account;
}

/** 24 characters with upper and lower case, a number and a symbol: meets Sprint 5 (8+, all four kinds) and the "with bugs" version (9+). */
function generatePassword(): string {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!#%*+-=?@^_'];
  const pick = (chars: string) => chars[randomInt(chars.length)];
  const characters = groups.map(pick); // one of each group
  while (characters.length < 24) characters.push(pick(groups.join('')));
  for (let i = characters.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }
  return characters.join('');
}

/** Generated passwords are not GitHub secrets, so GitHub would not hide them in logs on its own. */
function hideInCiLogs(value: string): void {
  if (process.env.GITHUB_ACTIONS) console.log(`::add-mask::${value}`);
}

/** Written before registering, so even a half-finished registration is covered by the scan. One file per account. */
function saveForSecretScan(name: string, account: TestAccount): void {
  mkdirSync(RUN_ACCOUNTS_DIR, { recursive: true });
  writeFileSync(join(RUN_ACCOUNTS_DIR, `${name}.json`), JSON.stringify(account));
}
