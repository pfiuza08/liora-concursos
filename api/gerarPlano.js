// ==========================================================
// 🧠 LIORA — GERADOR DE PLANO POR TEMA v76-P0.7 (PREMIUM)
// COMPATÍVEL COM O CORE v74  (retorna plano como STRING JSON)
// ==========================================================

import OpenAI from "openai";

export default async function handler(req, res) {
  const isDev = process.env.NODE_ENV !== "production";

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const { tema, nivel, sessoes, banca } = req.body || {};

    if (!tema || !nivel) {
      return res.status(400).json({ error: "Parâmetros incompletos." });
    }

    const nivelNorm = String(nivel).trim().toLowerCase();
    const bancaNorm = String(banca || "GERAL").trim().toUpperCase();
    const qtdSessoes = Math.max(6, Math.min(12, Number(sessoes) || 8));

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ----------------------------------------------------------
    // PERFIL DE NÍVEL
    // ----------------------------------------------------------
    let perfilNivel = `
NÍVEL DO ESTUDANTE: INTERMEDIÁRIO.
- Clareza + densidade equilibrada.
- Linguagem objetiva.
- Quiz moderado.
- Flashcards com aplicação.`;

    if (nivelNorm === "iniciante") {
      perfilNivel = `
NÍVEL DO ESTUDANTE: INICIANTE.
- Linguagem simples.
- Exemplos concretos.
- Quiz direto, sem pegadinhas.`;
    }

    if (nivelNorm === "avançado" || nivelNorm === "avancado") {
      perfilNivel = `
NÍVEL DO ESTUDANTE: AVANÇADO.
- Profundidade conceitual maior.
- Quiz difícil, alternativas próximas.
- Aplicações especializadas.`;
    }

    // ----------------------------------------------------------
    // PERFIL DE BANCA
    // ----------------------------------------------------------
    let perfilBanca = `BANCA/AVALIAÇÃO: GERAL.`;

    if (bancaNorm.includes("ENEM")) perfilBanca = `BANCA: ENEM.`;
    if (bancaNorm.includes("ENAMED")) perfilBanca = `BANCA: ENAMED.`;
    if (bancaNorm.includes("FGV")) perfilBanca = `BANCA: FGV.`;
    if (bancaNorm.includes("CESPE") || bancaNorm.includes("CEBRASPE"))
      perfilBanca = `BANCA: CESPE/CEBRASPE.`;
    if (bancaNorm.includes("OAB")) perfilBanca = `BANCA: OAB.`;

    // ----------------------------------------------------------
    // PROMPT LLM
    // ----------------------------------------------------------
    const prompt = `
Você é a IA da Liora. Gere EXATAMENTE ${qtdSessoes} sessões.

TEMA: ${tema}
NÍVEL: ${nivel}
BANCA: ${bancaNorm}

CONSIDERE:
${perfilNivel}

E TAMBÉM:
${perfilBanca}

RETORNE APENAS JSON, no formato:

{
  "origem": "tema",
  "tema": "${tema}",
  "nivel": "${nivel}",
  "banca": "${bancaNorm}",
  "sessoes": [
    {
      "titulo": "",
      "objetivo": "",
      "conteudo": {
        "introducao": "",
        "conceitos": ["","",""],
        "exemplos": ["",""],
        "aplicacoes": ["",""],
        "resumoRapido": ["","",""]
      },
      "analogias": ["",""],
      "ativacao": ["","",""],
      "quiz": {
        "pergunta": "",
        "alternativas": ["","","",""],
        "corretaIndex": 0,
        "explicacoes": [
          "Explique porque a alternativa 0 está correta ou incorreta.",
          "Explique porque a alternativa 1 está correta ou incorreta.",
          "Explique porque a alternativa 2 está correta ou incorreta.",
          "Explique porque a alternativa 3 está correta ou incorreta."
        ]
      },
      "flashcards": [
        {"q":"","a":""},
        {"q":"","a":""},
        {"q":"","a":""}
      ],
      "mindmap": "A > B > C | X > Y"
    }
  ]
}

NÃO escreva nada além do JSON.
`;

    // ----------------------------------------------------------
    // Sanitização & Parse
    // ----------------------------------------------------------
    const sanitize = (txt) =>
      String(txt || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/[\u0000-\u001F]/g, " ")
        .trim();

    const tryParse = (raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    async function gerarComRetry() {
      for (let i = 1; i <= 3; i++) {
        try {
          const r = await client.chat.completions.create({
            model: "gpt-4.1",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.25,
          });

          let out = sanitize(r.choices?.[0]?.message?.content || "");

          if (isDev) console.log("RAW:", out.slice(0, 200));

          const json = tryParse(out);

          if (json?.sessoes?.length) return json;

          console.warn(`⚠️ Tentativa ${i}: JSON inválido.`);
        } catch (err) {
          console.warn(`⚠️ Erro tentativa ${i}:`, err);
        }
      }

      throw new Error("Falha ao gerar JSON válido após 3 tentativas.");
    }

    // ----------------------------------------------------------
    // NORMALIZAÇÃO
    // ----------------------------------------------------------
    function normalizar(sessoes) {
      return sessoes.map((s, idx) => {
        const fix = (v) => (typeof v === "string" ? v.trim() : v);
        const c = s.conteudo || {};

        return {
          titulo: fix(s.titulo) || `Sessão ${idx + 1} — ${tema}`,
          objetivo: fix(s.objetivo) || `Compreender o tema ${tema}.`,

          conteudo: {
            introducao: fix(c.introducao || ""),
            conceitos: (c.conceitos || []).map(fix).filter(Boolean),
            exemplos: (c.exemplos || []).map(fix).filter(Boolean),
            aplicacoes: (c.aplicacoes || []).map(fix).filter(Boolean),
            resumoRapido: (c.resumoRapido || []).map(fix).filter(Boolean),
          },

          analogias: (s.analogias || []).map(fix).filter(Boolean),
          ativacao: (s.ativacao || []).map(fix).filter(Boolean),

          quiz: {
            pergunta: fix(s.quiz?.pergunta || ""),
            alternativas: (s.quiz?.alternativas || [])
              .map(fix)
              .filter(Boolean)
              .slice(0, 4),
          
            corretaIndex:
              typeof s.quiz?.corretaIndex === "number"
                ? s.quiz.corretaIndex
                : 0,
          
            explicacoes: Array.isArray(s.quiz?.explicacoes)
              ? s.quiz.explicacoes.map(fix).slice(0, 4)
              : ["", "", "", ""]
          },

          flashcards: (s.flashcards || [])
            .map((f) => ({ q: fix(f?.q || ""), a: fix(f?.a || "") }))
            .filter((f) => f.q && f.a)
            .slice(0, 3),

          mindmap: fix(s.mindmap || ""),
        };
      });
    }

    // ----------------------------------------------------------
    // EXECUÇÃO
    // ----------------------------------------------------------
    const bruto = await gerarComRetry();

    if (!Array.isArray(bruto.sessoes) || bruto.sessoes.length === 0) {
      throw new Error("Estrutura inválida retornada pela IA.");
    }

    const sessoesNorm = normalizar(bruto.sessoes);

    // ⚠️ Compatibilidade: plano deve ser STRING JSON
    const planoString = JSON.stringify(sessoesNorm);

    return res.status(200).json({
      plano: planoString,
    });

  } catch (err) {
    console.error("❌ Erro ao gerar plano:", err);
    return res.status(500).json({ error: "Erro ao gerar plano." });
  }
}
