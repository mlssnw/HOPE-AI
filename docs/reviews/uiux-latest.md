# UI/UX Review — Latest

- Status: `REJECTED`
- Date: 2026-11-15
- Phase: 7 — Conversational Presence Foundation
- Review type: `PHASE 7 POST-IMPLEMENTATION UI/UX REVIEW`
- Target Functional Commit: `c649a903693d5fedf631d760880b80ed881dc138`
- Functional baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`
- Architecture decision: `ARCH-2026-11-14-001`
- Development documentation/evidence commit: `6919c967c66f728471b5c195079dabda33a3e3ed`
- Coordination commit: `08e3984986798dfee0500f6af6cd3f695e57a910`
- Review workspace boundary: commits after the target were documentation/evidence only; the exact target code was inspected through Git object paths.
- Functional delta from target to the final validation HEAD: `NONE`
- Production Readiness: `BLOCKED`

## Scope and method

UI/UX independently reviewed the complete Phase 7 functional sequence through the exact target, including backend presentation mode work, the local response/voice integration and the final public homage-boundary correction. The review did not treat the last commit or Development's summary as sufficient evidence.

The assessment covered the canonical Phase 7 specification, the exact phrase register, the mandatory visual/accessibility contracts, changed runtime code, focused tests and the committed evidence in [`../evidence/phase-7/`](../evidence/phase-7/). The Phase 7 browser runner was not started because QA owned the fixed port and browser window. No real microphone, paid provider, PostgreSQL, production service or physical device was used.

Independent non-browser validation performed from this worktree:

- Frontend suite: `62 passed`.
- Focused presentation backend suite: `15 passed`.
- Exact target-to-HEAD path inspection: documentation/evidence only; no backend, frontend or test delta after the Functional Commit.
- Static phrase scan: `P7-PHRASE-021` through `P7-PHRASE-028` and their exact texts are absent from frontend, backend and tests.

## Verdict

The implementation satisfies the main product direction: canonical display and optional speech are separate; modes are explicit and prospective; voice and Core Orb state use real local events; privacy restrictions fail memory closed; public SelfKnowledge is accessible and capability-labelled; personality is guided inside the substantive generated answer; mode changes do not invoke phrases; and only the 13 exact approved phrase records are present.

Approval is blocked by two accessibility/interaction defects in Phase 7 surfaces:

1. the Modes surface can lose reachable content and lacks the required touch-close/focus-entry behavior;
2. actionable voice/chat failures are written to both polite and assertive live regions, with an additional generic state announcement possible for the same failure.

These are direct failures of required `UIUX-P7-006`, `UIUX-P7-010` and the Phase 7 accessibility contract. They require a new Functional Commit and proportional re-review of the affected surfaces. This result does not approve the phase or production.

## Findings

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

## Warnings and limits

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

## `UIUX-P7-*` result matrix

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

## Phrase and personality preservation

- The prior pre-implementation UI/UX specification remains `APPROVED`; this post-implementation rejection does not rewrite that historical decision.
- Exact owner-approved records remain only `P7-PHRASE-006` through `P7-PHRASE-018`, in their recorded context, cooldown and suppression boundaries.
- `P7-PHRASE-001`, `P7-PHRASE-002`, `P7-PHRASE-004`, `P7-PHRASE-005`, `P7-PHRASE-019` and `P7-PHRASE-020` remain `REJECTED`.
- `P7-PHRASE-003` remains `WITHDRAWN_FROM_ACTIVE_PACKAGE`.
- `P7-PHRASE-021` through `P7-PHRASE-028` remain `PENDING_OWNER_APPROVAL`, excluded and non-blocking. This review does not approve them, their punctuation, variants, translation or context changes.
- `NO_REPLACEMENT_NEEDED` remains the UI/UX recommendation for the four rejected functions covered by the optional alternatives.
- Personality remains response-native. There is no automatic mode phrase, mode-entry assistant message, frontend prefix/suffix, hidden user-message instruction or canonical-answer rewriting. Zero phrase remains the normal path.

## Approved areas

- Complete Display response with separate optional Spoken response and no unsafe truncation.
- Truthful local Listening/Speaking state, distinct stop/cancel scopes and stale-event guards.
- Five explicit session-local mode axes, prospective privacy/history behavior and a clear restrictions summary.
- Core Orb state/amplitude derived from real current local events, with reset and reduced-motion behavior.
- Responsive base viewports, chat-first mobile layout and full conversation operation without WebGL.
- Public-safe, accessible and capability-labelled SelfKnowledge.
- Exact approved phrase allowlist, pending-record exclusion, null default and no mode ritual.
- No false claim that wake word, speaker verification, streaming, tools, agents, automations, cross-device behavior or production is implemented.

## Required next action

Return the two blocking findings to Development for the smallest corrections on the isolated Phase 7 branch. The corrected Functional Commit requires proportional QA, Security and UI/UX re-review of the affected accessibility, Modes, Escape/focus and live-announcement surfaces. Preserve every approved phrase decision and do not add, alter or activate phrase variants to solve these defects.

Do not start Phase 8, merge, deploy or change Production Readiness. UI/UX must update only its own handoff section and create its documentation commit after the Coordinator opens the serialized window.
