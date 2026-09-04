# Architecture Review — Latest

- Status: APPROVED_WITH_WARNINGS
- Decision ID: `ARCH-2026-09-04-001`
- Date: 2026-09-04
- Functional commit analyzed: `adfc728aaaf96c679dd9d1df38c56edda8bc95de`
- Documentation base analyzed: `20a0d4497c72c9d74a34281cde5e7c5af55d8b42`
- Scope: target architecture, roadmap and classification of Phase 5 feature versus production blockers

## Problem

The project needs to evolve from memory-aware chat into an extensible personal AI platform without turning Agents, Skills, Learning, Coding, Images and Multimodality into one irreversible phase. The current handoff also requires a technical distinction between Phase 5 feature acceptance and public-production readiness.

## Current State

- Phase 5 implements memory-aware chat, personality, persistent memory integration, realtime events and the Memory Globe.
- Claude, ElevenLabs and Tavily/Obsidian integrations remain partly provider-specific.
- There is no authentication boundary, generic PermissionManager, Tool Registry, Model Router, agent runtime, skill runtime or learning layer.
- Security officially rejects public deployment of `adfc728`.
- QA, Database and UI/UX re-reviews for the current Functional Commit remain operationally pending in the handoff.
- The current memory toggle does not control server-side persistent memory (`SEC-006`), and natural-language deletion lacks a strong target-bound confirmation/recovery path (`SEC-007`). These affect the Phase 5 memory contract itself, not only deployment infrastructure.

## Constraints

- Preserve the current functional phase and do not claim future capabilities as implemented.
- PostgreSQL + pgvector remain the primary data store; large media stays outside PostgreSQL.
- Cloud-first and provider-agnostic boundaries must not force premature multi-provider complexity.
- No permission escalation, production change, real migration, relevant cost commitment or HIGH/CRITICAL risk acceptance is authorized by this decision.
- Coordinator owns routine Review Matrix/status/routing; Planner owns technical scope and roadmap.

## Options

### Option A — Build a unified autonomy platform next

- Pros: reaches the long-term demo quickly; fewer intermediate integration contracts.
- Cons: couples tools, permissions, agents, skills and learning before their boundaries are proven; creates a very large review surface.
- Cost: high and front-loaded, with provider and infrastructure spend before demand is measured.
- Complexity: very high.
- Security impact: unacceptable privilege-escalation and prompt/tool-injection blast radius.
- Database impact: many interdependent tables and migrations with difficult rollback.
- Maintenance impact: high; failures would be hard to localize and contracts hard to replace.

### Option B — Layered capability roadmap with safety gates

- Pros: small reversible phases; identity and permission boundaries precede autonomy; each layer has measurable acceptance criteria.
- Cons: more contracts and handoffs; visible autonomy arrives later.
- Cost: incremental and controllable; paid providers are introduced only with budgets and evaluation.
- Complexity: moderate per phase, cumulative over time.
- Security impact: least privilege, confirmation and audit become architectural prerequisites.
- Database impact: migrations are isolated by capability and independently reviewable.
- Maintenance impact: clearer ownership and replaceable adapters; some interface/versioning overhead.

### Option C — Keep adding provider-specific features to the Orchestrator

- Pros: lowest short-term implementation effort.
- Cons: deepens coupling to current providers and turns the Orchestrator into a monolith.
- Cost: low initially, high migration cost later.
- Complexity: deceptively low now, high after multiple modalities and agents.
- Security impact: inconsistent policies and duplicated authorization checks.
- Database impact: ad hoc persistence models and provenance gaps.
- Maintenance impact: high long-term regression risk.

## Recommendation

Adopt Option B. Record the complete direction in [`docs/future-architecture.md`](../future-architecture.md), while keeping [`docs/architecture.md`](../architecture.md) as the source of current implemented state.

For Phase 5:

- `SEC-006` and `SEC-007` are feature blockers because they contradict the user-facing memory/forgetting contract and the project rule for destructive actions.
- `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `SEC-008` and `SEC-012` remain production-readiness blockers. This classification does not resolve them, change Security's `REJECTED` verdict or authorize deployment.
- `SEC-009`, `SEC-010`, `SEC-011`, `SEC-013`, `SEC-014`, `SEC-015` and `SEC-016` remain warnings/roadmap inputs exactly as recorded by Security.
- Phase 5 remains `CHANGES_REQUESTED` until the feature blockers are corrected and the required reviewers approve the applicable new Functional Commit.

## Rationale

Consent over persistent memory and safe forgetting are observable behavior of the Phase 5 feature. Authentication, public rate limiting, production database roles/TLS and deploy-grade audit are essential before public exposure, but retroactively absorbing the entire production platform into Phase 5 would destroy phase boundaries. The layered roadmap resolves both concerns without accepting the risks.

## Risks

- The proposed roadmap may be mistaken for implementation authorization; every phase therefore remains proposed until explicitly approved.
- Interfaces can be over-abstracted before a second provider exists; adapters should be introduced only at real seams.
- Experience and preference learning can amplify poisoned or unrepresentative evidence.
- Agent/skill execution can create privilege creep, cost loops and difficult-to-explain actions.
- Persistent audit and experience data can become a privacy liability without minimization and retention policies.

## Acceptance Criteria

- Current and target architecture remain clearly separated.
- Official personality is original and prioritizes safety, truth, precision and the user's legitimate objective.
- Tool, Skill, Agent, Memory, Preference, Experience and Procedure have non-overlapping definitions.
- Permission decisions are explicit, least-privilege, scoped, expiring and auditable.
- Sensitive actions require approval; agents cannot elevate themselves or self-approve.
- Model routing considers capability, quality, cost, latency, privacy, availability and fallback.
- Every proposed future phase specifies goal, scope, non-goals, dependencies, required reviews, acceptance criteria, risks and deferred work.
- Phase 5 is not marked approved and public production remains blocked.

## Implementation Phase

Documentation decision only. The roadmap begins only after formal Phase 5 closure and explicit approval of each subsequent phase. The first proposed implementation phase is Phase 6 — Identity and Authorization.

## Deferred Items

- Provider selection and monetary commitments.
- Real database migration, runtime-role provisioning and TLS change.
- Production deployment and public exposure.
- Fine-tuning, core self-modification and autonomous security-policy changes.
- Exact schemas/APIs for agents, skills, experience memory and multimodal storage.

## Required Reviews

- This documentation decision: QA NO; DATABASE NO; SECURITY NO; UI/UX NO.
- Each future phase: reviews are defined individually in the roadmap.
- Phase 5 correction implied by `SEC-006`/`SEC-007`: QA YES; SECURITY YES; UI/UX YES; DATABASE YES only if persistence/schema is changed.

## Planner Decision

- Status: APPROVED_WITH_WARNINGS
- Decision: adopt the layered target architecture and classify Phase 5 feature blockers separately from production blockers.
- Affected phases: Phase 5 closure and proposed Phases 6–20.
- User approval required: NO for this documentation/roadmap decision; YES before any sensitive implementation, real migration, provider cost commitment or production action.

## Coordinator Handoff

- Recommended Next Role: COORDINATOR
- Task: persist operational routing without changing reviewer verdicts; route `SEC-006` and `SEC-007` to DEV as Phase 5 feature blockers and keep all production blockers visible.
- Target commit/document: the documentation commit containing `ARCH-2026-09-04-001`, then the next DEV Functional Commit for any approved correction.
- Dependencies: preserve pending QA/Database/UI/UX reviews and re-evaluate their target if DEV creates a new Functional Commit.
- Escalation required: NO for routing; YES for production, real database operations, costs, permissions or acceptance of HIGH/CRITICAL risk.
