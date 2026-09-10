# Interaction Patterns

## Pointer and Touch

| Ação | Resultado | Alternativa explícita |
|---|---|---|
| Clique/toque em nó | Seleciona e abre inspector | Lista textual de memórias |
| Duplo clique/toque | Foca nó e vizinhos | Botão “Focar” |
| Hover | Tooltip breve | Foco por teclado |
| Arraste | Rotaciona | Setas/controles de câmera |
| Shift + arraste / botão direito | Pan | Controles direcionais |
| Roda/pinch | Zoom | Botões `+` e `−` |
| Toque fora | Fecha camada não modal | Botão fechar / Escape |

Nenhuma função essencial pode depender de duplo clique, hover, botão direito ou gesto de dois dedos.

## Keyboard

- Ordem de Tab segue: skip link → marca/status útil → busca → controles do globo → canvas/lista → inspector → conversa → composer.
- Enter/Space ativa controles e seleção.
- Escape fecha, na ordem: confirmação, menu, inspector, modo Memória, fullscreen.
- Setas navegam a câmera; com lista de nós ativa, navegam itens.
- Atalhos devem ser mostrados no contexto e nunca interceptar digitação no composer.

## Selection

Seleção única é o padrão. Seleção múltipla só deve ser implementada quando existir ação correspondente; usar Ctrl/Cmd + clique e checkboxes na lista acessível. “Limpar seleção” precisa estar visível.

## Panels

Painéis não modais preservam o contexto do globo. Modais são reservados a confirmação destrutiva ou decisão obrigatória. Abrir um painel move foco para seu título/primeiro controle; fechar devolve foco ao acionador.

## Destructive Actions

“Esquecer” exige confirmação com título da memória, consequência e botões “Cancelar” e “Esquecer memória”. A ação destrutiva não usa posição/estilo idênticos à ação primária e aguarda resultado real antes de fechar.
