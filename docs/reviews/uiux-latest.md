# UI/UX Review — Latest

- Status: `APPROVED_WITH_WARNINGS`
- Date: 2026-11-17
- Phase: 7 — Conversational Presence Foundation
- Review type: `PHASE 7 POST-IMPLEMENTATION UI/UX RE-REVIEW`
- Target Functional Commit: `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5`
- Functional baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`
- Previous rejected candidate: `c649a903693d5fedf631d760880b80ed881dc138`
- Architecture decision: `ARCH-2026-11-14-001`
- Development documentation/evidence commit: `5f125a04e989274e3d90cc7a69876cbb582c9526`
- Final pre-UI/UX-documentation HEAD inspected: `058a4a01856af8a15c4e38cba1e70051c4c11bd2`
- Functional delta from target to review HEAD: `NONE` under `backend/`, `frontend/`, `tests/` and `scripts/`
- Official verdict: `APPROVED_WITH_WARNINGS`
- Production Readiness: `BLOCKED`

## Current re-review state

This report records the completed mandatory UI/UX re-review of the corrected Functional Commit. It does not approve Security, Production Readiness or the phase in place of the remaining required Works, and it does not treat Development's commit name or test summary as proof.

After QA released the fixed ports, UI/UX executed a separate headless-Chrome inspection with synthetic media and disposable local state. The review used a UI/UX-specific evidence directory and did not overwrite Phase 6 or previous Phase 7 evidence.

Only this UI/UX-owned report, the new correction-review evidence directory and the `## UI/UX` handoff section are modified in the serialized persistence window. Code, tests, frozen evidence, other reviewer reports, global coordination fields and push remain untouched.

## Exact-target isolation and validation performed

- Confirmed that `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5` is a commit and a descendant of both the Phase 6 baseline and the previously rejected candidate.
- Inspected the complete correction delta from `c649a903693d5fedf631d760880b80ed881dc138` to the target rather than relying on the Development summary.
- Confirmed that commits after the target change only `README.md`, `CHANGELOG.md` and documentation; there is no post-target functional drift.
- Independently ran the complete frontend unit suite directly with Node.js: `67 passed`, `0 failed`.
- The `npm` launcher was unavailable, so the configured test glob was executed with `node --test tests/frontend/*.test.mjs`.
- The focused Python presentation suite was not rerun because the available Python runtime has no `pytest` module. The relevant backend presentation/orchestrator paths are unchanged from the previously reviewed candidate; the prior independent UI/UX run of that focused suite remains `15 passed` historical evidence, not a fresh run in this window.
- Confirmed that the response formatter, mode resolver, phrase library, SelfKnowledge, voice manager, voice level, turn manager, turn request and presentation-state modules are unchanged by the correction commit unless explicitly listed below.
- Confirmed that product PhraseLibrary content still contains only exact approved records `P7-PHRASE-006` through `P7-PHRASE-018`. The exact texts of pending records `021`–`028` are absent from backend, frontend and tests; `P7-PHRASE-021` appears only as a negative fail-closed ID sentinel in a unit test.
- Static future-capability scan found no positive claim that wake word, speaker verification, background listening, streaming voice, cross-device operation, tools, agents or automations are implemented. The only matching product copy is the correct negative limitation in public SelfKnowledge.
- Independent UI/UX browser inspection passed eight focused scenarios covering Modes at `720×450` reflow-equivalent, `720×450` with 130% text, `320×568` touch, `390×844` touch and `844×390` landscape/touch; one-channel chat/TTS failures; playback-to-recognition interruption; and reduced-motion/no-WebGL operation.
- Browser measurements, focus results and live-region mutations are persisted in [`../evidence/phase-7/review-af2aa66/uiux-browser-results.json`](../evidence/phase-7/review-af2aa66/uiux-browser-results.json). New synthetic visual evidence is limited to [`modes-desktop-short-reflow.png`](../evidence/phase-7/review-af2aa66/modes-desktop-short-reflow.png), [`modes-desktop-short-130.png`](../evidence/phase-7/review-af2aa66/modes-desktop-short-130.png) and [`modes-mobile-touch.png`](../evidence/phase-7/review-af2aa66/modes-mobile-touch.png).
- The browser and disposable harness were closed after inspection. Final verification found zero listeners on ports `8766` and `8767` and zero related UI/UX harness processes.

## Verdict

The corrected candidate satisfies the applicable Phase 7 UI/UX contract. Both previous blocking findings are closed on the exact target:

1. Modes now provides a visible touch-close control, correct focus entry/return, Escape support and reachable internal scrolling across the required short-height, enlarged-text, reflow-equivalent and mobile conditions.
2. Routine and actionable failures now use one authoritative announcement channel; neither the controlled chat error nor the TTS error produced a duplicate polite copy or a preceding generic `ERROR` announcement.

Playback-to-recognition also passed the affected cross-regression: current audio paused, analyzer resources disconnected, amplitude reset to zero before Listening, and late playback events did not revive Speaking. Reduced-motion and no-WebGL operation remained available. The historical screenshots under `docs/evidence/phase-7/` were not used as proof of the corrected target.

One non-blocking layout warning remains: the combined `720×450` plus 130% root-text condition produced 2 px of document-level horizontal overflow (`scrollWidth=722` for a 720 px viewport). No text, close action, group, composer action or focus path was clipped or unreachable, and separate 200% reflow-equivalent, mobile and landscape checks had zero overflow. This is recorded as `UIUX-P7-W04`, not as a reopened blocker.

## Finding closures

### `UIUX-P7-POST-001` — Modes close, focus and reflow contract

- Previous severity: `HIGH`
- Current state: `CLOSED` on `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5`
- Blocking: `NO`
- Resolved impact: touch-equivalent, keyboard and enlarged-text users can enter, exit and reach all five mode groups.
- Static correction evidence:
  - [`../../frontend/index.html`](../../frontend/index.html) now gives the surface a named, programmatically focusable heading and a visible `Fechar` button.
  - [`../../frontend/js/mode-controller.js`](../../frontend/js/mode-controller.js) focuses the heading after open, closes from the explicit button or Escape and returns focus to the Modes trigger.
  - [`../../frontend/styles/main.css`](../../frontend/styles/main.css) gives the surface bounded vertical scrolling, a sticky heading/close row, 44 px close target and a mobile fixed-sheet treatment.
  - [`../../tests/browser/phase-7.mjs`](../../tests/browser/phase-7.mjs) contains assertions for heading focus, visible close, all five groups, final-group reachability and focus return.
- Independent browser evidence:
  - keyboard open and touch-equivalent open both moved focus to `#modes-title`;
  - the visible `Fechar` target measured at least `44 px` high and closed through pointer/touch input;
  - visible close and Escape both returned focus to the Modes trigger;
  - every one of the five named groups was scrolled fully inside the sheet at `720×450`, `320×568`, `390×844` and `844×390`;
  - the popover became fully reachable through permitted vertical document scrolling at short height, while the sticky title/close row remained visible;
  - the 2 px combined enlarged-text overflow is isolated under non-blocking `UIUX-P7-W04`; no essential content or action was clipped.

### `UIUX-P7-POST-002` — One authoritative announcement channel per failure

- Previous severity: `MEDIUM`
- Current state: `CLOSED` on `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5`
- Blocking: `NO`
- Resolved impact: actionable chat and TTS failures use one alert mutation without a duplicate polite or generic failure announcement.
- Static/unit correction evidence:
  - [`../../frontend/js/announcement-policy.js`](../../frontend/js/announcement-policy.js) maps routine status only to the polite region and actionable failure only to the alert region.
  - [`../../frontend/js/ui.js`](../../frontend/js/ui.js) clears the non-authoritative channel instead of copying a failure into both regions.
  - [`../../frontend/js/chat.js`](../../frontend/js/chat.js) does not announce the generic `ERROR` state label before the detailed catch-path failure.
  - [`../../frontend/js/voice-state.js`](../../frontend/js/voice-state.js) rejects a duplicate transition for the same state/reference.
  - Independent frontend tests passed the single-target policy and single-transition assertions.
  - [`../../tests/browser/phase-7.mjs`](../../tests/browser/phase-7.mjs) contains a MutationObserver scenario expecting exactly one non-empty alert mutation and no generic failure copy.
- Independent browser evidence:
  - the controlled chat failure produced routine `Analisando` in the polite region followed by exactly one detailed error mutation in `#urgent-status`;
  - the TTS failure produced exactly one detailed mutation in `#urgent-status` and no non-empty polite copy;
  - neither case emitted `Falha — verifique a mensagem`;
  - the detailed recovery copy remained visible and TTS failure preserved focus on the activating response control.

## Cross-regression result

- Playback-to-recognition: the microphone start path synchronously calls `stopSpeech()` before creating the recognition reference. Independent browser evidence recorded one audio pause, analyzer disconnection, `voiceLevel=0` before Listening and inert late `playing` events both before and after recognition `onstart`.
- Independent frontend tests also passed the unchanged speaking/playback/reset/stale-callback contracts.
- Public/prospective boundary: the correction adds ephemeral history provenance and fail-closed public projection while preserving visible history and the stored `{role, content}` shape. Unit coverage passed. This UI/UX observation does not replace or imply Security approval of `SEC-021`.
- Reduced motion and no-WebGL preserved the visible Modes close path and focus entry in the independent browser pass. Response-native personality, SelfKnowledge claims and exact phrase content remain unchanged in the correction delta.

## Final `UIUX-P7-*` matrix

| Criterion | Result | Evidence and conclusion |
|---|---|---|
| `UIUX-P7-001` | `PASS` | Display/spoken separation is unchanged; frontend suite and synthetic TTS-failure inspection preserve the complete display. |
| `UIUX-P7-002` | `PASS` | Formatter and material-content invariants are unchanged and passed unit coverage. |
| `UIUX-P7-003` | `PASS` | Independent browser evidence confirmed Listening only after recognition `onstart`, Speaking only on current local playback and no Speaking revival from late audio. |
| `UIUX-P7-004` | `PASS` | Distinct controls remain present; starting dictation stops current playback before capture and leaves the display intact. |
| `UIUX-P7-005` | `PASS` | Unit stale guards passed and late synthetic playback events remained inert across the playback-to-recognition transition. |
| `UIUX-P7-006` | `PASS` | Visible close and Escape both closed Modes and returned focus to the trigger; `UIUX-P7-POST-001` is closed. |
| `UIUX-P7-007` | `PASS` | Specific chat/TTS failures preserve chat and use one authoritative alert; `UIUX-P7-POST-002` is closed. |
| `UIUX-P7-008` | `PASS` | Five axes and deterministic restrictive resolution are unchanged and unit-covered. |
| `UIUX-P7-009` | `PASS WITH SECURITY BOUNDARY` | Prospective privacy/history behavior and fail-closed public projection passed unit coverage; this does not replace Security's independent verdict. |
| `UIUX-P7-010` | `PASS WITH WARNING` | Focus entry/return, 44 px touch close, all-group reachability, one-channel semantics and reflow/mobile paths passed; retain the 2 px combined enlarged-text overflow as `UIUX-P7-W04`. |
| `UIUX-P7-011` | `PASS` | Reduced-motion plus no-WebGL inspection preserved textual operation, Modes focus entry and visible close. |
| `UIUX-P7-012` | `PASS` | Independent browser evidence recorded pause, analyzer disconnection, zero amplitude and stale-audio rejection before Listening. |
| `UIUX-P7-013` | `PASS` | No new persistence/logging of mode, voice, amplitude or spoken response was introduced. |
| `UIUX-P7-014` | `PASS` | Product content remains limited to exact approved records `006`–`018`; pending exact texts are absent. |
| `UIUX-P7-015` | `PASS` | Fail-closed null default, cooldown and no-fallback tests passed. |
| `UIUX-P7-016` | `PASS` | No mode-to-phrase hook or ritual wrapper was introduced. |
| `UIUX-P7-017` | `PASS WITH LIMIT` | Supportive presentation mapping is unchanged; real-provider adherence remains untested under `UIUX-P7-W01`. |
| `UIUX-P7-018` | `PASS` | Trusted evidence, cooldown, suppression and substantive precedence remain unchanged and unit-covered. |
| `UIUX-P7-019` | `PASS` | Public SelfKnowledge remains capability-labelled, negative about unavailable future features and free of protected fields in unit evidence. |
| `UIUX-P7-020` | `PASS WITH WARNING` | Corrected Modes is reachable at `320×568`, `390×844`, `844×390` and `720×450`; no-WebGL operation passed. Retain `UIUX-P7-W04`. |
| `UIUX-P7-021` | `PASS` | Functional/static scan found no new provider, persistence, background microphone, wake word, tool/agent runtime or future-capability claim. |

## Current warnings and environmental limits

### `UIUX-P7-W01` — Real-provider style and physical voice fidelity remain untested

- Severity: `INFO`
- Blocking: `NO`
- Impact: mocks and static prompt mapping cannot prove real-provider Focus/Supportive/Presentation adherence or physical playback quality.
- Treatment: retain the limit; do not describe synthetic output as provider fidelity.

### `UIUX-P7-W02` — Manual assistive-technology and physical-device coverage remain incomplete

- Severity: `INFO`
- Blocking: `NO`
- Impact: no physical touch device, manual screen reader, real microphone/speaker or actual browser-UI zoom control was used. Touch, media and 200% reflow were synthetic/equivalent browser conditions.
- Treatment: preserve this environmental limit; objective browser focus, geometry and live-region mutation checks do not substitute for manual assistive-technology or physical-device validation.

### `UIUX-P7-W03` — Focused Python suite unavailable in the UI/UX preparation runtime

- Severity: `INFO`
- Blocking: `NO`
- Impact: the available Python runtime lacks `pytest`, so this window did not independently repeat the unchanged backend presentation suite.
- Treatment: rely only on exact-diff proof plus the historical `15 passed` result for that unchanged path; do not claim a fresh backend run.

### `UIUX-P7-W04` — Two-pixel horizontal overflow under combined short-height and enlarged-text stress

- Severity: `LOW`
- Blocking: `NO`
- Evidence: at `720×450` with root text enlarged to 130%, the browser measured `scrollWidth=722` for a 720 px viewport. The Modes sheet right edge measured approximately `722.39 px`.
- Impact: the document can shift horizontally by 2 px, but no text, group, close control, composer action or focus target was clipped or unreachable. Separate `720×450` reflow-equivalent, `320×568`, `390×844` and `844×390` checks had zero horizontal overflow.
- Treatment: remove the fractional overflow in future visual polish by constraining the desktop/notebook popover to its actual available inline space. It does not reopen `UIUX-P7-POST-001` or block this local/controlled Phase 7 gate.

## Current phrase and personality preservation

- The pre-implementation UI/UX specification remains `APPROVED`; the current re-review does not rewrite it.
- Exact owner-approved records remain only `P7-PHRASE-006` through `P7-PHRASE-018`, in their recorded context, cooldown and suppression boundaries.
- `P7-PHRASE-001`, `P7-PHRASE-002`, `P7-PHRASE-004`, `P7-PHRASE-005`, `P7-PHRASE-019` and `P7-PHRASE-020` remain `REJECTED`.
- `P7-PHRASE-003` remains `WITHDRAWN_FROM_ACTIVE_PACKAGE`.
- `P7-PHRASE-021` through `P7-PHRASE-028` remain `PENDING_OWNER_APPROVAL`, excluded and non-blocking. This review approves neither their text nor their IDs for active content.
- `NO_REPLACEMENT_NEEDED` remains the UI/UX recommendation for the four rejected functions covered by the optional alternatives.
- Personality remains response-native. Zero phrase remains the normal path; Focus begins with substantive analysis; no automatic mode phrase, frontend prefix/suffix, hidden user-message instruction or canonical-answer rewrite is present.

## Current required next action

Return `APPROVED_WITH_WARNINGS` to the Coordinator for alignment with QA and Security and eventual Planner consolidation. Both previous UI/UX blockers are closed on the exact corrected Functional Commit. Carry `UIUX-P7-W01` through `UIUX-P7-W04` as non-blocking limits/warnings without treating them as resolved or as production authorization.

The Coordinator opened the serialized persistence window for this result. Persist only this report, the new UI/UX evidence and the `## UI/UX` handoff section; do not push, start Phase 8, merge, deploy or change Production Readiness.

---

## Historical rejected-candidate record — `c649a903693d5fedf631d760880b80ed881dc138`

Everything below this heading is the frozen 2026-11-15 UI/UX review of the previous candidate. It remains historical evidence only and is not the verdict on `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5`.

### Historical scope and method

UI/UX independently reviewed the complete Phase 7 functional sequence through the exact target, including backend presentation mode work, the local response/voice integration and the final public homage-boundary correction. The review did not treat the last commit or Development's summary as sufficient evidence.

The assessment covered the canonical Phase 7 specification, the exact phrase register, the mandatory visual/accessibility contracts, changed runtime code, focused tests and the committed evidence in [`../evidence/phase-7/`](../evidence/phase-7/). The Phase 7 browser runner was not started because QA owned the fixed port and browser window. No real microphone, paid provider, PostgreSQL, production service or physical device was used.

Independent non-browser validation performed from this worktree:

- Frontend suite: `62 passed`.
- Focused presentation backend suite: `15 passed`.
- Exact target-to-HEAD path inspection: documentation/evidence only; no backend, frontend or test delta after the Functional Commit.
- Static phrase scan: `P7-PHRASE-021` through `P7-PHRASE-028` and their exact texts are absent from frontend, backend and tests.

### Historical verdict

The implementation satisfies the main product direction: canonical display and optional speech are separate; modes are explicit and prospective; voice and Core Orb state use real local events; privacy restrictions fail memory closed; public SelfKnowledge is accessible and capability-labelled; personality is guided inside the substantive generated answer; mode changes do not invoke phrases; and only the 13 exact approved phrase records are present.

Approval is blocked by two accessibility/interaction defects in Phase 7 surfaces:

1. the Modes surface can lose reachable content and lacks the required touch-close/focus-entry behavior;
2. actionable voice/chat failures are written to both polite and assertive live regions, with an additional generic state announcement possible for the same failure.

These are direct failures of required `UIUX-P7-006`, `UIUX-P7-010` and the Phase 7 accessibility contract. They require a new Functional Commit and proportional re-review of the affected surfaces. This result does not approve the phase or production.

### Historical findings

### `UIUX-P7-POST-001` — Modes surface is not reliably closable, focusable or vertically reachable

- Severity: `HIGH`
- Impact: Touch-only users can open the mobile bottom sheet without receiving a visible close action, while keyboard focus remains on the obscured trigger instead of entering the surface. At enlarged text and short viewport height, the desktop/notebook popover can extend above the viewport without a height limit or internal scrolling, leaving its heading and first controls unreachable. This can trap or exclude users from a core Phase 7 control.
- Blocking: `YES`
- Affected criteria: `UIUX-P7-006`, `UIUX-P7-010`, responsive placement and focus-entry/return requirements.
- Code evidence:
  - [`../../frontend/index.html`](../../frontend/index.html) lines 76–93 define the Modes sheet with no close button and a non-focusable heading.
  - [`../../frontend/js/mode-controller.js`](../../frontend/js/mode-controller.js) lines 20–32 handle change and Escape but do not move focus to the heading or first selected group control when the sheet opens.
  - [`../../frontend/styles/main.css`](../../frontend/styles/main.css) lines 230–236 give the non-mobile popover no `max-height`/vertical overflow and turn the mobile surface into a fixed sheet without adding a visible close affordance or scrim behavior.
- Visual evidence: [`text-130-modes.png`](../evidence/phase-7/text-130-modes.png) shows the enlarged-text/short-height surface clipped above the viewport; the title and initial content are outside the visible area. [`modes-restrictions.png`](../evidence/phase-7/modes-restrictions.png) confirms the surface structure has no close action.
- Test-evidence gap: [`../../tests/browser/phase-7.mjs`](../../tests/browser/phase-7.mjs) lines 248–256 assert only horizontal width, visibility and an accessibility snapshot at 130% text. They do not assert that every group remains reachable, that opening moves focus inside, that touch can close the sheet, or that 200% zoom works.
- Required outcome: provide an explicit reachable close action on the mobile sheet, correct focus entry/return, and a height/scroll strategy that keeps the heading and all five groups reachable under short-height, 200% zoom and 30% larger-text conditions. Verify touch and keyboard paths without relying on Escape as the only mobile exit.

### `UIUX-P7-POST-002` — Actionable failures are announced through duplicate live regions

- Severity: `MEDIUM`
- Impact: Screen-reader users can hear the same failure twice—once from the polite status and again from the alert. Chat failures can also announce the generic `ERROR` label before the detailed recovery message, increasing interruption and reducing clarity precisely when recovery guidance matters.
- Blocking: `YES`
- Affected criteria: `UIUX-P7-007`, `UIUX-P7-010`, authoritative-live-region and no-duplicate-announcement requirements.
- Code evidence:
  - [`../../frontend/index.html`](../../frontend/index.html) line 99 defines both `#live-status` as a polite status and `#urgent-status` as an alert.
  - [`../../frontend/js/ui.js`](../../frontend/js/ui.js) lines 61–64 always write the message to the polite region and, for errors, copy the same message into the alert.
  - [`../../frontend/js/chat.js`](../../frontend/js/chat.js) lines 38–41 route voice failures through that duplicate path; lines 60–64 also announce every non-idle state, including generic `ERROR`, before the detailed catch-path message.
- Evidence limitation: the committed voice-failure screenshot proves the display remains visible, but a screenshot cannot prove a single screen-reader announcement. The browser harness does not inspect live-region mutation count or accessible announcement duplication.
- Required outcome: use one authoritative announcement path per accepted transition. Routine state belongs in the polite region; only an actionable urgent failure belongs in the alert, without copying it into both regions or preceding it with a redundant generic error announcement.

### Historical warnings and limits

### `UIUX-P7-W01` — Real provider style and physical voice fidelity remain untested

- Severity: `INFO`
- Impact: Static prompt mappings and mocks prove the bounded integration contract but cannot prove that a real provider consistently begins Focus with diagnosis, keeps Supportive recognizably direct or produces the intended spoken delivery.
- Blocking: `NO`
- Evidence: presentation helper/prompt tests, synthetic browser responses and synthetic PCM only. No paid provider call, real microphone or physical-device playback was authorized.
- Treatment: retain this as an explicit environmental limit. Do not describe fixture output as real provider fidelity.

### `UIUX-P7-W02` — Manual assistive-technology coverage remains incomplete

- Severity: `INFO`
- Impact: Physical touch devices, manual screen-reader navigation and actual 200% browser zoom were not independently exercised in this UI/UX window.
- Blocking: `NO` independently of the concrete blockers above.
- Treatment: the corrected candidate should add objective browser assertions for reachability/focus/live-region mutations and retain honest manual-device limits.

### Historical `UIUX-P7-*` result matrix

| Criterion | Result | Evidence and conclusion |
|---|---|---|
| `UIUX-P7-001` | `PASS` | Canonical display is rendered before optional speech and remains after synthesis/playback failure, stop or Silent mode; committed failure evidence preserves the full response. |
| `UIUX-P7-002` | `PASS` | `DisplayResponse` and `SpokenResponse` are separate; the formatter strips presentation syntax conservatively and refuses over-limit speech without truncating material content. |
| `UIUX-P7-003` | `PASS` | Listening requires the recognition `onstart` callback; Speaking requires the local audio `playing` event. Synthetic browser evidence and state tests cover both boundaries. |
| `UIUX-P7-004` | `PASS` | Stop listening, Cancel and Stop playback have distinct labels, scopes and handlers; display content survives playback stop. |
| `UIUX-P7-005` | `PASS` | Session/turn/attempt/response-version guards reject stale synthesis, recognition and state callbacks; local cancel/reset behavior is covered by focused tests. |
| `UIUX-P7-006` | `FAIL — BLOCKING` | Escape works for isolated Modes/voice cases, but Modes focus entry and a complete closable layer experience do not meet the contract; see `UIUX-P7-POST-001`. |
| `UIUX-P7-007` | `FAIL — BLOCKING` | Specific reasons and recovery preserve chat, but the accessible failure announcement is duplicated; see `UIUX-P7-POST-002`. |
| `UIUX-P7-008` | `PASS` | All five axes are exposed and resolve deterministically; privacy/audience and Silent restrictions win without expanding authority. |
| `UIUX-P7-009` | `PASS` | Private/Public are visibly prospective, disable memory for new turns, preserve prior visible/stored history and prevent later writes of Private turns. Public makes no retroactive hiding/deletion claim. |
| `UIUX-P7-010` | `FAIL — BLOCKING` | Focus entry, enlarged-text reachability and single-announcement semantics fail on changed Phase 7 controls; see both blockers. |
| `UIUX-P7-011` | `PASS` | Reduced motion suppresses continuous Core Orb amplitude response while preserving textual Speaking state and restrained static intensity. |
| `UIUX-P7-012` | `PASS` | Core Orb voice level comes from current local playback analysis and resets on pause, end, stop, cancel, error and stale invalidation. |
| `UIUX-P7-013` | `PASS` | Modes, amplitude, spoken rendition and voice identities remain ephemeral; storage assertions show no mode metadata and Private turns remain excluded. |
| `UIUX-P7-014` | `PASS` | Product code contains exact approved records `P7-PHRASE-006` through `P7-PHRASE-018` only. Pending `021`–`028` and rejected/withdrawn text remain excluded. |
| `UIUX-P7-015` | `PASS` | Selection is fail-closed and returns `null` by default; no fallback, quota or rotation requirement exists. |
| `UIUX-P7-016` | `PASS` | Mode changes do not import or call the phrase library. Focus uses the bounded answer-native generation instruction and contains no ritual prefix/suffix hook. |
| `UIUX-P7-017` | `PASS WITH LIMIT` | Supportive uses a direct, analytical, non-therapeutic static instruction. Real-provider adherence remains untested under `UIUX-P7-W01`. |
| `UIUX-P7-018` | `PASS` | Approved entries enforce trusted semantic evidence, cooldowns, session limits and suppression for Focus, private/public, Do Not Disturb and serious contexts. |
| `UIUX-P7-019` | `PASS` | “Sobre a HOPE” exposes versioned public identity, narrow homage boundary, limitations and capability labels derived from runtime signals; no future capability is labelled available. |
| `UIUX-P7-020` | `PASS WITH BLOCKING CROSS-CRITERION DEFECT` | Conversation/voice controls remain usable across the seven base viewports and without WebGL, but enlarged-text Modes reachability fails under `UIUX-P7-POST-001`. |
| `UIUX-P7-021` | `PASS` | No new provider, endpoint, persistence, background microphone, wake word, tool/agent runtime or future capability is presented as delivered. |

### Historical phrase and personality preservation

- The prior pre-implementation UI/UX specification remains `APPROVED`; this post-implementation rejection does not rewrite that historical decision.
- Exact owner-approved records remain only `P7-PHRASE-006` through `P7-PHRASE-018`, in their recorded context, cooldown and suppression boundaries.
- `P7-PHRASE-001`, `P7-PHRASE-002`, `P7-PHRASE-004`, `P7-PHRASE-005`, `P7-PHRASE-019` and `P7-PHRASE-020` remain `REJECTED`.
- `P7-PHRASE-003` remains `WITHDRAWN_FROM_ACTIVE_PACKAGE`.
- `P7-PHRASE-021` through `P7-PHRASE-028` remain `PENDING_OWNER_APPROVAL`, excluded and non-blocking. This review does not approve them, their punctuation, variants, translation or context changes.
- `NO_REPLACEMENT_NEEDED` remains the UI/UX recommendation for the four rejected functions covered by the optional alternatives.
- Personality remains response-native. There is no automatic mode phrase, mode-entry assistant message, frontend prefix/suffix, hidden user-message instruction or canonical-answer rewriting. Zero phrase remains the normal path.

### Historical approved areas

- Complete Display response with separate optional Spoken response and no unsafe truncation.
- Truthful local Listening/Speaking state, distinct stop/cancel scopes and stale-event guards.
- Five explicit session-local mode axes, prospective privacy/history behavior and a clear restrictions summary.
- Core Orb state/amplitude derived from real current local events, with reset and reduced-motion behavior.
- Responsive base viewports, chat-first mobile layout and full conversation operation without WebGL.
- Public-safe, accessible and capability-labelled SelfKnowledge.
- Exact approved phrase allowlist, pending-record exclusion, null default and no mode ritual.
- No false claim that wake word, speaker verification, streaming, tools, agents, automations, cross-device behavior or production is implemented.

### Historical required next action

Return the two blocking findings to Development for the smallest corrections on the isolated Phase 7 branch. The corrected Functional Commit requires proportional QA, Security and UI/UX re-review of the affected accessibility, Modes, Escape/focus and live-announcement surfaces. Preserve every approved phrase decision and do not add, alter or activate phrase variants to solve these defects.

Do not start Phase 8, merge, deploy or change Production Readiness. UI/UX must update only its own handoff section and create its documentation commit after the Coordinator opens the serialized window.
