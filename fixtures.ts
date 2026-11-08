import { test as base } from '@playwright/test';
import { Header } from './pages/Header';
import { LoginPage } from './pages/LoginPage';

/**
 * Gives each test the page objects it asks for.
 * Every spec and setup file imports test and expect from here, never from @playwright/test.
 * To add a page object: create it in pages/, then add one line below.
 */
type PageObjects = {
  header: Header;
  loginPage: LoginPage;
};

export const test = base.extend<PageObjects>({
  header: async ({ page }, use) => use(new Header(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
});

export { expect } from '@playwright/test';
