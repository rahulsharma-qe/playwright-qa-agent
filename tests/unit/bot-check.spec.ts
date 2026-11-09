import { expect, test } from '../../fixtures';
import { isBotCheck, mightBeBotCheck } from '../../support/bot-check';

// Sample responses written for these tests; no browser and no Toolshop needed.
const challengePage = '<html><head><title>Just a moment...</title></head><body><h1>practicesoftwaretesting.com</h1>' +
  '<h2>Performing security verification</h2><p>Performance and Security by Cloudflare</p></body></html>';

test.describe('bot-check detector', () => {
  test('Cloudflare challenge header is a bot check, whatever the status', () => {
    expect(isBotCheck({ status: 200, headers: { 'cf-mitigated': 'challenge' } })).toBe(true);
  });

  test('403 with the challenge page text is a bot check', () => {
    expect(isBotCheck({ status: 403, headers: {}, body: challengePage })).toBe(true);
  });

  test('503 "Just a moment" page is a bot check', () => {
    expect(isBotCheck({ status: 503, headers: {}, body: '<title>Just a moment...</title>' })).toBe(true);
  });

  test('a normal Toolshop page is not a bot check', () => {
    expect(isBotCheck({ status: 200, headers: {}, body: '<app-root></app-root>' })).toBe(false);
  });

  test('a plain 403 without the challenge text is not a bot check', () => {
    expect(isBotCheck({ status: 403, headers: {}, body: 'Forbidden' })).toBe(false);
  });

  test('challenge text on a 200 page is not a bot check (a product could mention it)', () => {
    expect(isBotCheck({ status: 200, headers: {}, body: challengePage })).toBe(false);
  });

  test('only 403 and 503 bodies are read', () => {
    expect([200, 401, 403, 404, 500, 503].filter(mightBeBotCheck)).toEqual([403, 503]);
  });
});
