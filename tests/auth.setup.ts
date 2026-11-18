import { expect, test as setup } from '../fixtures';
import {
  checkSessionThroughApi,
  describeSession,
  giveTokenToPage,
  logInThroughApi,
  saveSession,
  sessionNotAccepted,
} from '../support/api-session';
import { SESSION_FILE, settings } from '../support/settings';
import { runUser } from '../support/test-user';

// Makes the logged-in session for the search and cart tests through the API, and checks it the same way on every
// Toolshop copy: the API accepts the token (GET /users/me), and the site, once its header has rendered, no longer
// offers "Sign in". The UI login is tested by the login tests (login.spec.ts), which log in through the page.
// Never touches the cart.
setup('log in through the API and save the session', async ({ page, request, productListPage, header }) => {
  const account = await runUser(settings.app, request, 'session'); // registered now, or the given user
  const loggedInAt = Date.now();
  const login = await logInThroughApi(request, account);
  const token = login.token;
  await checkSessionThroughApi(request, token);

  await giveTokenToPage(page, token);
  await productListPage.open();
  await expect(header.homeLink).toBeVisible();
  await expect(header.signInLink, sessionNotAccepted()).toBeHidden();

  // With the login time and expiry, so a later "Sign in" can be told apart from an expired login (fixtures.ts).
  saveSession(describeSession(login, loggedInAt));
  await page.context().storageState({ path: SESSION_FILE });
});
