# HOPE Documentation Language Policy

- Status: `APPROVED`
- Owner decision date: 2026-09-21
- Effective date: 2026-09-21
- Scope: human-authored repository content
- Functional impact: `NONE`

## Decision

English is the canonical language for HOPE technical documentation from this decision forward.

The rule applies to:

- source code identifiers, comments and developer-facing text;
- commit messages;
- documentation;
- architecture records;
- roadmap documents;
- review reports;
- coordination and handoff records.

Two owner-approved exceptions apply:

- `README.md` is the public product presentation and must be written in PT-BR;
- any status, decision, approval request, escalation or handoff delivered directly to the owner must also be available in PT-BR, even when the canonical technical record is in English.

## Allowed PT-BR content

Portuguese is allowed only when it is part of the product or test subject rather than the documentation language itself. Valid cases include:

- HOPE dialogue examples, such as `“Hope, espere.”`;
- explicit privacy or consent phrases, such as `“Não registre esta conversa.”`;
- PT-BR user-interface copy;
- localization fixtures;
- linguistic, speech or intent-recognition tests;
- exact historical quotations that must remain verbatim.

These exceptions do not require canonical technical records, commit messages or review conclusions to default to Portuguese. They require a PT-BR presentation layer where the owner or the public README is the audience.

## Migration rule

This decision is prospective and does not authorize a broad rewrite of frozen historical evidence during the Phase 6 integration gate.

- New files and new substantive sections must be written in English.
- A materially revised active document should migrate its affected content to English.
- Active architecture, roadmap, handoff and current review templates have priority in a separately scoped documentation-only normalization.
- `README.md` remains in PT-BR and should describe one active phase clearly; future phases belong in the roadmap rather than competing with the current phase in the public summary.
- Historical phase records and reviewer evidence may remain in their original language until a dedicated migration is authorized; their technical meaning must not be changed merely for translation.
- Translation-only commits do not change the Functional Commit, but they remain reviewable documentation changes.

## Operational boundary

This policy does not authorize code changes, feature work, Phase 7 implementation, provider work, database changes, production changes or deployment. Phase 6 remains `WAITING_FOR_REVIEW`, and final QA and Security confirmation is still required before merge.
