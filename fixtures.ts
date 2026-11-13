import { test as base } from '@playwright/test';
import { giveTokenToPage, readSavedSession, sessionHasExpired } from './support/api-session';
import { BOT_CHECK_MESSAGE, isBotCheck, mightBeBotCheck } from './support/bot-check';
import { loginExpired } from './support/environment-messages';
import { AccountPage } from './pages/AccountPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { FilterSidebar } from './pages/FilterSidebar';
import { Header } from './pages/Header';
import { InvoicesPage } from './pages/InvoicesPage';
import { LoginPage } from './pages/LoginPage';
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
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  accountPage: AccountPage;
  invoicesPage: InvoicesPage;
};

export const test = base.extend<PageObjects>({
  // Every page the tests get is watched for a bot-check page. It can appear after login, so the site check alone
  // would miss it; without this, the test would fail later with a confusing timeout.
  page: async ({ page }, use, testInfo) => {
    // Logged-in tests: give the session's token to the site again, because a saved session does not keep
    // sessionStorage (where some Toolshop versions keep it).
    const session = testInfo.project.name === 'logged-in' ? readSavedSession() : undefined;
    if (session) await giveTokenToPage(page, session.token);
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
    // A failed logged-in test that shows "Sign in" is an environment problem only if the login had expired by its
    // own expiry (saved by auth-setup). Any other "Sign in" stays a test failure: it may be a real logout bug.
    if (session && testInfo.status !== testInfo.expectedStatus) {
      const now = Date.now();
      const signInShows = await page.getByRole('link', { name: 'Sign in' }).isVisible().catch(() => false);
      if (signInShows && sessionHasExpired(session, now)) {
        const minutes = (ms: number) => Math.round(ms / 60_000);
        throw new Error(loginExpired(minutes(now - session.loggedInAt), minutes(session.expiresAt - session.loggedInAt), session.expirySource));
      }
    }
  },
  header: async ({ page }, use) => use(new Header(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  productListPage: async ({ page }, use) => use(new ProductListPage(page)),
  filterSidebar: async ({ page }, use) => use(new FilterSidebar(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  invoicesPage: async ({ page }, use) => use(new InvoicesPage(page)),
});

export { expect } from '@playwright/test';
