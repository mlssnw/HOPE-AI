# Phase 6 — Target UI Convergence

## Phase Status

- Planning status: `APPROVED`
- Feature status: `APPROVED_WITH_WARNINGS`
- Implementation status: `APPROVED_WITH_WARNINGS` — reviews independentes concluídos no Functional Commit exato
- Implementation authorization: `0bcc25a5437cab8a326e64281579ead56274d8cb` — concedida pela usuária em 2026-09-11, sem expansão de escopo
- Pre-implementation UI/UX: `APPROVED` — Definition of Ready `SATISFIED` em `3c10be208e4e4d6dcfc3329dd6207961c898d44c`
- Functional Commit: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
- Functional baseline: `88e194778b4399a6713f118470f9d861c553cd9e`
- Architecture decision: `ARCH-2026-09-10-003`
- Consolidation decision: `ARCH-2026-09-19-001`
- Production Readiness: `BLOCKED`

## Goal

Convergir a interface operacional existente para o HOPE Main Dashboard aprovado, preservando funções reais, segurança funcional, acessibilidade e desempenho, sem implementar capacidades futuras.

## Problem Statement

O Target UI `UIUX-VIS-2026-09-10-001` define a direção visual oficial, mas o frontend atual ainda usa composição em cards, densidade visual reduzida, responsividade por empilhamento e uma linguagem parcialmente divergente. A fase precisa fechar essa lacuna sem transformar o mockup em promessa funcional, sem esconder consentimento/esquecimento seguro e sem iniciar tools, agents ou plataforma de contas.

## Current State

- Fase 5 está `APPROVED_WITH_WARNINGS` no baseline `88e1947`.
- Chat, Memory Globe, Core Orb, inspector, realtime, consentimento e confirmação destrutiva existem.
- Target UI e sua implementação P0/P1 estão `APPROVED` por UI/UX no Functional Commit `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`.
- `UIUX-GAP-001` a `UIUX-GAP-022` descrevem gaps e constraints; elementos planejados não podem ser ativados sem backend real.
- `UIUX-F5-W01`, `UIUX-F5-W02` e `UIUX-F5-W03` foram encerrados por UI/UX; `QA-003` foi encerrado por QA.
- `QA-ENV-002`, `QA-WARN-HTTPX` e `SEC-018` permanecem abertos e não bloqueantes para a feature.
- A identidade UUID controlada pelo cliente permanece limitação conhecida; sua correção pertence à Phase 7.

## Scope

- Marca `HOPE` como nome próprio, sem expansão ou pontos intermediários.
- Shell imersivo, hierarquia e proporção do dashboard aprovado.
- Memory Globe e Core Orb refinados com estados derivados de eventos reais.
- Chat, composer, inspector, fontes, consentimento, histórico local, cancelamento e esquecimento integrados ao novo layout.
- Responsividade real: chat-first no mobile, globo dedicado e inspector adaptável.
- Navegação por teclado, foco, contraste, reduced motion e alternativa textual/fallback do canvas.
- Estados loading, empty, degraded, unavailable e error com recuperação clara.
- Correção de `UIUX-F5-W01` a `UIUX-F5-W03`.
- Métricas, labels e contagens somente quando possuírem fonte real no baseline.

## Non-goals

- Reconhecimento/autenticação do owner ou PermissionManager.
- Cadastro, múltiplos usuários, RBAC, tenants, organizações, SSO ou RLS.
- Tools, coding, agents, skills, automações, Visão ou Arquivos funcionais.
- Novos providers, secrets, credenciais, custos ou integrações.
- Alteração de API, schema, query, migration, PostgreSQL real ou persistência.
- Production Hardening, deploy público ou acesso remoto.
- Fabricar métricas, dados, nós, relações, estados, rotas ou capacidades para imitar o mockup.
- Aceitar riscos HIGH/CRITICAL ou iniciar a Phase 7.

## Dependencies

- Fase 5 consolidada em `ARCH-2026-09-10-002`.
- Decisão `ARCH-2026-09-10-003` aprovada pela usuária.
- Target UI `UIUX-VIS-2026-09-10-001` e asset canônico.
- `docs/design/README.md`, `official-dashboard.md`, `dashboard-gap-matrix.md` e demais contratos visuais aplicáveis.
- Functional baseline histórico `88e194778b4399a6713f118470f9d861c553cd9e` e Functional Commit da fase `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`.
- Working tree preexistente separado do eventual commit funcional.

## Architecture

```text
Existing FastAPI/API contracts — unchanged
                │
                ▼
Existing frontend state/data adapters
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
   App Shell  Globe    Conversation
        │       │        │
        └───────┼────────┘
                ▼
  Responsive + Accessible Presentation
```

A implementação autorizada deve ser incremental. A camada visual consome os estados e dados existentes; não inventa contratos. Limitação técnica retorna ao Planner/UI/UX antes de qualquer expansão funcional.

## Experience Contracts

- Consentimento de memória permanece visível, separado do histórico local e desativado por padrão.
- Badge de disponibilidade do serviço não pode parecer consentimento ativo.
- Confirmação destrutiva mantém alvo, consequência, foco inicial em Cancelar, Escape e recuperação de foco/erro.
- Status normal usa anúncio `polite`; `assertive` fica reservado a falha urgente.
- Alvos de toque têm pelo menos 44 × 44 px; desktop admite 36 × 36 px com foco claro.
- Mobile inicia em chat; o globo completo abre em superfície dedicada.
- Core Orb e nós nunca representam consciência, métricas ou dados inexistentes.
- Itens futuros de navegação são omitidos; não existem botões inertes que sugiram capacidade disponível.

## Data and Database Impact

- Impacto esperado: nenhum.
- Nenhuma migration, tabela, coluna, índice, query ou backfill pertence ao escopo.
- `user_id` e a identidade transitória permanecem inalterados nesta fase.
- Se a implementação exigir persistência nova, Development deve parar e devolver a decisão ao Planner; `DATABASE` será reclassificado para `YES` e um novo escopo será submetido à aprovação.

## Security Boundaries

- Produção e acesso remoto continuam proibidos.
- A fase não corrige nem reclassifica os findings de Security.
- Controles de consentimento e ação destrutiva não podem ser removidos, ocultados ou enfraquecidos pelo visual.
- Conteúdo não confiável continua renderizado defensivamente.
- Nenhum segredo, token ou identificador sensível é introduzido em DOM, URL, log ou asset.
- Claims visuais são limitados ao que o baseline realmente executa.

## Required Reviews

| Work | Required | Justification |
|---|---|---|
| QA | YES | mudança ampla de frontend exige regressão, browser, responsividade, WebGL, teclado, console e Network |
| DATABASE | NO | o escopo aprovado não altera persistência; qualquer delta de dados invalida esta classificação e volta ao Planner |
| SECURITY | YES | consentimento, confirmação destrutiva, conteúdo não confiável e claims de capacidade precisam de não regressão |
| UI/UX | YES | UI/UX especifica antes e revisa fidelidade depois contra o mesmo Functional Commit |

## Consolidated Review Matrix

| Work | Result | Commit/record |
|---|---|---|
| Development | READY_FOR_REVIEW | Functional Commit `0912e9492370f6bce8c51762d1a8a87b5bd16aa8` |
| QA | APPROVED_WITH_WARNINGS | review `5d5c2ddd18cfe12011bdd5f51503fbbfcc66904d` sobre `0912e9492370f6bce8c51762d1a8a87b5bd16aa8` |
| Database | N/A | nenhum delta de backend, API, schema, migration ou persistência |
| Security | APPROVED_WITH_WARNINGS | review `f9c0ca8289f62596946d21441ba239dcd7777fd3` sobre `0912e9492370f6bce8c51762d1a8a87b5bd16aa8` |
| UI/UX | APPROVED | review `7122d256c68e0018d74ae2e64600167e2db73fb4` sobre `0912e9492370f6bce8c51762d1a8a87b5bd16aa8` |

Nenhum blocker funcional permanece aberto. Production Readiness continua `BLOCKED` por gates históricos que não foram aceitos, encerrados ou reclassificados nesta consolidação.

## Acceptance Criteria

- [x] A usuária aprova explicitamente o plano antes do DEV.
- [x] Development produziu o Functional Commit `0912e9492370f6bce8c51762d1a8a87b5bd16aa8` sem incorporar assets/preexisting work fora do escopo.
- [x] Marca visível e acessível é `HOPE`, sem expansão.
- [x] Dashboard reproduz hierarquia, paleta, composição e densidade controlada do Target UI dentro das capabilities reais.
- [x] Nenhuma tool, agent, automação, Visão, Arquivos, métrica ou rota futura aparece como funcional.
- [x] Nós, relações, métricas e estados exibidos vêm de dados/eventos reais.
- [x] Consentimento de memória e histórico local continuam separados, compreensíveis e operáveis.
- [x] Esquecimento mantém confirmação com alvo/consequência, Cancelar inicial, Escape e retorno de foco.
- [x] `UIUX-F5-W01`, `UIUX-F5-W02` e `UIUX-F5-W03` receberam correção e foram encerrados por UI/UX.
- [x] Matriz de viewports foi validada e mobile permanece chat-first.
- [x] Zoom por equivalência de reflow, textos 30% maiores, landscape e `prefers-reduced-motion` foram validados; limites manuais permanecem em `QA-ENV-002`.
- [x] Validações automatizadas de acessibilidade e fallback textual/WebGL foram aprovadas; leitor de tela e dispositivos físicos permanecem limites ambientais rastreados.
- [x] Perfis LOW/MEDIUM/HIGH/ULTRA preservam informação e controles; qualidade altera apenas fidelidade.
- [x] Chat, API, cancelamento, realtime, memória e confirmação destrutiva não sofreram regressão nos reviews concluídos.
- [x] Nenhuma alteração de schema, migration, banco real, provider, secret, credencial ou infraestrutura entrou no Functional Commit.
- [x] QA, Security e UI/UX concluíram review no mesmo hash; Database permaneceu `N/A` sem impacto de dados.
- [x] Production Readiness permanece `BLOCKED`.

## Test Strategy

- Suítes Python e frontend completas para regressão, sem providers pagos ou banco real.
- Testes unitários dos estados/componentes extraídos durante a refatoração visual.
- Browser E2E para chat, consentimento, memória habilitada/desabilitada, cancelamento, TTS disponível/indisponível e esquecimento.
- Comparação visual controlada nos viewports da matriz, incluindo screenshots e inspeção UI/UX.
- Teclado completo, foco, leitor de tela em fluxos críticos, contraste, zoom e reduced motion.
- Console e Network sem erros inesperados; CSP e renderização de conteúdo não confiável preservadas.
- Medição de FPS e degradação por perfil antes de aceitar maior densidade do Globe/Core Orb.

## Rollout and Rollback

- Rollout somente local/controlado.
- Entregar em pequenos commits funcionais dentro de uma única fase autorizada, culminando em um Functional Commit revisável.
- Não publicar parcialmente como dashboard concluído antes do review UI/UX.
- Manter APIs e persistência compatíveis para permitir rollback do frontend ao baseline.
- Se consentimento, exclusão, acessibilidade ou desempenho regredirem, rollback visual é preferível a workaround funcional improvisado.

## Risks

- Scope creep para capacidades mostradas no mockup, mas não existentes.
- Regressão de consentimento, confirmação ou renderização segura.
- Custo de WebGL e excesso de motion em hardware limitado.
- Layout visualmente fiel, porém inacessível ou inadequado em mobile.
- Navegação decorativa parecer funcional.
- Mistura indevida com owner authentication, permissions ou Production Hardening.

## Deferred Work

- Phase 7 — Single-User Security & Permissions.
- Phase 8 — Read-Only Tool Registry.
- Phase 9 — Permissioned Effects & Ephemeral Coding.
- Phase 10 — Ephemeral Agent Runtime.
- Qualquer provider, migration, banco real, acesso remoto ou produção.
- Métricas e destinos que dependam de novas capacidades.

## Implementation Sequence

Esta sequência é planejamento; não autoriza execução.

1. UI/UX confirma a spec pré-implementação e mapeia cada gap P0/P1 aceito ao baseline real.
2. Development, somente após autorização, reorganiza foundations/shell sem alterar contratos funcionais.
3. Integra Globe/Core Orb, chat e inspector preservando estados e dados existentes.
4. Implementa responsividade, fallback textual e acessibilidade.
5. Corrige `UIUX-F5-W01` a `UIUX-F5-W03`.
6. Executa regressão automatizada, browser, performance e matriz de viewports.
7. Cria um Functional Commit exclusivo e para.
8. QA, Security e UI/UX revisam o mesmo hash; Database participa apenas se o impacto for reclassificado.
9. Planner consolida sem iniciar Phase 7 automaticamente.

## User Approval Requirements

- Aprovação explícita deste plano antes de qualquer implementação.
- Nova aprovação para expansão funcional, alteração de persistência ou navegação futura.
- Nenhuma autorização de custo, provider, credencial, banco, produção ou risco HIGH/CRITICAL é inferida.

## Next Action

- Role: COORDINATOR
- Status: WAITING_FOR_APPROVAL
- Task: normalizar o painel público com a consolidação `ARCH-2026-09-19-001` e solicitar à usuária a escolha explícita do próximo escopo.
- Do not route to: Development, Phase 7, Database, providers, produção, merge, push, tools ou agents sem nova autorização.
- Functional target: Phase 6 consolidada em `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`; nenhuma próxima fase foi iniciada.

## Development Implementation — 2026-09-15

Este registro descreve a implementação entregue por Development. Não modifica o planejamento, a matriz de reviews ou o gate de produção acima, nem concede aprovação final de fidelidade visual.

### Implemented

- Shell contínuo com proporção 62/38 no desktop e 58/42 no notebook; marca e nome acessível HOPE; tablet/mobile iniciam na conversa e alternam superfícies sem descartar o DOM, rascunho ou seleção.
- Globe com núcleo em camadas, filamentos, microarcos e partículas não semânticas limitadas; anéis apenas para categorias presentes, nós/relações exclusivamente do payload. Composição premultiplicada corrige atenuação indevida de transparência.
- Perfis LOW/MEDIUM/HIGH/ULTRA com limites de LOD/DPR e seleção prioritária; LOW sem autorrotação. Movimento reduzido prevalece, elimina ciclos/trilhas e preserva foco sem zoom automático.
- Separação do controller DOM e renderer WebGL; lista acessível, busca com contexto visual preservado, inspector com campos reais e relações atualizadas por eventos. Fallback inicial e após perda de contexto mantém os dados e permite recuperar o renderer com estado/seleção.
- Eventos incrementais preservados: criação com transição a partir do núcleo e interação imediata, atualização do nó, exclusão com dissolução e retração das relações removidas. Não há GET do grafo por evento; reconciliação fica na conexão/recuperação ou fallback periódico.
- Estado operacional local coordena chat, reconhecimento e áudio com realtime. Cancelamento não deixa o globo preso em processamento; uma síntese antiga cancelada não interrompe a resposta nova.
- Chat preserva Enter/Shift+Enter, opt-in de memória separado do histórico, cancelamento e renderização defensiva. Fontes/memórias usadas ficam ligadas à resposta. Confirmação destrutiva preserva UUID, consequência, Cancelar inicial, bloqueio em submitting, erro recuperável e retorno de foco.
- `UIUX-F5-W01`: disponibilidade explícita como “Serviço de memória disponível/indisponível”, sem indicar consentimento. `W02`: status rotineiro polite e falhas urgentes em alert. `W03`: alvos 44 px em toque, controles de pelo menos 12 px, metadados de pelo menos 11 px, contraste/foco medidos.
- Capacidades futuras, rail sem destino, perfil, métricas inventadas e timestamps não fornecidos foram omitidos. Nenhum backend, API ou persistência foi alterado.

### Files Changed

- `frontend/index.html`, `frontend/styles/main.css`.
- `frontend/js/app.js`, `chat.js`, `ui.js`, `voice.js`, `memory-globe.js`.
- Novos `frontend/js/memory-globe-controller.js`, `presentation-state.js`, `surface.js`.
- Testes do renderer/estado em `tests/frontend/`; runner e cinco verificadores em `tests/browser/`; comando `test:browser` em `package.json`.
- Evidências de Development em [`evidence/phase-6/README.md`](evidence/phase-6/README.md), sem alteração dos arquivos de ownership de reviewers/design.

### Validation and Limits

- Regressão Python: `python -m pytest -q -p no:cacheprovider`, **45 passed**; um warning preexistente de depreciação Starlette/TestClient.
- Regressão frontend: `node --test tests/frontend/*.test.mjs`, **36 passed**. Casos novos cobrem LOD/seleção, câmera, reduced motion, composição WebGL, busca sem remover contexto, criação interativa, listening real e cancelamento com eventos atrasados.
- Sintaxe: `python -m compileall -q backend tests` e `node --check` nos módulos frontend e testes.
- Navegador: `node tests/browser/run.mjs` executa harness descartável, matriz de sete viewports, chat/consentimento/histórico, confirmação completa e 428, foco/Escape, estados negativos, fallback sem WebGL, contexto perdido/recuperado, seis eventos realtime, heartbeat e sincronização HTTP de 30 s. Resultados e capturas no pacote de evidências.
- Contraste calculado: texto principal 13,56:1, secundário 6,54:1, texto do primário 10,54:1, texto de perigo 7,74:1; foco 13,99:1 e contorno de controle 4,30:1 nas superfícies medidas.
- Performance medida em Chrome/Windows, Ryzen 7 Pro 7735U e Radeon/ANGLE, viewport 1440×900, cena sintética de 3.000 nós e 2.999 relações. FPS/p95 e limites efetivamente desenhados constam em `runtime-results.json`; não representa carga de produção ou dispositivo móvel.
- Zoom 200% validado por reflow equivalente (720×450 CSS, DPR 2), texto 130% e landscape 844×390. Em baixa altura há rolagem vertical para alcançar controles. Menu nativo de zoom, leitor de tela manual, teclado virtual físico e dispositivos reais não foram automatizados; a árvore acessível foi inspecionada.
- Voz usa callbacks controlados e PCM local; não mede qualidade de provider. HTTP 428/500/503 nos cenários negativos são deliberados, não erros inesperados de assets/JavaScript.
- Nenhum PostgreSQL real, migration, provider pago, credencial, infraestrutura, push ou deploy foi usado. Alterações preexistentes em `AGENTS.md`, `Hope dashboard` e `hope-linkedin-hero*` permanecem excluídas da entrega.

### Handoff Boundary

- Functional Commit: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8` — `feat(ui): converge phase 6 target dashboard with accessible memory globe`.
- Required Reviews preservados: QA YES; SECURITY YES; UI/UX YES; DATABASE NO.
- Development não encerra findings de reviewers, não aprova a fase e não inicia os reviews finais. Entrega `READY_FOR_REVIEW` ao COORDINATOR no hash acima; este registro de hash é documental e não muda a identidade funcional.
- Phase 7 e Production Readiness permanecem fora do escopo; produção continua `BLOCKED`.
