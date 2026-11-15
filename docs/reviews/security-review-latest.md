# Security Review

Commit reviewed: `c649a903693d5fedf631d760880b80ed881dc138`

Functional baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`

Functional sequence reviewed: `2647794ea806b20117c7cce531602911da98ca97`, `744bec0`, `4b91818`, `c649a903693d5fedf631d760880b80ed881dc138`

Documentation/evidence descendant observed: `6919c967c66f728471b5c195079dabda33a3e3ed`

Coordination descendant observed: `08e3984986798dfee0500f6af6cd3f695e57a910`

Current documentation-only branch tip observed at final verification: `768ddfd3beb6e31624d7535edf065c7848805bc5`

Branch: `codex/phase-7-completion`

Phase: 7 — Conversational Presence Foundation

Date: 2026-11-15

## Result

REJECTED

Security rejects the exact Phase 7 Functional Commit because `SEC-021` breaks the `PUBLIC` audience privacy boundary. Selecting `PUBLIC` forces `memory_enabled=false`, but the frontend still forwards the complete recent session history to `/api/chat`, including records that were marked ineligible for persistence and earlier responses that may contain private memory-derived content. A clean-export directed test reproduced the contradiction: memory was disabled while a private sentinel remained in the outbound `history` array.

No other new HIGH or CRITICAL issue was identified in the Phase 7 delta. The bounded presentation enum, static server-owned prompt overlay, voice correlation, speech limit, exact UUID deletion confirmation, safe DOM rendering and public manifest allowlist otherwise preserve the reviewed security boundaries. This rejection does not accept any HIGH risk, authorize a fix, approve the phase, start Phase 8 or authorize production.

Feature Status is `REJECTED` for this candidate. Production Readiness remains independently `REJECTED / BLOCKED` by the historical production findings carried forward below.

## Scope and Commit Boundary

- Reviewed the complete functional delta `ce2bde4..c649a90`, not only the last commit.
- Reviewed the partial TTS checkpoint `2647794`, bounded backend presentation commit `744bec0`, local conversational-presence commit `4b91818` and public homage-boundary correction `c649a90`.
- Confirmed that `c649a90..6919c96`, `c649a90..08e3984` and the final observed descendant `c649a90..768ddfd` change only documentation, evidence images and review/coordination records. They introduce no backend, frontend, test, schema, migration, query, persistence, dependency or provider-runtime delta.
- Database review remains `N/A` for this Phase 7 package because no database, memory repository, schema, migration, query or persistence implementation path changed.
- The working tree was clean when Security began. During the parallel review window, QA and UI/UX began modifying only their own latest reports. Security preserved those concurrent changes and did not edit `docs/handoff.md`.

## Independent Validation

- Exact clean export of `c649a903693d5fedf631d760880b80ed881dc138`; no `.env` was present or read.
- Directed Python security/Phase 7 set: `32 passed`.
- Complete Python suite: `60 passed`, with one known Starlette/TestClient deprecation warning.
- Complete frontend suite: `62 passed`.
- Python compilation: passed.
- JavaScript syntax validation: passed.
- `git diff --check ce2bde4..c649a90`: passed.
- Delta secret-pattern scan: no private-key marker, AWS key, GitHub token, Anthropic key, JWT-like value or generic quoted secret assignment detected.
- Exact `.env` tracked at the target: none. Exact `.env` commit history: none. One `.env.example` remains tracked as expected.
- Phase 7 PNG evidence at the exact Functional Commit was visually inspected and contains synthetic/local labels only; no PNG text, international-text, compressed-text or EXIF metadata chunks were present.
- Directed `PUBLIC` history test: `memory_enabled=false` and `history_contains_private=true` for the same outbound payload.
- No browser runner, uvicorn, microphone, real audio device, paid provider, real PostgreSQL, migration, production service or external integration was executed by Security.

## Findings

### SEC-021

ID: SEC-021

Severity: HIGH

Title: `PUBLIC` audience mode forwards unfiltered private and memory-derived session history

Description: Phase 7 resolves `PUBLIC` by disabling current-turn persistent memory, but it does not create a public-safe history view. `SessionHistory.recent()` returns every visible record, including records with `historyEligible=false`. `ChatController.submit()` snapshots that unfiltered view and `buildChatPayload()` transmits it unchanged as `history`. Therefore a later `PUBLIC` turn can send prior private-turn content or an earlier assistant response containing private memory context back to the model. The generated public-facing answer can then repeat that content even though the interface says the turn is using no private memory.

Impact: Private owner data can be disclosed in an answer intended for a public audience. The issue defeats an explicit privacy control, creates a misleading fail-closed signal and violates the Phase 7 contract that `PUBLIC` blocks private memory context for new turns. Exploitation requires relevant content already present in the same browser session, so this is not a cross-user authentication bypass; however, the security feature itself is materially broken.

Evidence:

- `frontend/js/modes.js:27-35` restricts current-turn memory and optional phrases for `PUBLIC`, but defines no history filtering policy.
- `frontend/js/session-history.js:22-26` filters `historyEligible` only for local persistence; `recent()` returns the unfiltered visible history.
- `frontend/js/chat.js:214` snapshots `this.sessionHistory.recent(20)` and `frontend/js/chat.js:225` passes it to the request.
- `frontend/js/turn-request.js:3-20` transmits the supplied `history` unchanged while setting `memory_enabled` from the mode policy.
- Independent clean-export reproduction returned `{ "memory_enabled": false, "history_contains_private": true }` after adding a `historyEligible=false` private sentinel and building a `PUBLIC` payload.
- `tests/browser/phase-7.mjs:128-131` asserts the request keys and `memory_enabled=false`, while the storage assertions verify only local persistence; no assertion proves that private or memory-derived records are absent from the outbound public history.

Affected component: Phase 7 audience/privacy mode resolution, session history and `/api/chat` request construction

Recommendation: Build a trusted per-turn history projection for `PUBLIC` requests and fail closed to an empty history when a record cannot be proven public-safe. Preserve provenance for private turns and memory-derived assistant responses so they cannot enter a later public payload. Add unit and browser assertions that private, memory-derived and delayed private responses are absent from outbound `PUBLIC` history after mode restoration. Keep the correction within the authorized local boundary unless Planner explicitly authorizes a wire-contract change.

Blocking: YES

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
- `SEC-018` — LOW, Blocking: NO — browser harnesses still inherit a broad process environment and use a fixed port without a mandatory destructive-flow sentinel.
- `SEC-019`, `SEC-020` remain closed.

## Controls Confirmed

### Bounded generation presentation

- `PresentationMode` is a closed `StrEnum`; null, wrong type, case variants, whitespace variants, unknown values and arbitrary instruction text are rejected.
- Invalid values return `422` before service/source/model work.
- Omitted and `NORMAL` presentation preserve the prior effective system prompt exactly.
- Non-default modes append one immutable server-owned `[TURN PRESENTATION]` section below 1,000 Unicode characters.
- No user message, history, memory, web/Obsidian content, model output, identifier, phrase record or private-mode metadata is interpolated into that section.
- Provider endpoint, request keys, model, `max_tokens=1400`, response schema and single-call behavior remain unchanged.
- Core identity, safety, context trust, tool and uncertainty sections remain unchanged; presentation text explicitly subordinates style to safety, truth, uncertainty and confirmations.

### Memory and destructive actions

- `memory_enabled=false` returns before memory context construction and before capture.
- Memory correction/forget commands with memory disabled return without lookup, mutation or deletion confirmation.
- A missing/unavailable manager degrades without claiming a memory mutation.
- `SEC-006` remains effective for retrieval, capture and command gating in the reviewed functional path.
- `SEC-007` remains effective: deletion requires the exact route UUID in `X-Hope-Confirm-Memory-Id`, and repository operations remain scoped by the current user UUID. The UUID is still not authentication.
- Phase 7 changes no memory repository, query, model, schema, migration or cross-user isolation implementation.

### Voice, realtime and local state

- Session, turn, attempt and response-version identity guard state, synthesis completion, playback and amplitude callbacks.
- `SPEAKING` requires a current local playback event; `LISTENING` requires a current recognition callback.
- Uncorrelated `AI_STATE_CHANGED` events are ignored for current local-turn presentation.
- Stop/cancel resets playback, object URLs and amplitude; stale synthesis cannot create or play audio.
- Speech over 5,000 Unicode code points is rejected before the TTS request instead of silently truncating material content.
- WebAudio analyzes only the current local playback element. No new microphone capture, raw audio upload, transcript retention, background listening or amplitude transmission/persistence path was added.

### Public surfaces and untrusted content

- `SelfKnowledge` is a static allowlist rendered with `textContent`; it exposes capability status and limitations without system prompt, chain-of-thought, credentials, owner identifiers or internal paths.
- The homage boundary is original, brief, request-gated and explicitly non-imitative.
- Only exact `P7-PHRASE-006` through `P7-PHRASE-018` exist in the active library. Pending `021` through `028` and rejected/withdrawn records are absent from product code.
- Phrase selection is null by default, requires a module-private trusted marker plus validated evidence, enforces cooldown/suppression and has no mode-entry consumer.
- Assistant Markdown, source titles, public manifest text and memory labels use safe DOM construction; executable URL schemes and active HTML remain rejected/inert.
- Existing CSP, clickjacking protection, MIME sniffing protection, no-store policy and same-origin resource boundaries remain unchanged.

## Security Status

- Phase 7 Feature Status: REJECTED.
- Exact Functional Commit: `c649a903693d5fedf631d760880b80ed881dc138`.
- New findings: one — `SEC-021` HIGH, Blocking: YES.
- New CRITICAL findings: none.
- Historical production blockers closed or accepted: none.
- Production Readiness: REJECTED / BLOCKED.

## Critical Issues

No new CRITICAL issue. Historical `SEC-001`, `SEC-002` and `SEC-003` remain production blockers.

## High

- `SEC-021` is a Phase 7 feature blocker.
- Historical `SEC-004`, `SEC-005` and `SEC-008` remain production blockers.

## Medium

No new MEDIUM finding. Historical `SEC-012` remains a production blocker; `SEC-009`, `SEC-010`, `SEC-011`, `SEC-013`, `SEC-014` and `SEC-017` remain non-blocking hardening items.

## Low

No new LOW finding. Historical `SEC-015`, `SEC-016` and `SEC-018` remain open warnings.

## Deploy Blockers

Phase 7 feature blocker:

- `SEC-021` — prevent private and memory-derived history from entering a later `PUBLIC` turn.

Historical Production Readiness blockers:

- `SEC-001` — authenticated owner identity and authorization.
- `SEC-002` — protection of provider-backed and private integration endpoints.
- `SEC-003` — restricted runtime database role and database hardening.
- `SEC-004` — WebSocket authentication, Origin enforcement and abuse limits.
- `SEC-005` — rate limits, quotas and provider-cost controls.
- `SEC-008` — PostgreSQL TLS certificate and hostname verification.
- `SEC-012` — attributable audit for sensitive actions.

No historical production blocker is accepted, closed or reclassified by this review.

## Warnings

- The Phase 7 browser runner spreads the parent process environment into both child processes and clears only selected variables. This confirms that historical `SEC-018` remains applicable; the harness should run from an explicit allowlist before it is used around sensitive environments.
- Mocked generation proves payload shape and invariants, not real-provider presentation adherence.
- Synthetic PCM and fake recognition/playback prove local state transitions, not microphone, audio quality, autoplay diversity or paid-provider behavior.
- The known Starlette/TestClient deprecation warning remains.
- Public-mode history confidentiality is not covered by the reported five browser scenarios; storage exclusion is not equivalent to outbound-context exclusion.

## Good Practices Found

- Strict server-side enum validation prevents arbitrary prompt text from entering the system overlay.
- `NORMAL` prompt equality and provider payload/call-count invariants have direct regression coverage.
- Memory, web and Obsidian content remain explicitly delimited as untrusted data.
- Current-turn privacy policy is snapshotted, so delayed private responses remain excluded from local persistence after mode restoration.
- Display content remains canonical when speech is disabled, fails or is stopped.
- Safe rendering keeps an explicit HTML/XSS sentinel inert in browser evidence.
- Voice state and amplitude are derived from current local callbacks instead of backend claims or fabricated microphone data.
- Pending and rejected phrases are excluded, and no phrase is the valid default.
- Evidence is labeled as synthetic/local and contains no visible credential, private path or real owner data.
- Phase 7 introduces no dependency, CDN, schema, migration, query, persistent setting, provider or endpoint.

## Environmental Limits

- Security did not run the browser harness because QA owns the shared `8767` browser window and because the committed Development evidence was sufficient for static inspection. Development browser results were reviewed but not treated as independent Security execution.
- No real PostgreSQL/pgvector, runtime role, TLS chain, migration, backup/restore or production data was validated.
- No Anthropic, Tavily, ElevenLabs or Obsidian request was made.
- No microphone, speaker, physical device, manual screen reader, public deployment or production infrastructure was exercised.
- Dependency vulnerability databases were not queried; the Phase 7 delta changes no dependency manifest or CDN.

## Recommendation

Return the candidate to Development for a narrowly scoped correction of `SEC-021`. The correction must prevent private, non-public or memory-derived history from entering `PUBLIC` requests and add deterministic outbound-payload tests, including delayed private responses and mode restoration. Development must produce a new Functional Commit; Security and affected reviewers must re-review that exact hash.

Do not merge or declare Phase 7 approved. Preserve Database as `N/A` only if the correction still changes no persistence/query/schema behavior. Preserve Production Readiness as `BLOCKED` and do not start Phase 8 or deployment.

Next Action:

Role: Development

Status: CHANGES_REQUESTED

Task: Correct `SEC-021` without expanding the authorized Phase 7 boundary, add regression evidence and produce a new Functional Commit.

Target commit: `c649a903693d5fedf631d760880b80ed881dc138`
