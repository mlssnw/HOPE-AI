# Arquitetura do HOPE AI

Este documento registra o estado arquitetural observado no working tree em 3 de setembro de 2026. Ele complementa o histórico de `docs/phase-1.md` a `docs/phase-5.md` e separa explicitamente implementação atual de visão futura.

Legenda:

- **IMPLEMENTED:** existe no código atual e possui fluxo operacional identificável.
- **PARTIAL:** existe, mas ainda tem limitações importantes ou não cobre todo o fluxo pretendido.
- **PLANNED:** faz parte da visão, porém não foi implementado no repositório.

## CURRENT STATE

### Visão geral

```text
Browser (HTML/CSS/JavaScript)
  ├─ Chat + histórico opcional no localStorage
  ├─ ditado via Web Speech API
  ├─ áudio TTS recebido do backend
  ├─ Memory Globe WebGL
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

### Frontend — IMPLEMENTED

O frontend é uma aplicação web modular sem framework, em `frontend/`, composta por HTML, CSS e módulos JavaScript nativos.

- `app.js` inicializa chat e Memory Globe.
- `chat.js` coordena envio, cancelamento, fontes, preferências, TTS e eventos de UI.
- `api-client.js` centraliza HTTP e envia o identificador transitório do usuário.
- `storage.js` mantém preferências, UUID local e, quando habilitado, até 40 mensagens no `localStorage`.
- `renderer.js`/`renderer-core.js` renderizam conteúdo sem depender de `innerHTML` para conteúdo não confiável.
- `voice.js` usa Web Speech API do navegador para ditado em `pt-BR`.
- `realtime.js` implementa WebSocket, ping/pong, timeout e reconexão exponencial limitada.

Limitações atuais:

- **PARTIAL:** o histórico de conversa fica no navegador; as tabelas de conversas e mensagens ainda não formam o histórico ativo do chat.
- **PARTIAL:** STT depende da Web Speech API e do suporte/permissão do navegador.
- **PLANNED:** PWA/aplicativo desktop e armazenamento local criptografado.
- **PLANNED:** streaming de tokens.

### Memory Globe — IMPLEMENTED

O Memory Globe usa WebGL próprio e layout determinístico. O Core Orb representa a HOPE; memórias são distribuídas em anéis conceituais; entidades e relações vêm do grafo real retornado pela API.

O fluxo atual inclui:

- carga inicial e sincronização por `GET /api/memories/graph`;
- normalização defensiva de nós, entidades, relações e vínculos;
- modos Orbital, Clusters e Memória;
- rotação, pan, zoom, foco, hover, seleção e inspetor;
- perfis visuais Low, Medium, High e Ultra;
- suporte a movimento reduzido;
- aplicação incremental de criação, atualização e remoção de memórias e relações;
- foco seletivo por evento de UI `FOCUS_MEMORIES`;
- estados do Core Orb derivados de `AI_STATE_CHANGED`.

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
- `MemoryRepository`: persistência e consultas isoladas por usuário;
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

A migration de hardening adiciona FKs compostas com `user_id`, checks de domínio e unicidade normalizada de entidades. Isso impede relações cruzadas entre usuários no banco e torna o upsert PostgreSQL de entidades atômico. O runtime aceita uma role restrita em `DATABASE_URL`; Alembic pode usar `DATABASE_ADMIN_URL` separadamente. O pool é configurável e usa padrões conservadores de 3 conexões mais 1 overflow por worker, timeout de 30 segundos e recycle de 900 segundos. Parâmetros SQL permanecem ocultos nos logs.

Na inicialização, o runtime consulta `alembic_version` sem executar migrations e só ativa o subsistema de memória quando a revisão corresponde exatamente a `20260903_0003`. Um schema ausente, inacessível ou ainda em `0002` desativa memória, `MemoryService` e o contexto persistente antes de qualquer captura/upsert; a API de memória responde `503` com diagnóstico operacional e o chat básico continua em modo degradado. Schemas descartáveis criados por `create_schema_for_tests` usam explicitamente o metadata atual e permanecem compatíveis com esse gate.

Limitações atuais:

- **PARTIAL:** o banco é necessário para memória persistente, mas não para o chat básico.
- **PARTIAL:** conversas e mensagens estão modeladas, porém não integradas ao fluxo ativo do chat.
- **PARTIAL:** as FKs compostas protegem integridade de escrita, mas RLS depende de autenticação real e permanece adiado para a exposição pública.
- **PARTIAL:** a separação de roles está suportada pelo código; sua criação e ativação no PostgreSQL gerenciado são ações operacionais ainda não executadas.
- **PLANNED:** armazenamento externo formal para binários e grandes arquivos.

### Migrations — IMPLEMENTED

Alembic é a fonte de evolução do schema:

- `20260902_0001_memory_foundation.py`: extensão vector, usuários, memórias, relações, entidades, conversas, mensagens e eventos; cria índice HNSW.
- `20260902_0002_memory_intelligence.py`: natureza, título, resumo, categoria, tags, peso emocional, reforço, proveniência e vínculos de entidades.
- `20260903_0003_database_hardening.py`: unicidade de entidades, checks de domínio e FKs compostas para isolamento estrutural por usuário.

A aplicação não cria schema automaticamente em produção. `create_schema_for_tests` existe explicitamente para testes. A inicialização valida o head exigido em modo somente leitura e falha de forma segura para memória sem tentar corrigir um schema defasado. A migration inicial exige pgvector habilitado ou permissão para `CREATE EXTENSION`. A role de runtime e a role de migration têm configuração separada; o procedimento operacional está em `docs/database-security.md`.

### Realtime — IMPLEMENTED localmente

O Event Bus é assíncrono, em memória e isolado pelo UUID informado. O endpoint `/ws/hope` mantém uma assinatura por usuário, emite `CONNECTED`, `PING`/`PONG` e encaminha:

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

### Autenticação e segurança — PARTIAL

Defesas implementadas:

- secrets carregados de ambiente e mantidos no backend;
- `.env` ignorado pelo Git e `.env.example` permitido;
- CSP restrita, `nosniff`, política de referência, permissões e proteção contra framing;
- renderização defensiva e bloqueio de URLs perigosas no frontend;
- timeouts, limites, validação de resposta e mensagens públicas para integrações;
- contexto externo e memória tratados como dados não confiáveis;
- consultas de memória filtradas por UUID de usuário.
- opt-in explícito no chat, com recuperação e captura bloqueadas no servidor quando desativado;
- confirmação destrutiva vinculada ao UUID exato antes de excluir memória pela API.

Lacunas críticas antes de exposição pública:

- **PLANNED:** autenticação real;
- **PLANNED:** autorização baseada em identidade verificada;
- **PARTIAL:** `X-Hope-User-Id` e `user_id` no WebSocket são valores controlados pelo cliente e servem apenas como identidade transitória de desenvolvimento;
- **PLANNED:** rate limiting de produção, trilha de auditoria operacional abrangente e gestão cloud de secrets;
- **PLANNED:** proteção distribuída do WebSocket e das ferramentas futuras.

### Implantação e operação cloud — PLANNED

O repositório executa FastAPI/Uvicorn localmente e já separa frontend, backend, banco e integrações. Não há, no estado observado, configuração de container, infraestrutura como código, pipeline de deploy ou topologia cloud de produção.

A descrição “cloud-ready” representa direção arquitetural, não implantação cloud concluída.

### Testes — IMPLEMENTED

- Python: `pytest` cobre API, banco, memória, serviços, realtime e Orchestrator.
- JavaScript: o runner nativo do Node cobre storage, renderer, realtime, Memory Globe e eventos de UI.
- Integrações pagas são simuladas nos testes automatizados.
- `scripts/preflight_database.py` pode validar PostgreSQL/pgvector real e exercitar CRUD temporário.

Validação visual de browser e banco PostgreSQL real continuam tarefas ambientais e não são implicitamente comprovadas pela suíte unitária.

## TARGET ARCHITECTURE

Os itens desta seção são direção futura e não devem ser interpretados como autorização para iniciar uma nova fase.

A especificação detalhada de plataforma, personalidade, Learning, Experience Memory, Agents, Skills, Tools, Permissions, Coding, Model Router, imagens, multimodalidade, avaliação, observabilidade, custos, limites de autonomia e roadmap está em [`docs/future-architecture.md`](future-architecture.md). O princípio estrutural é adicionar capacidades em camadas pequenas e reversíveis: identidade e consentimento precedem execução; permissões precedem agentes; experiências precedem aprendizado avançado.

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

1. Autenticação e autorização reais em HTTP e WebSocket.
2. Deploy reproduzível e gestão de secrets.
3. PostgreSQL/pgvector gerenciado com backup, restore e migrations validadas.
4. Broker/realtime compatível com múltiplas réplicas.
5. Rate limiting, observabilidade e auditoria sem vazamento de dados.
6. Revisão de privacidade, retenção, exclusão e ações destrutivas.
7. Testes end-to-end e validação de carga do Memory Globe e da recuperação.
