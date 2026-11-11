import { expect, test } from '../fixtures';
import { settings } from '../support/settings';

/**
 * Where the AI test agents start (see docs/ai-assisted-tests.md): a signed-in home page, opened through our
 * fixtures and page objects, on the normal Sprint 5 copy only.
 * Tagged @seed: `npm test` leaves it out; CI runs it in its own step so a fixture change cannot break it unnoticed.
 */
const WRONG_COPY = 'Agents must run on the normal Sprint 5 copy; stop it and start with SPRINT=sprint5';

test('seed: signed-in home page on the normal Sprint 5 copy', { tag: '@seed' }, async ({ page, productListPage, header }) => {
  expect(settings.sprint, WRONG_COPY).toBe('sprint5');

  await productListPage.open();
  await expect(header.homeLink).toBeVisible();
  // The with-bugs copy uses hash routing, so its addresses contain "/#/".
  expect(page.url(), WRONG_COPY).not.toContain('/#/');
});
