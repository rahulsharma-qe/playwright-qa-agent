# playwright-qa-agent: low-level design

The high-level design ([architecture.md](architecture.md)) says what the framework is and why. This document says
how each part is built. It covers step 1, as built.

## 1. Repository layout

```
playwright-qa-agent/
  pages/                  page objects: Header, LoginPage, ProductListPage, ProductPage, CartPage
  fixtures.ts             gives the page objects to tests, watches every page for a bot check, re-exports test and expect
  tests/                  setup files, specs, and unit/ for our own helpers
  test-data/              search terms and product names
  support/                settings, test-account registration, bot-check detector, secret scan
  ci/                     start, wait for and stop the CI copy of Toolshop; image pins and the pin script
  docs/                   this design
  playwright.config.ts    projects, reporters, locale, screenshots and traces
  .nvmrc                  the one place the Node version is written
  .env.example            BASE_URL and API_URL (both have defaults); no account values
  .github/workflows/ui-tests.yml
```

## 2. Playwright projects

| Project | Runs | Session | Depends on |
|---|---|---|---|
| `unit` | `tests/unit/*.spec.ts` | none; no browser | none |
| `site-check` | `site-check.setup.ts` | none | none |
| `auth-setup` | `auth.setup.ts` | none; writes `playwright/.auth/user.json` | `site-check` |
| `logged-in` | every spec except `login.spec.ts` and `unit/` (Chromium) | the saved session | `auth-setup` |
| `login` | `login.spec.ts` (Chromium) | empty | `site-check` |

`login` does not depend on `auth-setup` on purpose: if login is broken, the login tests still run and say so,
instead of being skipped. `--grep @sanity` picks tests; their dependency projects still run in full.

## 3. Page objects and fixtures

- `Header` is the shared top bar (sign-in link, account menu, cart count); `LoginPage`, `ProductListPage`,
  `ProductPage` and `CartPage` are the four pages.
- Page objects hold locators and actions and may return values; they never call `expect`. Each action is a
  `test.step` ("Log in", `Search for "Pliers"`, "Add to cart"), so the report reads like a test case; step names
  never hold a login value.
- **Locator order:** role or label first, `data-test` when there is no clear role or label: the password input
  (its label points at a wrapper element), the account menu (it shows the customer's name), counts, error
  messages and cart lines.
- A product card is found by its exact name, scoped to one card; product ids are never used (they change when the
  site resets its data). Toolshop hides the cart badge when the cart is empty, so `cartCount()` returns 0.
- Tests check what the page shows with web-first assertions, or `expect.poll` for a value a page object returns
  (the cart badge updates after an API call); never a value read once and compared.
- `fixtures.ts` gives `header`, `loginPage`, `productListPage`, `productPage` and `cartPage`; tests never write
  `new LoginPage(page)`. Setup files use the same fixtures.

## 4. Test accounts

- **Two per run, through the API** (`registerTestCustomer(request, purpose)` posts to `<API_URL>/users/register`):
  `auth-setup` registers one for the logged-in tests; `login.spec.ts` registers one in `beforeAll` and runs its
  tests one after another in one worker. A failed test does not skip the others; the next worker registers one
  more account, as a retry does.
- **Email** on the reserved `example.com` domain: `pqa-<run id>-<purpose>-<time>-<random>@example.com`.
- **Password:** 24 characters with upper and lower case, a number and a symbol (Toolshop's rules; it also refuses
  passwords known from breaches). Generated for the run and never printed.
- Before registering, the account is written to `playwright/.auth/run-accounts/<purpose>-<time>-<random>.json`
  (git-ignored; one file per account, so parallel set-ups never overwrite each other). In GitHub Actions the
  password is also sent to GitHub's log mask (`::add-mask::`).
- **Login is the test:** registration is set-up through the API; `auth-setup` then logs in through the UI and
  saves the session (cookies and the login token in local storage), written fresh every run.
- **The wrong-password test** sends one wrong password to the run's own account, checks the message is the same
  as for an unknown email ("Invalid email or password", so an attacker cannot tell which emails exist), then logs
  in correctly, which proves the email exists and resets the site's failed-login count.
- Failures name the environment: "Could not register a test customer on Toolshop (<reason>); this is an
  environment problem, not a test failure", or the bot-check message (section 6).

## 5. Reporting

- **Reporters:** `list` in the terminal; `allure-playwright` with `detail: false` (its automatic action steps
  would show typed values); in CI also `@estruyf/github-actions-reporter`, the pass/fail table on the run page.
- **Screenshot** (`only-on-failure`) and **trace** (`retain-on-failure`, which also keeps the failed first try of
  a test that passes on retry) on `logged-in` only. `site-check`, `auth-setup` and `login` have both off: they
  type login details, and the scan cannot read inside these compressed files. A failed login test is explained by
  its message, its steps and Playwright's page snapshot (text).
- **`npm run report:build`** runs, in order:
  1. `secret-scan.mjs redact`: replaces the run's emails and passwords in the text files of `allure-results/`.
     Two places are expected to hold a password and are replaced: the CI log-mask line (Allure keeps a test's
     output) and a textbox line in a failed test's page snapshot (it shows what was typed). A password anywhere
     else stops CI: "A test-account password was found outside the log-mask and page-snapshot lines: <files>.
     Nothing uploaded." Locally it is replaced and a warning is shown.
  2. `allure generate` (Allure 3 on Node).
  3. `secret-scan.mjs check`: reads every file of `allure-results/` and `allure-report/` as raw bytes; a password
     found means exit 1 and no report. In CI, no account file at all also means exit 1.
  Output names files only, never a value.

## 6. Bot-check detection

- A response is a bot check when it has the header `cf-mitigated: challenge`, or when it is a 403 or 503 page with
  "Performing security verification" or "Just a moment". Only 403 and 503 bodies are read.
- It is checked in the site check, in the registration call, and in `fixtures.ts`, which watches the main-frame
  page responses (and any response with the challenge header) on every page it gives out. The block can appear
  after login, so the page is closed with the message at once instead of failing later on a timeout.
- One message everywhere: "Toolshop's public site is blocking this machine with a bot check. This is an
  environment problem, not a test failure; we do not try to get past it. In CI, the run uses its own copy of
  Toolshop."
- Unit tests (project `unit`) cover the detector with sample responses written for them.

## 7. CI and the Toolshop copy

**Workflow** (`.github/workflows/ui-tests.yml`, every pull request and push to main, `contents: read`, no
secrets): Node from `.nvmrc` → `npm ci` → Chromium → QEMU for arm64 → `ci/start-toolshop.sh` (step `start`) →
`npm test` with `BASE_URL=http://localhost:4200`, `API_URL=http://localhost:8091` → on failure, the last Toolshop
logs → if Toolshop started, `npm run report:build` → if that passed, upload the report (and on main, prepare it for
Pages) → always `ci/stop-toolshop.sh`. A second job on main deploys the report to GitHub Pages (`pages: write`,
`id-token: write`, `concurrency: pages`), only when the scan passed.

**`ci/` scripts**

- `toolshop-env.sh` (shared by start and stop): `SPRINT` (default `sprint5`), the pinned Toolshop commit, the clone
  folder, the pins file `toolshop-images.<sprint>.yml`, compose project `toolshop`.
- `start-toolshop.sh`:
  1. Fetches Toolshop's repository at the pinned commit into a folder outside this repository; only its compose
     file is used, nothing is copied in. The folder is deleted only if it is empty or holds the marker file the
     script wrote when it cloned (`.toolshop-source`).
  2. Starts `mariadb`, `laravel-api`, `web` and `angular-ui` from Toolshop's `docker-compose.prod.yml` plus our
     pins file. `cron` is not started: it re-seeds the database every hour.
  3. Seeds with `php artisan migrate:fresh --seed --force`, retried every 5 seconds up to a timeout: compose's
     `depends_on` only orders the start, so the retry is the readiness check for the database and the API code.
  4. `wait-for-toolshop.sh` waits for `<API>/brands` and the site, with separate timeouts (the site compiles when
     it starts). Each phase prints its time.
- `stop-toolshop.sh`: `down -v` with the same compose files, removes the API code volume by name (so a pin update
  never runs old code), and prints how many volumes are left ("unknown" if Docker cannot be reached). Safe when
  nothing is running.
- `toolshop-images.sprint5.yml`: each image pinned by `sha256` digest; the web server image carries
  `platform: linux/arm64` (published for arm64 only).
- `pin-toolshop-images.sh` (curl and Node, no Docker): reads each image's digest and platforms from Docker Hub and
  writes the pins file, adding a `platform:` line only where amd64 is missing (linux/arm64 when published,
  otherwise the first platform with its variant). It writes a temporary file and replaces the pins file only when
  every image is pinned; if Docker Hub cannot be reached it stops and leaves the old file.
- **Updating the pins:** change the commit in `toolshop-env.sh` and run the pin script (they are one pair), run
  the tests locally against the public site, then let CI run on the new copy.
- **First measured CI run (09-11-2026):** containers up 28 s, seeded 37 s, API ready at once, site 5 s; ready after
  42 s; 14 tests in 9.8 s; volumes left after stop: 0. The timeouts (seed 300 s, API 120 s, site 420 s, job
  30 minutes) are first values, tightened after more runs.

## 8. Settings and versions

- **Settings:** `BASE_URL` and `API_URL` only, both with defaults (the public Sprint 5 site and API); read from
  the environment or a git-ignored `.env`.
- **Config:** `testIdAttribute: 'data-test'` (Toolshop's attribute); `locale: 'en-US'` (the site follows the
  browser language, so texts and role names stay in English); retries 1 in CI and 0 locally; 2 workers in CI.
- **Versions:** Node in `.nvmrc` only (no `engines` field); `@playwright/test`, `allure-playwright`, the Allure 3
  CLI (`allure`) and `@estruyf/github-actions-reporter` pinned to exact versions in `package.json`; GitHub Actions
  pinned to major versions; Toolshop's images pinned by digest.
- **Verified from a fresh clone:** `npm ci`, `npx playwright install chromium`, `npm test` against the public
  site; every commit typechecks and its tests pass.
