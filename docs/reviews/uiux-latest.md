# UI/UX Review — Latest

Status: APPROVED_WITH_WARNINGS
Date: 2026-09-10
Phase: 5
Review type: PHASE 5 FUNCTIONAL UX REVIEW
Scope decision: `ARCH-2026-09-10-002`
Functional Commit reviewed: `88e194778b4399a6713f118470f9d861c553cd9e`
Repository HEAD observed: `0cc9b2919670b6310baf2b5ea5e0968aa0b5f30b`

## Scope Boundary

Esta revisão avalia exclusivamente a experiência funcional da Fase 5 no Functional Commit indicado. O frontend executado no browser corresponde ao alvo funcional: entre `88e194778b4399a6713f118470f9d861c553cd9e` e o HEAD observado não existe alteração em `frontend/` nem no comportamento funcional revisado.

Não fazem parte deste gate a fidelidade completa ao HOPE Main Dashboard, a implementação de `UIUX-001` a `UIUX-005`, a matriz P0/P1/P2/P3, novas navegações, métricas ou capacidades planejadas. Nenhuma alteração de código ou visual foi realizada.

## Result

- Feature UX result: APPROVED_WITH_WARNINGS
- Blocking findings: nenhum
- Non-blocking warnings: `UIUX-F5-W01`, `UIUX-F5-W02` e `UIUX-F5-W03`
- Dashboard fidelity: NOT_EVALUATED neste gate
- Production readiness: não avaliada por UI/UX e permanece separada do Feature Status

## Acceptance Evidence

### 1. Clareza e comportamento de “Memória no chat” — PASS

- O controle possui label explícito e ajuda associada por `aria-describedby`: “permite recuperar e salvar dados persistentes; trechos relevantes podem ser enviados ao provedor de IA”.
- O padrão seguro é desativado: `loadPreferences()` normaliza `memoryEnabled` para `false` quando não há preferência anterior; o browser confirmou o checkbox inicialmente desmarcado.
- A requisição envia o estado atual como `memory_enabled`; enquanto há solicitação ativa, o controle fica desabilitado para impedir mudança de contexto no meio da operação.
- Evidência: `frontend/index.html`, `frontend/js/chat.js`, `frontend/js/storage.js` e validação no harness local.

### 2. Memória persistente separada de histórico local — PASS

- “Memória no chat” e “Histórico local” são controles independentes, com labels distintos e preferências separadas.
- O histórico é limitado ao navegador e só é carregado/salvo quando `persist` está habilitado; desativá-lo remove `hope.history.v1` sem alterar o consentimento de memória.
- O teste frontend “consentimento antigo de histórico não ativa memória persistente” passou.
- Evidência: `frontend/index.html`, `frontend/js/storage.js`, `frontend/js/chat.js` e `tests/frontend/storage.test.mjs`.

### 3. Comunicação quando a memória está desativada — PASS WITH WARNING

- Com “Memória no chat” desmarcada, uma tentativa de consultar, corrigir ou esquecer dados persistentes retorna: “A memória no chat está desativada. Ative-a antes de consultar, corrigir ou esquecer dados persistentes.”
- O backend bloqueia recuperação, captura e comandos de memória quando `memory_enabled=false`; o browser confirmou a mensagem e a devolução do foco ao composer.
- O warning `UIUX-F5-W01` registra a ambiguidade residual entre disponibilidade do serviço e consentimento da conversa.
- Evidência: `backend/ai/orchestrator.py`, `frontend/js/chat.js`, `tests/test_ai_orchestrator.py` e validação no harness local.

### 4. Confirmação de esquecimento — PASS

- O diálogo informa `Alvo: Arquitetura da HOPE` e a consequência “A memória e suas relações serão removidas permanentemente.”.
- Os botões usam verbos inequívocos: “Cancelar” e “Esquecer memória”.
- A confirmação aceita somente UUID válido e o cliente envia o mesmo UUID na rota e no header `X-Hope-Confirm-Memory-Id`; ausência ou divergência retornam `428` no harness.
- Evidência: `frontend/index.html`, `frontend/js/memory-confirmation.js`, `frontend/js/api-client.js`, `tests/test_e2e_harness.py` e validação no browser desktop/mobile.

### 5. Foco, Escape e recuperação — PASS

- Ao abrir o diálogo, o foco inicial observado foi “Cancelar”.
- Escape fechou o modal sem executar a exclusão e devolveu o foco ao campo de mensagem, acionador do fluxo via chat.
- Abertura pelo inspector preserva o botão “Esquecer” como destino de retorno; em falha de exclusão, o diálogo permanece aberto, reabilita as ações, apresenta erro com `role="alert"` e move o foco para “Cancelar”.
- Evidência: `frontend/js/memory-globe.js` e validação no browser em 1280 × 720 e 390 × 844.

### 6. `FOCUS_MEMORIES` e Core Orb baseados em eventos/dados reais — PASS

- O frontend aceita somente `FOCUS_MEMORIES`, deduplica e limita IDs; antes de destacar ou mover a câmera, filtra os IDs contra `layout.nodeMap`.
- O grafo descarta nós inválidos e relações órfãs. O backend forma o evento de foco a partir dos IDs de memórias realmente recuperadas.
- O Core Orb recebe apenas `AI_STATE_CHANGED` do realtime; `thinking`, `searching`, `speaking` e `error` são normalizados, e qualquer valor não suportado volta a `idle`.
- Os testes de layout, eventos incrementais, estados do chat e normalização de `FOCUS_MEMORIES` passaram sem dados fabricados.
- Evidência: `backend/ai/orchestrator.py`, `frontend/js/ui-events.js`, `frontend/js/memory-globe-core.js`, `frontend/js/memory-globe.js` e testes frontend.

### 7. Teclado, foco, contraste, movimento reduzido e responsividade — PASS WITH WARNINGS

- Tab alcançou “Memória no chat”; o foco visível medido foi outline sólido âmbar de 2 px. Escape e retorno de foco funcionaram no modal.
- Contrastes computados sobre o fundo principal: texto auxiliar 7,91:1, foco âmbar 10,45:1, ação destrutiva 8,82:1 e toggle ativo 14,86:1.
- `prefers-reduced-motion: reduce` reduz animações/transições globalmente e o renderer interrompe rotação automática.
- Em 390 × 844, os controles alterados quebraram linha sem overflow horizontal; composer, toggles, Enviar e confirmação permaneceram legíveis e operáveis. O modal coube integralmente na viewport.
- `UIUX-F5-W02` e `UIUX-F5-W03` registram as limitações não bloqueantes de anúncio e dimensionamento.
- Evidência: `frontend/styles/main.css`, `frontend/js/memory-globe.js` e validação no browser desktop/mobile.

### 8. Ausência de alegações sobre capacidades futuras — PASS

- A interface operacional revisada não contém rail de navegação, “Visão”, “Arquivos”, “Automação” nem métricas inventadas do dashboard conceitual.
- Contagens exibidas no globo são derivadas de `layout.memories` e `layout.entities` reais.
- O browser confirmou ausência desses destinos/claims no DOM operacional.
- A marca/expansão histórica permanece registrada em `UIUX-001` para a futura fase visual e não foi usada como blocker retroativo desta Fase 5.
- Evidência: `frontend/index.html`, `frontend/js/memory-globe.js`, `docs/design/dashboard-gap-matrix.md` e inspeção do browser.

## Findings

### UIUX-F5-W01 — Status do serviço pode ser confundido com consentimento ativo

- Severity: MEDIUM
- Blocking: NO
- Evidence: `frontend/js/memory-globe.js` marca o badge superior “Memória” como online quando o grafo/realtime está disponível, independentemente do checkbox “Memória no chat”. No browser, o badge de serviço apareceu disponível com o consentimento inicialmente desmarcado.
- Impact: uma pessoa pode interpretar “Memória” online como uso ativo na conversa, embora o controle de consentimento e o backend mantenham o opt-out corretamente.
- Future recommendation: rotular o badge como disponibilidade do serviço ou tornar a distinção textual mais explícita na futura fase visual.

### UIUX-F5-W02 — Atualizações normais usam região assertiva

- Severity: LOW
- Blocking: NO
- Evidence: `frontend/index.html` define `#live-status` como `role="status" aria-live="assertive"`; `frontend/js/ui.js` usa a mesma região para progresso, conclusão, cancelamento e erros.
- Impact: leitores de tela podem interromper conteúdo para mensagens rotineiras, elevando ruído e reduzindo conforto, embora o fluxo continue compreensível e operável.
- Future recommendation: usar anúncio `polite` para estados normais e reservar anúncio urgente para falhas que exigem ação.

### UIUX-F5-W03 — Alvos de toque e texto auxiliar ficam abaixo do contrato visual

- Severity: MEDIUM
- Blocking: NO
- Evidence: no browser, “Memória no chat” e “Histórico local” mediram 32 px de altura, Enviar mediu 36 px e a ajuda de consentimento foi renderizada a 9,76 px; `docs/design/accessibility.md` define 44 × 44 px para toque e mínimo de 11 px para metadado não essencial.
- Impact: a precisão de toque e a leitura podem piorar para pessoas com baixa visão ou destreza reduzida, principalmente no mobile; não houve overflow nem perda funcional em 390 × 844.
- Future recommendation: elevar altura útil/alvo para 44 px no mobile e a ajuda para pelo menos 11 px na fase visual autorizada.

## Validation Performed

- `45 passed` na suíte Python completa; dois warnings ambientais sem falha funcional (`StarletteDeprecationWarning` e cache do pytest sem permissão de escrita).
- `19 passed` na suíte frontend Node, incluindo histórico/consentimento, segurança da confirmação, grafo real, eventos e `FOCUS_MEMORIES`.
- Browser no harness descartável: opt-out, recuperação com memória habilitada, confirmação de esquecimento, foco inicial, Escape, retorno de foco, contraste e viewport 390 × 844.
- A exclusão real não foi acionada manualmente no browser; o contrato destrutivo foi validado pela suíte E2E contra o UUID exato e o fluxo de cancelamento foi validado visualmente.
- Nenhum PostgreSQL real, provider pago, credencial ou dado real foi acessado.

## Deferred Visual Requirements

O Target UI `UIUX-VIS-2026-09-10-001` permanece aprovado. `UIUX-001` a `UIUX-005` continuam requisitos bloqueantes apenas para uma futura alegação de implementação/fidelidade do HOPE Main Dashboard:

- `UIUX-001`: identidade `HOPE` sem expansão ou pontos;
- `UIUX-002`: composição principal imersiva;
- `UIUX-003`: fidelidade do Core Orb e densidade do Globe;
- `UIUX-004`: arquitetura responsiva completa, chat-first no mobile;
- `UIUX-005`: equivalente textual navegável do canvas.

Esses itens não são blockers retroativos da Fase 5 e não foram reclassificados por este review.

## Recommendation

Devolver ao COORDINATOR para encaminhamento ao PLANNER e consolidação final da Fase 5. Esta aprovação com warnings não autoriza implementação do dashboard, início de outra fase nem produção pública.
