import type { APIRequestContext } from '@playwright/test';
import { test as setup } from '../fixtures';
import { callApi } from '../support/api-call';
import { noAnswerFrom, siteNotResponding } from '../support/environment-messages';
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
  const response = await callApi(request, 'get', url, { timeout: TIMEOUT_MS }, (reason) => `${noAnswerFrom(what, url)} (${reason})`);
  const status = response.status();
  if (status >= 400) throw new Error(`${siteNotResponding(what, url)} (HTTP ${status})`);
}

setup('Toolshop site and API are up', async ({ request }) => {
  const { sitePath, apiPath } = settings.app.healthChecks;
  await checkResponds(request, 'site', `${settings.baseUrl}${sitePath}`);
  await checkResponds(request, 'API', `${settings.apiUrl}${apiPath}`);
});
