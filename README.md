# HOPE-AI
Assistente Virtual com UI 3D, integração com Obsidian e Claude 4.6
# H·O·P·E — AI
### Holistic Operational Personal Engine

> Uma assistente de IA pessoal com interface neural 3D, integração com Obsidian e Claude Sonnet — seu Jarvis particular.

<br>

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-blueviolet?style=flat-square)
![Versão](https://img.shields.io/badge/versão-4.0-cyan?style=flat-square)
![Licença](https://img.shields.io/badge/licença-MIT-green?style=flat-square)
![HTML](https://img.shields.io/badge/HTML-standalone-orange?style=flat-square)

---

## O que é a Hope?

A **Hope** é uma assistente de IA pessoal construída como um único arquivo HTML — sem frameworks, sem npm, sem servidor obrigatório. Ela combina:

- 🧠 **Claude Sonnet** como motor de raciocínio
- 📓 **Obsidian** como cérebro/memória (via REST API local)
- 🎙️ **ElevenLabs** para voz sintética realista
- 🌐 **Interface neural 3D** interativa com Three.js
- 📝 **Markdown rico** com syntax highlight, tabelas e geração de imagens SVG

---

## Funcionalidades Atuais

| Módulo | Status | Descrição |
|--------|--------|-----------|
| Motor neural 3D | ✅ | Rede de nós orbitando, arraste e zoom interativo |
| Claude API (RAG) | ✅ | Lê `Hope_personalidade.md` do Obsidian como system prompt |
| Markdown rico | ✅ | Código com highlight, tabelas, listas, negrito |
| Voz (ElevenLabs) | ✅ | TTS multilingual, ativável/desativável |
| Speech-to-text | ✅ | Web Speech API nativa (pt-BR) |
| Geração de imagem | ✅ | SVG gerado pelo Claude inline |
| Memória em nós | 🔄 | Conversas viram pontos roxos na rede neural |
| Histórico visual | ✅ | Bolhas de mensagem com timestamp |

---

## Estrutura do Projeto

```
HOPE-AI/
├── H_O_P_E_4.html        ← versão atual estável (standalone)
├── H_O_P_E_5.html        ← versão em desenvolvimento (3D + memória)
├── .gitignore
└── README.md
```

> ⚠️ **Atenção:** As versões do arquivo nunca sobem com API keys. Veja a seção de configuração abaixo.

---

## Como Rodar

### Requisitos
- Navegador moderno (Chrome recomendado)
- [Plugin Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) instalado e ativo
- API Key da [Anthropic (Claude)](https://console.anthropic.com)
- API Key da [ElevenLabs](https://elevenlabs.io) *(opcional — só para voz)*

### Passo a passo

**1. Clone o repositório**
```bash
git clone https://github.com/mlssnw/HOPE-AI.git
cd HOPE-AI
```

**2. Configure as API Keys no arquivo HTML**

Abra `H_O_P_E_4.html` e localize as variáveis:

```javascript
// Linha ~280
const claudeKey = 'SUA_CHAVE_CLAUDE_AQUI';

// Linha ~295
const apiKey = 'SUA_CHAVE_ELEVENLABS_AQUI'; // opcional
```

**3. Configure o Obsidian**

No plugin *Local REST API* do Obsidian:
- Anote sua API Key gerada
- Certifique-se que está rodando na porta `27123`
- Cole a key no arquivo HTML:
```javascript
const obsidianKey = 'SUA_CHAVE_OBSIDIAN_AQUI';
```

**4. Crie a nota de personalidade**

No seu Vault do Obsidian, crie: `Hope/Hope_personalidade.md`

Exemplo de conteúdo:
```
Você é a Hope, minha assistente pessoal.
Seja direta, inteligente e use markdown quando fizer sentido.
Chame-me pelo meu nome quando souber.
```

**5. Sirva localmente**

```bash
# Python 3
python -m http.server 8000

# ou Node.js
npx serve .
```

Acesse: `http://localhost:8000/H_O_P_E_4.html`

---

## Roadmap

- [x] Interface neural 2D com nós e pulsos
- [x] Integração Claude API + Obsidian RAG
- [x] Markdown renderer com syntax highlight
- [x] Geração de imagens SVG via Claude
- [x] Motor 3D com Three.js + orbit controls
- [ ] Nós de memória (conversas → pontos na rede neural)
- [ ] Web search nativo (Claude tool use)
- [ ] Backend Python/FastAPI para geração de arquivos (xlsx, pdf, docx)
- [ ] PWA / app mobile
- [ ] Sincronização multi-device via Tailscale

---

## Segurança

> **Nunca suba suas API Keys no GitHub.**

O `.gitignore` já está configurado para ignorar arquivos com keys. Antes de fazer qualquer commit, verifique se as chaves foram removidas ou substituídas por placeholders como `SUA_CHAVE_AQUI`.

---

## Tecnologias

- [Claude API](https://docs.anthropic.com) — Anthropic
- [Three.js](https://threejs.org) — motor 3D
- [ElevenLabs](https://elevenlabs.io) — síntese de voz
- [Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)
- Web Speech API — reconhecimento de voz nativo

---

## Licença

MIT — use, modifique, compartilhe.

---

<p align="center">
  Feito com 🤍 — <em>Hope está em constante evolução</em>
</p>
