# Database Audit — Latest

- Status: APPROVED_WITH_WARNINGS
- Feature status: APPROVED_WITH_WARNINGS — `DB-005` foi resolvido de forma fail-safe para o contrato da Fase 5
- Production readiness: BLOCKED — role restrita, migration/hardening real, TLS forte e busca vetorial de produção continuam sem validação operacional
- Commit reviewed: `88e194778b4399a6713f118470f9d861c553cd9e`
- Baseline: `19e573893aba09da990256da05e7dab5af165ce1`
- Environment: código exato do Functional Commit; testes SQLite descartáveis; tentativa read-only ao PostgreSQL configurado indisponível por resolução DNS
- Read-only mode: YES — nenhuma migration, DDL, backfill, downgrade ou mutação foi executada em banco real
- Applicability: APPLICABLE — a correção altera o gate de compatibilidade que decide se a memória persistente pode ser ativada
- Date: 2026-09-10

`HEAD` estava em `03049a5106ddd0ff1e7cea390452a621ba09cd29`, à frente do alvo por documentação. Não há diferença funcional em `backend/`, `migrations/` ou `tests/` entre o Functional Commit e o `HEAD` auditado.

## DATABASE STATUS

- PostgreSQL real, último estado conhecido: `18.6`.
- pgvector real, último estado conhecido: `0.8.6`.
- Database size atual: não revalidado; conexão indisponível por `gaierror`.
- Alembic head do código: `20260903_0003`, único head.
- Cadeia: `<base> → 20260902_0001 → 20260902_0002 → 20260903_0003`.
- Última revisão real conhecida: `20260902_0002`.
- Revisão exigida pelo runtime: exatamente `20260903_0003`.
- Migration executada nesta revisão: NO.
- Alembic upgrade/downgrade executado nesta revisão: NO.

A tentativa de diagnóstico ao banco configurado foi feita dentro de transação explicitamente `READ ONLY`, com URL mascarada. Ela falhou por resolução DNS tanto no ambiente restrito quanto fora dele; portanto versão, tamanho, extensão, revisão, roles e dados atuais não foram inferidos como atualizados.

## SCHEMA STATUS

O gate está em `backend/database/session.py`: define `REQUIRED_MEMORY_SCHEMA_REVISION = "20260903_0003"`, verifica a existência de `alembic_version`, lê todas as linhas com `SELECT version_num FROM alembic_version`, ordena as revisões e aceita somente a tupla unitária `("20260903_0003",)`.

Comportamento validado:

| Estado observado | Resultado |
|---|---|
| tabela `alembic_version` ausente | incompatível; memória desativada |
| tabela presente e vazia | incompatível; memória desativada |
| revisão `20260902_0002` | incompatível; memória desativada |
| revisão divergente | incompatível; memória desativada |
| múltiplas revisões | incompatível; memória desativada |
| duas linhas duplicadas com a revisão exigida | incompatível; memória desativada |
| falha de conexão/consulta/inspeção | incompatível; memória desativada |
| uma única revisão `20260903_0003` | compatível; memória ativada |

A checagem é read-only por construção: no ensaio instrumentado em SQLite emitiu somente a inspeção de catálogo (`PRAGMA ...table_info`) e o `SELECT` de versão. A inspeção equivalente do PostgreSQL usa consultas de catálogo. Não há chamada de Alembic, `upgrade`, `metadata.create_all` ou migration no startup.

O gate confia no versionamento do Alembic e não faz uma segunda inspeção estrutural de todas as constraints/colunas. Isso é aceitável para resolver `DB-005`, mas schema manualmente adulterado ou indevidamente estampado ainda pode produzir falso positivo operacional.

## PGVECTOR STATUS

- Dimensão do modelo e da migration: `vector(1536)`.
- Configuração aceita apenas `EMBEDDING_DIMENSIONS=1536`.
- Provider local: 1536 dimensões, exclusivo de desenvolvimento/teste.
- Provider semântico de produção: não configurado.
- Métrica implementada: distância cosseno por `<=>`.
- Índice: HNSW com `vector_cosine_ops`, declarado na migration e no metadata.
- IVFFlat: não utilizado.
- Plano/latência/recall em PostgreSQL real: não revalidado.

A correção de `DB-005` não altera dimensão, operador ou índice. Os testes SQLite validam o controle do gate e contratos de metadata, mas não provam semântica, plano de execução ou desempenho de pgvector/PostgreSQL.

## DATA QUALITY

Nenhum dado real foi lido ou alterado nesta rodada. O último estado conhecido permanece histórico, não atual:

- 3 usuários;
- 0 memórias;
- 4 entidades logicamente órfãs;
- 13 eventos de memória;
- 0 embeddings ativos.

Duplicatas, registros vazios, relações órfãs, entidades órfãs, faixas de `importance`/`confidence`, embeddings nulos e timestamps atuais não puderam ser revalidados sem a instância PostgreSQL.

## INTEGRITY

- O schema incompatível é bloqueado antes de qualquer captura, correção ou upsert de entidade.
- `configure_memory(None)` remove `MemoryManager` e `MemoryService` do estado da aplicação e recria o Orchestrator sem persistência.
- APIs de memória respondem `503` com diagnóstico do schema.
- O teste entregue para `0002 + runtime novo` confirmou: health HTTP 200 com database indisponível, chat HTTP 200, `memory_available=false` e API de memória HTTP 503.
- Checks, unicidade de entidade e FKs compostas permanecem definidos no metadata/migration `0003`; sua aplicação sobre dados reais não foi validada nesta revisão.

### DB-005

- State: RESOLVED no Functional Commit revisado.
- Severity original: HIGH.
- Blocking para Feature Status: NO.
- Evidence: gate no lifespan valida exatamente `20260903_0003`; todos os estados ausente, inacessível, vazio, anterior, divergente ou múltiplo resultam em memória desativada.
- Regression coverage: o teste `test_runtime_disables_memory_safely_when_schema_is_still_0002` cobre a falha original e o chat degradado.
- Mutation boundary: nenhuma migration ou correção automática é iniciada pela aplicação.

## PERFORMANCE

- O gate executa uma vez por processo no startup, com inspeção de tabela e leitura integral de `alembic_version`; a tabela normalmente contém uma única linha.
- O custo é desprezível em condição normal.
- Uma falha transitória no startup mantém a memória desativada até reinício. É fail-safe, mas pode prolongar indisponibilidade após recuperação do banco.
- Não existe timeout específico do gate nem retry controlado; o tempo de conexão depende do driver/rede.
- Existe janela teórica entre a checagem única e alteração posterior do schema. Migrations devem permanecer coordenadas fora do processo web.
- Planos de busca vetorial, sequential scans, `pg_stat_statements`, N+1 e orçamento multi-worker não foram medidos nesta rodada.

## SECURITY

- A URL foi exibida somente com senha mascarada: `postgresql+asyncpg://avnadmin:***@host/hope?ssl=require`.
- A validação do schema não usa a URL administrativa nem tenta elevar privilégio.
- Erros de inspeção/permissão falham fechados para memória e não expõem a exceção ao cliente.
- O health representa schema incompatível como banco configurado porém indisponível.
- A role real continua sem comprovação de privilégio mínimo; o identificador histórico sugere uso administrativo.
- TLS atual permanece em `require`, não `verify-full`.
- RLS e autenticação real permanecem fora desta correção.

## BLOCKERS

### Feature Status

Nenhum blocker de Database permanece para o escopo de `DB-005` no commit `88e194778b4399a6713f118470f9d861c553cd9e`.

### Production Readiness

#### DB-001 — Role real de runtime não confirmada como restrita

- Severity: CRITICAL.
- Blocking: YES somente para Production Readiness.
- Required action: provisionar e auditar role mínima de runtime; manter credencial administrativa exclusiva para migrations autorizadas.

#### DB-003 — Migration/hardening não aplicado e validado no PostgreSQL real

- Severity: HIGH.
- Blocking: YES somente para Production Readiness.
- Required action: validar `0002 → 0003` em clone/instância PostgreSQL descartável, checar precondições e solicitar autorização separada antes de produção.

#### DB-004 — Busca vetorial de produção sem certificação

- Severity: HIGH.
- Blocking: YES somente para Production Readiness.
- Required action: escolher provider semântico compatível com 1536 dimensões e medir qualidade, plano, recall e latência em dados representativos.

## WARNINGS

1. PostgreSQL real permaneceu inacessível por DNS; status, tamanho, roles, TLS, dados, head e pgvector atuais não foram revalidados.
2. A matriz negativa foi executada em SQLite descartável. O fluxo SQLAlchemy é compatível em desenho com PostgreSQL/Alembic, mas não substitui teste real do driver `asyncpg`, catálogo, permissões e pgvector.
3. O gate aceita a marca Alembic, não valida deriva estrutural. Um banco estampado incorretamente com `20260903_0003` pode passar mesmo sem todos os objetos esperados.
4. O bypass `_schema_created_for_tests` é explícito e não é chamado no startup, mas não verifica tecnicamente que o ambiente seja `test` ou que a URL seja descartável. Uso indevido de `create_schema_for_tests` sobre banco persistente contornaria o gate durante aquele processo.
5. Falha transitória de validação exige reinício para reativar memória; não há retry/recovery automático.
6. A falha é registrada sem a causa técnica da exceção. Isso evita vazamento, mas reduz diagnóstico operacional; observabilidade segura deve distinguir DNS, credencial, permissão e timeout.
7. O check ocorre uma vez por processo e não elimina corrida com migration externa após o startup.
8. A migration `0003` ainda não possui teste de upgrade em PostgreSQL descartável com dados representativos.
9. Dois warnings não funcionais apareceram no pytest: depreciação Starlette/httpx e cache sem permissão.

## VALIDATION PERFORMED

- Functional Commit confirmado: `88e194778b4399a6713f118470f9d861c553cd9e`.
- Baseline confirmado como ancestral: `19e573893aba09da990256da05e7dab5af165ce1`.
- Diferença funcional `88e1947..HEAD`: nenhuma em `backend/`, `migrations/` ou `tests/`.
- Testes focados de banco, memória, orchestrator, realtime e harness: `36 passed`.
- Suíte Python completa: `45 passed`, 2 warnings não funcionais.
- Matriz descartável adicional: tabela ausente, vazia, `0002`, divergente, múltipla, duplicada, exata e falha de consulta; todos os resultados foram fail-safe conforme esperado.
- Lifespan exercitado adicionalmente para ausência, vazio, `0002`, divergência, múltiplas revisões e revisão exata.
- SQL instrumentado durante o check: somente inspeção de catálogo e `SELECT version_num`.
- Alembic heads: único head `20260903_0003`.
- Alembic history: cadeia linear `0001 → 0002 → 0003`.
- `git diff --check` entre baseline e alvo: sem erros.
- PostgreSQL real: duas tentativas read-only, ambas falharam por `gaierror`; nenhuma query de dados ou mutação foi concluída.
- Frontend: não reexecutado porque `npm` não estava disponível no PATH; não é evidência necessária para a conclusão de Database.

## RECOMMENDATIONS

1. COORDINATOR deve marcar DATABASE como `APPROVED_WITH_WARNINGS` para `88e194778b4399a6713f118470f9d861c553cd9e` e remover `DB-005` dos Feature Blockers.
2. Preservar `DB-001`, `DB-003` e `DB-004` exclusivamente em Production Readiness; este parecer não autoriza migration, deploy, alteração de role, TLS ou provider.
3. Antes de produção, testar `0002 → 0003` em PostgreSQL descartável/clone, validar schema real, roles, TLS, pgvector e planos de consulta.
4. Em evolução futura, restringir tecnicamente `create_schema_for_tests` a ambiente e banco comprovadamente descartáveis, e acrescentar observabilidade segura/retry controlado ao gate.

## CONCLUSION

`APPROVED_WITH_WARNINGS`. `DB-005` está resolvido no escopo funcional: o runtime só ativa memória diante de uma única revisão exatamente igual a `20260903_0003`, falha fechado nos demais estados, preserva o chat degradado e não executa migration ou mutação automática. A aprovação não altera os blockers `DB-001`, `DB-003` e `DB-004`, que continuam impedindo somente Production Readiness.
