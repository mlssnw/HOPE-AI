# Accessibility

## Baseline

Alvo: WCAG 2.2 AA para fluxos essenciais. Informação importante nunca depende apenas de cor, brilho, posição ou animação.

## Requirements

- Contraste mínimo de 4,5:1 para texto normal e 3:1 para texto grande, ícones essenciais e contornos de controles.
- Foco visível de pelo menos 2 px, com contraste de 3:1 contra superfícies adjacentes.
- Alvos de toque mínimos de 44 × 44 px; espaçamento evita ativações acidentais.
- Labels acessíveis para ícones, canvas, toggles e estados; ícone decorativo fica oculto.
- Mensagens de erro identificam campo/problema e recuperação; foco vai ao resumo quando necessário.
- Atualizações frequentes do Orb não devem ser anunciadas. Anunciar apenas mudança relevante de estado, resultado de ação ou erro.
- `aria-live="polite"` para status normal; `assertive` apenas para falha urgente que exige ação.
- Conteúdo do chat preserva heading, lista, link e código sem executar HTML não confiável.

## Memory Globe Equivalent

O canvas precisa de uma lista textual sincronizada, pesquisável e navegável contendo nós visíveis, tipo e relações. Selecionar na lista seleciona no globo. O inspector é DOM semântico e não depende do canvas.

## Keyboard

Todo fluxo — buscar, alternar visão, focar memória, abrir/fechar inspector, perguntar, editar e esquecer — funciona sem ponteiro. O foco nunca fica preso no canvas ou painel.

## Reduced Motion and Sensory Safety

Respeitar `prefers-reduced-motion`; oferecer controle persistente quando animação ambiente for relevante. Evitar flashes acima de três por segundo, pulsos abruptos e zoom automático excessivo.

## WebGL Fallback

Quando WebGL falhar ou estiver desativado, exibir lista/cluster textual com busca, filtros, relações e inspector. A conversa e memória continuam funcionais.

## Current Findings

- Positivos: skip link, elementos HTML, labels, foco básico, `aria-live`, canvas focalizável e reduced motion existem.
- Gaps: controles e rótulos muito pequenos, ícones de voz ambíguos, ausência de lista equivalente aos nós, dica centrada em mouse no mobile e necessidade de auditoria de contraste automatizada/manual.
