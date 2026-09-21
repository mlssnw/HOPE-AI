<div align="center">

# HOPE AI

**Assistente pessoal experimental de Inteligência Artificial com memória persistente, contexto explicável e visualização das relações que importam.**

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-F2AE3D)
![Runtime](https://img.shields.io/badge/runtime-6.0.0--phase.5-FFF8E9)
![Phase](https://img.shields.io/badge/phase-6-63BFD4)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)
![PostgreSQL + pgvector](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql&logoColor=white)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

<p align="center">
  <img src="docs/design/assets/hope-dashboard-approved-2026-09-10.png"
       alt="Target UI aprovado para a interface da HOPE AI"
       width="100%">
</p>

<p align="center">
  <em>Target UI aprovado: a implementação da Phase 6 está presente no Functional Commit; a integração final aguarda confirmação de QA e Security.</em>
</p>

<p align="center">
  <strong>Persistent Memory</strong> · <strong>Hybrid Retrieval</strong> · <strong>Real-Time Memory Globe</strong> · <strong>Memory-Aware Chat</strong>
</p>

## 🧠 O que é a HOPE?

A HOPE é um assistente pessoal experimental de IA com memória persistente e recuperação contextual. O projeto explora como uma IA pode armazenar, relacionar, recuperar, corrigir e esquecer informações ao longo do tempo com controles explícitos do usuário.

## Por que este projeto existe?

Assistentes tradicionais dependem principalmente do contexto imediato da conversa. A HOPE nasceu para explorar uma abordagem em que memória, contexto, relações e histórico possam persistir e ser consultados de forma controlada ao longo do tempo.

## ✨ Última atualização — Phase 6

- O dashboard convergiu para a direção visual aprovada sem ativar capacidades futuras inexistentes.
- Memory Globe/Core Orb, chat, inspector, responsividade chat-first, fallback sem WebGL e acessibilidade foram integrados ao novo shell.
- Consentimento de memória, histórico local, cancelamento e confirmação destrutiva permanecem separados e operáveis.
- QA, Security e UI/UX produziram evidência sobre o Functional Commit; QA e Security ainda precisam confirmar o Integration Candidate documental antes do merge.
- A visão futura, o roadmap e os limites de personalidade/SelfKnowledge foram aprovados; a Phase 7 permanece somente em planejamento e sem implementação autorizada.

[📖 Ver detalhes técnicos da Phase 6](docs/phase-6.md)

## ⚙️ Implementado atualmente

| Área | Implementação atual |
|---|---|
| Memória | CRUD, classificação, consolidação, proveniência, entidades, relações e recuperação híbrida em PostgreSQL/pgvector. Ativação no chat é opt-in. |
| IA | `HopeOrchestrator` com personalidade original, contexto delimitado e Claude como provider operacional atual. Abstração multi-LLM ainda é parcial. |
| Visualização | Dashboard da Phase 6 aprovado dentro das capacidades reais, com Memory Globe/Core Orb, modos orbital, clusters e memória, responsividade e fallback textual/WebGL. |
| Tempo real | Event Bus e WebSocket com eventos incrementais, heartbeat, reconnect e reconciliação HTTP. O barramento ainda é local ao processo. |
| Busca | Recuperação híbrida de memória; Tavily e busca textual no Obsidian ficam disponíveis quando configurados. |
| Voz | Ditado pela Web Speech API e TTS por ElevenLabs quando suportados e configurados. |
| Integrações | Adapters para Anthropic, Tavily, ElevenLabs e Obsidian Local REST API; todos opcionais e protegidos pelo backend. |
| Qualidade | Evidência anterior de 45 testes Python e 36 testes frontend, além de validação browser da matriz de viewports, WebGL/fallback, realtime, acessibilidade e cenários degradados. |
| Segurança | Segredos no backend, CSP restrita, conteúdo externo tratado como não confiável, consentimento de memória e confirmação destrutiva. Autenticação e hardening de produção permanecem pendentes. |

## 🚦 Status do projeto

| Campo | Estado |
|---|---|
| Runtime API | `6.0.0-phase.5` — metadata legado e congelado do Functional Commit, independente do status operacional da fase |
| Fase atual | Phase 6 — Target UI Convergence |
| Estado técnico | `WAITING_FOR_REVIEW` para integração; QA e Security devem confirmar o mesmo Integration Candidate |
| Functional Commit | `0912e9492370f6bce8c51762d1a8a87b5bd16aa8` |
| Deploy público | Ainda não habilitado — autenticação, autorização e hardening de produção pendentes |

A fundação local/controlada já conecta chat, memória persistente, PostgreSQL/pgvector, Memory Globe e eventos em tempo real. Isso não equivale a prontidão para produção pública.

O acompanhamento técnico detalhado permanece no [painel operacional](docs/handoff.md) e nos [reviews](docs/reviews/README.md).

## 🗺️ Em desenvolvimento / Roadmap

O roadmap futuro foi aprovado como direção de produto, mas nenhuma implementação posterior à Phase 6 está autorizada. A ordem completa, os gates e os Required Reviews estão em [`docs/roadmap.md`](docs/roadmap.md).

- [x] Backend FastAPI protegendo credenciais e integrações.
- [x] Fundação PostgreSQL + pgvector com migrations versionadas.
- [x] CRUD, classificação, consolidação, proveniência, entidades e relações de memória.
- [x] Memory Globe WebGL usando nós e relações reais.
- [x] Event Bus, WebSocket e atualização incremental do globo.
- [x] Chat consciente de memória com consentimento explícito.
- [x] Correção e esquecimento com confirmação vinculada ao alvo.
- [x] Aprovação final independente da Fase 5.
- [ ] Phase 6 — implementação em `0912e94`; integração final pendente de QA e Security.
- [ ] Phase 7 — Conversational Presence Foundation; plano aguardando aprovação e implementação não autorizada.
- [ ] Phase 8 — Single-User Security & Permissions.
- [ ] Phase 9 — Realtime Voice Sessions.
- [ ] Phases 10–14 — cloud/shared clients, Windows/wake word, Android/device context, speaker verification opcional e Model Router/Diagnostics.
- [ ] Phases 15–22 — organização pessoal, tools/effects, coding, agents, learning, multimodalidade, automações e HOPE Bridge.

A visão aprovada está em [`docs/product-vision.md`](docs/product-vision.md); o desenho técnico futuro permanece em [`docs/future-architecture.md`](docs/future-architecture.md). Roadmap aprovado não equivale a autorização de implementação.

## Arquitetura resumida

```text
Browser
  ├─ Chat, histórico local opcional e voz
  ├─ Memory Globe WebGL
  ├─ HTTP /api/*
  └─ WebSocket /ws/hope
         │
         ▼
FastAPI
  ├─ HopeOrchestrator
  ├─ Anthropic / Tavily / ElevenLabs / Obsidian (opcionais)
  ├─ MemoryManager + MemoryService
  └─ EventBus em memória
         │
         ▼
PostgreSQL + pgvector
```

O backend serve a interface e as APIs na mesma origem. Memória, domínio e persistência permanecem separados, e nenhuma chave é enviada ao navegador. Veja o [estado implementado e as limitações](docs/architecture.md).

## Requisitos

- Python 3.11 ou mais recente.
- PostgreSQL com a extensão pgvector para memória persistente.
- Navegador moderno; Chrome ou Edge são recomendados para ditado.
- Chave da Anthropic para o chat com Claude.
- Opcionais: Tavily, ElevenLabs e Obsidian com o plugin [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) 4.1.3 ou posterior.

## Instalação

```bash
git clone https://github.com/mlssnw/HOPE-AI.git
cd HOPE-AI
python -m venv .venv
```

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

```bash
# macOS ou Linux
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Abra `.env` e configure apenas os serviços que pretende utilizar. Nunca coloque chaves em `frontend/` ou em arquivos versionados.

Para memória persistente:

```dotenv
DATABASE_URL=postgresql+asyncpg://usuario:senha@host:5432/hope
```

Crie a extensão e o schema exclusivamente pelas migrations versionadas:

```bash
python -m alembic upgrade head
```

O runtime exige a revisão `20260903_0003` para ativar memória. Ele verifica compatibilidade, mas não executa migrations automaticamente.

## Execução

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Acesse [http://127.0.0.1:8000](http://127.0.0.1:8000). A configuração atual é destinada a desenvolvimento local/controlado, não a exposição pública.

## API e integrações

As rotas principais incluem:

- `GET /api/health`;
- `POST /api/chat`;
- `POST /api/tts`;
- CRUD, busca, recuperação, entidades, relações, explicação e grafo em `/api/memories`;
- `GET /ws/hope?user_id=<uuid>` para eventos em tempo real.

Durante o desenvolvimento, `X-Hope-User-Id` separa dados por UUID, mas **não é autenticação**. Configuração e contratos detalhados estão em [docs/architecture.md](docs/architecture.md) e [docs/phase-5.md](docs/phase-5.md).

## Quality & Testing

A HOPE trata qualidade como parte da arquitetura do produto:

- **45 testes Python**;
- **36 testes frontend**;
- cenários de memória, consentimento, correção e esquecimento;
- WebSocket, heartbeat, reconexão e eventos incrementais;
- degradação segura quando banco, schema ou providers não estão disponíveis;
- reviews especializados de QA, Database, Security e UI/UX.

As suítes usam serviços simulados e não chamam APIs pagas:

```bash
python -m pytest -q
npm run test:frontend
```

Resultados, blockers e evidências detalhadas ficam em [`docs/reviews/`](docs/reviews/README.md).

## Segurança e privacidade

| Recurso | Dados processados quando ativado |
|---|---|
| Claude | Mensagem atual, histórico recente e contextos selecionados |
| Tavily | Consulta web; resultados selecionados podem seguir para o modelo |
| Obsidian | Consulta local e trechos selecionados |
| ElevenLabs | Texto da resposta para síntese de voz |
| Histórico local | Até 40 mensagens no `localStorage`, somente com opt-in separado |
| Memória persistente | Conteúdo, metadados e embedding no PostgreSQL configurado, somente quando autorizada no chat |

Desativar **Memória no chat** impede novas recuperações, capturas e comandos persistentes; não apaga automaticamente memórias já armazenadas. A exclusão exige uma ação explícita e confirmação do alvo. **Histórico local** possui controle e limpeza separados.

Antes de qualquer deploy público, o projeto ainda requer autenticação, autorização, proteção de providers, rate limiting, hardening do WebSocket, role restrita de banco, TLS verificado e auditoria atribuível. Consulte o [Security Review](docs/reviews/security-review-latest.md) e o [Database Audit](docs/reviews/database-audit-latest.md).

## Estrutura

```text
backend/api/      rotas HTTP de memória
backend/ai/       Orchestrator, personalidade, prompts e contexto seguro
backend/database/ modelos SQLAlchemy e sessões assíncronas
backend/memory/   domínio, embeddings, repositório e gerenciador
backend/realtime/ Event Bus, conexões e protocolo WebSocket
frontend/         interface, chat, voz e Memory Globe WebGL
migrations/       evolução versionada do PostgreSQL/pgvector
docs/             arquitetura, fases, design, reviews e governança
tests/            testes Python e Node
```

## Limitações conhecidas

- A identidade por UUID é transitória e não comprova o owner único da instalação.
- O embedding local é adequado a desenvolvimento, não à qualidade semântica de produção.
- O Event Bus é local ao processo; múltiplas réplicas exigem broker compartilhado.
- O histórico ativo do chat ainda fica no navegador.
- A resposta não usa streaming de tokens.
- O asset conceitual do dashboard ainda exibe capacidades futuras omitidas corretamente pela implementação da Phase 6.
- O runtime ainda reporta `6.0.0-phase.5`; esse rótulo legado foi preservado para não criar um novo Functional Commit apenas por metadata.
- Web Speech API, providers externos e Obsidian dependem de suporte e configuração locais.

## Documentação

- [Arquitetura atual](docs/architecture.md)
- [Fase 5](docs/phase-5.md)
- [Phase 6](docs/phase-6.md)
- [Plano da Phase 7](docs/phase-7.md)
- [Visão de produto](docs/product-vision.md)
- [Roadmap oficial](docs/roadmap.md)
- [Dashboard oficial e regras de uso](docs/design/official-dashboard.md)
- [Handoff operacional](docs/handoff.md)
- [Nova direção de produto — intake para o Planner](docs/coordination/product-direction-2026-09-19.md)
- [Reviews técnicos](docs/reviews/README.md)
- [Arquitetura futura](docs/future-architecture.md)
- [Changelog](CHANGELOG.md)
- [Instruções para Works](AGENTS.md)

## Histórico

O histórico completo das entregas foi movido para [CHANGELOG.md](CHANGELOG.md), mantendo o README focado no produto e no estado atual.

## Licença

Distribuído sob a [licença MIT](LICENSE).
