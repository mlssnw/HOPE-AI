# Phase 7 — Conversational Presence Foundation

## Phase Status

- Planning status: `WAITING_FOR_APPROVAL`
- Architecture decision: `ARCH-2026-09-20-002`
- Approved parent direction: `ARCH-2026-09-20-001` — owner approval on 2026-09-20
- Implementation status: `NOT_STARTED`
- Implementation authorization: `NONE` — `NOT_AUTHORIZED`
- Functional baseline: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
- Production Readiness: `BLOCKED`
- Environment boundary: local/controlado

Este documento é um plano submetido à owner. Sua criação foi autorizada; sua implementação não foi. Ele não inicia UI/UX, Development, provider evaluation, migration, deploy, produção ou qualquer fase posterior.

## Objective

Criar uma fundação local, determinística e provider-neutral para a presença conversacional da HOPE: separar resposta exibida de resposta falada, controlar turnos e cancelamento, projetar estados reais na interface, definir contratos de fala e personalidade original e reagir localmente à amplitude do áudio que já está sendo reproduzido.

## Problem

A Phase 6 possui chat, ditado do navegador, TTS opcional e estados básicos de voz, mas não possui contratos formais para apresentação falada, ciclo de turno, descarte de callbacks atrasados, modos combináveis, frases originais ou `SelfKnowledge` público seguro. Expandir diretamente para streaming, wake word ou perfil de voz criaria dependências de privacidade, identidade, provider e custo antes da Phase 8.

## Current State

- A implementação da Phase 6 está no Functional Commit `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`; os pareceres anteriores permanecem evidência, mas o status operacional para integração é `WAITING_FOR_REVIEW` até QA e Security confirmarem o Integration Candidate documental.
- A resposta textual atual é a fonte usada pela interface e pela leitura em voz.
- `frontend/js/voice.js` usa Web Speech API para ditado; o backend possui TTS opcional ligado à ElevenLabs.
- Cancelamento e proteção contra áudio antigo existem no fluxo atual, mas não formam um contrato de turno reutilizável.
- Core Orb e status já refletem sinais reais de listening/speaking e devem continuar truth-based.
- A identidade do owner ainda é um UUID controlado pelo navegador; Phase 7 não corrige essa fronteira.
- `ARCH-2026-09-20-001`, visão, roadmap e a política de personalidade/public `SelfKnowledge` foram aprovados pela owner.
- Nenhuma nova capacidade de voz, provider, persistência, infraestrutura ou produção está autorizada.

## Constraints

- Preservar `SINGLE_USER`, cloud-first e provider-agnostic sem antecipar a Phase 8.
- Operar somente com capacidades e fluxos já existentes no ambiente local/controlado.
- Não criar novo envio de áudio, transcript, perfil, preferência ou telemetria.
- Não alterar schema, migration, PostgreSQL real, secrets, credenciais ou custos.
- Não apresentar wake word, speaker verification, streaming, cross-device ou integração como funcional.
- Texto exibido permanece a resposta canônica; a versão falada nunca pode omitir segurança, incerteza, confirmação ou consequência material.
- Conteúdo externo, memória e output de modelo permanecem dados não confiáveis e não ativam modos ou permissões.
- A política aprovada permite apenas reconhecimento ou homenagem original quando solicitados explicitamente; citações famosas literais, diálogo copiado, imitação de identidade, clonagem de voz e atuação contínua permanecem proibidos.
- A mudança preexistente em `AGENTS.md` deve ser preservada. Qualquer reconciliação normativa desse arquivo ocorrerá em entrega separada da owner/COORDINATOR antes de autorização de Development.

## Options

### Option A — Estender o controller de voz atual como unidade monolítica

- Pros: menor número inicial de arquivos; integração rápida com o fluxo atual.
- Cons: mistura formatação, turnos, estado, playback, modos e personalidade; aumenta risco de corrida e dificulta testes isolados.
- Cost: baixo inicialmente, crescente com realtime voice.
- Complexity: baixa inicialmente; alta para manutenção.
- Security impact: fronteiras de privacidade e cancelamento ficam implícitas.
- Database impact: nenhum dentro do escopo, mas fácil de introduzir preferência/persistência sem gate claro.
- Maintenance impact: alto acoplamento ao navegador e ao TTS atual.

### Option B — Componentes pequenos com contratos puros e uma fachada de voz

- Pros: separa conteúdo, estado e efeito; permite testes determinísticos; reduz acoplamento a provider; prepara evolução gradual.
- Cons: exige contratos explícitos e integração disciplinada mesmo sem adicionar capability nova.
- Cost: baixo a médio; sem custo de provider novo.
- Complexity: média e localizada.
- Security impact: modo, cancelamento e disclosure podem ser testados como fronteiras independentes.
- Database impact: nenhum; estado da fase permanece efêmero.
- Maintenance impact: menor; componentes podem ser reutilizados por web e clientes futuros.

## Recommendation

Adotar a Option B. A fase deve introduzir somente a camada de apresentação/orquestração local e preservar os transportes atuais sem expandi-los. Qualquer necessidade de novo provider, endpoint de áudio, storage, profile, device ou effect invalida o escopo e retorna ao Planner.

## Rationale

A separação entre resposta canônica, versão falada e estado de turno resolve um problema real já presente sem atravessar a futura fronteira de autenticação e permissões. Componentes puros também permitem validar significado, cancelamento, acessibilidade e personalidade antes de assumir custo operacional ou tratamento de dado sensível.

## Scope

- Separação explícita entre `DisplayResponse` e `SpokenResponse`.
- `SpeechFormatter` determinístico, sem rede ou persistência.
- `TurnManager` para identidade do turno, invalidação, cancelamento e callbacks tardios.
- `VoiceStateManager` como máquina de estados operacional e fonte única para status acessível.
- `VoiceManager` como fachada sobre as capacidades existentes, sem novo provider ou fluxo de dados.
- Contratos provider-neutral de prosódia e pronúncia; nenhum SSML/provider-specific fora de adapter futuro.
- `PhraseLibrary` original com categorias, contexto, cooldown e precedência inferior ao conteúdo substantivo.
- Resolução de modos combináveis por eixos independentes.
- Manifesto estático/versionado de `SelfKnowledge` público seguro.
- Amplitude local e efêmera do áudio que a HOPE já está reproduzindo, limitada a `voiceLevel 0.0..1.0`.
- Estados, controles e mensagens acessíveis compatíveis com os contratos visuais vigentes.
- Testes e evidências proporcionais, sem chamada paga nem banco real.

## Non-goals

- Novo STT/TTS cloud, troca de provider ou streaming de áudio.
- Novo endpoint, payload externo, fallback entre providers ou capability negotiation com serviço externo.
- Wake word em foreground ou background.
- Speaker verification, voice profile, biometria ou retenção de áudio/transcript.
- Cross-device session, registro de dispositivo, localização ou cliente nativo.
- Nova persistência, preferência durável, tabela, migration, query ou mudança no PostgreSQL.
- Tool, agent, coding, automação, integração ou qualquer efeito externo.
- Provider, licença, credencial, secret, orçamento ou custo.
- Owner authentication, PermissionManager ou antecipação da Phase 8.
- Deploy, acesso remoto, produção ou aceitação de risco HIGH/CRITICAL.
- Alteração do core de personalidade, do system prompt ou de `AGENTS.md` nesta autorização de planejamento.

## Dependencies

- Functional Commit da Phase 6 congelado em `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`; consolidação histórica preservada em `ARCH-2026-09-19-001` sem substituir o gate final de integração.
- Integration Candidate documental da Phase 6 confirmado por QA e Security no mesmo hash e integrado em `main`; a rodada anterior sobre `0912e94` não substitui esse gate final da branch.
- Direção `ARCH-2026-09-20-001`, `docs/product-vision.md` e `docs/roadmap.md` aprovadas pela owner.
- Contratos atuais de estado, acessibilidade, reduced motion e truthfulness em `docs/design/`.
- Plano Phase 7 aprovado pela owner antes de qualquer especificação ou implementação.
- Autorização de implementação explícita e separada.
- Reconciliação normativa de `AGENTS.md`, se necessária, em mudança separada e sem incorporar o arquivo preexistente ao commit do Planner.

## Architecture

```text
Canonical model response
          │
          ├──────────────► DisplayResponse ──► Chat UI
          │
          ▼
   SpeechFormatter
          │
          ├── ProsodyHints / PronunciationHints
          └──────────────► SpokenResponse
                                  │
                                  ▼
TurnManager ───────────────► VoiceManager ──► existing playback path
     │                            │
     ├── cancel/invalidate        └── VoiceStateManager ──► status/Core Orb
     │                                                       │
     └── late event guard                    local amplitude ◄┘

ModeResolver ──► presentation/privacy/output policy
SelfKnowledgeManifest ──► public-safe identity and capability claims
PhraseLibrary ──► original, optional surface language only
```

Architectural rules:

1. `DisplayResponse` is canonical and remains available even when speech fails or is disabled.
2. `SpeechFormatter` is pure: input plus explicit mode/locale produces output plus material transformation notes.
3. `TurnManager` owns turn validity. Components may observe a turn but cannot revive or replace it.
4. `VoiceManager` coordinates current capture/playback interfaces; it does not own provider credentials, policy or persistence.
5. `VoiceStateManager` rejects invalid transitions and stale session/turn events.
6. `ModeResolver` can narrow output and context but never expand permission, capability or truth claims.
7. `SelfKnowledgeManifest` is curated data, not generated autobiography.
8. Audio amplitude is computed only from the already-playing output on the client and is discarded immediately.

## Contracts

### DisplayResponse and SpokenResponse

- `DisplayResponse`: canonical content, structure, warnings, sources and metadata already available to the UI.
- `SpokenResponse`: plain spoken text plus locale, optional semantic hints and a list of material formatting transformations.
- Lists and Markdown may be verbalized; long code may be summarized only when the display remains available.
- URLs, identifiers, numbers and commands are transformed conservatively. Any ambiguity preserves the original wording.
- Safety warning, uncertainty, confirmation requirement, target, cost and destructive consequence cannot be summarized away.
- Formatter failure degrades to a conservative plain-text reading or no speech; it never changes the displayed answer.

### TurnManager

- Every submitted interaction receives a monotonic turn ID within a voice session.
- Only the current, non-cancelled turn may synthesize or play audio.
- Cancel invalidates pending generation/synthesis/playback work through one contract.
- Late events are ignored when session ID or turn ID does not match.
- Retry creates a new attempt identity and cannot reuse uncertain external effects; Phase 7 has no external effect.

### VoiceStateManager

- Allowed states: `IDLE`, `LISTENING`, `THINKING`, `SEARCHING`, `SPEAKING`, `ALERT`, `ERROR`.
- `EXECUTING` remains reserved for a real future effect and cannot be synthesized by this phase.
- Each transition carries source, session ID, turn ID, timestamp and optional expiry.
- Precedence follows `docs/design/states.md`; unknown or expired state degrades safely.
- Accessible text is authoritative. Motion/color are supplemental.

### VoiceManager

- One explicit voice session at a time.
- Coordinates start/stop/cancel and the existing dictation/playback path.
- Adds no external request, provider fallback, credential, retention or background process.
- A cancelled or superseded turn cannot start or continue playback.

### Prosody and pronunciation

- Hints are semantic and bounded: pace, pause, emphasis, energy, locale and pronunciation token.
- They never encode emotion diagnosis, secret data, provider markup or permission.
- Provider-specific conversion is deferred to a future authorized adapter.

### PhraseLibrary

- Entries are original HOPE language with stable ID, locale, category, context, cooldown and safety eligibility.
- Phrase selection never replaces substantive content, warning, confirmation or error detail.
- Approved inspirations influence only general traits.
- Recognition/original homage is allowed only after an explicit request and remains one response, original and non-imitative.

### Modes

Modes are orthogonal and session-local in Phase 7:

| Axis | Values | Phase 7 effect |
|---|---|---|
| Style | NORMAL, FOCUS, SUPPORTIVE, PRESENTATION | phrasing/pacing only |
| Privacy | STANDARD, PRIVATE | PRIVATE forces existing memory capture/retrieval off for new turns and disables new local-history writes |
| Output | VOICE, SILENT | SILENT prevents synthesis/playback |
| Interruption | STANDARD, DO_NOT_DISTURB | suppresses nonessential proactive presentation; no proactive runtime is added |
| Audience | PRIVATE, PUBLIC | PUBLIC uses public `SelfKnowledge` and blocks private memory context for new turns |

Activating a mode is prospective. It does not delete prior data or hide content already visible. UI/UX must make this limit clear. No mode grants permission, starts recording, enables an unavailable capability or changes factual content.

### Public-safe SelfKnowledge

The Phase 7 manifest may contain only:

- HOPE name and original identity;
- approved general inspirations and the approved narrow homage boundary;
- capabilities verified as implemented, planned capabilities explicitly labelled, and current limitations;
- public privacy behavior and availability state derived from real capability signals.

It must exclude system prompts, chain-of-thought, credentials, secrets, private memory, owner-identifying content, internal paths and exploitable security details. A static statement cannot mark a service available without a real capability signal.

### Local amplitude

- Analyze only audio already being played by the HOPE client.
- Normalize and smooth to `voiceLevel 0.0..1.0` with a visual ceiling.
- Reset to zero on pause, end, cancel, error or turn invalidation.
- Never upload, persist, log, correlate or infer emotion/identity from the value.
- Reduced motion replaces continuous response with restrained intensity and text state.

## Privacy and Security

- No background microphone, ambient capture or new audio transmission.
- Existing microphone and TTS disclosures remain visible; no control may imply a capability that is unavailable.
- `PRIVATE` and `PUBLIC` fail closed for new memory use. If the mode cannot be applied confidently, the turn must not use memory.
- Prompt, model output, memory, web or document content cannot activate a mode, alter `SelfKnowledge` or authorize an exception.
- All cancellation and state events are untrusted until matched to the active session/turn.
- Public-safe manifest content is allowlisted and versioned; protected diagnostics are out of scope.
- No secret, raw audio, transcript, amplitude sample or private prompt is added to logs.
- Production blockers and the current owner-identity gap remain unchanged.

## Database Impact

- Expected impact: none.
- `DATABASE: NO` while the implementation remains ephemeral and makes no schema, migration, query, memory-model or persistence change.
- Existing `user_id`, memory tables and PostgreSQL behavior remain untouched.
- Any proposal to persist modes, pronunciations, phrases, voice sessions, transcripts, amplitude, preferences or `SelfKnowledge` changes the scope, makes `DATABASE: YES` and requires a new Planner decision before implementation continues.

## Acceptance Criteria

- [ ] Owner approves this exact phase plan.
- [ ] Owner separately authorizes implementation; planning approval alone is insufficient.
- [ ] Displayed and spoken representations are separate, with displayed content remaining canonical.
- [ ] Speech formatting preserves safety, uncertainty, confirmation, targets, costs and destructive consequences.
- [ ] Long code/list formatting is deterministic and leaves the complete display response available.
- [ ] Every voice interaction has a session/turn identity; stale callbacks cannot speak or change state.
- [ ] Stop/cancel halts current playback, invalidates downstream work and returns to a truthful stable state.
- [ ] `VoiceStateManager` transitions satisfy the documented precedence and accessible status rules.
- [ ] Existing voice/provider network behavior is unchanged; no new endpoint, provider, fallback, secret, dependency or external data category is introduced.
- [ ] Prosody/pronunciation contracts are provider-neutral and contain no provider markup or sensitive profile.
- [ ] PhraseLibrary content is original, non-repetitive and unable to override substantive content.
- [ ] Explicit homage remains original, single-response and non-imitative; prohibited quote/identity/voice behavior is covered by tests.
- [ ] Modes combine deterministically, with privacy/output restrictions winning over style.
- [ ] `PRIVATE`/`PUBLIC` cannot use memory for new turns when the restriction cannot be enforced.
- [ ] `SelfKnowledge` reports only allowlisted public facts and distinguishes `IMPLEMENTED`, `PARTIAL`, `PLANNED` and unavailable capability.
- [ ] Core Orb amplitude derives only from already-playing local audio, remains ephemeral and resets on stop/end/error.
- [ ] Keyboard, screen-reader status, reduced motion and stop controls meet the existing design contracts.
- [ ] No code presents wake word, speaker verification, streaming, cross-device, tools, agents or external effects as implemented.
- [ ] No database, migration, real provider call, paid service, credential, deploy or production change occurs.
- [ ] QA, Security and UI/UX review the same future Functional Commit; Database remains `N/A` only if the no-persistence boundary holds.
- [ ] Production Readiness remains `BLOCKED`.

## Test Strategy

- Unit tests for `SpeechFormatter` invariants: warnings, uncertainty, confirmations, numbers, URLs, commands, Markdown, lists and long code.
- Property/table tests for mode precedence and for “style cannot expand authority”.
- Unit tests for turn IDs, cancellation, late callbacks, repeated stop and invalid transitions.
- Unit tests for PhraseLibrary cooldown, originality allowlist/prohibited patterns and substantive-content precedence.
- Unit tests for `SelfKnowledge` allowlist, capability-state labels and protected-field rejection.
- Unit tests for amplitude normalization/reset using synthetic PCM only.
- Frontend integration tests with fake recognition/audio; no microphone, provider or paid network dependency.
- Browser tests for start/stop/cancel, overlapping turns, unavailable voice, keyboard, focus, accessible status and reduced motion.
- Security tests for prompt/memory attempts to activate modes, inject `SelfKnowledge`, bypass quote rules or revive cancelled audio.
- Static diff checks proving no backend API expansion, schema/migration, environment variable, credential or provider dependency.
- Regression suites from Phase 6 and evidence package tied to one exact Functional Commit.

## Required Reviews

| Work | Required | Justification |
|---|---|---|
| QA | YES | novos contratos de conteúdo, estado, cancelamento e browser exigem regressão funcional e testes de corrida |
| DATABASE | NO | a fase proíbe persistência, schema, migration e query; qualquer delta reabre o plano com Database `YES` |
| SECURITY | YES | voz, privacidade, modos, conteúdo não confiável, `SelfKnowledge` e truthful capability claims formam fronteiras de segurança |
| UI/UX | YES | display/spoken, estados, stop, modos, acessibilidade e Core Orb exigem especificação prévia e review de fidelidade |

## Risks

- O formatter alterar significado ou ocultar aviso material.
- Corrida permitir áudio ou estado de turno antigo.
- `PRIVATE`/`PUBLIC` parecer proteção retroativa quando é prospectiva.
- `PhraseLibrary` tornar a personalidade repetitiva ou próxima de imitação.
- `SelfKnowledge` divergir do estado real e criar claims falsos.
- Web Audio ter restrições de autoplay/contexto e produzir amplitude enganosa.
- Estados visuais competirem com acessibilidade ou reduced motion.
- Scope creep para cloud TTS/STT, wake word, biometria ou persistência antes da Phase 8.
- Reutilização futura dos contratos induzir falsa impressão de provider já aprovado.

Mitigações principais: funções puras, allowlists, IDs de turno, fail-closed para memória/modos, texto acessível como fonte, testes de invariantes e interrupção obrigatória do trabalho quando um non-goal se tornar necessário.

## Rollout and Rollback

- Rollout futuro somente local/controlado e após autorização explícita.
- UI/UX especifica os fluxos antes de Development; Development produz um único Functional Commit revisável.
- Integração deve ser incremental: contratos puros, estado/turnos, formatter, modes/SelfKnowledge e, por último, amplitude local.
- O display canônico e o caminho de chat permanecem operacionais se a fala estiver indisponível.
- Falha do formatter usa saída conservadora ou desativa fala; não inventa resumo.
- Rollback remove a integração dos novos componentes e retorna ao comportamento de voz da Phase 6, sem migration ou transformação de dados.
- Nenhuma publicação, provider rollout ou banco real participa deste plano.

## Implementation Phase

Sequência futura, não autorizada:

1. Owner aprova ou revisa este plano.
2. Owner emite autorização de implementação separada.
3. UI/UX produz a especificação pré-implementação da Phase 7.
4. Development implementa o menor conjunto aprovado e cria um Functional Commit exclusivo.
5. QA, Security e UI/UX revisam exatamente o mesmo hash; Database permanece `N/A` somente se não houver impacto de dados.
6. Planner consolida os reviews sem iniciar Phase 8 automaticamente.

## Deferred Items

- Realtime/streaming STT e TTS.
- Escolha de provider, fallback, região, retenção, licença, credencial e orçamento.
- Owner recognition, sessão protegida, ResourceAuthorizer e PermissionManager da Phase 8.
- Background wake word e cliente Windows.
- Speaker verification, voice profile e qualquer dado biométrico.
- Cross-device, clientes instaláveis, localização e contexto de dispositivo.
- Preferências persistentes de voz, pronúncia ou modos.
- Tools, integrations, external effects, coding, agents, learning, automations e Bridge.
- Cloud, migration, produção e go-live.

## Future Authorization Requirements

- Aprovação explícita deste plano não autoriza implementação.
- Development só pode iniciar com nova autorização explícita da owner, depois do gate de UI/UX aplicável.
- A limpeza documental, os reviews finais de QA/Security sobre o mesmo Integration Candidate e a integração da Phase 6 em `main` devem estar concluídos antes dessa autorização de implementação.
- Qualquer novo provider, dado persistido, credencial, custo, migration, acesso remoto ou mudança de produção exige decisão própria.
- Risco HIGH/CRITICAL não pode ser aceito por Planner, reviewers ou Coordinator.
- A Phase 8 e qualquer fase posterior exigem planejamento e autorização separados.

## Coordinator Handoff

- Next role: `COORDINATOR`.
- Action: apresentar `ARCH-2026-09-20-002` e este plano à owner para aprovação ou revisão.
- Do not route to: UI/UX, Development, Database implementation, provider evaluation, cloud or production.
- Preserve: Phase 6 Functional Commit, Review Matrix, Production Readiness and all reviewer findings.
