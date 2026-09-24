# QA Re-review — Phase 6 Integration Candidate

## QA Status

`APPROVED_WITH_WARNINGS`

Both QA blockers are closed for Integration Candidate `51f93d12740a6e0860856257ea761377b04c97fb`. `QA-IC-001` was closed by independent clean-export validation, and `QA-IC-002` was closed by a metadata-only verification of the current public draft PR. No QA blocker remains; environmental and maintenance warnings remain non-blocking.

## Commits Reviewed

- Integration Candidate: `51f93d12740a6e0860856257ea761377b04c97fb`
- Functional correction commit: `4d76f2433363a47a9d8fe29fef337de1dc79ac50`
- Development evidence commit: `9e5764671d86121aedd88b926c05ccbc7c385131`
- Rejected candidate baseline: `20843a4568ca6eba67d66f93234412038ca79199`
- Original Phase 6 Functional Commit: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
- Branch: `codex/phase-6-target-ui`
- Review date: 2026-09-22
- Metadata closure date: 2026-09-24

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

### QA-IC-002 — CLOSED

- Historical severity: MEDIUM
- Blocking: NO
- Source verified: public GitHub PR #1 via fresh API metadata.
- Evidence: the PR remains open and draft; base/head remain `main` <- `codex/phase-6-target-ui`; the body identifies exact Integration Candidate `51f93d12740a6e0860856257ea761377b04c97fb` and functional correction `4d76f2433363a47a9d8fe29fef337de1dc79ac50`; it records `QA-IC-001` closed/approved, Security `APPROVED_WITH_WARNINGS`, and `SEC-019`/`SEC-020` closed; it keeps merge blocked until this confirmation, Production Readiness `BLOCKED`, and Phase 7 not authorized.
- Superseded candidate check: `cf9cd976549163d1f49cead7bc2f993254150708` is absent from the current PR body and is no longer presented as the active candidate.
- Functional suites: not repeated, as explicitly required for this metadata-only closure. The Git candidate reviewed by QA remains `51f93d1`.

## Open Blockers

- None.

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

`APPROVED_WITH_WARNINGS`

QA approves the Phase 6 integration candidate `51f93d12740a6e0860856257ea761377b04c97fb` with non-blocking warnings. `QA-IC-001` and `QA-IC-002` are closed. The PR may leave the QA gate, but merge remains subject to the owner/Coordinator workflow and must not imply Production Readiness or authorize Phase 7.

## Parallel Live Retest — Obsidian Local REST API

- Result: `BLOCKED / NOT_TESTED`
- Execution commit: `4497347b6440c03c305cbb54eaccc643d95ced3c` (QA documentation descendant of candidate `51f93d12740a6e0860856257ea761377b04c97fb`; Obsidian implementation unchanged).
- Owner-reported state: Obsidian open and Local REST API active.
- Gate impact: `NONE`. This environmental check remains separate from the Phase 6 decision and from `QA-IC-001`/`QA-IC-002`.

### Sanitized Evidence

- Credential configuration: present.
- Endpoint configuration: present.
- TLS verification setting: enabled.
- Configured TCP listener: unreachable.
- Adapter health: `configured=true`, `available=false`.
- Obsidian process visible in the current OS session: no.
- Configured listener visible in the current OS session: no.
- Authentication: `NOT_TESTED` because no listener accepted a connection.
- Functional read/search: `NOT_TESTED`; the read-only sentinel query was deliberately skipped after failed health/connectivity.
- Proportional mocked service regression: `tests/test_services.py` — `5 passed`.

### Diagnosis and Safety

The owner-reported application/plugin state is not observable from the current QA execution session. The evidence is consistent with Obsidian running in another machine/session, the application having exited, or the active plugin listening under configuration different from the backend endpoint. This is an environmental reachability blocker, not a reproduced adapter defect.

No host, port, URL, token, vault name, private path, note name, note content, excerpt, or response body was logged or persisted. No note or Obsidian configuration was created, changed, moved, or deleted.

### Owner Action for Another Live Attempt

Keep Obsidian open in the same Windows session as the HOPE process and confirm locally that the existing Local REST API status indicates it is listening under the already configured endpoint. Do not share any secret or private vault information. QA can then repeat health, authentication, and one non-sensitive read-only sentinel search.
