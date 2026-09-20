# Architecture Review — Latest

- Status: WAITING_FOR_APPROVAL
- Decision ID: `ARCH-2026-09-20-002`
- Date: 2026-09-20
- Product model: `SINGLE_USER`
- Approved parent decision: `ARCH-2026-09-20-001` — `APPROVED` by owner on 2026-09-20
- Approval record analyzed: `f85b9bb775574b8a1340497e3e9e6d99b9b19c8c`
- Functional Commit preserved: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
- Repository HEAD analyzed: `f85b9bb775574b8a1340497e3e9e6d99b9b19c8c`
- Phase 7 planning: WAITING_FOR_APPROVAL
- Phase 7 implementation: NOT_STARTED
- Phase 7 implementation authorization: NONE
- Production Readiness: BLOCKED

## Problem

The owner approved the product vision, roadmap, `ARCH-2026-09-20-001`, the personality/public `SelfKnowledge` boundary and Phase 7 as the next planning target. The project now needs an exact Phase 7 plan that delivers safe local conversational-presence foundations without turning roadmap approval into implementation authorization or crossing into cloud audio, biometrics, persistence, providers, effects or production.

## Current State

- Phase 6 remains frozen as `APPROVED_WITH_WARNINGS` on Functional Commit `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`.
- The owner approved `docs/product-vision.md`, `docs/roadmap.md` and the target architecture on 2026-09-20.
- The owner approved Dean Winchester as a general-trait reference alongside Lena Luthor and Tony Stark and allowed those inspirations in public-safe `SelfKnowledge`.
- The owner approved recognition/original homage only when explicitly requested; literal famous quotes, copied dialogue, identity imitation, voice cloning and continuous acting remain prohibited.
- Current voice remains browser dictation plus optional TTS, with no generic conversational-presence contract.
- Core Orb and status already reflect real voice signals, but display/spoken separation, formal turn ownership, mode resolution, public `SelfKnowledge` and ephemeral output amplitude are not implemented.
- Owner identity remains a browser-controlled UUID. Production Readiness remains `BLOCKED`.
- No Phase 7 implementation, UI/UX specification, provider evaluation, database change or production action has started.

## Constraints

- Planning and documentation only.
- Preserve the exact Phase 6 Functional Commit and all reviewer findings.
- Do not edit functional code, tests, migrations, reviewer reports, design ownership files or `AGENTS.md`.
- Do not add new STT/TTS cloud flow, provider, endpoint, credential, cost or retention.
- Do not add wake word, speaker profile, biometric processing, cross-device behavior, persistence, integration or external effect.
- Do not authorize UI/UX or Development.
- Future implementation must remain local/controlled and truthful about capabilities.
- Any normative `AGENTS.md` reconciliation must be a separate owner/Coordinator-controlled change because the current working tree already contains an owner change in that file.

## Options

### Option A — Extend the current voice controller as a monolith

- Pros: fewer initial modules and direct reuse of the current browser/TTS path.
- Cons: formatting, state, cancellation, playback, modes and personality become coupled.
- Cost: low initially, increasing with later realtime voice.
- Complexity: low initially; high under race conditions and client reuse.
- Security impact: privacy and stale-turn boundaries remain implicit.
- Database impact: none if disciplined, but future persistence can enter without an explicit seam.
- Maintenance impact: high coupling to the current browser and provider path.

### Option B — Small deterministic components behind a VoiceManager facade

- Pros: isolates content transformation, turn validity, state, modes and presentation; tests remain provider-free; future adapters stay replaceable.
- Cons: requires explicit contracts before visible expansion.
- Cost: low-to-medium with no new provider spend.
- Complexity: medium and bounded.
- Security impact: privacy, cancellation and public-manifest invariants become testable.
- Database impact: none; all Phase 7 state is ephemeral.
- Maintenance impact: lower and reusable by future installed clients.

## Recommendation

Adopt Option B and submit `docs/phase-7.md` for owner approval. Keep implementation `NOT_STARTED` and `NOT_AUTHORIZED`. The phase ends at local presentation/orchestration contracts over existing capabilities; any need for new external audio, provider, persistence, identity, device or effect returns to the Planner.

## Rationale

Display/spoken separation, deterministic turn cancellation, truthful voice state and local output amplitude solve current product gaps without requiring a trusted owner session or sending a new data class externally. The same boundary preserves voice priority while keeping the sensitive capabilities behind Phase 8 and later roadmap gates.

## Architecture

```text
Canonical response ──┬──► DisplayResponse ──► UI
                     │
                     └──► SpeechFormatter ──► SpokenResponse
                                                  │
TurnManager ── cancel / validity ───────────────► VoiceManager
                                                  │
                                                  ├──► existing playback path
                                                  └──► VoiceStateManager
                                                            │
                                             local amplitude ─┴─► Core Orb/status

ModeResolver ──► narrower presentation/privacy/output behavior
SelfKnowledgeManifest ──► allowlisted public identity/capability facts
PhraseLibrary ──► original optional surface language
```

Key decisions:

- Display content remains canonical; spoken content is a traceable presentation derivative.
- Turn/session identity is authoritative for cancellation and late-event rejection.
- `VoiceManager` wraps existing capabilities but adds no provider or data flow.
- Modes can restrict memory/output but never grant permission or alter truth.
- `SelfKnowledge` is curated, versioned and public-safe; capability claims require real state.
- PhraseLibrary is original and subordinate to substantive content.
- Output amplitude remains local, ephemeral and non-biometric.

## Approved Personality and SelfKnowledge Boundary

- Approved inspirations: Lena Luthor, Tony Stark and Dean Winchester, as general traits only.
- Public `SelfKnowledge`: may name those approved inspirations while identifying only as HOPE.
- Explicit-reference rule: recognition or original homage is allowed only when the owner explicitly requests it.
- Prohibited: literal famous quotes, copied dialogue, character identity imitation, cloned voice, recognizable or sustained acting and copyrighted passage reproduction.
- Runtime status: unchanged; this decision does not implement or modify prompts.
- Documentation follow-up: any `AGENTS.md` wording update must be isolated from this commit and must preserve the owner's preexisting working-tree change.

## Scope and Non-goals

In scope:

- display/spoken separation;
- `VoiceManager`, `SpeechFormatter`, `TurnManager`, `VoiceStateManager`;
- provider-neutral prosody/pronunciation contracts;
- original PhraseLibrary;
- combinable, session-local modes;
- public-safe `SelfKnowledge`;
- local/ephemeral amplitude of already-playing output;
- accessibility, cancellation and deterministic tests.

Out of scope:

- new cloud STT/TTS or streaming provider;
- background wake word;
- speaker profile or biometric processing;
- cross-device/client work;
- persistence, schema, migration or PostgreSQL real;
- integration, tool, agent or external effect;
- provider, credential, cost, deployment or production;
- Phase 8 or any later phase.

## Required Reviews

| Work | Required | Justification |
|---|---|---|
| QA | YES | content transformation, cancellation, race handling, browser behavior and regression are functional changes |
| DATABASE | NO | the plan prohibits persistence, schema, migration and query changes; any data impact forces replanning with Database `YES` |
| SECURITY | YES | voice privacy, modes, untrusted content, `SelfKnowledge` and truthful capability claims require security review |
| UI/UX | YES | spoken/display behavior, voice state, stop controls, Core Orb, reduced motion and accessibility require pre/post review |

## Risks

- Speech formatting may alter meaning or omit a material warning.
- A stale callback may speak after cancellation or overwrite current state.
- Privacy/audience modes may be misunderstood as retroactive deletion or concealment.
- Phrase selection may become repetitive or drift toward imitation.
- Public `SelfKnowledge` may leak protected data or overstate capability.
- Local amplitude may behave inconsistently under browser autoplay/Web Audio restrictions.
- The phase may drift into provider, background listening, biometrics or persistence.
- Roadmap/plan approval may be misread as implementation authorization.

## Acceptance Criteria

- [x] `ARCH-2026-09-20-001`, product vision and roadmap are recorded as owner-approved.
- [x] The approved personality/public `SelfKnowledge` decisions replace only their former pending state.
- [x] Phase 6 and its Functional Commit remain unchanged.
- [x] `docs/phase-7.md` defines problem, scope, non-goals, dependencies, architecture, contracts, privacy/security, database impact, tests, reviews, risks, rollout/rollback and authorization gates.
- [x] Phase 7 scope includes only the local/controlled conversational-presence foundation.
- [x] Required Reviews are QA YES, DATABASE NO, SECURITY YES and UI/UX YES with explicit reasons.
- [x] Production Readiness remains `BLOCKED`.
- [x] No code, migration, database, provider, credential, cost, deploy or production action is authorized.
- [x] The owner change in `AGENTS.md` and untracked assets remain outside the Planner commit.
- [ ] Owner approves or revises `ARCH-2026-09-20-002` and `docs/phase-7.md`.
- [ ] Owner separately authorizes Phase 7 implementation after plan approval.

## Implementation Phase

- Phase 7 planning: `WAITING_FOR_APPROVAL`.
- Phase 7 feature/implementation: `NOT_STARTED`.
- Phase 7 implementation authorization: `NONE` / `NOT_AUTHORIZED`.
- UI/UX pre-implementation: `NOT_STARTED` and not routed.
- Development: `NOT_STARTED` and not routed.
- Phase 8+: `NOT_STARTED`.
- Production Readiness: `BLOCKED`.

## Deferred Items

- Owner approval/revision of the exact Phase 7 plan.
- Separate Phase 7 implementation authorization.
- Any normative `AGENTS.md` reconciliation in an isolated owner/Coordinator change.
- Provider/license/cost/privacy evaluation for realtime voice, wake and speaker verification.
- Owner recognition and PermissionManager in Phase 8.
- Persistent modes, preferences, pronunciation, transcript or voice data.
- Cloud, clients, devices, tools, integrations, agents and production.

## Coordinator Handoff

- Recommended next role: `COORDINATOR`.
- Status: `WAITING_FOR_APPROVAL`.
- Task: normalize the approved parent decision in the public panel and present `ARCH-2026-09-20-002` / `docs/phase-7.md` to the owner for approval or revision.
- Do not route to: UI/UX, Development, Database implementation, provider evaluation, cloud or production.
- Boundary: approval of the phase plan would still not authorize implementation; a separate explicit owner authorization is required.
