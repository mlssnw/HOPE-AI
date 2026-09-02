# Fase 2 — memória inteligente

## Entregas

A fundação da Fase 1 foi dividida em componentes especializados:

```text
MemoryService
  └─ MemoryManager
       ├─ MemoryClassifier
       ├─ EmbeddingService → EmbeddingProvider
       ├─ MemoryRetriever
       ├─ MemoryConsolidator
       ├─ EntityExtractor
       ├─ RelationManager
       └─ MemoryRepository / EntityRepository
```

- **Classificação:** diferencia preferências, metas, tarefas, relações, episódios,
  decisões e conhecimento.
- **Natureza:** toda memória é marcada como `fact`, `event` ou `inference`.
  Inferências recebem confiança limitada a 75%.
- **Importância:** pedidos explícitos, decisões, compromissos, datas e recorrência
  influenciam a captura automática.
- **Recuperação híbrida:** combina pgvector, correspondência textual e importância.
- **Consolidação:** duplicatas semânticas reforçam importância, confiança, tags,
  contagem de menções, data de reforço e fontes, sem criar outro registro.
- **Entidades:** extrator substituível identifica projetos, pessoas, tópicos e
  tecnologias; as ligações ficam persistidas em `memory_entities`.
- **Relações:** memórias semanticamente próximas recebem relações automáticas
  `semantic_related`. Relações manuais continuam separadas.
- **Explicabilidade:** a API informa fontes, eventos, entidades e relações que
  sustentam cada memória.

## Evolução do schema

A migração `20260902_0002` adiciona às memórias título, resumo, categoria, tags,
natureza, peso emocional, contagem de menções e último reforço. Também cria:

- `memory_sources`, para proveniência;
- `memory_entities`, para ligar memórias a entidades;
- índices orientados às consultas por usuário, tipo e entidade.

## Novas rotas

- `POST /api/memories/candidates`: avalia uma captura automática sem salvar tudo.
- `GET /api/memories/retrieve?q=...`: retorna resultado, score e tipo de match.
- `GET /api/memories/{id}/explanation`: explica por que a memória existe.
- `GET /api/memories/entities`: lista entidades do usuário.
- `GET /api/memories/entities/{id}/memories`: navega da entidade às memórias.
- `GET /api/memories/graph`: agora inclui entidades e seus vínculos.

As rotas continuam isoladas por usuário. O cabeçalho `X-Hope-User-Id` permanece
apenas como identidade de desenvolvimento até a fase de autenticação.

## Limites conscientes

O provider local usa hashing determinístico para permitir testes privados e sem
rede. A arquitetura aceita um provider semântico real, mas essa configuração será
feita junto da infraestrutura segura de provedores. O extrator atual é baseado em
regras auditáveis; uma implementação por modelo pode substituí-lo sem alterar os
repositórios.

A Fase 2 não conecta automaticamente o chat às memórias — isso pertence à Fase 5.
Também não inicia o Memory Globe, reservado para a Fase 3.
