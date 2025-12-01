// ==========================================================
// 🧠 LIORA — GERADOR DE PLANO POR TEMA v75-PRO
// - Sessões densas e didáticas
// - Quiz forte, flashcards garantidos, mapa mental consistente
// - JSON extremamente estável (com limpeza e retry)
// - Compatível com CORE v74 (plano: JSON.stringify([]))
// ==========================================================

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    // --------------------------
    // MÉTODO PERMITIDO
    // --------------------------
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const { tema, nivel, sessoes } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({ error: "Parâmetros incompletos." });
    }

    // Número adaptativo de sessões
    const qtdSessoes = Math.max(6, Math.min(12, Number(sessoes) || 8));

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // ==========================================================
    // 🧠 PROMPT PROFISSIONAL (v75-PRO)
    // ==========================================================
    const prompt = `
Você é a IA da Liora, especialista em ensino estruturado, aprendizado ativo e clareza didática.

Crie EXATAMENTE ${qtdSessoes} sessões de estudo profundas e bem elaboradas para:

TEMA: ${tema}
NÍVEL: ${nivel}

Toda a saída deve ser APENAS JSON válido no formato abaixo:

{
  "origem": "tema",
  "tema": "${tema}",
  "nivel": "${nivel}",
  "sessoes": [
    {
      "titulo": "Título claro e didático",
      "objetivo": "Objetivo único, direto e alinhado ao tema",
      "conteudo": {
        "introducao": "2-3 frases contextualizando o tema da sessão",
        "conceitos": ["3–6 conceitos essenciais, sem redundância"],
        "exemplos": ["2–4 exemplos reais ou aplicados"],
        "aplicacoes": ["2–4 aplicações práticas e concretas"],
        "resumoRapido": ["4–6 bullets sintéticos com os pontos-chave"]
      },
      "ativacao": [
        "2–4 perguntas que testem raciocínio, não memorização"
      ],
      "quiz": {
        "pergunta": "Pergunta forte, clara e objetiva",
        "alternativas": [
          "Alternativa A coerente",
          "Alternativa B plausível",
          "Alternativa C parcialmente correta",
          "Alternativa D incorreta mas verossímil"
        ],
        "corretaIndex": 0,
        "explicacao": "Justificativa detalhada da alternativa correta"
      },
      "flashcards": [
        { "q": "Pergunta essencial do tópico", "a": "Resposta objetiva" },
        { "q": "Outro conceito-chave", "a": "Resposta sintética" },
        { "q": "Ponto que sempre causa dúvida", "a": "Explicação curta" }
      ],
      "mindmap": "Mapa mental textual com 2–3 níveis — formato: A > B > C | X > Y | ..."
    }
  ]
}

REGRAS CRÍTICAS:
- Nunca escreva nada fora do JSON.
- Nunca deixe listas vazias.
- Nunca use frases vagas (“é importante”, “é necessário entender”).
- Foque em clareza, aplicabilidade e exemplos reais.
- O JSON DEVE SER 100% válido.
`;

    // ==========================================================
    // 🧼 LIMPEZA DE CARACTERES PROBLEMÁTICOS
    // ==========================================================
    function sanitizeJSON(str) {
      return str
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/\u0000/g, "")
        .replace(/[\u0001-\u001F]/g, " ")
        .trim();
    }

    // ==========================================================
    // 🍀 FUNÇÃO DE PARSE MAIS ROBUSTA POSSÍVEL
    // ==========================================================
    function safeParse(str) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return null;
      }
    }

    // ==========================================================
    // 🔁 RETRY INTELIGENTE (3 tentativas)
    // ==========================================================
    async function gerarComRetry() {
      for (let tentativa = 1; tentativa <= 3; tentativa++) {
        try {
          const completion = await client.chat.completions.create({
            model: "gpt-4.1",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
          });

          let output = sanitizeJSON(
            completion.choices[0].message.content || ""
          );

          // tenta parser
          let json = safeParse(output);

          if (
            json &&
            json.sessoes &&
            Array.isArray(json.sessoes) &&
            json.sessoes.length === qtdSessoes
          ) {
            return json;
          }

          console.warn(`⚠️ Tentativa ${tentativa}: JSON inválido ou incompleto.`);
        } catch (err) {
          console.warn(`⚠️ Tentativa ${tentativa} falhou:`, err);
        }
      }

      throw new Error("Falha ao gerar JSON válido após 3 tentativas.");
    }

    // ==========================================================
    // EXECUÇÃO
    // ==========================================================
    const parsed = await gerarComRetry();

    if (!parsed || !parsed.sessoes || !parsed.sessoes.length) {
      throw new Error("A IA retornou uma estrutura inválida.");
    }

    // ==========================================================
    // ✔ SAÍDA FINAL — FORMATO EXIGIDO PELO CORE v74
    // ==========================================================
    return res.status(200).json({
      plano: JSON.stringify(parsed.sessoes), // ⭐ CORE espera STRING do array de sessões
    });

  } catch (error) {
    console.error("❌ Erro ao gerar plano:", error);
    return res.status(500).json({ error: "Erro ao gerar plano." });
  }
}
