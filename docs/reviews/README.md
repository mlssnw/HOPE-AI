# Reviews e handoffs do HOPE AI

## Objetivo

Esta pasta contém o resultado mais recente de cada papel de revisão. O repositório é o canal oficial: cada relatório identifica o commit exato, registra evidências e passa a próxima ação sem depender de conversa direta entre Works. Comece pelo [painel de handoff](../handoff.md).

Os arquivos `*-latest.md` representam somente a revisão mais recente daquele papel. Histórico relevante e estado consolidado ficam em `docs/handoff.md`; decisões duradouras devem ser registradas na documentação de fase ou arquitetura apropriada.

## Fluxo oficial

```text
Architecture / Planning
  → define escopo e fase
Development
  → implementa, testa, documenta e cria commit
  → READY_FOR_REVIEW e para de escrever
QA / Tests
  → revisa o commit exato
Database Audit
  → revisa o mesmo commit quando houver impacto em dados
Security Review
  → revisa o mesmo commit quando aplicável
Architecture / Planning
  → consolida resultados e decisão necessária
APPROVED ou REJECTED
Development
  → corrige BLOCKERS em novo commit, se necessário
  → solicita nova revisão
Usuário
  → mantém a decisão final quando necessária
Fase aprovada
  → próxima fase somente após escopo e autorização explícitos
```

Development nunca marca a própria fase como `APPROVED` final.

## Estados permitidos

Use somente estes valores no campo `Status` quando aplicável:

- `NOT_STARTED`: o trabalho ainda não começou.
- `IN_PROGRESS`: o papel está trabalhando no alvo indicado.
- `READY_FOR_REVIEW`: Development terminou a entrega e disponibilizou um commit exato.
- `APPROVED`: a revisão aplicável terminou sem BLOCKER aberto.
- `APPROVED_WITH_WARNINGS`: não há BLOCKER, mas existem riscos ou problemas não bloqueantes registrados.
- `REJECTED`: há um ou mais BLOCKERS que impedem aprovação.
- `BLOCKED`: o Work não consegue concluir por falta de acesso, ambiente, dependência ou informação indispensável.
- `WAITING_FOR_APPROVAL`: o próximo passo exige decisão ou autorização explícita do usuário ou papel competente.
- `SUPERSEDED`: o relatório ou commit foi substituído por uma versão posterior claramente indicada.

Não crie sinônimos como “DONE”, “PASS” ou “FAILED”. Resultado, recomendação e aplicabilidade são campos distintos de `Status`.

## Severidade

- `CRITICAL`: risco grave de segurança, perda de dados ou sistema inutilizável.
- `HIGH`: funcionalidade importante quebrada ou risco sério.
- `MEDIUM`: bug relevante com workaround.
- `LOW`: problema menor com impacto limitado.
- `INFO`: observação ou melhoria sem defeito comprovado.

Severidade não define sozinha se um item é BLOCKER. O relatório deve preencher `Blocking: yes/no` e justificar casos não óbvios.

## BLOCKER e WARNING

Um **BLOCKER** impede a aprovação da fase. Exemplos: teste crítico falhando, perda de dados, acesso à memória de outro usuário, migration inconsistente, segredo exposto, frontend inutilizável ou função principal da fase inoperante.

Um **WARNING** é um problema real e rastreável que não impede necessariamente a fase. Registre impacto, evidência, recomendação e responsável sugerido; não esconda warnings dentro de notas genéricas.

## Responsabilidade por arquivo

- **Development:** atualiza `docs/handoff.md` com entrega e próxima ação. Não edita os relatórios de QA, Database Audit ou Security Review.
- **QA / Tests:** atualiza somente `qa-latest.md` e pode atualizar somente a seção QA e a próxima ação de `docs/handoff.md`.
- **Database Audit:** atualiza somente `database-audit-latest.md` e, quando solicitado, somente sua seção e a próxima ação no handoff.
- **Security Review:** atualiza somente `security-review-latest.md` e, quando solicitado, somente sua seção e a próxima ação no handoff.
- **Architecture / Planning:** atualiza somente `architecture-latest.md` e consolida decisões no handoff sem reescrever os resultados dos demais papéis.

Nenhum Work pode alterar o resultado, evidência ou recomendação assinada por outro papel. Uma correção deve gerar novo commit de Development e nova revisão, não uma edição retroativa do relatório anterior.

## Como atualizar um arquivo latest

1. Leia `AGENTS.md`, `docs/handoff.md`, este arquivo e o template do seu papel.
2. Confirme branch, working tree e o commit-alvo.
3. Revise exatamente esse commit; se `HEAD` divergir, use comparação explícita e registre a divergência.
4. Substitua o placeholder do seu `*-latest.md` pelo template preenchido.
5. Registre somente testes realmente executados e inclua evidência suficiente para reprodução.
6. Atualize sua seção do handoff, sem tocar nas seções dos outros papéis.
7. Defina a próxima ação, papel, commit-alvo, entradas e saída esperada.
8. Revise o diff e mantenha o relatório separado de correções de código.

QA, Database Audit e Security Review podem criar commit exclusivo de documentação de review quando solicitado. Caso contrário, deixam a alteração sem commit até decisão do usuário. Nunca misture correção funcional com relatório de revisão.

## Referência obrigatória ao commit

Toda revisão deve usar o hash exato, por exemplo:

```text
Phase: 5
Commit reviewed: becb27d
```

“Fase 5 atual” não identifica um artefato revisável. Se a revisão cobre um intervalo, registre o commit final e o intervalo explícito nas notas.

## Como marcar N/A

`N/A` indica que uma disciplina não se aplica ao escopo; não é um estado e não pode ser presumido por Development. O papel responsável ou Architecture deve registrar:

```text
Status: APPROVED
Applicability: N/A
Commit reviewed: <hash exato>
Reason: <por que o commit não afeta esta disciplina>
```

Marcar N/A exige leitura do diff e justificativa. Não use N/A quando o ambiente necessário estava indisponível; nesse caso use `BLOCKED`.

## Aprovação oficial da fase

Uma fase só é oficialmente `APPROVED` quando:

- Development terminou e entregou commit exato;
- QA marcou `APPROVED` ou `APPROVED_WITH_WARNINGS`;
- Database Audit marcou `APPROVED`/`APPROVED_WITH_WARNINGS` ou justificou `Applicability: N/A`;
- Security Review marcou `APPROVED`/`APPROVED_WITH_WARNINGS` ou justificou `Applicability: N/A`;
- não existe BLOCKER aberto;
- o usuário aprovou quando necessário.

Warnings devem continuar visíveis no handoff e na documentação de fase. Architecture consolida o resultado, mas não apaga achados dos revisores.

## Concorrência e conflitos

**Não execute dois Works de escrita simultaneamente no mesmo branch quando ambos puderem alterar os mesmos arquivos.**

Fluxo recomendado:

1. Development cria o commit e para de escrever.
2. QA, Database Audit e Security Review leem o mesmo commit.
3. Cada revisor escreve somente no arquivo do próprio papel.
4. Development recebe blockers consolidados e cria um novo commit de correção.
5. Revisores analisam o novo hash; o relatório anterior pode ser marcado `SUPERSEDED` com referência ao substituto.

Leituras simultâneas são permitidas. Escritas paralelas só são seguras quando os arquivos são inequivocamente distintos e ninguém atualiza `docs/handoff.md` ao mesmo tempo.

## Passagem para o próximo Work

Todo handoff deve terminar com:

```text
Role: <próximo papel>
Task: <ação verificável>
Target commit: <hash exato>
Inputs:
- <arquivos, relatórios ou ambientes necessários>
Expected output:
- <arquivo e decisão esperados>
```

Se o alvo mudar, pare e atualize o hash antes da revisão. Se houver BLOCKER, direcione a ação a Development com IDs dos achados; se faltar autorização, use `WAITING_FOR_APPROVAL` e direcione ao usuário.

## Processo manual

Este fluxo usa somente Git, Markdown, commits e papéis claros. Bots, scripts, webhooks, GitHub Actions e serviços externos não fazem parte deste sistema e só podem ser avaliados em fase futura autorizada.
