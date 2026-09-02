# H·O·P·E — AI

**Holistic Operational Personal Engine** — assistente pessoal com Memory Globe WebGL, backend FastAPI, Claude, busca web, voz e memória persistente cloud-ready.

> Status: em desenvolvimento · Versão 6.0 / Fase 3 · Licença MIT

## O que mudou na Fase 3

- Memory Globe WebGL alimentado exclusivamente pelo grafo de memória real.
- Core Orb energético, seis órbitas conceituais, nós, entidades e relações.
- Navegação Orbital, Clusters e Memória, com rotação, pan, zoom e foco.
- Hover, seleção, inspetor de detalhes, memórias relacionadas e atalho para perguntar sobre uma memória.
- Busca integrada à recuperação do backend e estados seguros para memória vazia ou desconectada.
- Perfis Low, Medium, High e Ultra e suporte a `prefers-reduced-motion`.

As decisões visuais, os controles e os limites estão em [docs/phase-3.md](docs/phase-3.md).

## O que mudou na Fase 2

- Classificador dedicado para preferências, metas, tarefas, decisões, episódios e conhecimento.
- Diferenciação entre fatos, eventos e inferências com níveis de confiança.
- Recuperação híbrida por similaridade, texto e importância.
- Consolidação com fontes, contagem de menções e histórico de reforço.
- Extração de entidades e criação automática de relações semânticas.
- Explicação completa da origem de cada memória.

Veja as decisões em [docs/phase-2.md](docs/phase-2.md).

## O que mudou na Fase 1 cloud-first

- PostgreSQL com pgvector, SQLAlchemy assíncrono e migrações Alembic.
- Schema inicial para usuários, memórias, relações, entidades, conversas, mensagens e eventos.
- `MemoryRepository` isolado por usuário e `MemoryManager` com classificação, importância e consolidação.
- CRUD de memórias, busca vetorial e endpoint de grafo.
- `EmbeddingProvider` independente de fornecedor, com implementação local para desenvolvimento.
- Compatibilidade preservada: chat, voz, Obsidian e frontend continuam funcionando sem banco configurado.

O diagnóstico e as decisões desta etapa estão em [docs/phase-1.md](docs/phase-1.md).

## O que mudou na versão 5

- As chaves não ficam mais no navegador: todas as integrações passam pelo backend FastAPI local.
- Entradas do usuário, respostas da IA, web e Obsidian são renderizadas com APIs seguras do DOM. HTML e SVG aparecem como texto, sem execução.
- O projeto usa CSP restrita e não depende de scripts, fontes ou estilos externos.
- Histórico persistente é opcional e pode ser apagado pela interface.
- Busca no Obsidian limita resultados e identifica as notas consultadas.
- Busca web, Obsidian, voz e memória são ativados separadamente.
- O microfone usa Web Speech API quando o navegador oferece suporte.

O antigo `H.O.P.E_4.html` foi substituído pela aplicação modular em `frontend/`. Ele continha integrações diretas com chaves no navegador e não deve mais ser usado.

## Arquitetura

```text
Navegador
  └─ frontend/ (HTML, CSS e JavaScript sem segredos)
       ├─ Memory Globe (WebGL + layout determinístico)
       └─ /api/* no mesmo endereço
            └─ backend/ (FastAPI)
                 ├─ Anthropic / Claude
                 ├─ Tavily
                 ├─ ElevenLabs
                 ├─ Obsidian Local REST API
                 └─ MemoryManager → PostgreSQL + pgvector
```

O backend serve a interface e as APIs no mesmo endereço. Isso evita CORS e impede que as chaves sejam entregues ao frontend.

## Requisitos

- Python 3.11 ou mais recente.
- PostgreSQL com a extensão pgvector para memória persistente.
- Navegador moderno; Chrome ou Edge são recomendados para ditado.
- Chave da Anthropic para conversar com Claude.
- Opcionais: Tavily, ElevenLabs e Obsidian com o plugin [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) atualizado.

> Use a versão 4.1.3 ou posterior do plugin Local REST API. Versões anteriores foram afetadas por uma vulnerabilidade de traversal de caminhos.

## Instalação

```bash
git clone https://github.com/mlssnw/HOPE-AI.git
cd HOPE-AI
python -m venv .venv
```

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS ou Linux
source .venv/bin/activate
```

```bash
python -m pip install -r requirements.txt
```

Crie a configuração local:

```powershell
# Windows
Copy-Item .env.example .env
```

```bash
# macOS ou Linux
cp .env.example .env
```

Abra `.env` e preencha apenas as integrações que pretende utilizar. Nunca coloque chaves em `frontend/`.

Para ativar memória persistente, configure uma conexão assíncrona:

```dotenv
DATABASE_URL=postgresql+asyncpg://usuario:senha@host:5432/hope
```

Crie a extensão e o schema pela migração versionada:

```bash
python -m alembic upgrade head
```

Valide uma instância PostgreSQL/pgvector real com dados temporários removidos ao
final:

```bash
python scripts/preflight_database.py --exercise-crud
```

URLs de provedores gerenciados com `sslmode=require` são convertidas para o
formato SSL aceito pelo driver assíncrono.

O usuário do banco precisa ter permissão para `CREATE EXTENSION` na primeira
execução, ou a extensão `vector` deve ser habilitada previamente pelo provedor.

## Executar

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Acesse [http://127.0.0.1:8000](http://127.0.0.1:8000). Para produção, use HTTPS,
um proxy confiável, autenticação e os controles descritos em `docs/phase-1.md`.

## API de memória

As rotas de memória disponíveis são:

- `POST /api/memories`
- `GET /api/memories`
- `GET /api/memories/search?q=...`
- `GET /api/memories/retrieve?q=...`
- `POST /api/memories/candidates`
- `GET /api/memories/entities`
- `GET /api/memories/entities/{id}/memories`
- `GET`, `PATCH` e `DELETE /api/memories/{id}`
- `GET /api/memories/{id}/explanation`
- `POST /api/memories/{id}/relations`
- `GET /api/memories/graph`

Durante a migração, envie um UUID em `X-Hope-User-Id`. Esse cabeçalho permite
testar isolamento de dados, mas não substitui autenticação real e não deve ser
usado como mecanismo de segurança em produção.

## Configurar o Obsidian

1. Instale e ative o plugin **Local REST API**.
2. Copie a chave para `OBSIDIAN_API_KEY` no `.env`.
3. Para HTTP local, mantenha `OBSIDIAN_BASE_URL=http://127.0.0.1:27123`.
4. Para HTTPS, use normalmente `https://127.0.0.1:27124` e confie o certificado local no sistema. Desativar `OBSIDIAN_VERIFY_TLS` reduz a proteção.
5. Reinicie a HOPE e confirme o indicador **Vault**.

Quando **Obsidian** estiver marcado, a HOPE faz busca textual pela mensagem, usa no máximo três trechos e mostra as notas consultadas. Notas são dados não confiáveis e não podem substituir as instruções da assistente.

## Privacidade

| Recurso | Dados enviados quando ativado |
|---|---|
| Claude | Mensagem atual, até 20 mensagens recentes e trechos de contexto selecionados |
| Web | Consulta para Tavily; resultados selecionados seguem para Claude |
| Obsidian | Consulta para a API local; trechos selecionados seguem para Claude |
| Voz | Texto da resposta para ElevenLabs |
| Histórico local | Até 40 mensagens no `localStorage` deste navegador |
| Memória persistente | Conteúdo, metadados e embedding no PostgreSQL configurado |

Desmarcar **Memória** remove o histórico persistido. **Limpar histórico** também apaga os dados locais.

## Segurança

- `.env` está ignorado pelo Git e as chaves não são retornadas pelas rotas.
- Consultas de memória são sempre filtradas pelo usuário informado.
- O schema muda somente por migrações versionadas; a aplicação não o recria ao iniciar.
- O backend valida tamanho, formato, timeout e status das respostas externas.
- Markdown é renderizado sem `innerHTML`; HTML bruto permanece texto.
- URLs `javascript:` e `data:` não viram links.
- CSP bloqueia scripts externos, objetos, frames e conexões para outras origens.
- Resultados externos são delimitados como contexto não confiável no prompt.

Antes de publicar a aplicação em uma rede, adicione autenticação. A configuração atual é intencionalmente local.

## Testes

Os testes usam respostas simuladas e não chamam APIs pagas.

```bash
python -m pytest -q
npm run test:frontend
```

Eles cobrem validação da API, CSP, respostas inválidas, rate limit, prompt injection,
protocolos perigosos, HTML/SVG inerte e integridade do layout do Memory Globe.

## Estrutura

```text
backend/api/      rotas HTTP de memória
backend/database/ modelos SQLAlchemy e sessões assíncronas
backend/memory/   domínio, embeddings, repositório e gerenciador
backend/          FastAPI, validação e integrações existentes
frontend/         interface, chat, voz e Memory Globe WebGL
migrations/       evolução versionada do PostgreSQL/pgvector
docs/             decisões de arquitetura por fase
tests/            testes Python e Node
.env.example      configuração sem segredos
```

## Limitações conhecidas

- Web Speech API não existe em todos os navegadores.
- A recuperação do Obsidian é textual, sem embeddings.
- A interface ainda usa o histórico local; a integração do chat com a nova memória vem depois.
- `X-Hope-User-Id` é uma identidade transitória, não autenticação.
- O embedding local é adequado a desenvolvimento, não à qualidade semântica de produção.
- A atualização do Memory Globe ainda ocorre por sincronização HTTP, sem eventos em tempo real.
- A resposta ainda não usa streaming de tokens.

## Solução de problemas

- **Claude indisponível:** confirme `ANTHROPIC_API_KEY` e reinicie o servidor.
- **Vault vermelho:** abra o Obsidian e confira plugin, porta, chave e TLS.
- **Web ou voz desativados:** configure a chave correspondente.
- **Microfone desativado:** use um navegador com Web Speech API e permita o acesso ao microfone.

## Roadmap

- [x] Backend local para proteger credenciais.
- [x] Renderização segura de Markdown.
- [x] Busca textual no Obsidian com fontes.
- [x] Memória local opcional e removível.
- [x] Ditado com detecção de suporte.
- [x] Fundação PostgreSQL/pgvector e migrações.
- [x] CRUD, busca vetorial, consolidação e relações de memória.
- [x] Classificação, recuperação híbrida, proveniência e entidades.
- [x] Memory Globe WebGL alimentado pelo grafo real.
- [ ] Autenticação e autorização reais.
- [ ] Integrar a memória persistente ao pipeline de chat.
- [ ] Streaming de respostas.
- [ ] Reranking semântico opcional para notas.
- [ ] Armazenamento local criptografado.
- [ ] Aplicativo desktop/PWA após revisão de segurança.

## Licença

[MIT](LICENSE)
