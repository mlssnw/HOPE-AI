# Architecture Review — Latest

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
