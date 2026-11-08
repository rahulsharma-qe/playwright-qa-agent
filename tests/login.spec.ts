import { expect, test } from '../fixtures';
import { registerTestCustomer, type TestAccount } from '../support/test-accounts';

// These tests start logged out: logging in is what they test.
// They run one after another in one worker, so one account serves the whole file.
// A failed test does not skip the others; the next worker registers one more account.
test.describe.configure({ mode: 'default' });

const LOGIN_ERROR = 'Invalid email or password';
let account: TestAccount;

test.beforeAll(async ({ playwright }) => {
  const request = await playwright.request.newContext();
  account = await registerTestCustomer(request, 'login');
  await request.dispose();
});

test.beforeEach(async ({ loginPage }) => {
  await loginPage.open();
});

test('login works', { tag: '@sanity' }, async ({ loginPage, header }) => {
  await loginPage.login(account.email, account.password);

  await expect(header.accountMenu).toBeVisible();
  await expect(header.signInLink).toBeHidden();
});

test('login with an unknown email shows an error', { tag: '@regression' }, async ({ loginPage, header }) => {
  await loginPage.login(`unknown-${Date.now()}@example.com`, 'any-password-1');

  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR);
  await expect(header.signInLink).toBeVisible();
});

// The wrong password only ever hits this run's own account.
test('login with a wrong password shows the same error as an unknown email', { tag: '@regression' }, async ({
  loginPage,
  header,
}) => {
  await loginPage.login(account.email, `Wrong-${Date.now()}!`);
  // Same message as an unknown email: it must not tell an attacker which emails exist.
  await expect(loginPage.errorMessage).toHaveText(LOGIN_ERROR);

  // The right password still works, which proves the email really exists (and resets the failed-login count).
  await loginPage.login(account.email, account.password);
  await expect(header.accountMenu).toBeVisible();
});
