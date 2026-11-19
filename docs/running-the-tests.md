# Running the tests

How to choose what a run tests, how to run against the public site, and how the Toolshop copy that the tests use
locally and in CI works. The short version is in the README's [Run it](../README.md#run-it).

## Settings

`TEST_ENV` (the environment: `local`, `public-site` or `with-bugs`) and `APP_UNDER_TEST` (the application, `toolshop`)
pick the application profile in `support/apps/`; the defaults are Toolshop's pinned local copy (`http://localhost:4200`,
API `http://localhost:8091`). `BASE_URL` and `API_URL`, when set, win over the environment's addresses. There
are no account values anywhere on Toolshop: shared demo accounts get locked by other visitors, and accounts
registered by hand are removed when Toolshop resets its data. So each run registers five customers through
Toolshop's API (one for the logged-in tests, one for the login tests, one for each of the two order tests, one for
the given-user example), plus one more in CI for the agents' starting test, and one more each time a retry starts
a new worker. Their emails use the reserved `example.com` domain; the passwords are generated for the run and kept
only in `playwright/.auth/run-accounts/` (git-ignored), where the secret scan reads them.

For an application where tests cannot register their own account, its profile says `testUser: given`: the tests
log in as an account made for them, from `APP_USER_EMAIL` and `APP_USER_PASSWORD` (in CI, GitHub secrets of those
names; only the names are in this repository). The wrong-password test and the order tests still register their
own accounts when the application allows it; when it does not, the wrong-password test is left out with its
reason and the run uses one worker. The secret scan covers the given password too. The fork rule for this mode is in
[CI](#ci). `tests/given-user-login.spec.ts` is a working example on Toolshop. All the steps:
[onboarding-a-web-app.md](onboarding-a-web-app.md).

## Run against the public site

`npm run test:public-site` runs the same tests against https://practicesoftwaretesting.com and its API. Expect:

- the Payment tests fail there, because the public site runs newer Toolshop code than the pinned copy (see the note at the top of the [README](../README.md));
- the site's login lasts 5 minutes, so a run that takes longer can meet an expired session in its last tests;
- the public site's data is shared with other visitors; a run can fail many tests when they have changed it, until
  the site's hourly reset.

A run on 15-11-2026 failed 5 tests, all at the Payment step: "Invalid credit card fields show their messages and
keep Confirm disabled" (3.1), "An invalid Bank Name shows its message and disables Confirm" (3.3), "An invalid Gift
Card Number shows its message and disables Confirm" (3.4), "Happy path with a credit card" (4.1) and "Happy path
with Cash on Delivery" (4.2). There, Payment shows "Check payment" before "Confirm"; on the pinned copy, Toolshop
2.5, Payment has one finish button labelled "Confirm", clicked twice.

`test:public-site` sets the two addresses in the command itself, which works on macOS, Linux and CI. On Windows, set
`BASE_URL` and `API_URL` in `.env` instead.

A trace attached to a failed test opens with `npx playwright show-trace <file>` or at trace.playwright.dev.

## The Toolshop copy

### CI

`.github/workflows/ui-tests.yml` runs on every pull request and push to main. Toolshop's public site shows a bot
check to CI machines, and we do not try to get past it, so CI starts its own copy first:

1. `ci/start-toolshop.sh` fetches Toolshop's repository at a pinned commit into a cache folder outside this
   repository (nothing of it is committed here), starts the database, API, web server
   and site from Toolshop's published images (pinned by digest in `ci/toolshop-images.sprint5.yml`), seeds the
   database, and waits until the API and the site answer. Toolshop's hourly data reset is not started.
2. `npm test` runs against `http://localhost:4200` (site) and `http://localhost:8091` (API), with 2 workers and 1 retry.
3. The report is built and scanned; `ci/stop-toolshop.sh` removes the containers.

On Toolshop, CI needs no secrets, so pull requests from forks run fully. For an application with a given test user
(see [Settings](#settings)), a pull request from a fork gets no secrets, so its run leaves out the projects that need
a user and says so. Only a report that passed the secret scan is uploaded
or published. For the report on GitHub Pages, one-time setup: Settings → Pages → Source: "GitHub Actions". Pull
requests do not publish. On the run page, read the line "31 UI tests, 57 framework checks (and 2 set-up steps)";
the "Total tests" line above it is the reporter's own and adds them all together. No AI runs in CI: runs stay repeatable and cost nothing per run.

### The same copy on your machine

Start the same copy on your machine (needs Docker):

```bash
ci/start-toolshop.sh
npm test
ci/stop-toolshop.sh
```

Before long runs, restart the local copy (`ci/stop-toolshop.sh`, then `ci/start-toolshop.sh`): it keeps every order
and cart it is given, and a copy left running for hours gets slower.

The copy uses host ports 3306 (database), 8000 and 8091 (API) and 4200 (site); free them first.
Toolshop's web server image is published for arm64 only. A Mac with Apple silicon runs it natively; Docker
Desktop on an Intel Mac or Windows emulates it on its own. On a Linux machine (amd64), turn on arm64 emulation
once: `docker run --privileged --rm tonistiigi/binfmt --install arm64`.

### Planted-bug run

**Planted-bug run.** The hand-started workflow "Run on the with-bugs copy" runs the same tests on Toolshop's
version with bugs planted on purpose, to see which of them the tests catch ([bug-hunt.md](bug-hunt.md)).
Failed tests are the result there, so that workflow stays green when they fail. The same run on your machine:

```bash
TEST_ENV=with-bugs ci/start-toolshop.sh
TEST_ENV=with-bugs npm test
ci/stop-toolshop.sh
```

Toolshop has a second version with bugs planted on purpose, and Testsmith lists them. We run the same tests on it,
by hand, to see which planted bugs they catch.

- Of Toolshop's 94 planted bugs, 29 are on the pages the five original tests open (login, home and search, product
  page, cart).
- **First baseline (09-11-2026):** 1 caught. **Second baseline (10-11-2026):** 2 caught, after search and cart began
  to start from a session made through the API. Both baselines are for the five original tests. Bugs the tests did
  not reach are not counted as missed.
- The tests added since (the 25 AI-drafted tests and the given-user example) are measured for the first time in
  the planted-bug run after step 2, with their own list of bugs on their pages written first.

Which bugs were caught and why, how we count, and every run: [bug-hunt.md](bug-hunt.md). The AI test
agents are kept away from that file and from the "with bugs" copy; these are guards, not a guarantee
([ai-assisted-tests.md](ai-assisted-tests.md)).

### Updating the pins

To update Toolshop in CI: change `TOOLSHOP_COMMIT` in `ci/toolshop-env.sh` and run `ci/pin-toolshop-images.sh`
(the two are one pair), start the local copy (`ci/check-toolshop-pair.sh` runs and stops on a mismatch), run the
tests on it, then let CI run on the new copy.
