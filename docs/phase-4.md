# Fase 4 — Memória em tempo real

## Objetivo

A Fase 4 conecta as mutações persistidas no backend ao Memory Globe sem reconstruir
o grafo inteiro a cada alteração. A leitura HTTP continua sendo a fonte de
ressincronização e o sistema permanece utilizável quando o WebSocket está indisponível.

## Arquitetura

O `EventBus` publica eventos do domínio em filas isoladas por usuário. Ele não conhece
WebSocket nem componentes visuais. O `ConnectionManager` mantém as conexões ativas e
o endpoint `/ws/hope` faz apenas a ponte entre uma assinatura do barramento e o cliente.

Cada instância do backend possui seu próprio barramento em memória. Essa solução é
adequada à implantação atual de um processo; uma implantação com múltiplas réplicas
deverá trocar o barramento por Redis, NATS ou outro broker compartilhado sem alterar
os produtores e consumidores do domínio.

## Protocolo

O cliente conecta em:

```text
/ws/hope?user_id=<uuid>
```

Mensagens de domínio usam este envelope:

```json
{
  "type": "MEMORY_UPDATED",
  "event_id": "uuid",
  "user_id": "uuid",
  "occurred_at": "2026-09-02T00:00:00Z",
  "payload": {}
}
```

Eventos suportados:

- `MEMORY_CREATED`: contém o nó e seu fragmento de grafo; o nó nasce no Core Orb e segue para o anel calculado.
- `MEMORY_UPDATED`: substitui os dados do nó e aplica um pulso visual, sem recriar a cena.
- `MEMORY_DELETED`: anima a saída e remove relações e vínculos associados.
- `MEMORY_RELATION_CREATED`: insere ou atualiza uma aresta.
- `MEMORY_RELATION_DELETED`: remove a aresta pelo identificador.
- `AI_STATE_CHANGED`: altera o estado visual do Core Orb entre `thinking`, `idle` e `error`.

Mensagens de controle `CONNECTED`, `PING` e `PONG` não alteram o grafo. O servidor
envia heartbeat a cada 20 segundos e encerra clientes sem atividade por 60 segundos.
O navegador também envia heartbeat e considera a conexão inativa após 70 segundos.

## Recuperação de falhas

O cliente tenta reconectar com espera exponencial limitada a 15 segundos. Durante a
queda, o indicador assume o estado degradado, o botão de sincronização HTTP permanece
ativo e uma ressincronização automática ocorre a cada 30 segundos. Quando a conexão
volta, uma leitura HTTP reconcilia qualquer evento perdido durante a interrupção.

## Consistência incremental

O estado normalizado do grafo fica no controlador. Cada evento altera apenas os
arrays afetados e o renderizador recalcula o layout determinístico localmente. Uma
leitura completa de `/api/memories/graph` ocorre apenas na carga inicial, na ação
manual de atualizar, durante o fallback ou depois de uma reconexão.

## Segurança e limites

As assinaturas são filtradas pelo `user_id`. Esse UUID é uma identidade temporária
de desenvolvimento e não autentica o usuário; produção ainda exige autenticação e
autorização antes de aceitar o cabeçalho ou parâmetro de conexão. As filas têm limite
de 256 eventos e descartam o evento mais antigo sob pressão; a próxima
ressincronização HTTP restaura o estado canônico.

## Validação

Antes desta fase, o PostgreSQL gerenciado com pgvector foi migrado até
`20260902_0002` e validado para extensão, tabelas, constraints, índices, CRUD,
relações, busca semântica e downgrade/upgrade seguro. Os testes automatizados da fase
cobrem os seis eventos, isolamento entre usuários, publicação pelas rotas, ping/pong,
reconexão e redução incremental do grafo no frontend.

## Fora de escopo

A Fase 5 não foi iniciada. Streaming de tokens, autenticação definitiva e broker
distribuído permanecem para etapas futuras.
