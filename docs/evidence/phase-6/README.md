# Phase 6 — Development Evidence Package

**Implementação em andamento, aguardando reviews independentes.** Todas as capturas usam dados sintéticos do harness local. Não são evidência de produção, memória pessoal real ou aprovação final do dashboard.

## Reproduzir

Pré-requisitos: ambiente Python do projeto com dependências de teste, Node.js, Playwright já instalado e Chrome/Chromium local. O pacote não instala navegadores nem chama serviços pagos.

1. Deixe a porta local `8766` livre. O runner recusa uma porta ocupada.
2. Se necessário, configure `HOPE_PYTHON`, `HOPE_PLAYWRIGHT_MODULE` (specifier ou URL `file:` da instalação existente) e `HOPE_CHROME_PATH` no ambiente.
3. Execute `npm run test:browser` a partir da raiz.

O runner cria uma instância nova de `tests.e2e_app`, executa cinco scripts e encerra o processo de teste. A exclusão ocorre somente sobre os UUIDs sintéticos conhecidos, após verificar o conteúdo da fixture. Não reutilize os scripts individuais contra a aplicação real.

## Evidências por requisito

| Contrato | Evidência executável / artefatos |
|---|---|
| Matriz de sete viewports e defaults iniciais | `tests/browser/phase-6.mjs`; imagens `320x568-*`, `390x844-*`, `768x1024-*`, `1024x768-chat.png`, `1280x720-chat.png`, `1440x900-chat.png`, `1920x1080-chat.png` |
| Chat, memória on/off, histórico local independente, fontes por resposta, conteúdo HTML inerte, cancelamento | `phase-6.mjs`, `phase-6-flows.mjs`; `flows-results.json`, `chat-error.png` |
| Busca, lista equivalente, inspector, foco e Escape | `phase-6-flows.mjs`; `inspector-focused.png`, `inspector-mobile.png`, `search-empty.png` |
| Confirmação destrutiva | `phase-6-flows.mjs`: HTTP 428 sem confirmação/com alvo divergente; cancelar, erro, submitting e sucesso com UUID exato; `confirmation.png`, `delete-*.png` |
| Fallback sem WebGL e recuperação de contexto perdido | `phase-6-flows.mjs`, `phase-6-runtime.mjs`; `no-webgl.png`, `webgl-restored.png` |
| Loading, empty, ready, unavailable, error, degraded | `phase-6-flows.mjs`, `phase-6-runtime.mjs`; `memory-*.png`, `realtime-degraded.png` |
| Realtime incremental | `phase-6-runtime.mjs`: seis eventos, atualização de relações no inspector, nenhuma recarga HTTP por evento, PING/PONG, fallback periódico de 30 s e reconexão |
| Voz | Callbacks de reconhecimento controlados; áudio PCM local reproduzido pelo elemento Audio; síntese antiga abortada sem cancelar a nova; `voice-*.png` |
| Perfis e movimento reduzido | Testes do renderer + `phase-6-runtime.mjs`; `profile-*.png`, `reduced-motion.png`, `runtime-results.json` |
| Contraste, foco, texto aumentado, landscape e reflow | `phase-6-accessibility.mjs`; `accessibility-*.png`, `accessibility-results.json` com razões de contraste e árvore acessível |
| Composição de transparência WebGL | `globe-compositing.mjs`: linha de 50% mantém alpha 128, não 64; contexto premultiplicado compatível com o compositor |

## Método e limites

- Chrome `153.0.8010.47`, Windows, AMD Ryzen 7 Pro 7735U (16 processadores lógicos), AMD Radeon integrada via ANGLE/Direct3D11. Hardware gráfico confirmado pelo contexto WebGL.
- Performance: cena de teste com 3.000 nós e 2.999 relações; aquecimento de 300 ms por perfil; amostragem de intervalos `requestAnimationFrame` por aproximadamente 1,8 s, com o renderer da aplicação ativo. Registrar FPS médio e p95 em `runtime-results.json`. Não é benchmark de persistência, rede, hardware móvel ou carga contínua.
- Rodada final de 2026-09-15: LOW 59,9 FPS (400 nós desenhados); MEDIUM 59,9 (1.000); HIGH 55,5 (2.500); ULTRA 48,4 (3.000). HIGH supera o alvo de 45 FPS neste ambiente; p95 HIGH de 33,5 ms registra que nem todos os quadros permaneceram em 60 FPS.
- Zoom 200%: equivalência de reflow em viewport CSS 720×450 com DPR 2 para área física 1440×900. A ampliação pelo menu nativo do Chrome não foi automatizada. Texto 130% é aplicado ao tamanho raiz; landscape é 844×390. Alturas muito curtas usam rolagem vertical para alcançar o composer, sem rolagem horizontal.
- Teclado, semântica e árvore acessível foram verificados no Chrome; não foi feita sessão manual com leitor de tela, teclado virtual físico ou dispositivos móveis reais.
- Reconhecimento de voz usa callbacks de fixture para não ativar microfone/serviço remoto. TTS usa PCM silencioso local; não valida qualidade de voz de provider.
- Os casos negativos produzem intencionalmente HTTP 428/500/503. Console, JavaScript e assets devem permanecer sem erros inesperados; o teste não trata esses erros HTTP planejados como indisponibilidade de CSS/JS.
- O teste gráfico com milhares de itens é uma fixture explicitamente sintética. A aplicação continua usando somente o payload existente e não cria nós/relações para preencher o visual.
- Revisão independente de QA, Security e UI/UX é necessária no Functional Commit registrado no handoff. Este pacote é evidência de Development, não substitui tais reviews.
