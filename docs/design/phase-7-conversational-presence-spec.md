# Phase 7 — Conversational Presence UI/UX Specification

- Status: `APPROVED`
- Review type: `PRE-IMPLEMENTATION SPECIFICATION`
- Date: 2026-09-25
- Functional baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`
- Phase 7 Functional Commit: `NONE`
- Architecture decision: `ARCH-2026-09-25-001`
- Planner reconciliation commit: `bcd0a05da9cc8a8e8efd301103265470c0a21982`
- Coordinator routing commit: `829aa31bfa20a8c551d2e0e66300d84ed2beb14e`
- Phrase proposal register: [`phase-7-phrase-proposals.md`](phase-7-phrase-proposals.md)
- Environment boundary: local/controlled
- Production Readiness: `BLOCKED`

## Purpose

This document is the canonical pre-implementation experience contract for Phase 7. It specifies how HOPE separates displayed and spoken responses, exposes truthful voice state, handles interruption and failure, combines session-local modes, and projects real local playback amplitude into the Core Orb.

It does not implement the feature, select a provider, authorize a new data flow, approve any phrase, or change the Phase 6 visual direction. The current implementation state remains the baseline described in `docs/architecture.md` until a future Phase 7 Functional Commit passes the required reviews.

## Authority and conflict resolution

1. [`../phase-7.md`](../phase-7.md) controls functional scope, architecture, non-goals and review requirements.
2. This document controls Phase 7 presentation, interaction, accessibility and fidelity criteria.
3. Existing contracts in `docs/design/` remain authoritative for the dashboard, components, states, motion, responsiveness and accessibility.
4. [`phase-7-phrase-proposals.md`](phase-7-phrase-proposals.md) is the only Phase 7 UI/UX register for proposed `PhraseLibrary` content.
5. The canonical display response wins over spoken presentation whenever meaning, safety or completeness could diverge.
6. Any requirement that needs a new provider, endpoint, persistence, credential, audio transmission, background process or Phase 8 authority must stop and return to the Coordinator and Planner.

## Baseline truth and Phase 7 boundary

### Implemented in the baseline

- The chat renders one canonical assistant response.
- Optional TTS currently reads that same response through the existing backend path.
- Browser dictation uses the Web Speech API when supported and permitted.
- Chat request cancellation, TTS abortion and protection against some stale callbacks already exist.
- The interface already exposes truthful local listening and speaking signals, visible stop/cancel controls, accessible status, keyboard focus, reduced motion and the Core Orb state projection.

### Partial in the baseline

- Browser dictation depends on browser support and microphone permission.
- TTS depends on the already configured service and is not provider-neutral.
- Cancellation and state handling are integrated into the current controllers rather than formal reusable turn contracts.
- The text shown in chat is also the speech source; no formal `DisplayResponse`/`SpokenResponse` separation exists.

### Planned by Phase 7, not yet implemented

- Separate response representations, deterministic speech formatting, turn/session identity, a voice facade, formal voice state handling, mode resolution, public-safe `SelfKnowledge`, approved `PhraseLibrary` content and local output-amplitude projection.

### Explicitly not implemented by this phase

- Streaming or new cloud STT/TTS, wake word, background listening, speaker verification, voice profile, biometrics, cross-device voice, persistent modes, transcript/audio retention, tools, agents, integrations, external effects, deployment or production readiness.

## Experience principles

- The complete displayed answer is the source of truth.
- Speech is optional presentation, never hidden authority.
- A user can always stop current capture or playback without losing the displayed answer.
- One visible state corresponds to one real current operation; decorative motion never creates a state.
- Voice failure degrades to text, not to a silent provider switch or an invented success.
- Modes narrow presentation or context. They never expand permissions, capabilities, facts or access.
- Privacy-affecting modes are prospective and fail closed for new turns.
- Personality phrases are optional polish below substantive content and remain absent until exact owner approval.

## 1. DisplayResponse and SpokenResponse

### Canonical relationship

| Contract | UI role | Required behavior |
|---|---|---|
| `DisplayResponse` | Complete answer in the conversation | Preserves structure, sources, memory references, warnings, uncertainty, confirmation requirements, targets, costs, commands and consequences. It remains available if speech is off, unavailable, cancelled or fails. |
| `SpokenResponse` | Optional plain-language rendition for playback | May remove Markdown syntax, verbalize short lists and condense long code or long lists. It must not add facts or omit material safety, uncertainty, confirmation, target, cost or consequence information. |
| Transformation notes | Response-level transparency | Identify material condensation or pronunciation transformation without duplicating the entire answer by default. |

### Presentation rules

- Render the `DisplayResponse` as soon as the current turn is valid. Speech formatting or synthesis must not delay or replace it.
- Associate both representations with the same session ID, turn ID and response version.
- Never append the `SpokenResponse` as a second assistant message.
- When the spoken form materially condenses code, a list, URL, identifier or command, attach a compact disclosure to the response. Expanding it reveals the exact spoken text and a short transformation reason.
- Pure removal of Markdown markers or harmless pause normalization does not require a disclosure.
- Sources and memory provenance remain attached to the displayed response. Speech may state that sources are available on screen, but cannot invent or detach them from the response.
- Display history persists only according to the existing local-history control. Phase 7 must not persist `SpokenResponse`, transformation notes, voice state, amplitude or mode selections.
- If formatting fails, use conservative plain-text reading only when meaning remains intact; otherwise keep the display and do not start speech.

### Content invariants

The spoken representation must preserve verbatim or semantically complete:

- destructive action names, targets and consequences;
- uncertainty, estimates and confidence qualifiers;
- confirmation requirements and the fact that confirmation has not yet occurred;
- prices, quantities, dates, doses, addresses, identifiers and commands when material;
- safety, privacy and security warnings;
- negation and capability limitations.

Personality, brevity and prosody must yield to these invariants.

## 2. Voice state model

Accessible status text is authoritative. The Core Orb, color and motion are synchronized projections.

| User-facing state | Runtime mapping | Entry evidence | Controls and exit behavior | Core Orb |
|---|---|---|---|---|
| Idle | `IDLE` | No active capture, processing or playback for the current session | Composer and available voice controls enabled | Resting state from the existing design contract |
| Listening | `LISTENING` | Actual recognition/capture start callback for the active voice session | Microphone control becomes Stop listening; stopping returns to the composer or activating control | Distinct restrained listening pattern; no fake amplitude |
| Processing | `THINKING` or `SEARCHING` | Current turn committed and real generation/search work active | Cancel remains visible; search is differentiated in text when real | Existing thinking/searching behavior |
| Speaking | `SPEAKING` | Current valid audio fires a real playback-start/playing signal | Stop playback remains visible and names its scope | Intensity may follow real local output amplitude |
| Interrupted / cancelled | Outcome reason, then stable state | Stop, cancel, new-turn supersession or recognized interruption is acknowledged for the matching turn | Downstream work is invalidated; playback/capture ends; focus is restored; then state becomes Idle or the last still-valid operation | Amplitude resets immediately; visual settles without a false success pulse |
| Unavailable | Capability state, not simulated activity | Browser/service capability is absent or permission is blocked | Affected control is unavailable with a persistent reason and safe recovery; text remains usable | Neutral Idle projection; no error pulse loop |
| Error | `ERROR` | A current operation fails and the failure belongs to the active session/turn | Explain impact and recovery; preserve displayed content; retry only on explicit action when safe | One bounded error transition, then stable state if recovery is confirmed |

### State rules

- `LISTENING` begins only after the actual capture/recognition start event and ends on stop, end, error, cancellation or session invalidation.
- `SPEAKING` begins only when current valid audio actually plays. Synthesis pending is Processing, not Speaking.
- `Interrupted` and `cancelled` are visible outcomes, not long-running activity states. Announce once and settle within 480 ms after the operation acknowledges cancellation.
- `Unavailable` describes capability/permission. It must not overwrite a still-valid chat state or imply that the whole HOPE system is offline.
- `ERROR` remains visible while user action is required. Automatic recovery may return to Idle only after capability or operation recovery is confirmed.
- `ALERT` is reserved for a real safety/operational warning. `EXECUTING` is not allowed in Phase 7.
- State precedence remains `ERROR/ALERT > SPEAKING > SEARCHING > THINKING > LISTENING > IDLE`, but a stale event can never outrank the active session/turn.
- Status changes appear in text within 180 ms of the accepted local event and complete their non-reduced visual transition within 480 ms.

## 3. Stop, cancel, interruption and stale-output prevention

### Control semantics

| Control | Scope | Required result |
|---|---|---|
| Stop listening | Current capture only | Stops capture, ignores late transcript callbacks and preserves any text already committed to the composer. |
| Cancel response | Current processing turn | Invalidates generation, formatting, synthesis and pending playback for that turn. The last completed display remains unchanged. |
| Stop playback | Current spoken response only | Pauses/stops audio, releases playback resources, resets amplitude and keeps the displayed response. |
| Start a newer turn | All downstream work from the superseded turn | Invalidates pending format/synthesis/playback before the newer turn can speak. |
| Start listening while HOPE speaks | Current playback, then capture | Stops and invalidates playback first; begins Listening only after the real capture start event. |

### Interaction requirements

- Stop and Cancel remain in a stable, predictable location and meet the existing 44 × 44 px touch target rule.
- Repeated Stop/Cancel is idempotent and produces no new error.
- The first accepted Stop/Cancel action gives visible feedback within 120 ms. Actual state settles when the underlying operation acknowledges; the UI must not claim completion early.
- Escape first follows the existing overlay hierarchy. When no dialog/menu/drawer/inspector/fullscreen surface owns Escape, it stops the active voice operation in this order: playback, listening, then cancellable processing.
- An explicit interruption via UI or a newer turn uses the same invalidation contract. Spoken keywords such as stop/silence are not required because Phase 7 adds no streaming or wake-word listener.
- Cancellation never deletes an already displayed response, existing history or stored memory.

### Stale-event guard

- Every callback that can alter state, transcript, spoken content, amplitude or playback must match active session ID, turn ID and attempt identity.
- A cancelled, superseded, expired or mismatched callback is ignored without announcement.
- Retry creates a new attempt identity. It never reuses a result whose external effect is uncertain.
- Object URLs, audio nodes, timers, listeners and analyzers from invalidated playback are released.
- After cancellation, no stale `AI_STATE_CHANGED`, synthesis response, audio event or recognition callback may restore Processing, Speaking or Listening.

## 4. Modes and truthful communication

### Control model

Add one secondary `Modes` control in the composer area. It opens a non-modal popover on desktop/notebook and an accessible bottom sheet on tablet/mobile. The control summary shows only active non-default modes so the composer remains primary.

| UI group | Contract values | User-visible meaning |
|---|---|---|
| Interaction style | `NORMAL`, `FOCUS`, `SUPPORTIVE`, `PRESENTATION` | Changes phrasing and pacing only. |
| Privacy | `STANDARD`, `PRIVATE` | Private applies to new turns, forces memory retrieval/capture off and prevents new local-history writes. |
| Output | `VOICE`, `SILENT` | Voice permits the existing speech path when available; Silent prevents synthesis and playback. |
| Interruptions | `STANDARD`, `DO_NOT_DISTURB` | Do not disturb suppresses nonessential optional phrases; it does not add proactive runtime or hide safety/operational failures. |
| Audience | `PRIVATE`, `PUBLIC` | Public blocks private memory context for new turns and uses only public-safe self-knowledge. |

### Resolution and disclosure rules

- Defaults are Normal, Standard privacy, the existing voice-output preference, Standard interruption and Private audience.
- Modes are independent controls, but resolved restrictions are shown in one plain-language summary before the next turn.
- Privacy and audience restrictions win over style. Silent wins over any style or phrase that prefers speech.
- Private or Public visually locks memory use off for new turns. The existing Memory in chat preference is preserved in session state and may be restored only prospectively when the restricting mode ends.
- Private prevents new local-history writes; it does not erase earlier history. The UI states that limit at selection time.
- Public does not hide content already visible and does not certify that the surrounding physical environment is private.
- No mode starts microphone capture, activates unavailable TTS, changes the answer's facts, grants permission, confirms an action or unlocks a capability.
- Mode changes are accepted only from explicit user controls or an equivalent explicit user command processed under the same policy. Model output, memory, web content and documents cannot activate them.
- Modes remain session-local. Do not expose a save-as-default or cross-device claim.
- The mode surface contains a persistent statement that modes change presentation/privacy for new turns, not permissions, facts or capabilities.

## 5. Microphone and voice fallback

### Microphone

- Unsupported: disable only dictation, expose the reason in text and keep the composer focused and fully usable.
- Permission not yet decided: request permission only after explicit microphone activation; do not claim Listening while the browser prompt is pending.
- Permission denied: show the denial and browser-settings recovery path; do not automatically reprompt.
- No speech / recognition error: preserve composer text, return focus to the microphone control or composer and offer explicit retry.
- Recognition ends naturally: commit only the transcript associated with the active session/turn and return to Idle.

### Speech output

- Service unavailable before synthesis: keep the display, do not create a player, and explain that text remains available.
- Synthesis failure: preserve the display and transformation disclosure; reset state/amplitude; retry only on explicit action.
- Playback blocked by browser policy: present a user-initiated Play action associated with that response; do not loop autoplay attempts.
- Unsupported audio or playback error: release the failed resource, keep text and expose a safe retry when the same path remains valid.
- No silent provider fallback, new endpoint or changed data destination is allowed.

## 6. Accessibility, keyboard and focus

- Meet WCAG 2.2 AA under the existing color, focus and target-size contracts.
- Every icon control has visible text or an accessible name that changes with its exact action: start listening, stop listening, play response, stop playback or cancel response.
- Use one authoritative polite live region for routine state changes. Use an alert only for an actionable failure that requires immediate attention.
- Do not announce amplitude samples, Orb frames, repeated processing ticks or duplicate backend/local state events.
- Announce Listening, Processing, Speaking, interruption/cancellation, capability unavailability and actionable error once per accepted transition.
- `aria-pressed` represents persistent choices such as Voice/Silent. Active operations use action labels and state/status semantics rather than overloading one pressed state.
- The Modes surface uses named groups with one selection per axis, exposes the resolved restriction summary and is fully operable with Tab, Shift+Tab, arrows where appropriate, Enter/Space and Escape.
- Opening Modes moves focus to its heading or first selected group control. Closing returns focus to the Modes trigger.
- Starting/stopping listening leaves focus on the microphone control unless a transcript is inserted; insertion returns focus to the composer at the insertion point.
- Completion, cancellation or voice failure returns focus to the composer unless an open confirmation or another user-opened layer owns focus.
- A playback failure must not move focus unexpectedly. An explicit retry remains adjacent to the affected response/control.
- At 200% zoom, 30% larger text and all required Phase 6 viewports, the composer, current state and active Stop/Cancel control remain reachable without horizontal scrolling.
- In reduced motion, state meaning remains in text, icon shape and contrast. Voice-level animation is removed or converted to a restrained static intensity.

## 7. Core Orb and local amplitude

- Phase 7 may analyze only audio that the HOPE client is already playing for the current valid spoken response.
- Microphone/listening amplitude is not available through the current contract and must not be fabricated or obtained through a new capture flow in this phase.
- Normalize and smooth local playback amplitude to `voiceLevel 0.0..1.0`; clamp visual response so loud audio does not flash or overwhelm text.
- The analyser starts only after valid playback starts and resets to zero on pause, stop, end, error, cancellation, invalidation or loss of the active audio node.
- `voiceLevel` is ephemeral presentation state. Never transmit, persist, log, correlate, include in telemetry or use it to infer identity, emotion, intent or consciousness.
- The Orb remains recognizably in `SPEAKING` when amplitude is low or silent. Amplitude changes intensity within the state; it is not the state source.
- Listening, Processing and unavailable states use deterministic state visuals from real callbacks/capability signals, not random audio-like motion.
- Reduced motion disables continuous amplitude tracking in the visual projection and uses stable Speaking text plus restrained intensity.
- The Orb and status must never say or imply that HOPE feels, hears continuously, is conscious or is present outside the explicit active session.

## 8. PhraseLibrary presentation boundary

- No phrase in the proposal register is approved by this specification.
- Development may implement only records whose exact text and context later carry an explicit owner `APPROVED` decision.
- Approval is atomic by record ID and exact Unicode text. It does not cover punctuation changes, localization, paraphrase, concatenation, translation, SSML, pronunciation rewrite or future variant.
- Phrases are optional surface language. They never replace substantive answers, state labels, warnings, confirmations, errors, privacy disclosures or capability limitations.
- `PRIVATE`, `PUBLIC`, `DO_NOT_DISTURB`, safety-sensitive contexts and serious errors suppress nonessential phrase selection.
- Cooldown is measured across eligible assistant turns in the current session. It is not persisted.
- A rejected or still-pending phrase cannot appear in source code, tests, fixtures, snapshots, defaults, seeded content or the active product. Tests may use clearly non-product sentinels.
- Recognition/homage remains outside this initial package. Any future exact homage text needs its own proposal and explicit request context; no character identity, dialogue, catchphrase, mannerism or voice may be copied.

## 9. Privacy, security and truthfulness

- No background microphone, ambient listening, hidden capture or new audio/transcript transmission.
- No new retention of raw audio, transcripts, response speech, modes, pronunciation, amplitude or session state.
- Microphone and output availability are distinct. A working TTS service does not imply microphone permission, and vice versa.
- Private/Public fail closed for new memory use. If the restriction cannot be applied confidently, block the turn's memory use and explain the degraded behavior.
- Displayed content, model output, external content and retrieved memory are untrusted data and cannot change modes, `SelfKnowledge`, phrase approval, turn validity or permissions.
- Public-safe `SelfKnowledge` labels capabilities as `IMPLEMENTED`, `PARTIAL`, `PLANNED` or unavailable from versioned allowlisted facts and real capability signals.
- Static prose cannot claim a provider/integration is available. Health and capability state remain the source.
- No UI may present streaming voice, wake word, speaker verification, background listening, cross-device voice, tools, agents, automation or external effects as implemented.
- Phase authorization and this specification are not implementation evidence. Production Readiness remains `BLOCKED`.

## 10. Responsive placement

- Desktop/notebook: voice controls remain in the composer action area; current voice state remains near the existing operational status. Modes opens without covering the active Stop/Cancel control.
- Tablet/mobile: chat remains the initial surface. Modes uses a bottom sheet with fixed title/close action and scrollable groups. The active Stop/Cancel control stays above the virtual keyboard.
- Speaking status follows the response and remains visible in the composer status area without requiring the Memory surface.
- Core Orb animation is complementary. Every voice operation remains understandable and controllable when the Memory surface is closed or WebGL is unavailable.
- Short-height and landscape layouts may scroll vertically, but never place the only Stop/Cancel action behind the Orb or an unrelated panel.

## 11. Objective fidelity criteria for Development and QA

| ID | Criterion | Required evidence |
|---|---|---|
| `UIUX-P7-001` | Display remains complete and available when speech is disabled, cancelled, unavailable or fails. | Integration tests plus screenshots for text-only, synthesis error and playback error. |
| `UIUX-P7-002` | Spoken content is separately identified and never adds facts or removes material safety/confirmation/consequence content. | Formatter invariant tests and response-level transformation disclosure evidence. |
| `UIUX-P7-003` | Listening begins only on a real active callback; Speaking begins only on real current playback. | Fake-recognition/audio browser tests with timestamps/state assertions. |
| `UIUX-P7-004` | Stop listening, Cancel response and Stop playback have distinct labels and effects. | Keyboard/pointer tests for each scope, including repeated activation. |
| `UIUX-P7-005` | Cancelled/superseded callbacks cannot change text, state, playback or amplitude. | Race tests covering late chat, formatter, TTS, audio and recognition events. |
| `UIUX-P7-006` | Escape respects existing overlay priority, then stops the active voice operation and restores focus. | Keyboard matrix with and without confirmation, Modes and Memory layers. |
| `UIUX-P7-007` | Unavailable microphone/TTS preserves chat and gives a specific reason and recovery. | Unsupported, denied, offline, invalid-audio and autoplay-blocked cases. |
| `UIUX-P7-008` | All five mode axes combine deterministically; restrictions win and no mode expands authority. | Pairwise/table tests plus visible resolved-summary screenshots. |
| `UIUX-P7-009` | Private/Public affect new turns only, do not erase visible/prior data and fail closed for memory. | Browser tests for turn boundaries, control locking/restoration and failed enforcement. |
| `UIUX-P7-010` | Voice state and controls work through keyboard, screen-reader semantics, zoom and larger text. | Accessibility tree, focus order/return log, 200% zoom and 30% text evidence. |
| `UIUX-P7-011` | Reduced motion removes continuous amplitude/motion while preserving textual state. | Media-query and local-control screenshots/tests. |
| `UIUX-P7-012` | Core Orb amplitude comes only from current local output and resets on every terminal path. | Synthetic local PCM tests for play/pause/stop/end/error/cancel/stale turn; no network/log event. |
| `UIUX-P7-013` | No amplitude, mode, transcript, spoken response or voice-session data is persisted or logged. | Static diff check and storage/network/log assertions. |
| `UIUX-P7-014` | Only owner-approved exact phrase records can enter product content. | Static allowlist check tied to the future approval record; pending/rejected phrases absent. |
| `UIUX-P7-015` | Phrase selection respects cooldown, suppression and substantive-content precedence. | Deterministic unit tests using only approved phrases or non-product sentinels. |
| `UIUX-P7-016` | `SelfKnowledge` and capability UI distinguish implemented, partial, planned and unavailable states. | Allowlist/capability tests and negative claim scan. |
| `UIUX-P7-017` | Voice flows remain usable at all Phase 6 viewport sizes and without WebGL. | Screenshots at 320×568, 390×844, 768×1024, 1024×768, 1280×720, 1440×900 and 1920×1080. |
| `UIUX-P7-018` | No new provider, endpoint, persistence, background microphone, wake word or future capability is implied. | Functional diff inventory, network assertions and visible/accessibility-tree copy scan. |

## Development evidence package

The future Phase 7 Functional Commit must provide:

- a mapping from each `UIUX-P7-*` criterion to implementation and test evidence;
- state-transition and mode-resolution tables exercised by automated tests;
- browser evidence for listening, processing, speaking, stop, cancel, supersession, unavailable and error;
- focus-order and focus-return results for keyboard-only operation;
- accessibility tree or equivalent semantic evidence with no duplicate state announcements;
- reduced-motion and no-WebGL scenarios;
- synthetic local audio evidence for amplitude without microphone/provider/paid calls;
- static proof that no pending/rejected phrase appears in product code, fixtures, tests, snapshots, defaults or seeds;
- exact traceability from every implemented phrase to the later owner approval record;
- screenshots for the required responsive matrix, including short-height/landscape and active Stop/Cancel;
- a truthfulness scan for future capability claims;
- confirmation that no backend endpoint, provider, schema, migration, persistence, secret, deployment or production surface was added.

## Definition of ready after the owner phrase gate

The UI/UX specification itself is complete. Development routing remains blocked until the owner has individually approved, edited or rejected every proposal intended for the first package and the Coordinator has persisted those exact decisions.

After that separate gate:

- Development implements only the approved Phase 7 scope and approved exact phrase records;
- any edited phrase returns as a new pending record before implementation;
- QA, Security and UI/UX review the same future Functional Commit;
- Database remains `N/A` only while the no-persistence boundary holds;
- no later phase or production action starts automatically.
