import { test as base } from '@playwright/test';
import { giveTokenToPage, readSavedSession, rememberSessionGivenTo, sessionGivenTo, sessionHasExpired } from './support/api-session';
import { BOT_CHECK_MESSAGE, isBotCheck, mightBeBotCheck } from './support/bot-check';
import { loginExpired } from './support/environment-messages';
import { AccountPage } from './pages/AccountPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { FilterSidebar } from './pages/FilterSidebar';
import { Header } from './pages/Header';
import { InvoicesPage } from './pages/InvoicesPage';
import { LoginPage } from './pages/LoginPage';
import { Pagination } from './pages/Pagination';
import { ProductListPage } from './pages/ProductListPage';
import { ProductPage } from './pages/ProductPage';

/**
 * Gives each test the page objects it asks for.
 * Every spec and setup file imports test and expect from here, never from @playwright/test.
 * To add a page object: create it in pages/, then add one line below.
 */
type PageObjects = {
  header: Header;
  loginPage: LoginPage;
  productListPage: ProductListPage;
  filterSidebar: FilterSidebar;
  pagination: Pagination;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  accountPage: AccountPage;
  invoicesPage: InvoicesPage;
};

/** Options a project sets in playwright.config.ts. signedIn: its tests start with the session auth-setup saved. */
export type TestOptions = { signedIn: boolean };

export const test = base.extend<PageObjects & TestOptions>({
  signedIn: [false, { option: true }],
  // Every page the tests get is watched for a bot-check page. It can appear after login, so the site check alone
  // would miss it; without this, the test would fail later with a confusing timeout.
  page: async ({ page, signedIn }, use, testInfo) => {
    // Signed-in projects: give the session's token to the site again, because a saved session does not keep
    // sessionStorage (where some copies keep it).
    const session = signedIn ? readSavedSession() : undefined;
    if (session) {
      await giveTokenToPage(page, session.token);
      rememberSessionGivenTo(page, session);
    }
    let blocked = false;
    page.on('response', async (response) => {
      const headers = response.headers();
      const isPage = response.request().resourceType() === 'document' && response.frame() === page.mainFrame();
      if (!isPage && headers['cf-mitigated'] !== 'challenge') return;
      const body = isPage && mightBeBotCheck(response.status()) ? await response.text().catch(() => '') : '';
      if (isBotCheck({ status: response.status(), headers, body })) {
        blocked = true;
        await page.close({ reason: BOT_CHECK_MESSAGE }).catch(() => {});
      }
    });
    await use(page);
    if (blocked) throw new Error(BOT_CHECK_MESSAGE);
    // A failed logged-in test that shows "Sign in" is an environment problem only if the login the page was last
    // given had expired by its own expiry: the run's (saved by auth-setup) or, for an order test, its own
    // customer's (useOwnCustomer). Any other "Sign in" stays a test failure: it may be a real logout bug.
    const given = sessionGivenTo(page);
    if (given && testInfo.status !== testInfo.expectedStatus) {
      const now = Date.now();
      const signInShows = await page.getByRole('link', { name: 'Sign in' }).isVisible().catch(() => false);
      if (signInShows && sessionHasExpired(given, now)) {
        const minutes = (ms: number) => Math.round(ms / 60_000);
        throw new Error(
          loginExpired(minutes(now - given.loggedInAt), minutes(given.expiresAt - given.loggedInAt), given.expirySource, given.whose),
        );
      }
    }
  },
  header: async ({ page }, use) => use(new Header(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  productListPage: async ({ page }, use) => use(new ProductListPage(page)),
  filterSidebar: async ({ page }, use) => use(new FilterSidebar(page)),
  pagination: async ({ page }, use) => use(new Pagination(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  invoicesPage: async ({ page }, use) => use(new InvoicesPage(page)),
});

export { expect } from '@playwright/test';
