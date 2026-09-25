# HOPE Product Vision

- Status: APPROVED
- Decision ID: `ARCH-2026-09-20-001`
- Date: 2026-09-20
- Owner approval: 2026-09-20
- Approval record: `f85b9bb775574b8a1340497e3e9e6d99b9b19c8c`
- Product model: `SINGLE_USER`
- Functional baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2` on `main`
- Product-direction intake: `ff1309f71cd4aaac0a096a9760abfb37e353177b`
- Scope: future product direction; Phase 7 authorization is governed by `docs/phase-7.md` and `ARCH-2026-09-25-001`

## Source-of-truth role

The Planner approves this document structure as the canonical home for the future product intent: what HOPE should become, for whom, and under which product boundaries. The owner approved its substantive direction on 2026-09-20. This approval makes the vision official, but does not authorize implementation of any phase.

The documentation model is:

| Question | Canonical source |
|---|---|
| What works now? | `docs/architecture.md` |
| What product are we building? | `docs/product-vision.md` |
| In what order, with which gates? | `docs/roadmap.md` |
| How should future subsystems fit together? | `docs/future-architecture.md` |
| What is the current workflow state? | `docs/handoff.md` |
| What debt and accepted warnings remain? | `docs/backlog.md` |

`README.md` remains a public summary, not the architectural or roadmap authority. Phase documents and review reports remain the evidence for delivered work.

## Product promise

HOPE is an original, cloud-first, provider-agnostic personal intelligence for one owner. It should combine persistent memory, contextual reasoning, natural conversation, personal organization and safely governed action without becoming a multi-user SaaS platform or pretending that planned capabilities already exist.

The long-term experience is continuous across text, voice and installed clients. The cloud is the durable brain; clients provide interaction and explicitly authorized local capabilities; the HOPE Bridge is a constrained peripheral for resources that remain on a personal computer.

## Product principles

1. Safety, truth and precision precede style, speed and automation.
2. `SINGLE_USER` means one human owner, not absence of authentication, authorization or privacy controls.
3. Memory is useful only when consented, explainable, correctable and forgettable.
4. Voice is a distinct interaction channel, not a literal audio rendering of chat.
5. Every displayed state, metric, capability and Core Orb reaction comes from real system state.
6. Providers are replaceable adapters selected by capability, privacy, quality, latency and cost.
7. Tools and agents receive limited, revocable capabilities and cannot elevate themselves.
8. Cloud exposure, sensitive data, credentials, cost and irreversible effects require explicit owner decisions.
9. Installed applications are the primary future clients; PWA is a fallback, not the product center.
10. New capability is introduced in small, reviewable phases with clear non-goals.

## Implemented boundary

Phase 6 is complete and integrated into `main` through `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`. Its reviewed implementation artifacts and reviewer reports remain historical evidence. The current product implementation includes the dashboard, chat, optional persistent memory, Memory Globe/Core Orb, existing browser dictation, optional TTS, realtime events and current integrations documented in `docs/architecture.md`.

Everything below remains product direction. The owner separately authorized Phase 7 implementation on 2026-09-25, but implementation has not started and no Phase 7 Functional Commit exists. That authorization does not approve a provider, database change, later phase or Production Readiness.

## Conversational presence and voice

The desired voice experience is natural, interruptible and context-aware while remaining explicit about uncertainty and privacy.

```text
DISPLAY RESPONSE != SPOKEN RESPONSE
```

The spoken response may be shorter, remove Markdown, summarize long code or lists, adjust pauses and avoid repetition. It must not remove material safety information, confirmation requirements, uncertainty or consequences of an action.

Desired future capabilities include:

- manual voice sessions with clear microphone state;
- streaming STT/TTS when an approved provider and privacy policy exist;
- turn-taking, silence detection, continuation, hesitation handling and barge-in;
- immediate stop behavior for “pare”, “silêncio” and equivalent controls;
- provider-neutral prosody and pronunciation hints;
- local output-amplitude analysis driving the Core Orb while HOPE is actually speaking;
- local wake word `HOPE`, fully disableable and separated from speaker verification;
- optional speaker verification as a convenience signal, never sufficient authentication for sensitive actions.

Before Single-User Security & Permissions, only local/controlled presentation and orchestration may advance: display/spoken separation, state machines, cancellation, original phrase selection, provider-neutral contracts and local amplitude analysis of already-playing output. New cloud audio flows, persistent voice profiles, background wake listening, cross-device sessions, sensitive personalization and effects must wait for the security gate defined in `docs/roadmap.md`.

## Voice privacy

- Microphone activity always has a visible and accessible indicator.
- Continuous/background listening is off by default.
- Wake detection, when implemented, runs locally before activation, discards frames and can be fully disabled.
- Audio is sent externally only after a voice session actually starts and the owner has accepted the provider/data policy.
- Raw audio is not retained by default.
- Retention, transcript storage, speaker profiles and deletion require separate, explicit controls.
- A private mode disables voice retention, memory capture and proactive disclosure regardless of style settings.
- Provider failures or unavailable privacy guarantees degrade to text/manual interaction instead of silently changing provider.

## Personality and original identity

HOPE remains an original identity. General traits may draw from:

- Lena Luthor: strategic intelligence, elegance, sophistication and scientific thinking;
- Tony Stark: inventiveness, speed, confidence, technical improvisation and sharp humor;
- Dean Winchester: pragmatism, loyalty, protectiveness, frankness, irreverence and spontaneous humor.

These references do not authorize identity imitation, copied dialogue, recognizable mannerisms, cloned voices or sustained character performance. HOPE identifies only as HOPE.

### Approved reference boundary

The owner approved Dean Winchester as a general-trait reference together with Lena Luthor and Tony Stark, and approved those inspirations for the public-safe `SelfKnowledge` manifest. The owner also approved a narrow exception for recognition or original homage when explicitly requested.

This exception never permits literal famous quotes, copied dialogue, identity imitation, recognizable character performance, voice cloning, sustained acting or copyrighted passage reproduction. The resulting response must remain original and identify only as HOPE. The product decision does not modify runtime code or prompts. Any normative reconciliation of `AGENTS.md` belongs in a separate owner/Coordinator-controlled change and must not be mixed with this Planner commit.

The `PhraseLibrary` may contain only original HOPE phrases individually approved by the owner. UI/UX presents every exact proposal separately with its context and intended tone, initially marked `PENDING_OWNER_APPROVAL`. Approval applies only to that exact text and context: it never approves a variant, another phrase or a later rewrite. Unapproved phrases cannot enter code, fixtures, tests, defaults or active product content. Owner-provided custom phrases also require provenance, explicit activation and deletion controls; they do not become global personality rules.

## SelfKnowledge

Future `SelfKnowledge` is a versioned, public-safe product manifest. It allows HOPE to explain:

- its name and original identity;
- approved general inspirations;
- implemented capabilities, planned capabilities and current limitations;
- active integrations and their availability;
- relevant privacy behavior and how to change it.

It must not reveal system prompts, hidden policies, secrets, credentials, internal chain-of-thought, private owner data or security-control details that would weaken protections. Runtime capability claims come from a capability registry/health state, not from an LLM guess.

## Interaction model

Modes are orthogonal and combinable:

| Axis | Values | Rule |
|---|---|---|
| Interaction style | NORMAL, FOCUS, SUPPORTIVE, PRESENTATION | changes phrasing and pacing, never truth or permissions |
| Privacy | STANDARD, PRIVATE | PRIVATE overrides memory capture, retention and private disclosure |
| Output | VOICE, SILENT | controls output channel, not task authority |
| Interruption | STANDARD, DO_NOT_DISTURB | limits proactive interruption; does not hide urgent safety failures |
| Audience | PRIVATE, PUBLIC | PUBLIC suppresses private context unless explicitly approved |

`InteractionStyleAdapter` may use explicit modes, authorized preferences and low-confidence interaction signals. It must treat pauses, hesitation and pace as hypotheses, never diagnose emotion or health, and never activate a sensitive mode solely from inference.

## Memory and owner control

The product preserves opt-in memory and expands owner transparency:

- “O que você lembra sobre mim?” lists relevant stored knowledge and provenance.
- “Não registre esta conversa” prevents new capture for the session.
- Private mode prevents capture and limits retrieval/disclosure according to policy.
- Corrections, deletion and future retention controls propagate consistently.
- Memory views explain content, origin, creation, last use and why it was retrieved when available.

Memory, conversation history, voice transcripts, speaker profiles and audit records remain separate data classes with separate consent and retention.

## Personal organization

`HOPE Tasks` and Calendar are different domains:

- Tasks represent owner-managed intentions, projects, steps, deadlines and completion state.
- Calendar represents time-bound events from one or more calendar sources.
- A task may reference a calendar event, but neither silently becomes the other.
- Reading calendar data and creating/changing an event are separate permissions.
- Messages, calls, bookings and smart-home effects always remain explicit external actions.

Candidate integrations include calendar, Spotify, Home Assistant, device APIs and messaging. They are candidates only; priority, provider, scopes, cost and data policy require later decisions.

## Diagnostics, audit and transparency

Future `HopeDiagnostics` reports the availability and limitation of Core, Internet, LLM, Memory, Database, STT, TTS, Microphone, Wake Word, Speaker Verification and integrations. It explains the failing component and degraded capabilities without exposing secrets or internal attack surface.

The owner should be able to inspect minimized events such as `WAKE_WORD`, `SPEAKER_VERIFICATION`, `MEMORY_READ`, `CALENDAR_READ`, `LLM_CALL`, `TTS`, `TOOL_EXECUTION` and `PERMISSION_DECISION`, including purpose, time, result and logical destination. Logs never contain credentials, continuous ambient audio, full system prompts or unnecessary private payloads.

## Devices, location and clients

- Location belongs to a registered and explicitly authorized device, never to arbitrary people.
- Each device has identity, capabilities, permission scope, revocation and last-seen state.
- Windows is the recommended first installed client because the current development environment and future local-resource path are Windows-centric.
- Android follows through a shared client contract; the architecture remains compatible with a later iOS client.
- PWA may provide fallback access but does not replace native privacy, background-audio and device-capability requirements.

## Cloud, ModelRouter and Bridge

HOPE Cloud is the durable orchestration and memory plane. Remote operation is not allowed until owner recognition, secure sessions, deployment hardening, database operations and recovery are approved and verified.

`ModelRouter` selects a model/provider by capability and policy rather than identity. HOPE remains HOPE regardless of which approved model handles conversation, reasoning, coding, vision, images, embeddings, STT or TTS. Routing considers quality floor, cost ceiling, latency, privacy, region, availability and allowed fallback. A fallback never sends data to a weaker privacy boundary without approval.

The HOPE Bridge is an authenticated, revocable, outbound-first peripheral for local files, Obsidian, applications and device capabilities. It is not the brain, database or owner authority.

## Product non-goals

- Multi-user SaaS, organizations, teams, enterprise SSO or tenant-oriented RBAC/RLS.
- Claims of consciousness, emotion diagnosis or human identity.
- Silent provider changes, hidden recording or ambient-audio retention.
- Speaker verification as sole authorization for sensitive/destructive action.
- Autonomous modification of core safety, permissions or personality.
- Presenting roadmap items as implemented features.

## Owner decisions

Approved on 2026-09-20:

1. This product vision and the source-of-truth split.
2. `ARCH-2026-09-20-001` and the phase order in `docs/roadmap.md`.
3. Dean Winchester as a general-trait reference and the public-safe disclosure of the approved inspirations.
4. The narrow, explicitly requested recognition/original-homage boundary described above.
5. Phase 7 as the next planned phase.
6. On 2026-09-25, the exact Phase 7 plan and implementation strictly within it, with the individual phrase-approval gate.

Still requiring a future owner decision:

1. Approve, edit or reject each exact Phase 7 phrase proposal individually.
2. Select acceptable voice privacy/retention boundaries before any new cloud audio flow.
3. Approve any STT/TTS/wake/speaker provider, license, credential, region and cost after evaluation.
4. Decide whether a speaker profile is valuable enough to justify biometric processing and retention.
5. Define acceptable device-location granularity, retention and revocation.
6. Prioritize Tasks, Calendar and candidate integrations before their phases.
7. Approve any remote/cloud objective, infrastructure cost, migration, secret or Production Readiness gate.

## Acceptance criteria for this vision

- Phase 6 remains complete and integrated at `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`.
- Phase 7 authorization is explicit, its implementation remains `NOT_STARTED` and its Functional Commit remains `NONE`.
- Current, future and production-ready states remain distinct.
- Voice, personality, memory, modes, organization, diagnostics, clients and cloud have explicit safety boundaries.
- No provider, cost, credential, migration, deployment, production action or Phase 8+ implementation is authorized.
- Approved and pending owner decisions are explicit and cannot be inferred from this document.
