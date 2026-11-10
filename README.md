# playwright-qa-agent

A Playwright + TypeScript test framework for QA teams. Next: an AI assistant drafts tests, a person approves them.

**Latest test report (main):** https://rahulsharma-qe.github.io/playwright-qa-agent/

Tests run against **Toolshop**, the Sprint 5 version of the practice web shop by
[Testsmith](https://github.com/testsmith-io/practice-software-testing). Local runs use the public site
(practicesoftwaretesting.com); CI runs Toolshop's published images privately inside the runner (see [CI](#ci)).

## Built / Next / Later

**Built**
- Playwright config with four projects: a site check, a login setup, the logged-in tests and the logged-out login tests
- Node version in `.nvmrc`; site and API addresses from `.env` (both have defaults)
- Site check: stops the run with "Toolshop site (or API) is not responding … an environment problem, not a test failure"
- Each run registers its own Toolshop customers through the API (no shared account, no account secrets). The login
  tests log in through the page; the other tests start from a session made through the API and checked on the site
- Page objects (`pages/`) given to tests through `fixtures.ts`
- Login tests: login works · unknown email shows an error · wrong password shows the same error (on this run's own account)
- Search finds the product · add to cart makes the cart count go up; search terms and product names in `test-data/`
- Allure report (Allure 3, runs on Node, no Java): steps, retries; a screenshot and a trace on
  failed logged-in tests only, because they record what was typed, and the login tests type login details;
  a failed login test keeps a text snapshot of the page instead;
  a secret scan replaces this run's test-account values in the results, and stops the report if a password is left
  anywhere except the CI log-mask line and the page snapshot of a failed test (both are replaced). It cannot
  look inside compressed files (traces, screenshots); those come only from logged-in tests, where no password is
  typed or printed
- Bot-check detection: if a site shows a bot check (such as Cloudflare's "Performing security verification")
  instead of Toolshop, in the site check or later in any test, the run stops with one clear message: an
  environment problem, not a test failure. We never try to get past it. Unit tests for the detector run in a
  `unit` project with no browser
- A hand-started planted-bug run on Toolshop's "with bugs" version; failures are matched to planted bugs by a
  person in [docs/bug-hunt.md](docs/bug-hunt.md)
- CI starts its own copy of Toolshop from pinned images, seeds it and waits for it, then runs the tests against it
- GitHub Actions on every pull request and push to main: a pass/fail table on the run page, and the Allure report
  attached to the run (`allure-report`), even when tests fail
- The report from main published on GitHub Pages (link at the top), also when tests fail
- Tags: `@sanity` (login works, search) and `@regression` (the rest); `npm run test:sanity` for a quick check after a deploy or a fix

**Next**
- AI agents explore the site, write a test plan and draft tests with our page objects; a person approves each step in a pull request

**Later**
- A full agent: reads a requirement, plans tests, drafts them, heals broken locators; every change comes as a pull request a person approves
- Accessibility checks · several environments · visual regression · UI error states by mocking API replies
- Allure history and trends · GitLab CI (explained by mapping from Actions)

## Design

[High-level design](docs/architecture.md): goals, components, one run and one CI run step by step, safety,
decisions and limits. [Low-level design](docs/lld.md): projects, page objects, test accounts, reporting and the
secret scan, bot-check detection, CI and the Toolshop copy, settings and versions.

## Run it

```bash
nvm use                      # Node version from .nvmrc (22.18 or later: Node runs one TypeScript script directly)
npm ci
npx playwright install chromium
cp .env.example .env         # optional: only to test another Toolshop copy
npm test
npm run test:sanity         # only @sanity tests (setup still runs)
npm run report              # build the Allure report and open it
```

A trace attached to a failed test opens with `npx playwright show-trace <file>` or at trace.playwright.dev.

## Settings

`BASE_URL`, `API_URL` and `SPRINT` (the Toolshop version) are the only settings, and all have defaults. There
are no account values anywhere: shared demo accounts get locked by other visitors, and accounts registered by
hand are removed when Toolshop resets its data. So each run registers two customers through Toolshop's API (one for the logged-in tests, one
for the login tests; one more per retry). Their emails use the reserved `example.com` domain; the passwords are
generated for the run and kept only in `playwright/.auth/run-accounts/` (git-ignored), where the secret scan
reads them.

## CI

`.github/workflows/ui-tests.yml` runs on every pull request and push to main. Toolshop's public site shows a bot
check to CI machines, and we do not try to get past it, so CI starts its own copy first:

1. `ci/start-toolshop.sh` fetches Toolshop's compose file at a pinned commit, starts the database, API, web server
   and site from Toolshop's published images (pinned by digest in `ci/toolshop-images.sprint5.yml`), seeds the
   database, and waits until the API and the site answer. Toolshop's hourly data reset is not started.
2. `npm test` runs against `http://localhost:4200` (site) and `http://localhost:8091` (API), with 2 workers and 1 retry.
3. The report is built and scanned; `ci/stop-toolshop.sh` removes the containers.

Start the same copy on your machine (needs Docker):

```bash
ci/start-toolshop.sh
BASE_URL=http://localhost:4200 API_URL=http://localhost:8091 npm test
ci/stop-toolshop.sh
```

The copy uses host ports 3306 (database), 8000 and 8091 (API) and 4200 (site); free them first.
Toolshop's web server image is published for arm64 only. A Mac with Apple silicon runs it natively; Docker
Desktop on an Intel Mac or Windows emulates it on its own. On a Linux machine (amd64), turn on arm64 emulation
once: `docker run --privileged --rm tonistiigi/binfmt --install arm64`.

CI needs no secrets, so pull requests from forks run fully. Only a report that passed the secret scan is uploaded
or published. For the report on GitHub Pages, one-time setup: Settings → Pages → Source: "GitHub Actions". Pull
requests do not publish. No AI runs in CI: runs stay repeatable and cost nothing per run.

**Planted-bug run.** The hand-started workflow "Run on the with-bugs copy" runs the same tests on Toolshop's
version with bugs planted on purpose, to see which of them the tests catch ([docs/bug-hunt.md](docs/bug-hunt.md)).
Failed tests are the result there, so that workflow stays green when they fail. The same run on your machine:

```bash
SPRINT=sprint5-with-bugs ci/start-toolshop.sh
SPRINT=sprint5-with-bugs BASE_URL=http://localhost:4200 API_URL=http://localhost:8091 npm test
ci/stop-toolshop.sh
```

To update Toolshop in CI: change `TOOLSHOP_COMMIT` in `ci/toolshop-env.sh` and run `ci/pin-toolshop-images.sh`
(the two are one pair), run the tests locally against the public site, then let CI run on the new copy.

## How strong are the tests?

Toolshop has a second version with bugs planted on purpose, and Testsmith lists them. We run the same tests on it,
by hand, to see which planted bugs they catch.

- Of Toolshop's 94 planted bugs, 29 are on the pages these tests open (login, home and search, product page, cart).
- **Baseline run (09-11-2026): one caught.** The tests find fields by their visible label. On the with-bugs login
  page, the email and password fields have no label, only hint text that disappears when you type, so the tests
  stopped there and reported it. Accessibility rules ask for a real label (Toolshop's bug 87).
- Because every test logs in first, that one bug stopped all of them, so the other bugs on our path were not
  checked in this run. They are not counted as missed. Since then, only the login tests log in through the page;
  the other tests start from a session made through the API, so the next run can reach the rest.

How we count, the list of bugs on our path and every run: [docs/bug-hunt.md](docs/bug-hunt.md).

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

## Honest lines

- Five tests prove the framework, not the coverage of a shop. Small on purpose.
- Toolshop is shared by everyone and can be slow or down; the site check says when the environment, not a test, is the problem.
- Each run leaves two throwaway accounts on Toolshop (one more per retry); there is no API to delete them, and
  the site's resets clear them.
- Lockout after failed logins is not tested yet (Next: on an account made for it).
- CI tests its own copy of Toolshop Sprint 5, not the public site; the public site is tested by local runs. Images
  are pinned, so Toolshop changes reach CI only when the pins are updated. Starting Toolshop adds a few minutes to
  every CI run.
- Toolshop's web server image is published for arm64 only, so CI (amd64) runs it under emulation (QEMU); the
  other images run natively.
- The CI copy is not fully offline: Toolshop checks new passwords against the Have I Been Pwned service, so a slow
  or unreachable service shows as "Could not register a test customer … environment problem".

## Credits

Toolshop is © Testsmith and is used with their permission for this non-commercial project:
[practice-software-testing](https://github.com/testsmith-io/practice-software-testing). Nothing of Toolshop's code
is copied into this repository; CI runs its published images privately and removes them after the run, including
the "with bugs" version, which is run only to measure how many planted bugs the tests catch.
