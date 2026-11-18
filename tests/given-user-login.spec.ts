import { expect, test } from '../fixtures';
import { settings } from '../support/settings';
import { registerTestCustomer } from '../support/test-accounts';
import { canRegister, givenUserFrom } from '../support/test-user';

// A working example of the given test user (support/test-user.ts), on Toolshop, which otherwise registers its own:
// an account registered now is passed in the way APP_USER_EMAIL and APP_USER_PASSWORD would pass a real one, and the
// test logs in with it through the page. Starts logged out, like the other login tests.
test('a given test user logs in', { tag: '@regression' }, async ({ playwright, loginPage, header }) => {
  // Something the application cannot do, not a flaky test: the example needs an account registered now.
  test.skip(!canRegister(settings.app), 'No registration: this example needs an account registered now.');
  const request = await playwright.request.newContext();
  const registered = await registerTestCustomer(request, 'given');
  await request.dispose();
  const given = givenUserFrom({ APP_USER_EMAIL: registered.email, APP_USER_PASSWORD: registered.password });

  await loginPage.open();
  await loginPage.login(given.email, given.password);

  await expect(header.accountMenu).toBeVisible();
  await expect(header.signInLink).toBeHidden();
});
