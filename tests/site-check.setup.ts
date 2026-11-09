import type { APIRequestContext, APIResponse } from '@playwright/test';
import { test as setup } from '../fixtures';
import { BOT_CHECK_MESSAGE, isBotCheck, mightBeBotCheck } from '../support/bot-check';
import { settings } from '../support/settings';

const TIMEOUT_MS = 15_000;

/**
 * Runs before everything else. If the site or its API does not answer, or answers with a bot-check page, the run
 * stops here with a message that says it is the environment, not a test, that failed.
 */
async function checkResponds(
  request: APIRequestContext,
  what: 'site' | 'API',
  url: string,
): Promise<void> {
  const notResponding = `Toolshop ${what} is not responding at ${url}; this is an environment problem, not a test failure.`;
  let response: APIResponse;
  try {
    response = await request.get(url, { timeout: TIMEOUT_MS });
  } catch (error) {
    throw new Error(`${notResponding} (${(error as Error).message.split('\n')[0]})`);
  }
  const status = response.status();
  const body = mightBeBotCheck(status) ? await response.text().catch(() => '') : '';
  if (isBotCheck({ status, headers: response.headers(), body })) throw new Error(BOT_CHECK_MESSAGE);
  if (status >= 400) throw new Error(`${notResponding} (HTTP ${status})`);
}

setup('Toolshop site and API are up', async ({ request }) => {
  await checkResponds(request, 'site', settings.baseUrl);
  await checkResponds(request, 'API', `${settings.apiUrl}/brands`);
});
