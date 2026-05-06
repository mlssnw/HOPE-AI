// ═══════════════════════════════════════════════
// HOPE-AI — Configuração de API Keys
// ═══════════════════════════════════════════════
// 
// 1. Copie este arquivo: cp config.example.js config.js
// 2. Cole suas chaves em config.js
// 3. config.js está no .gitignore — NUNCA será enviado ao GitHub
//
// Inclua no seu HTML ANTES do script principal:
// <script src="config.js"></script>
// ═══════════════════════════════════════════════

const ENV = {
  // Anthropic — https://console.anthropic.com
  CLAUDE_API_KEY: 'SUA_CHAVE_CLAUDE_AQUI',

  // Obsidian Local REST API — gerada no plugin dentro do Obsidian
  OBSIDIAN_KEY: 'SUA_CHAVE_OBSIDIAN_AQUI',

  // ElevenLabs (opcional, para voz) — https://elevenlabs.io
  ELEVENLABS_API_KEY: 'SUA_CHAVE_ELEVENLABS_AQUI',

  // Tavily (opcional, para web search) — https://tavily.com
  TAVILY_API_KEY: 'SUA_CHAVE_TAVILY_AQUI',
};
