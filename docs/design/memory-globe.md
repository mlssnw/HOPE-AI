# Memory Globe

## Purpose

O Memory Globe é a visualização primária do conhecimento persistido. Cada nó representa memória ou entidade real; cada conexão representa relação persistida ou regra derivada documentada. Elementos ambientais podem orientar, mas nunca simular conteúdo.

## Views

### Orbital View

Visão inicial. Exibe memórias em anéis conceituais estáveis, com importância afetando tamanho, luminosidade e proximidade. Entidades podem permanecer ocultas para reduzir ruído.

### Cluster View

Expõe entidades e relações semânticas. Clusters devem preservar posição relativa da visão orbital; a transição não pode reorganizar tudo sem explicação.

### Memory View

Isola a memória selecionada e vizinhos diretos. Conexões externas ficam ocultas ou muito atenuadas. O inspector abre em paralelo e o botão “Voltar ao globo” permanece visível.

## Camera

- Rotação: arraste principal; inércia curta de no máximo 320 ms.
- Pan: Shift + arraste, botão secundário ou controle visível.
- Zoom: roda/pinch e botões `+`/`−`; limites impedem perder o grafo.
- Foco: animação de 320–480 ms, mantendo contexto periférico.
- Centralizar: restaura zoom e orientação, não apaga seleção sem avisar.
- Movimento automático pausa em hover, foco, reduced motion ou interação recente.

## Interaction

- Hover mostra título/nome, tipo e relevância em tooltip sem capturar o ponteiro.
- Clique seleciona e abre inspector.
- Duplo clique foca a memória; clique simples continua sendo suficiente para acessar a mesma ação no inspector.
- Escape fecha tooltip/inspector ou sai de fullscreen em ordem reversa.
- Teclado: foco no canvas revela instruções; setas orbitam, `+`/`−` aproximam, Enter abre o item destacado e Escape retorna.
- Touch: um dedo orbita; dois dedos fazem pan/zoom. Controles visíveis oferecem equivalência.

## Density and Performance

- Priorizar memórias por importância, relevância atual e recência quando o LOD limitar renderização.
- Usar instancing/buffers agrupados; evitar um objeto DOM ou draw call por partícula.
- Rótulos persistentes ficam limitados ao foco, seleção e poucos marcos.
- Clustering deve ser determinístico e estável.
- Meta de milhares de nós exige medição real; a API atual limita o grafo e não certifica essa escala.

## Search

1. Usuário envia consulta.
2. Status muda para “Buscando relações”.
3. Resultados reais são destacados; não resultados são atenuados, não apagados abruptamente.
4. Câmera foca o primeiro resultado sem impedir navegação entre os demais.
5. Uma faixa/lista acessível informa quantidade, resultado atual e comandos “Anterior/Próximo/Limpar”.
6. Sem resultado: manter o globo e mostrar mensagem clara.

## Data Events

- Criação adiciona apenas o novo nó e relações recebidas.
- Atualização pulsa o nó existente e reajusta somente o necessário.
- Remoção dissolve o nó após confirmação concluída no fluxo funcional.
- Reconciliação completa é reservada à conexão inicial, recuperação e divergência detectada.

## States

| Estado | Representação |
|---|---|
| Loading | Orb presente em baixa intensidade; status “Recuperando memórias”; controles dependentes desabilitados. |
| Empty | Orb permanece vivo; mensagem explica como memórias aparecem; nenhuma órbita falsa. |
| Degraded realtime | Grafo utilizável; badge textual “Sincronização periódica”; ação “Tentar reconectar”. |
| Database unavailable | Sem nós fabricados; conversa continua e explica ausência de contexto persistente. |
| WebGL unavailable | Lista textual navegável com busca e inspector; ação de tentar novamente. |
| Error | Mensagem específica, retry quando seguro e identificador técnico somente em detalhes. |

## Inspector Contract

Campos: título, natureza (`FACT`, `EVENT`, `INFERENCE`), categoria, importância, confiança, criação, atualização, origem, memórias relacionadas, entidades e relações. Proveniência e confiança devem ser compreensíveis, não apenas percentuais.

Ações: Perguntar à HOPE, focar relacionados, editar e esquecer. “Esquecer” é destrutivo, exige confirmação explícita com nome do alvo e não pode compartilhar o mesmo estilo da ação principal.
