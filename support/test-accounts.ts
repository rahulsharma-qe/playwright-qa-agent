import type { APIRequestContext, APIResponse } from '@playwright/test';
import { randomBytes, randomInt } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOT_CHECK_MESSAGE, isBotCheck, mightBeBotCheck } from './bot-check';
import { cannotRegister } from './environment-messages';
import { RUN_ACCOUNTS_DIR, settings } from './settings';

export type TestAccount = { email: string; password: string };

/**
 * Registers a new Toolshop customer through the API, for this run only.
 * Nobody else knows the account, so it cannot be locked by other visitors, and a site reset cannot remove it
 * before the run needs it. The email uses a reserved domain, so no real inbox gets anything.
 */
export async function registerTestCustomer(request: APIRequestContext, purpose: string): Promise<TestAccount> {
  const runId = process.env.GITHUB_RUN_ID || 'local';
  const unique = `${Date.now()}-${randomBytes(3).toString('hex')}`;
  const account = { email: `pqa-${runId}-${purpose}-${unique}@example.com`, password: generatePassword() };

  hideInCiLogs(account.password);
  saveForSecretScan(`${purpose}-${unique}`, account);

  const environmentError = (reason: string) => new Error(cannotRegister(reason));
  let response: APIResponse;
  try {
    response = await request.post(`${settings.apiUrl}/users/register`, {
      data: { first_name: 'QA', last_name: 'Run', ...account },
      timeout: 15_000,
    });
  } catch (error) {
    throw environmentError((error as Error).message.split('\n')[0]);
  }
  const status = response.status();
  const body = mightBeBotCheck(status) ? await response.text().catch(() => '') : '';
  if (isBotCheck({ status, headers: response.headers(), body })) throw new Error(BOT_CHECK_MESSAGE);
  if (status !== 201) throw environmentError(`HTTP ${status}`);
  return account;
}

/** Toolshop asks for 8+ characters with upper and lower case, a number and a symbol. */
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
