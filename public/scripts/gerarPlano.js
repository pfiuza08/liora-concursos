// /api/gerarPlano.js
// ==========================================================
// 🧠 LIORA — GERAR PLANO + SESSÕES (TEMA)
// - Decide quantidade de sessões (auto) baseado em: tema + nível
// - Retorna sessões completas (conteúdo + quiz + flashcards + mindmap)
// - Formato esperado pelo CORE v78: { plano: "JSON_STRING" }
// ==========================================================

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST" });
    }

    // Vercel às vezes entrega req.body como string
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const tema = String(body.tema || "").trim();
    const nivel = String(body.nivel || "iniciante").trim();

    if (!tema) {
      return res.status(400).json({ error: "Tema obrigatório." });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error:
          "OPENAI_API_KEY não configurada no ambiente (Vercel > Settings > Environment Variables).",
      });
    }

    // Modelo recomendado (barato e ótimo)
    // Modelos válidos (docs OpenAI): gpt-5-mini / gpt-5.2 / gpt-5.2-chat-latest
    const MODEL = process.env.LIORA_PLAN_MODEL || "gpt-5-mini";

    // -----------------------------
    // Heurística de faixa de sessões por nível
    // (A IA escolhe dentro da faixa, considerando complexidade do tema)
    // -----------------------------
    const ranges = {
      iniciante: { min: 5, max: 8 },
      intermediario: { min: 7, max: 10 },
      avancado: { min: 9, max: 12 },
    };

    const r = ranges[nivel.toLowerCase()] || ranges.iniciante;

    // -----------------------------
    // Prompt
    // -----------------------------
    const system = `
Você é a Liora, uma IA educacional que cria planos de estudo e sessões completas.
Regras:
- Retorne APENAS JSON válido (sem markdown, sem texto extra).
- Retorne um ARRAY JSON com N sessões.
- O número de sessões N deve estar ENTRE ${r.min} e ${r.max}.
- O conteúdo deve ser coerente com o nível: ${nivel}.
- Linguagem em PT-BR, didática, objetiva, com exemplos práticos.
- NÃO invente bibliografias. Não cite livros por nome.
- Cada sessão deve ter: titulo, objetivo, conteudo(introducao, conceitos[], exemplos[], aplicacoes[], resumoRapido[]),
  analogias[], ativacao[], quiz{pergunta, alternativas[4], corretaIndex, explicacao}, flashcards[{q,a}], mindmap.
- mindmap: string curta no formato "Raiz | Ramo > Subramo | Ramo2 > Subramo2".
`;

    const user = `
TEMA: ${tema}
NÍVEL: ${nivel}

Tarefa:
1) Escolha N sessões (entre ${r.min} e ${r.max}) baseado na complexidade do tema.
2) Gere sessões completas e progressivas: do básico ao avançado (respeitando o nível).
3) Evite títulos genéricos. Use títulos específicos e úteis.
4) Para o quiz: alternativas plausíveis, 1 correta. Explique o porquê.

Formato obrigatório de cada item do array:
{
  "titulo": "...",
  "objetivo": "...",
  "conteudo": {
    "introducao": "...",
    "conceitos": ["...", "..."],
    "exemplos": ["...", "..."],
    "aplicacoes": ["...", "..."],
    "resumoRapido": ["...", "..."]
  },
  "analogias": ["...", "..."],
  "ativacao": ["...", "...", "..."],
  "quiz": {
    "pergunta": "...",
    "alternativas": ["A", "B", "C", "D"],
    "corretaIndex": 0,
    "explicacao": "..."
  },
  "flashcards": [
    {"q":"...","a":"..."},
    {"q":"...","a":"..."},
    {"q":"...","a":"..."}
  ],
  "mindmap": "Raiz | Ramo > Subramo | Ramo2 > Subramo2"
}
`;

    // -----------------------------
    // Chamada OpenAI (Chat Completions)
    // -----------------------------
    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.35,
        messages: [
          { role: "system", content: system.trim() },
          { role: "user", content: user.trim() },
        ],
      }),
    });

    const data = await openaiResp.json().catch(() => ({}));

    if (!openaiResp.ok) {
      console.error("OpenAI error:", data);
      return res.status(openaiResp.status).json({
        error: data?.error?.message || "Erro ao chamar OpenAI",
      });
    }

    const raw = data?.choices?.[0]?.message?.content || "";

    // -----------------------------
    // Extrair JSON com tolerância
    // -----------------------------
    const extractJson = (txt) => {
      let s = String(txt || "").trim();

      // remove ```json ... ```
      const block =
        s.match(/```json([\s\S]*?)```/i) || s.match(/```([\s\S]*?)```/i);
      if (block) s = block[1];

      // pega do primeiro '[' até o último ']'
      const first = s.indexOf("[");
      const last = s.lastIndexOf("]");
      if (first !== -1 && last !== -1 && last > first) {
        s = s.slice(first, last + 1);
      }

      // limpeza
      s = s.replace(/[\u0000-\u001F]/g, " ");
      return s;
    };

    const jsonText = extractJson(raw);

    let arr = null;
    try {
      arr = JSON.parse(jsonText);
    } catch (e) {
      console.error("Falha parse JSON:", e, jsonText);
      arr = null;
    }

    // Fallback mínimo (se a IA vier torta)
    if (!Array.isArray(arr) || arr.length === 0) {
      const fallbackN = Math.max(r.min, Math.min(r.max, 6));
      arr = Array.from({ length: fallbackN }).map((_, i) => ({
        titulo: `Sessão ${i + 1} — ${tema}`,
        objetivo: `Construir base do tema: ${tema}`,
        conteudo: {
          introducao: `Introdução guiada para ${tema}.`,
          conceitos: [`Conceito ${i + 1} de ${tema}`],
          exemplos: [],
          aplicacoes: [],
          resumoRapido: [`Ponto-chave ${i + 1}`],
        },
        analogias: [],
        ativacao: [],
        quiz: {
          pergunta: "",
          alternativas: ["", "", "", ""],
          corretaIndex: 0,
          explicacao: "",
        },
        flashcards: [],
        mindmap: `${tema} | Base > Conceitos`,
      }));
    }

    // O CORE v78 faz JSON.parse(data.plano)
    return res.status(200).json({
      plano: JSON.stringify(arr),
    });
  } catch (err) {
    console.error("❌ /api/gerarPlano.js erro:", err);
    return res.status(500).json({ error: "Erro interno ao gerar plano." });
  }
};
