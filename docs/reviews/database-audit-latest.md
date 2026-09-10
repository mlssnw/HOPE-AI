# Database Audit — Latest

- Status: REJECTED
- Feature status: REJECTED — o runtime pode iniciar sobre schema `0002`, mas o upsert de entidades do Functional Commit exige a constraint única criada apenas pela `0003`
- Production readiness: BLOCKED — migration, role restrita, TLS `verify-full` e provider vetorial de produção não foram aplicados/validados no ambiente real
- Commit reviewed: `19e573893aba09da990256da05e7dab5af165ce1`
- Base delivery covered: `adfc728aaaf96c679dd9d1df38c56edda8bc95de`
- Environment: código exato do Functional Commit; testes SQLite descartáveis; PostgreSQL real anteriormente auditado em Aiven, atualmente inacessível por falha de resolução DNS
- Read-only mode: YES no PostgreSQL real — nenhuma conexão foi estabelecida nesta rodada e nenhuma migration, DDL, CRUD ou manutenção foi executada; testes locais usaram bancos descartáveis
- Applicability: APPLICABLE — a linhagem revisada altera schema, migration, integridade, pool, credenciais e pgvector; `19e5738` também altera consentimento e exclusão de memória
- Date: 2026-09-10

`HEAD` estava em `563cdf9`, à frente do alvo somente por documentação. Os arquivos funcionais entre `19e5738` e `HEAD` são idênticos.

## PostgreSQL

- Última versão real observada: `18.6`
- Último head real registrado: `20260902_0002`
- Head exigido pelo Functional Commit: `20260903_0003`
- Estado nesta rodada: conexão indisponível por `getaddrinfo failed`; o head real e as precondições atuais não puderam ser reconsultados

O relatório usa como evidência ambiental herdada o último Database Audit e o próprio handoff. Nenhum resultado do banco real foi inferido como atualizado.

## pgvector

- Última versão real observada: `0.8.6`
- Tipo esperado: `vector(1536)`
- Provider local: 1536 dimensões
- Operador: cosseno `<=>`
- Índice esperado: HNSW com `vector_cosine_ops`

O metadata SQLAlchemy agora declara corretamente `ix_memories_embedding_hnsw`, corrigindo a causa original de `DB-002`. O commit também impede `local-hash` quando `APP_ENVIRONMENT` é `production`, `prod` ou `staging`. Ainda não existe adapter semântico de produção nem conjunto real para validar recall, plano ou latência.

## Migration

- Current code head: `20260903_0003`
- Expected real head: `20260903_0003`
- Last known real head: `20260902_0002`
- Cadeia: `<base> → 20260902_0001 → 20260902_0002 → 20260903_0003`
- SQL offline `0002:0003`: gerado com sucesso
- Migration executada nesta rodada: NO
- Downgrade executado: NO

A `0003` adiciona:

- paridade do índice HNSW no metadata;
- constraints de faixa e conteúdo;
- unicidade canônica de entidades;
- chaves compostas para garantir pertencimento ao mesmo usuário;
- constraints contra autorrelações.

Não existe teste de upgrade/downgrade da migration em PostgreSQL descartável. A migration cria constraints diretamente, sem etapa `NOT VALID`, validação prévia embutida ou tratamento de duplicatas legadas; em base maior ou divergente, poderá bloquear ou falhar.

## Schema

O metadata do Functional Commit contém os contratos esperados da `0003`. Os testes confirmam a presença do HNSW, checks, unique constraints e foreign keys compostas.

Lacunas:

- o processo web não verifica `alembic_version` na inicialização;
- o schema ainda preserva FKs simples ao lado das novas FKs compostas, duplicando validação e custo de cascata;
- `ck_memories_mention_count_nonnegative` permite zero, embora a semântica e o default atuais iniciem em um;
- `entity_relations` continua sem unicidade equivalente à de `memory_relations`.

## Data Integrity

O teste `test_database_rejects_cross_user_relations` passou e confirma o contrato de isolamento no metadata criado do zero. Isso não valida a aplicação da migration sobre dados legados.

A última auditoria real não encontrou duplicatas, valores fora de faixa ou referências cruzadas, mas esses dados são de 2026-09-03 e não foram tratados como prova atual devido à indisponibilidade da conexão.

## Memory Data Quality

Último estado real conhecido:

- 3 usuários;
- 0 memórias;
- 4 entidades logicamente órfãs;
- 13 eventos de memória;
- 0 embeddings ativos.

O Functional Commit não implementa limpeza automática das entidades logicamente órfãs. Nenhum dado foi removido ou corrigido nesta revisão.

## Relations

As novas FKs compostas impedem relações entre usuários diferentes quando a `0003` está aplicada. O teste isolado correspondente passou.

O fluxo de exclusão introduzido por `19e5738` não remove a memória durante a interpretação do chat: retorna uma confirmação vinculada ao ID. A API só chama a exclusão quando `X-Hope-Confirm-Memory-Id` corresponde ao UUID da rota. Os testes confirmam que ausência ou divergência retorna HTTP 428 sem mutação.

## Indexes

- HNSW declarado em migration e metadata: corrigido no código.
- Índices compostos existentes atendem parte das novas FKs por usuário.
- FKs simples legadas continuam podendo exigir índices iniciados diretamente pelo ID referenciado para cascades eficientes.
- Busca textual e ordenação por importância continuam sem os índices especializados apontados no audit anterior.

Nenhum plano real foi obtido nesta rodada.

## Vector Search

O bloqueio do provider `local-hash` em ambientes declarados como deploy é uma melhoria válida, mas depende de `APP_ENVIRONMENT` estar configurado corretamente; o default permanece `development`.

Sem provider semântico, embeddings ativos ou PostgreSQL acessível, `DB-004` permanece aberto para Production Readiness.

## Performance

- Novo default de pool: 3 conexões + 1 overflow por processo, timeout 30 s e recycle 900 s.
- A mudança reduz o risco anterior de um processo consumir 15 das 20 conexões disponíveis.
- Múltiplos workers ainda exigem orçamento explícito de conexões.
- N+1 na vinculação de entidades e nos eventos de acesso permanece.
- `pg_stat_statements` e `track_io_timing` não puderam ser revalidados.

## Security

- `DATABASE_URL` e `DATABASE_ADMIN_URL` agora são separados na configuração.
- O engine oculta parâmetros SQL e `safe_url` mascara a senha.
- A separação de configuração não altera a role real por si só.
- O último ambiente conhecido ainda usava `avnadmin`; não foi possível confirmar substituição nesta rodada.
- TLS `verify-full` é recomendado na documentação, mas não é imposto pelo runtime.
- RLS não foi implementada; o isolamento proposto depende das FKs compostas da `0003` e dos filtros da aplicação.
- Opt-out de memória no chat bloqueia recuperação, captura e comandos de memória server-side nos testes.

## Blockers

### DB-005 — Runtime não bloqueia schema incompatível

- Severity: HIGH
- Blocking: YES para Feature Status
- Evidence: `EntityRepository.upsert` executa `ON CONFLICT (user_id, normalized_name, entity_type)`, mas essa unique constraint só existe após `20260903_0003`; não há verificação de `alembic_version` no startup.
- Reproduction: em schema descartável equivalente ao `0002`, o upsert falhou com `OperationalError: ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint`.
- Impact: o backend pode iniciar aparentemente saudável sobre `0002` e falhar durante captura/correção que extraia entidades.
- Required action: adicionar um gate explícito de compatibilidade do schema ou impedir ativação da memória até o head requerido; cobrir o caminho `0002 + runtime novo` com teste.

### DB-001 — Role real de runtime não confirmada como restrita

- Severity: CRITICAL
- Blocking: YES para Production Readiness
- State: parcialmente tratado no código pela separação das URLs, mas não validado no ambiente real.
- Required action: provisionar e auditar role mínima de runtime; manter a role administrativa somente para migrations autorizadas.

### DB-003 — Hardening de isolamento ainda não aplicado/validado no PostgreSQL real

- Severity: HIGH
- Blocking: YES para Production Readiness
- State: corrigido no metadata e na `0003`, pendente de teste PostgreSQL e aplicação autorizada.
- Required action: validar upgrade em clone/instância descartável, checar precondições e somente então solicitar autorização para produção.

### DB-004 — Busca vetorial de produção continua sem certificação

- Severity: HIGH
- Blocking: YES para Production Readiness
- State: `local-hash` agora é recusado em ambientes declarados de deploy, mas não há provider real nem benchmark.
- Required action: escolher provider compatível com 1536 dimensões e executar avaliação representativa de qualidade e desempenho.

## Resolved or Partially Resolved Findings

- `DB-002`: causa no metadata corrigida; HNSW agora é declarado. Fechamento definitivo depende de `alembic check` limpo após a `0003` em PostgreSQL.
- Pool excessivo: mitigado de 5+10 para 3+1 por processo.
- Entidade duplicada por corrida: upsert atômico implementado, condicionado à `0003`.
- Isolamento por usuário: FKs compostas implementadas, condicionado à `0003`.

## Warnings

1. PostgreSQL real indisponível por DNS; head, roles, TLS e dados atuais não foram revalidados.
2. A migration `0003` não possui teste real de upgrade/downgrade em PostgreSQL descartável.
3. Constraints são criadas diretamente e podem bloquear/falhar em dados legados divergentes.
4. `APP_ENVIRONMENT=development` é fail-open se a variável for omitida em deploy.
5. TLS `verify-full` continua orientação, não requisito aplicado pelo código.
6. Entidades logicamente órfãs continuam sem política de coleta.
7. `mention_count >= 0` é mais permissivo que a semântica atual de contagem iniciada em um.
8. N+1 e índices de busca/ordenação continuam como dívida de escala.
9. Dois warnings não funcionais nos testes Python: depreciação Starlette/httpx e cache do pytest sem permissão.

## Validation Performed

- Functional Commit confirmado: `19e573893aba09da990256da05e7dab5af165ce1`.
- Diferença `19e5738..HEAD`: somente documentação.
- Python: `42 passed`.
- Frontend: `19 passed`.
- Alembic heads: `20260903_0003` único head.
- SQL offline da migration `0002:0003`: gerado com sucesso.
- Reproduzida incompatibilidade do upsert com schema anterior sem a unique constraint.
- PostgreSQL real: conexão tentou resolução no sandbox e fora dele; ambas falharam por DNS.
- Nenhum serviço pago, migration real, downgrade ou mutação em banco real foi executado.

## Recommendation

`REJECTED`. Development deve corrigir `DB-005` em novo Functional Commit. O código da `0003` melhora `DB-002` e `DB-003`, mas sua aplicação permanece uma ação sensível separada e não autorizada. `DB-001`, `DB-003` e `DB-004` continuam bloqueando apenas Production Readiness até validação ambiental e decisão do usuário.
