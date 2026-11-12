## What this pull request is

- [ ] A test plan (`specs/`)
- [ ] Tests (drafted by an AI agent, then edited by a person)
- [ ] A fix for a broken test
- [ ] Something else:

## What changed and why

## Checks

- [ ] The tests pass locally and in CI.
- [ ] Nothing here is taken from the planted-bug list.

**Tests drafted by an AI agent**
- [ ] First commit: the generator's files moved unchanged to `drafts/<flow>/`, with its report and checksums; searched for account values and "token" first. Second commit: moved into `tests/`, with the QA engineer's decisions (AI-proposed edits logged).
- [ ] `--repeat-each=3` at CI's workers passed every time.
- [ ] `tests/seed.spec.ts` unchanged.
- [ ] `drafts/` is empty after this pull request.
- [ ] One row per drafted test in `docs/ai-drafting-log.md` (approved as drafted, edited or rejected, with one line why).

**A fix for a broken test**
- [ ] No new wait (`waitForTimeout`).
- [ ] No new `skip` or `fixme`.
- [ ] No weaker assertion (no assertion removed, loosened or made optional).
