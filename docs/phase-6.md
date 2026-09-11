# Phase 6 — Target UI Convergence

## Phase Status

- Planning status: `APPROVED`
- Implementation status: `IN_PROGRESS`
- Implementation authorization: `0bcc25a5437cab8a326e64281579ead56274d8cb` — concedida pela usuária em 2026-09-11, sem expansão de escopo
- Pre-implementation UI/UX: `APPROVED` — Definition of Ready `SATISFIED` em `3c10be208e4e4d6dcfc3329dd6207961c898d44c`
- Functional Commit: `NONE`
- Functional baseline: `88e194778b4399a6713f118470f9d861c553cd9e`
- Architecture decision: `ARCH-2026-09-10-003`
- Production Readiness: `BLOCKED`

## Goal

Convergir a interface operacional existente para o HOPE Main Dashboard aprovado, preservando funções reais, segurança funcional, acessibilidade e desempenho, sem implementar capacidades futuras.

## Problem Statement

O Target UI `UIUX-VIS-2026-09-10-001` define a direção visual oficial, mas o frontend atual ainda usa composição em cards, densidade visual reduzida, responsividade por empilhamento e uma linguagem parcialmente divergente. A fase precisa fechar essa lacuna sem transformar o mockup em promessa funcional, sem esconder consentimento/esquecimento seguro e sem iniciar tools, agents ou plataforma de contas.

## Current State

- Fase 5 está `APPROVED_WITH_WARNINGS` no baseline `88e1947`.
- Chat, Memory Globe, Core Orb, inspector, realtime, consentimento e confirmação destrutiva existem.
- Target UI está aprovado, porém a implementação é `PARTIAL`.
- `UIUX-GAP-001` a `UIUX-GAP-022` descrevem gaps e constraints; elementos planejados não podem ser ativados sem backend real.
- `UIUX-F5-W01`, `UIUX-F5-W02` e `UIUX-F5-W03` permanecem abertos e são apropriados para tratamento visual nesta fase.
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
- Functional baseline `88e194778b4399a6713f118470f9d861c553cd9e` preservado até uma implementação autorizada produzir novo hash.
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

## Acceptance Criteria

- [x] A usuária aprova explicitamente o plano antes do DEV.
- [ ] Development produz novo Functional Commit e não mistura assets/preexisting work fora do escopo.
- [ ] Marca visível e acessível é `HOPE`, sem expansão.
- [ ] Dashboard reproduz hierarquia, paleta, composição e densidade controlada do Target UI.
- [ ] Nenhuma tool, agent, automação, Visão, Arquivos, métrica ou rota futura aparece como funcional.
- [ ] Nós, relações, métricas e estados exibidos vêm de dados/eventos reais.
- [ ] Consentimento de memória e histórico local continuam separados, compreensíveis e operáveis.
- [ ] Esquecimento mantém confirmação com alvo/consequência, Cancelar inicial, Escape e retorno de foco.
- [ ] `UIUX-F5-W01`, `UIUX-F5-W02` e `UIUX-F5-W03` recebem correção e evidência.
- [ ] Mobile 390 × 844 é chat-first; 320 × 568, 768 × 1024, 1024 × 768, 1280 × 720, 1440 × 900 e 1920 × 1080 são validados.
- [ ] Zoom 200%, textos 30% maiores, landscape e `prefers-reduced-motion` são validados.
- [ ] Fluxos essenciais atendem WCAG 2.2 AA e existe alternativa textual/fallback quando WebGL não estiver disponível.
- [ ] Perfis LOW/MEDIUM/HIGH/ULTRA preservam informação e controles; qualidade altera apenas fidelidade.
- [ ] Chat, API, cancelamento, realtime, memória e confirmação destrutiva não sofrem regressão.
- [ ] Nenhuma alteração de schema, migration, banco real, provider, secret, credencial ou infraestrutura entra no Functional Commit.
- [ ] QA, Security e UI/UX concluem review no mesmo hash; Database permanece `N/A` somente se o diff continuar sem impacto de dados.
- [ ] Production Readiness permanece `BLOCKED`.

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

- Role: DEVELOPMENT
- Status: NOT_STARTED
- Task: implementar exclusivamente a Phase 6 conforme este plano e `docs/design/phase-6-target-ui-spec.md`, produzir um novo Functional Commit e parar para os reviews obrigatórios.
- Do not route to: Phase 7, Database, providers, produção, tools ou agents.
- Functional target: partir do baseline `88e194778b4399a6713f118470f9d861c553cd9e`; a Phase 6 ainda não possui Functional Commit.
