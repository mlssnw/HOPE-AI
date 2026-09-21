# HOPE Documentation Language Policy

- Status: `APPROVED`
- Owner decision date: 2026-09-21
- Effective date: 2026-09-21
- Scope: human-authored repository content
- Functional impact: `NONE`

## Decision

English is the canonical documentation language for HOPE from this decision forward.

The rule applies to:

- source code identifiers, comments and developer-facing text;
- commit messages;
- `README.md`;
- documentation;
- architecture records;
- roadmap documents;
- review reports;
- coordination and handoff records.

## Allowed PT-BR content

Portuguese is allowed only when it is part of the product or test subject rather than the documentation language itself. Valid cases include:

- HOPE dialogue examples, such as `“Hope, espere.”`;
- explicit privacy or consent phrases, such as `“Não registre esta conversa.”`;
- PT-BR user-interface copy;
- localization fixtures;
- linguistic, speech or intent-recognition tests;
- exact historical quotations that must remain verbatim.

These exceptions do not permit surrounding technical explanations, commit messages or review conclusions to default to Portuguese.

## Migration rule

This decision is prospective and does not authorize a broad rewrite of frozen historical evidence during the Phase 6 integration gate.

- New files and new substantive sections must be written in English.
- A materially revised active document should migrate its affected content to English.
- `README.md`, active architecture, roadmap, handoff and current review templates have priority in a separately scoped documentation-only normalization.
- Historical phase records and reviewer evidence may remain in their original language until a dedicated migration is authorized; their technical meaning must not be changed merely for translation.
- Translation-only commits do not change the Functional Commit, but they remain reviewable documentation changes.

## Operational boundary

This policy does not authorize code changes, feature work, Phase 7 implementation, provider work, database changes, production changes or deployment. Phase 6 remains `WAITING_FOR_REVIEW`, and final QA and Security confirmation is still required before merge.
