# Architecture Review — Latest

- Status: WAITING_FOR_APPROVAL
- Decision ID: `ARCH-2026-09-20-001`
- Date: 2026-09-20
- Product model: `SINGLE_USER`
- Functional Commit preserved: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
- Repository HEAD analyzed: `ff1309f71cd4aaac0a096a9760abfb37e353177b`
- Product-direction intake: `docs/coordination/product-direction-2026-09-19.md`
- Preserves: Phase 6 `APPROVED_WITH_WARNINGS` in `ARCH-2026-09-19-001`
- Production Readiness: BLOCKED

## Problem

The new owner direction adds continuous voice, wake word, speaker verification, installed clients, device context, broader personality/self knowledge, organization, integrations, diagnostics, ModelRouter, automations and Bridge. The previous post-Phase 6 sequence places all voice after permissions and stores product vision, technical target and phase ordering in overlapping documents.

The architecture must preserve voice priority without allowing cloud audio, biometrics, background listening, remote clients or effects to bypass owner recognition, privacy and permission gates.

## Current State

- Phase 6 is closed and frozen at `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`.
- Current voice is partial: browser dictation plus optional ElevenLabs TTS, without a generic voice contract.
- The Core Orb already reacts to real speaking/listening state, but there is no formal turn, speech-formatting, prosody or phrase architecture.
- Owner identity remains a browser-controlled UUID and is not authentication.
- Production Readiness remains `BLOCKED` by existing Security/Database findings.
- The product direction in `ff1309f` is an intake, not an implementation authorization.
- The absolute ban on copied dialogue/catchphrases remains the binding personality rule.

## Constraints

- Documentation and planning only; no code, provider, credential, cost, migration, database, deploy or production action.
- Do not re-open or expand Phase 6.
- Do not present future capability as implemented.
- Preserve `SINGLE_USER`, cloud-first and provider-agnostic principles without introducing enterprise identity complexity.
- Audio, biometrics, location, messages, calendar writes, device control and external effects require explicit privacy/permission boundaries.
- Do not change the catchphrase/quote rule without an explicit owner decision.

## Options

### Option A — Voice capabilities before security

- Pros: fastest path to a visible voice-first product.
- Cons: risks retrofitting identity/privacy into cloud audio, background listening and speaker profiles.
- Cost: low initially, high rework and variable provider spend.
- Complexity: medium initially, high operationally.
- Security impact: unacceptable if extended beyond local presentation contracts.
- Database impact: low initially; high once profiles/transcripts/devices appear.
- Maintenance impact: duplicated provider and session logic is likely.

### Option B — Security and cloud foundation before all voice work

- Pros: simple dependency story and strong trust boundary first.
- Cons: postpones safe local conversation work that can validate product value without new sensitive data.
- Cost: medium-to-high upfront.
- Complexity: high before feedback.
- Security impact: strongest sequencing.
- Database impact: early session/identity/device work.
- Maintenance impact: infrastructure may be built before its actual interaction requirements are known.

### Option C — Local conversational foundation, then security, then sensitive voice/cloud

- Pros: preserves voice priority while keeping cloud audio, biometrics, registered devices and effects behind security.
- Cons: Phase 7 needs strict non-goals and cannot quietly become realtime cloud voice.
- Cost: incremental; provider cost deferred until justified.
- Complexity: moderate and staged.
- Security impact: acceptable if only local state/formatting/contracts precede Phase 8.
- Database impact: none in Phase 7; explicit reviews begin when identity or persistence changes.
- Maintenance impact: shared contracts reduce later duplication across web, desktop and mobile.

## Recommendation

Adopt Option C and the three-document split:

- `docs/product-vision.md`: canonical future product intent;
- `docs/roadmap.md`: canonical phase order, dependencies and gates;
- `docs/future-architecture.md`: canonical future technical contracts.

The documentation structure is approved by the Planner. The substantive roadmap and personality/privacy decisions remain `WAITING_FOR_APPROVAL`; no phase is authorized.

## Rationale

Formatting speech, managing turns, exposing real voice state and animating the Core Orb from local output amplitude do not require a new identity system or provider. Cloud streaming, speaker profiles, device registration and external effects do. Splitting the work at that trust boundary delivers useful product learning without normalizing insecure audio/data flows.

Separating product vision, roadmap and technical architecture also lets `docs/architecture.md` remain honest about current implementation and prevents the handoff/backlog from becoming substitute roadmaps.

## Architecture

```text
Product Vision
     │
     ▼
Roadmap + gates
     │
     ▼
Future technical contracts
     │
     ├─ Conversational Presence
     ├─ Owner / Resource / Permission gates
     ├─ Cloud + Clients + Devices
     ├─ ModelRouter + Diagnostics
     └─ Tools → Effects → Coding → Agents
```

Voice foundation:

```text
TurnManager → SpeechFormatter → VoiceManager → STT/TTS Adapter
      │              │                │
 cancel/barge-in   prosody,         VoiceStateManager
                  pronunciation          │
                  phrase library         ▼
                                   Core Orb + status
```

`VoiceManager`, `SpeechFormatter`, `TurnManager`, `VoiceStateManager`, `ProsodyManager`, `PronunciationManager`, `PhraseLibrary` and provider capability contracts are defined in `docs/future-architecture.md`. No provider is selected.

## Voice sequencing decision

| Capability | Before Phase 8 security? | Boundary |
|---|---|---|
| Display/spoken response separation | YES | local deterministic formatting; preserve safety/uncertainty |
| Turn and cancellation state | YES | local/control-plane state; no new external data |
| Voice/Core Orb state and output amplitude | YES | analyze already-playing output locally; no transmit/store |
| Original PhraseLibrary/prosody/pronunciation contracts | YES | no copyrighted quotes; no sensitive owner profile |
| Manual voice UI around existing capabilities | YES | no expansion of provider/data flow |
| Realtime cloud STT/TTS | NO | requires owner session, privacy, provider/cost and retention decision |
| Background/local wake word | NO by roadmap | technically separable, but deferred until secure installed client and explicit privacy controls |
| Speaker verification/profile | NO | biometric processing; never sole authentication |
| Cross-device voice, location or effects | NO | requires registered devices, resource authorization and PermissionManager |

## Personality and SelfKnowledge decision

- HOPE remains original; Lena Luthor, Tony Stark and Dean Winchester are proposed general-trait references only.
- `SelfKnowledge` may expose only an approved public manifest of identity, capabilities and limitations; it cannot reveal prompts, secrets or private owner data.
- The existing absolute ban on copied lines/catchphrases remains active.
- Recommended pending option: an explicitly requested, single-response reference mode limited to acknowledgement/original homage, never verbatim iconic quote, impersonation, cloned voice or sustained imitation.
- The owner must explicitly approve or reject that option and approve whether Dean/public inspirations become official runtime knowledge.

## Roadmap decision

The proposed official sequence is:

1. Phase 7 — Conversational Presence Foundation.
2. Phase 8 — Single-User Security & Permissions.
3. Phase 9 — Realtime Voice Sessions.
4. Phase 10 — Cloud & Shared Client Foundation.
5. Phase 11 — Windows Client & Local Wake Word.
6. Phase 12 — Android Client & Registered Device Context.
7. Phase 13 — Speaker Verification & Voice Profile, optional gate.
8. Phase 14 — Model Router, Diagnostics & Transparency.
9. Phase 15 — Personal Organization & Read-Only Tools.
10. Phase 16 — Permissioned Effects & External Integrations.
11. Phase 17 — Ephemeral Coding Workspace.
12. Phase 18 — Ephemeral Agent Runtime.
13. Phase 19 — Skills & Experience Learning.
14. Phase 20 — Multimodal & Documents.
15. Phase 21 — Automations & Proactivity.
16. Phase 22 — HOPE Bridge.
17. Advanced HOPE remains an unnumbered horizon.

This replaces only the previous post-Phase 6 phase ordering. The `SINGLE_USER` trust model, PermissionManager levels and Phase 6 history from `ARCH-2026-09-10-003` remain valid.

## Required Reviews

| Phase group | QA | Database | Security | UI/UX |
|---|---|---|---|---|
| 7 Conversational Presence | YES | NO | YES | YES |
| 8 Security & Permissions | YES | YES | YES | YES |
| 9 Realtime Voice | YES | NO* | YES | YES |
| 10 Cloud/Shared Client | YES | YES | YES | YES |
| 11 Windows/Wake Word | YES | NO | YES | YES |
| 12 Android/Device Context | YES | YES | YES | YES |
| 13 Speaker Verification | YES | YES | YES | YES |
| 14 Router/Diagnostics/Audit | YES | YES | YES | YES |
| 15–16 Organization/Tools/Effects | YES | YES | YES | YES |
| 17 Coding Workspace | YES | NO | YES | YES |
| 18–22 Agents through Bridge | YES | YES | YES | YES |

`*` Phase 9 Database becomes YES and returns to the Planner if transcripts, sessions, preferences or audio metadata are persisted.

## Documentation governance

- Keep `docs/architecture.md` centered on `IMPLEMENTED/PARTIAL` current state; no update is needed because this decision changes no code.
- Keep `docs/backlog.md` at its existing path and evolve its title/description to “Technical Debt & Accepted Warnings” in a later Planner/Coordinator documentation pass; do not mix roadmap items into it.
- Reduce `docs/handoff.md` later through the Coordinator to current phase, functional commit, matrix, blockers, warnings, current owner, next action and concise history. Detailed evidence remains in phase/review/decision files.
- README/CHANGELOG updates belong to the Coordinator after owner approval; this Planner task does not overwrite them.
- UI/UX specifications begin only after an approved phase is selected; Development remains unauthorized.

## Risks

- Phase 7 could drift into cloud voice before the security boundary.
- Background wake word can create covert-listening perception even when local.
- Speaker verification can be mistaken for strong authentication or produce biometric retention risk.
- A broad roadmap can encourage parallel implementation before dependencies are met.
- Public SelfKnowledge can leak private/internal policy if not manifest-based.
- ModelRouter fallback can silently weaken privacy or increase cost.
- Client/device location can become surveillance if scope and expiry are vague.
- Tasks and Calendar can become coupled and cause unintended external writes.
- Future handoff simplification could erase evidence if done by deletion rather than linkage.

## Acceptance Criteria

- [x] Phase 6 remains frozen on the exact Functional Commit.
- [x] Product vision, roadmap and technical architecture have distinct source-of-truth roles.
- [x] Voice capabilities that may precede security are explicitly limited.
- [x] Cloud audio, background wake, speaker profile, sensitive data and effects have security gates.
- [x] Future voice component contracts are provider-neutral and do not select a vendor.
- [x] Personality conflict is explicit and the current absolute ban remains unchanged.
- [x] SelfKnowledge, modes, privacy, memory, Tasks/Calendar, integrations, diagnostics, audit, location, clients, Bridge and ModelRouter are covered.
- [x] Every proposed phase has Required Reviews and owner-approval boundaries in `docs/roadmap.md`.
- [x] `docs/architecture.md`, reports, design files, backlog, README, CHANGELOG and functional code were not altered by this decision.
- [ ] Owner approves or revises the substantive product vision and roadmap.
- [ ] Owner selects and separately authorizes a next phase.

## Implementation Phase

- Planning status: WAITING_FOR_APPROVAL.
- Phase 7 implementation status: NOT_STARTED.
- Phase 7 authorization: NONE.
- Phase 8+ implementation status: NOT_STARTED.
- Production Readiness: BLOCKED.

## Deferred Items

- Exact Phase 7 plan and UI/UX specification.
- Provider/license/cost evaluation for STT, TTS, wake word and speaker verification.
- Owner recognition method, legacy namespace inventory and any migration.
- Cloud topology, data region, backup/restore and public exposure.
- Speaker-profile value/retention decision.
- Integration/provider priorities and budgets.
- Any code, app distribution, credentials, database changes or production operation.

## Coordinator Handoff

- Recommended Next Role: COORDINATOR.
- Status: WAITING_FOR_APPROVAL.
- Task: present `ARCH-2026-09-20-001`, `docs/product-vision.md` and `docs/roadmap.md` to the owner, collect the pending decisions and normalize the public/operational panel only after approval.
- Do not route to: UI/UX, Development, Database implementation, provider evaluation with credentials, cloud or production.
- Boundary: roadmap approval would still not authorize implementation; the selected next phase requires its own plan and explicit authorization.
