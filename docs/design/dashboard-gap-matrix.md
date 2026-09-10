# Matriz de Gaps — Dashboard Oficial

Baseline funcional: `19e573893aba09da990256da05e7dab5af165ce1`
Visual target: [`official-dashboard.md`](official-dashboard.md)
Assessment date: 2026-09-10

Legenda:

- `IMPLEMENTED`: fluxo funcional identificável atende substancialmente ao alvo.
- `PARTIAL`: existe, mas composição, cobertura ou fidelidade ainda é incompleta.
- `PLANNED`: consta da arquitetura futura, sem implementação operacional suficiente.
- `NOT_IMPLEMENTED`: aparece no alvo, mas não existe no frontend atual.
- `CONSTRAINT`: requisito que a implementação visual não pode remover ou ocultar.

## Gap Matrix

| ID | Área | Target UI aprovado | Estado real e evidência | Gap verificável | Prioridade | Owner |
|---|---|---|---|---|---|---|
| UIUX-GAP-001 | Marca | Wordmark `HOPE`, sem expansão ou slogan | `NOT_IMPLEMENTED`: `frontend/index.html:18-20` ainda usa aria-label com expansão, `H·O·P·E` e subtítulo | Remover expansão, pontos e significado de sigla em conteúdo visível e acessível | P0 | Development |
| UIUX-GAP-002 | Composição principal | Canvas imersivo com globo dominante, rail lateral e chat integrado | `PARTIAL`: `frontend/styles/main.css:54-55` usa dois painéis/cards principais em grid | Reduzir leitura de dashboard SaaS e aproximar a composição contínua da referência | P0 | Development |
| UIUX-GAP-003 | Navegação lateral | Início, Explorar, Memória, Metas e Perfil em rail discreto | `NOT_IMPLEMENTED`: não existe navegação equivalente em `frontend/index.html` | Definir rotas/ações reais antes de expor itens; não criar botões inertes | P2 | Planner + Development |
| UIUX-GAP-004 | Memory Globe | Estrutura grande, rica em filamentos, órbitas e profundidade | `PARTIAL`: WebGL, partículas, órbitas, nós e relações existem em `frontend/js/memory-globe.js`; densidade visual é menor | Elevar fidelidade sem perder legibilidade, FPS ou significado dos dados | P0 | Development |
| UIUX-GAP-005 | Semântica dos nós | Nós de memória/entidade e relações reais | `IMPLEMENTED`: grafo normalizado e relações filtradas em `frontend/js/memory-globe-core.js` | Preservar contrato; nenhum nó promocional ou relação inventada | P0 CONSTRAINT | Development + QA |
| UIUX-GAP-006 | Categorias orbitais | Pessoas, Metas, Ideias, Planos, Experiências e Conhecimento legíveis no espaço | `PARTIAL`: anéis/categorias existem em `RING_LABELS`, mas não são apresentados como no target | Mapear rótulos do target às categorias reais; não confundir entidade com categoria | P1 | UI/UX + Development |
| UIUX-GAP-007 | Core Orb | Núcleo vivo em camadas, com filamentos, microanéis e estado reconhecível | `PARTIAL`: Core Orb e reação a estado existem, mas o volume é visualmente simples | Implementar anatomia de [`core-orb.md`](core-orb.md) e validar desempenho | P0 | Development |
| UIUX-GAP-008 | Estado da HOPE | Pill superior “PENSANDO · ANALISANDO RELAÇÕES” | `PARTIAL`: `AI_STATE_CHANGED`, normalização e texto de status existem em `memory-globe-core.js:25-34` e `memory-globe.js:428-430` | Consolidar estado visual superior e cobrir listening/executing/alert sem estados falsos | P0 | Development |
| UIUX-GAP-009 | Métricas superiores | Memórias, contexto e conexão com valores reais | `PARTIAL`: contagem do grafo e status realtime existem; “contexto” e “conexão/alinhamento” do mockup não possuem todas as métricas | Mostrar somente métricas com fonte real; omitir ou substituir campos não implementados | P1 CONSTRAINT | Planner + Development |
| UIUX-GAP-010 | Chat | Sessão atual, mensagens, input, enviar e microfone | `IMPLEMENTED`: `frontend/index.html:100-145` e `frontend/js/chat.js` cobrem conversa e controles | Reestilizar e integrar ao target sem quebrar consentimento, fontes, cancelamento e histórico | P0 | Development + QA |
| UIUX-GAP-011 | Voz | Entrada por microfone e leitura da resposta | `PARTIAL`: ditado usa Web Speech API e TTS existe; suporte depende do ambiente | Representar indisponibilidade, permissão, listening e speaking de forma explícita | P1 | Development + QA |
| UIUX-GAP-012 | Visão e arquivos | Abas “Visão” e “Arquivos” da referência | `PLANNED/NOT_IMPLEMENTED`: não há fluxo funcional correspondente no frontend atual | Não renderizar como ação ativa até fase e contratos serem autorizados; usar “Em breve” apenas se Planner aprovar | P3 | Planner |
| UIUX-GAP-013 | Automação | Capacidade futura comunicada pela visão do produto | `PLANNED`: automações estão fora da fase atual | Não acrescentar controle funcional nesta implementação visual | P3 CONSTRAINT | Planner |
| UIUX-GAP-014 | Inspector de Memória | Painel com tipo, importância, confiança, fonte e contexto | `PARTIAL`: inspector, relacionados, proveniência resumida, foco, perguntar e esquecer existem em `frontend/index.html:84-96` e `memory-globe.js` | Reorganizar campos, hierarquia e estados; expor apenas dados retornados pela API | P1 | Development |
| UIUX-GAP-015 | Controles do globo | Buscar, Centralizar, Expandir, Orbital e Clusters agrupados | `IMPLEMENTED`: controles equivalentes existem em `frontend/index.html:44-81` | Alinhar posição/hierarquia e preservar modo Memória e Qualidade mesmo quando não aparecem no hero | P1 | Development |
| UIUX-GAP-016 | Consentimento | Consentimento de memória e histórico local claro | `CONSTRAINT/IMPLEMENTED`: `frontend/index.html:126-135` separa “Memória no chat” e “Histórico local” | A referência promocional omite esses controles; a implementação real deve mantê-los acessíveis | P0 CONSTRAINT | Development + Security + QA |
| UIUX-GAP-017 | Exclusão segura | Esquecimento com alvo e consequência inequívocos | `IMPLEMENTED`: ação e diálogo acessível existem em `frontend/index.html:94,150-159` | Integrar ao novo visual sem reduzir contraste, confirmação ou retorno de foco | P0 CONSTRAINT | Development + Security + QA |
| UIUX-GAP-018 | Responsividade | Adaptação real, com chat-first no mobile e globo dedicado | `PARTIAL`: abaixo de 980 px o grid apenas empilha; `main.css:177-203` mantém o globo longo antes da conversa | Implementar os contratos de [`responsive.md`](responsive.md), sem miniaturizar o desktop | P0 | Development |
| UIUX-GAP-019 | Acessibilidade | Fluxo equivalente sem depender do canvas, cor ou movimento | `PARTIAL`: skip link, labels, foco e reduced motion existem; lista textual equivalente do grafo não | Criar fallback/lista navegável e validar WCAG 2.2 AA conforme [`accessibility.md`](accessibility.md) | P0 | Development + QA |
| UIUX-GAP-020 | Motion | Energia e relações respondem a eventos reais | `PARTIAL`: criação, atualização, remoção e estados têm transições; coreografia do target não | Implementar [`motion-system.md`](motion-system.md) com reduced motion e limites de custo | P1 | Development |
| UIUX-GAP-021 | Idioma | Interface principal em português brasileiro | `PARTIAL`: maior parte do frontend está em português, mas “MEMORY GLOBE”, “CORE ORB” e expansão inglesa da marca permanecem | Localizar termos de produto conforme glossário aprovado; nomes técnicos podem existir apenas quando deliberados | P0 | UI/UX + Development |
| UIUX-GAP-022 | Uso público | Hero pode apresentar visão sem prometer capacidade entregue | `CONSTRAINT`: target contém Visão/Arquivos e métricas não implementadas | Toda publicação usa “Interface conceitual” ou “Target UI” até fechamento dos gaps | P0 CONSTRAINT | Product/Owner |

## Implementation Priorities

### P0 — identidade, estrutura e confiança

- Corrigir a marca para `HOPE` como nome próprio.
- Aproximar shell, Memory Globe, Core Orb, estado e chat da composição aprovada.
- Criar comportamento responsivo real e equivalência acessível do grafo.
- Preservar consentimento e confirmação destrutiva mesmo quando ausentes no hero.

### P1 — fidelidade funcional

- Refinar categorias, métricas reais, inspector, controles, voz e motion.
- Medir custo visual nos perfis LOW, MEDIUM, HIGH e ULTRA.

### P2 — navegação

- Implementar rail somente após Planner definir destinos e estados reais.

### P3 — capacidades futuras

- Visão, arquivos e automação permanecem fora do frontend até fase explicitamente autorizada.

## Acceptance Criteria for Development Handoff

- Screenshot desktop demonstra a mesma hierarquia, paleta, densidade controlada e relação globo/chat do target.
- A marca aparece e é anunciada como `HOPE`, sem expansão.
- Nenhum contador, nó, relação, aba ou estado afirma capacidade inexistente.
- Memória, histórico local, cancelamento e exclusão segura continuam operáveis.
- Viewports 390 × 844, 768 × 1024, 1280 × 720 e 1440 × 900 são validados.
- Navegação por teclado, foco, reduced motion, contraste e fallback do canvas têm evidência.
- QA aprova comportamento; UI/UX revisa fidelidade contra o mesmo Functional Commit.
