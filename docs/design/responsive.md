# Responsive

Breakpoints são guias de composição, não substitutos para testes por conteúdo.

## Desktop — 1280 px+

Experiência completa: globo dominante, chat lateral, inspector sobre o globo, todos os modos e perfis gráficos.

## Notebook — 981–1279 px

Preservar duas colunas. Reduzir padding e detalhes ambientais; composer e ações principais permanecem sempre visíveis. Em alturas menores que 800 px, reduzir o stage antes de criar scroll global.

## Tablet — 681–980 px

- Uma região principal por vez com alternador “Memória / Conversa”.
- Conversa é a vista inicial quando o usuário entra por uma tarefa de chat; globo é inicial quando entra por memória.
- Inspector vira drawer; toolbar vira faixa rolável ou menu agrupado.
- Qualidade padrão Medium.

## Mobile — 320–680 px

- Chat é a experiência inicial e composer permanece alcançável.
- Um “Memory Pulse” compacto de 120–180 px mostra Core Orb, estado e contagem; tocar abre o globo.
- Globo completo abre em tela dedicada/fullscreen, com toolbar simplificada.
- Inspector usa bottom sheet; ações têm alvos de 44 px.
- Status de serviços entra em um botão/resumo; não comprime marca e conteúdo em uma linha.
- Dicas de mouse são substituídas por instruções de toque.
- Qualidade padrão Low ou Medium conforme capacidade medida.

## Current Gap

Na inspeção de 390 × 844 px, a implementação apenas empilha a versão desktop: o Memory Globe ocupa a primeira tela longa e deixa a conversa abaixo da dobra. Isso contradiz a prioridade mobile e é `NEEDS_REDESIGN`.

## Testing Matrix

Validar ao menos 320 × 568, 390 × 844, 768 × 1024, 1024 × 768, 1280 × 720, 1440 × 900 e 1920 × 1080; testar zoom do navegador a 200%, orientação landscape e textos 30% maiores.
