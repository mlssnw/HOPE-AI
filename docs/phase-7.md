# Phase 7 — Conversational Presence Foundation

## Phase Status

- Planning status: `APPROVED`
- Phase plan decision: `ARCH-2026-09-20-002`
- Authorization reconciliation: `ARCH-2026-09-25-001`
- Completion authorization reconciliation: `ARCH-2026-11-14-001`
- Approved parent direction: `ARCH-2026-09-20-001` — owner approval on 2026-09-20
- Implementation authorization: `APPROVED` by the owner on 2026-09-25, recorded by the Coordinator in `cdb40098489d28dd476a2b9c211cd6289a325888`
- Implementation status: `IN_PROGRESS` — Development may complete the approved package; the complete phase is not yet ready for review
- Feature status: `IN_PROGRESS`
- Phase 7 Functional Commit: `NONE`
- Functional baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2` on `main`
- Production Readiness: `BLOCKED`
- Environment boundary: local/controlled

The owner approved this exact plan and authorized implementation strictly within the boundaries below. On 2026-11-14, `ARCH-2026-11-14-001` reconciled the later instruction to complete Phase 7 and authorized the previously presented bounded generation amendment. The partial checkpoint does not establish completion of the Phase 7 acceptance criteria; one complete Functional Commit and independent reviews are still required.

## Development checkpoint — 2026-11-14

- Partial functional checkpoint: `2647794ea806b20117c7cce531602911da98ca97`. It prevents silent TTS truncation by rejecting speech over the existing 5,000-code-point limit before a request; the complete displayed answer remains available through the existing chat path. This is not the complete Phase 7 Functional Commit.
- Development validation on the worktree: 38 frontend tests and 45 Python tests passed; Python reported one Starlette/TestClient deprecation warning. Python compilation and JavaScript syntax checks passed. These results include the other uncommitted worktree changes and are not an independent review of the checkpoint commit.
- The browser harness was not rerun because it overwrites existing modified Phase 6 evidence. No browser, accessibility or visual-review result is claimed for this checkpoint.
- The owner directed that the product remain HOPE. Identity restoration was applied only in the working tree and is not part of the checkpoint commit. An existing internal database filename, `kelex_local.db`, remains referenced to avoid disconnecting existing data; the file and its contents were not changed or queried.
- Other preexisting worktree changes, including UI/runtime changes and historical evidence, remain uncommitted and are not adopted by this checkpoint. The Coordinator's handoff changes remain separately owned.
- This checkpoint alone did not authorize the generation amendment or mark the phase `READY_FOR_REVIEW`. The later owner authorization is recorded separately in `ARCH-2026-11-14-001`; it does not convert this partial checkpoint into a complete candidate.

## Current completion authorization — 2026-11-14

- Active Planner decision: [`ARCH-2026-11-14-001`](reviews/architecture-latest.md#current-decision-and-authorization-source).
- The owner authorized completion of Phase 7 including the exact one-field/one-section generation amendment previously presented in `ARCH-2026-11-06-001`. No repeat owner approval is required for that bounded implementation.
- Development may proceed after the documentation-only reconciliation commit. The complete Phase 7 Functional Commit remains `NONE` until Development delivers one exact candidate.
- The complete UI/UX specification is `APPROVED`. Only exact `P7-PHRASE-006` through `P7-PHRASE-018` are approved for implementation; `P7-PHRASE-021` through `P7-PHRASE-028` remain pending, excluded and non-blocking.
- Required post-implementation reviews on the same future hash are QA `YES`, Security `YES` and UI/UX `YES`. Database remains `NO` only while implementation has no persistence, query, schema or database behavior.
- Production Readiness remains `BLOCKED`. This authorization does not start Phase 8, change HOPE identity, accept HIGH/CRITICAL risk, authorize a paid/provider test, alter infrastructure or permit deployment.

## Historical generation-boundary gate — 2026-11-06

This section preserves the earlier blocker as historical evidence. Its approval gate was narrowly superseded by `ARCH-2026-11-14-001`; its technical boundary remains the basis of the active contract below.

- Planner decision: [`ARCH-2026-11-06-001`](reviews/architecture-latest.md#ruling).
- Existing plan/implementation authorization remains approved within the original scope; no Phase 7 Functional Commit exists.
- The complete UI/UX specification and first exact phrase package are now persisted. Only `P7-PHRASE-006` through `P7-PHRASE-018` are approved. `P7-PHRASE-021` through `P7-PHRASE-028` remain pending, excluded and non-blocking.
- New technical blocker: selected answer-native style requires a generation signal, but this plan prohibits preference transmission, system-prompt changes and backend API expansion. Reusing an existing personality state does not resolve that prohibition.
- Historical status at that time: full Phase 7 implementation/delivery `BLOCKED`; generation amendment `WAITING_FOR_APPROVAL`; escalation `USER`.
- The Planner proposed exactly one optional `presentation_mode` enum on existing `/api/chat` and one bounded static server-authored presentation section in the existing system text. That exact contract is now authorized by `ARCH-2026-11-14-001`; it was not authorized when this historical gate was written.
- Independent authorized local contracts may continue. The ruling explicitly bounds local event correlation, rejection of uncorrelated remote state, safe overlength speech behavior and prevention of later persistence of private turns.
- No frontend phrase wrapper, hidden user-message instruction or canonical-answer post-processing may substitute for the required generation behavior.
- This dated gate no longer controls active routing. Coordinator-owned operational status is reconciled separately.

## Objective

Create a local, deterministic and provider-neutral foundation for HOPE's conversational presence: separate displayed responses from spoken responses, control turns and cancellation, project truthful states in the interface, define speech and original-personality contracts, and react locally to the amplitude of audio already being played.

## Problem

Phase 6 provides chat, browser dictation, optional TTS and basic voice states, but it does not provide formal contracts for spoken presentation, turn lifecycle, stale-callback rejection, combinable modes, original surface language or safe public `SelfKnowledge`. Expanding directly into streaming, wake word or voice profiling would create privacy, identity, provider and cost dependencies before Phase 8.

## Current State

- Phase 6 is complete and integrated into `main` through `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`.
- Phase 7 has no complete Functional Commit; the bounded TTS checkpoint is recorded above.
- The displayed response is currently also the source used for speech.
- `frontend/js/voice.js` uses the Web Speech API for dictation; the backend has optional TTS coupled to ElevenLabs.
- Cancellation and protection against stale audio exist in the current flow but do not form a reusable turn contract.
- The Core Orb and status already reflect real listening/speaking signals and must remain truth-based.
- Owner identity is still represented by a browser-controlled UUID; Phase 7 does not repair that trust boundary.
- `ARCH-2026-09-20-001`, the product vision, the roadmap and the personality/public-`SelfKnowledge` policy are approved.
- The owner authorized only the Phase 7 scope defined here. No new voice provider, persistence, infrastructure or production capability is authorized.

## Constraints

- Preserve `SINGLE_USER`, cloud-first and provider-agnostic direction without anticipating Phase 8.
- Use only capabilities and flows already available in the local/controlled environment.
- Add no new transmission of audio, transcript, profile or telemetry. The sole preference-transmission exception is the optional bounded `presentation_mode` field defined below.
- Change no schema, migration, real PostgreSQL instance, secret, credential or cost.
- Do not present wake word, speaker verification, streaming, cross-device behavior or integrations as functional.
- Displayed text remains canonical. A spoken form must never omit safety, uncertainty, confirmation requirements or material consequences.
- External content, memory and model output remain untrusted data and cannot activate modes or grant permission.
- The approved personality boundary permits only original recognition or homage after an explicit request. Literal famous quotes, copied dialogue, identity imitation, voice cloning and sustained character performance remain prohibited.
- Every exact `PhraseLibrary` entry is individually owner-gated under the protocol in this plan.

## Options

### Option A — Extend the current voice controller as one monolithic unit

- Pros: fewer initial files; direct integration with the existing flow.
- Cons: mixes formatting, turns, state, playback, modes and personality; increases race risk and weakens isolated testing.
- Cost: low initially, increasing with realtime voice.
- Complexity: low initially; high to maintain.
- Security impact: privacy and cancellation boundaries remain implicit.
- Database impact: none in the intended scope, but persistence may be introduced without a clear gate.
- Maintenance impact: high coupling to browser behavior and the current TTS path.

### Option B — Small components with pure contracts and a voice facade

- Pros: separates content, state and effect; supports deterministic testing; reduces provider coupling; enables gradual evolution.
- Cons: requires explicit contracts and disciplined integration even without adding a new capability.
- Cost: low to medium; no new provider cost.
- Complexity: medium and localized.
- Security impact: modes, cancellation and disclosures can be tested as independent boundaries.
- Database impact: none; phase state remains ephemeral.
- Maintenance impact: lower; contracts can be reused by future web and installed clients.

## Recommendation

Adopt Option B. Phase 7 introduces the local presentation/orchestration layer and preserves the current endpoints and provider transport. The only authorized request expansion is the optional `presentation_mode` field on existing `POST /api/chat`. Any need for another field, provider, audio endpoint, storage, profile, device or external effect invalidates the approved scope and returns to the Planner.

## Rationale

Separating canonical response, spoken representation and turn state solves an existing problem without crossing the future authentication and permission boundary. Pure components allow meaning, cancellation, accessibility and original personality to be validated before the project assumes operational cost or processes a new sensitive data class.

## Scope

- Explicit separation between `DisplayResponse` and `SpokenResponse`.
- Deterministic `SpeechFormatter` with no network or persistence.
- `TurnManager` for turn identity, invalidation, cancellation and stale callbacks.
- `VoiceStateManager` as the operational state machine and single source for accessible status.
- `VoiceManager` as a facade over existing capabilities, without a new provider or data flow.
- Provider-neutral prosody and pronunciation contracts; no provider-specific SSML outside a future adapter.
- Original `PhraseLibrary` with categories, context, cooldown and lower precedence than substantive content, subject to the individual phrase-approval gate.
- Deterministic resolution of combinable modes across independent axes.
- One optional per-turn `presentation_mode` selector and one bounded server-authored generation overlay for non-default style values.
- Static, versioned public-safe `SelfKnowledge` manifest.
- Local and ephemeral amplitude from audio HOPE is already playing, bounded to `voiceLevel 0.0..1.0`.
- Accessible states, controls and messages compatible with the current visual contracts.
- Proportional tests and evidence with no paid call or real database.

## Non-goals

- New cloud STT/TTS, provider replacement or audio streaming.
- New endpoint, response schema, header, WebSocket contract, provider payload shape, provider fallback or external-service capability negotiation. The sole request-body exception is the optional `presentation_mode` enum on existing `POST /api/chat`.
- Foreground or background wake word.
- Speaker verification, voice profile, biometrics or retention of audio/transcripts.
- Cross-device sessions, device registration, location or native clients.
- New persistence, durable preference, table, migration, query or PostgreSQL change.
- Tools, agents, coding, automation, integrations or any external effect.
- Provider selection, license, credential, secret, budget or cost.
- Owner authentication, `PermissionManager` or anticipation of Phase 8.
- Deployment, remote access, production or acceptance of HIGH/CRITICAL risk.
- Changes to core personality/safety rules, existing prompt sections/order or `AGENTS.md`. The sole system-text exception is the static per-turn presentation section defined below.
- Phase 8 or any later phase.

## Dependencies

- Phase 6 integrated into `main` at `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`.
- `ARCH-2026-09-20-001`, `docs/product-vision.md` and `docs/roadmap.md` approved by the owner.
- Phase 7 plan and implementation authorization granted by the owner and reconciled by `ARCH-2026-09-25-001`.
- Current state, accessibility, reduced-motion and truthfulness contracts in `docs/design/`.
- Complete pre-implementation UI/UX specification: satisfied and `APPROVED`.
- Individual owner decision for every exact phrase intended for implementation: satisfied for `P7-PHRASE-006` through `P7-PHRASE-018`; pending `021` through `028` are excluded.
- Owner authorization for the bounded generation amendment: satisfied by `ARCH-2026-11-14-001`.

## Architecture

```text
Canonical model response
          │
          ├──────────────► DisplayResponse ──► Chat UI
          │
          ▼
   SpeechFormatter
          │
          ├── ProsodyHints / PronunciationHints
          └──────────────► SpokenResponse
                                  │
                                  ▼
TurnManager ───────────────► VoiceManager ──► existing playback path
     │                            │
     ├── cancel/invalidate        └── VoiceStateManager ──► status/Core Orb
     │                                                       │
     └── stale-event guard                   local amplitude ◄┘

ModeResolver ──► presentation/privacy/output policy
     │
     └── explicit style snapshot ──► static turn overlay ──► existing chat generation
SelfKnowledgeManifest ──► public-safe identity and capability claims
PhraseLibrary ──► approved, original, optional surface language only
```

Architectural rules:

1. `DisplayResponse` is canonical and remains available when speech fails or is disabled.
2. `SpeechFormatter` is pure: input plus explicit mode/locale produces output plus material transformation notes.
3. `TurnManager` owns turn validity. Components may observe a turn but cannot revive or replace it.
4. `VoiceManager` coordinates existing capture/playback interfaces; it does not own provider credentials, policy or persistence.
5. `VoiceStateManager` rejects invalid transitions and stale session/turn events.
6. `ModeResolver` can narrow output and context but never expand permission, capability or truth claims.
7. `SelfKnowledgeManifest` is curated data, not generated autobiography.
8. Audio amplitude is computed only from already-playing client output and is discarded immediately.
9. `PhraseLibrary` accepts only exact strings with recorded owner approval; neither UI/UX nor Development can infer or broaden approval.

## Contracts

### DisplayResponse and SpokenResponse

- `DisplayResponse` contains the canonical content, structure, warnings, sources and metadata available to the UI.
- `SpokenResponse` contains plain spoken text, locale, optional semantic hints and material transformation notes.
- Lists and Markdown may be verbalized; long code may be summarized only while the complete display remains available.
- URLs, identifiers, numbers and commands are transformed conservatively. Ambiguity preserves the original wording.
- Safety warnings, uncertainty, confirmation requirements, targets, costs and destructive consequences cannot be summarized away.
- Formatter failure degrades to conservative plain-text reading or no speech; it never changes the displayed answer.

### TurnManager

- Every submitted interaction receives a monotonic turn ID within a voice session.
- Only the current, non-cancelled turn may synthesize or play audio.
- Cancel invalidates pending generation, synthesis and playback through one contract.
- Late events are ignored when the session ID or turn ID does not match.
- Retry creates a new attempt identity and cannot reuse uncertain external effects; Phase 7 has no external effect.

### VoiceStateManager

- Allowed states: `IDLE`, `LISTENING`, `THINKING`, `SEARCHING`, `SPEAKING`, `ALERT` and `ERROR`.
- `EXECUTING` remains reserved for a real future effect and cannot be synthesized by this phase.
- Each transition carries source, session ID, turn ID, timestamp and optional expiry.
- Precedence follows `docs/design/states.md`; unknown or expired state degrades safely.
- Accessible text is authoritative. Motion and color are supplemental.

### VoiceManager

- One explicit voice session at a time.
- Coordinates start, stop, cancel and the existing dictation/playback path.
- Adds no external request, provider fallback, credential, retention or background process.
- A cancelled or superseded turn cannot start or continue playback.

### Prosody and pronunciation

- Hints are semantic and bounded: pace, pause, emphasis, energy, locale and pronunciation token.
- They never encode emotion diagnosis, secret data, provider markup or permission.
- Provider-specific conversion is deferred to a future authorized adapter.

### PhraseLibrary

- Entries are original HOPE language with stable ID, locale, category, context, cooldown and safety eligibility.
- Selection never replaces substantive content, warning, confirmation or error detail.
- Approved inspirations influence only general traits.
- Recognition or original homage is allowed only after an explicit request and remains one original, non-imitative response.
- No phrase exists as active product content unless its exact text has passed the owner gate below.

## Mandatory Individual Phrase-Approval Gate

UI/UX owns the pre-implementation proposal format, not the approval decision. For every phrase proposed for `PhraseLibrary`, UI/UX must present a separate record containing:

- the exact proposed text;
- locale and category;
- the exact usage context;
- the intended tone;
- safety eligibility or contexts in which the phrase must not be used;
- status `PENDING_OWNER_APPROVAL`;
- a later explicit owner decision: `APPROVED`, `REJECTED` or an edited replacement that returns as a new exact proposal.

Gate rules:

1. Every proposal starts as `PENDING_OWNER_APPROVAL`.
2. Approval applies only to the exact text and recorded context. It does not approve another phrase, paraphrase, localization, punctuation change, variant or future rewrite.
3. Approval of one item cannot be inferred as batch approval for a category or library.
4. An unapproved phrase cannot enter source code, `PhraseLibrary` data, fixtures, tests, snapshots, default content, seeded content or the active product.
5. Development may implement only phrases whose exact owner decision is traceable in the UI/UX specification or its approval record.
6. If the owner edits a proposal, the edited exact text is a new proposal and remains pending until explicitly approved.
7. Proposed phrases must be natural, non-robotic and consistent with HOPE's original approved personality. They must not imitate a referenced character or weaken safety, truth or precision.
8. The original plan created no phrase and granted no phrase approval. Later exact owner decisions approve only `P7-PHRASE-006` through `P7-PHRASE-018` for the active package; every other record keeps its recorded status.

The complete UI/UX pre-implementation specification and all exact phrase decisions intended for the first implementation package must be persisted before the Coordinator may route Development.

### Modes

Modes are orthogonal and session-local in Phase 7:

| Axis | Values | Phase 7 effect |
|---|---|---|
| Style | NORMAL, FOCUS, SUPPORTIVE, PRESENTATION | phrasing and pacing only |
| Privacy | STANDARD, PRIVATE | PRIVATE forces existing memory capture/retrieval off for new turns and disables new local-history writes |
| Output | VOICE, SILENT | SILENT prevents synthesis and playback |
| Interruption | STANDARD, DO_NOT_DISTURB | suppresses nonessential proactive presentation; no proactive runtime is added |
| Audience | PRIVATE, PUBLIC | PUBLIC uses public `SelfKnowledge` and blocks private memory context for new turns |

Activating a mode is prospective. It does not delete prior data or hide content already visible. UI/UX must make this limit clear. No mode grants permission, starts recording, enables an unavailable capability or changes factual content.

The mode axes, pronunciation hints, voice state and amplitude remain ephemeral. For every new turn under `PRIVATE` privacy or `PUBLIC` audience, the existing request must use `memory_enabled=false` before submission. Each message/turn captures its local-history eligibility at creation: a private turn cannot be written into persisted history after the mode returns to a permissive value. Entering Private does not delete prior stored history.

### Per-turn generation presentation

- Add exactly one optional `presentation_mode` field to the existing `POST /api/chat` request with exact values `NORMAL`, `FOCUS`, `SUPPORTIVE` and `PRESENTATION`. Omission means `NORMAL`.
- Preserve the request model's extra-field rejection and all existing limits. Reject null, wrong types, unknown values, case/whitespace variants and arbitrary instruction text with `422` before source collection or model work.
- Snapshot the explicit local style selection for each submitted turn. Do not infer activation from the user message, history, memory, source content or model output; do not add a natural-language mode-command parser.
- Preserve `PersonalityConfig`, `PersonalityState`, `infer_personality_state` and every core prompt section and ordering. Omitted/`NORMAL` must produce exactly the existing effective prompt for the same input and inferred expression.
- For each non-default value, append exactly one `[TURN PRESENTATION]` section after the core prompt. The heading and static server-authored instruction together must not exceed 1,000 Unicode characters.
- The section controls only wording, organization and pacing for the current answer. It is subordinate to safety, truth and precision; it cannot alter facts, warnings, uncertainty, confirmations, permissions, capabilities or `ALERT`/`CONCERNED` precedence.
- Do not interpolate user text, history, memory, sources, identifiers, phrase records or private-mode metadata. Enum-looking or forged presentation blocks in untrusted content remain data.
- Preserve provider, model configuration, endpoint, transport, provider JSON keys, output limit, call count, retries, source collection, TTS settings and every response schema. No second generation pass, fallback, streaming path or dependency is authorized.
- `FOCUS` starts with substantive diagnosis, evidence, constraint or action; `SUPPORTIVE` remains direct, analytical and non-therapeutic; `PRESENTATION` organizes the substantive explanation. None adds ritual prefix/suffix or an automatic phrase.
- A bounded input-token increase is accepted only for non-default turns. No paid/provider evaluation, subscription, budget change or capacity purchase is authorized; mocks prove integration invariants, not real-provider style fidelity.

### Public-safe SelfKnowledge

The Phase 7 manifest may contain only:

- HOPE's name and original identity;
- approved general inspirations and the approved narrow homage boundary;
- verified implemented capabilities, planned capabilities explicitly labelled, and current limitations;
- public privacy behavior and availability derived from real capability signals.

It must exclude system prompts, chain-of-thought, credentials, secrets, private memory, owner-identifying content, internal paths and exploitable security details. Static prose cannot mark a service available without a real capability signal.

### Local amplitude

- Analyze only audio already being played by the HOPE client.
- Normalize and smooth to `voiceLevel 0.0..1.0` with a visual ceiling.
- Reset to zero on pause, end, cancel, error or turn invalidation.
- Never upload, persist, log, correlate or infer emotion/identity from the value.
- Reduced motion replaces continuous response with restrained intensity and text state.

## Privacy and Security

- No background microphone, ambient capture or new audio transmission.
- Existing microphone and TTS disclosures remain visible; no control may imply an unavailable capability.
- `PRIVATE` and `PUBLIC` fail closed for new memory use. If the restriction cannot be applied confidently, the turn must not use memory.
- Uncorrelated remote state is ignored for the active turn; it is never assigned the current local session/turn/attempt identity. Local capture/playback callbacks remain authoritative.
- Prompt, model output, memory, web or document content cannot activate a mode, alter `SelfKnowledge` or authorize an exception.
- Cancellation and state events are untrusted until matched to the active session and turn.
- Public-safe manifest content is allowlisted and versioned; protected diagnostics are out of scope.
- No secret, raw audio, transcript, amplitude sample or private prompt is added to logs.
- Production blockers and the owner-identity gap remain unchanged.

## Database Impact

- Expected impact: none.
- `DATABASE: NO` while implementation remains ephemeral and changes no schema, migration, query, memory model or persistence.
- Existing `user_id` fields, memory tables and PostgreSQL behavior remain untouched.
- Any proposal to persist modes, pronunciations, phrases, voice sessions, transcripts, amplitude, preferences or `SelfKnowledge` changes the scope, makes `DATABASE: YES` and requires a new Planner decision before work continues.

## Acceptance Criteria

- [x] Owner approved this exact phase plan.
- [x] Owner separately authorized implementation within this exact scope.
- [x] The complete pre-implementation UI/UX specification is persisted before Development is routed.
- [x] Every proposed exact phrase is listed separately with context, intended tone and initial `PENDING_OWNER_APPROVAL` status.
- [x] Every phrase intended for the active package has an explicit owner decision; no approval is inferred across variants. Pending `P7-PHRASE-021` through `P7-PHRASE-028` remain excluded.
- [ ] No unapproved phrase enters code, fixtures, tests, snapshots, defaults, seeded content or the active product.
- [ ] Displayed and spoken representations are separate, with displayed content remaining canonical.
- [ ] Speech formatting preserves safety, uncertainty, confirmations, targets, costs and destructive consequences.
- [ ] Long code/list formatting is deterministic and leaves the complete display response available.
- [ ] Every voice interaction has a session/turn identity; stale callbacks cannot speak or change state.
- [ ] Stop/cancel halts current playback, invalidates downstream work and returns to a truthful stable state.
- [ ] `VoiceStateManager` transitions satisfy documented precedence and accessible status rules.
- [ ] Existing voice/provider network behavior is unchanged; no new endpoint, provider, fallback, secret, dependency or external data class is introduced.
- [ ] Prosody/pronunciation contracts are provider-neutral and contain no provider markup or sensitive profile.
- [ ] `PhraseLibrary` content is owner-approved, original, natural, non-robotic, non-repetitive and unable to override substantive content.
- [ ] Explicit homage remains original, single-response and non-imitative; prohibited quote, identity and voice behavior is covered by tests.
- [ ] Modes combine deterministically, with privacy/output restrictions winning over style.
- [ ] `PRIVATE`/`PUBLIC` cannot use memory for new turns when the restriction cannot be enforced.
- [ ] Omitted/`NORMAL` preserves the existing effective prompt exactly; invalid `presentation_mode` values return `422` before source/model work.
- [ ] Every non-default mode selects only its bounded static `[TURN PRESENTATION]` section while provider shape, output limit and call count remain unchanged.
- [ ] `SelfKnowledge` reports only allowlisted public facts and distinguishes `IMPLEMENTED`, `PARTIAL`, `PLANNED` and unavailable capabilities.
- [ ] Core Orb amplitude derives only from already-playing local audio, remains ephemeral and resets on stop, end and error.
- [ ] Keyboard, screen-reader status, reduced motion and stop controls meet existing design contracts.
- [ ] No code presents wake word, speaker verification, streaming, cross-device, tools, agents or external effects as implemented.
- [ ] No database, migration, real provider call, paid service, credential, deployment or production change occurs.
- [ ] QA, Security and UI/UX review the same future Functional Commit; Database remains `N/A` only if the no-persistence boundary holds.
- [ ] Production Readiness remains `BLOCKED`.

## Test Strategy

- Unit tests for `SpeechFormatter` invariants: warnings, uncertainty, confirmations, numbers, URLs, commands, Markdown, lists and long code.
- Property/table tests for mode precedence and for “style cannot expand authority”.
- Unit tests for turn IDs, cancellation, stale callbacks, repeated stop and invalid transitions.
- Unit tests for `PhraseLibrary` cooldown, exact approval allowlist, prohibited patterns and substantive-content precedence; fixtures may contain only approved exact phrases or non-product test sentinels.
- Static checks that reject any product phrase without a traceable exact approval record.
- Unit tests for `SelfKnowledge` allowlist, capability-state labels and protected-field rejection.
- Unit tests for amplitude normalization/reset using synthetic PCM only.
- Frontend integration tests with fake recognition/audio; no microphone, provider or paid network dependency.
- Browser tests for start/stop/cancel, overlapping turns, unavailable voice, keyboard, focus, accessible status and reduced motion.
- Security tests for prompt/memory attempts to activate modes, inject `SelfKnowledge`, bypass phrase/quote rules or revive cancelled audio.
- Request-contract tests for exact enum validation, `422` failures and proof that no field other than `presentation_mode` expands the backend API.
- Prompt tests for exact omitted/`NORMAL` preservation, one bounded static overlay per non-default mode, hostile-content isolation and unchanged core ordering.
- Provider-boundary tests for unchanged JSON keys, model, output limit and call count; mocks must not be reported as real-provider style evidence.
- Static diff checks proving no other backend API expansion, schema/migration, environment variable, credential or provider dependency.
- Phase 6 regression suites and an evidence package tied to one exact future Functional Commit.

## Required Reviews

| Work | Required | Justification |
|---|---|---|
| QA | YES | new content, state, cancellation and browser contracts require functional regression and race testing |
| DATABASE | NO | the phase prohibits persistence, schema, migrations and queries; any such delta reopens the plan with Database `YES` |
| SECURITY | YES | voice, privacy, modes, untrusted content, `SelfKnowledge` and truthful capability claims are security boundaries |
| UI/UX | YES | displayed/spoken behavior, states, stop, modes, accessibility, Core Orb and every phrase proposal require pre-implementation specification and post-implementation fidelity review |

## Risks

- The formatter changes meaning or hides a material warning.
- A race allows stale audio or an old turn state.
- `PRIVATE`/`PUBLIC` appears retroactive although it is prospective.
- `PhraseLibrary` becomes repetitive, robotic, unapproved or close to imitation.
- Phrase approval is accidentally broadened from one exact text to variants.
- `SelfKnowledge` diverges from runtime state and creates false claims.
- Web Audio restrictions produce misleading amplitude.
- Visual states compete with accessibility or reduced motion.
- Scope expands into cloud TTS/STT, wake word, biometrics or persistence before Phase 8.
- Future reuse of contracts implies a provider has already been approved.

Primary mitigations are pure functions, allowlists, exact approval records, turn IDs, fail-closed memory/mode handling, accessible text as the authority, invariant tests and mandatory interruption when a non-goal becomes necessary.

## Rollout and Rollback

- Future rollout is local/controlled only and starts only after the Coordinator routes Development following this authorization reconciliation.
- Development produces one reviewable Functional Commit.
- Integration should be incremental: pure contracts, state/turns, formatter, modes/`SelfKnowledge`, and finally local amplitude.
- Canonical display and chat remain operational when speech is unavailable.
- Formatter failure uses conservative output or disables speech; it does not invent a summary.
- Rollback removes integration of the new components and returns to Phase 6 voice behavior without migration or data transformation.
- No publication, provider rollout or real database participates in this phase.

## Implementation Phase

1. `COMPLETE` — owner approved the Phase 7 plan and authorized implementation within its original boundaries.
2. `COMPLETE` — UI/UX persisted the full specification and exact phrase register; `P7-PHRASE-006` through `P7-PHRASE-018` form the approved active package.
3. `COMPLETE` — owner authorized the bounded one-field/one-section generation amendment; Planner reconciled it as `ARCH-2026-11-14-001`.
4. `NEXT` — Coordinator normalizes the operational panel and routes Development on `codex/phase-7-completion`.
5. Development completes the smallest approved package, validates without paid calls or real data and creates one exact Phase 7 Functional Commit.
6. QA, Security and UI/UX review that same hash; Database remains `N/A` only while the no-persistence/no-query boundary holds.
7. Planner consolidates reviews without starting Phase 8 automatically.

## Deferred Items

- Realtime/streaming STT and TTS.
- Provider selection, fallback, region, retention, license, credential and budget.
- Owner recognition, protected session, `ResourceAuthorizer` and `PermissionManager` from Phase 8.
- Background wake word and Windows client.
- Speaker verification, voice profile and biometric data.
- Cross-device behavior, installed clients, location and device context.
- Persistent voice, pronunciation or mode preferences.
- Tools, integrations, external effects, coding, agents, learning, automations and Bridge.
- Cloud, migrations, production and go-live.

## Future Authorization Requirements

- The 2026-09-25 authorization plus `ARCH-2026-11-14-001` cover only this Phase 7 scope and the exact bounded generation exception.
- Exact phrase approval remains a separate per-item owner gate and is never implied by phase authorization. The active package is limited to `P7-PHRASE-006` through `P7-PHRASE-018`.
- Any new provider, persistent data, credential, cost, migration, remote access or production change requires its own decision.
- Planner, reviewers and Coordinator cannot accept HIGH/CRITICAL risk.
- Phase 8 and every later phase require separate planning and authorization.

## Coordinator Handoff

- Recommended next role: `COORDINATOR`.
- Recommended route: normalize the Coordinator-owned panel and route `Development` against `ARCH-2026-11-14-001` on `codex/phase-7-completion`.
- Development task: complete the entire approved Phase 7 package, preserve the partial checkpoint as history, produce one exact Functional Commit and report `READY_FOR_REVIEW` with proportional evidence.
- After that candidate exists, route QA, Security and UI/UX against the same hash. Route Database only if Development introduces an actual persistence/query/schema/database delta.
- Do not route provider evaluation, paid testing, cloud, deployment, production or Phase 8.
- Preserve: HOPE identity, exact phrase boundary, Phase 7 non-goals, Production Readiness `BLOCKED`, current complete Functional Commit `NONE` until Development creates it, and every reviewer-owned historical finding.
