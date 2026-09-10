# Architecture Review — Latest

- Status: APPROVED_WITH_WARNINGS
- Decision ID: `ARCH-2026-09-10-002`
- Date: 2026-09-10
- Phase: 5
- Functional commit analyzed: `88e194778b4399a6713f118470f9d861c553cd9e`
- Repository HEAD analyzed: `046fbec105de6a19e3729aff3d9c4f9f74fc4be1`
- Previous architectural decision: `ARCH-2026-09-04-001` — preserved; this decision extends it
- Scope: consolidate Phase 5 reviews and define the required UI/UX review boundary

## Problem

QA, Database and Security approved the Phase 5 Functional Commit with warnings, while UI/UX has approved a new dashboard as `TARGET UI` but has not reviewed implementation fidelity. The project must decide whether Phase 5 is blocked by the complete new dashboard, whether UI/UX is no longer applicable, or whether UI/UX should review only the experience actually changed by Phase 5.

## Current State

- Functional Commit `88e1947` is the current Phase 5 target.
- QA: `APPROVED_WITH_WARNINGS`, no feature blocker.
- Database: `APPROVED_WITH_WARNINGS`, no feature blocker; production validation remains blocked.
- Security: `APPROVED_WITH_WARNINGS` for the feature and `REJECTED/BLOCKED` for public production.
- UI/UX decision `UIUX-VIS-2026-09-10-001` approves the HOPE Main Dashboard as a future visual target.
- The UI/UX report uses `19e5738` as its visual gap baseline and explicitly states that implementation fidelity has not been reviewed.
- The dashboard specification and most of its P0 gaps were approved after the Phase 5 implementation scope had already been defined.
- `88e1947` changes the test harness and schema activation gate relative to `19e5738`; it does not introduce a new frontend delta.

## Constraints

- Do not broaden Phase 5 retroactively into a dashboard redesign.
- Do not mark UI/UX `N/A`: Phase 5 changed consent, destructive confirmation, Core Orb states and memory focus behavior.
- Do not reinterpret or overwrite the UI/UX verdict.
- Preserve the approved dashboard as the authoritative `TARGET UI` for a future visual implementation phase.
- Do not authorize the next phase, frontend implementation or public production.
- Keep Feature Status separate from Production Readiness.

## Options

### Option A — Require full dashboard fidelity inside Phase 5

- Pros: closes the visual gap immediately; produces one visually unified release.
- Cons: retroactively adds branding, layout, Core Orb, responsive and accessibility redesign to a memory/chat phase; invalidates the small-phase model.
- Cost: high and unplanned.
- Complexity: high; combines visual redesign with phase closure.
- Security impact: risks regressing consent and destructive confirmation while restyling.
- Database impact: none expected, but the longer phase delays database closure.
- Maintenance impact: large frontend diff and broad regression surface.

### Option B — Change UI/UX to `Required: NO / N/A`

- Pros: Phase 5 could be consolidated immediately from the three completed reviews.
- Cons: skips independent review of visible consent, deletion confirmation, memory focus and Core Orb state changes.
- Cost: low now, higher risk of UX defects escaping.
- Complexity: low.
- Security impact: weakens validation of security-critical user communication and confirmation.
- Database impact: none.
- Maintenance impact: creates a governance precedent for bypassing a previously required reviewer.

### Option C — Keep UI/UX required with a Phase 5-specific review scope

- Pros: reviews the actual Phase 5 experience without importing a later visual target; preserves both governance and phase boundaries.
- Cons: requires one focused UI/UX review before final consolidation; dashboard gaps remain open.
- Cost: low.
- Complexity: low to moderate.
- Security impact: validates consent and destructive confirmation presentation without accepting production risks.
- Database impact: none; review is visual/interaction-only.
- Maintenance impact: smallest additional review surface and clear baseline for a future dashboard phase.

## Recommendation

Adopt Option C.

UI/UX remains `Required: YES` for Phase 5 and must review Functional Commit `88e194778b4399a6713f118470f9d861c553cd9e`. The review must be limited to Phase 5 behavior and non-regression constraints; it must not use full dashboard fidelity as an acceptance gate.

### Required UI/UX review scope for Phase 5

1. “Memória no chat” is distinct from “Histórico local”, defaults safely and communicates retrieval, persistence and provider use.
2. Memory opt-out remains understandable and does not visually imply that persistent memory is active.
3. Forgetting shows an explicit target and consequence, places initial focus on Cancel, supports Escape and preserves focus/error recovery.
4. `FOCUS_MEMORIES` focuses real nodes without misleading state or fabricated data.
5. Core Orb operational states communicate real events and do not claim unsupported capabilities.
6. Keyboard use, visible focus, reduced motion, contrast and responsive behavior are acceptable for the Phase 5 controls that changed.
7. The interface does not present the approved dashboard, future navigation, metrics, Vision, Files or Automation as already implemented.

### Explicitly outside the Phase 5 UI/UX acceptance gate

- `UIUX-001` through `UIUX-005` as requirements for full dashboard implementation.
- P0/P1/P2/P3 implementation from `dashboard-gap-matrix.md`.
- New navigation destinations, fabricated metrics or planned capabilities.
- Full visual convergence to `UIUX-VIS-2026-09-10-001`.

Those gaps remain valid blockers for claiming that the dashboard target has been implemented. They belong to a dedicated future visual implementation phase, which requires explicit authorization and its own Functional Commit.

## Rationale

Phase acceptance must use criteria known and authorized for that phase. A later target can establish future direction and non-regression constraints, but cannot silently expand the prior implementation scope. At the same time, Phase 5 introduced visible consent and destructive-action behavior, so UI/UX review remains materially applicable. A focused review is the only option that preserves both truths.

## Risks

- UI/UX may accidentally review against the full dashboard rather than the scoped Phase 5 contract.
- “Responsive behavior” could be interpreted as requiring the complete future mobile redesign; only changed Phase 5 controls are in scope.
- The approved target may be mistaken for an implemented feature in public materials.
- Accepted warnings may be forgotten unless tracked in the backlog.
- Production blockers may be confused with feature warnings after Phase 5 closes.

## Acceptance Criteria

- UI/UX reviews exactly `88e194778b4399a6713f118470f9d861c553cd9e`.
- The report explicitly identifies the review as `PHASE 5 FUNCTIONAL UX REVIEW`, not dashboard fidelity review.
- The seven in-scope items above receive evidence and a result.
- `UIUX-001` through `UIUX-005` remain attached to future dashboard implementation, not Phase 5 closure.
- No future capability is marked implemented.
- If UI/UX returns `APPROVED` or `APPROVED_WITH_WARNINGS` and the other three reviews remain unchanged, Planner may consolidate Phase 5 Feature Status as `APPROVED_WITH_WARNINGS`.
- Production Readiness remains `BLOCKED` regardless of Phase 5 feature approval.

## Implementation Phase

- Current action: UI/UX review only; no implementation.
- Phase 5: remains `WAITING_FOR_REVIEW` until the scoped UI/UX result is persisted.
- Dashboard implementation: future dedicated phase, number and scope not yet authorized.
- Phase 6: not started by this decision.

## Deferred Items

- Full HOPE Main Dashboard implementation and fidelity review.
- `UIUX-001` through `UIUX-005` remediation.
- Navigation destinations, real dashboard metrics and future capability surfaces.
- Production blockers `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `SEC-008`, `SEC-012`, `DB-001`, `DB-003` and `DB-004`.
- Real PostgreSQL migration/provider/deploy work.

## Required Reviews

- Current Phase 5 gate: UI/UX YES, focused scope above.
- No new QA, Database or Security re-review is required because this decision changes documentation and review scope only.
- A future dashboard implementation requires QA YES, Security YES, UI/UX YES and Database only if its functional diff affects persistence/data.

## Planner Decision

- Status: APPROVED_WITH_WARNINGS
- Decision: keep UI/UX required for Phase 5, scoped to the Phase 5 experience; defer complete dashboard fidelity to a future authorized phase.
- Phase 5 consolidation: `WAITING_FOR_REVIEW` pending UI/UX only.
- Affected phases: Phase 5 closure and a future dashboard implementation phase.
- User approval required: NO for this review classification; YES before starting the future dashboard phase or any production action.

## Coordinator Handoff

- Recommended Next Role: UI/UX
- Task: perform and persist the scoped `PHASE 5 FUNCTIONAL UX REVIEW` against `88e1947`, without treating full dashboard fidelity as a Phase 5 gate.
- Target commit/document: `88e194778b4399a6713f118470f9d861c553cd9e` and this decision.
- Dependencies: QA, Database and Security results remain unchanged; preserve `UIUX-VIS-2026-09-10-001` as future target.
- Escalation required: NO for the review; YES before dashboard implementation, next phase or production.
