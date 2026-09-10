# Design System

## Foundations

O sistema usa uma base escura neutra, luz âmbar/dourada e branco quente. Azul ou ciano só podem representar uma função distinta — por exemplo, conectividade externa — e nunca competir com a identidade principal.

## Color Tokens

| Token | Valor de referência | Uso |
|---|---|---|
| `color.bg.canvas` | `#030609` | Fundo global. |
| `color.bg.deep` | `#05080D` | Profundidade e regiões de WebGL. |
| `color.surface.primary` | `rgba(9, 12, 15, 0.88)` | Painéis principais. |
| `color.surface.raised` | `rgba(17, 17, 15, 0.94)` | Inspector, menus e confirmações. |
| `color.primary.500` | `#F2AE3D` | Ação, foco e energia padrão. |
| `color.primary.300` | `#FFD98A` | Destaques e texto sobre fundo escuro. |
| `color.primary.700` | `#A96A18` | Profundidade e estados discretos. |
| `color.secondary.500` | `#63BFD4` | Conectividade ou informação externa, uso raro. |
| `color.text.primary` | `#FFF8E9` | Títulos e conteúdo principal. |
| `color.text.secondary` | `#B8AE9C` | Metadados e instruções. |
| `color.text.tertiary` | `#847C6E` | Informação não essencial, somente quando contraste permitir. |
| `color.success` | `#8ED6A4` | Operação concluída. |
| `color.warning` | `#F2B84B` | Atenção sem falha. |
| `color.error` | `#FF8796` | Falha e ação destrutiva. |
| `color.border.subtle` | `rgba(242, 174, 61, 0.16)` | Divisão estrutural. |
| `color.border.active` | `rgba(255, 217, 138, 0.52)` | Foco/seleção. |
| `color.glow.primary` | `rgba(242, 174, 61, 0.34)` | Halo máximo padrão. |

Nenhum texto essencial deve usar opacidade inferior a 0,72. Bordas decorativas podem usar 0,12–0,20; bordas interativas 0,32–0,56; foco visível deve ser sólido o bastante para contraste em qualquer superfície.

## Typography

Stack recomendada sem dependência externa: `"Segoe UI Variable", "Segoe UI", system-ui, sans-serif`. Monoespaçada: `"Cascadia Mono", "SFMono-Regular", Consolas, monospace`.

| Estilo | Tamanho/linha | Peso | Tracking | Uso |
|---|---|---:|---:|---|
| Display | `32–44 / 1.08` | 450 | `-0.03em` | Título contextual raro. |
| Heading 1 | `26–34 / 1.15` | 480 | `-0.025em` | Título do globo. |
| Heading 2 | `20–24 / 1.2` | 520 | `-0.015em` | Conversa e inspector. |
| Body | `15–17 / 1.6` | 400 | `0` | Mensagens e conteúdo. |
| Body compact | `13–14 / 1.45` | 400 | `0` | Metadados. |
| Label | `11–12 / 1.3` | 600 | `0.12em` | Eyebrows e status; uppercase. |
| Data | `12–14 / 1.3` | 520 | `0.04em` | Contagens, horários e confiança. |
| Code | `13–15 / 1.55` | 400 | `0` | Código e identificadores. |

O tamanho renderizado mínimo é 11 px para metadado não essencial e 12 px para controles. Uppercase deve ficar restrito a rótulos curtos; nunca usar em parágrafos ou mensagens de erro.

## Spacing and Shape

- Unidade base: 4 px.
- Escala: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Raio: 8 px em controles, 12 px em elementos elevados, 18–20 px em regiões principais, círculo apenas para ícone ou estado.
- Alvo interativo mínimo: 44 × 44 px em toque; 36 × 36 px em desktop quando acompanhado de foco claro.
- Largura de leitura do chat: 68–76 caracteres por linha.

## Elevation and Light

Profundidade vem de contraste local, borda e um único halo. Não acumular blur, glow e sombra intensa no mesmo elemento. O Core Orb pode exceder o glow padrão; painéis não.

## Iconography

Usar ícones lineares próprios ou biblioteca futura consistente, com 1,5 px de traço, cantos controlados e rótulo acessível. Evitar caracteres ambíguos como `◖))` e `●` como solução final para voz/microfone.

## Quality Profiles

| Perfil | Partículas | Glow/blur | Antialias/LOD | Movimento |
|---|---:|---|---|---|
| LOW | 20–30% | halo simples, sem blur de painel | DPR limitado a 1; nós prioritários | sem rotação automática; transições essenciais |
| MEDIUM | 45–55% | um halo por objeto focal | DPR até 1,5; LOD moderado | rotação lenta e eventos essenciais |
| HIGH | 75–85% | glow multicamada contido | DPR até 2; anéis refinados | sistema completo padrão |
| ULTRA | 100% com teto medido | pós-processamento leve e seletivo | DPR até 2; maior densidade/LOD | detalhes extras sem mudar significado |

LOW preserva busca, seleção, relações essenciais, inspector e todos os estados. Qualidade muda fidelidade, nunca função ou informação.
