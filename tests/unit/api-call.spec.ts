import type { APIRequestContext, APIResponse } from '@playwright/test';
import { expect, test } from '../../fixtures';
import { callApi } from '../../support/api-call';
import { BOT_CHECK_MESSAGE } from '../../support/bot-check';
import { cannotRegister, isEnvironmentMessage } from '../../support/environment-messages';

// A stand-in for Playwright's request object: no browser and no Toolshop needed.
function requestThat(answer: () => Promise<Partial<APIResponse>>): APIRequestContext {
  return { get: answer, post: answer } as unknown as APIRequestContext;
}
const reply = (status: number, body = '', headers: Record<string, string> = {}) => async () =>
  ({ status: () => status, headers: () => headers, text: async () => body });

test.describe('the API helper', () => {
  test('a dropped connection gives the caller\'s environment message, not a raw error', async () => {
    const dropped = requestThat(async () => {
      throw new Error('apiRequestContext.post: socket hang up\nCall log: …');
    });
    const call = callApi(dropped, 'post', 'http://localhost:8091/users/register', {}, cannotRegister);
    await expect(call).rejects.toThrow('Could not register a test customer on Toolshop (apiRequestContext.post: socket hang up)');
    await call.catch((error: Error) => expect(isEnvironmentMessage(error.message)).toBe(true));
  });

  test('a bot-check page gives the bot-check message', async () => {
    const blocked = requestThat(reply(403, '<h2>Performing security verification</h2>'));
    await expect(callApi(blocked, 'get', 'https://api.example.test/brands', {}, cannotRegister)).rejects.toThrow(BOT_CHECK_MESSAGE);
  });

  test('any other answer goes back to the caller to judge', async () => {
    const response = await callApi(requestThat(reply(422)), 'post', 'http://localhost:8091/users/register', {}, cannotRegister);
    expect(response.status()).toBe(422);
  });
});
