// ==========================================================
// 🧠 LIORA — GERADOR DE PLANO POR TEMA v77 (INFALÍVEL)
// - Usa response_format: json
// - Usa modelo estável (gpt-4o-mini)
// - Tolerância máxima a falhas
// - Retorna array direto (compatível com core v74+)
// ==========================================================

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const { tema, nivel, sessoes, banca } = req.body || {};

    if (!tema || !nivel) {
      return res.status(400).json({ error: "Parâmetros incompletos." });
    }

    const qtdSessoes = Math.max(6, Math.min(12, Number(sessoes) || 8));
    const nivelNorm = (nivel || "").toLowerCase();
    const bancaNorm = (banca || "GERAL").toUpperCase();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ----------------------------------------------------------
    // PROMPT SUPER REDUZIDO (melhor geração JSON)
    // ----------------------------------------------------------
    const prompt = `
Gere EXATAMENTE ${qtdSessoes} sessões de estudo para concursos.

DEVE RETORNAR JSON EXATAMENTE NESTE FORMATO:

{
  "sessoes": [
    {
      "titulo": "",
      "objetivo": "",
      "conteudo": {
        "introducao": "",
        "conceitos": ["",""],
        "exemplos": ["",""],
        "aplicacoes": ["",""],
        "resumoRapido": ["",""]
      },
      "analogias": ["",""],
      "ativacao": ["",""],
      "quiz": {
        "pergunta": "",
        "alternativas": ["","","",""],
        "corretaIndex": 0,
        "explicacao": ""
      },
      "flashcards": [
        {"q":"","a":""},
        {"q":"","a":""},
        {"q":"","a":""}
      ],
      "mindmap": "A > B | C > D"
    }
  ]
}

NÃO ESCREVER NADA FORA DO JSON.
TEMA: ${tema}
NÍVEL: ${nivelNorm}
BANCA: ${bancaNorm}
`;

    // ----------------------------------------------------------
    //  Mode json_object garante JSON perfeito
    // ----------------------------------------------------------
    async function gerarJSON() {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.25,
      });

      const raw = completion.choices[0].message.content;
      return JSON.parse(raw);
    }

    // ----------------------------------------------------------
    // Retry com JSON seguro
    // ----------------------------------------------------------
    let bruto = null;
    for (let i = 1; i <= 3; i++) {
      try {
        bruto = await gerarJSON();
        if (bruto?.sessoes?.length) break;
      } catch (err) {
        console.warn("Tentativa falhou:", err);
      }
    }

    if (!bruto || !Array.isArray(bruto.sessoes)) {
      throw new Error("Falha ao gerar JSON válido.");
    }

    // ----------------------------------------------------------
    // Normalização leve
    // ----------------------------------------------------------
    const fix = (v) => (typeof v === "string" ? v.trim() : v);

    const sessoesFinal = bruto.sessoes.map((s, idx) => ({
      id: "S" + (idx + 1),
      ordem: idx + 1,
      titulo: fix(s.titulo) || `Sessão ${idx + 1} — ${tema}`,
      objetivo: fix(s.objetivo || ""),
      conteudo: {
        introducao: fix(s.conteudo?.introducao || ""),
        conceitos: (s.conteudo?.conceitos || []).map(fix),
        exemplos: (s.conteudo?.exemplos || []).map(fix),
        aplicacoes: (s.conteudo?.aplicacoes || []).map(fix),
        resumoRapido: (s.conteudo?.resumoRapido || []).map(fix),
      },
      analogias: (s.analogias || []).map(fix),
      ativacao: (s.ativacao || []).map(fix),
      quiz: {
        pergunta: fix(s.quiz?.pergunta || ""),
        alternativas: (s.quiz?.alternativas || []).map(fix).slice(0, 4),
        corretaIndex: s.quiz?.corretaIndex ?? 0,
        explicacao: fix(s.quiz?.explicacao || ""),
      },
      flashcards: (s.flashcards || [])
        .map((f) => ({ q: fix(f.q), a: fix(f.a) }))
        .filter((f) => f.q && f.a)
        .slice(0, 3),
      mindmap: fix(s.mindmap || "")
    }));

    return res.status(200).json({ plano: sessoesFinal });

  } catch (err) {
    console.error("❌ Erro ao gerar plano:", err);
    return res.status(500).json({ error: "Erro ao gerar plano." });
  }
}
