# Security Review

Commit reviewed: 88e194778b4399a6713f118470f9d861c553cd9e
Baseline: 19e573893aba09da990256da05e7dab5af165ce1
Phase: 5
Date: 2026-09-10

## Result

APPROVED_WITH_WARNINGS

O delta está aprovado para o escopo funcional da Fase 5. A memória permanece fail-safe no startup normal: schema ausente, inacessível ou em revisão incompatível resulta em memória desativada, chat degradado sem contexto persistente e endpoints persistentes indisponíveis. `SEC-006` e `SEC-007` continuam efetivos.

Este resultado não aprova deploy público nem aceita os riscos gerais existentes. Production Readiness permanece REJECTED/BLOCKED por `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `SEC-008` e `SEC-012`.

## Scope and Validation

- Branch observada: `main`.
- HEAD observado antes do relatório: `03049a5106ddd0ff1e7cea390452a621ba09cd29`, posterior ao Functional Commit apenas por documentação.
- Delta revisado: `19e573893aba09da990256da05e7dab5af165ce1..88e194778b4399a6713f118470f9d861c553cd9e`.
- Python: 45 testes aprovados; um aviso preexistente de depreciação Starlette/TestClient.
- Suíte focada em banco, harness, orquestrador e realtime: 27 testes aprovados.
- Frontend: 19 testes aprovados.
- Dependências instaladas: `pip check` sem inconsistências.
- Integridade textual: `git diff --check` aprovado para o delta.
- Testes adversariais locais confirmaram fail-closed para ausência da tabela de revisão e banco SQLite inacessível; as mensagens não incluíram URL, credencial, query ou exceção bruta.
- Busca segura no commit alvo não encontrou marcadores conhecidos de credencial.
- Não foram usados providers pagos, banco real, migrations, conteúdo real do Obsidian, exploração externa ou ações destrutivas.

## Controls Confirmed

- A compatibilidade exige exatamente a revisão `20260903_0003`; tabela ausente, revisão divergente e falha de conexão retornam incompatibilidade.
- Exceções durante a validação são convertidas em estado indisponível; não ativam memória e não interpolam a exceção bruta no diagnóstico.
- O startup remove o manager e o serviço de memória do estado da aplicação e reconstrói o orquestrador sem memória quando a validação falha.
- Chat degradado usa o orquestrador corrente de `app.state`; não foi encontrado caminho acidental para o manager ou serviço anterior.
- Com memória desativada, recuperação, captura, comandos de memória e exclusão persistente não são executados.
- `SEC-006` permanece efetivo: opt-in falso impede recuperação, contexto, ferramenta, captura e comandos persistentes.
- `SEC-007` permanece efetivo: exclusão exige confirmação e igualdade exata com o UUID da rota; ausência ou divergência retorna 428.
- O health endpoint expõe somente flags de configuração/disponibilidade e não devolve URL, credencial, query ou exceção interna.
- SQL novo é estático/parametrizado, e o engine mantém ocultação de parâmetros.
- O harness usa somente UUIDs e conteúdo sintéticos; não contém secrets nem executa providers ou banco externo.
- O delta não altera autenticação, autorização, isolamento por usuário, WebSocket ou demais fronteiras de confiança existentes.

## Findings

### SEC-017

ID: SEC-017
Severity: MEDIUM
Title: Validação de schema depende da execução do lifespan e pode ser contornada por managers não padrão
Description: O manager e o orquestrador são construídos antes do lifespan. A validação e a desativação fail-safe ocorrem dentro do lifespan e somente quando o objeto de banco é uma instância do `Database` do projeto. O harness E2E usa deliberadamente um manager sintético com `database=None`, portanto não exerce a fronteira de schema, autenticação ou isolamento.
Impact: Um deploy incorretamente iniciado com lifespan desabilitado, ou uma futura injeção de manager não padrão, pode manter memória ativa sem a validação de compatibilidade. O harness pode produzir falsa confiança se for apresentado como evidência desses controles. No servidor ASGI normal com lifespan habilitado, não foi identificado intervalo de requisições antes do gate.
Evidence: `backend/main.py:36-71`, `backend/main.py:81-98`, `tests/e2e_app.py`, `tests/test_e2e_harness.py`.
Affected component: Startup, memory activation gate e test harness
Recommendation: Tornar lifespan obrigatório no contrato de deploy e no smoke test; preferencialmente inicializar memória desativada e habilitá-la somente após validação positiva. Documentar que o harness sintético não valida schema, autenticação nem isolamento e impedir seu uso fora de testes.
Blocking: NO

### SEC-001

ID: SEC-001
Severity: CRITICAL
Title: Identidade de usuário continua controlada pelo cliente
Description: HTTP confia em `X-Hope-User-Id` e WebSocket em `user_id`; UUID válido não autentica uma pessoa nem vincula a requisição a uma sessão. O delta não altera essa fronteira.
Impact: Spoofing e acesso cross-user a memórias, exclusões, contexto e eventos realtime.
Evidence: `backend/api/memory.py`, `backend/main.py`, `backend/realtime/router.py`, `frontend/js/storage.js`, `frontend/js/api-client.js`.
Affected component: Authentication, authorization, memória, chat e WebSocket
Recommendation: Implementar autenticação server-side, derivar identidade somente da sessão/token validado e aplicar autorização por recurso.
Blocking: YES

### SEC-002

ID: SEC-002
Severity: CRITICAL
Title: Chat, TTS e consulta ao Obsidian permanecem sem autenticação
Description: `/api/chat` e `/api/tts` podem acionar providers sem identidade autenticada; `use_vault=true` pode consultar Obsidian e devolver fontes.
Impact: Abuso de custos e cotas, indisponibilidade e divulgação de conteúdo privado.
Evidence: `backend/main.py`, `backend/services.py`, `backend/models.py`.
Affected component: Anthropic, ElevenLabs, Obsidian, chat e TTS
Recommendation: Exigir autenticação/autorização antes de providers e fontes privadas e impor quotas por usuário.
Blocking: YES

### SEC-003

ID: SEC-003
Severity: CRITICAL
Title: Runtime auditado do PostgreSQL ainda usa privilégios administrativos
Description: A separação entre URLs existe, mas a role restrita e o hardening ainda não foram comprovados no ambiente real.
Impact: Comprometimento da aplicação pode alcançar schema, controles e dados amplos.
Evidence: `backend/config.py`, `backend/database/session.py`, `docs/database-security.md`, `docs/reviews/database-audit-latest.md`.
Affected component: PostgreSQL, runtime role e migrations
Recommendation: Aplicar e validar role de runtime de privilégio mínimo; reservar administração às migrations.
Blocking: YES

### SEC-004

ID: SEC-004
Severity: HIGH
Title: WebSocket sem autenticação, validação de Origin e controles de abuso
Description: A conexão aceita UUID em query string sem credencial, validação de Origin ou limites adequados.
Impact: Espionagem de eventos, spoofing, exposição de identificadores e consumo de recursos.
Evidence: `backend/realtime/router.py`, `tests/test_realtime.py`.
Affected component: WebSocket e Event Bus
Recommendation: Autenticar handshake, derivar identidade da credencial, validar Origin e limitar conexões, tamanho e frequência.
Blocking: YES

### SEC-005

ID: SEC-005
Severity: HIGH
Title: Ausência de rate limiting, quotas e limites globais de payload
Description: Não há controles globais suficientes por usuário/IP, provider, concorrência e payload.
Impact: Negação de serviço, custo não controlado e pressão sobre banco e conexões.
Evidence: `backend/main.py`, `backend/api/memory.py`, `backend/memory/schemas.py`.
Affected component: HTTP, WebSocket, memória e providers
Recommendation: Aplicar limites por identidade autenticada e IP, quotas por operação/provider, timeouts e validação estrita.
Blocking: YES

### SEC-008

ID: SEC-008
Severity: HIGH
Title: TLS do PostgreSQL remoto não comprova validação completa do servidor
Description: A configuração auditada exige criptografia, mas ainda não comprova `verify-full` e hostname.
Impact: Rota ou resolução comprometida pode expor credenciais e dados a servidor impostor.
Evidence: `docs/database-security.md`, `docs/reviews/database-audit-latest.md`.
Affected component: Transporte PostgreSQL
Recommendation: Usar CA confiável, validação de hostname e `sslmode=verify-full`, com validação operacional controlada.
Blocking: YES

### SEC-012

ID: SEC-012
Severity: MEDIUM
Title: Ações sensíveis não possuem auditoria atribuível
Description: Não há trilha ligada a ator autenticado, sessão e requisição para exclusões, providers, vault e memória.
Impact: Incidentes e exclusões físicas não podem ser reconstruídos ou atribuídos de modo confiável.
Evidence: `backend/main.py`, `backend/api/memory.py`, `backend/ai/orchestrator.py`, `backend/services.py`.
Affected component: Logging, incident response, memória e integrações
Recommendation: Após autenticação, registrar eventos minimizados e imutáveis com request ID, ator, alvo, resultado e timestamp.
Blocking: YES

### Findings não bloqueantes herdados

- `SEC-009` — MEDIUM — prompt injection mitigada principalmente por instruções/delimitadores. Impacto: conteúdo não confiável pode influenciar respostas. Evidência: `backend/ai/orchestrator.py`, `backend/ai/context.py`, `backend/ai/prompts.py`. Recomendação: preservar proveniência e exigir autorização independente antes de efeitos. Blocking: NO.
- `SEC-010` — MEDIUM — proveniência e metadados aceitam atributos do cliente. Impacto: memory poisoning e falsa proveniência. Evidência: `backend/memory/schemas.py`, `backend/api/memory.py`. Recomendação: separar atributos declarados dos verificados e registrar origem autenticada. Blocking: NO.
- `SEC-011` — MEDIUM — proteção de embedding depende de ambiente declarado corretamente. Impacto: configuração de produção pode permanecer fail-open. Evidência: `backend/config.py`, `backend/memory/embeddings.py`. Recomendação: configuração explícita e falha de startup em produção insegura. Blocking: NO.
- `SEC-013` — MEDIUM — host e transporte web dependem de infraestrutura não comprovada. Impacto: proxy incorreto pode reduzir proteções. Evidência: `backend/main.py`, `docs/architecture.md`. Recomendação: validar HTTPS, HSTS, hosts e proxy headers. Blocking: NO.
- `SEC-014` — MEDIUM — supply chain sem lock com hashes e scanner obrigatório. Impacto: builds podem incorporar versões vulneráveis. Evidência: `requirements.txt`. Recomendação: lock reproduzível e scanners no CI. Blocking: NO.
- `SEC-015` — LOW — health público revela flags de dependências. Impacto: reconhecimento limitado da superfície e polling abusivo. Evidência: `backend/main.py`, `backend/services.py`. Recomendação: separar liveness mínima de readiness restrita. Blocking: NO.
- `SEC-016` — LOW — histórico opcional permanece em texto claro no navegador. Impacto: exposição em dispositivo compartilhado ou após XSS. Evidência: `frontend/js/storage.js`, `frontend/js/chat.js`. Recomendação: informar retenção, oferecer limpeza e minimizar dados. Blocking: NO.

## Security Status

- Feature Status: APPROVED_WITH_WARNINGS.
- Production Readiness: REJECTED/BLOCKED.
- `SEC-006`: RESOLVED_FOR_PHASE_SCOPE e confirmado no novo Functional Commit.
- `SEC-007`: RESOLVED_FOR_PHASE_SCOPE e confirmado no novo Functional Commit.
- Finding novo: `SEC-017` — MEDIUM, não bloqueante para o fluxo normal com lifespan habilitado.

## Critical Issues

- `SEC-001` — identidade controlada pelo cliente.
- `SEC-002` — providers e Obsidian sem autenticação.
- `SEC-003` — runtime auditado com privilégios administrativos.

## High

- `SEC-004` — WebSocket sem controles de autenticação e abuso.
- `SEC-005` — ausência de rate limiting e quotas.
- `SEC-008` — TLS do banco sem validação completa comprovada.

## Medium

- `SEC-009`, `SEC-010`, `SEC-011`, `SEC-012`, `SEC-013`, `SEC-014` e `SEC-017`.

## Low

- `SEC-015` e `SEC-016`.

## Deploy Blockers

- `SEC-001` — autenticação e autorização reais em HTTP e WebSocket.
- `SEC-002` — proteção de providers pagos e conteúdo privado do Obsidian.
- `SEC-003` — role de runtime restrita e hardening operacional do banco.
- `SEC-004` — autenticação, Origin e limites do WebSocket.
- `SEC-005` — rate limiting, quotas e limites globais.
- `SEC-008` — PostgreSQL com validação completa de certificado/hostname.
- `SEC-012` — auditoria atribuível para ações sensíveis.

Nenhum blocker novo foi introduzido pelo delta. Esses blockers são gerais de Production Readiness e não reabrem o escopo funcional da correção.

## Warnings

- O gate é executado no lifespan; a configuração de deploy deve proibir lifespan desabilitado.
- O harness E2E é sintético e não constitui evidência de compatibilidade de schema, autenticação ou isolamento entre usuários.
- A revisão exigida pode aparecer no diagnóstico, mas não é credencial; URLs, queries, parâmetros e exceções brutas permanecem omitidos.
- A exclusão confirmada continua física, sem recuperação, reautenticação, desafio one-time ou vínculo de versão.
- Não houve validação contra PostgreSQL real nem scanner completo de advisories/transitivas.

## Good Practices Found

- O gate usa comparação positiva e exata de revisão e falha fechado em ausência, incompatibilidade e exceção.
- O diagnóstico é controlado e não reutiliza texto da exceção.
- O manager, serviço e orquestrador antigos são removidos/recriados no modo degradado.
- O health retorna indisponibilidade sem dados de conexão ou detalhes brutos.
- `SEC-006` bloqueia todas as operações persistentes quando memória está desativada.
- `SEC-007` mantém confirmação vinculada ao UUID exato.
- O harness contém apenas dados sintéticos e não aciona sistemas externos.
- O delta não adiciona secrets, raw SQL inseguro ou regressões nas fronteiras já existentes.
- 45 testes Python, 27 testes focados e 19 testes frontend passaram.

## Recommendation

Aprovar com ressalvas o escopo funcional de `88e194778b4399a6713f118470f9d861c553cd9e`, manter `SEC-006` e `SEC-007` encerrados para a Fase 5 e registrar `SEC-017` como hardening não bloqueante. Não aprovar deploy público.

Next Action:
Role: COORDINATOR
Task: atualizar o Functional Commit oficial para `88e194778b4399a6713f118470f9d861c553cd9e`, registrar Security como APPROVED_WITH_WARNINGS, manter os blockers gerais de Production Readiness sem ampliá-los e encaminhar `SEC-017` ao planejamento de hardening do startup/harness.
Target commit: 88e194778b4399a6713f118470f9d861c553cd9e
