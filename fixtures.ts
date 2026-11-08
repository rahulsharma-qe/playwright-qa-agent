import { test as base } from '@playwright/test';
import { CartPage } from './pages/CartPage';
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
  productPage: ProductPage;
  cartPage: CartPage;
};

export const test = base.extend<PageObjects>({
  header: async ({ page }, use) => use(new Header(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  productListPage: async ({ page }, use) => use(new ProductListPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
});

export { expect } from '@playwright/test';
