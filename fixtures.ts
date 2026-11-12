import { test as base } from '@playwright/test';
import { giveTokenToPage, readSessionToken } from './support/api-session';
import { BOT_CHECK_MESSAGE, isBotCheck, mightBeBotCheck } from './support/bot-check';
import { CartPage } from './pages/CartPage';
import { FilterSidebar } from './pages/FilterSidebar';
import { Header } from './pages/Header';
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
};

export const test = base.extend<PageObjects>({
  // Every page the tests get is watched for a bot-check page. It can appear after login, so the site check alone
  // would miss it; without this, the test would fail later with a confusing timeout.
  page: async ({ page }, use, testInfo) => {
    // Logged-in tests: give the session's token to the site again, because a saved session does not keep
    // sessionStorage (where some Toolshop versions keep it).
    if (testInfo.project.name === 'logged-in') {
      const token = readSessionToken();
      if (token) await giveTokenToPage(page, token);
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
  },
  header: async ({ page }, use) => use(new Header(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  productListPage: async ({ page }, use) => use(new ProductListPage(page)),
  filterSidebar: async ({ page }, use) => use(new FilterSidebar(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
});

export { expect } from '@playwright/test';
