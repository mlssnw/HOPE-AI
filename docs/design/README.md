# Design do HOPE AI

Esta pasta pertence ao Work UI/UX e contém especificações versionadas de experiência, layout, interação, motion, estados, responsividade, acessibilidade e design system.

## Dashboard oficial

O dashboard escolhido pela usuária está **APPROVED** como `TARGET UI` da tela principal, conforme a decisão `UIUX-VIS-2026-09-10-001`.

- [Decisão e referência visual canônica](official-dashboard.md)
- [Matriz de gaps entre o target e o frontend real](dashboard-gap-matrix.md)
- [Asset aprovado](assets/hope-dashboard-approved-2026-09-10.png)

A aprovação é de direção visual, não da implementação atual. `TARGET UI` não altera o status funcional de nenhuma capacidade.

## Dois momentos de UI/UX

### PRE-IMPLEMENTATION

UI/UX cria ou atualiza a especificação em `docs/design/`, registra critérios verificáveis e entrega o handoff ao DEV. Por padrão, UI/UX não implementa o frontend.

### POST-IMPLEMENTATION

UI/UX revisa o Functional Commit exato contra a especificação e persiste o resultado em [`docs/reviews/uiux-latest.md`](../reviews/uiux-latest.md). A revisão não altera código sem autorização explícita.

Arquivos futuros devem ter nomes descritivos e indicar fase, status e referência visual. Não coloque secrets, dados pessoais reais ou ativos sem licença nesta pasta.

## Visual concepts

- [`linkedin-hero.md`](linkedin-hero.md) — registro da hero 16:9 aprovada para apresentação pública da HOPE.
