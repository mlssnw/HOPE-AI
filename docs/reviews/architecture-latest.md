# Architecture Review — Latest

- Status: `WAITING_FOR_APPROVAL`
- Decision ID: `ARCH-2026-11-06-001`
- Date: 2026-11-06
- Review type: Phase 7 generation-boundary ruling; documentation only
- Branch: `codex/phase-7-conversational-presence`
- Repository HEAD analyzed: `b7c73b16293779b1ab28ffed5cccdfdad84258a9`
- Implemented baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`
- Phase 7 Functional Commit: `NONE`
- Existing Phase 7 authorization: preserved within the approved plan
- Proposed generation amendment: `WAITING_FOR_APPROVAL`; not authorized by this ruling
- Full Phase 7 implementation/delivery: `BLOCKED` by the generation-boundary contradiction
- Escalation: `USER`
- Production Readiness: `BLOCKED`

## Ruling

A per-turn presentation selector on the existing `/api/chat` request and a bounded server-authored generation instruction are a technically suitable solution, but are **not compatible with the literal current authorization**. They require the owner's explicit approval of the narrow amendment below. The Planner can propose and reconcile that amendment; the Planner cannot grant the missing permission.

The current plan independently prohibits new transmission of a preference, changes to the system prompt and backend API expansion. Its Test Strategy explicitly requires proof of "no backend API expansion". Adding an optional request field changes that contract even without adding an endpoint. Adding a presentation instruction changes the effective provider-bound system text even if the provider JSON keys are unchanged. Calling the instruction non-core does not make those existing prohibitions disappear.

The owner's later personality correction requires personality in the substantive answer and rejects ritual wrappers. It establishes the required experience; it does not expressly authorize the new technical transmission or supersede these non-goals. The UI/UX specification itself makes the phase plan authoritative for scope and says it authorizes no new data flow. The contradiction therefore cannot be resolved by a Planner-only editorial interpretation.

Development must not implement the proposed generation path until approval is recorded. Independent, already authorized local contracts may continue without claiming that style generation works or that the complete phase is ready for review. No new authorization is needed for the bounded TTS/history corrections below. The Coordinator must reflect this technical blocker in the operational panel; this ruling does not overwrite Coordinator or reviewer ownership.

## Evidence and correction to the problem statement

- [`../../frontend/js/chat.js`](../../frontend/js/chat.js) sends `message`, `history`, `use_web`, `use_vault` and `memory_enabled`; it sends no selected style. [`../../backend/models.py`](../../backend/models.py) forbids extra request fields.
- [`../../backend/ai/orchestrator.py`](../../backend/ai/orchestrator.py) already calls `infer_personality_state(request.message)` and `build_system_prompt(self.personality, expression)`. The active prompt is therefore not entirely fixed: its existing expressive state varies from the submitted message. That inference is not a trusted UI-mode channel and does not implement the four selected presentation styles.
- [`../../backend/ai/personality.py`](../../backend/ai/personality.py) and [`../../backend/ai/prompts.py`](../../backend/ai/prompts.py) contain the current core personality, style and safety rules. Mapping a UI mode to an existing `PersonalityState` would still change which effective system text is sent and would not satisfy the prohibition by itself.
- [`../../backend/services.py`](../../backend/services.py) sends the selected system text through the existing provider `system` field. Its legacy `chat` path uses `SYSTEM_PROMPT`; tests use both the orchestrated and compatibility paths. Neither path may silently discard a newly approved style contract.
- The corrected [UI/UX specification](../design/phase-7-conversational-presence-spec.md#4-modes-and-truthful-communication), particularly `UIUX-P7-016` and `UIUX-P7-017`, requires answer-native composition and forbids mode-triggered phrases. Its [review](uiux-latest.md) approves the experience, not backend/provider changes.
- [`../../tests/frontend/presentation-state.test.mjs`](../../tests/frontend/presentation-state.test.mjs) currently re-enables remote state after a new local request. It does not prove that late events from the cancelled prior turn are rejected after the next turn starts.
- [`../../frontend/js/api-client.js`](../../frontend/js/api-client.js) slices speech text to 5,000 characters. [`../../frontend/js/chat.js`](../../frontend/js/chat.js) passes the entire session history to storage; [`../../frontend/js/storage.js`](../../frontend/js/storage.js) also deletes prior stored history when `saveHistory` receives `false`. These paths need bounded corrections to meet already approved invariants.

## Smallest proposed amendment — not yet authorized

Owner approval must explicitly allow only the following exception to the request, preference-transmission and system-prompt prohibitions. All other non-goals remain unchanged. No functional file may be edited to implement this proposal before that approval.

### Request contract and validation

- Add exactly one optional field to the existing `POST /api/chat` JSON body: `presentation_mode`, with exact string values `NORMAL`, `FOCUS`, `SUPPORTIVE` or `PRESENTATION`; omission means `NORMAL`.
- Preserve `extra="forbid"` and all existing limits. Reject `null`, wrong types, unknown values, case variants, whitespace variants and free-form instructions with the normal `422` validation response, before generation or source collection. Do not silently normalize arbitrary text into an instruction.
- Make no response-schema, endpoint, header, TTS-schema, WebSocket-schema or provider-schema change under this exception. Do not send the other four mode axes as new fields.
- Snapshot the selected style at turn submission. A later UI change applies to the next turn and cannot mutate an in-flight request, retry result or displayed answer. A retry takes a new attempt identity and an explicit snapshot.
- Accept style selection only from explicit local mode controls. Do not parse retrieved memory, history, model output, web results or documents as selectors. Natural-language mode-command recognition is unnecessary for this first package and is excluded from this amendment.

### Trust boundary and prompt placement

- Treat the client enum as an untrusted, bounded presentation preference, never as identity, permission or capability. Server validation chooses from immutable, server-owned instructions; the browser cannot submit prompt text, templates, tags or arbitrary policy fragments.
- Preserve `PersonalityConfig`, `PersonalityState`, `infer_personality_state` and every existing core prompt section and its ordering. For `NORMAL` and omitted values, preserve the existing effective prompt exactly for the same input and inferred expression.
- For the other three validated values, append one separately named `[TURN PRESENTATION]` section after the existing core prompt. Its heading and instruction together must be at most 1,000 Unicode characters. Only static server-authored text may populate it; no user text, history, memory, sources, phrase records, identifiers or private mode values are interpolated.
- The section must state that it affects only the current answer's wording, organization and pacing, remains subordinate to all core rules and never changes facts, warnings, uncertainty, required confirmations or capability claims. Safety-sensitive `ALERT`/`CONCERNED` behavior continues to suppress humor; presentation cannot weaken it.
- Keep this overlay in a small separate pure helper/module and compose it at the model-generation boundary. Do not rewrite the core personality or add personas. Do not insert hidden instructions into `message`, `history`, `memory_context` or `external_context`.
- Preserve existing trust delimiters for memory and sources. An enum-looking value or a forged `[TURN PRESENTATION]` block in those inputs remains data. It cannot choose the static section or affect client mode state.

### Exact mode semantics

| Value | Bounded generation behavior |
|---|---|
| `NORMAL` | Existing prompt and behavior; no overlay. |
| `FOCUS` | Start with substantive diagnosis, evidence, constraint or next action; concise organization; no ritual acknowledgment or automatic phrase. Preserve necessary completeness. |
| `SUPPORTIVE` | Keep HOPE direct and analytical; group manageable steps and identify a concrete priority when warranted. Acknowledge only user-stated difficulty; no inferred emotion, therapeutic script, automatic reassurance or persona change. |
| `PRESENTATION` | Organize the substantive explanation for comprehension with an appropriate sequence and structure. No introductory ritual, invented audience facts or suppressed caveats. |

Generated behavior remains probabilistic. Deterministic tests can prove selector mapping and trust boundaries; mocked output cannot prove provider adherence. Do not claim guaranteed phrasing or real-provider fidelity from a fake-model fixture.

### Memory, privacy and provider boundary

- Style never changes `memory_enabled`, web/vault toggles, history eligibility, capture, retrieval, deletion, confirmation, output permission or public-safe `SelfKnowledge`.
- Resolve `PRIVATE`/`PUBLIC` restrictions before submission using the existing `memory_enabled=false` contract. The backend's existing memory opt-out remains authoritative and must still block retrieval, capture and memory commands in every style. Do not persist any mode or style metadata.
- No mode value or overlay is appended to user messages, saved history, memory candidates, memory source records or logs. Original user content remains the only candidate for the existing capture path.
- The only allowed provider delta would be the bounded static section inside the existing `system` string for non-default styles. Preserve the provider, model configuration, endpoint, transport, JSON keys, `max_tokens`, number of generation calls, retries, source collection and TTS settings. No new API option, tool, second model pass, streaming, provider dependency or fallback.
- An added system section can add input tokens to an ordinary future user-triggered call. This is not evidence of zero marginal token cost. Owner approval must include that bounded consequence; this work performs no paid call and changes no credential, budget, subscription or cost setting. If any actual spending or budget expansion becomes necessary, stop for separate authorization.

### Required tests if the amendment is approved

1. API validation: omitted/default and four exact values; reject null, wrong types, unexpected fields, case/whitespace variants and injected text before any source/model call.
2. Prompt composition: identical existing core prefix and exact `NORMAL` baseline for every inferred expression; exactly one static bounded section for each non-default style; no arbitrary text interpolation; `ALERT`/`CONCERNED` safety precedence.
3. Mocked orchestrator/provider boundary: selected style reaches the existing generation call; its message/history, source collection, provider JSON keys, model, output limit and call count remain unchanged. Exercise the legacy compatibility path too, or prove that it cannot be a production bypass; do not quietly ignore the new field.
4. Injection: hostile current-message/history/source/memory strings cannot change the selected static overlay or trigger client mode/phrase state. Invalid selectors fail closed. Keep retrieved context in the existing untrusted data blocks.
5. Privacy cross-product: all styles with memory opt-out and restricted modes perform zero retrieval/capture; no selector/overlay appears in stored history, memory, logs or TTS metadata. Test mode changes during pending responses.
6. Frontend integration: explicit selection is snapshotted per turn; no mode-entry/change phrase hook; no rewriting of the canonical reply; zero phrase remains normal; cancellation invalidates late generation and playback.
7. Representative synthetic answer fixtures and UI/UX review assess direct Focus, recognizable Supportive and substantive Presentation organization, complete caveats and exact approved phrase boundaries. Label fixture evidence honestly; no paid/live generation validation is authorized.

QA, Security and UI/UX remain required on the same future Functional Commit. Database remains `NO` only while no schema, query, model or persistence expansion occurs.

## Related Development questions resolved within the existing scope

### Correlation and realtime

Session/turn/attempt metadata on **local in-process** operation events and callbacks is already authorized by the explicit `TurnManager`/`VoiceStateManager` contracts. It must be ephemeral, bounded and never treated as authentication.

Adding end-to-end correlation fields to HTTP requests or the server-to-browser WebSocket wire contract is a contract expansion and is **not** authorized by this ruling or the one-field generation amendment. A generic `dict` event payload does not remove that architectural boundary. Server-generated IDs alone do not establish correspondence to a local turn, and arrival time is not proof of origin.

The smallest currently authorized implementation rejects uncorrelated `AI_STATE_CHANGED` messages as sources of current turn state. It uses actual locally correlated chat/capture/synthesis/playback callbacks for that state, preserving incremental memory events, heartbeat, reconnect and full-sync fallback. Never stamp an uncorrelated remote event with the active local IDs or accept it just because a request is running. A remote `speaking` event from `/api/tts` starts at synthesis time and cannot prove client audio playback. Display `SEARCHING` only when evidence identifies real current search; otherwise retain truthful Processing.

If Development needs wire correlation instead of this conservative path, submit a separately enumerated request/event metadata amendment to the owner before implementation. The present proposal deliberately avoids it. Tests must cover cancel A, start B, then late thinking/searching/speaking/error/idle from A, plus missing/foreign IDs, retries and stale recognition/audio events. Adapt the old raw-remote-state browser expectation to the approved local truth invariant; preserve memory realtime coverage.

### Speech length and canonical meaning

Removing silent `text.slice(0, 5000)` is an authorized correctness change to the existing client path. Keep the backend/provider limit and the single existing TTS request unchanged. Format conservatively; if the complete safe spoken rendition cannot fit within the existing limit, preserve the complete display, disclose speech unavailability for that response and send no TTS request. Do not truncate a warning, generate a new summary, split into multiple paid calls, increase the limit or add a provider feature. Test a material warning beyond the limit, exact-limit inputs, Unicode boundaries, formatter failure and zero TTS calls for unsafe/oversized output.

### Private history cannot be saved later

An in-memory per-turn persistence-eligibility decision, applied to both user and assistant messages on every existing history write, is already authorized. A turn submitted under `PRIVATE` stays ineligible after the mode ends and after its response arrives; changing unrelated preferences or restoring persistence must not re-save it. Maintain the canonical visible session separately from the eligible subset written to the existing history key and existing `{role, content}` format. No new storage key, durable privacy flag, table, query, record type or retention mechanism is permitted.

Entering `PRIVATE` suspends new history writes without deleting previously stored history. Do not invoke the existing delete-on-false storage behavior merely to implement the mode. Preserve the explicit existing history-off/clear actions and their deliberate deletion semantics. Session mode metadata never reaches storage. Test delayed responses, mode restoration, unrelated preference toggles, save/reload, prior-record preservation and both halves of the private turn. These guarantees govern saved records, not retroactive erasure or semantic redaction of content the owner later explicitly repeats in a new eligible turn.

## Rejected workarounds and phrase reconciliation

- Reject `prefix + reply + suffix`, automatic mode phrases, manufactured acknowledgments and deterministic rewriting/reordering/summarizing of the canonical generated answer as substitutes for response-native style. Speech formatting remains allowed only for the separate spoken representation under its existing meaning-preservation contract.
- Reject silently prepending mode instructions to the user's message/history and repurposing `PersonalityState` as a way to conceal a prompt change.
- Only `P7-PHRASE-006` through `P7-PHRASE-018` are approved, with their exact Unicode text, recorded context, cooldown and suppression rules. Approval is eligibility, not a quota or permission to inject them routinely.
- `P7-PHRASE-021` through `P7-PHRASE-028` remain `PENDING_OWNER_APPROVAL`, excluded from code, fixtures, tests, snapshots, defaults and active content. They do not cause this blocker.
- Rejected/withdrawn records remain excluded. No phrase is created, changed or approved by this ruling; the [UI/UX register](../design/phase-7-phrase-proposals.md) remains authoritative.

## Preservation, validation and handoff

- No new provider, endpoint, persistence, database operation, schema, migration, secret, credential, paid call, budget change, deployment, production action, tool, agent, automation, integration or Phase 8 work is authorized.
- This decision changes only Planner-owned planning/review documentation and the Planner handoff section. No functional code or reviewer finding changes; no public runtime claim changes and no README/CHANGELOG update is needed for this pending amendment.
- Read the required governance, phase, design, phrase and review sources and the relevant frontend/backend/tests. Verified a clean initial tree on `b7c73b1`; local HEAD was six documentation commits ahead of the available `origin/main` ref, with no behind commits. No remote refresh or production access was needed.
- Validation for this documentation change: diff/whitespace, local Markdown link targets, changed-file scope and handoff ownership. No runtime test, browser test, database or provider validation is claimed.
- Next principal action: Coordinator presents the exact one-field/one-section amendment and its token consequence to the owner. After explicit approval, Planner reconciles the affected plan clauses and the Coordinator releases the disputed implementation. If declined, the response-native style requirement must be explicitly deferred/re-scoped with the owner and UI/UX; no silent weakening is allowed.
- Owner-facing ruling (PT-BR): a geração por modo está bloqueada até autorização explícita da emenda limitada; correções locais independentes já autorizadas podem avançar. Não há autorização presumida para prompt, payload, custo ou fase futura.

---

## Historical decision — ARCH-2026-09-25-001

The following record is preserved as historical evidence. Its original authorization remains valid within its scope; its immediate routing and gate statements are superseded by the current ruling and the later persisted UI/UX/phrase decisions.

- Status: `APPROVED`
- Decision ID: `ARCH-2026-09-25-001`
- Date: 2026-09-25
- Product model: `SINGLE_USER`
- Branch: `main`
- Repository HEAD analyzed: `cdb40098489d28dd476a2b9c211cd6289a325888`
- `origin/main` analyzed: `122505f25a7e91eca1f9a5e3aadd15c6a25715b9`
- Implemented baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`
- Coordinator authorization record: `cdb40098489d28dd476a2b9c211cd6289a325888`
- Phase 7 planning: `APPROVED`
- Phase 7 implementation authorization: `APPROVED`
- Phase 7 implementation: `NOT_STARTED`
- Phase 7 Functional Commit: `NONE`
- Production Readiness: `BLOCKED`

## Problem

The owner explicitly authorized implementation of Phase 7 — Conversational Presence Foundation on 2026-09-25, strictly within the already approved plan. The Coordinator persisted that decision in `cdb4009`, but active canonical planning sources still described Phase 7 as `WAITING_FOR_APPROVAL` or `NOT_AUTHORIZED` and still treated Phase 6 integration as pending.

The authorization also introduced a mandatory owner gate for every exact `PhraseLibrary` phrase. Without one canonical protocol, a phase-level approval could be misread as approval of unwritten variants, or unapproved product language could leak into code, fixtures, tests or defaults.

## Current State

- Phase 6 is complete and integrated into `main` through `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`.
- The owner approved the exact Phase 7 plan and authorized implementation within its boundaries.
- No Phase 7 functional implementation or Functional Commit exists.
- The immediate workflow step is a pre-implementation UI/UX specification routed by the Coordinator.
- Development, QA, Security and Database are not active for Phase 7.
- The current runtime still exposes the frozen legacy metadata `6.0.0-phase.5`; this is not the Phase 7 status.
- Production Readiness remains `BLOCKED` by inherited security, database and operational findings.
- No provider, cloud audio, wake word, speaker verification, persistence, database, migration, integration, tool, agent, deployment, production action or Phase 8 work is authorized.

## Constraints

- Documentation-only reconciliation; no code, tests, frontend, backend, schema, migrations, database operations, secrets or infrastructure changes.
- Preserve every existing Phase 7 non-goal and the `SINGLE_USER` direction.
- Do not treat authorization as implementation, verification, Functional Commit creation or feature approval.
- Do not start UI/UX, Development, QA, Security or Database from the Planner Work; return routing to the Coordinator.
- Do not edit reviewer-owned reports or Coordinator-owned handoff sections.
- Create no phrase and infer no phrase approval.
- Keep every exact phrase blocked until the owner decides that exact item.

## Options

### Option A — Record the phase authorization as a broad implementation approval

- Pros: minimal documentation; fewer explicit gates.
- Cons: makes phrase approval ambiguous; can be misread as permission for variants, future copy or scope expansion.
- Cost: low documentation cost, potentially high correction and review cost.
- Complexity: low initially, high when provenance and wording disputes emerge.
- Security impact: weakens the human approval boundary for product language and makes prompt/content-derived phrase expansion harder to detect.
- Database impact: none directly, but the broad wording may obscure the existing no-persistence boundary.
- Maintenance impact: approval scope becomes difficult to audit.

### Option B — Record scoped phase authorization plus an exact-item phrase protocol

- Pros: preserves the approved implementation scope, creates traceable phrase decisions, supports natural UI/UX review and prevents inferred batch approval.
- Cons: UI/UX must maintain one record per proposed phrase and the owner must decide each item.
- Cost: low documentation and review overhead; no provider or infrastructure cost.
- Complexity: low to medium and bounded to specification/approval records.
- Security impact: fail-closed for unapproved copy; content cannot self-authorize or broaden an approval.
- Database impact: none; phrase persistence remains outside Phase 7.
- Maintenance impact: explicit provenance and exact-text decisions simplify later review.

## Recommendation

Adopt Option B.

Record Phase 7 planning and implementation authorization as `APPROVED` while preserving implementation as `NOT_STARTED` and Functional Commit as `NONE`. The next route is Coordinator → UI/UX for the complete pre-implementation specification. UI/UX must present every exact phrase separately with context, intended tone and `PENDING_OWNER_APPROVAL`. Development remains blocked until that specification is persisted and every phrase intended for the implementation package has an explicit owner decision.

## Rationale

The owner decision is explicit, so retaining `NOT_AUTHORIZED` would be false. Treating the phase authorization as evidence of implementation would also be false. Separate fields preserve both truths.

Exact-item approval is the smallest sufficient control for language that directly represents HOPE's identity. It avoids a new service, database or policy engine while ensuring a single accepted phrase cannot silently authorize paraphrases, localizations or future variants.

## Architecture

```text
Owner authorization (Phase 7 scope)
                │
                ▼
Planner canonical reconciliation
                │
                ▼
Coordinator routes UI/UX specification
                │
                ├── non-phrase experience contracts
                │
                └── exact phrase proposal records
                           │
                           ▼
                 PENDING_OWNER_APPROVAL
                           │
                  owner decision per item
                           │
                           ▼
             approved exact items only
                           │
                           ▼
Coordinator may route Development
```

The implementation architecture remains the component model in [`docs/phase-7.md`](../phase-7.md): `DisplayResponse`/`SpokenResponse` separation, `SpeechFormatter`, `TurnManager`, `VoiceStateManager`, `VoiceManager`, provider-neutral hints, modes, public-safe `SelfKnowledge` and local ephemeral output amplitude.

Phrase records are specification evidence, not runtime authority. Each record contains exact text, locale/category, usage context, intended tone, safety eligibility and status. The owner decision is exact-text and exact-context scoped. Any edited or derived text is a new proposal.

## Required Reviews

| Work | Required | Reason |
|---|---|---|
| QA | YES | future functional behavior, cancellation, races, accessibility and phrase-gate enforcement require regression testing |
| DATABASE | NO | Phase 7 prohibits persistence, schema, migrations and query changes; any data impact reopens the plan |
| SECURITY | YES | voice state, privacy modes, untrusted content, `SelfKnowledge` and truthful claims are security boundaries |
| UI/UX | YES | pre-implementation specification and post-implementation fidelity review are mandatory; UI/UX prepares but does not approve phrases |

## Risks

- Authorization could be mistaken for completed implementation or Feature Approval.
- A phrase approved once could be reused as implicit approval for a variant.
- UI/UX could present phrases in a batch without sufficient context for an informed decision.
- Unapproved text could enter fixtures or tests and later be promoted to product defaults.
- Personality language could become robotic, repetitive or imitate a referenced character.
- The Phase 7 boundary could expand into providers, cloud audio, persistence or Phase 8 security work.
- The local `main` branch is ahead of `origin/main` by documentation; later work must verify its exact baseline.

## Acceptance Criteria

- [x] Phase 6 is recorded as complete and integrated at `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`.
- [x] Phase 7 planning and implementation authorization are recorded as `APPROVED`.
- [x] Phase 7 implementation remains `NOT_STARTED` and Functional Commit remains `NONE`.
- [x] Production Readiness remains `BLOCKED`.
- [x] All Phase 7 non-goals remain in force.
- [x] UI/UX is identified as the next pre-implementation specification role, subject to Coordinator routing.
- [x] Every exact phrase proposal starts `PENDING_OWNER_APPROVAL` and includes context and intended tone.
- [x] Approval of one phrase does not approve another phrase, variant, localization or future rewrite.
- [x] Unapproved phrases are prohibited from code, fixtures, tests, snapshots, defaults, seeded content and active product content.
- [x] No phrase is created by this decision.
- [x] No provider, database, migration, cloud, deployment, production, Phase 8 or later-phase work is authorized.
- [x] No functional code or reviewer-owned record is changed.

## Implementation Phase

1. `COMPLETE` — owner approval of the exact Phase 7 plan and scoped implementation authorization.
2. `COMPLETE` — Planner canonical reconciliation and phrase-gate definition.
3. `NEXT / NOT_STARTED` — Coordinator routes UI/UX pre-implementation specification.
4. `OWNER GATE` — owner decides every proposed exact phrase separately.
5. `BLOCKED UNTIL GATES COMPLETE` — Development routing.
6. Future Development produces one exact Phase 7 Functional Commit.
7. QA, Security and UI/UX review that same hash; Database remains `N/A` only if the no-persistence boundary holds.
8. Planner consolidates without starting Phase 8.

## Deferred Items

- Any Phase 7 code or test implementation.
- UI/UX phrase proposals and all exact owner phrase decisions.
- Provider evaluation, cloud STT/TTS, streaming, wake word and speaker verification.
- Authentication, `PermissionManager` and all Phase 8 work.
- Database, migrations, persistence and real PostgreSQL operations.
- Tools, agents, coding, integrations, external effects and automations.
- Deployment, public exposure, Production Readiness and acceptance of HIGH/CRITICAL risk.
- Phase 8 and every later phase.

## Coordinator Handoff

- Recommended next role: `COORDINATOR`.
- Status: `APPROVED` for this architecture reconciliation; Phase 7 implementation remains `NOT_STARTED`.
- Task: normalize the public coordination panel, then route the complete Phase 7 pre-implementation specification to `UI/UX` against baseline `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`.
- UI/UX must present every exact phrase proposal separately with context, intended tone and `PENDING_OWNER_APPROVAL`.
- Do not route Development until the UI/UX specification is persisted and every exact phrase intended for implementation has an explicit owner decision.
- Do not route providers, Database, migrations, cloud, deployment, production or Phase 8.
