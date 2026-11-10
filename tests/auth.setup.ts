import { expect, test as setup } from '../fixtures';
import { giveTokenToPage, logInThroughApi, saveSessionToken } from '../support/api-session';
import { SESSION_FILE, settings } from '../support/settings';
import { registerTestCustomer } from '../support/test-accounts';

// Makes the logged-in session for the search and cart tests through the API: register, log in, give the token to
// the site, check the site shows the signed-in menu, save the session. The UI login is tested by the login tests
// (login.spec.ts), which still log in through the page. Never touches the cart.
setup('log in through the API and save the session', async ({ page, request, productListPage, header }) => {
  const account = await registerTestCustomer(request, 'session');
  const token = await logInThroughApi(request, account);

  await giveTokenToPage(page, token);
  await productListPage.open();
  await expect(
    header.accountMenu,
    `The session made through the API was not accepted by the site; check that SPRINT (${settings.sprint}) matches the Toolshop copy you started`,
  ).toBeVisible();

  saveSessionToken(token);
  await page.context().storageState({ path: SESSION_FILE });
});
