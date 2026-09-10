# Security Review

Commit reviewed: 19e573893aba09da990256da05e7dab5af165ce1
Phase: 5
Date: 2026-09-10

## Result

APPROVED_WITH_WARNINGS

O escopo funcional do commit está aprovado com ressalvas: SEC-006 foi corrigido, e SEC-007 foi corrigido para o contrato da Fase 5. O parecer não aprova deploy público. A Production Readiness permanece REJECTED/BLOCKED pelos findings SEC-001, SEC-002, SEC-003, SEC-004, SEC-005, SEC-008 e SEC-012.

### Re-review das correções funcionais

- SEC-006 — RESOLVED_FOR_PHASE_SCOPE: memory_enabled=false é o padrão do contrato; o backend não recupera, injeta, registra como ferramenta nem captura memória, e recusa comandos de memória enquanto o opt-in estiver desligado. O histórico local continua sendo uma preferência separada.
- SEC-007 — RESOLVED_FOR_PHASE_SCOPE: linguagem natural não exclui mais dados. O backend retorna um alvo estruturado; o frontend apresenta diálogo modal com alvo e consequência, foco inicial em “Cancelar” e cancelamento por Escape; a API exige que o ID confirmado corresponda ao ID da rota e retorna 428 quando ausente ou divergente.
- Risco residual: a exclusão continua física, sem recuperação, reautenticação, token de confirmação one-time ou vínculo com a versão exibida da memória. Isso permanece restrição de produção e é agravado por SEC-001 e SEC-012, mas não reabre os blockers funcionais no ambiente local/controlado.

## Validation

- Branch observada: main.
- HEAD observado: 563cdf93ac3992d780d5aa500719d23625c69b11, posterior ao alvo apenas por commits documentais.
- Target diff: 18 arquivos, 358 adições e 50 remoções; nenhum schema, migration, provider ou secret foi alterado.
- Python: 42 testes aprovados; um aviso de depreciação Starlette/TestClient.
- Frontend: 19 testes aprovados.
- Dependências instaladas: pip check sem inconsistências.
- git diff --check do target: aprovado.
- Secrets: .env ignorado e não rastreado; nenhum marcador conhecido de credencial foi encontrado no target ou na busca histórica segura.
- Não foram usados providers pagos, conteúdo real do Obsidian, exploração externa, alteração de banco ou ação destrutiva.

## Findings

### SEC-001

ID: SEC-001
Severity: CRITICAL
Title: Identidade de usuário continua controlada pelo cliente
Description: HTTP confia em X-Hope-User-Id e WebSocket confia em user_id; validar UUID não autentica uma pessoa nem vincula a requisição a uma sessão. O commit alvo não altera essa fronteira.
Impact: Spoofing e acesso cross-user a memórias, exclusões, contexto do chat e eventos realtime quando um UUID alheio é conhecido ou exposto.
Evidence: backend/api/memory.py:34-49; backend/main.py; backend/realtime/router.py; frontend/js/storage.js; frontend/js/api-client.js.
Affected component: Authentication, authorization, memória, chat e WebSocket
Recommendation: Implementar autenticação server-side e derivar o usuário exclusivamente da sessão/token validado; aplicar autorização por recurso em todos os fluxos.
Blocking: YES

### SEC-002

ID: SEC-002
Severity: CRITICAL
Title: Chat, TTS e consulta ao Obsidian permanecem sem autenticação
Description: /api/chat e /api/tts podem acionar Anthropic e ElevenLabs sem identidade autenticada; use_vault=true pode consultar Obsidian e devolver fontes com excertos.
Impact: Abuso de custos e cotas, indisponibilidade e possível divulgação de conteúdo privado do vault.
Evidence: backend/main.py; backend/services.py; backend/models.py:28-32.
Affected component: Anthropic, ElevenLabs, Obsidian, chat e TTS
Recommendation: Exigir autenticação e autorização antes de providers e fontes privadas; limitar quotas e exposição de excertos por usuário.
Blocking: YES

### SEC-003

ID: SEC-003
Severity: CRITICAL
Title: Runtime auditado do PostgreSQL ainda usa privilégios administrativos
Description: A linhagem suporta separar DATABASE_URL e DATABASE_ADMIN_URL, mas a role restrita e a migration de hardening ainda não foram aplicadas no ambiente real auditado. 19e5738 não muda esse estado.
Impact: Comprometimento da aplicação pode alcançar alteração de schema, bypass de controles e perda ampla de dados.
Evidence: backend/config.py; backend/database/session.py; docs/database-security.md; confirmação operacional mascarada em docs/reviews/database-audit-latest.md e docs/handoff.md.
Affected component: PostgreSQL, runtime role e migrations
Recommendation: Criar role de runtime de privilégio mínimo, reservar a role administrativa às migrations e aplicar/validar o hardening em janela autorizada com rollback.
Blocking: YES

### SEC-004

ID: SEC-004
Severity: HIGH
Title: WebSocket sem autenticação, validação de Origin e controles de abuso
Description: A conexão aceita UUID em query string sem credencial, validação de Origin, limite de conexões, tamanho ou frequência. O tratamento controlado de JSON malformado permanece uma boa correção herdada.
Impact: Espionagem de eventos, spoofing, consumo de recursos e exposição de identificadores em logs de URL.
Evidence: backend/realtime/router.py; tests/test_realtime.py.
Affected component: WebSocket e Event Bus
Recommendation: Autenticar o handshake, derivar a identidade da credencial, validar Origin, limitar conexões/mensagens e retirar identidade sensível da URL.
Blocking: YES

### SEC-005

ID: SEC-005
Severity: HIGH
Title: Ausência de rate limiting, quotas e limites globais de payload
Description: Não há controle global por usuário/IP, quotas de provider, limite de concorrência ou proteção completa contra payloads e metadados excessivos.
Impact: Negação de serviço, custo não controlado, pressão no banco e abuso de conexões.
Evidence: backend/main.py; backend/api/memory.py; backend/memory/schemas.py; ausência de middleware de rate limiting no target.
Affected component: HTTP, WebSocket, memória e providers
Recommendation: Aplicar limites por identidade autenticada e IP, quotas por operação/provider, timeouts, concorrência e validação estrita de tamanho/profundidade.
Blocking: YES

### SEC-008

ID: SEC-008
Severity: HIGH
Title: TLS do PostgreSQL remoto não valida completamente servidor e hostname
Description: A configuração operacional auditada exige criptografia, mas não comprova verify-full. O commit alvo não altera configuração de transporte.
Impact: Uma rota ou resolução comprometida pode direcionar a aplicação a servidor impostor e expor credenciais ou dados.
Evidence: inspeção mascarada registrada pela auditoria de banco e orientação em docs/database-security.md.
Affected component: Transporte PostgreSQL
Recommendation: Usar CA confiável e validação de hostname com sslmode=verify-full; validar em ambiente controlado antes do deploy.
Blocking: YES

### SEC-012

ID: SEC-012
Severity: MEDIUM
Title: Ações sensíveis não possuem auditoria atribuível
Description: Não há trilha de segurança ligada a ator autenticado, sessão e requisição para exclusões, uso de providers, vault e alterações de memória.
Impact: Incidentes não podem ser reconstruídos ou atribuídos de forma confiável; exclusões físicas ficam sem responsabilização operacional.
Evidence: backend/main.py; backend/api/memory.py; backend/ai/orchestrator.py; backend/services.py.
Affected component: Logging, incident response, memória e integrações
Recommendation: Após autenticação, registrar eventos minimizados e imutáveis com request ID, ator, alvo, resultado e timestamp, sem conteúdo privado ou secrets.
Blocking: YES

### SEC-009

ID: SEC-009
Severity: MEDIUM
Title: Prompt injection é mitigada principalmente por instruções e delimitadores
Description: Memória, Obsidian e web são serializados e marcados como dados não confiáveis, mas permanecem no conteúdo enviado ao modelo. Não há executor genérico de ferramentas no escopo atual.
Impact: Conteúdo malicioso pode influenciar respostas e amplia o risco futuro quando ferramentas com efeitos forem adicionadas.
Evidence: backend/ai/orchestrator.py; backend/ai/context.py; backend/ai/prompts.py.
Affected component: AI, memória, Obsidian, Tavily e futuras tools
Recommendation: Preservar proveniência e separação estruturada, validar saídas e exigir autorização/confirmação independente antes de efeitos sensíveis.
Blocking: NO

### SEC-010

ID: SEC-010
Severity: MEDIUM
Title: Proveniência e metadados de memória ainda aceitam atributos do cliente
Description: Clientes podem declarar tipo, fonte, confiança, flags e metadados sem uma identidade ou pipeline verificado.
Impact: Memory poisoning e falsa proveniência podem contaminar recuperação e confiança aparente.
Evidence: backend/memory/schemas.py; backend/api/memory.py.
Affected component: Memory ingestion e provenance
Recommendation: Separar atributos declarados de atributos verificados; aplicar allowlists/limites e registrar origem autenticada.
Blocking: NO

### SEC-011

ID: SEC-011
Severity: MEDIUM
Title: Proteção de embedding de produção depende de ambiente declarado corretamente
Description: APP_ENVIRONMENT assume development; esquecer a variável em produção mantém uma configuração fail-open.
Impact: Deploy incorreto pode usar embeddings inadequados sem falhar na inicialização.
Evidence: backend/config.py; backend/memory/embeddings.py.
Affected component: Configuração de produção e embeddings
Recommendation: Exigir configuração explícita e falhar ao iniciar quando valores críticos de produção estiverem ausentes ou inseguros.
Blocking: NO

### SEC-013

ID: SEC-013
Severity: MEDIUM
Title: Host e transporte web dependem de infraestrutura ainda não comprovada
Description: CSP, framing e nosniff existem, mas não há contrato revisável de hosts permitidos, HTTPS obrigatório e HSTS no deploy.
Impact: Deploy direto ou proxy incorreto pode permitir host-header abuse ou transporte sem as proteções esperadas.
Evidence: backend/main.py; docs/architecture.md.
Affected component: Web deployment e reverse proxy
Recommendation: Documentar e validar HTTPS, HSTS, hosts permitidos, proxy headers confiáveis e cookies seguros quando sessões existirem.
Blocking: NO

### SEC-014

ID: SEC-014
Severity: MEDIUM
Title: Supply chain sem lock com hashes e scanner obrigatório
Description: Requisitos usam faixas amplas e não há lock reproduzível com hashes ou scanner de vulnerabilidades no CI. pip check passou, mas não substitui análise de advisories.
Impact: Builds diferentes podem incorporar regressões ou versões vulneráveis sem revisão explícita.
Evidence: requirements.txt; resultado local de pip check.
Affected component: Dependências e build
Recommendation: Adotar lock com hashes, atualização controlada e scanner de secrets/dependências no CI.
Blocking: NO

### SEC-015

ID: SEC-015
Severity: LOW
Title: Health check expõe detalhes de dependências ativas
Description: O endpoint informa disponibilidade/configuração de providers e pode consultar dependências externas sem autenticação.
Impact: Reconhecimento da superfície e amplificação de carga por polling abusivo.
Evidence: backend/main.py; backend/services.py.
Affected component: Health endpoint
Recommendation: Separar liveness pública mínima de readiness restrita e aplicar cache/timeouts.
Blocking: NO

### SEC-016

ID: SEC-016
Severity: LOW
Title: Histórico opcional permanece em texto claro no navegador
Description: Quando habilitado, o histórico é armazenado em localStorage.
Impact: Conversas podem ser expostas em dispositivo compartilhado ou após XSS na mesma origem.
Evidence: frontend/js/storage.js; frontend/js/chat.js.
Affected component: Frontend e privacidade local
Recommendation: Informar retenção, oferecer limpeza, minimizar dados e migrar para armazenamento protegido por identidade quando disponível.
Blocking: NO

## Security Status

- Functional Security: APPROVED_WITH_WARNINGS.
- Production Readiness: REJECTED/BLOCKED.
- SEC-006: RESOLVED_FOR_PHASE_SCOPE.
- SEC-007: RESOLVED_FOR_PHASE_SCOPE.

## Critical Issues

- SEC-001 — identidade controlada pelo cliente.
- SEC-002 — providers e Obsidian sem autenticação.
- SEC-003 — runtime auditado com privilégios administrativos.

## High

- SEC-004 — WebSocket sem controles de autenticação e abuso.
- SEC-005 — ausência de rate limiting e quotas.
- SEC-008 — TLS do banco sem validação completa.

## Medium

- SEC-009, SEC-010, SEC-011, SEC-012, SEC-013 e SEC-014.

## Low

- SEC-015 e SEC-016.

## Deploy Blockers

- SEC-001 — autenticação e autorização reais em HTTP e WebSocket.
- SEC-002 — proteção de providers pagos e conteúdo privado do Obsidian.
- SEC-003 — role de runtime restrita e hardening operacional do banco.
- SEC-004 — autenticação, Origin e limites do WebSocket.
- SEC-005 — rate limiting, quotas e limites globais.
- SEC-008 — PostgreSQL com validação completa de certificado/hostname.
- SEC-012 — auditoria atribuível para ações sensíveis.

## Warnings

- A exclusão confirmada ainda é física e o cabeçalho de confirmação não substitui autenticação, reautenticação, desafio one-time, vínculo de versão, soft delete ou recuperação.
- Desativar “Memória no chat” impede nova recuperação/captura, mas não apaga automaticamente texto derivado de memória que já esteja visível no histórico da conversa; a interface deve manter essa distinção clara.
- O Database Audit vigente ainda precisa confirmar operacionalmente migration, role, TLS e busca vetorial; este Security Review não alterou o banco.
- Não foi executado scanner completo de advisories/transitivas nem scanner dedicado de secrets.
- O relatório de Database Audit no working tree contém metadados identificáveis de infraestrutura; devem ser minimizados antes de versionamento pelo respectivo owner.
- Tavily e outros conteúdos externos devem continuar tratados como dados não confiáveis, nunca como instruções ou autorização de tools.

## Good Practices Found

- O consentimento de memória é false por padrão e aplicado antes da recuperação, captura e comandos.
- O opt-out não publica estado searching, não injeta memory_context e não anuncia uso de memory_retriever.
- Histórico local e memória persistente usam controles separados; preferência legada não ativa memória silenciosamente.
- Esquecimento por linguagem natural não executa mais a exclusão.
- O diálogo usa texto inerte, mostra alvo/consequência, inicia em Cancelar e preserva cancelamento por Escape.
- O backend rejeita confirmação ausente ou de alvo divergente com 428.
- O target não adiciona secrets; .env permanece ignorado e não rastreado.
- Renderização continua baseada em text nodes; CSP, frame-ancestors none e nosniff permanecem presentes.
- SQL de domínio permanece parametrizado e parâmetros de conexão/consulta permanecem protegidos nos logs.
- JSON WebSocket malformado continua encerrado de modo controlado com código 1008.
- 42 testes Python e 19 testes frontend passaram.

## Recommendation

Aprovar com ressalvas o escopo funcional de 19e573893aba09da990256da05e7dab5af165ce1 e considerar SEC-006 e SEC-007 encerrados para a Fase 5 local/controlada. Não aprovar deploy público.

Next Action:
Role: COORDINATOR / PLANNER
Task: consolidar o fechamento dos blockers funcionais após QA e UI/UX; manter os blockers de Production Readiness visíveis e encaminhá-los às fases/autorizações apropriadas.
Target commit: 19e573893aba09da990256da05e7dab5af165ce1
