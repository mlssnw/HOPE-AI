# Components

## Top Bar

Marca, hora opcional e resumo de serviços. Em telas estreitas, serviços viram um único controle “Sistema” com estado agregado e detalhes expansíveis.

## Status Indicator

Composição: ícone/forma + label + estado textual. Estados: online, degradado, offline, desconhecido. Nunca depender apenas do ponto colorido.

## Globe Toolbar

Busca é primária. Sincronizar, centralizar, expandir, visão e qualidade são secundários. Controles desabilitados explicam o motivo via texto acessível.

## View Switcher

Segmented control com `Orbital`, `Clusters` e `Memória`. `Memória` fica desabilitado até existir seleção, com explicação. Em mobile, pode virar select/menu, mantendo estado atual explícito.

## Memory Inspector

Cabeçalho fixo, conteúdo rolável, metadados em grupos, relações como lista e ações persistentes. Estados: loading parcial, pronto, atualizado, item removido e erro.

## Conversation

Histórico usa largura de leitura controlada. Mensagens da HOPE e do usuário se distinguem por alinhamento, borda, label e superfície — não só cor. Fontes e memórias usadas ficam ligadas à resposta correspondente.

## Composer

Textarea, fontes/preferências, voz, microfone, ajuda, cancelar e enviar. Enviar é a única ação primária. Durante envio, cancelar permanece visível; controles que mudariam a requisição ficam desabilitados com estado preservado.

## Voice Controls

Microfone e leitura usam ícones inequívocos, tooltip e label. `LISTENING` mostra parar, permissão e erro. `SPEAKING` mostra pausar/parar quando suportado.

## Empty, Loading and Error States

Cada estado contém: título curto, explicação, impacto e ação possível. Não usar skeleton no globo para fingir nós. Loading deve preservar o Core Orb e a estrutura.

## Confirmation Dialog

Uso exclusivo para consequências significativas. Título descreve a ação, corpo nomeia o alvo e botões têm verbos específicos. Foco inicial em Cancelar; Escape cancela.
