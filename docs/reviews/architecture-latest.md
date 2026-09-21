# Architecture Review — Latest

- Status: WAITING_FOR_REVIEW
- Decision ID: `ARCH-2026-09-21-001`
- Date: 2026-09-21
- Product model: `SINGLE_USER`
- Branch: `codex/phase-6-target-ui`
- Functional Commit preserved: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
- Repository HEAD analyzed: `284a4ac5ceec6d2df5edbd1a3cb0e5b8835d53c6`
- `origin/main` analyzed: `0bcc25a5437cab8a326e64281579ead56274d8cb`
- Integration Candidate: documentation-only HEAD produced by this cleanup; exact hash is the resulting commit
- Phase 6 operational status: WAITING_FOR_REVIEW
- Phase 7 planning: WAITING_FOR_APPROVAL
- Phase 7 implementation: NOT_STARTED / NOT_AUTHORIZED
- Production Readiness: BLOCKED

## Problem

The Phase 6 implementation exists at `0912e94` and received QA/Security/UI/UX reviews in the earlier round, but `docs/architecture.md` still described the pre-Phase 6 frontend and baseline. The branch also exposes `6.0.0-phase.5` as runtime metadata while the coordinated work is called Phase 6.

Before integration, the project needs one documentation-only Integration Candidate that accurately describes the implemented dashboard, records the version convention and keeps Phase 7 unstarted. The previous QA and Security reports remain evidence for the Functional Commit but do not constitute final approval of the cleaned branch. QA and Security must confirm the same Integration Candidate before any PR/merge.

## Current State

- Functional implementation remains exactly `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`.
- The earlier round recorded 45 passing Python tests, 36 passing frontend tests, five passing browser verifiers and no functional blocker on that Functional Commit.
- UI/UX previously approved fidelity of the implemented HOPE Main Dashboard on `0912e94`; that result remains visual evidence only.
- Commits after `0912e94` are documentation/review/coordination changes and do not create a new Functional Commit.
- The runtime code and README expose `6.0.0-phase.5`; changing the runtime value requires editing `backend/main.py`.
- Phase 7 is a plan with status `WAITING_FOR_APPROVAL`; implementation is `NOT_STARTED` and `NOT_AUTHORIZED`.
- Production Readiness remains `BLOCKED` by the existing Security/Database/operational gates.
- The working tree contains a preexisting owner change in `AGENTS.md` and untracked visual assets that must not enter the Planner commit.

## Constraints

- Documentation only; no functional code, tests, migration, database, frontend, backend, README or CHANGELOG change.
- Preserve `0912e94` as the Functional Commit and preserve all reviewer-owned reports unchanged.
- Do not describe Phase 6 as approved for PR/merge before the final candidate reviews.
- QA and Security must review/confirm the same Integration Candidate hash.
- UI/UX's earlier result may remain evidence but cannot replace final QA/Security confirmation.
- Do not modify Current Phase, Review Matrix, Coordinator section or Next Action.
- Preserve the owner change in `AGENTS.md` and all untracked assets.
- Do not start Phase 7, UI/UX or Development.

## Options

### Option A — Preserve `6.0.0-phase.5` as immutable runtime metadata of the approved Functional Commit

- Pros: keeps functional code and review identity unchanged; avoids a version-only Functional Commit; permits the integration candidate to remain documentation-only.
- Cons: the suffix can be mistaken for the operational Phase 5 unless the convention is explicit.
- Cost: none beyond documentation and future release hygiene.
- Complexity: low.
- Security impact: none; no runtime surface changes.
- Database impact: none.
- Maintenance impact: establishes that runtime version and planning phase are independent; the legacy label remains until a future authorized functional release.

### Option B — Change runtime metadata to `6.0.0-phase.6` before integration

- Pros: visually aligns the API label with the coordinated phase number.
- Cons: edits `backend/main.py`, creates a new Functional Commit after the completed review round and requires fresh impact analysis/reviews for a cosmetic synchronization.
- Cost: low engineering effort but material coordination/review overhead.
- Complexity: low in code, medium in governance.
- Security impact: no intended behavioral change, but the reviewed artifact identity changes.
- Database impact: none.
- Maintenance impact: continues coupling semantic/runtime releases to project-management phases.

## Recommendation

Adopt Option A. Keep `6.0.0-phase.5` unchanged in code and treat it as the immutable legacy runtime label of Functional Commit `0912e94`, not as the source of truth for phase status. `docs/phase-6.md`, the exact Functional Commit, reviewer records and handoff define the operational phase.

The integration decision remains `WAITING_FOR_REVIEW`. This cleanup creates the candidate; it does not approve it. QA and Security must confirm the resulting documentation-only HEAD before the Coordinator opens or merges the PR.

## Rationale

Changing a static metadata string after the reviewed functional commit would produce more governance churn than product value. The inconsistency is contained and explainable, while a code edit would invalidate the clean separation between the reviewed implementation and the documentation cleanup. A future authorized functional release can adopt a phase-independent semantic/build version without blocking this branch.

## Architecture

`docs/architecture.md` now distinguishes three identities:

1. **Functional artifact:** `0912e94`, containing the implemented dashboard and tests.
2. **Integration Candidate:** the documentation-only HEAD produced by this cleanup, which QA and Security must confirm on the same hash.
3. **Runtime metadata:** `6.0.0-phase.5`, a frozen legacy label that does not determine operational phase status.

The current architecture records:

- implemented responsive HOPE Main Dashboard and chat-first surfaces;
- `SurfaceController`, `MemoryGlobeController` and presentation-state separation;
- accessible list/inspector, WebGL fallback/recovery, LOD profiles and truthful operational states;
- 45 Python and 36 frontend tests from the prior Functional Commit review, plus browser evidence and its environmental limits;
- exact links to product vision, roadmap, future architecture, Phase 6 and Phase 7;
- Phase 7 as planning only, behind integration and a separate authorization.

## Integration Candidate Gate

1. Planner creates one documentation-only cleanup commit.
2. Coordinator records that exact HEAD as the Integration Candidate without changing the Functional Commit.
3. QA confirms branch/diff integrity, documentation consistency and absence of functional drift on the same candidate hash.
4. Security confirms the same candidate hash, preservation of findings/boundaries and absence of newly introduced exposure or misleading authorization.
5. Only after both final confirmations may Coordinator prepare the PR/merge flow authorized by the owner.
6. Production remains blocked and Phase 7 remains unstarted after merge unless separately approved and authorized.

## Required Reviews for Integration Candidate

| Work | Required | Justification |
|---|---|---|
| QA | YES | final branch/candidate integrity and documentation-to-functional-commit consistency must be confirmed |
| DATABASE | NO | cleanup changes no code, persistence, schema, migration or database contract |
| SECURITY | YES | final candidate must preserve blockers, production boundary and the exact reviewed functional artifact |
| UI/UX | NO | no visual implementation changed; the prior UI/UX approval remains evidence on `0912e94` |

## Risks

- The runtime suffix may be misread as current phase status.
- Reviewers may accidentally review `0912e94` again instead of the Integration Candidate HEAD, or vice versa.
- A dirty local working tree may be staged accidentally during integration.
- Prior `APPROVED_WITH_WARNINGS` reports may be misrepresented as final branch approval.
- PR/merge may be treated as Production Readiness or as Phase 7 authorization.
- README/CHANGELOG may remain less precise than the authoritative architecture documents until a separate owner/Coordinator-owned update.

## Acceptance Criteria

- [x] `docs/architecture.md` reflects the implementation at `0912e94`, not the pre-Phase 6 frontend.
- [x] Phase 6 functionality, dashboard, test counts and validation boundaries are recorded without claiming production readiness.
- [x] Product vision, roadmap and future architecture have correct source-of-truth links.
- [x] The version options, trade-offs and chosen convention are explicit.
- [x] No code change to `backend/main.py` or runtime version is made.
- [x] Phase 7 remains `WAITING_FOR_APPROVAL`, `NOT_STARTED` and `NOT_AUTHORIZED`.
- [x] The final-candidate QA/Security gate precedes PR/merge and Phase 7 implementation.
- [x] No reviewer-owned report, README, CHANGELOG, AGENTS, asset, code, test or migration is altered.
- [ ] QA confirms the resulting Integration Candidate hash.
- [ ] Security confirms the same Integration Candidate hash.
- [ ] Coordinator opens/merges the PR only after both confirmations.

## Implementation Phase

- Documentation cleanup: READY_FOR_REVIEW in the resulting candidate commit.
- Integration Candidate: to be identified by this cleanup commit hash.
- Phase 6 operational status: WAITING_FOR_REVIEW.
- PR/merge: BLOCKED pending QA and Security on the same candidate.
- Phase 7 planning: WAITING_FOR_APPROVAL.
- Phase 7 implementation: NOT_STARTED / NOT_AUTHORIZED.
- Production Readiness: BLOCKED.

## Deferred Items

- Any phase-independent runtime-version redesign or code change.
- README/CHANGELOG normalization by their owner, if requested.
- QA and Security final candidate reviews.
- PR/merge execution by Coordinator after the review gate.
- Phase 7 approval, UI/UX specification and implementation authorization.
- All provider, credential, database, migration, cloud and production work.

## Coordinator Handoff

- Recommended next role: COORDINATOR.
- Status: WAITING_FOR_REVIEW.
- Task: record the resulting Planner commit as the Integration Candidate and route QA and Security to review that exact hash.
- Do not route to: PR/merge, UI/UX, Development, Phase 7 implementation, providers, database, cloud or production before the required confirmations.
- No architectural blocker is known in the documented scope; the mandatory review gate itself blocks integration until completed.
