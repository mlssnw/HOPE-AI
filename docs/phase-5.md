# Fase 5 — Memory-aware chat e personalidade HOPE

## Resultado

A rota `/api/chat` agora usa o cérebro persistente da HOPE sem substituir o fluxo já existente de Claude, Tavily, Obsidian e histórico local. A conversa continua disponível quando o banco falha, mas a resposta sinaliza internamente `memory_available=false` e não afirma ter recuperado lembranças.

## Arquitetura

```text
POST /api/chat
  → HopeOrchestrator
      → AI_STATE_CHANGED: thinking
      → intenção de memória
      → AI_STATE_CHANGED: searching
      → MemoryContextBuilder
          → MemoryRetriever híbrido
          → entidades e relações relevantes
          → contexto recente limitado
      → system prompt = personality + regras de memória/segurança
      → HopeServices
          → Tavily/Obsidian opcionais
          → Claude
      → MemoryClassifier
      → MemoryService / MemoryManager
          → CREATE / CONSOLIDATE / IGNORE
      → EventBus → WebSocket → Memory Globe
      → AI_STATE_CHANGED: idle
```

`backend/ai/orchestrator.py` coordena a interação. `personality.py` define identidade, configuração e estados expressivos. `prompts.py` monta o system prompt por seções. `context.py` recupera e serializa apenas os dados necessários. `models.py` contém os contratos internos de contexto, resultado e eventos de UI.

`backend/services.py` permanece responsável pelos adaptadores externos e pela chamada HTTP ao Claude. Ele não decide mais recuperação, persistência ou estados da conversa.

## Contexto de memória

O `MemoryContext` possui:

- memórias relevantes, preferências e decisões;
- entidades e relações ligadas às memórias selecionadas;
- contexto recente limitado;
- confiança agregada;
- disponibilidade/degradação da memória.

Cada memória contém somente ID, tipo, natureza (`fact`, `event` ou `inference`), título, resumo curto, importância, confiança, fonte e timestamps. Embeddings e campos internos do banco nunca seguem para o modelo. A recuperação é limitada e resultados fracos são descartados para impedir que memórias irrelevantes dominem a resposta.

Perguntas de perfil, como “O que você sabe sobre mim?”, consultam diretamente o banco do usuário. Perguntas comuns usam recuperação híbrida. `memories_used`, `entities_used`, `relations_used` e `tools_used` permitem explicar internamente a origem da resposta.

## Segurança contra prompt injection

O system prompt declara que `memory_context`, `external_context`, notas e páginas web são dados não confiáveis. O conteúdo é serializado como JSON dentro de blocos explicitamente marcados com `trust="untrusted-data"`. Instruções encontradas nesses dados não têm autoridade e não podem substituir identidade, segurança ou regras do sistema.

O contexto tem campos permitidos, limites de tamanho e serialização JSON válida. Segredos não entram em resultados, logs ou metadados do chat.

## Personalidade

A HOPE é uma personagem original: inteligente, técnica, elegante, perspicaz, assertiva e capaz de discordar com justificativa. Humor seco e sarcasmo sutil são opcionais; situações sérias ou destrutivas removem o humor. Precisão e segurança sempre têm prioridade sobre estilo.

Configurações preparadas para evolução futura:

- `humor_level=moderate`;
- `sarcasm_level=subtle`;
- `verbosity=adaptive`;
- `proactivity=normal`;
- `formality=low-medium`.

Estados expressivos `neutral`, `focused`, `curious`, `amused`, `concerned` e `alert` são operacionais, não alegações de emoção humana. O realtime também usa `thinking`, `searching`, `speaking`, `error` e `idle` para a interface.

## Persistência e correção

Após a resposta, mensagens declarativas relevantes passam pelo classificador e pelo limiar de importância. O `MemoryConsolidator` procura duplicatas por similaridade antes da criação. O fluxo resulta em criação, reforço/consolidação ou descarte.

Novos tipos de memória incluem `project`, `person`, `system`, `temporal` e `context`, além dos tipos anteriores. Inferências permanecem com confiança máxima de 0,75.

Pedidos claros de esquecimento removem a memória e suas relações. Correções com novo conteúdo atualizam embedding, classificação, entidades e relações. Quando a referência não identifica uma única memória com segurança, a HOPE pede esclarecimento e não altera o banco.

As operações de criação, fonte, entidades e relações usam a mesma sessão transacional do `MemoryManager`. Eventos de criação, atualização, remoção e relações reutilizam o publicador comum usado pela API de memória.

## Frontend e UI events

A resposta do chat aceita `ui_events` opcionais. `FOCUS_MEMORIES` é validado por allowlist, elimina IDs duplicados e foca os nós existentes no Memory Globe sem reconstruir ou recarregar o grafo. Eventos desconhecidos são ignorados.

O Core Orb representa `thinking`, `searching`, `speaking`, `error` e `idle`. Se WebSocket cair, o fallback HTTP da Fase 4 continua ativo.

## Testes

A suíte cobre:

- memória relevante no contexto e limite contra ruído;
- separação entre dados recuperados e instruções;
- persistência de decisão e fato relevante;
- inferência com confiança reduzida;
- consolidação de duplicatas;
- esquecimento claro e proteção contra ambiguidade;
- banco indisponível sem derrubar o chat;
- ordem `thinking → searching → idle`;
- workspace Anthropic e ausência de segredos;
- `FOCUS_MEMORIES` e tolerância a eventos inválidos;
- regressões de renderização, WebSocket e atualização incremental.

## Limitações e questões conhecidas

- `LocalHashEmbeddingProvider` existe para desenvolvimento e testes. Ele não representa semântica de qualidade de produção. Um provider real poderá ser configurado em fase futura sem alterar o contrato `EmbeddingProvider`.
- A classificação de candidatos ainda é determinística; mensagens complexas podem exigir confirmação ou ser ignoradas.
- O pós-processamento de memória é executado logo após a resposta do modelo dentro da mesma solicitação. Isso mantém rastreabilidade e consistência, mas ainda não oferece uma fila durável.
- O EventBus continua local ao processo.
- Autenticação real, STT ElevenLabs, HOPE Bridge, automações, Tool Registry completo e deploy público estão fora desta fase.

## Próxima fase

A Fase 6 não foi iniciada. Antes dela, a evolução natural é escolher explicitamente o provider de embedding de produção, medir qualidade de recuperação e definir rastreabilidade durável para tarefas pós-resposta.
