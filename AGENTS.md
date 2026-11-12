# Rules for AI assistants working on this repo

These rules are for any AI assistant (and its test agents) that plans, writes or fixes tests here. A person reviews
and approves every change in a pull request. How to use the agents: [docs/ai-assisted-tests.md](docs/ai-assisted-tests.md).

## Where you may look

- Run against the **normal Sprint 5 copy of Toolshop only**, started locally with `ci/start-toolshop.sh`
  (`SPRINT=sprint5`). Never open Toolshop's "with bugs" copy.
- Start from `tests/seed.spec.ts`, in the project `logged-in`; name both in every agent call. It stops if it is not
  on the normal Sprint 5 copy. **Never edit `tests/seed.spec.ts`.**
- **Do not read** these (they describe the planted bugs this suite is measured against):
  - `docs/bug-hunt.md`
  - `ci/toolshop-images.sprint5-with-bugs.yml`
  - `.github/workflows/with-bugs.yml`
  - `~/.cache/toolshop-source/` (Toolshop's own source, cloned by `ci/start-toolshop.sh`; it holds the planted-bug
    list)

  `.claude/settings.json` blocks the same four paths in Claude Code (as `Read(...)` rules); the two lists are the
  same.
- Do not read the history of `README.md` or `docs/` (`git log`, `git show`).
- A test must come from what the normal site does, never from a list of planted bugs.
- Behaviour listed in `docs/observed-notes.md` is an open question for the team, never an assertion. A test may
  assert it only after the team has answered and the note records the answer.

## How tests are written here

- Import `test` and `expect` from `../fixtures`, never from `@playwright/test`. Tests ask for page objects as
  fixtures; never write `new LoginPage(page)`.
- A missing page object goes in `pages/`, with one line added to `fixtures.ts`.
- Locators: by role or label first; `data-test` (`getByTestId`) when there is no clear role or label. No CSS chains,
  no XPath.
- Page objects describe the page, wrap each action in `test.step('…')` and may return values. Only tests call
  `expect`.
- Web-first assertions (`await expect(locator).toHaveText(…)`), or `expect.poll` for a value a page object
  returns. Never read a value once and compare it.
- No hard waits (`page.waitForTimeout`). No `test.skip`, `test.fixme` or `test.only` in a pull request.
- Tags: `@sanity` for a short check after a deploy, `@regression` for the rest.
- Step names and test titles never hold login details or other typed values.
- Test data goes in `test-data/`.
- Run the test (`npx playwright test <file>`) and see it pass before saying it is done.

## When fixing a broken test

A fix must not add a wait, a `skip`, or a weaker assertion. Say what changed on the page and why the new locator or
step matches it.

## Never

- Change CI to run AI, or merge without a person's approval.
- Commit the files `npx playwright init-agents` writes (they are in `.gitignore`).
- Put a password, token or other secret in a file, a step name or a log.
