<div align="center">

# H·O·P·E — AI

### Holistic Operational Personal Engine

**Assistente pessoal experimental de Inteligência Artificial com memória persistente, contexto explicável e visualização das relações que importam.**

![Status](https://img.shields.io/badge/status-ready%20for%20re--review-F2AE3D)
![Version](https://img.shields.io/badge/version-6.0.0--phase.5-FFF8E9)
![Phase](https://img.shields.io/badge/phase-5-63BFD4)
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
  <em>Target UI aprovado: Memory Globe, memória persistente, contexto ativo e interação com a HOPE. A implementação visual atual ainda é parcial.</em>
</p>

## ✨ Última atualização — Fase 5

- Memória persistente passou a exigir consentimento explícito antes de recuperar, capturar ou alterar lembranças.
- Esquecimento agora exige confirmação associada ao UUID exato da memória; ausência ou divergência é rejeitada.
- O chat continua disponível em modo degradado quando a memória ou o banco não estão disponíveis.
- O runtime agora desativa a memória de forma segura quando o schema não corresponde à migration exigida.
- O harness E2E cobre recuperação de memória e o fluxo destrutivo completo com estado isolado e contratos tipados.
- As suítes atuais passam com **45 testes Python** e **19 testes de frontend**.
- A direção visual do dashboard foi aprovada como Target UI; a fidelidade da implementação permanece pendente.

> **Status:** correções entregues no Functional Commit `88e1947`; re-reviews independentes de QA, Database e Security pendentes. Deploy público bloqueado.

[📖 Ver detalhes técnicos da Fase 5](docs/phase-5.md)

## 🧠 O que é a HOPE?

HOPE significa **Holistic Operational Personal Engine**. É um projeto experimental de assistente pessoal de IA que combina conversa, memória persistente e contexto acumulado ao longo do tempo. Em vez de depender apenas do histórico imediato do chat, a aplicação pode recuperar, relacionar, explicar, corrigir e esquecer memórias com controles explícitos.

A base atual é extensível e está evoluindo, por fases, para ferramentas, agentes, skills, multimodalidade e automação. Essas capacidades futuras estão documentadas como visão de arquitetura e **não são apresentadas como implementadas**.

`Claude / LLM` · `Persistent Memory` · `Vector Search` · `FastAPI` · `PostgreSQL` · `pgvector` · `WebSocket` · `WebGL`

## ⚙️ Principais recursos

| Área | Implementação atual |
|---|---|
| Memória | CRUD, classificação, consolidação, proveniência, entidades, relações e recuperação híbrida em PostgreSQL/pgvector. Ativação no chat é opt-in. |
| IA | `HopeOrchestrator` com personalidade original, contexto delimitado e Claude como provider operacional atual. Abstração multi-LLM ainda é parcial. |
| Visualização | Memory Globe WebGL alimentado por dados reais, com modos orbital, clusters e memória. O novo dashboard aprovado ainda é Target UI. |
| Tempo real | Event Bus e WebSocket com eventos incrementais, heartbeat, reconnect e reconciliação HTTP. O barramento ainda é local ao processo. |
| Busca | Recuperação híbrida de memória; Tavily e busca textual no Obsidian ficam disponíveis quando configurados. |
| Voz | Ditado pela Web Speech API e TTS por ElevenLabs quando suportados e configurados. |
| Integrações | Adapters para Anthropic, Tavily, ElevenLabs e Obsidian Local REST API; todos opcionais e protegidos pelo backend. |
| Qualidade | 45 testes Python e 19 testes frontend no Functional Commit atual; re-review independente ainda pendente. |
| Segurança | Segredos no backend, CSP restrita, conteúdo externo tratado como não confiável, consentimento de memória e confirmação destrutiva. Autenticação e hardening de produção permanecem pendentes. |

## 🚦 Status do projeto

| Campo | Estado |
|---|---|
| Versão atual | `6.0.0-phase.5` |
| Fase atual | Fase 5 — memory-aware chat e personalidade HOPE |
| Functional Commit | `88e194778b4399a6713f118470f9d861c553cd9e` |
| Estado funcional | `READY_FOR_REVIEW` — QA, Database e Security precisam revisar o novo hash |
| Produção pública | `BLOCKED` — autenticação, autorização e outros controles operacionais ainda são obrigatórios |

A fundação local/controlada já conecta chat, memória persistente, PostgreSQL/pgvector, Memory Globe e eventos em tempo real. Isso não equivale a prontidão para produção pública.

O projeto usa handoffs formais entre `DEV` · `QA` · `Database` · `Security` · `UI/UX` · `Planner`, com coordenação operacional separada. Consulte o [painel atual](docs/handoff.md) e o [manual de reviews](docs/reviews/README.md).

## 🗺️ Roadmap rápido

- [x] Backend FastAPI protegendo credenciais e integrações.
- [x] Fundação PostgreSQL + pgvector com migrations versionadas.
- [x] CRUD, classificação, consolidação, proveniência, entidades e relações de memória.
- [x] Memory Globe WebGL usando nós e relações reais.
- [x] Event Bus, WebSocket e atualização incremental do globo.
- [x] Chat consciente de memória com consentimento explícito.
- [x] Correção e esquecimento com confirmação vinculada ao alvo.
- [ ] Aprovação final independente da Fase 5.
- [ ] Implementação fiel e acessível do dashboard visual aprovado.
- [ ] Autenticação e autorização reais para HTTP e WebSocket.
- [ ] Provider semântico de produção e avaliação de qualidade vetorial.
- [ ] Streaming de respostas e broker distribuído.
- [ ] Tools, agents e skills governados por permissões.
- [ ] Multimodalidade, geração de imagens e automações.
- [ ] Desktop/PWA e implantação cloud pública.

O roadmap detalhado e ainda não autorizado está em [docs/future-architecture.md](docs/future-architecture.md).

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

## Testes

Os testes usam serviços simulados e não chamam APIs pagas:

```bash
python -m pytest -q
npm run test:frontend
```

Eles cobrem APIs, CSP, renderização defensiva, memória, consolidação, consentimento, esquecimento, schema incompatível, WebSocket, eventos incrementais e Memory Globe.

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

- A identidade por UUID é transitória e não substitui autenticação.
- O embedding local é adequado a desenvolvimento, não à qualidade semântica de produção.
- O Event Bus é local ao processo; múltiplas réplicas exigem broker compartilhado.
- O histórico ativo do chat ainda fica no navegador.
- A resposta não usa streaming de tokens.
- A implementação visual atual ainda não corresponde integralmente ao dashboard aprovado.
- Web Speech API, providers externos e Obsidian dependem de suporte e configuração locais.

## Documentação

- [Arquitetura atual](docs/architecture.md)
- [Fase 5](docs/phase-5.md)
- [Dashboard oficial e regras de uso](docs/design/official-dashboard.md)
- [Handoff operacional](docs/handoff.md)
- [Reviews técnicos](docs/reviews/README.md)
- [Arquitetura futura](docs/future-architecture.md)
- [Changelog](CHANGELOG.md)
- [Instruções para Works](AGENTS.md)

## Histórico

O histórico completo das entregas foi movido para [CHANGELOG.md](CHANGELOG.md), mantendo o README focado no produto e no estado atual.

## Licença

Distribuído sob a [licença MIT](LICENSE).
