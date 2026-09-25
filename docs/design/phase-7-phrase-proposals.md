# Phase 7 — PhraseLibrary Proposal Register

- Register status: `PENDING_OWNER_DECISIONS`
- Date: 2026-09-25
- Functional baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`
- Phase 7 Functional Commit: `NONE`
- Architecture decision: `ARCH-2026-09-25-001`
- UI/UX specification: [`phase-7-conversational-presence-spec.md`](phase-7-conversational-presence-spec.md)
- Locale of proposed content: `pt-BR`

## Approval protocol

This register contains the smallest sufficient initial package for validating style-sensitive surface language, interruption acknowledgment and restrained dry humor. These are proposals, not product copy.

- Every record starts as `PENDING_OWNER_APPROVAL`.
- The owner must decide each record separately: `APPROVED`, `REJECTED`, or an edited replacement submitted as a new pending record.
- Approval applies only to the exact Unicode text and exact recorded context.
- Approval does not include punctuation variants, paraphrases, translations, localizations, concatenations, pronunciation rewrites, SSML, derived copy or future edits.
- No pending or rejected phrase may enter source code, `PhraseLibrary` data, tests, fixtures, snapshots, defaults, seeded content or the active product.
- Phrase selection is optional and always subordinate to substantive content, safety, truth, privacy, errors and confirmations.
- Cooldowns are session-local and are not persisted.

## Proposal 1 — Focus-mode opening

- Record ID: `P7-PHRASE-001`
- Status: `PENDING_OWNER_APPROVAL`
- Exact text: `Certo. Vamos direto ao que importa.`
- Locale: `pt-BR`
- Category: `STYLE_FOCUS_OPENING`
- Exact usage context: Optional opening after the owner explicitly selects `FOCUS` and submits a new, non-sensitive turn whose requested outcome is clear. It may precede the substantive answer once; it is never a complete answer by itself.
- Intended tone: Strategic, concise and calmly confident.
- Frequency/cooldown: At most once per 8 eligible assistant turns and at most twice per session.
- Safety eligibility: Eligible only for ordinary planning, analysis, organization or technical problem-solving.
- Prohibited contexts: Emergencies; medical, legal, financial or safety-critical guidance; grief or acute distress; destructive confirmation; permission request; privacy disclosure; capability failure; error; uncertainty that must lead the answer; `DO_NOT_DISTURB`; `SILENT` for spoken-only use.
- Notes: Must be omitted when the answer needs to begin with a warning, limitation, uncertainty or direct refusal.

## Proposal 2 — Supportive-mode opening

- Record ID: `P7-PHRASE-002`
- Status: `PENDING_OWNER_APPROVAL`
- Exact text: `Vamos por partes. Eu mantenho o fio com você.`
- Locale: `pt-BR`
- Category: `STYLE_SUPPORTIVE_OPENING`
- Exact usage context: Optional opening after the owner explicitly selects `SUPPORTIVE` for a complex or cognitively heavy, non-emergency request. It may introduce a structured answer without claiming emotional diagnosis.
- Intended tone: Steady, protective and clear without infantilization or exaggerated warmth.
- Frequency/cooldown: At most once per 10 eligible assistant turns and at most once per session unless the owner explicitly reselects Supportive mode.
- Safety eligibility: Eligible for complex planning, study, debugging, prioritization or a user-stated feeling of being overwhelmed when no urgent safety response is required.
- Prohibited contexts: Crisis or emergency; medical/mental-health diagnosis; grief formula; refusal; destructive action; permission/consent; privacy failure; system error; inferred emotion without an explicit user signal; `DO_NOT_DISTURB`; `SILENT` for spoken-only use.
- Notes: The phrase cannot replace concrete next steps or imply continuous human companionship.

## Proposal 3 — Presentation-mode opening

- Record ID: `P7-PHRASE-003`
- Status: `PENDING_OWNER_APPROVAL`
- Exact text: `Vou organizar isso para ficar claro, preciso e fácil de acompanhar.`
- Locale: `pt-BR`
- Category: `STYLE_PRESENTATION_OPENING`
- Exact usage context: Optional opening after the owner explicitly selects `PRESENTATION` and requests a structured explanation, briefing or rehearsal. It may precede the substantive display response.
- Intended tone: Polished, composed and technically precise.
- Frequency/cooldown: At most once per 10 eligible assistant turns and at most once per presentation sequence.
- Safety eligibility: Eligible for ordinary explanations, summaries, briefings and rehearsal content.
- Prohibited contexts: Urgent alerts; destructive confirmation; error; refusal; privacy/security warning; short factual answer where the phrase would add noise; `DO_NOT_DISTURB`; `SILENT` for spoken-only use.
- Notes: It must not imply that facts were changed or simplified beyond the displayed canonical answer.

## Proposal 4 — User interruption acknowledgment

- Record ID: `P7-PHRASE-004`
- Status: `PENDING_OWNER_APPROVAL`
- Exact text: `Entendido. Parei a leitura; a palavra é sua.`
- Locale: `pt-BR`
- Category: `VOICE_INTERRUPTION_ACKNOWLEDGMENT`
- Exact usage context: Optional acknowledgment only after active HOPE playback has actually stopped because the owner explicitly interrupted it through the UI or began a new voice input. The state transition and stop control remain authoritative.
- Intended tone: Responsive, respectful and concise.
- Frequency/cooldown: At most once per confirmed interruption and no more than once within 30 seconds.
- Safety eligibility: Eligible only after successful local playback stop for the current valid turn.
- Prohibited contexts: Pending stop; synthesis that never played; microphone permission failure; chat-generation cancellation without playback; stale callback; error; automatic audio end; `DO_NOT_DISTURB`; any case where playback may still continue.
- Notes: If speech output is already silent, present only as optional display copy after the stop is confirmed; never synthesize it as new audio immediately after the owner stopped audio.

## Proposal 5 — Verified completion with restrained humor

- Record ID: `P7-PHRASE-005`
- Status: `PENDING_OWNER_APPROVAL`
- Exact text: `Concluído. Sem fanfarra — o resultado já se sustenta.`
- Locale: `pt-BR`
- Category: `VERIFIED_COMPLETION_DRY_HUMOR`
- Exact usage context: Optional closing after a local, non-sensitive task has a verifiably successful result and the substantive response already contains the evidence. It is polish, never the success signal itself.
- Intended tone: Confident, elegant and lightly irreverent.
- Frequency/cooldown: At most once per 15 eligible assistant turns and at most once per session.
- Safety eligibility: Eligible only for confirmed low-risk completion with no unresolved warning.
- Prohibited contexts: Partial/uncertain outcome; external effect; destructive or sensitive action; safety, medical, legal or financial matter; user distress; error/recovery; refusal; permission or consent; background/autonomous claim; `DO_NOT_DISTURB`; `SILENT` for spoken-only use.
- Notes: The phrase must never be used to claim completion based solely on model confidence or an unverified callback.

## Package decision boundary

- Proposed records: 5
- Approved records: 0
- Rejected records: 0
- Pending records: 5
- Development eligibility: `BLOCKED` for all five exact phrases until individual owner decisions are persisted.
- Empty-library behavior: If no phrase is approved, Development may still implement the non-content `PhraseLibrary` contract and deterministic selection tests using clearly non-product sentinels, but it must ship no phrase from this register.
