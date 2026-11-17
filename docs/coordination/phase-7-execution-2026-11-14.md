# Phase 7 execution coordination — 2026-11-14

## Owner direction

The owner requested completion of the whole Phase 7, use of the predefined Works when needed, continued Git commits, and notification of changes. The owner explicitly retained the **HOPE** name; no KELEX rename is authorized.

The previously presented narrow generation amendment is included in the requested implementation. Planner reconciliation `ARCH-2026-11-14-001` records its exact boundary: one validated per-turn presentation enum and a bounded static server-authored section in the existing generation call. This execution record does not approve a provider, live paid evaluation, budget change, production or a later phase.

## Working tree boundary

- Execution checkout: `C:/Users/maria.luiza5/.codex/worktrees/phase-7-completion/HOPE-AI`.
- Branch: `codex/phase-7-completion`.
- Initial clean HEAD: `dde81869a09c9ca50ca18b7e4d0c4ff326d0c951`.
- Included partial functional checkpoint: `2647794ea806b20117c7cce531602911da98ca97` (TTS overlength rejection), not a complete Phase 7 delivery.
- Preserve the original `phase-7-conversational-presence` checkout and its uncommitted identity restoration, unrelated UI/runtime changes, real local database and historical evidence changes. They are not imported into this delivery.
- Preserve the main checkout and its preexisting untracked files. Feature-branch commits do not authorize merge into main or production.

## Visible Work routing

Use the existing project tasks so the owner can inspect the prompts and results. Internal helpers from the earlier paused run remain interrupted and must not write concurrently with the visible Works.

| Work | Existing task | Current route |
|---|---|---|
| PLANNER | `01a06512-d1df-75c0-af33-3665be10775f` | Authorization reconciled in `11eb4f7`; final consolidation waits for matching required re-reviews. |
| DEV | `01a05fd4-0cf2-77b3-bbfd-408b6bc57aae` | Corrected candidate `af2aa66` delivered with documentation `5f125a0`; functional writes are frozen during review. |
| QA | `01a0650d-9115-74d0-bd54-e6306a06d106` | APPROVED_WITH_WARNINGS on `af2aa66` in `7a5a446`; QA-P7-001/002 closed and browser ports released. |
| SECURITY | `01a06511-edb4-77d3-bccf-407a90a90289` | APPROVED_WITH_WARNINGS on `af2aa66` in `a2b5739`; SEC-021 closed, production blockers preserved. |
| UI/UX | `01a06db4-35e1-7192-a9b2-b046e817b27d` | Independent current-target browser interaction/evidence window active; final verdict is pending. |
| DATABASE | `01a0650f-5208-7622-9780-f5762a003c8a` | N/A while no schema, migration, query or persistence expansion occurs; reopen through Planner if scope changes. |

One writer owns implementation. Reviewers do not fix code. Serialize updates to `docs/handoff.md`; each role writes only its own report and section. A new functional correction requires affected re-reviews against the new exact hash. The Coordinator normalizes operational state and public documentation; the Planner consolidates results without replacing domain reviewers.

## Acceptance and communication boundaries

- Complete all Phase 7 acceptance criteria and `UIUX-P7-001` through `UIUX-P7-021`; do not relabel the partial TTS checkpoint as full completion.
- Personality belongs primarily in substantive answers. Mode entry/change performs no automatic phrase selection; no phrase is the normal default. Focus begins directly with analysis. Supportive preserves HOPE's direct, original identity.
- Only exact phrase records `P7-PHRASE-006` through `P7-PHRASE-018` are approved. Pending `021` through `028` and rejected/withdrawn records remain excluded. The repeated objective examples do not silently broaden recorded phrase approvals.
- Use mocks, synthetic audio and disposable fixtures for validation. Do not read or mutate real data, use live microphones, call paid providers or copy old secrets into this checkout.
- New evidence belongs to Phase 7. Preserve committed Phase 6 evidence and label simulated/provider-fidelity limits accurately.
- Notify the owner in PT-BR when scope/architecture changes, implementation commits land, a reviewer returns findings, a fix changes the target hash, or a decision genuinely requires owner input. Documentation and commit messages remain English; the README remains PT-BR.
- Production Readiness stays `BLOCKED`; no automatic Phase 8 follows Phase 7 completion.
