# HOPE States

Estados devem ser derivados de operações reais. Texto de status é a fonte acessível; cor, brilho e movimento são reforços.

| Estado | Core Orb | Rings | Nodes | UI / Voice |
|---|---|---|---|---|
| IDLE | Respiração 3,2–4,5 s; baixa amplitude | Rotação quase imperceptível | Estáveis | “HOPE disponível”; sem anúncio repetitivo |
| LISTENING | Volume responde à amplitude; seed firme | Arcos orientados ao centro | Atenuados 10–20% | “Ouvindo”; botão de parar; transcrição parcial quando disponível |
| THINKING | Compressão/expansão 1,1–1,6 s; filamentos convergem | Reorganização curta | Mantêm contexto | “Analisando”; cancelar permanece disponível |
| SEARCHING | Pulso direcional saindo do núcleo | Segmentos ativam por categoria consultada | Caminhos reais acendem | “Recuperando contexto” ou fonte específica |
| SPEAKING | Amplitude suavizada pelo áudio | Movimento reduzido | Estáveis | “HOPE falando”; pausar/parar leitura visível |
| EXECUTING | Fluxo contínuo direcionado, sem explosões | Um arco marca progresso | Alvos envolvidos destacados | Nome da ação, progresso real e opção de cancelar quando suportada |
| ALERT | Seed firme, halo mais nítido, cadência 0,8–1,2 s | Pausa ou pulso único | Preservam legibilidade | Mensagem, ícone e ação; sem depender de vermelho |
| ERROR | Contração curta e retorno a estado estável | Interrompem aceleração | Não somem | Erro claro, impacto, recuperação e retry seguro |

## Transition Rules

- Estado novo substitui o anterior em até 180 ms no texto e até 480 ms no visual.
- `ERROR` é temporário somente se a falha realmente se recuperar; caso contrário permanece como estado de serviço visível.
- Cancelamento leva a `IDLE` ou ao último estado confirmado assim que o abort é reconhecido.
- Eventos concorrentes precisam de precedência: `ERROR/ALERT` > `EXECUTING` > `SPEAKING` > `SEARCHING` > `THINKING` > `LISTENING` > `IDLE`.
- Reduced motion troca ciclos por intensidade, traço e texto estático.
