# Security Review

Commit reviewed: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
Baseline: `88e194778b4399a6713f118470f9d861c553cd9e`
Phase: 6 — Target UI Convergence
Date: 2026-09-16

## Result

APPROVED_WITH_WARNINGS

O Functional Commit da Phase 6 está aprovado com ressalvas para ambiente local/controlado. O delta visual preserva os controles de consentimento, histórico local, cancelamento, degradação e exclusão confirmada; não foi encontrada regressão de XSS, links perigosos, CSP, secrets, memória, voz ou realtime que bloqueie a feature.

Este resultado não aceita risco HIGH/CRITICAL nem autoriza exposição pública. Production Readiness permanece `REJECTED / BLOCKED` pelos findings históricos `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `SEC-008` e `SEC-012`. Esses blockers não pertencem ao escopo corretivo da Phase 6.

## Scope and Commit Boundary

- Functional Commit revisado: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`.
- Baseline aprovado: `88e194778b4399a6713f118470f9d861c553cd9e`.
- HEAD observado antes do relatório: `e1f2e697a32b9a38f4172c2303f09255a901df39`, posterior ao alvo somente por commits documentais de Development/Coordination.
- Branch observada: `codex/phase-6-target-ui`.
- O commit funcional altera frontend, testes e evidências da Phase 6; não altera backend, API, schema, query, banco, migration, provider, configuração de produção ou credenciais.
- Mudanças preexistentes em `AGENTS.md`, `Hope dashboard` e `hope-linkedin-hero*` foram preservadas e não pertencem ao commit revisado.

## Independent Validation

- `git diff --check 88e1947..0912e94`: aprovado.
- Python: 45 testes aprovados; um warning preexistente Starlette/TestClient.
- Frontend: 36 testes aprovados, incluindo consentimento, confirmação por UUID, renderização inerte, protocolos perigosos, histórico e realtime.
- Sintaxe/imports: `compileall` e `node --check` aprovados para os módulos alterados.
- Browser independente em harness descartável e diretório temporário:
  - matriz de sete viewports, opt-in, chat, HTML inerte, fontes/memórias por resposta, inspector e cancelamento: aprovado;
  - 11 cenários de fluxos para opt-in/out, histórico, fallback WebGL, estados degradados, voz e exclusão segura: aprovados;
  - exclusão sem confirmação e com UUID divergente retornou 428; confirmação correta enviou o UUID exato e removeu somente a fixture sintética.
- Nenhum arquivo de evidência do DEV foi reescrito pela repetição independente.
- Busca de credential patterns no delta funcional: zero ocorrências novas; nenhum `.env` sensível está versionado.
- Nenhum provider pago, banco real, migration, credencial, conteúdo pessoal ou sistema externo foi acionado.

## Controls Confirmed

### Consentimento e memória

- `Memória no chat` permanece desativada por padrão e separada de `Histórico local`.
- Ativar/desativar histórico não altera o opt-in de memória, e desativar histórico remove a conversa do `localStorage`.
- O payload de chat usa o valor corrente e explícito de `memory_enabled`; controles ficam bloqueados durante a requisição.
- Lista, busca, inspector e fallback WebGL permitem explorar memórias existentes, mas não ativam recuperação/captura no chat automaticamente.
- `Perguntar` apenas prepara um prompt visível; não envia conteúdo nem ativa memória sem uma ação posterior do usuário.
- Estados `loading`, `empty`, `unavailable` e `error` mantêm o chat funcional sem alegar memória disponível.

### Exclusão e ações destrutivas

- A confirmação continua normalizando e validando UUID antes de abrir o diálogo.
- O diálogo mantém alvo, consequência, foco inicial em `Cancelar`, Escape e bloqueio durante `submitting`.
- O cliente envia `X-Hope-Confirm-Memory-Id` com o mesmo UUID usado na rota DELETE.
- O backend continua rejeitando confirmação ausente ou divergente com 428.
- Cancelamento, erro e fallback WebGL não criam caminho alternativo para exclusão silenciosa.

### XSS, DOM, links e CSP

- Conteúdo de memórias, entidades, proveniência, relações, tooltips, status e erros novos é inserido com `textContent`, `createTextNode` ou elementos DOM explícitos.
- Não foram introduzidos `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `document.write` ou geração dinâmica de scripts.
- O renderer de Markdown permanece allowlist limitado; HTML/SVG fica texto inerte.
- Links continuam restritos a `http:` e `https:` e usam `noopener noreferrer`; `javascript:` e `data:text/html` são rejeitados.
- Não há CDN, import remoto, fonte externa, iframe ou conteúdo ativo novo.
- O backend/CSP não foi alterado; `object-src 'none'`, `frame-ancestors 'none'` e `nosniff` permanecem cobertos pela regressão Python.

### Voz, realtime e WebGL

- Estado `listening` só nasce do callback real de reconhecimento; estado desconhecido volta a idle.
- TTS cancelado não mantém reprodução nem permite que resposta antiga substitua a mais recente.
- Eventos realtime aceitam somente os tipos já allowlisted; IDs de foco/inspeção precisam existir no grafo normalizado.
- Perda de WebGL troca para lista/inspector com o mesmo payload; retry não cria dados ou bypass de consentimento.
- Perfis LOW/MEDIUM/HIGH/ULTRA limitam renderização, mas lista e contagens permanecem baseadas no payload real.

### Claims e escopo

- Foram omitidos Visão, Arquivos, Automação, tools, coding, skills, agents, perfil/conta, navegação sem destino e métricas sem fonte.
- Estados, contagens, categorias e relações apresentados derivam do payload/health/realtime existente.
- O evidence package identifica dados sintéticos e dashboard ainda aguardando reviews; não declara produção validada.
- O commit não introduz backend, contrato de API, schema, banco, migration, provider, credencial ou deploy.

## Findings

### SEC-018

ID: SEC-018
Severity: LOW
Title: Harness de navegador herda ambiente amplo e depende de guardas operacionais para o cenário destrutivo
Description: O runner recomendado possui boas guardas — recusa porta ocupada, inicia `tests.e2e_app`, usa localhost e fixtures sintéticas — porém propaga todo `process.env` ao subprocesso e limpa somente quatro variáveis. `DATABASE_ADMIN_URL`, `OBSIDIAN_API_KEY` e outros valores do ambiente/`.env` podem permanecer carregados no processo de teste, embora o manager e os serviços sejam mocks. Além disso, `phase-6-flows.mjs` pode ser executado individualmente contra a porta fixa e contém uma chamada DELETE; sua proteção contra alvo incorreto depende de documentação, UUID/título sintéticos e do uso do runner oficial, não de um nonce/sentinel emitido pelo harness.
Impact: Em execução fora do fluxo documentado, credenciais desnecessárias podem ficar presentes no processo descartável e um serviço local incorreto pode receber requisições destrutivas de teste. No fluxo oficial revisado, a porta exclusiva, os mocks, o alvo sintético e a checagem do conteúdo reduzem substancialmente a probabilidade e o alcance.
Evidence: `tests/browser/run.mjs:5-13`; `tests/browser/phase-6-flows.mjs:6-8`; `tests/browser/phase-6-flows.mjs:146-176`; `docs/evidence/phase-6/README.md`.
Affected component: Test harness, fixtures, secret hygiene e destructive test safety
Recommendation: Construir uma allowlist mínima de variáveis para o subprocesso, fixar `APP_ENVIRONMENT=test`, limpar explicitamente toda variável de credencial/configuração sensível e usar porta aleatória com nonce/sentinel de harness obrigatório antes de qualquer DELETE. Fazer os scripts destrutivos recusarem execução direta sem esse marcador.
Blocking: NO

## Historical Findings Carried Forward

Os findings abaixo não foram alterados nem aceitos pela Phase 6:

- `SEC-001` — CRITICAL, Blocking: YES — identidade/owner ainda depende de UUID controlado pelo cliente. Evidência: `frontend/js/storage.js`, `frontend/js/api-client.js`, `backend/api/memory.py`, `backend/realtime/router.py`. Impacto: spoofing do namespace e acesso indevido em exposição remota. Recomendação: reconhecimento server-side do único owner e autorização por recurso na Phase 7.
- `SEC-002` — CRITICAL, Blocking: YES — chat, TTS e Obsidian ainda não possuem fronteira de owner autenticada. Evidência: `backend/main.py`, `backend/services.py`. Impacto: abuso de providers e conteúdo privado. Recomendação: proteger integrações antes de exposição.
- `SEC-003` — CRITICAL, Blocking: YES — privilégio mínimo do runtime PostgreSQL ainda não foi comprovado no ambiente real. Evidência: `docs/reviews/database-audit-latest.md`, `docs/database-security.md`. Impacto: comprometimento amplo do banco. Recomendação: role restrita e hardening operacional autorizado.
- `SEC-004` — HIGH, Blocking: YES — WebSocket continua sem owner authentication, Origin e limites de abuso. Evidência: `backend/realtime/router.py`, `frontend/js/realtime.js`. Impacto: spoofing, espionagem de eventos e consumo de recursos. Recomendação: handshake autenticado e controles de conexão/mensagem.
- `SEC-005` — HIGH, Blocking: YES — rate limiting, quotas e limites operacionais globais permanecem ausentes. Evidência: `backend/main.py`, `backend/realtime/router.py`. Impacto: DoS e custos. Recomendação: limites por owner/IP/operação/provider.
- `SEC-008` — HIGH, Blocking: YES — PostgreSQL real ainda não comprova TLS `verify-full`. Evidência: `docs/reviews/database-audit-latest.md`, `docs/database-security.md`. Impacto: servidor impostor e exposição de dados/credenciais. Recomendação: CA e hostname validados.
- `SEC-012` — MEDIUM, Blocking: YES — ações sensíveis não têm auditoria atribuível ao owner. Evidência: `backend/api/memory.py`, `backend/services.py`. Impacto: baixa capacidade de investigação e responsabilização. Recomendação: auditoria minimizada após reconhecimento do owner.
- `SEC-009`, `SEC-010`, `SEC-011`, `SEC-013`, `SEC-014` — MEDIUM, Blocking: NO — prompt/memory poisoning, proveniência declarada, configuração fail-open, contrato web e supply chain permanecem warnings de hardening.
- `SEC-015`, `SEC-016` — LOW, Blocking: NO — health público e histórico local em texto claro permanecem warnings.
- `SEC-017` — MEDIUM, Blocking: NO — gate de schema continua dependente do lifespan; harness sintético não comprova schema/autenticação/isolamento.

## Security Status

- Feature Status: APPROVED_WITH_WARNINGS.
- Production Readiness: REJECTED / BLOCKED.
- Finding novo da Phase 6: `SEC-018` — LOW, Blocking: NO.
- Findings HIGH/CRITICAL novos: nenhum.
- Blockers funcionais novos: nenhum.
- `SEC-006` e `SEC-007`: permanecem efetivos para o escopo funcional.

## Critical Issues

Nenhum novo no delta. Permanecem `SEC-001`, `SEC-002` e `SEC-003` como blockers gerais de produção.

## High

Nenhum novo no delta. Permanecem `SEC-004`, `SEC-005` e `SEC-008` como blockers gerais de produção.

## Medium

Nenhum novo no delta. Findings históricos não bloqueantes permanecem documentados, incluindo `SEC-017`.

## Low

- `SEC-018` — isolamento do ambiente e sentinel do harness de navegador.
- `SEC-015` e `SEC-016` permanecem herdados.

## Deploy Blockers

- `SEC-001` — reconhecimento/autorização real do único owner.
- `SEC-002` — proteção de providers e conteúdo privado do Obsidian.
- `SEC-003` — role de runtime restrita e hardening operacional do banco.
- `SEC-004` — autenticação, Origin e limites do WebSocket.
- `SEC-005` — rate limiting, quotas e limites globais.
- `SEC-008` — PostgreSQL com validação completa de certificado/hostname.
- `SEC-012` — auditoria atribuível para ações sensíveis.

Nenhum deploy blocker foi introduzido ou encerrado pelo Functional Commit da Phase 6.

## Warnings

- `SEC-018`: executar os scripts destrutivos somente pelo runner descartável documentado até haver sentinel técnico e ambiente allowlisted.
- O UUID de desenvolvimento continua sendo namespace transitório, não prova do owner.
- O fallback/lista expõe memórias existentes ao navegador como parte da UI local; isso é separado do opt-in de envio/recuperação no chat e ainda depende da futura fronteira de owner.
- A exclusão continua física e sem recuperação, reautenticação ou token one-time; a confirmação por UUID reduz erro de alvo, mas não substitui Production Hardening.
- Browser fixtures, WebGL sintético, PCM local e screenshots não validam providers, banco, hardware móvel ou produção.

## Good Practices Found

- Consentimento de memória visível, separado do histórico e enviado explicitamente em cada chat.
- Conteúdo não confiável renderizado sem sinks HTML e com protocolo de link allowlisted.
- Fontes e memórias usadas ficam associadas à resposta sem inserir conteúdo ativo.
- Confirmação destrutiva preserva alvo, consequência, Cancelar inicial, Escape, estado submitting e UUID exato.
- Estados degradados explicam indisponibilidade sem expor erro interno, URL, query ou credencial.
- Lista e inspector usam o mesmo payload real do WebGL; não existem nós, métricas ou capacidades simuladas no produto.
- Voz e realtime usam allowlists de estado/evento e ignoram callbacks/eventos obsoletos.
- O runner oficial recusa porta ocupada, usa loopback, mocks e alvo sintético verificado.
- Evidências visuais são rotuladas como dados de teste e implementação aguardando review.
- Nenhum backend, schema, migration, provider ou secret entrou no Functional Commit.

## Recommendation

Aprovar com ressalvas a Feature Status da Phase 6 no Functional Commit exato `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`. Registrar `SEC-018` como hardening não bloqueante do harness. Manter Production Readiness `BLOCKED` e não ampliar esta fase com correções históricas de produção.

Next Action:
Role: COORDINATOR
Task: registrar SECURITY como `APPROVED_WITH_WARNINGS` para `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`, manter os blockers históricos de produção e encaminhar `SEC-018` ao backlog de hardening de testes sem reabrir o escopo visual.
Target commit: `0912e9492370f6bce8c51762d1a8a87b5bd16aa8`
