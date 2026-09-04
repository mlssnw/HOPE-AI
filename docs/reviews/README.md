# Governança, reviews e handoffs do HOPE AI

Este documento permite que um novo Work opere sem depender de chats antigos. O [painel de handoff](../handoff.md) contém o estado consolidado; os arquivos `*-latest.md` contêm os resultados oficiais mais recentes de cada reviewer; [`docs/design/`](../design/README.md) contém especificações visuais; e [`docs/templates/`](../templates/phase-coordination-template.md) contém os modelos de trabalho.

## Team Model

```text
                 PLANNER
                    │
         ┌──────────┴──────────┐
         │                     │
       UI/UX             planejamento
         │                     │
         └──────────┬──────────┘
                    ▼
                   DEV
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
        QA       DATABASE   SECURITY
         │          │          │
         └──────────┼──────────┘
                    ▼
                 PLANNER
                    │
             APPROVE / LOOP
```

- **PLANNER** coordena fase, escopo, arquitetura, critérios de aceite, reviewers necessários, consolidação e Next Action.
- **UI/UX** especifica a experiência antes do DEV e revisa fidelidade visual depois quando aplicável.
- **DEV** implementa, testa, documenta e cria o Functional Commit.
- **QA** tenta quebrar o comportamento por testes, regressões, browser, API, realtime e fluxos negativos.
- **DATABASE** protege PostgreSQL, pgvector, schema, migrations, integridade, índices, performance e qualidade dos dados.
- **SECURITY** revisa secrets, autenticação, autorização, WebSocket, XSS, prompt injection, memory poisoning, banco, integrações e deploy blockers.

O usuário mantém a decisão final sobre ações sensíveis, mudanças importantes e avanço de fase.

## Functional Commit como identidade

Toda implementação e revisão deve citar o hash exato:

```text
Functional commit: abc1234
Target commit: abc1234
Commit reviewed: abc1234
```

“Versão atual”, “Fase 6” e “última versão” não identificam um artefato revisável. Commits apenas de documentação, handoff ou review não substituem o Functional Commit.

Todos os reviewers de uma rodada avaliam o mesmo Functional Commit. Se `HEAD` estiver à frente por documentação, o relatório registra essa diferença sem trocar o alvo técnico.

## Status padronizados

Use somente:

- `NOT_STARTED`: trabalho ainda não iniciado.
- `IN_PROGRESS`: trabalho em execução.
- `READY_FOR_REVIEW`: DEV concluiu e entregou um Functional Commit.
- `WAITING_FOR_REVIEW`: revisão obrigatória está pendente para o commit indicado.
- `WAITING_FOR_APPROVAL`: próximo passo depende de autorização ou decisão explícita.
- `APPROVED`: revisão concluída sem BLOCKER.
- `APPROVED_WITH_WARNINGS`: não há BLOCKER; riscos reais permanecem documentados.
- `REJECTED`: reviewer encontrou BLOCKER que impede aprovação.
- `CHANGES_REQUESTED`: estado consolidado da fase quando qualquer review obrigatório está `REJECTED`.
- `BLOCKED`: o Work não consegue concluir por falta de acesso, ambiente, dependência ou informação indispensável.
- `N/A`: review não aplicável, com justificativa do PLANNER ou do papel responsável.
- `SUPERSEDED`: resultado ou alvo substituído por versão posterior explicitamente indicada.

Não invente sinônimos para campos de status.

## Required Reviews

PLANNER define no início da fase e registra no handoff:

```text
QA: YES
DATABASE: YES / NO
SECURITY: YES / NO
UI/UX: YES / NO
```

`Required` aceita somente `YES` ou `NO`.

- **QA:** `YES` para qualquer mudança funcional significativa.
- **DATABASE:** `YES` quando houver schema, migrations, queries importantes, memória, pgvector, persistência, pool ou dados.
- **SECURITY:** `YES` quando houver autenticação, autorização, APIs externas, cloud, dados pessoais, voz, uploads, WebSocket, memória, tools, e-mail, calendário ou execução local.
- **UI/UX:** `YES` quando houver interface, fluxo visual, estado, Memory Globe, chat, voz visual, responsividade ou acessibilidade.

DATABASE não participa automaticamente de toda fase. Mudança apenas visual ou Voice UI sem persistência: `Required: NO`, `Status: N/A`. Mudança em memória/schema ou `voice_sessions`: `Required: YES`.

SECURITY também não participa de toda alteração pequena. PLANNER decide pela presença de risco real e registra a justificativa, sem aprovar tecnicamente no lugar de SECURITY.

## Review Matrix

O handoff mantém uma linha por Work:

| Work | Required | Status | Commit |
|---|---|---|---|
| DEV | YES | READY_FOR_REVIEW | `abc1234` |
| QA | YES | WAITING_FOR_REVIEW | `abc1234` |
| DATABASE | YES / NO | WAITING_FOR_REVIEW / N/A | `abc1234` |
| SECURITY | YES / NO | WAITING_FOR_REVIEW / N/A | `abc1234` |
| UI/UX | YES / NO | WAITING_FOR_REVIEW / N/A | `abc1234` |
| PLANNER | YES | WAITING_FOR_REVIEW | `abc1234` |

A matriz é coordenação resumida, não substitui os relatórios `latest`.

## Fluxo padrão da fase

```text
PLANNER
  → define fase, critérios e reviews obrigatórios
UI/UX, quando houver impacto visual
  → cria especificação em docs/design/
DEV
  → implementa, testa, documenta e cria Functional Commit
  → READY_FOR_REVIEW e para de escrever
QA + DATABASE + SECURITY + UI/UX Review, conforme Required
  → revisam o mesmo Functional Commit
PLANNER
  → consolida resultados sem substituir reviewers
Todos os required reviews aprovados e nenhum BLOCKER
  → APPROVED, com aprovação do usuário quando necessária
Algum required review rejeitado
  → CHANGES_REQUESTED e loop de correção
```

Uma fase aprovada só avança após escopo e autorização explícitos para a próxima fase.

## Reject Loop

Se qualquer reviewer obrigatório emitir `REJECTED`:

1. Phase status torna-se `CHANGES_REQUESTED`.
2. PLANNER consolida os IDs dos blockers e define uma única Next Action principal.
3. DEV corrige somente blockers autorizados.
4. DEV cria um **novo Functional Commit**.
5. PLANNER faz análise de impacto.
6. Áreas tocadas voltam para `WAITING_FOR_REVIEW`.
7. Reviewers aplicáveis revisam o novo hash.
8. PLANNER consolida novamente.

```text
DEV → REVIEW → REJECTED → DEV FIX → NEW FUNCTIONAL COMMIT
    → IMPACT ANALYSIS → REQUIRED RE-REVIEWS → PLANNER CONSOLIDATION
```

O loop se repete até `APPROVED` ou até o trabalho ficar `BLOCKED`/`WAITING_FOR_APPROVAL`.

## Re-review por impacto

Novo commit não invalida automaticamente todas as revisões históricas, mas a aprovação final deve corresponder ao Functional Commit vigente.

- Se a correção toca a área do reviewer, ele revisa novamente.
- Correção de WebSocket exige novo QA e pode exigir SECURITY.
- Correção sem banco não exige novo DATABASE se PLANNER registrar a análise de impacto.
- Correção sem mudança visual não exige novo UI/UX.
- Uma aprovação anterior permanece no histórico; não é editada retroativamente.

## Aprovação oficial

Uma fase só pode ser `APPROVED` quando:

- DEV concluiu e há Functional Commit definido;
- QA obrigatório aprovou;
- DATABASE obrigatório aprovou ou `APPROVED_WITH_WARNINGS`;
- SECURITY obrigatório aprovou ou `APPROVED_WITH_WARNINGS`;
- UI/UX obrigatório aprovou ou `APPROVED_WITH_WARNINGS`;
- nenhum BLOCKER permanece aberto;
- PLANNER consolidou resultados para o Functional Commit vigente;
- o usuário aprovou quando a decisão exigir autorização.

DEV sozinho nunca aprova a fase. PLANNER não aprova banco, segurança, UI/UX ou qualidade no lugar do reviewer responsável.

## APPROVED_WITH_WARNINGS

Significa que não há BLOCKER e a funcionalidade pode avançar, mas riscos ou melhorias continuam documentados. Warnings não são tratados como resolvidos: quando aceitos para avanço, PLANNER os registra em [`docs/backlog.md`](../backlog.md) com origem e fase recomendada.

## Severidade e blocking

- `CRITICAL`: risco grave de segurança, perda de dados ou sistema inutilizável.
- `HIGH`: funcionalidade importante quebrada ou risco sério.
- `MEDIUM`: bug relevante com workaround.
- `LOW`: problema menor.
- `INFO`: melhoria ou observação.

BLOCKER é separado da severidade. `Severity: MEDIUM` e `Blocking: YES` é válido quando o problema impede explicitamente um critério de aceite.

## Ownership

- **DEV:** código funcional, `docs/phase-X.md` e seção Development do handoff.
- **QA:** `docs/reviews/qa-latest.md` e seção QA do handoff.
- **DATABASE:** `docs/reviews/database-audit-latest.md` e seção Database Audit do handoff.
- **SECURITY:** `docs/reviews/security-review-latest.md` e seção Security Review do handoff.
- **UI/UX:** `docs/reviews/uiux-latest.md`, `docs/design/*` e seção UI/UX do handoff.
- **PLANNER:** `docs/reviews/architecture-latest.md`, planejamento, Review Matrix, Current Phase, seção Planner e Next Action quando coordenação for necessária.

Nenhum Work sobrescreve relatório `latest`, evidência ou recomendação de outro papel. Correção funcional gera novo commit e revisão; não reescrita do achado.

## Quando uma revisão é oficial

Resultado dito somente no chat não conclui handoff. Uma revisão só é oficial quando:

1. foi persistida no arquivo `latest` do papel;
2. contém o commit exato;
3. atualizou a seção correspondente no handoff.

Se QA concluiu no chat, mas `qa-latest.md` continua `NOT_STARTED`, o resultado oficial continua `NOT_STARTED`.

## UI/UX em dois momentos

### PRE-IMPLEMENTATION

UI/UX cria a especificação em `docs/design/` e entrega critérios verificáveis ao DEV.

### POST-IMPLEMENTATION

UI/UX compara o Functional Commit com a especificação e registra `uiux-latest.md`.

UI/UX não mistura especificação e implementação sem autorização explícita e, por padrão, não altera código.

## Concorrência e trabalho paralelo

Evite Works de escrita concorrentes no mesmo branch.

Nunca permita:

- DEV e UI/UX editando frontend simultaneamente;
- DEV e DATABASE editando a mesma migration;
- dois Works editando `docs/handoff.md` inteiro ao mesmo tempo;
- reviewer corrigindo código enquanto escreve o relatório.

Após o Functional Commit, QA, DATABASE, SECURITY e UI/UX Review podem trabalhar em paralelo somente quando:

- todos leem o mesmo hash;
- cada um escreve exclusivamente no arquivo que possui;
- nenhum altera código funcional;
- atualizações do handoff são serializadas ou consolidadas por PLANNER.

Leituras paralelas são seguras; escrita paralela exige ownership inequivocamente distinto.

## Next Action

Somente uma Next Action principal deve existir quando houver risco de conflito:

```text
Role:
Status:
Task:
Target commit:
Required inputs:
Expected output:
Blocking dependencies:
```

Se o alvo mudar, pare e atualize o hash. BLOCKER normalmente direciona a DEV; falta de autorização direciona a PLANNER com `WAITING_FOR_APPROVAL`.

## Histórico

`docs/handoff.md` mantém somente estado atual e histórico resumido. Relatórios detalhados permanecem em `docs/reviews/`; decisões duradouras ficam em `architecture-latest.md` ou ADRs. Não transforme o painel em log gigantesco.

## Comandos curtos por Work

### PLANNER

> Leia AGENTS.md, docs/handoff.md e todos os latest reviews. Consolide o estado atual e execute somente a Next Action atribuída ao Planner.

### DEV

> Leia AGENTS.md, docs/handoff.md e os relatórios atuais. Execute somente a Next Action atribuída ao Development.

### QA

> Leia AGENTS.md e docs/handoff.md. Valide o Target Commit da Next Action e persista o resultado nos arquivos oficiais de QA.

### DATABASE

> Leia AGENTS.md e docs/handoff.md. Audite o Target Commit em modo read-only e persista o resultado oficial.

### SECURITY

> Leia AGENTS.md e docs/handoff.md. Revise o Target Commit e persista o resultado oficial.

### UI/UX

> Leia AGENTS.md, docs/handoff.md e docs/design/. Execute a Next Action atribuída ao UI/UX e persista a especificação ou review.

## Processo manual

Este sistema usa Git, Markdown, commits e papéis claros. Bots, scripts, webhooks, GitHub Actions e serviços externos só podem ser avaliados em fase futura autorizada.
