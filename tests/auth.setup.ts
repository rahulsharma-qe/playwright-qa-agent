import { expect, test as setup } from '../fixtures';
import { checkSessionThroughApi, giveTokenToPage, logInThroughApi, saveSessionToken, sessionNotAccepted } from '../support/api-session';
import { SESSION_FILE } from '../support/settings';
import { registerTestCustomer } from '../support/test-accounts';

// Makes the logged-in session for the search and cart tests through the API, and checks it the same way on every
// Toolshop copy: the API accepts the token (GET /users/me), and the site, once its header has rendered, no longer
// offers "Sign in". The UI login is tested by the login tests (login.spec.ts), which log in through the page.
// Never touches the cart.
setup('log in through the API and save the session', async ({ page, request, productListPage, header }) => {
  const account = await registerTestCustomer(request, 'session');
  const token = await logInThroughApi(request, account);
  await checkSessionThroughApi(request, token);

  await giveTokenToPage(page, token);
  await productListPage.open();
  await expect(header.homeLink).toBeVisible();
  await expect(header.signInLink, sessionNotAccepted()).toBeHidden();

  saveSessionToken(token);
  await page.context().storageState({ path: SESSION_FILE });
});
