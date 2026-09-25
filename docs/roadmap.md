# HOPE Roadmap

- Status: APPROVED
- Decision ID: `ARCH-2026-09-20-001`
- Date: 2026-09-20
- Owner approval: 2026-09-20
- Approval record: `f85b9bb775574b8a1340497e3e9e6d99b9b19c8c`
- Implemented baseline: Phase 6 is complete and integrated into `main` through `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`
- Current phase: Phase 7 — implementation authorized, `NOT_STARTED`, Functional Commit `NONE`
- Functional baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`
- Phase 7 implementation authorization: `APPROVED` by the owner on 2026-09-25; Planner reconciliation `ARCH-2026-09-25-001`
- Implementation authorization: NONE for Phase 8+

## Source-of-truth role

This document is the canonical planning source for phase order, dependencies, gates and Required Reviews. The owner approved the sequence on 2026-09-20. Roadmap approval establishes direction only: it does not authorize implementation of any phase.

The Phase 6 history remains governed by `docs/phase-6.md` and `ARCH-2026-09-19-001`. The post-Phase 6 ordering in `ARCH-2026-09-10-003` is `SUPERSEDED` for planning by this proposal; its `SINGLE_USER`, permission and safety principles remain preserved.

## Planning rules

- Every phase needs an explicit plan, owner approval where required, a new Functional Commit and independent reviews.
- A completed planning document is not implementation authorization.
- Phase 7 is the documented exception now carrying explicit implementation authorization; it remains unstarted until its pre-implementation UI/UX gate and individual phrase decisions are complete.
- Any unplanned schema, persistence, provider, data class, cost or external effect returns to the Planner.
- Production Hardening is a gate before the first remote/public surface, not a final clean-up after exposure.
- `Required Reviews` values below are mandatory defaults; scope changes may add reviewers, never silently remove them.

## Why this order

Three options were considered:

### Option A — Voice before all security

- Pros: fastest visible product differentiation.
- Cons: cloud audio, background listening, biometrics and device state would precede trustworthy owner/session boundaries.
- Cost: deceptively low initially; high rework and privacy risk.
- Complexity: medium initially, high after retrofitting controls.

### Option B — All security/cloud hardening before any voice work

- Pros: strongest sequencing simplicity.
- Cons: delays safe local experience work that does not require identity, external data or persistent profiles.
- Cost: medium to high before product learning.
- Complexity: high upfront.

### Option C — Local conversational foundation, then security, then sensitive voice/cloud capabilities

- Pros: preserves voice priority while placing owner recognition before cloud streaming, biometrics, registered devices and effects.
- Cons: requires strict enforcement of the Phase 7 non-goals.
- Cost: incremental and measurable.
- Complexity: moderate.

Recommendation: Option C.

## Dependency spine

```text
Phase 6 complete on `main` at `ce2bde4`
  → 7 Conversational Presence Foundation
  → 8 Single-User Security & Permissions
  → 9 Realtime Voice Sessions
  → 10 Cloud & Shared Client Foundation
  → 11 Windows Client & Local Wake Word
  → 12 Android Client & Registered Device Context
  → 13 Speaker Verification & Voice Profile (optional gate)
  → 14 Model Router, Diagnostics & Transparency
  → 15 Personal Organization & Read-Only Tools
  → 16 Permissioned Effects & External Integrations
  → 17 Ephemeral Coding Workspace
  → 18 Ephemeral Agent Runtime
  → 19 Skills & Experience Learning
  → 20 Multimodal & Documents
  → 21 Automations & Proactivity
  → 22 HOPE Bridge
  → Advanced HOPE horizon
```

Production Hardening is inserted before any phase is exposed remotely or continuously. It does not authorize go-live by itself.

## Phase 7 — Conversational Presence Foundation

- Goal: create a provider-neutral, local/controlled conversation and voice-presentation layer.
- Scope: `VoiceManager`, `SpeechFormatter`, `TurnManager`, `VoiceStateManager`, provider-neutral prosody/pronunciation contracts, original `PhraseLibrary`, stop/cancel behavior, combinable modes, public-safe `SelfKnowledge` contract and local Core Orb amplitude from already-playing output.
- Non-goals: new cloud audio, streaming provider, background wake word, speaker profile, biometric processing, cross-device session, persistence changes or external effects.
- Dependencies: Phase 6 integrated at `ce2bde4`; approved personality/public `SelfKnowledge` boundary; approved Phase 7 plan and explicit owner authorization; complete UI/UX specification and individual owner decision for every exact phrase intended for implementation before Development is routed.
- Acceptance: displayed/spoken outputs are distinct; safety and uncertainty survive speech formatting; stale turns cannot speak; stop is immediate; Core Orb amplitude stays local and ephemeral; modes cannot change permissions or truth; no unapproved exact phrase enters code, fixtures, tests, defaults or active product content.
- Reviews: QA YES; DATABASE NO; SECURITY YES; UI/UX YES.
- Cost/complexity: low-to-medium / medium.
- Production impact: none; local/controlled only.
- Owner approval: plan and implementation scope approved on 2026-09-25. Implementation is `NOT_STARTED`. UI/UX is the next Coordinator-routed gate; Development remains blocked until the complete specification and every intended exact phrase decision are persisted.
- Phrase gate: UI/UX presents each exact proposal separately with context, intended tone and initial `PENDING_OWNER_APPROVAL`. Approval is exact-item only and does not cover variants, other phrases or later rewrites.

## Phase 8 — Single-User Security & Permissions

- Goal: recognize the sole owner and govern resources/effects by risk.
- Scope: `OwnerAuthenticator`, revocable session, `OwnerContext`, HTTP/WS identity, `ResourceAuthorizer`, `PermissionManager`, grants, confirmations, revocation and minimal audit.
- Non-goals: multi-user accounts, organizations, enterprise SSO, tenant RBAC/RLS or public deploy.
- Dependencies: approved owner-recognition method and inventory plan for legacy UUID namespaces.
- Acceptance: client UUID is not authority; permissions are fail-closed, exact and non-reusable; prompt/content cannot authorize; resources are scoped; secrets stay server-side.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: medium / high.
- Production impact: necessary but insufficient for production.
- Owner approval: method, recovery model, migrations and any provider/cost.

## Phase 9 — Realtime Voice Sessions

- Goal: deliver interruptible, low-latency voice sessions after the owner boundary exists.
- Scope: streaming STT/TTS adapters, session lifecycle, partial transcripts, VAD/silence, turn-taking, barge-in, cancellation, ephemeral buffers, privacy disclosure and degradation to text.
- Non-goals: background wake word, speaker verification, raw-audio retention, voice cloning or public exposure.
- Dependencies: Phase 7 contracts; Phase 8 owner/session/permissions; approved provider, data region, retention and budget.
- Acceptance: no stale audio after interruption; external audio transfer is visible and consented; buffers expire; provider failure does not silently change privacy boundary.
- Reviews: QA YES; DATABASE NO; SECURITY YES; UI/UX YES. Database becomes YES if any session/transcript persistence is proposed.
- Cost/complexity: medium-to-high variable usage / high.
- Production impact: local authenticated evaluation only until the production gate.
- Owner approval: provider, credential, cost, region and audio policy.

## Phase 10 — Cloud & Shared Client Foundation

- Goal: define the secure central brain and a common contract for installed clients.
- Scope: cloud API boundary, capability handshake, device registration/revocation, session continuity, shared client protocol, sync semantics, secret management design and operational topology.
- Non-goals: public go-live, every native client, Bridge, broad device control or vendor lock-in.
- Dependencies: Phase 8; production threat model; database/backups/migrations plan.
- Acceptance: registered-device protocol is revocable; client capability claims are verified; offline/reconnect behavior is defined; cloud does not trust device-supplied owner identity.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: high / high.
- Production impact: invokes the Production Hardening gate before any remote exposure.
- Owner approval: target cloud, budget, credentials, data region, backup/restore and exposure objective.

## Phase 11 — Windows Client & Local Wake Word

- Goal: provide the first installed client and privacy-preserving local activation.
- Scope: Windows shell, shared-client contract, foreground/background lifecycle as explicitly permitted, local wake word `HOPE`, visible microphone state, disable switch, frame discard and local capability broker.
- Non-goals: speaker verification, arbitrary filesystem access, Bridge replacement, ambient recording or silent startup listening.
- Dependencies: Phase 10; evaluated wake engine/license/platform support; OS permission model.
- Acceptance: wake processing remains local before activation; no pre-activation upload/storage; false-positive/negative metrics are measured; disabling actually stops capture.
- Reviews: QA YES; DATABASE NO; SECURITY YES; UI/UX YES.
- Cost/complexity: medium / high.
- Production impact: installed-client distribution/privacy review required; no cloud go-live inferred.
- Owner approval: wake provider/license/cost and background behavior.

## Phase 12 — Android Client & Registered Device Context

- Goal: extend the shared client to Android and introduce explicit device context.
- Scope: Android client, iOS-compatible contracts, device-scoped permissions, notifications, optional device location with visible consent, retention and revocation.
- Non-goals: tracking people, covert background location, iOS implementation or smart-home control.
- Dependencies: Phases 8 and 10; mobile security/privacy design.
- Acceptance: location is tied to a registered device; precision and duration are explicit; revoke/delete works; missing permission degrades safely.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: medium-to-high / high.
- Production impact: app distribution and remote services require their own operational approval.
- Owner approval: location precision/retention, notification policy and store/distribution costs.

## Phase 13 — Speaker Verification & Voice Profile

- Goal: optionally recognize the owner voice as an additional signal.
- Scope: enrollment, local/remote verification boundary, confidence, retry, spoof/liveness evaluation, profile deletion and audit.
- Non-goals: sole authentication, permission bypass, passive identification of other people or permanent raw-audio retention.
- Dependencies: Phases 8–12; explicit biometric value decision; approved storage/retention model.
- Acceptance: low confidence fails closed; sensitive/destructive actions still require PermissionManager confirmation; profile can be revoked/deleted; fallback remains available.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: medium variable / high.
- Production impact: biometric/privacy assessment required.
- Owner approval: explicit opt-in, provider, cost, profile location, retention and acceptable false-reject/false-accept trade-off.

## Phase 14 — Model Router, Diagnostics & Transparency

- Goal: route capabilities deliberately and explain system health/cost without changing HOPE identity.
- Scope: deterministic `ModelRouter`, capability/policy matrix, budgets, approved fallbacks, `HopeDiagnostics`, capability registry and minimized audit views.
- Non-goals: autonomous provider purchasing, silent privacy downgrade, self-modification or invented health metrics.
- Dependencies: Phase 8; evidence from voice/cloud phases; approved provider policies.
- Acceptance: every route is explainable; unavailable capabilities degrade explicitly; cost/privacy limits are enforced; logs omit secrets/private payloads.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: medium / medium-high.
- Production impact: improves operations but does not approve production.
- Owner approval: provider allowlist, budgets, fallback privacy and retention.

## Phase 15 — Personal Organization & Read-Only Tools

- Goal: establish HOPE Tasks and safe read-only tools before external effects.
- Scope: task/project model, deadlines/reminders, Calendar as a separate domain, Tool Registry, SAFE reads, provenance, memory controls and read-only calendar/device status integrations.
- Non-goals: sending messages, changing calendar, smart-home control, purchases, coding or agents.
- Dependencies: Phase 8; Phase 14 diagnostics/routing; data model approved before persistence.
- Acceptance: Tasks never silently become calendar events; reads are scoped and auditable; tool output is untrusted data; memory/private modes are respected.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: medium / high.
- Production impact: requires integration-specific privacy but no write effects.
- Owner approval: task model, initial read-only catalog, calendar provider/scopes and data retention.

## Phase 16 — Permissioned Effects & External Integrations

- Goal: add WRITE/SENSITIVE effects with exact confirmation and idempotency.
- Scope: calendar writes, messages/calls, Spotify/Home Assistant/device actions, secret handles, destination confirmation, retries/compensation and cost controls.
- Non-goals: coding, autonomous agents, destructive infrastructure or blanket integration grants.
- Dependencies: Phases 8, 14 and 15.
- Acceptance: action, target, destination, parameters and budget are confirmation-bound; uncertain effects do not retry automatically; revoke works.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: medium-to-high / high.
- Production impact: each integration requires provider and operational approval.
- Owner approval: every provider, credential, cost and initial effect catalog.

## Phase 17 — Ephemeral Coding Workspace

- Goal: support controlled code work without granting deployment or production authority.
- Scope: isolated workspace, read/edit/test/lint, diff, local commit as a distinct permission, budgets and rollback.
- Non-goals: push, merge, deploy, production secrets, real migration or persistent coding agent.
- Dependencies: Phases 8, 14 and the tool/effect contracts of Phases 15–16.
- Acceptance: path escape and autoelevation are denied; effects remain distinct; evidence and rollback are available; grants expire with the task.
- Reviews: QA YES; DATABASE NO; SECURITY YES; UI/UX YES.
- Cost/complexity: medium / high.
- Production impact: workspace-controlled only.
- Owner approval: allowed repositories, egress, models, budgets and WRITE actions.

## Phase 18 — Ephemeral Agent Runtime

- Goal: generalize bounded delegation beyond coding.
- Scope: agent registry, task envelopes, ephemeral runtime, tool/grant intersection, limits, cancellation and independent evaluation.
- Non-goals: persistent agents, 24/7 autonomy, self-modification, permanent grants or unbounded fan-out.
- Dependencies: Phases 8 and 14–17.
- Acceptance: time/cost/tool-call limits hold; child grants only shrink; agents cannot approve themselves; context and grants are destroyed after completion.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: high / high.
- Production impact: none without a later operational gate.
- Owner approval: agent types, budgets, concurrency, tools and data access.

## Phase 19 — Skills & Experience Learning

- Goal: learn reusable, reviewable procedures without changing core rules.
- Scope: Experience Memory, feedback, preference proposals, versioned skills, evaluations, promotion and rollback.
- Non-goals: autonomous core prompt edits, weight training, permission changes or silent skill activation.
- Dependencies: Phase 18 and proven evaluation signals.
- Acceptance: observations and inferences are distinct; repeated evidence is required; skills are versioned/tested; owner can review/revoke/forget.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: medium-high / high.
- Production impact: retention and quality gates required.
- Owner approval: learning categories, promotion thresholds, retention and budgets.

## Phase 20 — Multimodal & Documents

- Goal: add images, documents, screen context and generated media under modality-specific policies.
- Scope: `InputRouter`, scanners/limits, extraction, object storage references, provenance, image generation/editing and retention.
- Non-goals: unrestricted surveillance, storing large binaries in PostgreSQL or unlicensed media use.
- Dependencies: Phases 8, 14 and 19; storage/provider decisions.
- Acceptance: binaries remain outside PostgreSQL; extracted content is untrusted; consent/provenance/retention are visible; costs are bounded.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: high variable / high.
- Production impact: storage and provider operations require approval.
- Owner approval: providers, object storage, data classes, cost and retention.

## Phase 21 — Automations & Proactivity

- Goal: support scheduled/event-driven assistance that is quiet, reversible and bounded.
- Scope: schedules, triggers, durable execution, deduplication, retry, notification policy, pause/revoke and audit.
- Non-goals: silent external effects, unlimited background autonomy or production deployment by default.
- Dependencies: Phases 8, 14–19 and approved effect catalog.
- Acceptance: no duplicate effects; quiet-by-default monitoring; clear owner control; SENSITIVE/DESTRUCTIVE remains confirmed.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: high / high.
- Production impact: continuous operation requires Production Hardening.
- Owner approval: schedules, notification policy, budgets, effects and operating environment.

## Phase 22 — HOPE Bridge

- Goal: expose explicitly authorized local resources to the cloud brain through a constrained peripheral.
- Scope: outbound-first channel, device identity, resource allowlists, capability grants, local confirmations, revocation and audit.
- Non-goals: unrestricted remote desktop, implicit filesystem access, permanent administrative credentials or making the Bridge the brain.
- Dependencies: Phases 8, 10, 14–18 and Production Hardening for the selected topology.
- Acceptance: offline/revoked Bridge fails closed; canonical paths and capabilities are enforced; secrets are handles; local owner can inspect/stop access.
- Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- Cost/complexity: high / very high.
- Production impact: remote/local boundary requires explicit go-live decision.
- Owner approval: devices, resources, network topology, credentials, costs and exposed capabilities.

## Advanced HOPE horizon — unnumbered

Persistent agents, richer learning, ambient multimodal context and broader autonomy remain an unnumbered horizon. They receive phase numbers only after Phases 7–22 produce evidence and the owner defines a concrete problem. This avoids treating aspiration as scheduled implementation.

## Approved direction and remaining gate

- Approved on 2026-09-20: `ARCH-2026-09-20-001`, this sequence, the personality/public `SelfKnowledge` boundary and Phase 7 as the next planning target.
- Approved on 2026-09-25: the exact Phase 7 plan and implementation strictly within that plan, reconciled by `ARCH-2026-09-25-001`.
- Current gate: Coordinator routes the pre-implementation specification to UI/UX. Each exact phrase proposal starts `PENDING_OWNER_APPROVAL` and requires its own owner decision.
- Development has not started and receives no route from this document. Phase 8 and every later phase remain unauthorized.

## Deferred cross-cutting gates

- Provider selection, credentials, costs and data regions.
- Database migrations or new persistent data classes.
- Public/cloud exposure and Production Readiness.
- Acceptance of any HIGH/CRITICAL risk.
- Merge, push, deploy, app-store publication or distribution.
