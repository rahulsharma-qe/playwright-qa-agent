# AI-assisted tests

**Agents run only on the normal Sprint 5 copy of Toolshop, started locally with `ci/start-toolshop.sh`. Never on the
"with bugs" copy.**

```mermaid
flowchart LR
  PLAN["Plan the tests<br/>an AI explores the site and writes a plan"] --> OK1["A person approves<br/>the plan, in a pull request"]
  OK1 --> DRAFT["Draft the tests<br/>with our page objects"] --> OK2["A person approves<br/>the tests, in a pull request"]
  FIX["Fix a broken test<br/>the AI proposes a fix"] --> OK3["A person approves<br/>against the checklist"]
  classDef box fill:#1e293b,stroke:#94a3b8,color:#f1f5f9
  class PLAN,OK1,DRAFT,OK2,FIX,OK3 box
```

Writing UI tests for every page by hand takes long. Here an AI drafts them and a person decides. We use Playwright's
own test agents: the **planner** explores the site and writes a test plan in `specs/`; the **generator** turns a
plan into tests that use our fixtures and page objects; the **healer** proposes a fix for a failing test. They run on
a person's machine, inside their AI assistant. **No AI runs in CI**, and nothing is merged without a person's
approval.

## One-time set-up

1. Start the normal Sprint 5 copy: `ci/start-toolshop.sh` (it uses `SPRINT=sprint5` by default). In `.env`, set
   `BASE_URL=http://localhost:4200` and `API_URL=http://localhost:8091` (the addresses it prints), and no `SPRINT`
   other than `sprint5`.
2. Write the agent files for your assistant:
   `npx playwright init-agents --loop=<your assistant> --project logged-in`
   (`--loop` is one of `claude`, `codex`, `copilot`, `opencode`, `vscode`). The agents' tools use the first project in
   the config when none is named; `logged-in` is first on purpose, because the seed is in it. Still name it.
3. The files it writes are generated and git-ignored; write them again after each Playwright update. Only the
   generated `copilot-setup-steps.yml` is ignored in `.github/workflows/`; the folder and our workflows stay tracked.

The agents start from `tests/seed.spec.ts`: our fixtures and a signed-in home page. Each time, they first run the
environment check and the test-user set-up, as the tests do. The seed stops with "Agents must run on the normal
Sprint 5 copy; stop it and start with SPRINT=sprint5" if it is on any other copy.

## Plan, draft, fix

Every prompt to an agent names the project and the seed: "… project logged-in, seed file tests/seed.spec.ts". In the
first generator session (12-11-2026) a tool given no project used `unit` (then the first project), found no seed in
it, and wrote its own empty seed over ours. That session was discarded.

1. **Plan.** Ask your assistant "plan tests for <a part of the site>". The planner writes `specs/<name>.md`. Open
   **pull request 1: the plan**. A person edits and approves it. A plan can also be written by a person in plain
   English and given to the generator.
2. **Draft.** Ask "generate tests from specs/<name>.md". Open **pull request 2: the tests** (steps below). Add one
   row per drafted test to [ai-drafting-log.md](ai-drafting-log.md) in the same pull request. CI green, then merge.
3. **Fix.** When a test breaks, ask "heal <the test>". The healer proposes a fix. **Pull request 3: the fix**, checked
   against the list in the pull-request template: no new wait, no new `skip`, no weaker assertion.

## How a flow goes through pull requests

1. **Plan pull request.** First commit: the plan as the AI test planner wrote it. Second commit: the QA engineer's
   edits, plus the line `Approved by: QA engineer, pull request #<n>` (the number exists once the pull request is
   open). With no edits, the second commit is that one line. Merging is the approval. A plan the QA engineer writes
   has only the Approved-by line in its second commit.
2. **Tests pull request**, one per flow:
   - The generator writes where its tool can, under `tests/<flow>/`. Right after the session: take the `sha256sum`
     of its files (listed in the pull request description), keep its report as returned, and check
     `git diff tests/seed.spec.ts` is empty.
   - Before anything is committed: search the report and every generated file for this run's test-account emails
     and passwords and for "token". The report's secret scan does not cover files in the repository.
   - First commit: the files moved unchanged to `drafts/<flow>/` (outside the folders Playwright runs, and left out
     of the typecheck), `drafts/<flow>/generator-report.md`, and the agent's changes to existing files as
     `drafts/<flow>/changes-to-existing-files.patch`, not applied.
   - Second commit: the QA engineer's decisions on the raw draft: files moved into `tests/<flow>/`, the patch
     applied, and the edits. The QA engineer may ask the AI assistant for a change; each one is logged as "edit
     proposed by AI-01, accepted by the QA engineer", with its reason. `drafts/` is empty again.
   - The description gives the prompt used and, per file,
     `git diff <commit 1>:drafts/<flow>/<file> <commit 2>:tests/<flow>/<file>`.
   - When a run fails, copy its traces out of `test-results/` before running anything else: Playwright clears that
     folder at the start of every run. For example:
     `for d in test-results/*/; do [ -f "$d/trace.zip" ] && cp "$d/trace.zip" ~/evidence/"$(basename "$d").zip"; done`
   - Ready only when `--repeat-each=3` at CI's workers passes every time. One failure is a flaky test: fixed or left
     out, never merged.
   - The drafting-log rows go in the same pull request.

Every plan starts with a header, like the "prepared by / approved by" block of a test plan (roles, not names):

```
Prepared by: AI test planner (AI-01) · Edited by: QA engineer (second commit)
Scope set by: AI assistant (AI-01)
Approved by: QA engineer, pull request #<n>
```

(`Edited by: none` when there were no edits; `Prepared by: QA engineer` for a plan a person wrote; `Scope set by: QA
engineer` when the QA engineer chose what to cover. The prompts used go in the plan pull request's description.)

## AI tool IDs

Each AI tool gets an ID, in the style QA teams use for test cases (`TC-001`). A new assistant, or a new model of the
same one, gets the next ID. An ID covers the period its dates show.

| ID | What it is | From |
|---|---|---|
| AI-01 | AI coding assistant with Playwright's test agents (first set-up) | 11-11-2026 |

## The first slice

1. Category filters: plan by the AI test planner.
2. Checkout: plan by the AI test planner.
3. Contact form: plan written by the QA engineer in plain English, then given to the AI test generator. Its plan
   pull request has the checklist line "Written from the normal Sprint 5 site only, nothing from the planted-bug
   list". Its results are reported on their own, labelled "plan by a person who had read the planted-bug list", and
   never added to the AI plans' numbers.

The rules every assistant follows (locators, page objects, tags, what not to read) are in [AGENTS.md](../AGENTS.md).

## Keeping the planted bugs away from the agents

This suite is measured on Toolshop's "with bugs" copy. To keep that measure fair, the agents never see it:

- `AGENTS.md` lists files not to read; a committed `.claude/settings.json` blocks the same list in Claude Code.
- The seed test refuses any copy but the normal Sprint 5 one.
- Every plan and tests pull request has the checklist line "Nothing here is taken from the planted-bug list".

These are guards, not a guarantee. The person approving has read the planted-bug list; every edit and its reason is
in the drafting log.

## Honest lines

- The AI drafts; a person decides.
- The numbers come from small samples.
- At 4 workers the local copy sometimes takes over 5 s for the home list; CI runs 2 workers.
- One plan each, on different flows: an illustration, not a comparison.
- The contact-form plan is written and approved by the same role.
- Checkout tests leave orders on the site they run against (the public site resets every hour).
- The healer is shown on a deliberately broken locator, as a demo on a branch that is not merged.
