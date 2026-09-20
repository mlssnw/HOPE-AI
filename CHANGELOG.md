# Changelog

Histórico verificável da evolução do HOPE AI. Commits documentais posteriores não substituem o Functional Commit de cada entrega.

## Product Direction Intake — decisão de 2026-09-19, registrada em 2026-09-20

- A owner registrou nova direção futura para voice presence, realtime voice, wake word `HOPE`, speaker verification, Core Orb reativo à amplitude local, self knowledge, personalidade ampliada, modos combináveis, memória controlável, organização pessoal, integrações, diagnósticos, auditoria, localização por dispositivo, apps instaláveis e Model Router.
- O registro oficial de coordenação está em [`docs/coordination/product-direction-2026-09-19.md`](docs/coordination/product-direction-2026-09-19.md).
- A direção é visão de produto e entrada de planejamento; nenhuma capacidade foi declarada implementada e nenhuma próxima fase foi autorizada.
- Personalidade, uso excepcional de referências/bordões, dependências de segurança, numeração de fases e novo roadmap aguardam reconciliação do Planner.
- Phase 6 permanece congelada no Functional Commit `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`, sem scope creep.

## Phase 6 — Target UI Convergence

- **Data da decisão:** 2026-09-10
- **Modelo do produto:** SINGLE_USER — assistente pessoal para um único owner
- **Escopo removido do roadmap imediato:** autenticação multiusuário, RBAC complexo, isolamento entre usuários, RLS por tenant, organizações/teams e identidade enterprise
- **Ordem proposta para validação do Planner:** Target UI → Single-User Security & Permissions → tools/coding → agents → Production Hardening
- **PermissionManager futuro:** níveis `SAFE`, `WRITE`, `SENSITIVE` e `DESTRUCTIVE`, com confirmação crescente conforme o risco
- **Resultado do Planner:** `ARCH-2026-09-10-003` e `docs/phase-6.md` aprovados como planejamento oficial
- **Decisão da usuária:** implementação da Phase 6 autorizada em 2026-09-11, respeitando integralmente scope, non-goals, acceptance criteria e Required Reviews
- **UI/UX pré-implementação:** `APPROVED` em `3c10be2`, com Definition of Ready satisfeita e mapeamento P0/P1 fechado
- **Implementação:** entregue pelo Development no Functional Commit `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`, com 45 testes Python e 36 testes frontend aprovados
- **Reviews técnicos:** QA `APPROVED_WITH_WARNINGS`, Security `APPROVED_WITH_WARNINGS` e UI/UX `APPROVED` no mesmo Functional Commit; Database `N/A`
- **Consolidação final:** `APPROVED_WITH_WARNINGS` por `ARCH-2026-09-19-001`, registrada no commit documental `5ca95f4`
- **Próximo gate:** nova visão e roadmap em reconciliação pelo Planner; nenhuma fase posterior está autorizada
- **Limite:** expansão funcional, banco, migrations, providers, produção, tools, agents e Phase 7 permanecem não autorizados
- **Correção editorial:** concluída em `bd244bb`; `docs/phase-6.md` não existia antes de `ARCH-2026-09-10-003` e foi criado pelo registro dessa decisão

## Fase 5 — Memory-aware chat e personalidade HOPE

- **Período:** 2026-09-02 a 2026-09-10
- **Versão:** `6.0.0-phase.5`
- **Functional Commit atual:** `88e194778b4399a6713f118470f9d861c553cd9e`
- **Status:** `APPROVED_WITH_WARNINGS` — Fase 5 funcionalmente concluída no commit indicado após aprovação de QA, Database, Security, UI/UX e consolidação do Planner. Produção pública continua bloqueada.

### Resumo

- O chat passou a consultar memórias relevantes, com metadados explicáveis sobre memórias, entidades, relações e ferramentas utilizadas.
- O `HopeOrchestrator` passou a coordenar contexto, personalidade, estados da IA, providers opcionais e persistência.
- Conteúdo de memória, web e Obsidian é delimitado como dado não confiável para reduzir prompt injection e memory poisoning.
- Decisões, fatos e outros candidatos relevantes podem ser classificados e consolidados sem multiplicar duplicatas.
- Correções atualizam classificação, embedding, entidades e relações.
- Esquecimento exige alvo inequívoco e confirmação vinculada ao UUID; ausência ou divergência retorna HTTP 428.
- Memória persistente é opt-in e permanece separada do histórico local.
- O startup desativa memória de forma fail-safe quando o schema não corresponde a `20260903_0003`, preservando o chat degradado.
- O harness E2E usa contratos tipados, estado isolado e cobre recuperação e exclusão completas.
- O Target UI do dashboard foi aprovado e versionado como direção visual; sua implementação ainda é parcial.

### Marcos funcionais

- `becb27df8848d9ed738c85d068760bb7d0848bc9` — integração inicial do chat consciente de memória e personalidade.
- `adfc728aaaf96c679dd9d1df38c56edda8bc95de` — hardening de schema, migration e runtime.
- `19e573893aba09da990256da05e7dab5af165ce1` — consentimento de memória e confirmação destrutiva.
- `88e194778b4399a6713f118470f9d861c553cd9e` — correções do harness E2E e gate de compatibilidade do schema.

[Detalhes técnicos](docs/phase-5.md)

## Fase 4 — Memória em tempo real

- **Data:** 2026-09-02
- **Functional Commit:** `fe671cfbceade85d397f5d77fc41a2e3f0d82979`
- **Status histórico:** implementada; garantias preservadas pelas fases posteriores.

### Resumo

- Event Bus interno desacoplado do transporte e isolado por usuário.
- WebSocket `/ws/hope` com ping/pong, detecção de desconexão e reconexão automática.
- Eventos incrementais de criação, atualização e exclusão de memórias e relações.
- Estados da IA publicados para o Core Orb.
- Memory Globe atualizado sem recarregar a cena inteira.
- Sincronização HTTP mantida como carga inicial, fallback e reconciliação.

[Detalhes técnicos](docs/phase-4.md)

## Fase 3 — Memory Globe

- **Data:** 2026-09-02
- **Functional Commit:** `4d0cfe22ba72f6ce275026d0ce1530b0f5dba547`
- **Status histórico:** implementada; evolução visual posterior permanece parcial.

### Resumo

- Memory Globe WebGL alimentado exclusivamente pelo grafo de memória real.
- Core Orb, seis órbitas conceituais, nós, entidades e relações.
- Navegação Orbital, Clusters e Memória, com rotação, pan, zoom e foco.
- Hover, seleção, inspector, memórias relacionadas e atalho para perguntar sobre uma memória.
- Busca integrada à recuperação e estados para memória vazia, banco desconectado e WebGL indisponível.
- Perfis Low, Medium, High e Ultra e suporte a `prefers-reduced-motion`.

[Detalhes técnicos](docs/phase-3.md)

## Fase 2 — Memória inteligente

- **Data:** 2026-09-02
- **Checkpoint funcional:** `37d347bc503b4f117e7d3dd991ce9ccd8f890dce`
- **Status histórico:** implementada no checkpoint conjunto das Fases 1 e 2.

### Resumo

- Classificador para preferências, metas, tarefas, decisões, episódios e conhecimento.
- Diferenciação entre fatos, eventos e inferências com confiança limitada.
- Recuperação híbrida por similaridade, texto e importância.
- Consolidação com proveniência, reforço e contagem de menções.
- Extração de entidades e relações semânticas.
- Explicação das fontes, eventos, entidades e relações de cada memória.

[Detalhes técnicos](docs/phase-2.md)

## Fase 1 — Fundação cloud-first e memória persistente

- **Data:** 2026-09-02
- **Checkpoint funcional:** `37d347bc503b4f117e7d3dd991ce9ccd8f890dce`
- **Status histórico:** implementada no checkpoint conjunto das Fases 1 e 2.

### Resumo

- PostgreSQL com pgvector, SQLAlchemy assíncrono e migrations Alembic.
- Schema inicial para usuários, memórias, relações, entidades, conversas, mensagens e eventos.
- `MemoryRepository` isolado por usuário e `MemoryManager` com classificação, importância e consolidação.
- CRUD de memórias, busca vetorial e endpoint de grafo.
- `EmbeddingProvider` independente de fornecedor, com implementação local para desenvolvimento.
- Compatibilidade degradada: chat, voz, Obsidian e frontend continuam disponíveis sem banco configurado.

[Detalhes técnicos](docs/phase-1.md)

## Base anterior — versão 5

- **Data:** 2026-05-06
- **Commit de implementação inicial:** `9b91061f08d470e09a97942d8c9fca64c12b46a9`
- **Status histórico:** substituída pela arquitetura por fases, com funcionalidades compatíveis preservadas quando aplicável.

### Resumo preservado

- Integrações passaram a usar o backend FastAPI para evitar chaves no navegador.
- Conteúdo de usuário, IA, web e Obsidian passou a ser renderizado defensivamente.
- CSP restrita e ausência de scripts, fontes ou estilos externos.
- Histórico local opcional e removível.
- Busca textual no Obsidian com fontes e limites.
- Busca web, Obsidian, voz e memória com ativações separadas.
- Ditado pela Web Speech API quando suportado pelo navegador.
- A aplicação modular em `frontend/` substituiu o antigo arquivo monolítico, que não deve ser reutilizado.
