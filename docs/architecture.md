# Arquitetura do HOPE AI

This document records the implemented architecture integrated into `main` through `ce2bde4a0792fa6a8c0a79e56781add162bff2d2` on 2026-09-25. It complements the history in `docs/phase-1.md` through [`docs/phase-6.md`](phase-6.md) and explicitly separates current implementation from future direction. Phase 6 is complete. Phase 7 is authorized but `NOT_STARTED`, has no Functional Commit and changes no implemented-state claim in this document. Production Readiness remains `BLOCKED`.

A direção de produto `SINGLE_USER` continua válida. A visão aprovada está em [`docs/product-vision.md`](product-vision.md), a ordem e os gates em [`docs/roadmap.md`](roadmap.md) e os contratos-alvo em [`docs/future-architecture.md`](future-architecture.md). Nenhum desses documentos transforma capacidade planejada em capacidade atual.

Legenda:

- **IMPLEMENTED:** existe no código atual e possui fluxo operacional identificável.
- **PARTIAL:** existe, mas ainda tem limitações importantes ou não cobre todo o fluxo pretendido.
- **PLANNED:** faz parte da visão, porém não foi implementado no repositório.

### Baseline, fase e versão

- Implemented baseline: `ce2bde4a0792fa6a8c0a79e56781add162bff2d2` on `main`, integrating Phase 6 through PR #1.
- Phase 6 — Target UI Convergence: `COMPLETE` and integrated.
- Phase 6 evidence: implementation `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`, isolated test correction `4d76f2433363a47a9d8fe29fef337de1dc79ac50`, final integration candidate `cb8dc774cc396f3aff0ef40e79753761fbf3b49b` and merge `ce2bde4a0792fa6a8c0a79e56781add162bff2d2`.
- Reviews: QA and Security concluded `APPROVED_WITH_WARNINGS` and UI/UX concluded `APPROVED` for the applicable Phase 6 artifacts. These results do not approve Phase 7.
- HOPE Main Dashboard: **IMPLEMENTED** within real capabilities; Phase 6 QA, Security and UI/UX evidence is complete and integrated.
- Runtime API version: `6.0.0-phase.5`, valor preservado no código do Functional Commit aprovado.
- Convention: runtime version identifies a code artifact and does not determine operational or documentation phase. Current status comes from the applicable phase document, exact Functional Commit, reviews and handoff.
- `6.0.0-phase.5` is a frozen legacy label. Changing it would create a new functional delta and require proportional review, so Phase 7 does not alter it before implementation.
- Phase 7: plan `APPROVED` and implementation authorization `APPROVED` by the owner on 2026-09-25 under `ARCH-2026-09-25-001`; implementation `NOT_STARTED`; Functional Commit `NONE`.
- Phase 7 boundary: the next gate is the Coordinator-routed pre-implementation UI/UX specification. Every exact `PhraseLibrary` proposal requires an individual owner decision before it can enter code, fixtures, tests, defaults or active product content.

## CURRENT STATE

### Visão geral

```text
Browser (HTML/CSS/JavaScript)
  ├─ HOPE Main Dashboard responsivo e chat-first em mobile/tablet
  ├─ Chat + histórico opcional no localStorage
  ├─ ditado via Web Speech API
  ├─ áudio TTS recebido do backend
  ├─ Memory Globe WebGL + lista/inspector acessíveis + fallback
  ├─ HTTP /api/*
  └─ WebSocket /ws/hope
          │
          ▼
FastAPI (mesma origem)
  ├─ HopeOrchestrator
  │   ├─ contexto de memória
  │   ├─ personalidade e system prompt
  │   ├─ Claude
  │   └─ captura/correção/esquecimento de memória
  ├─ integrações: Tavily, Obsidian Local REST API e ElevenLabs
  ├─ MemoryManager e APIs de memória
  └─ EventBus em memória → WebSocket
          │
          ▼
PostgreSQL + pgvector (opcional em desenvolvimento)
```

O backend serve o frontend e as APIs na mesma origem. Quando `DATABASE_URL` não está configurada ou a memória falha durante o chat, o chat continua de forma degradada e informa internamente que a memória não está disponível.

### Modelo de ownership — TARGET SINGLE_USER, ainda não implementado

A aplicação atual ainda usa um UUID criado no navegador e controlado pelo cliente. O alvo revisado não é uma plataforma de contas: existe um único owner, reconhecido por uma fronteira server-side proporcional ao ambiente. Em desenvolvimento local controlado, essa fronteira pode usar pareamento da instalação e sessão local; acesso remoto ou cloud exige credencial forte e sessão protegida antes da exposição.

The implemented baseline is `ce2bde4a0792fa6a8c0a79e56781add162bff2d2` on `main`. Phase 6 changed frontend, tests and evidence without changing backend runtime, API, schema, migrations or persistence. Phase 7 has no Functional Commit and has not changed any runtime surface.

Os campos `user_id` existentes permanecem no estado atual e serão preservados como namespace interno do owner até que uma migration específica seja justificada. Eles não provam identidade. Autenticação multiusuário, RBAC organizacional, tenants, teams, SSO empresarial, federação e RLS orientado a tenants foram removidos do roadmap imediato.

### Frontend — IMPLEMENTED

O frontend é uma aplicação web modular sem framework, em `frontend/`, composta por HTML, CSS e módulos JavaScript nativos. A Phase 6 implementou a composição oficial do HOPE Main Dashboard sobre as capacidades reais existentes, sem ativar destinos ou métricas futuras.

- `app.js` inicializa `SurfaceController`, `MemoryGlobeController` e chat.
- `chat.js` coordena envio, cancelamento, fontes, preferências, TTS e eventos de UI.
- `api-client.js` centraliza HTTP e envia o identificador transitório do usuário.
- `storage.js` mantém preferências, UUID local e, quando habilitado, até 40 mensagens no `localStorage`.
- `renderer.js`/`renderer-core.js` renderizam conteúdo sem depender de `innerHTML` para conteúdo não confiável.
- `voice.js` usa Web Speech API do navegador para ditado em `pt-BR`.
- `realtime.js` implementa WebSocket, ping/pong, timeout e reconexão exponencial limitada.
- `surface.js` controla as superfícies de conversa/memória, expansão, foco e ordem responsiva sem descartar o estado do DOM.
- `presentation-state.js` resolve o estado operacional apresentado e impede que evento realtime obsoleto reative processamento após cancelamento local.
- `memory-globe-controller.js` separa dados, interação, busca, lista acessível, inspector, fallback e sincronização do renderer WebGL.

O dashboard atual inclui shell contínuo, hierarquia Globe/conversa, controles reais, inspector, fontes por resposta, consentimentos separados, confirmação destrutiva, estados negativos e responsividade. Tablet e mobile iniciam na conversa e alternam para uma superfície de memória dedicada preservando rascunho, seleção e foco.

Limitações atuais:

- **PARTIAL:** o histórico de conversa fica no navegador; as tabelas de conversas e mensagens ainda não formam o histórico ativo do chat.
- **PARTIAL:** STT depende da Web Speech API e do suporte/permissão do navegador.
- **PARTIAL:** a versão de runtime permanece `6.0.0-phase.5`; trata-se de metadata legado do artefato aprovado, não do status da Phase 6.
- **PLANNED:** PWA/aplicativo desktop e armazenamento local criptografado.
- **PLANNED:** streaming de tokens.

### Memory Globe — IMPLEMENTED

O Memory Globe usa WebGL próprio e layout determinístico. O Core Orb representa a HOPE; memórias são distribuídas em anéis conceituais; entidades e relações vêm do grafo real retornado pela API.

O fluxo atual inclui:

- carga inicial e sincronização por `GET /api/memories/graph`;
- normalização defensiva de nós, entidades, relações e vínculos;
- separação entre `MemoryGlobeController` e renderer WebGL;
- modos Orbital, Clusters e Memória;
- rotação, pan, zoom, foco, hover, seleção e inspetor;
- busca que preserva contexto, lista textual sincronizada e inspector DOM semântico;
- perfis visuais Low, Medium, High e Ultra com limites de LOD/DPR sem perder lista, seleção ou contagem do payload;
- suporte a movimento reduzido, controles por teclado e câmera alternativa;
- fallback textual quando WebGL falha e recuperação do renderer sem perder o payload/seleção;
- aplicação incremental de criação, atualização e remoção de memórias e relações;
- foco seletivo por evento de UI `FOCUS_MEMORIES`;
- estados do Core Orb derivados de operações locais e `AI_STATE_CHANGED`, com proteção contra estado remoto obsoleto após cancelamento.

Limitações atuais:

- **PARTIAL:** a API de grafo limita a resposta a até 500 memórias e o endpoint usa 200 por padrão; a meta de milhares de nós exige medição, paginação/streaming ou outra estratégia de escala.
- **PARTIAL:** o fallback reconcilia por HTTP, mas o Event Bus não é distribuído.

### Backend e API — IMPLEMENTED

`backend/main.py` cria a aplicação FastAPI, carrega configuração, inicializa integrações, memória opcional, Event Bus, WebSocket e Orchestrator. Também serve os arquivos estáticos e aplica cabeçalhos de segurança.

Rotas principais:

- `GET /api/health`;
- `POST /api/chat`;
- `POST /api/tts`;
- CRUD, busca, recuperação, entidades, relações, explicação e grafo em `/api/memories`;
- `GET /ws/hope?user_id=<uuid>`.

A documentação OpenAPI automática está desabilitada. O backend usa modelos Pydantic para limites e normalização de entrada e converte falhas de serviços externos em mensagens públicas controladas.

### AI Orchestrator e Claude/LLM — IMPLEMENTED com acoplamento parcial

O `HopeOrchestrator` coordena o chat atual:

1. publica estado `thinking` e, quando aplicável, `searching`;
2. aplica o consentimento `memory_enabled` da requisição antes de qualquer acesso à memória;
3. interpreta comandos claros de correção ou esquecimento;
4. recupera contexto limitado de memória, entidades e relações somente quando autorizado;
5. constrói system prompt com personalidade e regras de segurança;
6. coleta Tavily/Obsidian quando solicitados;
7. chama o modelo;
8. classifica e tenta persistir conteúdo relevante do usuário somente quando autorizado;
9. publica eventos incrementais e retorna metadados de rastreabilidade;
10. retorna ao estado `idle`, ou publica `error` antes da recuperação.

`backend/services.py` contém o adapter HTTP para a API Messages da Anthropic. O modelo é configurável por `ANTHROPIC_MODEL`; o padrão do exemplo é Claude Sonnet 4.6. O contexto de memória e fontes externas é serializado como JSON e delimitado como dado não confiável.

- **IMPLEMENTED:** Claude como LLM operacional atual.
- **PARTIAL:** o Orchestrator separa coordenação de transporte externo, mas não há contrato genérico de LLM equivalente ao contrato de embeddings.
- **PLANNED:** providers alternativos de LLM e failover.
- **PLANNED:** streaming de resposta.
- **PLANNED:** fila durável para tarefas pós-resposta.

### Personalidade — IMPLEMENTED com evolução de especificação

`backend/ai/personality.py` define configuração, identidade e estados expressivos; `prompts.py` gera o system prompt em seções. A implementação atual descreve a HOPE como original, inteligente, técnica, elegante, perspicaz e assertiva, com discordância fundamentada e humor contido. Segurança, verdade e precisão têm precedência sobre estilo.

A especificação-alvo aprovada em `ARCH-2026-09-04-001` acrescenta pragmatismo, franqueza, lealdade sem controle, coragem, foco em resolução e irreverência moderada. As referências culturais do usuário são apenas fontes de traços gerais: identidade, falas, bordões, histórias, frases famosas e maneirismos específicos não podem ser copiados. Essa evolução documental não afirma que todos os novos traços já foram implementados ou validados no prompt atual.

Os estados expressivos são sinalização operacional, não alegação de consciência ou emoção humana.

### Memória — IMPLEMENTED com limitações

O domínio em `backend/memory/` está separado em componentes:

- `MemoryManager`: fachada transacional e coordenação do ciclo de vida;
- `MemoryRepository`: persistência e consultas filtradas pelo namespace `user_id`, futuramente vinculado ao único owner;
- `MemoryClassifier`: classificação determinística, importância, tipo e natureza;
- `MemoryConsolidator`: detecção e reforço de duplicatas;
- `MemoryRetriever`: combinação de similaridade, texto e importância;
- `EmbeddingProvider`/`EmbeddingService`: contrato de embeddings;
- `RelationManager`: relações semânticas entre memórias;
- `EntityExtractor` e `EntityRepository`: extração baseada em regras e vínculos;
- `MemoryService`: entrada de alto nível para captura automática.

O sistema diferencia fatos, eventos e inferências; limita inferências a confiança máxima de 0,75; registra fontes; consolida duplicatas; atualiza embedding, entidades e relações em correções; e remove relações por cascata no esquecimento. No chat, recuperação e captura são opt-in e bloqueadas no servidor quando `memory_enabled=false`. Pedidos textuais de esquecimento apenas identificam o alvo e retornam um contrato de confirmação; a exclusão ocorre pela API somente quando o cliente confirma o mesmo UUID da rota em `X-Hope-Confirm-Memory-Id`.

Limitações atuais:

- **PARTIAL:** classificação e extração de entidades são baseadas em regras e podem ignorar ou classificar incorretamente mensagens complexas.
- **PARTIAL:** `LocalHashEmbeddingProvider` é determinístico e adequado a desenvolvimento/testes, não a busca semântica de produção.
- **PARTIAL:** captura pós-resposta acontece dentro da requisição, sem fila durável.
- **PARTIAL:** o consentimento de memória é aplicado por requisição e persistido apenas como preferência local; sua vinculação a uma identidade autenticada depende da autenticação planejada.
- **PARTIAL:** exclusão é protegida por confirmação explícita vinculada ao alvo, mas soft delete, recuperação e auditoria autenticada permanecem planejados para produção.

### Database — IMPLEMENTED, opcional em desenvolvimento

PostgreSQL é o banco principal e pgvector armazena embeddings de 1536 dimensões. SQLAlchemy assíncrono usa `asyncpg`; SQLite/`aiosqlite` aparece como suporte de testes, não como banco principal de produção.

Entidades mapeadas atualmente:

- usuários;
- memórias;
- relações entre memórias;
- entidades e relações entre entidades;
- conversas e mensagens;
- eventos de memória;
- fontes de memória;
- vínculos entre memória e entidade.

Há índices por usuário, tipo, natureza e criação, além de índice HNSW com distância cosseno para embeddings no PostgreSQL. O HNSW está declarado tanto na migration quanto no metadata SQLAlchemy para impedir deriva de autogeração. As sessões fazem commit automático no sucesso e rollback em exceções.

A migration de hardening adiciona FKs compostas com `user_id`, checks de domínio e unicidade normalizada de entidades. Isso impede relações entre namespaces incompatíveis no banco e torna o upsert PostgreSQL de entidades atômico. No modelo `SINGLE_USER`, essas FKs continuam úteis como integridade e compatibilidade; não representam uma decisão de suportar múltiplos tenants. O runtime aceita uma role restrita em `DATABASE_URL`; Alembic pode usar `DATABASE_ADMIN_URL` separadamente. O pool é configurável e usa padrões conservadores de 3 conexões mais 1 overflow por worker, timeout de 30 segundos e recycle de 900 segundos. Parâmetros SQL permanecem ocultos nos logs.

Na inicialização, o runtime consulta `alembic_version` sem executar migrations e só ativa o subsistema de memória quando a revisão corresponde exatamente a `20260903_0003`. Um schema ausente, inacessível ou ainda em `0002` desativa memória, `MemoryService` e o contexto persistente antes de qualquer captura/upsert; a API de memória responde `503` com diagnóstico operacional e o chat básico continua em modo degradado. Schemas descartáveis criados por `create_schema_for_tests` usam explicitamente o metadata atual e permanecem compatíveis com esse gate.

Limitações atuais:

- **PARTIAL:** o banco é necessário para memória persistente, mas não para o chat básico.
- **PARTIAL:** conversas e mensagens estão modeladas, porém não integradas ao fluxo ativo do chat.
- **PARTIAL:** as FKs compostas protegem integridade de escrita. RLS orientado a tenants não faz parte do roadmap imediato; RLS simples pode ser reavaliado como defesa adicional somente se o perfil de acesso remoto/cloud ou integrações diretas ao banco justificar seu custo.
- **PARTIAL:** a separação de roles está suportada pelo código; sua criação e ativação no PostgreSQL gerenciado são ações operacionais ainda não executadas.
- **PLANNED:** armazenamento externo formal para binários e grandes arquivos.

### Migrations — IMPLEMENTED

Alembic é a fonte de evolução do schema:

- `20260902_0001_memory_foundation.py`: extensão vector, usuários, memórias, relações, entidades, conversas, mensagens e eventos; cria índice HNSW.
- `20260902_0002_memory_intelligence.py`: natureza, título, resumo, categoria, tags, peso emocional, reforço, proveniência e vínculos de entidades.
- `20260903_0003_database_hardening.py`: unicidade de entidades, checks de domínio e FKs compostas para isolamento estrutural por usuário.

A aplicação não cria schema automaticamente em produção. `create_schema_for_tests` existe explicitamente para testes. A inicialização valida o head exigido em modo somente leitura e falha de forma segura para memória sem tentar corrigir um schema defasado. A migration inicial exige pgvector habilitado ou permissão para `CREATE EXTENSION`. A role de runtime e a role de migration têm configuração separada; o procedimento operacional está em `docs/database-security.md`.

### Realtime — IMPLEMENTED localmente

O Event Bus é assíncrono, em memória e segmentado pelo UUID informado. O endpoint `/ws/hope` mantém uma assinatura por namespace, emite `CONNECTED`, `PING`/`PONG` e encaminha:

- `MEMORY_CREATED`;
- `MEMORY_UPDATED`;
- `MEMORY_DELETED`;
- `MEMORY_RELATION_CREATED`;
- `MEMORY_RELATION_DELETED`;
- `AI_STATE_CHANGED`.

O frontend reconecta com backoff e aplica fragmentos incrementais ao globo.

- **PARTIAL:** funciona em um único processo.
- **PLANNED:** broker compartilhado e coordenação entre réplicas cloud.

### ElevenLabs e voz — IMPLEMENTED parcialmente

- **IMPLEMENTED:** TTS no backend via ElevenLabs `eleven_multilingual_v2`, com chave mantida no servidor, validação do tipo/tamanho do áudio e estado `speaking` no realtime.
- **IMPLEMENTED:** ditado no navegador via Web Speech API.
- **PLANNED:** STT por ElevenLabs, Azure ou provider local através de adapter próprio.
- **PARTIAL:** TTS está diretamente ligado à ElevenLabs; ainda não existe contrato genérico de voz.

### Obsidian — IMPLEMENTED como integração local opcional

`HopeServices.search_obsidian` consulta o plugin Obsidian Local REST API, limita resultados e trechos, rejeita caminhos suspeitos e envia ao LLM somente contexto delimitado como não confiável. O Obsidian não é banco principal e não recebe uma réplica bidirecional completa das memórias.

- **IMPLEMENTED:** busca textual local opcional.
- **PARTIAL:** recuperação sem embeddings e dependente do Obsidian estar acessível na máquina atual.
- **PLANNED:** espelho legível/editável completo e HOPE Bridge cloud-to-local.

### Web e ferramentas — PARTIAL

Tavily fornece busca web opcional com resultados limitados e validados. Há rastreamento de `tools_used`, mas não existe Tool Registry genérico, execução arbitrária de ferramentas ou sistema de permissões por ferramenta.

- **IMPLEMENTED:** busca web Tavily.
- **PLANNED:** arquitetura completa de tools, autorizações, auditoria e integrações adicionais.
- **PLANNED:** automações.

### Reconhecimento do owner e segurança — PARTIAL

Defesas implementadas:

- secrets carregados de ambiente e mantidos no backend;
- `.env` ignorado pelo Git e `.env.example` permitido;
- CSP restrita, `nosniff`, política de referência, permissões e proteção contra framing;
- renderização defensiva e bloqueio de URLs perigosas no frontend;
- timeouts, limites, validação de resposta e mensagens públicas para integrações;
- contexto externo e memória tratados como dados não confiáveis;
- consultas de memória filtradas por UUID transitório.
- opt-in explícito no chat, com recuperação e captura bloqueadas no servidor quando desativado;
- confirmação destrutiva vinculada ao UUID exato antes de excluir memória pela API.

Lacunas críticas antes de qualquer acesso remoto ou exposição pública:

- **PLANNED:** reconhecimento server-side do único owner e sessões protegidas, sem plataforma de contas multiusuário;
- **PLANNED:** autorização por recurso e `PermissionManager` por risco para efeitos locais, externos, sensíveis e destrutivos;
- **PARTIAL:** `X-Hope-User-Id` e `user_id` no WebSocket são valores controlados pelo cliente e servem apenas como namespace transitório de desenvolvimento;
- **PLANNED:** rate limiting de produção, trilha de auditoria operacional abrangente e gestão cloud de secrets;
- **PLANNED:** proteção distribuída do WebSocket e das ferramentas futuras.

### Implantação e operação cloud — PLANNED

O repositório executa FastAPI/Uvicorn localmente e já separa frontend, backend, banco e integrações. Não há, no estado observado, configuração de container, infraestrutura como código, pipeline de deploy ou topologia cloud de produção.

A descrição “cloud-ready” representa direção arquitetural, não implantação cloud concluída.

### Testes — IMPLEMENTED

- Python: 45 testes passaram no review da Phase 6, cobrindo API, banco, memória, serviços, realtime e Orchestrator; permanece um warning não bloqueante de depreciação Starlette/TestClient.
- JavaScript: 36 testes Node passaram, cobrindo storage, renderer, realtime, Memory Globe, apresentação, cancelamento e eventos de UI.
- Browser: os cinco verificadores oficiais passaram em harness descartável sobre o Functional Commit, cobrindo sete viewports, chat-first, foco/teclado, contraste, reduced motion, perfis LOW/MEDIUM/HIGH/ULTRA, fallback/recuperação WebGL, consentimento, exclusão confirmada, voz com fixtures e realtime.
- Integrações pagas são simuladas nos testes automatizados.
- `scripts/preflight_database.py` pode validar PostgreSQL/pgvector real e exercitar CRUD temporário.

These Phase 6 results remain evidence for the integrated baseline. Real microphone/provider operation, manual screen-reader testing, physical devices and a real PostgreSQL environment remain environmental limits; Production Readiness is not inferred. Phase 7 must produce its own exact Functional Commit and required reviews after implementation.

## TARGET ARCHITECTURE

The items in this section are future direction. The only current implementation authorization is Phase 7 within the exact boundaries of [`docs/phase-7.md`](phase-7.md); nothing here authorizes Phase 8 or a later phase.

A intenção de produto está em [`docs/product-vision.md`](product-vision.md), a sequência aprovada e seus gates em [`docs/roadmap.md`](roadmap.md), e a especificação técnica futura em [`docs/future-architecture.md`](future-architecture.md). O princípio estrutural é adicionar capacidades em camadas pequenas e reversíveis: identidade e consentimento precedem execução; permissões precedem agentes; experiências precedem aprendizado avançado.

[`docs/phase-7.md`](phase-7.md) is an `APPROVED` plan with implementation explicitly authorized by the owner on 2026-09-25. Implementation remains `NOT_STARTED` and no Phase 7 Functional Commit exists. Before Development can be routed, UI/UX must persist the complete pre-implementation specification and present every exact phrase proposal separately with context, intended tone and `PENDING_OWNER_APPROVAL`. Approval of one phrase does not approve variants or other phrases, and no unapproved phrase may enter code, fixtures, tests, defaults or active product content.

O alvo assume um único owner. Reconhecer esse owner não exige cadastro público, organizações, RBAC complexo ou isolamento entre tenants. Exige apenas uma credencial adequada ao ambiente, sessão revogável, escopo explícito de recursos e decisões de risco que tools, agentes e conteúdo não confiável não possam ampliar.

### Operação cloud-first contínua — PLANNED

- Backend/orquestrador executando em infraestrutura cloud independente do PC pessoal.
- PostgreSQL/pgvector gerenciado, backups, observabilidade, migrations controladas e recuperação de desastre.
- Broker compartilhado para Event Bus/WebSocket em múltiplas réplicas.
- Gestão centralizada de secrets, autenticação forte, autorização e auditoria.

### HOPE Bridge — PLANNED

- Agente local autenticado e revogável para Obsidian, Windows, arquivos e aplicações locais.
- Canal de comunicação seguro, outbound-first quando possível, com allowlists, confirmação para ações sensíveis e logs auditáveis.
- Bridge como extensão periférica; memória, identidade e raciocínio principais permanecem na cloud.

### Multimodal e providers substituíveis — PLANNED

- Contratos para LLM, STT, TTS e embeddings com seleção explícita de provider.
- ElevenLabs, Azure e implementações locais intercambiáveis conforme capacidade, privacidade, latência e custo.
- Armazenamento de áudio, vídeo, imagens e PDFs em object storage; PostgreSQL guarda metadados e referências.

### Ferramentas e automações — PLANNED

- Tool Registry com schemas, permissões, confirmação, idempotência e auditoria.
- Execução assíncrona durável, retries e filas.
- Automações agendadas e orientadas a eventos sem acoplar o cérebro a uma máquina local.

### Memória em escala — PLANNED

- Provider de embeddings de produção e avaliação mensurável de recuperação.
- Consolidação e qualidade de entidades aprimoradas sem perder proveniência.
- Correções, esquecimento e políticas de retenção propagados por todos os índices, caches, espelhos e visualizações.
- Memory Globe capaz de explorar milhares de nós com carregamento incremental, níveis de detalhe e reconciliação eficiente.

### Critérios antes de produção pública

1. Reconhecimento forte do único owner e autorização real em HTTP e WebSocket, sem confiar no UUID do cliente.
2. Deploy reproduzível e gestão de secrets.
3. PostgreSQL/pgvector gerenciado com backup, restore e migrations validadas.
4. Broker/realtime compatível com múltiplas réplicas.
5. Rate limiting, observabilidade e auditoria sem vazamento de dados.
6. Revisão de privacidade, retenção, exclusão e ações destrutivas.
7. Testes end-to-end e validação de carga do Memory Globe e da recuperação.
8. `PermissionManager` aplicado a tools, agentes e efeitos, com confirmações vinculadas ao owner, ação e alvo.
