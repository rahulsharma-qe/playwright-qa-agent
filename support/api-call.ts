import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BOT_CHECK_MESSAGE, isBotCheck, mightBeBotCheck } from './bot-check';

/** The options Playwright's request.get and request.post take that the framework uses. */
type CallOptions = { data?: unknown; headers?: Record<string, string>; timeout?: number };

/**
 * Every call the framework makes to the application outside a page (the environment check, registration, the API
 * session) goes through here, so each failure has one meaning: a connection that drops or never answers stops with
 * the caller's environment message (`noAnswer`, given the first line of the error), and a bot-check page stops with
 * the bot-check message. Never a raw error. The caller judges the status of any other answer.
 */
export async function callApi(
  request: APIRequestContext,
  method: 'get' | 'post',
  url: string,
  options: CallOptions,
  noAnswer: (reason: string) => string,
): Promise<APIResponse> {
  let response: APIResponse;
  try {
    response = await request[method](url, options);
  } catch (error) {
    throw new Error(noAnswer((error as Error).message.split('\n')[0]));
  }
  const status = response.status();
  const body = mightBeBotCheck(status) ? await response.text().catch(() => '') : '';
  if (isBotCheck({ status, headers: response.headers(), body })) throw new Error(BOT_CHECK_MESSAGE);
  return response;
}
