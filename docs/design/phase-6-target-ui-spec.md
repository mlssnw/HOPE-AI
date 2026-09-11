# Phase 6 — Target UI Implementation Specification

Status: APPROVED
Review type: PRE-IMPLEMENTATION SPECIFICATION
Approval date: 2026-09-11
Functional baseline: `88e194778b4399a6713f118470f9d861c553cd9e`
Architecture decision: `ARCH-2026-09-10-003`
Visual decision: `UIUX-VIS-2026-09-10-001`
Coordinator authorization: `0bcc25a5437cab8a326e64281579ead56274d8cb`

## Purpose

Este documento fecha o contrato de implementação visual da Phase 6. Ele transforma o Target UI e a matriz de gaps em decisões verificáveis para Development sem alterar API, persistência, providers ou capacidades.

O dashboard aprovado é referência de hierarquia, proporção, atmosfera e linguagem visual. O baseline funcional é a autoridade para dados, estados e ações disponíveis. Quando a imagem mostrar algo que o baseline não executa, o elemento é omitido; nunca é substituído por botão inerte, métrica simulada ou conteúdo promocional.

## Authority and Conflict Resolution

1. O scope, os non-goals, os acceptance criteria e os Required Reviews de `docs/phase-6.md` permanecem inalterados.
2. Este documento fecha decisões de apresentação e interação da Phase 6.
3. Os demais contratos de `docs/design/` detalham foundations, Globe, Core Orb, motion, responsividade e acessibilidade.
4. O asset canônico orienta composição, mas não autoriza capabilities ausentes.

Nenhuma limitação visual autoriza mudança de backend, novo contrato de dados ou ampliação de fase. Se um requisito exigir isso, Development deve parar e devolver a questão ao COORDINATOR/PLANNER.

## Phase 6 Surface Model

### Desktop — 1280 px ou mais

- Superfície contínua e imersiva, sem leitura de dois cards equivalentes.
- Memory Globe ocupa 60–64% da largura útil; conversa ocupa 36–40%.
- Marca `HOPE` fica inequívoca no canto superior, sem expansão, pontos ou slogan.
- Estado operacional da HOPE fica próximo ao topo do Globe e nunca sobrepõe o núcleo.
- Inspector flutua dentro da região do Globe, com 320–380 px, sem cobrir Core Orb, nó selecionado ou relação focal.
- Composer permanece alcançável em 1280 × 720 sem scroll global obrigatório; histórico e inspector podem ter scroll interno.
- O rail conceitual da referência não é implementado nesta fase. O espaço é absorvido pela composição; não criar “Início”, “Explorar”, “Memória”, “Metas” ou “Perfil” como rotas, botões inertes ou itens “em breve”.

### Notebook — 981–1279 px

- Preserva duas colunas em proporção 56–60% / 40–44%.
- Toolbar pode quebrar em duas linhas mantendo busca primeiro, ações depois e ordem de Tab coerente.
- Reduz densidade ambiental e padding antes de reduzir texto ou alvos.

### Tablet — 681–980 px

- Exibe uma superfície principal por vez com alternador de apresentação `Conversa` / `Memória`; isso alterna regiões já existentes e não cria navegação de produto.
- Estado inicial é `Conversa`. Abrir `Memória` preserva chat e seleção; voltar restaura o foco ao acionador.
- Globe usa perfil MEDIUM por padrão; inspector é drawer com título fixo e corpo rolável.

### Mobile — 320–680 px

- Estado inicial obrigatório: conversa e composer; o usuário não atravessa o Globe para chegar ao chat.
- Um resumo de memória de 120–180 px pode mostrar Core Orb simplificado, estado textual real e contagens reais. Tocar abre a superfície dedicada do Globe.
- Globe completo ocupa uma view/overlay dedicada com fechamento explícito; Escape e o botão Voltar devolvem foco ao acionador.
- Inspector é bottom sheet de até 88% da altura, com cabeçalho fixo, conteúdo rolável e ações visíveis.
- Controles têm alvo mínimo de 44 × 44 px; composer permanece alcançável com teclado virtual e em landscape.
- Instruções de mouse são substituídas por texto de toque/teclado apropriado.

## P0/P1 Baseline Mapping

| Gap | Componente e estado/fluxo | Capacidade real no baseline | Contrato fechado da Phase 6 |
|---|---|---|---|
| `UIUX-GAP-001` P0 | Marca e nome acessível | `frontend/index.html` possui brand visual e `aria-label` | Exibir e anunciar somente `HOPE`; remover expansão, pontos e subtítulo de sigla em title, metadata, DOM visível e acessível. |
| `UIUX-GAP-002` P0 | App shell desktop/notebook | `.workspace`, `.core-panel` e `.conversation` formam grid de dois cards | Reorganizar em superfície imersiva contínua nas proporções definidas, sem remover qualquer fluxo existente. |
| `UIUX-GAP-004` P0 | Memory Globe: ready, focus, search e realtime | WebGL, anéis, partículas, nós, arestas, câmera e seleção em `memory-globe.js` | Aumentar profundidade/filamentos com teto por perfil; cada elemento semântico continua ligado ao grafo real. Elemento ambiental não pode parecer nó ou relação. |
| `UIUX-GAP-005` P0 CONSTRAINT | Normalização e renderização do grafo | `normalizeGraph`, `layoutGraph`, `visibleScene` e eventos incrementais filtram nós/relações reais | Preservar IDs, tipos, pesos, seleção e relações; não criar dados para preencher a composição. Contagem é do payload normalizado completo, não do LOD desenhado. |
| `UIUX-GAP-007` P0 | Core Orb: idle, thinking, searching, speaking e error | `AI_STATE_CHANGED` alimenta estados normalizados e o renderer altera pulso/intensidade | Implementar seed, volume, filamentos, microanéis e halo. Somente estados reais alteram significado; ruído procedural pode dar textura, nunca estado. |
| `UIUX-GAP-008` P0 | Status da HOPE e Core Orb | Labels reais: idle/conectado, thinking, searching, speaking e error | Consolidar pill textual sincronizado com o evento atual. `LISTENING` só pode derivar do reconhecimento de voz realmente ativo. `EXECUTING` e `ALERT` não aparecem nesta fase porque o baseline não os emite. |
| `UIUX-GAP-010` P0 | Conversa: empty, history, busy, success, error e cancel | Mensagens, composer, fontes, envio, cancelamento, TTS e histórico local em `chat.js`/`ui.js` | Integrar ao painel lateral; Enviar é primário, Cancelar fica visível durante busy, fontes ficam ligadas à resposta e foco retorna ao composer ao concluir/cancelar. |
| `UIUX-GAP-016` P0 CONSTRAINT | Consentimento de memória e histórico local | Checkboxes independentes; memória default off; histórico só usa `localStorage` quando habilitado | Manter os dois controles visíveis e separados. “Memória no chat” explica recuperar/salvar/enviar trechos ao provider. Badge de serviço usa “Serviço de memória disponível/indisponível” e nunca “memória ativa”. |
| `UIUX-GAP-017` P0 CONSTRAINT | Esquecimento: closed, confirm, submitting, error e success | Diálogo com UUID, alvo, consequência, Cancelar inicial, Escape e retorno de foco | Preservar contrato integral. Durante submitting, ações ficam indisponíveis; erro permanece no diálogo, reabilita controles e foca Cancelar; fechar só após resultado real. |
| `UIUX-GAP-018` P0 | Shell responsivo, composer, Globe e inspector | CSS atual apenas empilha abaixo de 980 px | Implementar os quatro modelos de viewport acima; 390 × 844 e 320 × 568 começam no chat. Nenhum controle primário fica fora da viewport ou depende de scroll horizontal. |
| `UIUX-GAP-019` P0 | Teclado, foco, lista equivalente e fallback | Skip link, labels, foco básico e canvas focalizável existem; lista equivalente não existe | Criar lista textual sincronizada com o payload do grafo, pesquisável e navegável. Seleção abre o mesmo inspector; sem WebGL, lista + busca + relações + inspector substituem o canvas sem bloquear conversa/memória. |
| `UIUX-GAP-021` P0 | Idioma e microcopy | Interface majoritariamente pt-BR; termos/expansão em inglês permanecem | Usar `HOPE`, `Globo de Memória` e `Núcleo HOPE` em texto para usuário. Termos técnicos internos podem permanecer no código; não aparecem como branding. |
| `UIUX-GAP-022` P0 CONSTRAINT | Claims e uso público | O asset é conceitual e o frontend não implementa todas as áreas mostradas | Não declarar dashboard concluído antes do review final. Screenshots parciais usam “Implementação em andamento”; asset conceitual continua identificado como `Target UI`. |
| `UIUX-GAP-006` P1 | Anéis/categorias | `RING_LABELS`: Identidade, Temporal, Conhecimento, Contexto, Aplicações e Longo prazo | Exibir somente esses rótulos reais. “Pessoas”, “Metas”, “Ideias”, “Planos” e “Experiências” não substituem categorias sem mapeamento de dados aprovado; entidade não vira categoria. |
| `UIUX-GAP-009` P1 CONSTRAINT | Readout e status de serviços/realtime | Contagem de memórias/entidades e estados configured/available/connected/degraded | Permitido: contagens do grafo normalizado e disponibilidade textual dos serviços/realtime. Omitir “contexto ativo”, alinhamento, porcentagens, tendência, estabilidade inferida e qualquer número sem fonte. |
| `UIUX-GAP-011` P1 | Ditado e leitura: unsupported, idle, listening, speaking e error | Web Speech API controla ditado; health/TTS controla disponibilidade e leitura | Usar ícones inequívocos + label. Mostrar “Ouvindo” apenas entre `onstart` e `onend`; “HOPE falando” somente durante áudio/estado real; indisponibilidade e permissão negada têm texto e recuperação. |
| `UIUX-GAP-014` P1 | Inspector: loading, ready, updated, removed e error | Título, kind/type, conteúdo, importância, confiança, menções, fontes, entidades e relacionados vêm do grafo/explanation | Organizar apenas campos retornados. Omitir valor ausente sem placeholder fictício. Ações permanecem Focar, Perguntar e Esquecer; “Editar” não aparece enquanto não houver fluxo autorizado. |
| `UIUX-GAP-015` P1 | Busca, sincronizar, centralizar, expandir, modos e qualidade | Controles equivalentes já executam funções reais | Agrupar na base/superfície contextual. Modo Memória fica indisponível sem seleção e explica o motivo. Expandir/fechar preserva estado e foco. Não transformar controles em navegação global. |
| `UIUX-GAP-020` P1 | Motion de estados e eventos | Birth/update/delete, foco, rotação e pulso do Orb já respondem a eventos | Aplicar timings de `motion-system.md`; nó fica interativo antes do polish terminar. Reduced motion remove ambiente, trilhas, inércia e zoom automático; texto/contraste continuam comunicando estado. |

## State Truth Table

| Superfície | Estados permitidos | Fonte de verdade | Regra de apresentação |
|---|---|---|---|
| Chat | empty, idle, busy, success, cancelled, error | `ChatController`, AbortController e resposta HTTP | Nunca mostrar progresso após cancelamento reconhecido; `QA-003` exige sincronizar o Globe de volta ao estado real. |
| Memória | loading, empty, ready, degraded realtime, unavailable, error | graph HTTP, health e estado do WebSocket | “Disponível” descreve serviço, não consentimento. Memória indisponível mantém chat funcional e explica ausência de contexto persistente. |
| Core Orb | idle, thinking, searching, speaking, error | `AI_STATE_CHANGED` | Texto é primário; cor/movimento reforçam. Estado desconhecido volta a idle. |
| Ditado | unsupported, idle, listening, error | Web Speech callbacks | Listening não altera o Core Orb sem sinal local explícito e sincronizado. |
| Esquecimento | closed, confirm, submitting, error, success | confirmação normalizada + resultado DELETE | Alvo e consequência permanecem visíveis até sucesso; erro não fecha o diálogo. |
| Globe | loading, empty, ready, focused, search results, no results, degraded, unavailable | payload normalizado, busca e realtime | Nenhum skeleton simula nós; no-results preserva o grafo; foco aceita somente IDs presentes. |

## Accessibility and Focus Contract

- WCAG 2.2 AA para fluxos essenciais: texto normal 4,5:1; texto grande, ícones essenciais e foco 3:1.
- Foco visível mínimo de 2 px. Alvos: 44 × 44 px em toque; desktop admite 36 × 36 px com foco claro.
- Texto mínimo: 12 px em controles e 11 px em metadado não essencial.
- Status rotineiro usa `aria-live="polite"`; `assertive` fica restrito a falha urgente. Atualizações contínuas do Orb não são anunciadas.
- Ordem desktop: skip link → busca/controles do Globe → canvas ou lista → inspector → conversa → composer. Elementos meramente visuais não recebem Tab.
- Ordem tablet/mobile: skip link → conversa/composer → resumo/alternador de memória → Globe/lista → inspector.
- Escape fecha na ordem: confirmação → menu/drawer/bottom sheet → inspector → modo Memória → fullscreen/overlay, devolvendo foco ao acionador correspondente.
- Toda função de pointer/hover/gesto possui controle visível e alternativa de teclado.

## WebGL Fallback Contract

Se a criação do renderer WebGL falhar, o controller ainda carrega o mesmo payload real de `/api/memories/graph` e apresenta:

- mensagem “Visualização 3D indisponível” com impacto e ação de tentar novamente;
- busca textual e contagem do grafo;
- lista navegável de memórias/entidades com tipo/categoria e relações disponíveis;
- seleção sincronizada com o mesmo inspector DOM;
- ações Perguntar, Focar relacionados e Esquecer quando aplicáveis;
- estados empty, unavailable e error sem nós simulados.

O fallback não exige API nova, não reduz o consentimento e não oculta a conversa.

## Quality Profiles

| Perfil | Default | Baseline visual | Contrato funcional |
|---|---|---|---|
| LOW | mobile ou hardware limitado | até 90 partículas, 400 nós visuais e 48 segmentos | Sem rotação automática; seed/volume simples; lista acessível mantém todos os itens recebidos. |
| MEDIUM | tablet/notebook | até 220 partículas, 1000 nós visuais e 72 segmentos | Um halo focal, DPR até 1,5 e movimento lento. |
| HIGH | desktop | até 480 partículas, 2500 nós visuais e 96 segmentos | Estado visual completo com glow contido; alvo de 45+ FPS no hardware de validação documentado. |
| ULTRA | somente opt-in explícito | até 900 partículas, 6000 nós visuais e 128 segmentos | Detalhe adicional com teto medido; nunca padrão automático nem fonte de informação exclusiva. |

- Perfil altera fidelidade e LOD, nunca contagens, ações, seleção, relações essenciais, inspector ou estados.
- Reduced motion prevalece sobre o perfil escolhido.
- Mudança automática de breakpoint define apenas o default inicial; não sobrescreve escolha manual durante a sessão.
- Se o desempenho cair abaixo do alvo medido, reduzir efeitos antes de esconder informação funcional.

## Capability Claim Allowlist

Podem aparecer como disponíveis somente quando o baseline e o estado atual confirmarem:

- chat e cancelamento;
- histórico local opcional;
- memória persistente opt-in;
- busca Web e Obsidian quando configurados/disponíveis;
- ditado quando suportado pelo navegador;
- leitura em voz quando o serviço estiver configurado/disponível;
- Globe, busca, sincronização, foco, modos, qualidade e inspector;
- contagens de memórias/entidades e estado de realtime derivados do payload/conexão.

Devem ser omitidos nesta fase, inclusive em estado disabled ou “em breve”:

- Visão, Arquivos, Automação;
- tools, coding, skills ou agents;
- navegação global sem destino real;
- perfil/conta do owner;
- timestamps de mensagem não fornecidos pelo baseline;
- métricas de contexto, alinhamento, progresso ou estabilidade sem contrato real.

## Development Evidence Package

O Functional Commit da Phase 6 deve entregar, para QA/Security/UI/UX:

- diff restrito ao frontend/testes/documentação funcional da fase, sem schema ou backend novo;
- screenshots em 320 × 568, 390 × 844, 768 × 1024, 1024 × 768, 1280 × 720, 1440 × 900 e 1920 × 1080;
- evidência de zoom 200%, texto 30% maior, landscape e teclado completo;
- contraste medido, ordem de foco e retorno de foco nos overlays/diálogo;
- demonstração de reduced motion e dos quatro perfis;
- cenário WebGL indisponível com lista, busca, inspector e conversa funcionais;
- estados loading, empty, ready, degraded, unavailable e error sem dados inventados;
- browser E2E para consentimento, histórico local, cancelamento, memória opt-in/opt-out e esquecimento;
- console e Network sem erros inesperados;
- medição de FPS com hardware, viewport, perfil, quantidade de nós e método registrados.

## Definition of Ready for Development

- Todos os gaps P0/P1 possuem componente, fonte real, fluxo e aceite definidos neste documento.
- `UIUX-F5-W01`, `UIUX-F5-W02` e `UIUX-F5-W03` estão incorporados como correções obrigatórias.
- Desktop, notebook, tablet e mobile possuem composição inequívoca.
- Fallback, teclado, reduced motion e perfis possuem comportamento fechado.
- Capacidades futuras e métricas sem fonte possuem regra explícita de omissão.
- Não existe decisão visual pendente que exija ampliar scope ou contrato funcional.

Resultado: `APPROVED` para Development implementar exclusivamente a Phase 6 autorizada e produzir um novo Functional Commit revisável.
