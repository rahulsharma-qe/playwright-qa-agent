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

**Next**
- Search and cart tests; `@sanity` and `@regression` tags
- Allure report; GitHub Actions on every pull request; report on GitHub Pages
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
```

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
