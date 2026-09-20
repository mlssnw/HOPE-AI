# Backlog de warnings

Este arquivo recebe warnings que foram aceitos conscientemente para avanço de fase. O relatório original continua sendo a fonte da evidência e não deve ser reescrito ou apagado.

Somente PLANNER consolida entradas aqui após confirmar que não existe BLOCKER associado e que o warning foi aceito pelo responsável apropriado. Registrar um item não significa que ele foi resolvido.

| ID | Source | Phase | Severity | Description | Recommended phase | Status |
|---|---|---:|---|---|---|---|
| QA-003 | QA | 5 | LOW | Após cancelamento, o chat atualiza imediatamente, mas o Memory Globe pode permanecer em processamento por alguns segundos. | Phase 6 — encerrado por QA no Functional Commit `0912e94` | APPROVED |
| QA-WARN-HTTPX | QA | 5 | INFO | Integração atual de Starlette TestClient/httpx está depreciada; warning reconfirmado no review da Phase 6. | Dependency maintenance | NOT_STARTED |
| QA-ENV-002 | QA | 6 | INFO | Validação não incluiu leitor de tela manual, menu nativo de zoom, teclado virtual/dispositivo físico, microfone real, provider pago ou PostgreSQL real. | Accessibility and environment validation before production | NOT_STARTED |
| SEC-009 | Security | 5 | MEDIUM | Defesa contra prompt injection ainda depende principalmente de instruções e delimitadores. | Tool safety / Permission phase | NOT_STARTED |
| SEC-010 | Security | 5 | MEDIUM | Proveniência e metadados de memória ainda aceitam atributos declarados pelo cliente. | Identity + provenance phase | NOT_STARTED |
| SEC-011 | Security | 5 | MEDIUM | Proteção do embedding depende de o ambiente de produção ser declarado corretamente. | Production readiness gate | NOT_STARTED |
| SEC-013 | Security | 5 | MEDIUM | Contrato de host, HTTPS, HSTS e proxy confiável ainda não possui validação de deploy. | Cloud production phase | NOT_STARTED |
| SEC-014 | Security | 5 | MEDIUM | Dependências não possuem lock com hashes e scanner obrigatório. | CI/supply-chain hardening | NOT_STARTED |
| SEC-015 | Security | 5 | LOW | Health público expõe flags de dependências e mistura liveness com readiness. | Observability hardening | NOT_STARTED |
| SEC-016 | Security | 5 | LOW | Histórico opcional permanece em texto claro no armazenamento local do navegador. | Identity/privacy UX phase | NOT_STARTED |
| SEC-017 | Security | 5 | MEDIUM | Gate de schema depende do lifespan e managers não padrão podem contornar essa evidência. | Startup hardening before production | NOT_STARTED |
| SEC-018 | Security | 6 | LOW | Harness browser herda ambiente amplo e usa porta fixa/sentinel operacional insuficiente para subprocessos destrutivos. | Test harness hardening before destructive browser flows | NOT_STARTED |
| DB-WARNING-3 | Database | 5 | MEDIUM | Gate aceita a marca Alembic sem verificar deriva estrutural completa. | Database production gate | NOT_STARTED |
| DB-WARNING-4 | Database | 5 | MEDIUM | Bypass de criação de schema para testes não comprova tecnicamente ambiente descartável. | Test infrastructure hardening | NOT_STARTED |
| DB-WARNING-5 | Database | 5 | LOW | Falha transitória no startup exige reinício para reativar memória. | Observability/recovery hardening | NOT_STARTED |
| UIUX-F5-W01 | UI/UX | 5 | MEDIUM | Badge “Memória” pode confundir disponibilidade do serviço com consentimento ativo na conversa. | Phase 6 — encerrado por UI/UX no Functional Commit `0912e94` | APPROVED |
| UIUX-F5-W02 | UI/UX | 5 | LOW | Atualizações normais usam uma região `aria-live` assertiva e podem interromper conteúdo em leitores de tela. | Phase 6 — encerrado por UI/UX no Functional Commit `0912e94` | APPROVED |
| UIUX-F5-W03 | UI/UX | 5 | MEDIUM | Toggles, botão Enviar e texto auxiliar ficam abaixo dos alvos dimensionais do contrato visual. | Phase 6 — encerrado por UI/UX no Functional Commit `0912e94` | APPROVED |

Status recomendados para este backlog: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `WAITING_FOR_APPROVAL`, `SUPERSEDED` ou `APPROVED` quando a resolução tiver sido verificada pelo papel competente.

## Phase 6 consolidation boundaries

- `QA-ENV-002`, `QA-WARN-HTTPX` e `SEC-018` permanecem abertos e não bloqueantes para a feature da Phase 6.
- `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `SEC-008` e `SEC-012` continuam blockers exclusivos de Production Readiness; não foram aceitos, encerrados ou reclassificados como warnings.
- Limites históricos de Database, inclusive PostgreSQL real, role restrita, TLS, migration e validação estrutural, continuam gates de produção e não ampliam retroativamente o escopo visual da Phase 6.
- A aprovação funcional em `0912e9492370f6bce8c51762d1a8a87b5bd16aa8` não autoriza deploy, exposição pública, banco real, provider, credencial, custo, infraestrutura ou próxima fase.
