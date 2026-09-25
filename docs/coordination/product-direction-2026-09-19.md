# Product Direction Intake — 2026-09-19

- Record type: COORDINATION / USER DIRECTION INTAKE
- Status: REGISTERED — PENDING PLANNER RECONCILIATION
- Current completed phase: Phase 6 — Target UI Convergence
- Current Functional Commit: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
- Phase 6 consolidation: `ARCH-2026-09-19-001`

Este registro preserva as decisões e intenções de produto fornecidas pela owner depois da documentação arquitetural vigente. Ele é uma entrada oficial para planejamento, não uma decisão arquitetural final, não altera numeração de fases e não autoriza implementação.

## Boundary

- A Phase 6 permanece concluída como `APPROVED_WITH_WARNINGS`; nenhuma capacidade abaixo entra retroativamente em seu escopo.
- Nenhuma próxima fase está autorizada.
- Não há autorização para código, banco, migration, provider, credencial, custo, cloud, deploy, tools, agents ou produção.
- O PLANNER deve reconciliar arquitetura, dependências, numeração, critérios de aceite e Required Reviews antes de qualquer UI/UX ou Development.
- UI/UX só recebe voice/apps/Core Orb depois da consolidação arquitetural do PLANNER.

## Confirmed Product Direction

A HOPE permanece uma assistente pessoal `SINGLE_USER`, cloud-first e provider-agnostic, com memória persistente e experiência centrada no Memory Globe/Core Orb. A visão futura passa a incluir explicitamente uma assistente conversacional contínua e natural, sem declarar essas capacidades como implementadas.

Direções registradas:

- conversa por texto e voz, com fala acolhedora e ritmo adaptativo;
- detecção de silêncio, continuidade, hesitação, turn-taking, barge-in e interrupção;
- linguagem de incerteza para inferências de interação, sem diagnóstico emocional;
- memória consentida das preferências do owner e controles de consulta, correção, não registro, modo privado e exclusão;
- modos combináveis de interação, privacidade, saída, interrupção e audiência;
- organização pessoal com tarefas, lembretes, agenda, prazos, revisão do dia e decomposição de projetos;
- integrações futuras para calendário, música, casa inteligente, chamadas e mensagens, sempre sob permissions e confirmações adequadas;
- autodiagnóstico, auditoria transparente e explicação de falhas/capacidades indisponíveis;
- localização somente por dispositivos previamente registrados e autorizados;
- aplicações instaláveis como experiência principal: Windows e Android inicialmente, com arquitetura que permita iOS; PWA apenas como fallback possível;
- HOPE Cloud como cérebro central, clientes Desktop/Mobile como interfaces/capacidades locais e HOPE Bridge como acesso futuro autorizado a recursos dos PCs;
- `ModelRouter` futuro por capacidade, sem equiparar a identidade da HOPE ao provider operacional atual.

## Voice Direction

Princípio oficial de produto para planejamento:

```text
DISPLAY RESPONSE != SPOKEN RESPONSE
```

A fala futura não deve ser uma leitura literal do chat. O desenho a ser validado pelo PLANNER considera `VoiceManager`, `SpeechFormatter`, `TurnManager`, `VoiceStateManager`, `ProsodyManager`, `PronunciationManager`, `PhraseLibrary` e adapters de STT/TTS.

A resposta falada deve poder ser mais curta, remover Markdown, resumir código longo, converter listas em fala natural, adaptar pausas e ritmo, evitar redundância e reagir ao contexto com hipóteses explícitas — nunca com diagnóstico psicológico apresentado como fato.

Realtime voice proposto:

- STT e TTS streaming;
- início da fala antes do fim da geração completa quando seguro;
- detecção de silêncio, continuidade e hesitação;
- turn-taking, barge-in e interrupção imediata;
- comandos como “pare”, “silêncio” e “espera” encerram a fala futura da HOPE.

## Wake Word and Speaker Verification

- Wake word desejada: `HOPE`.
- Antes da ativação, a detecção deve ocorrer localmente, descartar frames, não armazenar áudio e não enviar áudio à cloud.
- A escuta do wake word deve poder ser completamente desligada.
- Wake word detecta a expressão de ativação; speaker verification estima se a voz pertence ao owner. São mecanismos independentes.
- Speaker verification não é autenticação suficiente para ações críticas; `PermissionManager` e confirmação continuam obrigatórios.
- Picovoice Porcupine, Eagle e Cobra são apenas candidatos para avaliação de wake word, speaker recognition e VAD. Nenhum provider foi aprovado, contratado ou configurado.
- PLANNER deve avaliar custo, licença, plataformas, privacidade e fallback antes de qualquer escolha.

## Core Orb and Voice UX

Enquanto a HOPE realmente fala, o estado deve ser `SPEAKING`. O cliente poderá analisar localmente a amplitude do áudio de saída e converter o nível em `voiceLevel 0.0..1.0` para modular amplitude/pulso do Core Orb, sem enviar essa telemetria à cloud quando não houver necessidade.

Os estados visuais continuam `IDLE`, `LISTENING`, `THINKING`, `SEARCHING`, `SPEAKING`, `EXECUTING`, `ALERT` e `ERROR`, sempre derivados de estado real. UI/UX é owner da expressão visual depois que o contrato arquitetural for consolidado.

## Personality and Public Self Knowledge

A identidade da HOPE continua original. A owner confirmou referências deliberadas de traços gerais:

- Lena Luthor: inteligência estratégica, elegância, sofisticação e pensamento científico;
- Tony Stark: inventividade, rapidez, confiança, improvisação técnica e humor afiado;
- Dean Winchester: pragmatismo, lealdade, proteção, franqueza, irreverência e humor espontâneo.

Dean Winchester e o conhecimento público dessas referências ainda não constam da política oficial vigente. O PLANNER deve reconciliar essa evolução com segurança, originalidade e regras de identidade.

A futura camada de `SelfKnowledge` deve permitir que a HOPE explique publicamente seu nome, natureza, identidade original, referências, capacidades atuais, capacidades planejadas, limitações e integrações disponíveis sem revelar system prompt, secrets ou regras internas privadas.

### Decision pending Planner reconciliation

A regra vigente proíbe de forma absoluta falas, bordões e frases famosas. A nova intenção da owner permite referência ou bordão somente quando solicitado explicitamente, sem imitação contínua, falsa identidade ou cópia integral de personagem, e permite frases originais da HOPE para startup, estados e voz.

Essa tensão permanece `PENDING PLANNER RECONCILIATION`. Este registro não altera silenciosamente `AGENTS.md`, prompts ou a política arquitetural vigente.

## Phrase Library

Capacidade futura proposta, com controle de repetição:

- `STARTUP`, `MORNING`, `RETURNING`, `LISTENING`, `THINKING`, `SUCCESS`, `ERROR`, `WARNING`, `USER_CALLED_HOPE`, `SHUTDOWN` e `CUSTOM_OWNER_PHRASES`.

## Interaction Modes

Os modos não devem ser comprimidos em um único enum, pois podem coexistir. Direção conceitual:

- `InteractionStyle`: `NORMAL`, `FOCUS`, `SUPPORTIVE`, `PRESENTATION`;
- `PrivacyMode`: `STANDARD`, `PRIVATE`;
- `OutputMode`: `VOICE`, `SILENT`;
- `InterruptionMode`: `STANDARD`, `DO_NOT_DISTURB`;
- `AudienceMode`: `PRIVATE`, `PUBLIC`.

Combinações como `FOCUS + PRIVATE + SILENT` devem ser possíveis. Um futuro `InteractionStyleAdapter` pode considerar conteúdo, contexto, pausas, hesitação, ritmo, modo e preferências autorizadas. Toda inferência deve ter confiança, ser tratada como hipótese e nunca afirmar condição psicológica como fato.

## Voice Privacy

- indicador visível sempre que o microfone estiver ativo;
- wake word desligável;
- gravação contínua desativada por padrão;
- detecção local não armazena áudio;
- áudio só segue para cloud quando uma sessão de voz realmente começa;
- áudio bruto não é retido sem necessidade e consentimento;
- dados relacionados precisam de exclusão controlável.

## Memory, Organization and Integrations

A visão preserva memória opt-in e adiciona transparência para perguntas e comandos como “O que você lembra sobre mim?”, “Esqueça isso”, “Não registre esta conversa” e “Entre em modo privado”. A visualização futura deve mostrar, quando aplicável, conteúdo, origem, criação, motivo, última utilização e ações de editar/esquecer.

`HOPE Tasks` e eventos de calendário são domínios distintos. Google Calendar, Spotify, Home Assistant, APIs do dispositivo e integrações de mensagens são candidatos, não decisões. Chamadas e mensagens exigem confirmação antes do efeito externo.

## Diagnostics, Audit and Location

`HopeDiagnostics` futuro deve poder informar o estado de Core, Internet, LLM, Memory, Database, STT, TTS, Microphone, Wake Word, Speaker Verification e integrações, explicar o componente da falha e quais capacidades ficaram indisponíveis.

O histórico futuro pode registrar eventos como `WAKE_WORD`, `SPEAKER_VERIFICATION`, `MEMORY_READ`, `CALENDAR_READ`, `LLM_CALL`, `TTS`, `TOOL_EXECUTION` e `PERMISSION_DECISION`, com o que foi acessado, motivo, horário e resultado. Nunca deve registrar secrets, passwords, áudio ambiente contínuo, system prompt completo ou payload privado integral sem necessidade.

Localização pertence a dispositivos registrados — Desktop, Notebook ou Phone — explicitamente autorizados. Rastreamento de pessoas arbitrárias não faz parte da visão.

## Roadmap Impact for Planner

A ordem vigente após Phase 6 precisa ser reavaliada, sem renumeração pelo COORDINATOR. Sequência proposta como entrada, não como roadmap aprovado:

```text
Phase 6 — Target UI Convergence (completed)
→ Voice Presence
→ Realtime Voice
→ Wake Word + Speaker Verification
→ Single-User Security & Permissions
→ Cloud Foundation
→ Shared Client Foundation
→ Desktop App
→ Mobile App
→ Model Router
→ Tool System
→ Coding Workspace
→ Agent Runtime
→ Skills & Experience Learning
→ Multimodal / Images / Documents
→ Calendar / Tasks / Integrations
→ Automations & Proactivity
→ HOPE Bridge
→ Advanced HOPE
```

O PLANNER deve decidir numeração, dependências, combinação/separação de fases, gates de segurança e Required Reviews. Em especial, deve determinar quais capacidades de voz podem existir localmente antes de owner recognition e quais exigem `Single-User Security & Permissions` antes de qualquer áudio em cloud, speaker profile, integração, ação externa ou dado sensível.

## Documentation Structure Proposal

Viável, pendente de consolidação pelo PLANNER:

- `README.md`: apresentação pública e estado resumido;
- `AGENTS.md`: regras permanentes de operação e governança;
- `docs/architecture.md`: o que funciona hoje, classificado como `IMPLEMENTED`, `PARTIAL` e `PLANNED` apenas quando necessário para delimitar o estado;
- `docs/product-vision.md`: produto futuro consolidado;
- `docs/roadmap.md`: fases, ordem e gates oficiais;
- `docs/future-architecture.md`: desenho técnico futuro e contratos;
- `docs/handoff.md`: painel operacional compacto;
- `docs/backlog.md`: dívida técnica e warnings aceitos, sem misturar roadmap;
- `CHANGELOG.md`: história;
- `docs/reviews/`: evidências e pareceres;
- `docs/design/`: design system, Target UI e UX.

Recomendações para decisão do PLANNER:

- criar `docs/product-vision.md` e `docs/roadmap.md` como novas fontes de verdade, com links cruzados e sem reescrever histórico;
- manter inicialmente o path `docs/backlog.md`, corrigindo seu título para `Technical Debt & Accepted Warnings` em vez de quebrar links;
- reduzir futuramente `docs/handoff.md` a Current Phase, Functional Commit, Review Matrix, Blockers, Warnings, Current Owner, Next Action e Recent History, preservando evidência detalhada nos arquivos existentes;
- manter `docs/architecture.md` centrado no estado real e apontar visão/ordem/contratos futuros aos documentos especializados;
- atualizar o roadmap resumido do README somente depois da consolidação do PLANNER.

## Routing

1. `PLANNER`: consolidar visão, personalidade, self knowledge, arquitetura de voz, segurança/dependências, estrutura documental e novo roadmap; persistir decisão em seus arquivos de ownership.
2. `COORDINATOR`: reconciliar e publicar o novo estado operacional depois da decisão do PLANNER.
3. `UI/UX`: especificar voz, estados, Core Orb, apps e privacidade visual somente quando a fase correspondente for definida.
4. `DEVELOPMENT`: não iniciar até existir fase planejada, aprovada e explicitamente autorizada.
