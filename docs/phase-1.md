# Fase 1 — fundação cloud-first e memória persistente

## Diagnóstico da base recebida

- **Arquitetura:** frontend modular sem framework, servido pela mesma aplicação FastAPI que protege as integrações externas.
- **Funcionalidades:** chat Claude, Tavily, Obsidian, ElevenLabs, ditado do navegador, histórico local e canvas neural 2.5D.
- **Problemas:** execução local, serviços concentrados e ausência de identidade, banco, migrações, memória persistente, busca vetorial e grafo real.
- **Segurança:** credenciais já ficam no backend e a renderização é defensiva; uso em nuvem ainda exige autenticação, autorização, rate limiting e auditoria operacional.
- **Banco de dados:** não existia.
- **Frontend:** responsivo e seguro; o globo atual é apenas visual.
- **Backend:** funcional, porém sem separação entre domínio e persistência.
- **Dependências:** FastAPI, HTTPX, Pydantic e Uvicorn antes desta fase.

## O que esta fase entrega

```text
FastAPI
  ├─ APIs existentes (chat, voz e saúde)
  └─ /api/memories
       └─ MemoryManager
            ├─ classificação e importância
            ├─ consolidação de duplicatas
            ├─ EmbeddingProvider
            └─ MemoryRepository
                 └─ SQLAlchemy async
                      └─ PostgreSQL + pgvector
```

O schema inicial possui `users`, `memories`, `memory_relations`, `entities`,
`entity_relations`, `conversations`, `messages` e `memory_events`. Todas as
consultas do domínio de memória recebem `user_id`, evitando cruzamento acidental
entre usuários.

O `LocalHashEmbeddingProvider` permite desenvolvimento e testes sem enviar dados
para terceiros. Ele é uma implementação básica, não um modelo semântico de
produção. O contrato `EmbeddingProvider` permite substituí-lo por qualquer
provedor compatível na próxima etapa.

## Decisões de segurança

- `DATABASE_URL` e chaves continuam apenas no ambiente e nunca no frontend.
- A aplicação não cria nem altera schema ao iniciar; produção usa migrações Alembic.
- As novas rotas exigem `X-Hope-User-Id` como barreira transitória e validam UUID.
- Esse cabeçalho **não é autenticação**. Não exponha as rotas publicamente antes
  da implementação de tokens, sessões e autorização no servidor.
- A API antiga continua funcionando quando `DATABASE_URL` está vazia; nesse caso,
  a memória retorna `503` e o indicador de banco aparece como não configurado.

## Próxima etapa recomendada

Adicionar autenticação real, provider semântico de produção, criptografia de
campos sensíveis, rate limiting e integração da memória ao pipeline de chat.
Depois disso, a Memory Globe poderá consumir `/api/memories/graph`. A referência
visual dourada enviada deve orientar esse frontend futuro, sem misturar a camada
visual com o domínio de dados.
