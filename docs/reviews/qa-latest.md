# QA Review — Phase 6 Integration Candidate

## QA Status

`REJECTED`

## Commit Tested

- Integration Candidate: `20843a4568ca6eba67d66f93234412038ca79199`
- Functional Commit: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
- Branch: `codex/phase-6-target-ui`
- Remote branch tip observed during review: `ee0de959eadd49eaccbdc6952781d5e403cb3761` (coordination-only descendant)
- Superseded candidates not approved by this review: `d83e57d237d1ddd10a0f64ae833aa92c0b2e9d71`, `cf9cd976549163d1f49cead7bc2f993254150708`
- Review date: 2026-09-22

## Test Summary

The candidate is documentation-only and changes `AGENTS.md`, `README.md`, `docs/coordination/documentation-language-policy.md`, and `docs/handoff.md`. No drift was found in backend, frontend, tests, migrations, dependency files, or the reviewed Functional Commit.

The README is in PT-BR, identifies Phase 6 as the only active phase, keeps later phases outside the active implementation gate, and links to future direction without presenting it as delivered work. The documentation language policy is internally consistent with the owner-approved README and owner-facing PT-BR exceptions.

### Backend: FAILED

- Clean exported snapshot, full Python suite: `44 passed, 1 failed, 1 warning`.
- Clean exported snapshot, focused E2E/API/realtime suite: `10 passed, 1 failed, 1 warning`.
- Failing test: `tests/test_realtime.py::test_chat_publishes_ai_state_for_same_user`.
- The failure reproduced three times in isolation: expected `thinking -> searching -> idle`, received `thinking -> idle`.
- Python syntax: `49` files parsed successfully.

### Frontend: PASSED

- Node test suite: `36 passed, 0 failed`.
- JavaScript syntax: `30` files passed `node --check`.

### Browser: PASSED

- Official Phase 6 browser package completed successfully in a disposable export using Chrome/Playwright.
- Seven viewports, chat-first behavior, state/focus preservation, 200% equivalent reflow, 130% text, landscape reachability, contrast, focus, reduced motion, WebGL loss/fallback/recovery, Memory Globe states, realtime degradation, voice fixtures, cancellation, consent/history, and safe forgetting passed.
- Generated disposable evidence: 39 PNG screenshots, three JSON result files, and one evidence README.
- Console and asset checks reported no unexpected errors.

### API: PASSED WITH SUITE BLOCKER

- Focused API, E2E harness, and malformed-WebSocket selection: `7 passed, 1 warning`.
- Validation and negative cases exercised include HTTP `422`, missing/divergent delete confirmation `428`, exact UUID confirmation, relation removal, and memory-aware chat flows.
- The full Python gate remains failed because of `QA-IC-001`.

### Realtime: PASSED WITH SUITE BLOCKER

- Invalid WebSocket JSON closed with code `1008` and reason `payload JSON inválido`; no unhandled traceback was observed.
- Browser coverage passed heartbeat/PONG, disconnect, HTTP fallback, reconnect, incremental events, and stale-event cancellation behavior.
- The clean-checkout realtime unit test dependency described in `QA-IC-001` remains blocking.

### Memory: PASSED

- E2E/API/browser coverage passed memory-aware chat, retrieval, real-target forgetting, exact UUID confirmation, `428` for missing/divergent confirmation, confirmed deletion, and relation removal.
- Loading, empty, unavailable, error, search, list, inspector, and WebGL fallback states passed.

### Security: PASSED WITH PRODUCTION LIMITATIONS

- Candidate diff contained no recognized secret/key patterns.
- Browser/frontend tests passed inert HTML/SVG handling and rejection of executable URL protocols.
- No production database, migration, paid provider, credential, or deployment was touched.
- Existing Production Readiness blockers remain outside this documentation-only feature gate.

## Commands and Evidence

- `git status --short --branch`, `git branch --show-current`, `git rev-parse HEAD`, and ancestry checks.
- `git show --stat --summary 20843a...` and candidate patch review.
- `git diff --check 0912e94..20843a4` — passed.
- Functional-path diff across backend, frontend, tests, migrations, and dependency files — empty.
- Markdown link validation in the exact exported snapshot — 49 Markdown files, 107 links checked, 0 broken.
- `python -m pytest -q -p no:cacheprovider` — 44 passed, 1 failed, 1 warning.
- Focused Python selection — 10 passed, 1 failed, 1 warning.
- Malformed-WebSocket + E2E/API selection — 7 passed, 1 warning.
- `node --test tests/frontend/*.test.mjs` — 36 passed.
- Python AST syntax validation — 49 files passed.
- `node --check` — 30 JavaScript files passed.
- `node tests/browser/run.mjs` — complete browser package passed.
- GitHub PR metadata read via the public API — draft PR #1 points to remote head `ee0de95`, but its body still names `cf9cd97` as the Integration Candidate.

## Regressions Found

### QA-IC-001 — Python suite is not reproducible in a clean checkout

- Severity: MEDIUM
- Blocking: YES
- Evidence: the clean candidate export has no local `.env`; `Settings.from_env().database_url` is false, so `create_app(FakeServices())` does not create a memory manager. The test nevertheless expects a `searching` event that is only published when a memory manager exists. It failed in the full suite, the focused suite, and three isolated repetitions. The same test passed when a disposable SQLite `DATABASE_URL` was explicitly supplied, and the workspace copy passed only because its local `.env` configures a database.
- Impact: the advertised `45 passed` result depends on developer-local configuration and is not reproducible by a clean checkout or typical CI environment. The final integration gate cannot rely on the suite as currently written.
- Acceptance criteria: make the realtime test self-contained and explicit about whether a memory manager is present; then demonstrate `45 passed` (or the updated complete count) from a clean exported checkout with no local `.env` dependency.
- Recommendation: return the isolated test-fixture issue to Development; do not infer production behavior from a developer-local `.env`.

### QA-IC-002 — Draft PR identifies a superseded Integration Candidate

- Severity: MEDIUM
- Blocking: YES
- Evidence: draft PR #1 targets `main` from `codex/phase-6-target-ui` and its remote head is `ee0de959...`, which contains `20843a4`; however, the PR body still declares `cf9cd976...` as the Integration Candidate and still says final QA/Security are pending for that old hash.
- Impact: reviewers and merge operators cannot determine the authoritative candidate from the PR itself, violating the exact-commit review gate and risking approval of the wrong artifact.
- Acceptance criteria: update the draft PR body to identify `20843a4568ca6eba67d66f93234412038ca79199` as the Integration Candidate, preserve `0912e949...` as the Functional Commit, and reflect the current final review results before merge.
- Recommendation: keep the PR in draft until its review gate and repository handoff agree on the exact candidate.

## Blockers

- `QA-IC-001` — clean-checkout Python suite failure caused by a test fixture that implicitly depends on local database configuration.
- `QA-IC-002` — draft PR body still identifies superseded candidate `cf9cd97` instead of `20843a4`.

## Non-blocking Issues

### QA-ENV-003 — Real environment validations not executed

- Severity: INFO
- Evidence: PostgreSQL/pgvector, migration `20260903_0003`, real microphone, paid providers, physical-device accessibility, and public deployment were not exercised.
- Impact: this review validates the candidate in disposable/local test environments only and does not establish Production Readiness.
- Recommendation: retain these checks in their Database, Security, provider, accessibility, and production gates.

### QA-WARN-HTTPX — Deprecated TestClient integration

- Severity: INFO
- Evidence: Python runs emitted `StarletteDeprecationWarning` recommending migration from the current `httpx` integration.
- Impact: no current functional failure, but future dependency updates may require maintenance.
- Recommendation: track as technical maintenance outside the Phase 6 documentation gate.

## Recommendation

`REJECTED`

Do not merge the Phase 6 draft PR until both blockers are closed and QA re-reviews the resulting exact Integration Candidate. This result does not authorize Phase 7, production deployment, migration application, or real database changes.
