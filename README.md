<div align="center">

# HOPE

**Assistente pessoal experimental de Inteligência Artificial com memória persistente, contexto explicável e visualização das relações que importam.**

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-F2AE3D)
![Phase](https://img.shields.io/badge/phase-7-63BFD4)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)
![PostgreSQL + pgvector](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql&logoColor=white)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

<p align="center">
  <img src="docs/design/assets/hope-dashboard-approved-2026-09-10.png"
       alt="Target UI aprovado para a interface da HOPE"
       width="100%">
</p>

<p align="center">
  <em>Referência visual aprovada do dashboard. Os novos controles de presença conversacional estão em revisão independente nesta branch.</em>
</p>

<p align="center">
  <strong>Persistent Memory</strong> · <strong>Hybrid Retrieval</strong> · <strong>Real-Time Memory Globe</strong> · <strong>Memory-Aware Chat</strong>
</p>

## 🧠 O que é a HOPE?

A HOPE é uma assistente pessoal experimental de IA com memória persistente e recuperação contextual, destinada a uma única pessoa. O projeto explora como uma IA pode armazenar, relacionar, recuperar, corrigir e esquecer informações ao longo do tempo com controles explícitos do usuário.

## Por que este projeto existe?

Assistentes tradicionais dependem principalmente do contexto imediato da conversa. A HOPE nasceu para explorar uma abordagem em que memória, contexto, relações e histórico possam persistir e ser consultados de forma controlada ao longo do tempo.

## ✨ Última atualização — Fase 7

- Texto exibido e fala possuem representações separadas; a resposta completa continua disponível quando o áudio falha ou é interrompido.
- Modos de estilo, privacidade, saída, interrupção e audiência são combináveis e valem para novos turnos da sessão.
- A personalidade aparece na resposta; mudar de modo não dispara frases prontas.
- Cancelamento e identificação de turno protegem contra eventos antigos de chat, ditado e reprodução.
- O Core Orb acompanha somente a amplitude do áudio local em reprodução; informações públicas da HOPE podem ser consultadas na interface.
- As correções de privacidade, voz e acessibilidade foram entregues e aguardam novos reviews independentes de QA, Security e UI/UX.

[📖 Ver detalhes técnicos da Fase 7](docs/phase-7.md)

## ⚙️ Implementado atualmente

Os recursos desta branch foram entregues para revisão. A aprovação da fase e sua integração ainda dependem dos gates abaixo.

| Área | Implementação atual |
|---|---|
| Memória | CRUD, classificação, consolidação, proveniência, entidades, relações e recuperação híbrida em PostgreSQL/pgvector. Ativação no chat é opt-in. |
| IA | `HopeOrchestrator` com personalidade original, contexto delimitado e Claude como provider operacional atual. Abstração multi-LLM ainda é parcial. |
| Visualização | Dashboard com Memory Globe/Core Orb, modos orbital, clusters e memória, responsividade e fallback textual/WebGL. Amplitude de voz local e novos controles estão em revisão. |
| Tempo real | Event Bus e WebSocket com eventos incrementais, heartbeat, reconnect e reconciliação HTTP. O barramento ainda é local ao processo. |
| Busca | Recuperação híbrida de memória; Tavily e busca textual no Obsidian ficam disponíveis quando configurados. |
| Voz | Ditado pela Web Speech API e TTS por ElevenLabs quando disponíveis, com texto/fala separados, controle de turno e cancelamento. Conteúdo acima do limite seguro de fala permanece completo na tela. |
| Presença conversacional | Modos locais e combináveis; estilos Normal, Foco, Acolhedor e Apresentação; biblioteca opcional de frases aprovadas; informações públicas e verificáveis da HOPE. |
| Integrações | Adapters opcionais para Anthropic, Tavily, ElevenLabs e Obsidian Local REST API. As credenciais permanecem no backend, mas os endpoints ainda exigem autenticação do owner antes de qualquer exposição pública. |
| Qualidade | Development registrou 60 testes Python, 67 frontend, sete cenários Chrome da Fase 7 e a regressão completa da Fase 6 aprovados. A entrega corrigida aguarda re-reviews independentes. |
| Segurança | Segredos no backend, CSP restrita, conteúdo externo tratado como não confiável, consentimento de memória e confirmação destrutiva. Autenticação e hardening de produção permanecem pendentes. |

## 🚦 Status do projeto

| Campo | Estado |
|---|---|
| Fase atual | Fase 7 — Conversational Presence Foundation |
| Estado técnico | `READY_FOR_REVIEW` — correções entregues; novos reviews independentes pendentes |
| Functional Commit | `af2aa66d13a1f0c3a8ccd31f52943da602fc4aa5` |
| Integração | [PR #2 em rascunho](https://github.com/mlssnw/HOPE-AI/pull/2), ainda sem merge em `main` |
| Deploy público | Ainda não habilitado — autenticação, autorização e hardening de produção pendentes |

A fundação local/controlada já conecta chat, memória persistente, PostgreSQL/pgvector, Memory Globe e eventos em tempo real. Isso não equivale a prontidão para produção pública.

O acompanhamento técnico detalhado permanece no [painel operacional](docs/handoff.md) e nos [reviews](docs/reviews/README.md).

## 🗺️ Fase atual e próximo gate

A fase ativa é a **Fase 7 — Conversational Presence Foundation**, em ambiente local/controlado.

- [x] Planejamento, especificação e pacote exato de frases aprovados.
- [x] Implementação e evidências entregues pelo Development.
- [ ] Correções e aprovação do QA, incluindo a regressão das fases anteriores.
- [ ] Correção do contexto enviado no modo Público e aprovação de Security.
- [ ] Correções de acessibilidade e aprovação pós-implementação de UI/UX.
- [ ] Consolidação do Planner e decisão de integração.

As próximas fases continuam como direção futura, com autorização própria antes da implementação. A ordem aprovada está em [`docs/roadmap.md`](docs/roadmap.md), junto da [`visão de produto`](docs/product-vision.md) e da [`arquitetura futura`](docs/future-architecture.md).

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

Durante o desenvolvimento, `X-Hope-User-Id` separa dados por UUID, mas **não é autenticação**. Configuração e contratos detalhados estão em [docs/architecture.md](docs/architecture.md) e [docs/phase-6.md](docs/phase-6.md).

## Qualidade e testes

A HOPE trata qualidade como parte da arquitetura do produto:

- **60 testes Python** na entrega do Development;
- **67 testes frontend** na entrega corrigida do Development;
- cinco cenários Chrome com voz sintética, sete tamanhos de tela, modos, privacidade, cancelamento, acessibilidade e uso sem WebGL;
- cenários de memória, consentimento, correção e esquecimento;
- WebSocket, heartbeat, reconexão e eventos incrementais;
- degradação segura quando banco, schema ou providers não estão disponíveis;
- reviews especializados de QA, Database, Security e UI/UX.

As suítes usam serviços simulados e não chamam APIs pagas:

```bash
python -m pytest -q
node --test tests/frontend/*.test.mjs
```

Os resultados acima ainda aguardam review independente da Fase 7. O áudio e o reconhecimento dos testes são simulados; qualidade do provider e microfone real não foram avaliados. Resultados, blockers e evidências detalhadas ficam em [`docs/reviews/`](docs/reviews/README.md) e [`docs/phase-7.md`](docs/phase-7.md).

## Segurança e privacidade

| Recurso | Dados processados quando ativado |
|---|---|
| Claude | Mensagem atual, histórico recente e contextos selecionados |
| Tavily | Consulta web; resultados selecionados podem seguir para o modelo |
| Obsidian | Consulta local e trechos selecionados |
| ElevenLabs | Texto da resposta para síntese de voz |
| Histórico local | Até 40 mensagens no `localStorage`, somente com opt-in separado |
| Memória persistente | O opt-in do chat controla recuperação, captura e comandos de memória durante a conversa; memórias já armazenadas ainda podem ser carregadas pelo Memory Globe na interface local/controlada |

Desativar **Memória no chat** impede novas recuperações, capturas e comandos persistentes durante a conversa; não apaga automaticamente memórias já armazenadas nem desativa a leitura dessas memórias pelo Memory Globe atual. A exclusão exige uma ação explícita e confirmação do alvo. **Histórico local** possui controle e limpeza separados.

Os modos **Privado** e **Público** bloqueiam memória no chat para novos turnos. Privado também impede novas gravações no histórico local, inclusive após sair do modo. Essas escolhas não apagam dados anteriores nem ocultam o que já está exibido. Os modos permanecem somente na sessão e não concedem permissões para ações.

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
- O asset conceitual do dashboard ainda exibe capacidades futuras omitidas corretamente pela implementação da Fase 6.
- O runtime ainda reporta um rótulo técnico legado; o README usa a fase operacional vigente para evitar confundi-lo com a versão pública do projeto.
- Web Speech API, providers externos e Obsidian dependem de suporte e configuração locais.
- Streaming de voz, wake word, verificação de voz e sessões entre dispositivos continuam planejados.

## Documentação

Estado atual da Fase 7:

- [Arquitetura atual](docs/architecture.md)
- [Fase 7](docs/phase-7.md)
- [Especificação de presença conversacional](docs/design/phase-7-conversational-presence-spec.md)
- [Dashboard oficial e regras de uso](docs/design/official-dashboard.md)
- [Handoff operacional](docs/handoff.md)
- [Reviews técnicos](docs/reviews/README.md)

Direção futura, além do escopo autorizado da Fase 7:

- [Visão de produto](docs/product-vision.md)
- [Roadmap oficial](docs/roadmap.md)
- [Arquitetura futura](docs/future-architecture.md)

Histórico e governança:

- [Changelog](CHANGELOG.md)
- [Instruções para Works](AGENTS.md)

## Histórico

O histórico completo das entregas foi movido para [CHANGELOG.md](CHANGELOG.md), mantendo o README focado no produto e no estado atual.

## Licença

Distribuído sob a [licença MIT](LICENSE).
