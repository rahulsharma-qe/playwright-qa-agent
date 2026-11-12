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
   (`--loop` is one of `claude`, `codex`, `copilot`, `opencode`, `vscode`). `--project logged-in` matters: without it,
   the agents use the first project in the config, which is `unit`.
3. The files it writes are generated and git-ignored; write them again after each Playwright update. Only the
   generated `copilot-setup-steps.yml` is ignored in `.github/workflows/`; the folder and our workflows stay tracked.

The agents start from `tests/seed.spec.ts`: our fixtures and a signed-in home page. Each time, they first run the
environment check and the test-user set-up, as the tests do. The seed stops with "Agents must run on the normal
Sprint 5 copy; stop it and start with SPRINT=sprint5" if it is on any other copy.

## Plan, draft, fix

1. **Plan.** Ask your assistant "plan tests for <a part of the site>". The planner writes `specs/<name>.md`. Open
   **pull request 1: the plan**. A person edits and approves it. A plan can also be written by a person in plain
   English and given to the generator.
2. **Draft.** Ask "generate tests from specs/<name>.md". Open **pull request 2: the tests**. First commit: the raw
   draft as the agent wrote it. Second commit: the person's edits. Add one row per drafted test to
   [ai-drafting-log.md](ai-drafting-log.md) in the same pull request. CI green, then merge.
3. **Fix.** When a test breaks, ask "heal <the test>". The healer proposes a fix. **Pull request 3: the fix**, checked
   against the list in the pull-request template: no new wait, no new `skip`, no weaker assertion.

## How a flow goes through pull requests

1. **Plan pull request.** First commit: the plan as the AI test planner wrote it. Second commit: the QA engineer's
   edits, plus the line `Approved by: QA engineer, pull request #<n>` (the number exists once the pull request is
   open). With no edits, the second commit is that one line. Merging is the approval. A plan the QA engineer writes
   has only the Approved-by line in its second commit.
2. **Tests pull request.** First commit: the raw draft, byte for byte, under `drafts/<flow>/` (outside `tests/`, so
   nothing runs, and left out of the typecheck); the agent's changes to existing files go in as a patch file there,
   not applied. Second commit: the files moved into `tests/`, the patch applied, and the QA engineer's edits;
   `drafts/` is empty again. The drafting-log rows
   go in the same pull request.

Every plan starts with a header, like the "prepared by / approved by" block of a test plan (roles, not names):

```
Prepared by: AI test planner (AI-01) · Edited by: QA engineer (second commit)
Approved by: QA engineer, pull request #<n>
```

(`Edited by: none` when there were no edits; `Prepared by: QA engineer` for a plan a person wrote.)

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
- One plan each, on different flows: an illustration, not a comparison.
- The contact-form plan is written and approved by the same role.
- The healer is shown on a deliberately broken locator, as a demo on a branch that is not merged.
