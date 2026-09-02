# Fase 3 — Memory Globe

## Resultado

A interface principal agora contém um Memory Globe WebGL funcional. Ele consome
`GET /api/memories/graph` e representa somente memórias, entidades e relações
persistidas. Núcleo, anéis e partículas são elementos de orientação visual; não
simulam dados de memória.

## Modelo visual

- Cada memória persistida vira um nó circular.
- Cada entidade persistida vira um nó em losango.
- Cada relação memória–memória ou memória–entidade vira uma linha.
- Importância aumenta tamanho, brilho e proximidade do núcleo.
- Contagem de acessos aumenta discretamente a proeminência do nó.
- Categoria e tipo distribuem memórias entre seis órbitas conceituais:
  identidade, temporal, conhecimento, contexto, aplicações e longo prazo.
- A posição é determinística a partir do identificador, evitando que o grafo se
  reorganize aleatoriamente a cada sincronização.

## Navegação

O globo oferece três níveis:

1. **Orbital:** mostra as memórias nas órbitas conceituais.
2. **Clusters:** inclui entidades e suas conexões semânticas.
3. **Memória:** isola a seleção e seus vizinhos diretos.

Controles disponíveis:

- arrastar para rotacionar;
- `Shift` + arrastar ou botão direito para mover;
- roda do mouse e teclas `+`/`-` para zoom;
- setas do teclado para rotacionar;
- passar o cursor para identificar um nó;
- selecionar para abrir o inspetor e consultar relações e proveniência;
- centralizar, expandir/recolher e sincronizar;
- buscar para destacar apenas memórias retornadas pela recuperação do backend.

O botão **Perguntar sobre esta memória** prepara a conversa com o contexto da
seleção. A incorporação automática de memória no pipeline de chat permanece
fora desta fase.

## Arquitetura

O frontend continua sem dependências de runtime externas. O renderer em
`frontend/js/memory-globe.js` usa WebGL diretamente, enquanto
`frontend/js/memory-globe-core.js` contém transformação, validação, layout e
filtragem testáveis sem DOM.

Essa separação mantém a aplicação leve, preserva a arquitetura modular atual e
permite substituir somente o renderer no futuro. A API e o schema de memória
não precisaram mudar nesta fase.

## Desempenho e acessibilidade

Os perfis Low, Medium, High e Ultra controlam quantidade de partículas, limite
de nós desenhados e resolução das órbitas. Memórias mais importantes têm
prioridade quando o limite é atingido. A animação automática respeita
`prefers-reduced-motion`.

O canvas aceita foco e teclado, tem rótulo acessível atualizado e é acompanhado
por controles HTML, estados de carregamento, banco desconectado, memória vazia
e WebGL indisponível.

## Integridade dos dados

O frontend descarta relações órfãs e nós malformados antes do layout. Busca,
seleção e conexões partem dos identificadores retornados pelo backend. Os dados
realistas usados para verificação visual existem somente em `tests/e2e_app.py`.

## Limites desta fase

- O UUID salvo no navegador continua sendo uma identidade de desenvolvimento,
  não autenticação.
- O grafo ainda é carregado por requisição; atualização em tempo real pertence
  à fase de event bus/WebSocket.
- O layout é determinístico e sem simulação física, privilegiando estabilidade
  e baixo custo.
- A validação com milhares de memórias requer uma base PostgreSQL representativa
  e métricas de hardware reais.
