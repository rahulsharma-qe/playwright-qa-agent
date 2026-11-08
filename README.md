# playwright-qa-agent

A Playwright + TypeScript test framework for QA teams. Next: an AI assistant drafts tests, a person approves them.

Tests run against **Toolshop** (practicesoftwaretesting.com), the Sprint 5 version: a public demo shop shared
by everyone. It can be slow, change, or go down.

## Built / Next / Later

**Built**
- Playwright config with four projects: a site check, a login setup, the logged-in tests and the logged-out login tests
- Node version in `.nvmrc`; site and API addresses from `.env` (both have defaults)
- Site check: stops the run with "Toolshop site (or API) is not responding … an environment problem, not a test failure"
- Each run registers its own Toolshop customers through the API (no shared account, no account secrets), then
  logs in once through the UI and saves the session for the logged-in tests
- Page objects (`pages/`) given to tests through `fixtures.ts`
- Login tests: login works · unknown email shows an error · wrong password shows the same error (on this run's own account)
- Search finds the product · add to cart makes the cart count go up; search terms and product names in `test-data/`
- Allure report (Allure 3, runs on Node, no Java): steps, retries; a screenshot and a trace on
  failed logged-in tests only, because they record what was typed, and the login tests type login details;
  a failed login test keeps a text snapshot of the page instead;
  a secret scan replaces this run's test-account values in the results, and stops the report if a password is left
  anywhere except the CI log-mask line. It cannot look inside compressed files (traces, screenshots); those come
  only from logged-in tests, where no password is typed or printed
- Tags: `@sanity` (login works, search) and `@regression` (the rest); `npm run test:sanity` for a quick check after a deploy or a fix

**Next**
- GitHub Actions on every pull request; report on GitHub Pages
- AI agents explore the site, write a test plan and draft tests with our page objects; a person approves each step in a pull request

**Later**
- A full agent: reads a requirement, plans tests, drafts them, heals broken locators; every change comes as a pull request a person approves
- Accessibility checks · several environments · visual regression · UI error states by mocking API replies
- Running the suite on the "with bugs" copy of Toolshop · Allure history and trends · GitLab CI (explained by mapping from Actions)

## Run it

```bash
nvm use                      # Node version from .nvmrc
npm ci
npx playwright install chromium
cp .env.example .env         # optional: only to test another Toolshop copy
npm test
npm run test:sanity         # only @sanity tests (setup still runs)
npm run report              # build the Allure report and open it
```

A trace attached to a failed test opens with `npx playwright show-trace <file>` or at trace.playwright.dev.

## Settings

`BASE_URL` and `API_URL` are the only settings, and both have defaults. There are no account values anywhere:
shared demo accounts get locked by other visitors, and accounts registered by hand are removed when Toolshop
resets its data. So each run registers two customers through Toolshop's API (one for the logged-in tests, one
for the login tests; one more per retry). Their emails use the reserved `example.com` domain; the passwords are
generated for the run and kept only in `playwright/.auth/run-accounts/` (git-ignored), where the secret scan
reads them.

## How we write tests

Page objects come from `fixtures.ts`; a test asks for the ones it needs:

```ts
import { expect, test } from '../fixtures';

test('login works', { tag: '@sanity' }, async ({ loginPage, header }) => {
  await loginPage.login(user, password);          // page object performs an action
  await expect(header.accountMenu).toBeVisible();  // only the test decides what is right
});
```


- No hard waits (`page.waitForTimeout`): Playwright already waits for elements.
- Locators by role or label first; `data-test` when there is no clear role or label. No CSS chains or XPath.
- Page objects describe the page and may return values; only tests call `expect`. Tests never write `new LoginPage(page)`.
- Page objects wrap each action in `test.step('…')`, so the report reads like a test case. Step names never hold
  login details.
- Check what the page shows with web-first assertions (`await expect(locator).toHaveText(…)`), or `expect.poll` for a
  value a page object returns. Never read a value once and compare it: the page may still be updating.
- A test that passes only on retry is **flaky**, not passed.
