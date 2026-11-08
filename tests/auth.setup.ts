import { expect, test as setup } from '../fixtures';
import { SESSION_FILE } from '../support/settings';
import { registerTestCustomer } from '../support/test-accounts';

// Registers this run's customer through the API (set-up), then logs in through the UI and saves the session
// for the logged-in tests. Never touches the cart.
setup('log in and save the session', async ({ page, request, loginPage, header }) => {
  const account = await registerTestCustomer(request, 'session');

  await loginPage.open();
  await loginPage.login(account.email, account.password);
  await expect(header.accountMenu).toBeVisible();
  await page.context().storageState({ path: SESSION_FILE });
});
