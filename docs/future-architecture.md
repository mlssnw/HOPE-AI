# Arquitetura futura da HOPE

- Status: TARGET ARCHITECTURE — READY_FOR_APPROVAL
- Decision: `ARCH-2026-09-10-003`
- Date: 2026-09-10
- Product model: `SINGLE_USER`
- Functional baseline: `88e194778b4399a6713f118470f9d861c553cd9e`
- Documentation baseline analyzed: `3c8e978e2dc5d9c0deff62a8a5a9ebb1f7c4d2c6`
- Supersedes: o segmento multiusuário/enterprise do roadmap de `ARCH-2026-09-04-001`
- Preserves: a consolidação da Fase 5 em `ARCH-2026-09-10-002`

Este documento descreve direção arquitetural. Não declara capacidade implementada, não inicia fase, não autoriza Development e não permite migration, produção, provider, credencial ou custo.

## VISION

A HOPE é uma assistente pessoal destinada a um único owner. Ela deve reconhecer esse owner, proteger seus dados e governar efeitos reais sem carregar a complexidade de uma plataforma SaaS multiusuário.

O núcleo continua cloud-first e provider-agnostic. `SINGLE_USER` significa um único principal humano autorizado, não ausência de segurança: tools, agentes e integrações continuam sendo atores técnicos não confiáveis por padrão e recebem somente capacidades delegadas, limitadas e revogáveis.

## CORE PRINCIPLES

1. Segurança, verdade e precisão precedem conveniência e personalidade.
2. Existe um único owner; não existem cadastro público, tenants, organizações ou RBAC empresarial no roadmap imediato.
3. Reconhecimento do owner, autorização do recurso e decisão de risco são controles separados.
4. Nenhum identificador fornecido pelo navegador prova identidade.
5. Providers permanecem atrás de contratos estreitos quando isso evita lock-in real.
6. Tools são operações atômicas; skills são procedimentos versionados; agentes são executores limitados.
7. Uma delegação transfere somente um subconjunto de capacidades; nunca credenciais brutas ou poder de autoelevação.
8. Conteúdo de prompt, memória, web, arquivo ou provider é dado não confiável e nunca concede permissão.
9. Aprovações são vinculadas ao owner, ação, alvo, parâmetros, ambiente e prazo; não são reutilizáveis por semelhança.
10. Fases são pequenas, testáveis, reversíveis e exigem aprovação antes da implementação.
11. Feature readiness, acesso remoto e Production Readiness são estados independentes.
12. PostgreSQL continua sendo a persistência principal; binários grandes pertencem a object storage quando essa fase existir.

## PERSONALITY

A HOPE mantém identidade original, inteligente, técnica, elegante, pragmática e assertiva. Referências culturais fornecem apenas traços gerais; identidades, falas, bordões, histórias e maneirismos reconhecíveis não podem ser copiados.

A personalidade nunca altera a ordem segurança → verdade → precisão → objetivo legítimo → estilo. Memórias, preferências, experiências, skills, conteúdo externo e agentes não podem reescrever esse núcleo. Estados expressivos continuam sinalização operacional, não alegação de consciência humana.

## CURRENT TRUST GAP

O frontend atual cria um UUID em `localStorage`, envia `X-Hope-User-Id` por HTTP e `user_id` na query do WebSocket. O backend valida o formato, mas não prova que a requisição pertence ao owner. Os filtros por `user_id` reduzem mistura acidental de dados, porém não são autenticação.

O schema possui `users.id` e `user_id` em memórias, relações, entidades, conversas e eventos. Esses campos serão preservados como namespace interno do owner até existir justificativa e migration aprovada para simplificá-los. Preservá-los evita uma reescrita arriscada e continua útil para integridade, provenance e eventual recuperação.

## TARGET ARCHITECTURE

```text
Owner
  │ credencial proporcional ao ambiente
  ▼
OwnerAuthenticator ──► OwnerSession ──► OwnerContext
                                           │
Request / Task / Agent ─────────────────────┤
                                           ▼
                                  ResourceAuthorizer
                                           │
                                           ▼
                                   PermissionManager
                               ALLOW | DENY | CONFIRM
                                           │
                                           ▼
                               Tool / Provider / Effect
                                           │
                                           ▼
                               Minimal Audit + Result
```

Responsabilidades:

- `OwnerAuthenticator`: valida a credencial adequada ao ambiente e cria uma sessão do único owner.
- `OwnerSession`: é curta, revogável, protegida contra leitura por JavaScript quando transportada por cookie e não contém secret exposto em URL.
- `OwnerContext`: identidade server-side derivada da sessão; nunca aceita `user_id` do payload, header ou query como autoridade.
- `ResourceAuthorizer`: verifica se o recurso e seu caminho/namespace estão dentro do escopo permitido.
- `PermissionManager`: classifica o risco da ação e decide `ALLOW`, `DENY` ou `REQUIRE_CONFIRMATION`.
- `Executor`: executa somente após as três fronteiras anteriores e recebe credenciais por referência interna de mínimo privilégio.
- `AuditRecorder`: registra decisão e resultado minimizados, sem token, secret, prompt bruto ou conteúdo privado completo.

Além da fronteira de owner/permissões, a arquitetura continua modular: Orchestrator coordena intenção; ModelRouter seleciona capacidade/provider; SkillRegistry versiona procedimentos; AgentRuntime executa envelopes limitados; Tool Registry declara efeitos; Learning registra evidência sem alterar regras centrais.

## LEARNING ARCHITECTURE

Learning futuro ocorre por registros controlados, nunca por autoedição do core ou atualização irrestrita de pesos.

- `LearningManager`: coordena ingestão, consolidação e aplicação segura.
- `FeedbackManager`: liga feedback à saída, tarefa e versão.
- `PreferenceLearner`: propõe preferências com confiança e escopo.
- `ExperienceManager`: registra e recupera resultados de tarefas.
- `ProcedureLearner`: propõe sequências reutilizáveis após evidência repetida.
- `SkillManager`: governa promoção para skills versionadas.
- `EvaluationManager`: mede resultado, qualidade, custo e latência.

Taxonomia preservada: `MEMORY`, `PREFERENCE`, `EXPERIENCE`, `PROCEDURE` e `SKILL`. Uma ocorrência isolada não cria preferência global, procedimento ou permissão.

## EXPERIENCE MEMORY

Uma experiência registra owner namespace, tipo de tarefa, objetivo, contexto minimizado, abordagem, tools/models, resultado, falha/correção, custo, latência, confiança, execution ID e proveniência.

- Separar observação de lição inferida.
- Armazenar resumos, nunca secrets, prompts brutos ou payloads desnecessários.
- Recuperar por relevância e compatibilidade de contexto.
- Exigir repetição, avaliação ou confirmação do owner antes de consolidar.
- Permitir correção, expiração, revogação de uso e esquecimento.
- Nunca transformar experiência em grant, approval ou regra central.

## OWNER RECOGNITION

Reconhecer o owner é provar que uma sessão pertence à única pessoa autorizada. Não é criar um diretório de contas.

### Local controlled profile

- Bind padrão em loopback e mesma origem.
- Pareamento inicial com segredo aleatório de uso único exibido por canal local confiável.
- Segredo durável, quando necessário, no cofre do sistema operacional; nunca em `localStorage`, repositório ou log.
- Após pareamento, o servidor emite sessão opaca, curta e revogável; reinício pode invalidar sessões no desenho inicial.
- Endpoints protegidos falham fechados quando o owner não está reconhecido.

### Remote or cloud profile

- Antes de qualquer exposição, usar passkey/WebAuthn ou OIDC configurado para aceitar exatamente um subject autorizado.
- Cookie `HttpOnly`, `Secure`, `SameSite` e política de CSRF/Origin compatível com a topologia escolhida.
- WebSocket deriva a sessão do handshake, valida `Origin` por allowlist exata e nunca recebe token ou `user_id` em query string.
- Recuperação de acesso, rotação, expiração e revogação são definidas antes do deploy.

### Provider options

| Option | Pros | Cons | Cost/operation | Recommendation |
|---|---|---|---|---|
| Pareamento local + cofre do SO | baixo custo, sem conta externa, ideal para localhost | não resolve acesso remoto nem recuperação cloud | baixo; operação local | padrão para desenvolvimento controlado |
| Passkey/WebAuthn single-owner | forte contra phishing, sem senha reutilizável | recuperação e compatibilidade exigem desenho cuidadoso | baixo a médio | preferido para acesso remoto próprio quando houver fase autorizada |
| OIDC com allowlist de um subject | login/revogação maduros e menor implementação criptográfica | dependência de provider e custo potencial | variável; exige decisão da usuária | alternativa cloud, não escolher nem configurar agora |

Não há provider indispensável para aprovar este roadmap. A escolha é obrigatória somente antes de implementar acesso remoto/cloud.

## IDENTITY TRANSITION

- Fase 6 visual preserva o comportamento existente e não transforma o UUID atual em credencial.
- Na fase de segurança, `X-Hope-User-Id` e `?user_id=` deixam de ser fontes de autoridade.
- O backend deriva um `owner_id` canônico do `OwnerContext`; o valor enviado pelo cliente é ignorado ou rejeitado nos endpoints protegidos.
- `user_id` permanece no schema como namespace interno do owner. Renomear ou remover colunas não é requisito imediato.
- Dados legados não são vinculados automaticamente pela simples posse do UUID do navegador.
- Antes de qualquer vinculação, Database inventaria os namespaces. Um namespace explicitamente escolhido pode ser associado ao owner por plano com dry-run, backup, contagens e rollback; namespaces ambíguos ficam em quarentena.
- Exclusão de dados legados exige política de retenção e autorização separada. Nada é apagado por esta decisão.

## RESOURCE AUTHORIZATION

Mesmo com um único owner, autorização por recurso continua necessária porque tools e agentes operam sob escopos diferentes.

Exemplos:

- arquivo precisa permanecer dentro do workspace canônico após resolução de symlinks;
- operação Git só atua no repositório autorizado e na branch/ação permitida;
- memória, relação, conversa ou evento precisa pertencer ao namespace canônico do owner;
- integração só acessa a conta, vault ou coleção explicitamente autorizada;
- operação de banco usa role e conjunto de tabelas compatíveis com a ação.

Falha de ownership, caminho, escopo ou política resulta em `DENY`. A resposta pública não confirma a existência de recurso fora do escopo e não vaza caminhos, IDs, tokens ou detalhes internos.

## AGENT ARCHITECTURE

Componentes futuros preservados:

- `AgentManager`: ciclo de vida e coordenação.
- `AgentFactory`: instancia somente definições e policies válidas.
- `AgentRegistry`: registra tipos, versões, owner e proveniência.
- `AgentRuntime`: executa com isolamento, timeout e cancelamento.
- `AgentPolicy`: limita tools, dados, rede, orçamento e efeitos.
- `AgentEvaluator`: avalia resultado sem autoaprovação.

O primeiro tipo é `EPHEMERAL`: existe durante uma tarefa e perde grants ao terminar. Agente `PERSISTENT` fica adiado e não significa processo 24/7 nem privilégio permanente. Contratos incluem goal, tools, resource scope, model policy, budgets, concurrency, timeout, status, provenance e version.

Agentes nunca herdam todos os poderes do owner. Um agente filho recebe a interseção entre a allowlist do tipo, o grant do pai e a policy atual.

## SKILL ARCHITECTURE

- `TOOL`: operação atômica com schema de entrada/saída, risco e efeito declarados.
- `SKILL`: procedimento reutilizável que compõe tools, pré-condições, regras e critérios de sucesso.

`SkillRegistry`, `SkillDefinition`, `SkillExecutor` e `SkillEvaluator` permanecem no alvo. Cada skill possui versão imutável, origem, hash, tools permitidas, nível de risco, testes e política de aprovação. Alteração crítica cria nova versão; não ativa silenciosamente.

## TOOLS

Toda tool deve declarar:

- efeito `SAFE`, `WRITE`, `SENSITIVE` ou `DESTRUCTIVE` e a possibilidade de elevação pela policy;
- schema, limites, recursos e destinos;
- idempotência, retry, timeout, custo e cancelamento;
- confirmação e grants exigidos;
- evento de auditoria sem secrets;
- compensação/rollback quando aplicável.

Registro, autorização e execução são decisões separadas. Tool não registrada, schema inválido ou recurso fora do escopo resulta em `DENY`.

## PERMISSION MANAGER

Contrato conceitual mínimo:

```text
PermissionRequest
  owner_session_id
  requested_by: owner | tool | agent | system
  action
  resource_type
  target_id_or_canonical_path
  target_fingerprint
  parameters_hash
  environment
  task_id / execution_id
  proposed_risk

PermissionDecision
  ALLOW | DENY | REQUIRE_CONFIRMATION
  effective_risk
  policy_version
  scope
  expires_at
  approval_id?
  reason_code
```

O nível efetivo é calculado pela policy, não escolhido pelo modelo, tool ou agente. A policy pode elevar o risco solicitado, nunca reduzi-lo silenciosamente.

### SAFE

- Exemplos: ler memória própria; pesquisar documentação local permitida; consultar status não sensível; produzir rascunho sem persistir; listar diff.
- Permitido: leitura allowlisted e operação reversível sem rede, custo, secret ou dado sensível adicional.
- Proibido: escrita persistente, acesso amplo ao filesystem, rede externa, credencial, envio ou exclusão.
- Confirmação: nenhuma dentro de tarefa e escopo já autorizados.
- Duração/escopo: somente a requisição/tarefa, recursos enumerados e ambiente atual.
- Revogação: kill switch ou cancelamento da tarefa interrompe novas ações.
- Auditoria: decisão agregada e resultado; detalhar falhas e acessos excepcionais.
- Fail-closed/error: alvo desconhecido, path ambíguo, policy ausente ou classificador inconsistente resulta em `DENY` controlado.
- Tools/agentes: podem receber somente operações SAFE explicitamente registradas; não podem expandir allowlist.

### WRITE

- Exemplos: criar/editar arquivo no workspace autorizado; salvar rascunho; atualizar memória corrigível; criar commit local autorizado sem push.
- Permitido: mutação limitada, revisável e com recuperação conhecida.
- Proibido: sobrescrever alvo crítico, publicar, usar secret, gastar, alterar permissão, migration real ou operação irreversível.
- Confirmação: pode ser pré-autorizada pelo owner para um task envelope específico; fora dele, exige confirmação.
- Duração/escopo: uma tarefa ou no máximo 30 minutos, sempre por tipo de recurso, path/ID e ação; sem wildcard global.
- Revogação: imediata para novas chamadas; executor cancela trabalho pendente quando seguro.
- Auditoria: diff/resumo, alvo canônico, policy, approval e resultado; nunca conteúdo privado completo por padrão.
- Fail-closed/error: se não houver rollback/diff ou o alvo mudar após aprovação, reclassificar para `SENSITIVE` ou `DESTRUCTIVE` e pedir nova decisão.
- Tools/agentes: recebem grant filho menor ou igual ao envelope; não delegam WRITE sem policy explícita.

### SENSITIVE

- Exemplos: enviar dados a provider externo; acessar secret por referência; usar integração privada; enviar mensagem; gerar custo; alterar configuração de segurança; conceder permissão.
- Permitido: somente a ação confirmada com minimização de dados e destino explícito.
- Proibido: aprovação permanente ampla, mostrar secret ao modelo, trocar destinatário/provider ou aumentar custo depois da confirmação.
- Confirmação: obrigatória em UI confiável fora do conteúdo gerado pelo modelo; pode exigir owner session recente.
- Duração/escopo: uso único, prazo padrão máximo de 5 minutos, action + target + destination + parameters hash + budget.
- Revogação: antes do consumo; depois do efeito, revogar impede repetição e aciona compensação quando existente.
- Auditoria: decisão, destino lógico, dados por categoria, custo autorizado/real e resultado; tokens e payload bruto são omitidos.
- Fail-closed/error: falha ou timeout não autoriza retry automático se o efeito puder ter ocorrido; consultar idempotency key ou pedir nova confirmação.
- Tools/agentes: não recebem secret bruto; usam handle efêmero e não exportável. Um agente não confirma em nome do owner.

### DESTRUCTIVE

- Exemplos: excluir memória/arquivo; sobrescrever artefato relevante; force push; apagar branch; `DROP`/`TRUNCATE`; migration destrutiva; alteração crítica de infraestrutura ou credencial.
- Permitido: somente alvo inequívoco, consequência apresentada, recuperação/backup declarados e confirmação forte.
- Proibido: glob amplo, alvo calculado não resolvido, operação em produção implícita, confirmação genérica ou reutilização de aprovação.
- Confirmação: obrigatória por operação; reautenticação/gesto forte conforme ambiente e confirmação textual do alvo quando o impacto justificar.
- Duração/escopo: uso único, prazo padrão máximo de 2 minutos, nonce e fingerprint/version do alvo.
- Revogação: válida até o consumo; após execução, usar rollback/restore documentado quando tecnicamente possível.
- Auditoria: append-oriented, ator, ação, alvo minimizado, consequência, backup/rollback, approval e resultado.
- Fail-closed/error: inconsistência, concorrência, alvo alterado ou resultado desconhecido interrompe; não repetir automaticamente.
- Tools/agentes: nunca recebem permissão DESTRUCTIVE por herança. Cada efeito retorna ao owner.

## APPROVAL INVARIANTS

- `approval_id` é assinado/armazenado pelo servidor e vinculado ao owner session, action, target, fingerprint, parameters hash, environment, execution ID, expiry e nonce.
- Aprovação consumida, expirada, revogada ou destinada a outro alvo é inválida.
- Alteração de parâmetros, destino, custo, branch, path, recurso ou consequência exige nova decisão.
- Memória, prompt, página web, documento, tool output, agente e provider não podem criar, alterar ou confirmar aprovação.
- Nenhum ator pode modificar a policy que o governa durante a própria execução.
- Child agents e subtarefas recebem interseção entre o grant do pai e a allowlist da policy; nunca a união.

## CODING ARCHITECTURE

Fluxo futuro preservado:

```text
Owner → objetivo + envelope
      → Coding Agent efêmero inspeciona e propõe plano
      → workspace isolado + grants mínimos
      → edição/testes/lint autorizados
      → diff + evidências
      → review independente
      → confirmação do owner para efeitos sensíveis
```

Leitura, edição, testes, commit, push, merge, deploy, exclusão e migration são capabilities separadas. Autorizar “implementar” não concede automaticamente push, merge, deploy, migration, secret ou produção.

## MODEL ROUTER

`ModelRouter` seleciona provider/model por capacidade: conversation, reasoning, coding, vision, image generation, embeddings, classification, STT e TTS. Considera qualidade mínima, custo máximo, latência, privacidade, disponibilidade, região e fallback permitido.

Começa com regras determinísticas e configuração explícita. Um fallback não pode enviar dados a provider com política de privacidade inferior sem confirmação. Provider-agnostic significa isolamento por adapter, não multiplicação prematura de fornecedores.

## IMAGE GENERATION

O contrato futuro separa `capability`, `provider`, `model`, `policy` e `cost` para generate/edit/inpaint/remove-background/upscale. Binários grandes usam object storage; PostgreSQL guarda referência, ownership, hash, provenance, consentimento e retenção.

Edição distingue mídia do owner, licenciada e gerada. Privacidade, biometria, direitos autorais, retenção e custos são avaliados antes da chamada externa.

## MULTIMODALITY

`InputRouter` normaliza envelopes de texto, voz, imagem, documento, código e tela. Cada envelope contém modalidade, tipo/tamanho/hash, referência de armazenamento, texto extraído, proveniência, trust level, owner namespace, policy tags, retenção e correlation ID.

Cada modalidade possui scanner e limites próprios. Conteúdo extraído é dado não confiável; binários não são despejados no prompt nem no PostgreSQL.

## SELF-EVALUATION

`EvaluationManager` registra success/partial/failure, feedback, custo e latência ligados à tarefa, versão, model route e execution ID. Self-evaluation é evidência, não autoridade: agente não aprova a própria mudança e feedback isolado não altera regra global.

## OWNER REVIEW AND REVOCATION

O owner precisa de uma superfície simples para:

- ver sessão atual, grants ativos, expiração, recurso e ator técnico;
- revogar um grant, encerrar a sessão ou usar “revogar tudo”;
- cancelar execuções quando suportado;
- revisar eventos de auditoria por categoria e correlação;
- remover/rotacionar integrações sem revelar secrets.

No primeiro desenho local, grants são curtos e podem ser mantidos em memória; reinício os invalida. Persistência distribuída de sessão/grant é requisito somente quando existir operação cloud contínua ou múltiplas réplicas.

## SECRETS AND SESSIONS

- Secrets ficam no backend, cofre do SO ou secret manager do ambiente; nunca em frontend, prompt, URL, Git ou audit log.
- Tools recebem handles opacos com ação e prazo, não o secret original.
- Sessão local usa cookie opaco `HttpOnly` e mesma origem quando houver browser; `localStorage` não armazena credencial.
- Logout invalida a sessão e grants derivados. Expiração falha fechada e encerra/rejeita WebSocket autenticado.
- Em acesso remoto, cookies exigem `Secure`, política de CSRF e Origin, rotação e estratégia de recuperação antes do deploy.

## AUDIT AND OBSERVABILITY

Correlação mínima:

```text
request_id → owner_session_id → task/execution_id
           → permission_decision → tool/effect → result
```

Registrar timestamp, ator técnico, action enum, target lógico minimizado ou hash, risk, policy version, approval ID, result, duração e custo quando aplicável. Não registrar token, secret, prompt bruto, conteúdo integral, path privado desnecessário ou payload externo completo.

Logs operacionais, auditoria e memória têm retenção e acesso separados. Escrita de auditoria deve ser append-oriented; falha de auditoria em `SENSITIVE`/`DESTRUCTIVE` resulta em `DENY` quando não for possível garantir registro mínimo.

## COST CONTROL

Cada execução futura recebe `BudgetEnvelope` com token budget, monetary budget, timeout, concurrency, max tool calls e max retries. Limites são verificados antes e durante a execução. Exceder budget interrompe ou pede confirmação; nunca escolhe silenciosamente um provider mais invasivo.

## SAFETY BOUNDARIES

| Capability | Automation allowed | Boundary |
|---|---|---|
| Learning/memory update | sim, para registros seguros e corrigíveis | sem mudar core ou permission policy |
| Preference/experience | sim, com confiança e provenance | caso isolado não vira regra |
| Skill proposal | sim | proposta não instala nem ativa |
| Skill/agent creation | somente em sandbox e policy | sem autoelevação ou grants permanentes |
| SENSITIVE/DESTRUCTIVE | não automática | confirmação do owner e auditoria |
| Core self-modification | não | decisão e reviews explícitos |
| Production/infrastructure/security policy | não | autorização operacional separada |

Migration real, credencial, privilégio, custo relevante, exclusão irrecuperável, risco HIGH/CRITICAL e mudança irreversível sempre exigem decisão explícita.

## FEATURE READY VS PRODUCTION READY

- `FEATURE READY`: critérios da fase satisfeitos no ambiente definido, reviews obrigatórios concluídos e nenhum blocker funcional.
- `PRODUCTION READY`: owner recognition, sessão/revogação, permissions, quotas, secrets, deploy, backup/restore, observabilidade e operação real validados para a superfície escolhida.

Uma feature pode ser aprovada para localhost/controlado e permanecer bloqueada para produção. `SINGLE_USER` não reduz esse gate; apenas remove complexidade de tenants e contas que não protege o caso real.

## RLS STRATEGY

RLS orientado a tenants foi removido do roadmap imediato. Em `SINGLE_USER`, o controle principal é:

1. owner reconhecido no servidor;
2. namespace canônico do owner;
3. autorização por recurso;
4. role de runtime com privilégio mínimo;
5. PermissionManager para efeitos.

RLS simples pode ser reavaliado como defesa adicional se houver acesso remoto, plugins com consulta direta, múltiplas réplicas ou outra fronteira que justifique o custo. Não ativar RLS antes de identidade, role, migrations, testes PostgreSQL e rollback estarem prontos. Findings existentes de Security/Database permanecem históricos até revisão dos owners.

## ROADMAP

Nenhuma fase abaixo está autorizada para implementação.

### Phase 6 — Target UI Convergence

- Goal: implementar a composição aprovada do HOPE Main Dashboard sobre capacidades reais existentes.
- Scope: shell, marca HOPE, hierarquia globo/chat, Core Orb, estados, inspector, controles, responsividade, fallback acessível e correção de `UIUX-F5-W01` a `UIUX-F5-W03`.
- Non-goals: owner authentication, PermissionManager, tools, coding, agents, métricas inventadas, Visão/Arquivos/Automação funcionais, banco, migration ou deploy.
- Dependencies: Fase 5 aprovada; `UIUX-VIS-2026-09-10-001`; `docs/design/`; baseline `88e1947`; aprovação explícita do plano.
- Architecture: refatoração visual progressiva do frontend atual, preservando APIs e contratos de consentimento/esquecimento/realtime.
- Acceptance Criteria: fidelidade UI/UX aprovada; dados e estados reais; chat-first mobile; WCAG 2.2 AA nos fluxos essenciais; nenhum claim futuro ativo; zero alteração de schema.
- Required Reviews: QA YES — regressão/browser; DATABASE NO — escopo visual sem persistência, com reclassificação se o diff tocar dados; SECURITY YES — consentimento, confirmação e claims; UI/UX YES — spec prévia e fidelidade posterior.
- Risks: regressão de consentimento/confirm dialog, custo WebGL, transformar mockup em claims falsos e scope creep para navegação futura.
- Deferred Work: reconhecimento do owner, permissions, tools, agents e produção.
- Production impact: nenhum; permanece local/controlado e `Production Readiness: BLOCKED`.
- User approval requirements: aprovar esta fase e qualquer expansão funcional antes de DEV.

### Phase 7 — Single-User Security & Permissions

- Goal: reconhecer o único owner e governar recursos/efeitos por risco.
- Scope: `OwnerAuthenticator`, sessão local revogável, `OwnerContext`, HTTP/WS sem identidade arbitrária, Origin policy, `ResourceAuthorizer`, PermissionManager `SAFE/WRITE/SENSITIVE/DESTRUCTIVE`, grants, revogação e auditoria mínima.
- Non-goals: cadastro público, múltiplos usuários, RBAC complexo, tenants, organizações, SSO enterprise, PermissionManager organizacional, deploy público ou RLS por tenant.
- Dependencies: contrato visual da Fase 6 para login/estado/revogação quando aplicável; escolha do método de owner recognition adequada ao ambiente; inventário de UUIDs antes de migração.
- Architecture: três gates em sequência — owner, recurso, risco — com decisões fail-closed e sessões/grants curtos.
- Acceptance Criteria: nenhum endpoint protegido ou WS confia no UUID do cliente; owner/session/revogação testados; grants são exatos e não reutilizáveis; prompt injection não concede permissão; cross-resource/path escape é negado; logs omitem secrets.
- Required Reviews: QA YES — sessão e negativas; DATABASE YES — namespace `user_id`, inventário legado e contratos de persistência; SECURITY YES — fronteira principal; UI/UX YES — pareamento, sessão, confirmação, expiração e revogação.
- Risks: bloquear o owner legítimo, recuperação fraca, grants amplos, vazamento em logs e falsa sensação de segurança em localhost.
- Deferred Work: sessão distribuída, RLS opcional, rate limits de produção e provider cloud.
- Production impact: melhora a base, mas não concede Production Readiness.
- User approval requirements: escolher o método de reconhecimento antes da implementação e autorizar qualquer provider/custo/credencial.

### Phase 8 — Read-Only Tool Registry

- Goal: introduzir tools `SAFE` somente leitura sob escopo explícito.
- Scope: schemas, registry, allowlists, timeouts, provenance, cancelamento, audit mínimo e tools locais de leitura úteis.
- Non-goals: editar, executar código, rede externa sensível, credenciais brutas, efeitos, agentes ou automações.
- Dependencies: Phase 7 aprovada e PermissionManager operacional.
- Architecture: tool registrada + schema validado + `ResourceAuthorizer` + decisão SAFE + executor limitado.
- Acceptance Criteria: tool não registrada não executa; path/namespace escape é negado; output é tratado como dado; cancelamento/timeout funcionam; tool não amplia grant.
- Required Reviews: QA YES — tool contracts; DATABASE NO — fase exclui tool de banco e persistência nova; SECURITY YES — leitura/exfiltração; UI/UX YES — catálogo, escopo e cancelamento visíveis.
- Risks: leitura excessiva, exfiltração por output e tool injection.
- Deferred Work: WRITE/EXECUTE e coding agent.
- Production impact: nenhum deploy; somente ambiente controlado.
- User approval requirements: aprovar catálogo inicial e fontes acessíveis.

### Phase 9 — Permissioned Effects & Ephemeral Coding

- Goal: permitir WRITE/EXECUTE controlados e um Coding Agent efêmero em workspace isolado.
- Scope: edição recuperável, testes/lint, diff, orçamento, confirmação por alvo, sandbox, limites de rede e separação de commit/push/merge/deploy/migration.
- Non-goals: produção, credenciais administrativas, push/merge automático, migration real, agente persistente ou multi-repositório.
- Dependencies: Phases 7–8 aprovadas; rollback por diff; workspace isolation; policy por operação.
- Architecture: plano limitado → grant filho → executor sandboxed → evidência/diff → review independente.
- Acceptance Criteria: nenhuma autoelevação; effects separados; testes/evidências registrados; rollback disponível; SENSITIVE/DESTRUCTIVE volta ao owner; agente perde grants ao terminar.
- Required Reviews: QA YES — sandbox e efeitos; DATABASE NO — migration/banco real são non-goals; SECURITY YES — execução e grants; UI/UX YES — aprovações, cancelamento e resultados.
- Risks: execução de código não confiável, supply chain, path escape, comandos destrutivos e custo.
- Deferred Work: agentes gerais, persistência e automações.
- Production impact: restrito a workspaces controlados; sem deploy.
- User approval requirements: aprovar actions WRITE/EXECUTE e qualquer egress/custo.

### Phase 10 — Ephemeral Agent Runtime

- Goal: generalizar delegação limitada além de coding.
- Scope: AgentRegistry, lifecycle efêmero, policy, budgets, cancelamento, avaliação externa e grants por interseção.
- Non-goals: agentes persistentes, criação irrestrita, autonomia 24/7, self-modification ou permissões permanentes.
- Dependencies: Phases 7–9 aprovadas.
- Architecture: owner → task envelope → agent efêmero → subset de tools/grants → avaliação externa → destruição do contexto privilegiado.
- Acceptance Criteria: limites de custo/tempo/tool calls; nenhuma permissão herdada implicitamente; fan-out limitado; revogação/cancelamento; auditoria correlacionada.
- Required Reviews: QA YES — lifecycle/fan-out; DATABASE NO — runtime inicial é efêmero e sem persistência nova; SECURITY YES — delegation/privilege; UI/UX YES — interface de agentes, budgets e aprovações.
- Risks: loops, fan-out, custo silencioso, privilege creep e memória indevida.
- Deferred Work: skills, learning, agentes persistentes e automações.
- Production impact: nenhum até gate específico.
- User approval requirements: aprovar tipos de agente, budgets e tools.

### Conditional Gate — Production Hardening

- Goal: validar a superfície que realmente será exposta ou executada continuamente.
- Scope: definido somente quando houver objetivo concreto de acesso remoto/cloud; pode incluir secrets manager, TLS, hosts/proxy, role PostgreSQL mínima, backup/restore, broker, quotas, rate limits, session store, observabilidade e incident response.
- Non-goals: infraestrutura enterprise sem demanda, multi-tenant, SSO, organizações ou relaxamento de safety boundaries.
- Dependencies: ao menos Phase 7 e escopo de produto/deploy escolhido.
- Architecture: gate incremental antes da exposição, não uma reescrita preventiva de toda a plataforma.
- Acceptance Criteria: threat model do escopo, restore, rollback, owner recovery, session revocation, limites, auditoria e deploy reproduzível validados.
- Required Reviews: QA YES; DATABASE YES; SECURITY YES; UI/UX YES para fluxos operacionais visíveis; aprovação da usuária YES.
- Risks: custo operacional, overengineering ou, no extremo oposto, exposição antes do gate.
- Deferred Work: controles enterprise sem necessidade single-user.
- Production impact: é o único gate que pode preparar exposição; não a autoriza sozinho.
- User approval requirements: objetivo de exposição, provider, custo, credenciais, migration e go-live exigem decisões separadas.

## PRESERVED FUTURE CAPABILITIES

Permanecem válidas, sem numeração definitiva até as fases 6–10 produzirem evidência:

- Model Router e adapters de LLM/STT/TTS/embeddings.
- Memória semântica de produção e avaliação de recall/latência/custo.
- Skills versionadas e Experience Memory.
- Imagens e multimodalidade com object storage e políticas de dados.
- Agentes persistentes com owner, versão, revogação e budgets.
- Automações duráveis, idempotentes e quiet-by-default.
- HOPE Bridge autenticado e revogável para recursos locais.
- Learning por registros controlados, nunca self-modification irrestrita.

Organizações, billing, teams, SSO empresarial, federação, marketplace multiusuário e RLS por tenant não pertencem ao roadmap imediato.

## DEPENDENCY ORDER

```text
Phase 5 approved baseline
  → Phase 6 Target UI Convergence (local/controlado)
  → Phase 7 Single-User Security & Permissions
  → Phase 8 Read-Only Tools
  → Phase 9 Permissioned Effects & Ephemeral Coding
  → Phase 10 Ephemeral Agents
  → capabilities futuras priorizadas por valor
  → Production Hardening antes de qualquer exposição escolhida
```

A Fase 6 pode preceder o PermissionManager porque não adiciona efeitos, credenciais ou capacidades e permanece local/controlada. Tools, coding e agentes não podem preceder a Fase 7. Production Hardening não é antecipado como arquitetura enterprise, mas também não pode ocorrer depois de uma exposição já iniciada.

## DECISIONS REQUIRING FUTURE USER APPROVAL

- Autorizar a implementação da Fase 6.
- Escolher o mecanismo de reconhecimento do owner antes da Fase 7.
- Definir se haverá acesso remoto/cloud e, se houver, provider, custo e recuperação.
- Aprovar qualquer migration ou vínculo de UUID legado após inventário.
- Aprovar catálogo de tools, egress, budgets, secrets e actions SENSITIVE/DESTRUCTIVE.
- Autorizar qualquer Production Hardening real e eventual go-live.
