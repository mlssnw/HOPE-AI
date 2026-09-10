# Layout

## Information Architecture

Hierarquia da tela principal:

1. Memory Globe e Core Orb.
2. Conversa e entrada.
3. Inspector contextual.
4. Estado operacional e fontes.
5. Controles de câmera, qualidade e integrações.

## Desktop ≥ 1280 px

- Shell com largura máxima de 1520–1600 px e margens fluidas.
- Grid de 60–64% para globo e 36–40% para conversa.
- Altura útil ocupa a viewport; composer permanece visível sem exigir scroll global em 768 px de altura.
- Inspector flutua dentro do globo com largura de 320–380 px e pode recolher.
- Chat pode minimizar para rail de 56–72 px ou expandir até 48% quando a conversa for o foco.

## Notebook 981–1279 px

- Grid de 56–60% / 40–44%.
- Toolbar do globo permite duas linhas ordenadas.
- Legenda pode virar popover acessível.
- Painéis usam menos blur e padding, sem reduzir texto abaixo do mínimo.

## Fullscreen Globe

O globo ocupa a viewport, com busca e modos em uma faixa superior translúcida; inspector fica à direita; chat vira painel recolhido. Escape sai do fullscreen e devolve foco ao botão de expandir.

## Chat

- **Minimizado:** rail com estado, última atividade e botão “Abrir conversa”.
- **Expandido:** coluna padrão com histórico e composer fixo ao fundo da coluna.
- **Overlay:** usado em fullscreen e tablet, com scrim leve e fechamento explícito.
- Fontes consultadas pertencem à resposta correspondente, não a um bloco global ambíguo.
- Memórias usadas devem ser acessíveis a partir da resposta como contexto explicável.

## Inspector

Desktop: painel lateral dentro da região do globo. Tablet: drawer lateral. Mobile: bottom sheet de até 88% da altura, com título fixo e conteúdo rolável.
