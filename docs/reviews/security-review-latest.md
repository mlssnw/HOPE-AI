# Security Review

Commit reviewed: `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5`

Functional baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`

Rejected candidate used as correction baseline: `c649a903693d5fedf631d760880b80ed881dc138`

Documentation descendants observed: `5f125a0` and `b0f9b7f9fe1dd689f7de2d49756e69791eaf249b`

Branch: `codex/phase-7-completion`

Phase: 7 — Conversational Presence Foundation

Date: 2026-11-16

## Result

APPROVED_WITH_WARNINGS

Security approves the exact Phase 7 Functional Commit for feature integration. The correction closes `SEC-021`: outbound history for a `PUBLIC` turn now includes only records that carry explicit, ephemeral `PUBLIC_SAFE` provenance, a `PUBLIC` audience, and no memory-derived marker. Legacy restored records, unlabelled records, private records, memory-derived records, `PUBLIC+PRIVATE` turns and responses completed after a mode switch all fail closed.

This approval is limited to Phase 7 Feature Status. It does not approve public deployment, accept any inherited HIGH or CRITICAL risk, authorize Phase 8, or change Production Readiness. Production Readiness remains `REJECTED / BLOCKED` by the inherited production findings listed below.

## Scope and Commit Boundary

- Reviewed the security-relevant correction delta `c649a90..af2aa66`, with the complete Phase 7 functional baseline retained as context.
- Confirmed that `af2aa66..5f125a0` and `af2aa66..b0f9b7f` contain documentation only. No functional drift exists after the reviewed target.
- The correction changes frontend history provenance/projection, accessibility and voice behavior plus tests. It changes no backend endpoint, request/response field, provider adapter, database path, query, schema, migration, dependency manifest or CDN.
- Database review remains `N/A` for this correction because no database behavior changed.
- The worktree was clean at review start. Security did not edit `docs/handoff.md` because the delegated review window authorized only the owned report and deferred coordination writes.

## Independent Validation

- Created an exact clean export of `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5`; no local `.env` was copied or read.
- Complete Python suite: `60 passed`, with one known Starlette/TestClient deprecation warning.
- Complete frontend suite: `67 passed`.
- Independent adversarial projection test: passed for legacy, private, unknown, memory-derived, explicitly public-safe, `PUBLIC+PRIVATE` and delayed-private records; also confirmed `memory_enabled=false` and the unchanged outbound payload key set.
- Python compilation and JavaScript syntax validation: passed (`49` JavaScript/module files checked).
- `git diff --check c649a90..af2aa66`: passed.
- Delta secret-pattern scan: no credential, private-key, token, password, authenticated database URL or generic quoted-secret assignment detected.
- No exact `.env` is tracked at the target. `.env.example` remains tracked as expected.
- No browser runner, uvicorn service, microphone, real audio device, provider, real PostgreSQL, migration, production system or external integration was executed by Security.
- Development's seven Chrome scenarios, complete Phase 6 browser package and `59.91 FPS` result were read as Development evidence, not adopted as independent Security execution.

## Findings

No new Security finding was identified in the correction delta.

### SEC-021 — CLOSED

ID: SEC-021

Severity: HIGH (original finding)

Title: `PUBLIC` audience history could include private and memory-derived records

Description: The rejected candidate disabled current-turn memory for `PUBLIC` but transmitted unfiltered recent session history. The corrected candidate introduces per-record, ephemeral provenance and a public-only history projection that requires affirmative public-safe evidence.

Impact: The prior Phase 7 privacy-control bypass is no longer reproducible in the reviewed code path. Private, legacy, unknown and memory-derived records do not enter a later outbound `PUBLIC` history payload.

Evidence:

- `frontend/js/session-history.js:8-25` grants `PUBLIC_SAFE` only when the snapshotted turn is `PUBLIC+STANDARD`, the caller explicitly supplies `PUBLIC_SAFE` and `PUBLIC`, and the record is not memory-derived.
- `frontend/js/session-history.js:28-33` assigns restored/legacy records `UNKNOWN` provenance.
- `frontend/js/session-history.js:56-61` filters public history to the exact public-safe predicate and strips provenance from the wire representation.
- `frontend/js/chat.js:207-222` snapshots the policy before asynchronous work, projects history with `recentFor()`, and marks only a `PUBLIC+STANDARD` user turn public-safe.
- `frontend/js/chat.js:237-247` uses the same snapshotted policy for the completed response and refuses public-safe provenance when `memoriesUsed` is non-empty.
- `tests/frontend/session-history.test.mjs` covers legacy, private, unlabelled and memory-derived exclusion, as well as `PUBLIC+PRIVATE` fail-closed behavior.
- `tests/browser/phase-7.mjs` asserts an empty first public history, allows only proven public-safe context later, excludes legacy/private/delayed-private content and preserves visible history.
- Security's clean-export adversarial test independently confirmed the projection and unchanged request shape.

Affected component: Phase 7 session history, audience/privacy policy and `/api/chat` request construction

Recommendation: Keep provenance ephemeral and fail closed. Any future source type or history restoration format must remain excluded from `PUBLIC` until its public-safe status is proven by a server-authoritative design and independently reviewed.

Blocking: NO — CLOSED for `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5`

## Historical Findings Carried Forward

- `SEC-001` — CRITICAL, Blocking: YES — owner identity still relies on a client-controlled UUID.
- `SEC-002` — CRITICAL, Blocking: YES — chat, TTS and Obsidian still lack an authenticated owner boundary.
- `SEC-003` — CRITICAL, Blocking: YES — least privilege for the real PostgreSQL runtime role remains unproven.
- `SEC-004` — HIGH, Blocking: YES — WebSocket still lacks owner authentication, Origin enforcement and abuse controls.
- `SEC-005` — HIGH, Blocking: YES — global rate limiting, quotas and provider-cost controls remain absent.
- `SEC-008` — HIGH, Blocking: YES — real PostgreSQL TLS certificate and hostname verification remain unproven.
- `SEC-012` — MEDIUM, Blocking: YES — sensitive actions still lack audit attribution to an authenticated owner.
- `SEC-009`, `SEC-010`, `SEC-011`, `SEC-013`, `SEC-014` — MEDIUM, Blocking: NO — prompt/memory poisoning, declared provenance, environment-dependent embedding safeguards, deployment trust contracts and supply-chain hardening remain open.
- `SEC-015`, `SEC-016` — LOW, Blocking: NO — public health detail and optional plaintext browser history remain open.
- `SEC-017` — MEDIUM, Blocking: NO — schema activation evidence still depends on lifespan and non-standard managers can bypass that evidence.
- `SEC-018` — LOW, Blocking: NO — browser harnesses still inherit a broad process environment and use fixed ports without a mandatory destructive-flow sentinel.
- `SEC-019`, `SEC-020` and `SEC-021` remain closed.

## Controls Confirmed

### Public-history trust boundary

- A `PUBLIC` request filters before payload construction and sends only explicitly proven public-safe records.
- Legacy/restored records and records without provenance default to `UNKNOWN` and are excluded.
- Private turns, `PUBLIC+PRIVATE` turns and memory-derived assistant responses cannot receive public-safe provenance.
- The policy is captured before the asynchronous request, so a delayed private response cannot become public-safe after the UI mode changes.
- A contaminated record cannot make a later chain public-safe; each record must independently meet the exact predicate.
- Proven public-safe context remains usable in later `PUBLIC+STANDARD` turns.
- Visible history and the consent-based persistable subset remain intact. Provenance is not written to local storage or sent over the wire; restored records therefore return as unknown and fail closed.
- The existing request/storage shape is unchanged; no new field, endpoint, schema or migration was introduced.

### Memory and destructive actions

- `PRIVATE` and `PUBLIC` continue to resolve `memory_enabled=false` before submission.
- `memory_enabled=false` returns before retrieval/context construction and capture, and memory correction/forget commands do not look up, mutate or create deletion confirmations.
- `SEC-006` remains effective for retrieval, capture, commands and deletion gating in the reviewed path.
- `SEC-007` remains effective: deletion requires the exact route UUID in `X-Hope-Confirm-Memory-Id`, and repository operations remain scoped by the current user UUID. The UUID is still not authentication.
- Disabled memory does not fall back to the prior manager/service path; the Phase 7 correction does not modify those backend boundaries.

### Presentation, voice and public surfaces

- The presentation mode remains a closed enum with a static server-owned overlay; arbitrary prompt text cannot enter that overlay.
- Voice state continues to require correlated local playback/recognition events; stale callbacks and duplicate same-state transitions are rejected.
- Starting recognition stops active playback and releases local audio analysis state before listening begins.
- Assistant Markdown and source text remain rendered through safe DOM construction; executable protocols and active HTML remain inert/rejected.
- `SelfKnowledge` remains a versioned public allowlist without secrets, system prompt, owner identifiers, chain-of-thought or internal paths.
- Exact UUID deletion confirmation, enum validation, phrase allowlisting and the prior XSS/CSP/header controls are unchanged by this correction.

## Security Status

- Phase 7 Feature Status: `APPROVED_WITH_WARNINGS`.
- Exact Functional Commit: `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5`.
- `SEC-021`: CLOSED.
- New findings: none.
- New CRITICAL or HIGH findings: none.
- Historical production blockers closed or accepted: none.
- Production Readiness: `REJECTED / BLOCKED`.

## Critical Issues

No new CRITICAL issue. Historical `SEC-001`, `SEC-002` and `SEC-003` remain production blockers.

## High

No new HIGH issue. `SEC-021` is closed. Historical `SEC-004`, `SEC-005` and `SEC-008` remain production blockers.

## Medium

No new MEDIUM finding. Historical `SEC-012` remains a production blocker; `SEC-009`, `SEC-010`, `SEC-011`, `SEC-013`, `SEC-014` and `SEC-017` remain non-blocking hardening items.

## Low

No new LOW finding. Historical `SEC-015`, `SEC-016` and `SEC-018` remain open warnings.

## Deploy Blockers

Phase 7 feature blockers: none from Security for the reviewed Functional Commit.

Historical Production Readiness blockers:

- `SEC-001` — authenticated owner identity and authorization.
- `SEC-002` — protection of provider-backed and private integration endpoints.
- `SEC-003` — restricted runtime database role and database hardening.
- `SEC-004` — WebSocket authentication, Origin enforcement and abuse limits.
- `SEC-005` — rate limits, quotas and provider-cost controls.
- `SEC-008` — PostgreSQL TLS certificate and hostname verification.
- `SEC-012` — attributable audit for sensitive actions.

No inherited production blocker is accepted, closed or reclassified by this review.

## Warnings

- The Phase 7 browser runner still spreads the parent process environment into child processes and clears only selected variables. Historical `SEC-018` remains applicable; use an explicit environment allowlist before running the harness around sensitive environments.
- Browser, physical microphone, screen-reader, provider and performance claims were not independently executed by Security.
- The known Starlette/TestClient deprecation warning remains.
- Public-safe provenance is intentionally ephemeral. After a page reload, previously public-safe history becomes unknown and is excluded from later public requests. This is privacy-safe but may reduce continuity.

## Good Practices Found

- The correction uses affirmative, per-record trust rather than inferring safety from the current UI mode.
- Unknown and restored content fails closed.
- The asynchronous response retains the original turn policy instead of consulting mutable current state.
- Wire and storage formats strip security metadata, preventing a client-restored label from becoming trusted automatically.
- Public-safe history remains useful without weakening private-record exclusion.
- Exact outbound-payload tests now distinguish local persistence from transmission to the model.
- The correction introduces no backend, provider, database, dependency, CDN or Phase 8 surface.
- Secrets were absent from the correction delta, fixtures and diagnostic output reviewed by Security.

## Environmental Limits

- No real PostgreSQL/pgvector, runtime role, TLS chain, migration, backup/restore or production data was validated.
- No Anthropic, Tavily, ElevenLabs or Obsidian request was made.
- No browser, microphone, speaker, physical device, manual screen reader, public deployment or production infrastructure was exercised.
- Dependency vulnerability databases were not queried because the correction changes no dependency manifest or CDN.
- Development browser evidence is not equivalent to independent Security execution.

## Recommendation

The Coordinator may treat Security's Phase 7 re-review as `APPROVED_WITH_WARNINGS` for Functional Commit `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5` and mark `SEC-021` closed. Continue the remaining required reviews on that exact hash before phase integration.

Keep Production Readiness `BLOCKED` by `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `SEC-008` and `SEC-012`. Do not represent this feature approval as public-deployment approval, do not accept any inherited HIGH/CRITICAL risk, and do not start Phase 8 through this review.

Next Action:

Role: Coordinator

Status: SECURITY_REVIEW_COMPLETE

Task: Record Security `APPROVED_WITH_WARNINGS`, close `SEC-021`, preserve inherited production blockers, and continue review consolidation for the exact Functional Commit.

Target commit: `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5`
