# Dashboard Oficial da HOPE

Decision ID: `UIUX-VIS-2026-09-10-001`
Decision status: APPROVED
Decision type: PRE-IMPLEMENTATION / VISUAL TARGET
Approved by: UI/UX / Visual Design, por decisão explícita da usuária
Approval date: 2026-09-10
Functional baseline for gap analysis: `19e573893aba09da990256da05e7dab5af165ce1`
Repository HEAD observed: `563cdf93ac3992d780d5aa500719d23625c69b11` — documentação/governança posterior ao Functional Commit

## Referência canônica

![Dashboard oficial da HOPE](assets/hope-dashboard-approved-2026-09-10.png)

- Asset versionado: [`assets/hope-dashboard-approved-2026-09-10.png`](assets/hope-dashboard-approved-2026-09-10.png)
- Fonte escolhida pela usuária: `Hope dashboard`
- Formato: PNG, 16:9, 1672 × 941 px
- SHA-256: `C254390EF8DCECEF5A081E02D333529DE12948AB08904A6FDBC895767936E31C`
- Proveniência: mockup conceitual gerado para o projeto a partir de briefing da usuária e refinado para português brasileiro.

O checksum da fonte escolhida e do asset canônico é idêntico. O arquivo dentro de `docs/design/assets/` é a referência estável para Development, QA, UI/UX e Planner; o arquivo solto na raiz não deve ser usado como dependência de implementação.

## Escopo da aprovação

Aprova-se a direção visual da tela principal da HOPE:

- composição desktop imersiva com Memory Globe dominante;
- Core Orb âmbar/dourado como centro vivo da experiência;
- navegação lateral discreta;
- estado operacional superior;
- chat de sessão atual em painel lateral;
- Inspector de Memória conectado à seleção;
- controles do globo agrupados na base;
- superfícies grafite/azul profundo, texto branco quente e ciano raro;
- linguagem cinematográfica, premium, técnica e funcional;
- interface em português brasileiro.

Esta aprovação não declara o mockup pixel a pixel como implementação final. Densidade, tamanhos, contraste, conteúdo, acessibilidade, desempenho e responsividade seguem os contratos dos demais documentos em `docs/design/`.

## Identidade obrigatória

O nome do produto é **HOPE**. Não é abreviação nem sigla.

- Escrever `HOPE`, sem pontos intermediários.
- Não expandir o nome para “Holistic Operational Personal Engine” ou qualquer outra frase.
- Não acrescentar subtítulo explicativo, slogan automático ou significado retroativo.
- Tracking tipográfico pode ser usado como recurso visual desde que a palavra continue inequivocamente legível como `HOPE`.

## Hierarquia visual aprovada

1. Memory Globe e Core Orb.
2. Estado atual da HOPE.
3. Conversa e ação de enviar/voz.
4. Memória selecionada e proveniência.
5. Navegação, métricas e controles auxiliares.

O globo deve ocupar aproximadamente 58–64% do peso visual no desktop. O chat permanece utilizável e legível, mas não domina a tela. O inspector é contextual e nunca cobre o núcleo ou a relação selecionada.

## Elementos não negociáveis

- Nós e relações representam dados reais ou regras derivadas documentadas.
- O Core Orb não é planeta, esfera sólida ou decoração sem estado.
- Movimento comunica operações reais e respeita `prefers-reduced-motion`.
- Estados, números e métricas não podem ser fabricados para coincidir com o mockup.
- Consentimento de memória, confirmação destrutiva e outros controles de segurança permanecem visíveis quando funcionalmente necessários, ainda que não apareçam na peça promocional.
- Toda informação essencial possui alternativa a cor, brilho, hover, gesto ou WebGL.

## Uso público

O asset pode ser usado em LinkedIn, portfólio, apresentações e capa do projeto com a identificação `Interface conceitual` ou `Target UI` enquanto a matriz de gaps possuir itens `PARTIAL`, `PLANNED` ou `NOT_IMPLEMENTED`.

## Implementação

Development deve usar este documento, a referência canônica e [`dashboard-gap-matrix.md`](dashboard-gap-matrix.md) como entrada. Limitações técnicas devem retornar a UI/UX/Planner; não autorizam a criação de outra identidade visual. A implementação requer novo Functional Commit, testes, screenshots nos viewports definidos e revisão visual posterior de UI/UX.
