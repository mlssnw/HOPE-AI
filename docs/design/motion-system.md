# Motion System

## Principles

Movimento explica mudança, preserva orientação e termina rápido. Movimento ambiente nunca compete com leitura ou ação.

## Timing

| Categoria | Duração | Easing |
|---|---:|---|
| Feedback imediato | 80–120 ms | `linear` ou `ease-out` |
| Hover/foco | 140–180 ms | `cubic-bezier(.2,.8,.2,1)` |
| Painel/inspector | 220–300 ms | `cubic-bezier(.2,.8,.2,1)` |
| Foco de câmera | 320–480 ms | `cubic-bezier(.22,.8,.24,1)` |
| Evento de memória | 460–900 ms | faseado, sem bloquear interação |
| Ambiente | 3–12 s | linear/senoidal, amplitude baixa |

## Event Choreography

### MEMORY_CREATED

Core Orb pulsa → uma partícula sai do núcleo → percorre uma trilha curta → anel de destino responde → nó se forma → relações reais aparecem. Duração total máxima: 900 ms. O nó já deve ser interativo antes do fim do polish.

### MEMORY_UPDATED

Pulso de 420–560 ms no nó existente, pequena mudança de posição/tamanho quando necessária e relações alteradas interpoladas. Não recriar a cena.

### MEMORY_DELETED

Após a operação ser confirmada: conexões retraem, nó perde luminância e fragmenta/dissolve em 360–520 ms. A seleção move para um destino previsível ou fecha o inspector com anúncio.

### SEARCH RESULT

Resultados recebem halo em sequência máxima de 40 ms entre itens, com teto de 240 ms. Não resultados atenuam até 55%, preservando o mapa.

## Interaction Motion

- Botões: deslocamento máximo de 1 px e mudança de luz; sem bounce.
- Inspector: entra 16–24 px pela borda associada e mantém foco.
- Chat: nova mensagem faz fade + translate de 6 px, sem reanimar o histórico.
- Fullscreen: transição 240–320 ms, com alternativa instantânea em reduced motion.

## Reduced Motion

Com `prefers-reduced-motion: reduce`: remover rotação automática, inércia, parallax, trilhas e ciclos contínuos; reduzir transições a até 120 ms; representar estados por texto, contraste, padrão e intensidade estática.
