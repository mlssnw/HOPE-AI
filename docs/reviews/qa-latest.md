# QA Re-review — Phase 6 Integration Candidate

## QA Status

`REJECTED`

The `QA-IC-001` functional correction is independently `APPROVED` and the finding is closed. The overall integration gate remains `REJECTED` only because `QA-IC-002` is still open in the public draft PR metadata.

## Commits Reviewed

- Integration Candidate: `51f93d12740a6e0860856257ea761377b04c97fb`
- Functional correction commit: `4d76f2433363a47a9d8fe29fef337de1dc79ac50`
- Development evidence commit: `9e5764671d86121aedd88b926c05ccbc7c385131`
- Rejected candidate baseline: `20843a4568ca6eba67d66f93234412038ca79199`
- Original Phase 6 Functional Commit: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
- Branch: `codex/phase-6-target-ui`
- Review date: 2026-09-22

The target is a merge candidate containing both `4d76f24` and `9e57646`. The only functional-path delta from `20843a4` is `tests/test_realtime.py`; runtime backend, frontend, API, schema, migrations, dependencies, and production configuration are unchanged.

## QA-IC-001 Result

`CLOSED — APPROVED`

### Root Cause Confirmation

The rejected test created `create_app(FakeServices())` without an explicit memory manager. A developer-local `DATABASE_URL` silently supplied one, so the test passed locally but failed in a clean checkout with `thinking -> idle` instead of the expected `thinking -> searching -> idle`.

### Correction Review

- The corrected test patches `Settings.from_env()` at the test boundary with `Settings.for_tests()`.
- It reuses the existing disposable in-memory SQLite fixture and real `MemoryManager` with local hash embeddings.
- It disposes the SQLite database in `finally`.
- The original assertions remain unchanged: HTTP `200`, then `thinking`, `searching`, and `idle` for the same user.
- No runtime or product behavior was modified.

### Independent Clean-Export Evidence

The exact candidate `51f93d12740a6e0860856257ea761377b04c97fb` was exported with `git archive` to a new disposable directory.

- `.env` in export: absent.
- `DATABASE_URL`: absent.
- `DATABASE_ADMIN_URL`: absent.
- Anthropic, Tavily, ElevenLabs, and Obsidian credentials: absent.
- Focused regression: `1 passed, 1 warning`.
- Complete Python suite: `45 passed, 1 warning`.
- Frontend suite: `36 passed, 0 failed`.
- Python syntax: `49` files passed AST parsing.
- JavaScript syntax: `30` files passed `node --check`.
- `git diff --check 20843a4..51f93d1`: passed.

No real PostgreSQL connection, migration, provider, credential, network service, or production environment was used. The corrected test used only disposable SQLite in memory.

## Test Summary

- Backend: `PASSED` — 45 Python tests passed in the clean controlled export.
- Frontend: `PASSED` — 36 Node tests passed.
- Realtime correction: `PASSED` — the isolated event-order regression passed without local environment configuration.
- Syntax: `PASSED` — 49 Python and 30 JavaScript files.
- Browser: `NOT RE-RUN` — no runtime/frontend delta; the prior complete Phase 6 browser evidence remains applicable.
- API/Memory/Security behavior: `UNCHANGED` — no runtime delta from the previously reviewed implementation.
- Database: `NOT ACCESSED` — only in-memory SQLite test state was used.

## Regressions Found

No regression was reproduced from the `QA-IC-001` correction.

## Closed Findings

### QA-IC-001 — CLOSED

- Severity: MEDIUM
- Blocking: NO
- Evidence: isolated and full Python runs passed from an exact clean export without `.env`, database URLs, or provider credentials.
- Impact: the realtime regression test is now deterministic and no longer depends on developer-local configuration.
- Recommendation: retain the explicit fixture and clean-export validation as regression coverage.

## Open Blockers

### QA-IC-002 — Draft PR identifies a superseded Integration Candidate

- Severity: MEDIUM
- Blocking: YES
- Evidence: public draft PR #1 has remote head `51f93d12740a6e0860856257ea761377b04c97fb`, but its body still declares `cf9cd976549163d1f49cead7bc2f993254150708` as the Integration Candidate and does not name `51f93d1`.
- Impact: the PR review gate still directs reviewers and merge operators to the wrong artifact.
- Acceptance criteria: update the PR body to identify `51f93d12740a6e0860856257ea761377b04c97fb` as the Integration Candidate, identify `4d76f2433363a47a9d8fe29fef337de1dc79ac50` as the functional correction, and reflect the current QA/Security review state before merge.
- Owner/Coordinator boundary: this is a public PR metadata action and was not modified by QA.

## Non-blocking Issues

### QA-WARN-HTTPX — Deprecated TestClient integration

- Severity: INFO
- Evidence: Python runs emitted the known `StarletteDeprecationWarning` for the current TestClient/httpx integration.
- Impact: no current test failure; future dependency maintenance may be required.
- Recommendation: track outside the Phase 6 correction gate.

### QA-ENV-003 — Production environments remain untested

- Severity: INFO
- Evidence: no real PostgreSQL/pgvector, migration, paid provider, physical device, or public deployment was used.
- Impact: the result validates the test-fixture correction, not Production Readiness.
- Recommendation: retain the existing Database, Security, provider, accessibility, and production gates.

## Recommendation

`REJECTED`

Approve and close `QA-IC-001` for candidate `51f93d12740a6e0860856257ea761377b04c97fb`. Keep the overall Phase 6 integration gate rejected solely for `QA-IC-002`. Once the draft PR body is corrected to the exact candidate and review state, QA may verify that metadata-only closure without repeating the functional test suite unless the Git candidate changes.

## Parallel Environmental Validation — Obsidian Local REST API

- Result: `BLOCKED / NOT_TESTED`
- Commit tested: `91c77c1768aec511a253e19a22b32100a29bf342`
- Gate impact: `NONE`. This environmental check remains separate from the Phase 6 decision and from `QA-IC-001`/`QA-IC-002`.
- Sanitized evidence: the credential and loopback endpoint configuration were present, but the local TCP listener was unreachable. Authentication and functional read/search were therefore not tested.
- Safety: no vault names, note names, note contents, excerpts, private paths, URL, port, or token were logged; no note was created, changed, moved, or deleted.
- Proportional mocked service regression: `tests/test_services.py` — `5 passed`.
- Owner action for a live rerun: open Obsidian and confirm the existing Local REST API plugin is enabled/listening, without sharing secrets or private vault content.
