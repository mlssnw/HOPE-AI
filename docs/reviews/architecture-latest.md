# Architecture Review — Latest

- Status: APPROVED
- Decision ID: `ARCH-2026-09-10-003`
- Date: 2026-09-10
- Product model: `SINGLE_USER`
- Functional baseline analyzed: `88e194778b4399a6713f118470f9d861c553cd9e`
- Repository HEAD analyzed: `3c8e978e2dc5d9c0deff62a8a5a9ebb1f7c4d2c6`
- Planning approval recorded by COORDINATOR: `7494c2ed589e559a955934f8a1580d3867e2356b`
- Phase 6 implementation authorization: `0bcc25a5437cab8a326e64281579ead56274d8cb` — concedida pela usuária em 2026-09-11, sem expansão de escopo
- Pre-implementation UI/UX: `APPROVED` — Definition of Ready `SATISFIED` em `3c10be208e4e4d6dcfc3329dd6207961c898d44c`
- Superseded direction: autenticação multiusuário, RBAC complexo, tenants, organizações, SSO/federação e RLS orientado a tenants no roadmap imediato
- Preserved decision: `ARCH-2026-09-10-002` e a Fase 5 `APPROVED_WITH_WARNINGS`
- Production Readiness: BLOCKED

## Problem

O roadmap anterior tratava identidade como fundação de uma plataforma multiusuário. A HOPE, porém, é uma assistente pessoal de uso individual. Manter tenants, RBAC complexo, organizações e identidade enterprise elevaria custo e manutenção sem proteger melhor o risco real: tools, agentes e integrações executando ações sobre dados e sistemas do único owner.

Também é necessário decidir se o Target UI pode ser implementado antes da fundação de permissões sem mascarar lacunas de segurança ou apresentar capacidades futuras como existentes.

## Current State

- Fase 5: `APPROVED_WITH_WARNINGS` no Functional Commit `88e194778b4399a6713f118470f9d861c553cd9e`.
- Production Readiness: `BLOCKED`.
- Commits posteriores ao baseline são exclusivamente documentais.
- Antes da decisão `ARCH-2026-09-10-003`, não existia `docs/phase-6.md`; o próprio registro documental da decisão criou esse plano. Nenhuma próxima fase foi implementada.
- O navegador cria e envia um UUID arbitrário; isso é namespace transitório, não autenticação.
- O schema preserva `user_id` em memórias, relações, entidades, conversas e eventos.
- O HOPE Main Dashboard é Target UI aprovado, mas a implementação atual permanece parcial.
- Findings de QA, Database, Security e UI/UX continuam sob ownership dos respectivos reviewers.

## Constraints

- Planejamento e documentação somente.
- Não implementar, criar migration, acessar banco real, configurar provider, usar credencial, aceitar custo ou autorizar produção.
- Não encerrar nem reescrever findings de outros Works.
- Não alterar o Functional Commit nem o status consolidado da Fase 5.
- Preservar prioridade visual sem esconder consentimento, ações sensíveis ou limitações reais.
- Evitar arquitetura multiusuário/enterprise sem demanda.

## Options

### Option A — Manter o roadmap multiusuário anterior

- Pros: prepara uma futura plataforma SaaS e permite múltiplas identidades/roles.
- Cons: resolve um problema inexistente, amplia schema, UX, operação e threat model.
- Cost: alto, incluindo provider, suporte e manutenção contínua.
- Complexity: alta.
- Security impact: mais superfícies de account takeover, recuperação, RBAC e tenant isolation.
- Database impact: identities, sessions, tenant RLS, backfills e policies adicionais.
- Maintenance impact: alto e permanente.

### Option B — Confiar implicitamente em localhost e remover identidade/permissões

- Pros: menor esforço imediato e nenhuma dependência externa.
- Cons: não protege secrets, filesystem, Git, banco, providers ou ações de tools/agentes; não suporta acesso remoto seguro.
- Cost: baixo agora, alto após incidente ou expansão.
- Complexity: baixa.
- Security impact: fail-open; prompt injection ou conteúdo malicioso poderia acionar efeitos sem um principal confiável.
- Database impact: nenhum imediato.
- Maintenance impact: dívida crítica antes de tools/agentes.

### Option C — Single-owner boundary + autorização de recurso + PermissionManager por risco

- Pros: protege o risco real com poucos componentes; funciona localmente e admite evolução cloud sem virar plataforma de contas.
- Cons: ainda exige sessão, confirmação, revogação e UX própria; o mecanismo remoto precisará decisão futura.
- Cost: baixo a médio no modo local; custo cloud somente se acesso remoto for escolhido.
- Complexity: moderada e proporcional.
- Security impact: fail-closed, grants mínimos e nenhuma autoelevação.
- Database impact: preserva `user_id`; migrations só se inventário/sessão/audit exigir.
- Maintenance impact: contratos pequenos e substituíveis, sem RBAC/tenant matrix.

## Recommendation

Adotar a Option C.

Confirmar a prioridade visual com um ajuste mínimo de segurança na sequência:

1. Phase 6 — Target UI Convergence, estritamente visual e local/controlada.
2. Phase 7 — Single-User Security & Permissions.
3. Phase 8 — Read-Only Tool Registry.
4. Phase 9 — Permissioned Effects & Ephemeral Coding.
5. Phase 10 — Ephemeral Agent Runtime.
6. Production Hardening como gate condicional antes de qualquer acesso remoto/cloud escolhido, não como pacote enterprise antecipado.

Tools/coding foram divididos em duas fases porque leitura e efeitos têm riscos materialmente diferentes. Agents permanecem depois do PermissionManager e do executor controlado.

## Rationale

O dashboard pode vir primeiro porque a Fase 6 proposta não adiciona credenciais, efeitos ou novas capacidades; ela apenas converge a apresentação de fluxos existentes e continua bloqueada para produção. Exigir QA, Security e UI/UX reduz o risco de esconder consentimento, confirmação destrutiva ou estados reais.

O controle relevante para uma assistente pessoal não é “qual tenant pode acessar qual tenant”, mas “quem é o único owner, qual recurso esta execução pode tocar e qual risco esta ação representa”. Separar essas perguntas evita tanto o fail-open de localhost quanto o excesso de uma plataforma enterprise.

## Architecture

```text
OwnerAuthenticator → OwnerSession → OwnerContext
                                      ↓
                              ResourceAuthorizer
                                      ↓
                              PermissionManager
                        ALLOW | DENY | CONFIRM
                                      ↓
                           Tool / Agent / Effect
                                      ↓
                              Minimal Audit
```

- Reconhecimento do owner prova o principal humano único.
- Autorização por recurso limita path, repositório, memória, banco, integração e destino.
- PermissionManager decide risco e confirmação; não autentica e não substitui resource checks.
- Tools e agentes recebem interseção de grants, nunca permissão igual ou maior por herança.
- Aprovação é vinculada a owner session, ação, alvo, fingerprint, parâmetros, ambiente, execution ID, nonce e expiração.
- Conteúdo não confiável não cria grants nem confirma ações.

## Permission Levels

| Level | Default decision | Confirmation | Scope/expiry | Examples |
|---|---|---|---|---|
| SAFE | ALLOW somente em allowlist | não, dentro da tarefa | requisição/tarefa e recursos enumerados | leitura de memória própria, docs permitidas, status |
| WRITE | ALLOW somente com task envelope; senão CONFIRM | contextual | uma tarefa ou até 30 min, alvo/ação exatos | editar workspace, salvar rascunho, commit local autorizado |
| SENSITIVE | REQUIRE_CONFIRMATION | owner em UI confiável | uso único, até 5 min, destino/parâmetros/budget | provider externo, secret handle, mensagem, custo, integração privada |
| DESTRUCTIVE | REQUIRE_STRONG_CONFIRMATION | owner + alvo/consequência inequívocos | uso único, até 2 min, nonce e fingerprint | excluir, sobrescrever, force push, DDL/migration destrutiva |

Invariantes comuns:

- policy ausente, alvo ambíguo, erro de classificação ou mudança de parâmetros resulta em `DENY`.
- grants são revogáveis e não sobrevivem além do escopo definido.
- retry de efeito incerto não é automático.
- agents não confirmam em nome do owner nem modificam a policy que os governa.
- audit omite secrets, tokens, prompts brutos e conteúdo privado completo.

## Owner and Legacy Identity

- Desenvolvimento local: pareamento da instalação e sessão opaca server-side; segredo no cofre do SO quando necessário.
- Remoto/cloud: passkey/WebAuthn ou OIDC allowlisted para um único subject, escolhidos somente quando houver objetivo de acesso remoto.
- `X-Hope-User-Id` e `?user_id=` deixam de ser autoridade na Phase 7.
- `user_id` do banco permanece como namespace canônico do owner por compatibilidade.
- Nenhum UUID legado é autoassociado pela simples posse no browser.
- Vínculo, quarentena ou descarte dependem de inventário do Database, dry-run, backup, rollback e autorização específica.
- RLS por tenant sai do roadmap imediato; RLS simples fica como defesa opcional condicionada ao perfil de deploy.

## Required Reviews

### Phase 6 — Target UI Convergence

- QA: YES — browser, regressão, responsividade, WebGL e controles existentes.
- DATABASE: NO — escopo não altera schema, query ou persistência; mudança funcional de dados exige retorno ao Planner e reclassificação.
- SECURITY: YES — consentimento, confirmação destrutiva, claims e ausência de capacidades falsas.
- UI/UX: YES — especificação prévia e review de fidelidade no mesmo Functional Commit.

### Phase 7 — Single-User Security & Permissions

- QA: YES — sessão, revogação, HTTP/WS e negativas de permissão.
- DATABASE: YES se houver migration, vínculo de namespace ou persistência de sessão/audit; o impacto deve ser fechado antes do DEV.
- SECURITY: YES — review obrigatório da fronteira de owner, grants, secrets e prompt injection.
- UI/UX: YES — pareamento, expiração, confirmação, revogação e estados acessíveis.

### Phases 8–10

- Phase 8: QA YES; DATABASE NO porque exclui tool de banco/persistência; SECURITY YES; UI/UX YES.
- Phase 9: QA YES; DATABASE NO porque migration e banco real são non-goals; SECURITY YES; UI/UX YES.
- Phase 10: QA YES; DATABASE NO porque o runtime inicial é efêmero; SECURITY YES; UI/UX YES.
- Regra de reclassificação: qualquer proposta que introduza persistência, query relevante, migration ou tool de banco volta ao Planner antes do DEV e torna Database `YES`.

## Risks

- A Phase 6 visual pode esconder controles de segurança ou criar botões inertes para capacidades futuras.
- “Single-user” pode ser confundido com “sem autenticação” e resultar em acesso remoto inseguro.
- Grants WRITE amplos podem virar autorização permanente por conveniência.
- Confirmações frequentes podem gerar fadiga e cliques automáticos.
- Dados legados podem ser atribuídos ao owner errado sem inventário.
- Manter `user_id` pode ser confundido com suporte multi-tenant, embora seja apenas namespace compatível.
- Adiar Production Hardening não pode significar expor antes do gate.

## Acceptance Criteria

- [x] A usuária aprovou `ARCH-2026-09-10-003`, `docs/phase-6.md` e autorizou a implementação da Phase 6 em 2026-09-11, sem expansão de escopo.
- [x] Modelo `SINGLE_USER` está explícito e complexidade multiusuário/enterprise saiu do roadmap imediato.
- [x] Findings de reviewers permanecem históricos e não foram encerrados pelo Planner.
- [x] Target UI é a Phase 6 autorizada e `IN_PROGRESS`, ainda sem Functional Commit.
- [x] Dashboard não pode apresentar tools, agents, métricas ou rotas futuras como funcionais.
- [x] Owner recognition, resource authorization e risk permissions estão separados.
- [x] SAFE, WRITE, SENSITIVE e DESTRUCTIVE possuem regras de confirmação, escopo, expiração, revogação, auditoria e fail-closed.
- [x] Tools/agents não podem autoelevar, reutilizar approval ou herdar grants maiores.
- [x] UUID transitório e `user_id` possuem estratégia segura e não destrutiva.
- [x] RLS por tenant foi removido do roadmap imediato sem alterar schema.
- [x] Local/controlado e remoto/cloud têm requisitos distintos.
- [x] Required Reviews estão definidos para a fase proposta.
- [x] Somente a implementação da Phase 6 foi autorizada; migration, banco, provider, credencial, custo, produção, tools, agents e Phase 7 permanecem não autorizados.

## Implementation Phase

- Planning status: `APPROVED`.
- Phase 6 implementation status: `IN_PROGRESS`.
- Implementation authorization: `0bcc25a5437cab8a326e64281579ead56274d8cb`.
- UI/UX pre-implementation status: `APPROVED` em `3c10be208e4e4d6dcfc3329dd6207961c898d44c`.
- Phase 7+ implementation status: `NOT_STARTED / NOT_AUTHORIZED`.
- Functional Commit for next phase: `NONE`.
- Current functional baseline remains `88e194778b4399a6713f118470f9d861c553cd9e`.

## Deferred Items

- Escolha do mecanismo de owner recognition para Phase 7.
- Inventário e decisão sobre namespaces UUID legados.
- Qualquer provider, custo, credencial, migration ou acesso remoto.
- RLS simples como defesa adicional, somente se o deploy justificar.
- Model Router, memória semântica, skills, learning, imagens, multimodalidade, agentes persistentes, automações e HOPE Bridge.
- Production Hardening real e go-live.

## Coordinator Handoff

- Recommended Next Role: DEVELOPMENT.
- Status: NOT_STARTED.
- Task: implementar exclusivamente a Phase 6 conforme `docs/phase-6.md` e `docs/design/phase-6-target-ui-spec.md`, produzir um novo Functional Commit e parar para os reviews obrigatórios.
- Do not route to: Phase 7, Database, providers, produção, tools ou agents.
- Boundary: a autorização cobre somente a implementação da Phase 6 dentro do escopo aprovado; não autoriza expansão funcional, migration, banco, provider, credencial, custo, produção ou qualquer fase posterior.
