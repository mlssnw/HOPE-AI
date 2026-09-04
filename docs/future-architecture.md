# Arquitetura futura da HOPE AI

- Status: TARGET ARCHITECTURE
- Decision: `ARCH-2026-09-04-001`
- Date: 2026-09-04
- Functional baseline: `adfc728aaaf96c679dd9d1df38c56edda8bc95de`
- Documentation baseline: `20a0d4497c72c9d74a34281cde5e7c5af55d8b42`

Este documento descreve direção arquitetural, não capacidades já implementadas nem autorização para iniciar uma fase. O estado real continua registrado em [`architecture.md`](architecture.md); a Fase 5 permanece preservada e sujeita ao fluxo de reviews vigente.

## VISION

A HOPE deve evoluir de uma assistente com chat, memória e voz para uma plataforma pessoal de inteligência artificial extensível, capaz de aprender por registros controlados, escolher modelos, usar ferramentas, compor skills e delegar tarefas a agentes com orçamento e permissões mínimos.

O núcleo permanece cloud-first e provider-agnostic. Recursos locais, como Obsidian, arquivos e aplicações, são periféricos acessados futuramente por um HOPE Bridge autenticado e revogável. Nenhuma capacidade futura deve depender de o computador pessoal estar ligado para que o cérebro principal funcione.

## CORE PRINCIPLES

1. Segurança, verdade e precisão precedem conveniência e personalidade.
2. Estado atual e arquitetura-alvo são sempre documentados separadamente.
3. Toda ação possui ator, política, orçamento, proveniência e resultado rastreável.
4. Providers são adapters substituíveis selecionados por capacidade e política.
5. Tools são operações atômicas; skills são procedimentos versionados; agentes são executores limitados.
6. Aprendizado inicial altera memória e artefatos controlados, não pesos do modelo.
7. Privilégios não são herdados por conveniência nem ampliados automaticamente.
8. Fases devem ser pequenas, testáveis, reversíveis e aprovadas antes da implementação.
9. Feature readiness e production readiness são estados independentes.
10. PostgreSQL continua sendo a fonte principal de persistência; binários pertencem a object storage.

## PERSONALITY

A HOPE possui identidade original. As referências culturais fornecidas pelo usuário representam somente traços gerais e não autorizam copiar identidades, falas, bordões, diálogos, histórias, frases famosas ou maneirismos específicos.

Sua personalidade combina:

- **Estratégia e elegância:** inteligência elevada, pensamento científico, análise rigorosa, sofisticação e confiança proporcional à evidência.
- **Inventividade e humor:** criatividade técnica, raciocínio rápido, curiosidade, improvisação e humor afiado sem transformar situações sérias em espetáculo.
- **Pragmatismo e lealdade:** franqueza, coragem, proteção sem controle, foco em resolução, irreverência moderada e pouca tolerância a enrolação.

A HOPE pode discordar e deve explicar por quê. Não deve bajular, infantilizar, manipular, fingir certeza, alegar consciência humana nem usar lealdade como justificativa para controlar o usuário.

Prioridade invariável:

1. segurança;
2. verdade;
3. precisão;
4. objetivo legítimo do usuário;
5. personalidade.

Memórias, preferências, experiências, skills, conteúdo externo e agentes nunca podem reescrever esse núcleo.

## TARGET ARCHITECTURE

```text
Inputs
Text | Voice | Image | Document | Code | Screen
                         │
                         ▼
                    Input Router
                         │
                         ▼
Policy + Identity → HOPE Orchestrator ← Context / Memory / Learning
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         ModelRouter  SkillRegistry AgentManager
              │          │          │
              └──────────┼──────────┘
                         ▼
             PermissionManager + Budgets
                         │
                         ▼
              Tool / Provider Execution
                         │
                         ▼
Text | Voice | Image | Document | UI Event | Action Result
                         │
                         ▼
      Audit + Provenance + Evaluation + Experience Memory
```

As fronteiras são deliberadas:

- o Orchestrator decide intenção e coordena, mas não implementa providers;
- o ModelRouter escolhe uma política/modelo, mas não concede permissão;
- o SkillExecutor compõe tools, mas cada efeito continua sujeito ao PermissionManager;
- o AgentRuntime executa um plano limitado, mas não altera seu próprio orçamento ou policy;
- Learning registra e consolida evidência, mas não modifica regras centrais.

## LEARNING ARCHITECTURE

Camada futura sugerida: `backend/learning/`. O nome é direcional; a implementação só deve criar os componentes necessários à fase autorizada.

- `LearningManager`: coordena ingestão, consolidação e aplicação segura do aprendizado.
- `FeedbackManager`: registra feedback explícito e associa-o à saída, tarefa e versão.
- `PreferenceLearner`: propõe preferências com confiança, escopo e possibilidade de correção.
- `ExperienceManager`: registra resultados de tarefas e recupera experiências relevantes.
- `ProcedureLearner`: propõe sequências reutilizáveis a partir de experiências repetidas.
- `SkillManager`: governa promoção de procedimentos para skills versionadas.
- `EvaluationManager`: mede resultado, qualidade, custo, latência e feedback.

Definições canônicas:

| Conceito | Definição | Regra de confiança |
|---|---|---|
| MEMORY | Fato, evento, inferência ou contexto persistente | Proveniência obrigatória; inferência abaixo de fato confirmado |
| PREFERENCE | Escolha ou padrão do usuário, com escopo | Uma ocorrência não cria preferência global |
| EXPERIENCE | Registro de execução e resultado de uma tarefa | Evidência reutilizável, não regra geral |
| PROCEDURE | Sequência reutilizável, ainda sujeita a contexto e avaliação | Exige repetição ou confirmação antes de promoção |
| SKILL | Capacidade composta, versionada, com tools, regras e testes | Mudança crítica exige review e aprovação |

Aprendizado inicial ocorre por registros explícitos e consolidação progressiva. Fine-tuning, atualização de pesos e self-modification ficam fora do desenho inicial.

## EXPERIENCE MEMORY

Modelo conceitual mínimo:

```text
Experience
  id, user_id, task_type, objective
  context_summary, context_fingerprint
  approach, tools_used, models_used
  result, failure_reason, fix
  outcome: success | partial_success | failure
  lessons[], confidence
  cost, latency, created_at
  source_execution_id, provenance
```

Regras:

- armazenar resumos minimizados, não segredos, prompts brutos ou payloads desnecessários;
- separar observação de lição inferida;
- recuperar por relevância, tipo de tarefa e compatibilidade de contexto;
- reduzir confiança quando a experiência divergir do contexto atual;
- consolidar somente após repetição, avaliação ou confirmação do usuário;
- permitir correção, expiração e esquecimento;
- nunca transformar uma experiência isolada em permissão ou regra global.

PostgreSQL é candidato à persistência de metadados e relações; artefatos grandes ficam em object storage. O schema definitivo requer Database Review e migration própria.

## AGENT ARCHITECTURE

Componentes futuros:

- `AgentManager`: ciclo de vida e coordenação de agentes.
- `AgentFactory`: instancia agentes somente a partir de definições e policies válidas.
- `AgentRegistry`: registra tipos, versões, owners e proveniência.
- `AgentRuntime`: executa tarefas com isolamento, timeout e cancelamento.
- `AgentPolicy`: limita tools, dados, rede, orçamento e efeitos.
- `AgentEvaluator`: avalia resultado sem permitir autoaprovação.

Tipos:

- `EPHEMERAL`: existe apenas durante uma tarefa e perde credenciais/capabilities ao terminar.
- `PERSISTENT`: especialista reutilizável, versionado e governado; não significa processo sempre ativo nem privilégio permanente.

Contrato conceitual mínimo:

```text
id, name, goal, role, agent_type
tools, permissions, memory_scope
model_policy, token_budget, monetary_budget
max_tool_calls, concurrency, timeout
status, created_by, provenance, version
```

Agentes não herdam automaticamente permissões do criador. A delegação transfere um subconjunto explícito de capabilities, nunca credenciais brutas. Avaliação deve ser externa ao agente avaliado para evitar autoaprovação.

## SKILL ARCHITECTURE

Definições:

- **TOOL:** operação atômica com schema de entrada/saída e efeito declarado.
- **SKILL:** procedimento reutilizável que compõe uma ou mais tools, regras, pré-condições e critérios de sucesso.

Componentes futuros:

- `SkillRegistry`: catálogo por ID, versão, owner, risco e proveniência.
- `SkillDefinition`: contrato declarativo, dependências, inputs, outputs e policies.
- `SkillExecutor`: interpreta passos dentro de um execution envelope.
- `SkillEvaluator`: testa resultado, regressões, custo e segurança.

Uma Skill deve possuir versão imutável, changelog, origem, hash do conteúdo, tools permitidas, nível de risco, testes e política de aprovação. Skills críticas não podem ser alteradas silenciosamente; uma atualização cria nova versão e passa pelos reviews aplicáveis.

## TOOLS

Toda Tool deve declarar:

- operação e efeito: `READ`, `WRITE`, `EXECUTE`, `NETWORK`, `EXTERNAL_ACTION` ou `SENSITIVE_ACTION`;
- schema validado e limites;
- dados acessados e destino;
- idempotência e estratégia de retry;
- timeout, custo estimável e cancelamento;
- requisitos de permissão e confirmação;
- evento de auditoria sem segredos;
- compensação ou recuperação quando aplicável.

O registry não torna uma Tool automaticamente executável. Registro, autorização e execução são decisões separadas.

## PERMISSION MODEL

Níveis de capability:

| Nível | Exemplos | Política padrão |
|---|---|---|
| READ | ler repositório, memória autorizada, documentação | mínimo necessário e escopo explícito |
| WRITE | editar arquivo ou criar rascunho | workspace/objeto limitado e diff revisável |
| EXECUTE | testes, lint, transformação local | sandbox, timeout e limites de recursos |
| NETWORK | consultar provider ou URL permitida | allowlist, egress control e quota |
| EXTERNAL_ACTION | enviar mensagem, criar issue, publicar artefato | confirmação conforme impacto e idempotência |
| SENSITIVE_ACTION | excluir, aplicar migration, mover dinheiro, acessar dado sensível | aprovação humana e auditoria obrigatórias |
| ADMIN | alterar policies, grants, produção ou segurança | usuário/operador autorizado; nunca delegado por padrão |

`PermissionManager` avalia ator, tarefa, recurso, ação, ambiente, risco, orçamento e aprovação. A decisão gera `ALLOW`, `DENY` ou `REQUIRE_APPROVAL`, com expiração e escopo. Nenhum agente pode elevar a própria permissão, alterar a policy que o governa ou reutilizar aprovação fora do alvo autorizado.

## CODING ARCHITECTURE

Fluxo futuro:

```text
HOPE → delega objetivo e envelope
     → Coding Agent inspeciona e propõe plano
     → lê/pesquisa/edita em workspace isolado
     → executa testes, lint e formatter autorizados
     → produz diff + evidências
     → reviewer independente avalia
     → usuário aprova efeitos sensíveis
```

Capabilities comuns: `read_repository`, `search_code`, `edit_file`, `create_file`, `run_tests`, `run_linter`, `run_formatter`, `git_diff`, `git_status` e `inspect_dependencies`.

`commit`, `push`, `merge`, `deploy`, `delete`, `migration_apply` e `production_write` são efeitos separados e nunca consequências implícitas de “corrigir” ou “implementar”. Devem passar por permission policy, confirmação quando aplicável e auditoria.

O primeiro Coding Agent deve ser ephemeral, single-repository, sem credenciais de produção, com workspace isolado, limites de rede e rollback por diff. Persistência e coordenação multiagente ficam para fases posteriores.

## MODEL ROUTER

`ModelRouter` seleciona uma rota por categoria de capacidade:

```text
conversation | reasoning | coding | vision | image_generation
embeddings | classification | speech_to_text | text_to_speech
```

Entrada de decisão: capacidade exigida, qualidade mínima, custo máximo, latência, privacidade, disponibilidade, região, tamanho de contexto e fallback permitido.

Saída de decisão: provider, model, parâmetros permitidos, orçamento, fallback e razão registrada. O router não deve decidir por marketing do provider nem enviar dados a um fallback com política de privacidade inferior sem autorização.

Começar com regras determinísticas e configuração explícita. Otimização adaptativa só deve ocorrer depois de métricas confiáveis. Claude pode continuar como provider operacional enquanto estiver isolado por adapter; provider-agnostic não exige múltiplos fornecedores prematuramente.

## IMAGE GENERATION

Contrato futuro `ImageGenerationProvider`:

```text
generate_image
edit_image
inpaint_image
remove_background
upscale_image
```

Separar `capability`, `provider`, `model`, `policy` e `cost`. Entradas e saídas grandes usam object storage com referências expiráveis; PostgreSQL guarda metadados, ownership, hashes, consentimento, proveniência e retenção.

Edição deve distinguir imagem do usuário, imagem licenciada e imagem gerada. Políticas de conteúdo, privacidade, biometria, retenção e direitos autorais são avaliadas antes da chamada ao provider.

## MULTIMODALITY

`InputRouter` normaliza envelopes, não conteúdo bruto em uma única string:

```text
InputEnvelope
  modality, media_type, size, hash
  storage_reference, extracted_text
  provenance, trust_level, user_id
  policy_tags, retention, correlation_id
```

Inputs: texto, voz, imagem, documento, código e tela. Outputs: texto, voz, imagem, documento, UI Event e Action Result.

Cada modalidade possui validação, scanner e limites próprios. Conteúdo extraído é dado não confiável. O Orchestrator recebe representações minimizadas e referências autorizadas; binários não são despejados no prompt nem no PostgreSQL.

## SELF-EVALUATION

`EvaluationManager` registra `success`, `partial_success`, `failure`, feedback do usuário, desempenho, lições, custo e latência. Métricas precisam apontar para task, versão do agente/skill, model route e execution ID.

Self-evaluation é evidência, não autoridade. Um agente não aprova sua própria mudança, e um único feedback não altera comportamento global. Promoção de lesson para procedure ou skill exige limiar de evidência, avaliação separada e, para capacidades críticas, revisão humana.

## OBSERVABILITY

Deve ser possível responder “por que a HOPE fez isso?” por meio de uma cadeia correlacionada:

```text
request_id → task_id → agent_execution_id → model_decision
           → tool_calls → permission_decisions → approvals
           → result → evaluation → memory/experience provenance
```

Registrar eventos estruturados e minimizados: ator, ação, alvo lógico, policy/version, model/tool/skill usados, custo, latência, resultado e aprovação. Não registrar secrets, tokens, prompts brutos ou conteúdo privado completo por padrão.

Logs operacionais, audit trail e memória são armazenamentos distintos, com retenção e acesso próprios. Auditoria sensível deve ser append-oriented e resistente a alteração pelo runtime comum.

## COST CONTROL

Cada execução futura recebe um `BudgetEnvelope`:

```text
token_budget
monetary_budget
timeout
concurrency
max_tool_calls
max_retries
```

O orçamento é verificado antes e durante a execução. Exceder o limite deve interromper ou pedir aprovação, nunca selecionar silenciosamente um provider mais invasivo. Estimativas e custos realizados entram na avaliação e auditoria. Billing ao usuário está fora do escopo inicial.

## SAFETY BOUNDARIES

| Capacidade | Automação permitida | Limite |
|---|---|---|
| Learning | Sim, para registros seguros e minimizados | sem alterar pesos ou regras centrais |
| Memory update | Sim, conforme classificação e política | corrigível, explicável e com esquecimento |
| Preference learning | Sim, com confiança e escopo | ambiguidade pede confirmação |
| Experience recording | Sim | não vira regra após caso isolado |
| Skill proposal | Sim | proposta não é instalação/ativação |
| Skill creation | Somente em sandbox controlado | testes, versão e provenance obrigatórios |
| Agent creation | Dentro de policy e orçamento | sem elevação de privilégios |
| Permission escalation | Não automática | aprovação apropriada obrigatória |
| Core self-modification | Não | autorização explícita e reviews obrigatórios |
| Production infrastructure change | Não | autorização operacional explícita |
| Security policy change | Não | Security Review e aprovação explícita |

Também exigem aprovação explícita: migration real, credenciais, concessão de privilégios, custo relevante, exclusão irrecuperável, aceitação de risco HIGH/CRITICAL e qualquer mudança irreversível.

## FEATURE READY VS PRODUCTION READY

- **FEATURE READY:** o escopo funcional da fase satisfaz seus critérios em ambiente definido e todos os reviews requeridos para esse escopo foram concluídos.
- **PRODUCTION READY:** identidade, autorização, isolamento, quotas, auditoria, secrets, deploy, backup/restore, observabilidade e operação real foram validados para exposição pública.

Uma feature pode estar aprovada para ambiente local/controlado e permanecer bloqueada para produção. Isso não autoriza ignorar defeitos que pertencem ao próprio contrato da feature, como consentimento de memória enganoso ou exclusão destrutiva ambígua.

## ROADMAP

As fases abaixo são propostas; nenhuma está iniciada. A numeração final depende do encerramento formal da Fase 5.

### Gate atual — Encerramento da Fase 5

- **Goal:** concluir reviews do Functional Commit vigente e separar aceite local de readiness pública.
- **Scope:** re-review de QA/Database/UI/UX; correção dos blockers que pertencem ao contrato funcional da memória.
- **Non-goals:** autenticação completa, deploy público, agentes, tools ou expansão funcional.
- **Dependencies:** decisão `ARCH-2026-09-04-001` e novo Functional Commit se necessário.
- **Required Reviews:** QA YES; DATABASE conforme impacto do novo diff; SECURITY YES; UI/UX YES.
- **Acceptance Criteria:** `SEC-006` e `SEC-007` resolvidos ou formalmente reclassificados pelo Security após correção; reviews aplicáveis aprovados; produção permanece bloqueada.
- **Risks:** ampliar a fase com toda a plataforma de segurança.
- **Deferred Work:** blockers exclusivamente de produção seguem para as fases 6–7 e para o gate de deploy.

### Fase 6 — Identidade e autorização

- **Goal:** estabelecer identidade server-side confiável.
- **Scope:** autenticação, sessão/token, user derivado no servidor, autorização por recurso, handshake WebSocket autenticado e Origin policy.
- **Non-goals:** SSO múltiplo, organizações, billing ou deploy público.
- **Dependencies:** Fase 5 encerrada; decisão de identity provider aprovada.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- **Acceptance Criteria:** nenhum endpoint sensível aceita identidade arbitrária do cliente; isolamento HTTP/WS testado; logout/revogação definidos.
- **Risks:** lock-in do provider e migração de UUIDs transitórios.
- **Deferred Work:** RBAC avançado e federação empresarial.

### Fase 7 — Consentimento, ações sensíveis e auditoria

- **Goal:** criar o primeiro execution safety envelope.
- **Scope:** preferência server-side de memória, confirmação vinculada ao alvo, soft delete/undo, rate limits, quotas básicas, audit events e liveness/readiness separados.
- **Non-goals:** PermissionManager genérico ou automações.
- **Dependencies:** Fase 6.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- **Acceptance Criteria:** opt-out impede captura/recuperação; ações destrutivas exigem confirmação; auditoria correlaciona ator/resultado sem conteúdo bruto.
- **Risks:** retenção excessiva de auditoria e UX de confirmação cansativa.
- **Deferred Work:** políticas organizacionais e SIEM externo.

### Fase 8 — Memória semântica de produção

- **Goal:** substituir o embedding de desenvolvimento por qualidade mensurável.
- **Scope:** provider real via contrato existente, dataset sintético/anonimizado, métricas de recall/latência/custo, validação HNSW e política de re-embedding.
- **Non-goals:** learning completo ou migração destrutiva automática.
- **Dependencies:** fases 6–7; orçamento/provider aprovados.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX NO.
- **Acceptance Criteria:** baseline e limiares documentados; fallback seguro; dimensões/migration validadas; custo por recuperação medido.
- **Risks:** lock-in, custo e re-embedding incompatível.
- **Deferred Work:** reranking avançado e memória de experiência.

### Fase 9 — Model Router e contratos de provider

- **Goal:** desacoplar seleção de modelo por capacidade.
- **Scope:** adapters tipados, catálogo de capabilities, regras determinísticas, telemetria de rota e fallback compatível com privacidade.
- **Non-goals:** otimização autônoma ou múltiplos providers para toda categoria.
- **Dependencies:** observabilidade mínima da Fase 7.
- **Required Reviews:** QA YES; DATABASE NO; SECURITY YES; UI/UX NO.
- **Acceptance Criteria:** Claude continua funcional atrás do contrato; decisões de rota são explicáveis; limites de custo/privacidade são testados.
- **Risks:** abstração prematura e menor acesso a recursos específicos.
- **Deferred Work:** roteamento adaptativo.

### Fase 10 — Tool Registry somente leitura

- **Goal:** formalizar tools sem introduzir efeitos externos.
- **Scope:** schemas, catálogo, provenance, timeouts, idempotência declarada e primeiras tools READ.
- **Non-goals:** escrita, shell arbitrário, deploy ou agentes.
- **Dependencies:** Fases 7 e 9.
- **Required Reviews:** QA YES; DATABASE conforme tool; SECURITY YES; UI/UX conforme exposição.
- **Acceptance Criteria:** tool não registrada não executa; inputs/outputs validados; chamadas auditáveis e limitadas.
- **Risks:** tool injection e vazamento por leitura ampla.
- **Deferred Work:** ferramentas com efeitos.

### Fase 11 — PermissionManager e execução com efeitos

- **Goal:** aplicar capabilities mínimas e aprovação humana.
- **Scope:** grants com escopo/expiração, `ALLOW/DENY/REQUIRE_APPROVAL`, budget envelope e executor sandboxed para WRITE/EXECUTE controlados.
- **Non-goals:** agente autônomo persistente.
- **Dependencies:** Fase 10.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- **Acceptance Criteria:** nenhuma elevação própria; confirmações vinculadas ao alvo; negação segura; auditoria de grants e efeitos.
- **Risks:** policy bypass e fadiga de aprovação.
- **Deferred Work:** policies organizacionais.

### Fase 12 — Coding Agent ephemeral

- **Goal:** executar tarefas de código autorizadas em workspace isolado.
- **Scope:** leitura, busca, edição, testes, lint, formatter, diff e avaliação independente.
- **Non-goals:** push, merge, deploy, migration real ou produção.
- **Dependencies:** Fases 9–11.
- **Required Reviews:** QA YES; DATABASE conforme tarefa; SECURITY YES; UI/UX NO.
- **Acceptance Criteria:** limites de repositório/rede; diff recuperável; testes registrados; operações sensíveis separadas.
- **Risks:** execução de código não confiável e supply chain.
- **Deferred Work:** agentes persistentes e múltiplos repositórios.

### Fase 13 — Agent Runtime ephemeral

- **Goal:** generalizar delegação limitada além de coding.
- **Scope:** registry, factory, runtime, policy, lifecycle, timeout, cancelamento e avaliação externa.
- **Non-goals:** agentes persistentes ou criação irrestrita de subagentes.
- **Dependencies:** Fases 9–12.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX conforme interface.
- **Acceptance Criteria:** contrato mínimo completo; budgets aplicados; permissões não herdadas; execuções correlacionadas.
- **Risks:** loops, custo e fan-out excessivo.
- **Deferred Work:** persistência de especialistas.

### Fase 14 — Skills versionadas

- **Goal:** transformar procedimentos aprovados em capacidades reutilizáveis.
- **Scope:** SkillRegistry, definição, executor, evaluator, versões imutáveis e provenance.
- **Non-goals:** aquisição autônoma de Skills críticas.
- **Dependencies:** Fases 10–13.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX conforme catálogo.
- **Acceptance Criteria:** versões e hashes rastreáveis; testes por skill; mudança crítica não ativa silenciosamente.
- **Risks:** cadeia de dependência e skill poisoning.
- **Deferred Work:** marketplace e compartilhamento público.

### Fase 15 — Learning e Experience Memory

- **Goal:** aprender de feedback, preferências e resultados sem alterar pesos.
- **Scope:** feedback, experiências, self-evaluation, recuperação contextual e propostas de procedures.
- **Non-goals:** fine-tuning, autoedição de core ou promoção automática de skill crítica.
- **Dependencies:** Fases 8, 13 e 14.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- **Acceptance Criteria:** taxonomia MEMORY/PREFERENCE/EXPERIENCE/PROCEDURE/SKILL; proveniência; correção/esquecimento; consolidação multi-evidência.
- **Risks:** poisoning, generalização indevida e retenção excessiva.
- **Deferred Work:** aprendizagem avançada e adaptação de policies.

### Fase 16 — Geração e edição de imagens

- **Goal:** adicionar imagem por contrato provider-agnostic.
- **Scope:** generate/edit/inpaint/remove-background/upscale conforme providers escolhidos, object storage e provenance.
- **Non-goals:** visão geral ou vídeo.
- **Dependencies:** Fases 7, 9 e 11.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- **Acceptance Criteria:** capability/provider/model/policy/cost separados; ownership e retenção; falhas e custos visíveis.
- **Risks:** privacidade, direitos autorais e custo.
- **Deferred Work:** vídeo e pipeline criativo multiagente.

### Fase 17 — Multimodal Input/Output Router

- **Goal:** normalizar texto, voz, imagem, documento, código e tela.
- **Scope:** envelopes, armazenamento por referência, extração segura, routing e outputs tipados.
- **Non-goals:** suporte completo a todo formato ou captura contínua de tela.
- **Dependencies:** Fases 9, 11 e 16.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- **Acceptance Criteria:** limites por modalidade; conteúdo tratado como não confiável; binários fora do PostgreSQL; consentimento explícito.
- **Risks:** dados sensíveis, parser exploits e custo de mídia.
- **Deferred Work:** vídeo e realtime multimodal contínuo.

### Fase 18 — Agentes persistentes

- **Goal:** permitir especialistas reutilizáveis governados.
- **Scope:** lifecycle persistente, versionamento, memory scope, revogação e avaliação periódica.
- **Non-goals:** autonomia ilimitada ou execução 24/7 sem orçamento.
- **Dependencies:** Fases 13–15.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- **Acceptance Criteria:** owner e provenance; revogação; budgets; nenhuma permissão permanente implícita.
- **Risks:** privilege creep e comportamento obsoleto.
- **Deferred Work:** agentes compartilhados entre usuários.

### Fase 19 — Automações e proatividade

- **Goal:** executar rotinas agendadas ou orientadas a eventos com segurança.
- **Scope:** scheduler durável, retries, idempotência, notificações, approval gates e quiet-by-default quando nada muda.
- **Non-goals:** ação sensível autônoma irrestrita.
- **Dependencies:** Fases 11, 13, 15 e 18.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX YES.
- **Acceptance Criteria:** retries idempotentes; cancelamento/revogação; orçamento; histórico; aprovação quando exigida.
- **Risks:** ações duplicadas, loops e custos silenciosos.
- **Deferred Work:** otimização autônoma de agendas.

### Fase 20 — Cloud production e advanced learning

- **Goal:** validar operação pública contínua e escalar aprendizado com governança.
- **Scope:** deploy reproduzível, secrets, broker distribuído, backup/restore, DR, observabilidade, SLOs, retenção e avaliações de aprendizado.
- **Non-goals:** relaxar safety boundaries.
- **Dependencies:** blockers de produção resolvidos e fases necessárias ao produto escolhido.
- **Required Reviews:** QA YES; DATABASE YES; SECURITY YES; UI/UX YES; aprovação do usuário YES.
- **Acceptance Criteria:** threat model, carga, restore, isolamento, quotas, auditoria e rollback validados em ambiente controlado antes de produção.
- **Risks:** custo operacional, complexidade distribuída e mudança irreversível.
- **Deferred Work:** capacidades sem demanda comprovada.

## DEPENDENCY ORDER

```text
Phase 5 closure
  → Identity
  → Consent/Audit
  → Semantic Memory
  → Model Router
  → Read-only Tools
  → Permissioned Effects
  → Coding Agent
  → Ephemeral Agents
  → Skills
  → Learning
  → Images / Multimodality
  → Persistent Agents
  → Automations
  → Production Scale / Advanced Learning
```

Essa ordem privilegia primeiro identidade, consentimento e rastreabilidade; depois execução; por fim autonomia. É possível desenvolver provas de conceito isoladas, mas elas não podem contornar as dependências de segurança para uso real.
