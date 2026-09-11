# Backlog de warnings

Este arquivo recebe warnings que foram aceitos conscientemente para avanço de fase. O relatório original continua sendo a fonte da evidência e não deve ser reescrito ou apagado.

Somente PLANNER consolida entradas aqui após confirmar que não existe BLOCKER associado e que o warning foi aceito pelo responsável apropriado. Registrar um item não significa que ele foi resolvido.

| ID | Source | Phase | Severity | Description | Recommended phase | Status |
|---|---|---:|---|---|---|---|
| QA-003 | QA | 5 | LOW | Após cancelamento, o chat atualiza imediatamente, mas o Memory Globe pode permanecer em processamento por alguns segundos. | Future dashboard/realtime UX phase | NOT_STARTED |
| QA-WARN-HTTPX | QA | 5 | INFO | Integração atual de Starlette TestClient/httpx está depreciada. | Dependency maintenance | NOT_STARTED |
| SEC-009 | Security | 5 | MEDIUM | Defesa contra prompt injection ainda depende principalmente de instruções e delimitadores. | Tool safety / Permission phase | NOT_STARTED |
| SEC-010 | Security | 5 | MEDIUM | Proveniência e metadados de memória ainda aceitam atributos declarados pelo cliente. | Identity + provenance phase | NOT_STARTED |
| SEC-011 | Security | 5 | MEDIUM | Proteção do embedding depende de o ambiente de produção ser declarado corretamente. | Production readiness gate | NOT_STARTED |
| SEC-013 | Security | 5 | MEDIUM | Contrato de host, HTTPS, HSTS e proxy confiável ainda não possui validação de deploy. | Cloud production phase | NOT_STARTED |
| SEC-014 | Security | 5 | MEDIUM | Dependências não possuem lock com hashes e scanner obrigatório. | CI/supply-chain hardening | NOT_STARTED |
| SEC-015 | Security | 5 | LOW | Health público expõe flags de dependências e mistura liveness com readiness. | Observability hardening | NOT_STARTED |
| SEC-016 | Security | 5 | LOW | Histórico opcional permanece em texto claro no armazenamento local do navegador. | Identity/privacy UX phase | NOT_STARTED |
| SEC-017 | Security | 5 | MEDIUM | Gate de schema depende do lifespan e managers não padrão podem contornar essa evidência. | Startup hardening before production | NOT_STARTED |
| DB-WARNING-3 | Database | 5 | MEDIUM | Gate aceita a marca Alembic sem verificar deriva estrutural completa. | Database production gate | NOT_STARTED |
| DB-WARNING-4 | Database | 5 | MEDIUM | Bypass de criação de schema para testes não comprova tecnicamente ambiente descartável. | Test infrastructure hardening | NOT_STARTED |
| DB-WARNING-5 | Database | 5 | LOW | Falha transitória no startup exige reinício para reativar memória. | Observability/recovery hardening | NOT_STARTED |
| UIUX-F5-W01 | UI/UX | 5 | MEDIUM | Badge “Memória” pode confundir disponibilidade do serviço com consentimento ativo na conversa. | Future dashboard/consent UX phase | NOT_STARTED |
| UIUX-F5-W02 | UI/UX | 5 | LOW | Atualizações normais usam uma região `aria-live` assertiva e podem interromper conteúdo em leitores de tela. | Future accessibility UX phase | NOT_STARTED |
| UIUX-F5-W03 | UI/UX | 5 | MEDIUM | Toggles, botão Enviar e texto auxiliar ficam abaixo dos alvos dimensionais do contrato visual. | Future dashboard/accessibility phase | NOT_STARTED |

Status recomendados para este backlog: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `WAITING_FOR_APPROVAL`, `SUPERSEDED` ou `APPROVED` quando a resolução tiver sido verificada pelo papel competente.
