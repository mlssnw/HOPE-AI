# Security Review

Integration Candidate reviewed: `51f93d12740a6e0860856257ea761377b04c97fb`

Functional correction reviewed: `4d76f2433363a47a9d8fe29fef337de1dc79ac50`

QA evidence: `4497347b6440c03c305cbb54eaccc643d95ced3c`

Current branch tip observed: `62b54bcaed23a9a01292668b2190dc0c151a0bc3`

Original Phase 6 Functional Commit: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`

Rejected candidate baseline: `20843a4568ca6eba67d66f93234412038ca79199`

Phase: 6 — Target UI Convergence

Date: 2026-09-24

## Result

APPROVED_WITH_WARNINGS

Security approves the exact Integration Candidate `51f93d12740a6e0860856257ea761377b04c97fb` with warnings for the Phase 6 local/controlled scope. The focused correction closes `SEC-020`: the realtime test no longer depends on an ignored `.env` or `DATABASE_URL`, uses explicit test settings and disposable in-memory SQLite, and disposes its database. The README correction also closes `SEC-019`: it now distinguishes server-side credential custody from owner authentication and clearly separates chat memory consent from loading already stored memories in the Memory Globe.

No new Security finding or Security feature blocker was identified. This result does not approve the overall integration while QA's external operational blocker `QA-IC-002` remains open, and it does not authorize editing or merging the draft PR.

Production Readiness remains `REJECTED / BLOCKED` by `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `SEC-008` and `SEC-012`. No HIGH or CRITICAL risk is accepted by this review.

## Scope and Commit Boundary

- Exact Integration Candidate: `51f93d12740a6e0860856257ea761377b04c97fb`.
- Functional correction: `4d76f2433363a47a9d8fe29fef337de1dc79ac50`, contained in the candidate.
- QA evidence: `4497347b6440c03c305cbb54eaccc643d95ced3c`, contained in the current branch tip.
- Current tip `62b54bc` adds QA documentation only after the candidate; it does not change the correction or runtime.
- Relative to rejected candidate `20843a4`, the only functional-path change is `tests/test_realtime.py`.
- No backend runtime, frontend, API, schema, migration, dependency manifest, production configuration or provider adapter changed.
- README changes are documentation-only and address `SEC-019` without claiming that owner authentication already exists.
- The four pre-existing untracked items (`Hope dashboard` and three `hope-linkedin-hero*` assets) were preserved and excluded.

## Independent Validation

- `git diff --check 20843a4..51f93d1`: passed.
- Functional-path inventory: exactly one file, `tests/test_realtime.py`.
- Runtime/backend/schema/migration/dependency comparison: no drift.
- Candidate delta secret-pattern scan: no private-key marker, Anthropic secret prefix, GitHub token prefix, AWS access-key prefix or JWT-like value added.
- No tracked `.env` exists in the candidate.
- Clean `git archive` export of exact candidate `51f93d1`: `.env` absent; database URLs and Anthropic, Tavily, ElevenLabs and Obsidian credentials removed from the child environment.
- Focused SEC-020 regression: 1 passed, 1 known Starlette/TestClient deprecation warning.
- Complete Python suite in the same clean export: 45 passed, 1 known warning.
- Frontend regression: 36 passed.
- The disposable export was removed after validation.
- No real PostgreSQL connection, migration, paid provider, credential, external service or production environment was used.

## Controls Confirmed

### SEC-020 test isolation

- The corrected test replaces `Settings.from_env()` at the test boundary with `Settings.for_tests()`.
- The test obtains its memory manager from the existing `make_app()` fixture, which uses `sqlite+aiosqlite:///:memory:` and local hash embeddings.
- The disposable database is closed in `finally`.
- The original assertions remain unchanged: HTTP 200 followed by `thinking`, `searching` and `idle` for the same user.
- The test passes without `.env`, `DATABASE_URL`, `DATABASE_ADMIN_URL` or provider credentials.
- No product/runtime branch was modified to make the test pass.

### SEC-019 public security and consent claims

- README now states that credentials remain on the backend while owner authentication is still required before public exposure.
- README still states that `X-Hope-User-Id` is not authentication.
- Public deploy remains explicitly disabled pending authentication, authorization and production hardening.
- Chat memory opt-in is accurately limited to recovery, capture and commands during the conversation.
- README explicitly states that already stored memories may still be loaded by the Memory Globe in the current local/controlled interface.
- The correction does not imply global consent coverage, authenticated endpoints or Production Readiness.

### Preserved trust boundaries

- Existing memory consent and exact-UUID destructive confirmation are unchanged.
- `SEC-006` and `SEC-007` remain effective for the functional scope.
- Web, Obsidian, memory and other external content remain untrusted data rather than system authority.
- Client-provided UUID remains a development namespace, not proof of owner identity.
- Implemented, partial and planned capabilities remain separated; no later phase was activated.

## Findings

No new finding was identified in `20843a4..51f93d1`.

## Resolved Findings

### SEC-019

ID: SEC-019

Severity: LOW

Title: Public README security and consent wording was broader than the implemented controls

Status: CLOSED

Description: The prior README could be read as claiming authenticated backend protection and a global consent gate over existing memory reads. The candidate now distinguishes credential custody from owner authentication and chat consent from Memory Globe reads.

Impact: The correction removes the identified public security/privacy ambiguity without changing runtime behavior.

Evidence: `README.md:58`, `README.md:70`, `README.md:176`, `README.md:207-209`; documentation correction included in `51f93d12740a6e0860856257ea761377b04c97fb`.

Affected component: Public security/privacy documentation and consent claims

Recommendation: Keep these distinctions in future README updates and continue treating authentication and production hardening as separate gates.

Blocking: NO

### SEC-020

ID: SEC-020

Severity: LOW

Title: Realtime test result depended on ignored local database configuration

Status: CLOSED

Description: The corrected test now injects `Settings.for_tests()`, a disposable in-memory SQLite manager and explicit cleanup. Independent validation reproduced the pass in a clean export with no `.env`, database URL or provider credential.

Impact: Developer-local configuration no longer changes this test result or creates a false integration guarantee. The closure does not validate PostgreSQL or production security.

Evidence: `tests/test_realtime.py:34-38`, `tests/test_realtime.py:156-177`; clean-export focused result `1 passed`; clean-export suite `45 passed`; QA evidence `4497347b6440c03c305cbb54eaccc643d95ced3c`.

Affected component: Python test isolation, secret hygiene and reproducibility

Recommendation: Preserve the explicit test settings, disposable manager and credential-free clean-export gate.

Blocking: NO

## Historical Findings Carried Forward

- `SEC-001` — CRITICAL, Blocking: YES — identity/owner boundary still relies on a client-controlled UUID.
- `SEC-002` — CRITICAL, Blocking: YES — chat, TTS and Obsidian lack an authenticated owner boundary.
- `SEC-003` — CRITICAL, Blocking: YES — least privilege for the real PostgreSQL runtime role remains unproven.
- `SEC-004` — HIGH, Blocking: YES — WebSocket still lacks owner authentication, Origin enforcement and abuse controls.
- `SEC-005` — HIGH, Blocking: YES — global rate limiting, quotas and provider-cost controls remain absent.
- `SEC-008` — HIGH, Blocking: YES — real PostgreSQL TLS with certificate and hostname verification remains unproven.
- `SEC-012` — MEDIUM, Blocking: YES — sensitive actions still lack audit attribution to an authenticated owner.
- `SEC-009`, `SEC-010`, `SEC-011`, `SEC-013`, `SEC-014` — MEDIUM, Blocking: NO — prompt/memory poisoning, declared provenance, environment-dependent embedding safeguards, deployment trust contracts and supply-chain hardening remain open.
- `SEC-015`, `SEC-016` — LOW, Blocking: NO — public health details and plaintext optional browser history remain open.
- `SEC-017` — MEDIUM, Blocking: NO — schema activation evidence depends on lifespan and synthetic harnesses do not prove production schema/authentication/isolation.
- `SEC-018` — LOW, Blocking: NO — the browser harness still requires environment allowlisting and a mandatory destructive-flow sentinel.

## Security Status

- Security Feature Status: APPROVED_WITH_WARNINGS.
- Security result for Integration Candidate `51f93d1`: APPROVED_WITH_WARNINGS.
- `SEC-019`: CLOSED.
- `SEC-020`: CLOSED.
- New Security findings: none.
- New Security feature blockers: none.
- Overall integration gate: still REJECTED by QA solely for external operational blocker `QA-IC-002`.
- Production Readiness: REJECTED / BLOCKED.

## Critical Issues

No new CRITICAL issue. `SEC-001`, `SEC-002` and `SEC-003` remain production blockers.

## High

No new HIGH issue. `SEC-004`, `SEC-005` and `SEC-008` remain production blockers.

## Medium

No new MEDIUM issue. `SEC-012` remains a production blocker; `SEC-009`, `SEC-010`, `SEC-011`, `SEC-013`, `SEC-014` and `SEC-017` remain non-blocking hardening items.

## Low

- `SEC-019` and `SEC-020` are closed.
- `SEC-015`, `SEC-016` and `SEC-018` remain open historical warnings.

## Deploy Blockers

- `SEC-001` — authenticated recognition and authorization of the single owner.
- `SEC-002` — protection of provider-backed endpoints and private Obsidian content.
- `SEC-003` — restricted runtime database role and operational database hardening.
- `SEC-004` — WebSocket authentication, Origin enforcement and abuse limits.
- `SEC-005` — rate limiting, quotas and global operational limits.
- `SEC-008` — PostgreSQL TLS with complete certificate/hostname verification.
- `SEC-012` — attributable audit for sensitive actions.

No deploy blocker was introduced, accepted, closed or reclassified by this focused correction.

## Operational Blocker Outside Security

- `QA-IC-002` remains applicable according to official QA evidence `4497347b6440c03c305cbb54eaccc643d95ced3c`: draft PR #1 names a superseded candidate instead of `51f93d12740a6e0860856257ea761377b04c97fb` and does not identify correction `4d76f2433363a47a9d8fe29fef337de1dc79ac50`.
- Security did not edit the PR and does not close or reclassify this QA-owned blocker.
- PR metadata was not independently readable from the current Security environment; applicability is based on the current official QA report.

## Warnings

- The correction validates test isolation with SQLite in memory; it does not validate real PostgreSQL, migrations, TLS, runtime roles or production data handling.
- The client UUID remains a transient namespace rather than authenticated owner identity.
- Physical deletion still lacks recovery, reauthentication and a one-time approval token.
- The known Starlette/TestClient deprecation warning remains.
- `SEC-018` remains open for the browser harness and is not closed by this Python test correction.

## Good Practices Found

- The test explicitly patches configuration at its boundary instead of changing runtime behavior.
- Disposable SQLite and local hash embeddings keep the focused regression independent of real infrastructure.
- Cleanup occurs in `finally`, reducing leaked test resources.
- Clean-export validation removes `.env`, database URLs and provider credentials.
- README now uses precise language for credential custody, missing owner authentication and chat memory consent.
- Candidate adds no secret and changes no runtime/backend/schema/migration/dependency surface.
- QA keeps PR metadata correctness as a separate operational gate rather than conflating it with the functional correction.
- The Obsidian live retest preserved secret and vault privacy and performed no write when the listener was unreachable.

## Environmental Limits

- No real PostgreSQL/pgvector environment, managed runtime role, TLS chain, backup/restore or migration was validated.
- No Anthropic, Tavily, ElevenLabs or Obsidian content request was made by Security.
- The QA Obsidian retest is `BLOCKED / NOT_TESTED` because the listener was unreachable; it has no Phase 6 gate impact and is not treated as a Security blocker.
- No microphone, speaker, physical device, screen reader, public deployment or production infrastructure was exercised.
- Browser scenarios were not repeated because the correction changes only a Python test fixture and documentation.
- PR metadata was not independently observable from this environment; QA evidence remains authoritative for `QA-IC-002`.

## Recommendation

Record Security as `APPROVED_WITH_WARNINGS` for exact Integration Candidate `51f93d12740a6e0860856257ea761377b04c97fb`, close `SEC-019` and `SEC-020`, and preserve every historical production blocker. Keep the overall Phase 6 integration gate rejected until the Coordinator/owner corrects `QA-IC-002` and QA verifies the metadata-only closure. Do not edit or merge the PR, start a later phase, or infer Production Readiness from this review.

Next Action:

Role: COORDINATOR

Task: persist the exact candidate/correction in coordination state, correct PR metadata only with the required authority, return `QA-IC-002` to QA for metadata-only verification, preserve Production Readiness as blocked, and do not route Phase 7 or deployment.

Target commit: `51f93d12740a6e0860856257ea761377b04c97fb`
