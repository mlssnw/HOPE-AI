# Security Review

Integration Candidate reviewed: `20843a4568ca6eba67d66f93234412038ca79199`

Functional Commit: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`

Functional baseline: `88e194778b4399a6713f118470f9d861c553cd9e`

Phase: 6 — Target UI Convergence

Date: 2026-09-22

## Result

APPROVED_WITH_WARNINGS

The exact Integration Candidate `20843a4568ca6eba67d66f93234412038ca79199` is approved with warnings for Phase 6 integration in the local/controlled scope. The candidate is documentation-only and introduces no functional drift from the previously reviewed Functional Commit `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`.

The documentation preserves the existing trust boundaries, memory-consent behavior, UUID-bound destructive confirmation, honest capability classifications and production blockers. Two new LOW, non-blocking findings record public README wording broader than the implemented controls (`SEC-019`) and a Python realtime test whose result depends on local database configuration (`SEC-020`).

This result does not accept any HIGH or CRITICAL risk and does not authorize public exposure, production deployment, merge, provider use, database changes or a later phase. Production Readiness remains `REJECTED / BLOCKED` by `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `SEC-008` and `SEC-012`.

The superseded candidates `cf9cd976549163d1f49cead7bc2f993254150708` and `d83e57d237d1ddd10a0f64ae833aa92c0b2e9d71` are not approved by this report.

## Scope and Commit Boundary

- Exact candidate reviewed: `20843a4568ca6eba67d66f93234412038ca79199`.
- Functional artifact preserved: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`.
- Branch observed: `codex/phase-6-target-ui`.
- HEAD observed before this report: `ee0de959eadd49eaccbdc6952781d5e403cb3761`, a coordination-only commit after the candidate.
- During the review, HEAD advanced to QA's documentation-only review commit `531b34c`; that commit does not change the candidate or Functional Commit.
- `0912e94..20843a4` changes 17 documentation files and no backend, frontend, test, migration, dependency, runtime configuration or secret-bearing file.
- `15ebaea..20843a4` is limited to the README language/focus cleanup, language-policy reconciliation, `AGENTS.md` policy alignment and coordination handoff.
- The four pre-existing untracked items (`Hope dashboard` and three `hope-linkedin-hero*` assets) were preserved and excluded from this review commit.

## Independent Validation

- `git diff --check 0912e94..20843a4`: passed.
- Functional-tree comparison across `backend/`, `frontend/`, `tests/`, `migrations/`, dependency manifests and runtime configuration: no drift.
- Candidate delta secret-pattern scan: no private-key marker, Anthropic secret prefix, GitHub token prefix, AWS access-key prefix or JWT-like value added.
- Tracked environment files: only `.env.example`; no `.env` credential file is tracked in the candidate.
- README relative-link check: 24 checked, 0 missing.
- Workspace Python regression: 45 passed with one pre-existing Starlette/TestClient deprecation warning, but this result inherited the local ignored `.env`.
- Independent QA clean-export regression: 44 passed, 1 failed and 1 warning. `tests/test_realtime.py::test_chat_publishes_ai_state_for_same_user` expects a memory-search event only produced when local database configuration causes `create_app()` to construct a memory manager.
- The affected test path constructs a database engine from configuration but does not enter the application lifespan, open a session or execute a query. No database contact or mutation was observed in that path; the confirmed problem is environment coupling and non-reproducible assurance.
- Frontend regression: 36 passed.
- Browser validation was not repeated because the candidate has no functional drift. The earlier Phase 6 browser evidence remains historical evidence for `0912e94`, not new production proof.
- No paid provider, real PostgreSQL instance, migration, credential, personal content or external system was exercised.
- Draft PR metadata could not be independently inspected from the current environment; the security decision is bound to the locally verified immutable commit hash, not to mutable PR state.
- QA subsequently reported that draft PR #1 still names superseded candidate `cf9cd97`; this blocks the overall integration gate independently of the Security result.

## Controls Confirmed

### Trust boundaries and authorization claims

- The README explicitly states that `X-Hope-User-Id` is a development namespace and **not authentication**.
- `SINGLE_USER` remains a product model, not a substitute for owner authentication, authorization or privacy controls.
- The documentation keeps owner recognition, protected sessions, resource authorization and permission management as planned work.
- Public deployment remains explicitly disabled; draft PR or merge status is not represented as Production Readiness.
- Phase 7 and later capabilities remain planned/not authorized and are not presented as implemented.

### Memory consent and destructive actions

- The implementation remains unchanged: `memory_enabled=false` blocks chat memory recovery, capture, correction and forget commands server-side.
- Existing-memory browsing through the Memory Globe remains separate from chat memory consent and therefore still depends on the future authenticated owner boundary.
- Memory deletion still requires the exact route UUID in `X-Hope-Confirm-Memory-Id`; absent or mismatched confirmation returns HTTP 428.
- No documentation change weakens the requirement for an explicit, unambiguous destructive target.
- `SEC-006` and `SEC-007` remain effective for the functional scope.

### Untrusted content, secrets and capability honesty

- Web, Obsidian, memory and external content remain classified as untrusted data rather than system instructions.
- The candidate introduces no secret, credential, token, executable content, unsafe rendering claim or new integration permission.
- Implemented, partial and planned capabilities remain separated in architecture, roadmap and public status material.
- SelfKnowledge remains prohibited from exposing system prompts, protected rules, secrets, credentials, private chain-of-thought, owner data or nonexistent capabilities.
- The language-policy change does not weaken security terminology or authorize translation to alter historical finding meaning. PT-BR remains required for the public README and owner-facing status while technical records may remain canonical in English.

## Findings

### SEC-019

ID: SEC-019

Severity: LOW

Title: Public README contains security and consent wording broader than the implemented controls

Description: The README states that provider adapters are “protected by the backend” and that persistent-memory data is processed “only when authorized in chat.” Credentials are kept server-side, but chat, TTS and Obsidian endpoints still lack authenticated owner protection (`SEC-002`). Separately, the chat opt-in correctly gates chat recovery, capture and commands, but the Memory Globe initializes and retrieves existing graph data independently of that toggle. Later README sections correctly state that public deploy is disabled, the UUID is not authentication, and disabling chat memory does not delete existing memories, which reduces but does not eliminate the ambiguity.

Impact: A reader may infer authenticated provider protection or a global consent gate over every read of existing memory, creating an inaccurate privacy/security expectation. The implementation itself is unchanged and the explicit production warnings substantially limit the practical impact.

Evidence: `README.md:59`, `README.md:71`, `README.md:175`, `README.md:206-210`; `frontend/js/app.js:5-7`; `frontend/js/memory-globe-controller.js:13-25`, `frontend/js/memory-globe-controller.js:157-169`; `frontend/js/chat.js:117-130`; `backend/ai/orchestrator.py:297-342`.

Affected component: Public security/privacy documentation and consent claims

Recommendation: In a Coordinator-owned documentation cleanup, replace “protected by the backend” with a precise statement that credentials remain server-side while owner authentication is pending. Clarify that chat opt-in gates chat recovery/capture/commands, while already stored memories may still be loaded for the Memory Globe in the current local/controlled interface.

Blocking: NO

### SEC-020

ID: SEC-020

Severity: LOW

Title: Realtime test result depends on ignored local database configuration

Description: `tests/test_realtime.py::test_chat_publishes_ai_state_for_same_user` calls `create_app(FakeServices())` without passing a disposable memory manager or explicitly clearing database configuration. `Settings.from_env()` loads the ignored local `.env`; when `DATABASE_URL` exists, `create_app()` constructs a database engine and memory manager and the expected `searching` event appears. In a clean export without that configuration, the manager is absent and the test fails. The observed test path does not enter lifespan or execute a query, so no real database access or mutation was demonstrated.

Impact: Local secrets/configuration unnecessarily influence a test process and can turn a developer-local pass into a false integration guarantee. Future fixture changes could also make unintended external database access easier if environment isolation remains implicit.

Evidence: `tests/test_realtime.py:155-172`; `backend/config.py:84-95`; `backend/main.py:27-63`; QA clean-export evidence in `docs/reviews/qa-latest.md` (`QA-IC-001`).

Affected component: Python test isolation, secret hygiene and reproducibility

Recommendation: Make the test self-contained by passing an explicit disposable manager or explicit no-memory configuration, and run the suite under an allowlisted test environment that clears database/provider credentials. Require a clean-export pass before the integration gate is reopened.

Blocking: NO for the independent Security verdict; QA has separately classified the reproducibility failure as a blocking integration defect.

## Historical Findings Carried Forward

- `SEC-001` — CRITICAL, Blocking: YES — identity/owner boundary still relies on a client-controlled UUID. Require server-side recognition of the single owner and resource authorization before remote exposure.
- `SEC-002` — CRITICAL, Blocking: YES — chat, TTS and Obsidian lack an authenticated owner boundary. Protect provider-backed and private-content endpoints before exposure.
- `SEC-003` — CRITICAL, Blocking: YES — least privilege for the real PostgreSQL runtime role remains unproven. Activate and validate a restricted runtime role operationally.
- `SEC-004` — HIGH, Blocking: YES — WebSocket still lacks owner authentication, Origin enforcement and abuse controls. Require an authenticated handshake and connection/message limits.
- `SEC-005` — HIGH, Blocking: YES — global rate limiting, quotas and provider-cost controls remain absent.
- `SEC-008` — HIGH, Blocking: YES — real PostgreSQL TLS with certificate and hostname verification remains unproven.
- `SEC-012` — MEDIUM, Blocking: YES — sensitive actions still lack audit attribution to an authenticated owner.
- `SEC-009`, `SEC-010`, `SEC-011`, `SEC-013`, `SEC-014` — MEDIUM, Blocking: NO — prompt/memory poisoning, declared provenance, environment-dependent embedding safeguards, deployment trust contracts and supply-chain hardening remain open.
- `SEC-015`, `SEC-016` — LOW, Blocking: NO — public health details and plaintext optional browser history remain open.
- `SEC-017` — MEDIUM, Blocking: NO — schema activation evidence depends on lifespan and synthetic harnesses do not prove production schema/authentication/isolation.
- `SEC-018` — LOW, Blocking: NO — the browser harness inherits a broad environment and its destructive flow relies on operational rather than cryptographic/sentinel isolation.

## Security Status

- Feature Status: APPROVED_WITH_WARNINGS.
- Integration Candidate: APPROVED_WITH_WARNINGS.
- Production Readiness: REJECTED / BLOCKED.
- New findings: `SEC-019` and `SEC-020` — LOW, Blocking: NO.
- New HIGH/CRITICAL findings: none.
- New feature blockers: none.
- Existing production blockers closed: none.

## Critical Issues

No new CRITICAL issue in the candidate. `SEC-001`, `SEC-002` and `SEC-003` remain production blockers.

## High

No new HIGH issue in the candidate. `SEC-004`, `SEC-005` and `SEC-008` remain production blockers.

## Medium

No new MEDIUM issue in the candidate. Existing non-blocking hardening findings remain open, including `SEC-017`.

## Low

- `SEC-019` — public README wording may overstate authenticated backend protection and global consent coverage.
- `SEC-020` — realtime test behavior depends on ignored local database configuration and is not reproducible in a clean export.
- `SEC-018`, `SEC-015` and `SEC-016` remain open historical warnings.

## Deploy Blockers

- `SEC-001` — authenticated recognition and authorization of the single owner.
- `SEC-002` — protection of provider-backed endpoints and private Obsidian content.
- `SEC-003` — restricted runtime database role and operational database hardening.
- `SEC-004` — WebSocket authentication, Origin enforcement and abuse limits.
- `SEC-005` — rate limiting, quotas and global operational limits.
- `SEC-008` — PostgreSQL TLS with complete certificate/hostname verification.
- `SEC-012` — attributable audit for sensitive actions.

No deploy blocker was introduced, accepted, closed or reclassified by the documentation-only candidate.

## Warnings

- `SEC-019`: public wording should distinguish server-side secret custody from authenticated endpoint protection and chat consent from existing-memory browsing.
- `SEC-020`: tests should clear database/provider credentials by default and inject only explicit disposable configuration.
- `SEC-018`: destructive browser scripts should continue to run only through the documented disposable harness until environment allowlisting and a mandatory sentinel are implemented.
- Client-provided UUID remains a transient namespace, not proof of owner identity.
- Memory deletion remains physical and lacks recovery, reauthentication and one-time approval; exact-UUID confirmation reduces target error but does not replace production hardening.
- Browser fixtures, synthetic WebGL data, local PCM and unit tests do not validate real providers, real PostgreSQL, physical devices or production infrastructure.

## Good Practices Found

- The public README clearly labels deployment as unavailable and the client UUID as non-authenticating.
- Phase 6 is the only active implementation scope; later phases are separated into roadmap documents and remain unauthorized.
- The candidate preserves the exact Functional Commit and does not conceal the legacy runtime-version label.
- Chat memory consent remains opt-in, explicit and separate from local history.
- Destructive confirmation remains bound to the exact memory UUID.
- Untrusted memory/web/Obsidian content remains delimited from system authority.
- Planned capabilities, SelfKnowledge and personality references are constrained by explicit disclosure and non-impersonation rules.
- The language policy preserves PT-BR for the public README and owner-facing decisions without allowing translation to change technical security meaning.
- No secret pattern or functional file was added by the candidate.

## Environmental Limits

- No real PostgreSQL/pgvector environment, managed database role, TLS chain, backup/restore or migration was validated.
- No Anthropic, Tavily, ElevenLabs or Obsidian request was made.
- No microphone, speaker, physical mobile device, screen reader or native browser zoom control was exercised.
- Browser scenarios were not rerun because the candidate has no functional drift; prior browser results remain evidence only for `0912e94`.
- Draft PR state was not independently observable from this environment; the immutable local candidate hash was verified directly.
- The workspace Python pass inherited an ignored local `.env`; the clean-export QA run failed one test and is the authoritative reproducibility evidence.

## Recommendation

Security approves Integration Candidate `20843a4568ca6eba67d66f93234412038ca79199` with warnings within its review domain. The overall integration must not proceed while QA blockers `QA-IC-001` and `QA-IC-002` remain open. Keep Production Readiness blocked, preserve every historical production blocker, route `SEC-019` to a Coordinator-owned documentation cleanup and address `SEC-020` alongside the QA test-isolation correction without expanding the Phase 6 functional scope.

Next Action:

Role: COORDINATOR

Task: record Security as `APPROVED_WITH_WARNINGS` for Integration Candidate `20843a4568ca6eba67d66f93234412038ca79199`; keep the overall integration rejected/changes-requested while `QA-IC-001` and `QA-IC-002` are open; preserve production blockers; track `SEC-019` and `SEC-020`; do not merge, start a later phase or infer deployment authorization.

Target commit: `20843a4568ca6eba67d66f93234412038ca79199`
