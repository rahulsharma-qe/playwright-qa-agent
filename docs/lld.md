# playwright-qa-agent: low-level design

The high-level design ([architecture.md](architecture.md)) says what the framework is and why. This document says
how each part is built, as built: step 1 and the merged step 2 flows (category filters, checkout).

## 1. Repository layout

```
playwright-qa-agent/
  pages/                  nine page objects (section 3)
  fixtures.ts             gives the page objects to tests, watches every page for a bot check, gives logged-in pages
                          their session, re-exports test and expect
  tests/                  setup files, the hand-written specs, category-filters/ and checkout/ (AI-drafted, decided by
                          the QA engineer), seed.spec.ts (the AI agents' starting test), unit/ for our own helpers
  test-data/              search terms, product names, category and checkout data
  support/apps/           one profile per application under test (toolshop.ts: its environments local, public-site and
                          with-bugs, with each copy's addresses and differences) and the selection by APP_UNDER_TEST
                          and TEST_ENV
  support/                settings, page addresses, the API helper, environment messages, test accounts and the API
                          session, bot-check detector, secret scan, the run-output paths and clean-up script,
                          planted-bug count and summary, run-page summaries (address refills, cart emptied), the
                          test-count check
  ci/                     start, wait for and stop the local and CI copy of Toolshop; image pins, the pin script and the
                          pair check
  specs/                  the test plans (Markdown), one per flow
  drafts/                 an AI generator's raw draft during a tests pull request; empty again after it
  docs/                   this design, AI-assisted tests, the drafting log, observed notes, the planted-bug results
  AGENTS.md               rules for any AI assistant working here
  .claude/settings.json   the deny list for Claude Code users (the same list as in AGENTS.md)
  playwright.config.ts    projects, reporters, locale, screenshots and traces
  .nvmrc                  the one place the Node version is written
  .env.example            APP_UNDER_TEST, TEST_ENV, BASE_URL and API_URL (all have defaults); no account values
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

`site-check` and `unit` depend on nothing; `auth-setup` depends on `site-check`; `logged-in` on `auth-setup`;
`login` on `site-check` only. `login` does not depend on `auth-setup` on purpose: if login is broken, the login tests still run and say so,
instead of being skipped. `--grep @sanity` picks tests; their dependency projects still run in full.
`logged-in` is the first project on purpose: the AI test agents' tools use the first project when none is named.
`tests/seed.spec.ts` (tag `@seed`) is in `logged-in`: the AI test agents start from it
([ai-assisted-tests.md](ai-assisted-tests.md)). `npm test` leaves it out (`--grep-invert @seed`), so the
planted-bug run never runs it; CI runs it in its own step.

## 3. Page objects and fixtures

- Nine page objects in `pages/`: `Header` (the shared top bar: sign-in link, account menu, cart count),
  `LoginPage`, `ProductListPage`, `ProductPage`, `CartPage`, `CheckoutPage` (sign-in, billing address and payment
  steps, placing an order), `AccountPage`, `InvoicesPage` and `FilterSidebar` (categories, brands, sort, price,
  eco-friendly).
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
- Page objects open pages only through `appUrl()` (`support/app-url.ts`): Sprint 5 uses plain paths, the "with
  bugs" version hash routing (`/#/…`): the environment's `pagePrefix` in `support/apps/toolshop.ts`, from each copy's router config in Toolshop's source.
- `fixtures.ts` gives every page object as a fixture (`header`, `loginPage`, `productListPage`, …); tests never
  write `new LoginPage(page)`. Setup files use the same fixtures.

## 4. Test accounts and session

- **Two per run, plus one per order-placing test, through the API** (`registerTestCustomer(request, purpose)`
  posts to `<API_URL>/users/register`): `auth-setup` registers one for the logged-in tests; `login.spec.ts`
  registers one in `beforeAll` and runs its tests one after another in one worker. A failed test does not skip the
  others; the next worker registers one more account, as a retry does. Each checkout test that places an order
  (4.x) registers its own customer in its set-up (`useOwnCustomer()` in `support/api-session.ts`), because two
  workers ordering on one account at the same moment got the same invoice number (observed note 17).
- **Sign-up fields by copy:** `signUpFields` of each environment in the application profile (`support/apps/toolshop.ts`). Sprint 5 needs
  only name, email and password; the "with bugs" version's contract also asks for address, city and country as
  separate fields, and it gets a date of birth to work around a defect not on the planted list (recorded in
  bug-hunt.md). Made-up values, taken from Toolshop's source at the pinned commit, never from its planted bugs. An unknown environment stops with a message; a refused sign-up stops the run
  with the environment message (no retry with another shape).
- **Email** on the reserved `example.com` domain: `pqa-<run id>-<purpose>-<time><random>@example.com`, at most 60
  characters (the "with bugs" version's limit).
- **Password:** 24 characters with upper and lower case, a number and a symbol (Toolshop's rules; it also refuses
  passwords known from breaches). Generated for the run and never printed.
- Before registering, the account is written to `playwright/.auth/run-accounts/<purpose>-<time>-<random>.json`
  (git-ignored; one file per account, so parallel set-ups never overwrite each other). In GitHub Actions the
  password is also sent to GitHub's log mask (`::add-mask::`).
- **Login is tested once, by the login tests:** they log in through the page. `auth-setup` makes the session for
  the other tests through the API: register, `POST /users/login`, give the token to the site where it keeps it
  (the environment's `tokenStore` in `support/apps/toolshop.ts`: localStorage in Sprint 5, sessionStorage in the "with bugs" version),
  check the session the same way on every copy (the API's `GET /users/me` answers 200; on the home page, once the
  Home link (`nav-home`) has rendered, the "Sign in" link is gone), else stop with "The session made through the API was not
  accepted by the site (TEST_ENV=…; check where this copy keeps the token)". It saves the session (cookies, localStorage) and the token on its own
  (`playwright/.auth/session-token.json`, git-ignored), because a saved session does not keep sessionStorage.
  Toolshop's login lasts 5 minutes (`JWT_TTL`, default 5 minutes, in Toolshop's `sprint5/API/config/jwt.php` at
  the pinned commit; also seen by the QA engineer on the normal site, 13-11-2026), so a run that takes longer than
  that can meet an expired session in its last tests: keep runs short, or log in again per run part.
  The token file also holds the login time and the expiry (from the login reply's `expires_in` when it gives one,
  otherwise the measured 5 minutes). When a logged-in test fails and the page shows "Sign in", `fixtures.ts` adds an
  environment message only if the session that page was given had expired by then (an order test's own customer
  replaces the run's session for this check, and the message names whose login it was); any other "Sign in" stays a
  test failure, since it may be a real logout bug.
  `fixtures.ts` gives the token to every page of a logged-in test. Both are written fresh every run.
- **The wrong-password test** sends one wrong password to the run's own account, checks the message is the same
  as for an unknown email ("Invalid email or password", so an attacker cannot tell which emails exist), then logs
  in correctly, which proves the email exists and resets the site's failed-login count.
- Failures name the environment: "Could not register a test customer on Toolshop (<reason>); this is an
  environment problem, not a test failure", or the bot-check message (section 6).

## 5. Reporting

- **Reporters:** `list` in the terminal; `allure-playwright` with `detail: false` (its automatic action steps
  would show typed values); in CI also `@estruyf/github-actions-reporter`, the pass/fail table on the run page.
- **Screenshot** (`only-on-failure`) and **trace** (`retain-on-failure`, which also keeps the failed first try of
  a test that passes on retry) on `logged-in` only. A logged-in trace can hold that run's session token (a throwaway
  account), never a typed password. `site-check`, `auth-setup` and `login` have both off: they
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
- **Run-page lines** (CI): "Billing address form refilled: N times (local development copy only; observed note
  15)" from `support/address-refill-summary.ts`, and "Cart emptied after the order: …", with the slowest span and
  DELETE time against the bound, from `support/cart-emptied-summary.ts`. Both read Playwright's JSON results.
- **Planted-bug run summary:** "Planted-bug run: X failed, Y not reached, Z passed (of N UI tests)", the setup and
  unit line and the commit SHA (section 10).

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
- All environment messages come from `support/environment-messages.ts` and share one phrase ("this is an
  environment problem, not a test failure"), so the planted-bug count can tell them from test failures; unit tests
  check the site-check, registration and bot-check messages against it.

## 7. CI and the Toolshop copy

**Workflow** (`.github/workflows/ui-tests.yml`, every pull request and push to main, `contents: read`, no
secrets): Node from `.nvmrc` → `npm ci` → **check the number of UI tests** (`npx playwright test --list
--grep-invert @seed --reporter=json`, then `support/check-test-count.ts` compares the UI tests found with
`EXPECTED_UI_TESTS`; a difference stops CI and says what to update) → Chromium → QEMU for arm64 → `ci/start-toolshop.sh` (step `start`) →
`npm test` with `BASE_URL=http://localhost:4200`, `API_URL=http://localhost:8091` → the run-page lines (section 5)
→ `npm run test:seed -- --reporter=list` (the AI
agents' starting test, kept out of `npm test`; it re-runs the set-up and registers one more account, and its
results stay out of the Allure report) → on failure, the last Toolshop logs → if Toolshop started, `npm run report:build` → if that passed, upload the report (and on main, prepare it for
Pages) → always `ci/stop-toolshop.sh`. A second job on main deploys the report to GitHub Pages (`pages: write`,
`id-token: write`, `concurrency: pages`), only when the scan passed.

**Planted-bug run** (`.github/workflows/with-bugs.yml`, started by hand only): the same steps with
`TEST_ENV=with-bugs`; the test step has `continue-on-error: true`; Playwright also writes a JSON file
(`RESULTS_JSON`), and `support/planted-bug-summary.ts` (run by Node directly; the counting is in
`support/planted-bug-count.ts`, with unit tests) prints "Planted-bug run: X failed, Y not reached, Z passed
(of N UI tests)", N being the UI tests found, the setup and unit line, and the commit SHA, on the run page too. The report is scanned and
uploaded as an artifact; nothing goes to GitHub Pages. The pins file for that copy is
`toolshop-images.sprint5-with-bugs.yml`.

**`ci/` scripts**

- `toolshop-env.sh` (shared by start and stop): `SPRINT`, read from `TEST_ENV` through the application profile
  (`support/print-app-version.ts`; `local` gives `sprint5`), the pinned Toolshop commit, the clone
  folder, the pins file `toolshop-images.<sprint>.yml`, compose project `toolshop`.
- `start-toolshop.sh`:
  1. Fetches Toolshop's repository at the pinned commit into a folder outside this repository; only its compose
     file is used, nothing is copied in. The folder is deleted only if it is empty or holds the marker file the
     script wrote when it cloned (`.toolshop-source`).
  2. For Sprint 5, runs `check-toolshop-pair.sh` (below): the run stops if the pinned images were not built from
     the pinned commit. For the with-bugs copy it prints "pair not checked" and goes on.
  3. Starts `mariadb`, `laravel-api`, `web` and `angular-ui` from Toolshop's `docker-compose.prod.yml` plus our
     pins file. `cron` is not started: it re-seeds the database every hour.
  4. Seeds with `php artisan migrate:fresh --seed --force`, retried every 5 seconds up to a timeout: compose's
     `depends_on` only orders the start, so the retry is the readiness check for the database and the API code.
     It prints the number of attempts and the UTC time the seed finished, and keeps one seed log per start
     (`~/.cache/toolshop-seed-logs/seed-<UTC time>-<sprint>.log`; the latest 20 are kept, `SEED_LOGS_KEPT`;
     `SEED_LOG_DIR` changes the folder). If the seed times out, the script prints the last lines of that log and how
     many attempts were made. Logging only: the retry and its timeout are the same, and a problem with the log (a
     folder that cannot be written, an old log that cannot be removed) prints one line and never stops the start.
  5. `wait-for-toolshop.sh` waits for `<API>/brands` and the site, with separate timeouts (the site compiles when
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
- `check-toolshop-pair.sh` (Docker): proves the pins file and the commit are one pair. It compares one file inside
  each image with the same file in the clone at the pinned commit: the UI's `payment.component.html` and the API's
  `config/jwt.php`. It prints only "match" or "mismatch", never a file's content, and fails on a mismatch. Sprint 5
  only: the with-bugs images are not yet checked against the pinned commit.
- **Pinned version:** Toolshop tag 2.5 (commit `9e7736c`, 22-08-2026), which the published 2.5 images were built
  from. The public site runs newer code.
- **Updating the pins:** change the commit in `toolshop-env.sh` and run the pin script (they are one pair), start
  the local copy (the pair check runs), run the tests on it, then let CI run on the new copy.
- **First measured CI run (09-11-2026):** containers up 28 s, seeded 37 s, API ready at once, site 5 s; ready after
  42 s; 14 tests in 9.8 s; volumes left after stop: 0. The timeouts (seed 300 s, API 120 s, site 420 s, job
  30 minutes) are first values, tightened after more runs.

## 8. Settings and versions

- **Settings:** `APP_UNDER_TEST` (default `toolshop`) and `TEST_ENV` (default `local`, the pinned local copy,
  `http://localhost:4200` and `http://localhost:8091`) pick the application profile and its environment
  (`support/apps/`); `BASE_URL` and `API_URL`, when set, win over the environment's addresses; read from the
  environment or a git-ignored `.env`. An unknown application or environment stops with one message naming the
  wrong value and the valid ones. When the local copy does not answer, the site check says "The local Toolshop copy is not running. Start it
  with ci/start-toolshop.sh."; any other address that does not answer gets "Toolshop site is not responding at
  <URL>". Both carry the shared environment phrase.
- **Config:** `testIdAttribute: 'data-test'` (Toolshop's attribute); `locale: 'en-US'` (the site follows the
  browser language, so texts and role names stay in English); retries 1 in CI and 0 locally; 2 workers in CI.
- **Versions:** Node in `.nvmrc` only (no `engines` field); `@playwright/test`, `allure-playwright`, the Allure 3
  CLI (`allure`) and `@estruyf/github-actions-reporter` pinned to exact versions in `package.json`; GitHub Actions
  pinned to major versions; Toolshop's images pinned by digest, and checked against `TOOLSHOP_COMMIT` (section 7).
- **`SPRINT` and `TOOLSHOP_COMMIT`:** `SPRINT` comes from the environment's `version` (`local` and `public-site`:
  `sprint5`; `with-bugs`: `sprint5-with-bugs`) and picks the Toolshop copy and its pins file; nobody types it;
  `TOOLSHOP_COMMIT` in `ci/toolshop-env.sh` is the pinned commit (tag 2.5, `9e7736c`).
- **`EXPECTED_UI_TESTS`** in `support/planted-bug-count.ts`: the number of UI tests (projects `login` and
  `logged-in`, the seed left out). CI checks it before the tests (section 7), and the planted-bug summary warns when
  fewer are found. It changes in the same pull request as the tests.
- **Scripts:** `npm test` (every test but the seed: 68 tests, 30 UI, 36 unit, 2 set-up), `npm run test:sanity`,
  `npm run test:seed`, `npm run test:unit`, `npm run test:public-site` (the same tests against the public site and
  its API), `npm run test:ready` (every test but the seed, 3 times at 2 workers: the check before a merge; 200 tests
  in all: 90 UI, 108 unit, 2 set-up), `npm run report:build`, `npm run report`.
- **Verified from a fresh clone:** `npm ci`, `npx playwright install chromium`, `ci/start-toolshop.sh`, then
  `npm test` with no settings (the README's [Run it](../README.md#run-it)); every commit typechecks and its tests
  pass. `npm run test:public-site` runs the public site, where the Payment tests fail, because it runs newer code
  than the pin.

## 9. AI-assisted tests

How to use the agents: [ai-assisted-tests.md](ai-assisted-tests.md). In short:

- **The agents:** Playwright's own planner, generator and healer, set up with `npx playwright init-agents` on a
  person's machine. Their generated files are git-ignored; no AI runs in CI.
- **The flow, per user flow:** a plan pull request (first commit the plan as the planner wrote it, second commit
  the QA engineer's edits and the "Approved by" line), then a tests pull request: first commit the generator's raw
  files, unchanged, under `drafts/<flow>/` (with their checksums in the pull request), second commit the QA
  engineer's decisions, moved into `tests/<flow>/`, with the drafting-log rows. A fix from the healer is its own pull
  request, checked against: no new wait, no new `skip`, no weaker assertion.
- **Plan header:** `Prepared by`, `Edited by`, `Scope set by` and `Approved by`, in roles, not names.
- **Drafting log** ([ai-drafting-log.md](ai-drafting-log.md)): flow, test, plan by, test drafted by, edit by,
  outcome (approved as drafted, edited, rejected), reason from the normal site, AI tool, pull request.
- **`AGENTS.md` and the deny list:** the agents run on the normal Sprint 5 copy only, start from
  `tests/seed.spec.ts` in the project `logged-in` (named in every call), and never edit the seed. They must not read
  `docs/bug-hunt.md`, the with-bugs pins and workflow, or Toolshop's source in `~/.cache/toolshop-source/`;
  `.claude/settings.json` blocks the same paths. The seed test stops on any other copy.
- **Header links:** `AGENTS.md` forbids clicking Testing Guide, Bug Hunting or QA Run in the site's header and
  opening `/assets/testing-guide.html` or the with-bugs site. It is a rule and a check after each session (a search
  of `.playwright-mcp/` and the generator report, written in the pull request), not a block.

## 10. Planted-bug runs

- Toolshop's "with bugs" copy is started with `TEST_ENV=with-bugs`; the hand-started workflow (section 7)
  runs the same tests on it. Tests are never written or changed from the bug list or that copy.
- Differences between the copies that set-up and navigation must follow (sign-up fields, page addresses, where
  the token is kept) are the `with-bugs` environment's in `support/apps/toolshop.ts`; locators, steps and assertions never change.
- The results are in `docs/bug-hunt.md` only: one table per run, a person matching each failure to a planted bug,
  baselines kept apart (a later run is compared only with the latest baseline on the same version).
- The list of planted bugs "on our path" is written and merged before the run it is used for.

## 11. Checkout specifics

- **Own account per order test:** each test that places an order (4.x) registers its own customer in its set-up
  (`useOwnCustomer()`), so no two workers order on one account (observed note 17). Its password goes to the same
  git-ignored folder and through `redact` and `check`.
- **Strict invoice row:** `InvoicesPage.invoiceRow()` finds the row with the order's invoice number, and the test
  expects exactly one.
- **Placing an order:** on Toolshop 2.5 the Payment step has one finish button labelled Confirm, clicked twice: the
  first click checks the payment, the second creates the invoice (observed note 7). `placeOrder()` reads the cart id
  from session storage and starts waiting for the site's own `DELETE <API_URL>/carts/<that id>` answer before the
  first click, then returns that answer (or that none came). The test expects a 2xx answer, then a full load of the
  home page shows no items in the cart. Only the wait's timeout counts as "no answer"; any other error is shown as
  itself.
- **The wait's bound:** `CART_EMPTIED_BOUND_MS` in `support/cart-emptied.ts` is three times the slowest span (first
  Confirm to the DELETE answer) measured in any run; the comment names the run. It changes only through a reviewed
  change; a span above half the bound is reported first (run, copy, time). Every CI run prints the slowest span against
  the bound.
- **Address refill:** on the local development copy only (`BASE_URL` on localhost), a billing address form that was
  reset after it was filled (every typed field empty) is filled again, at most twice, inside the step that fills it;
  each refill is a visible step and is counted on the run page. A partial loss of typed values fails the test, and
  on any other site a reset fails the test. Checks that the fields still hold their values come before every
  "disabled" check (observed note 15).
- **Left out:** the postal-code length check (2.3), until the production build of the UI: the development server
  reset its form once in 44 runs, and a refill would retype the value under test.
