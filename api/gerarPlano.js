// /api/gerarPlano.js — VERSÃO FINAL ROBUSTA (compatível com CORE v74)
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

    // número de sessões adaptativo
    const qtdSessoes = Math.max(6, Math.min(12, Number(sessoes) || 8));

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // -------------------------------------------------------
    // 🧠 PROMPT DEFINITIVO PARA SESSÕES ESTÁVEIS
    // -------------------------------------------------------
    const prompt = `
Você é a IA da Liora, especialista em aprendizado adaptativo e estudo guiado.

Crie EXATAMENTE ${qtdSessoes} sessões de estudo para:

TEMA: ${tema}
NÍVEL: ${nivel}

⚠️ SAÍDA OBRIGATÓRIA (JSON PURO, SEM NENHUMA EXPLICAÇÃO FORA):
{
  "origem": "tema",
  "tema": "${tema}",
  "nivel": "${nivel}",
  "sessoes": [
    {
      "titulo": "",
      "objetivo": "",
      "conteudo": {
        "introducao": "",
        "conceitos": ["", ""],
        "exemplos": ["", ""],
        "aplicacoes": ["", ""],
        "resumoRapido": ["", ""]
      },
      "ativacao": ["", ""],
      "quiz": {
        "pergunta": "",
        "alternativas": ["A", "B", "C", "D"],
        "corretaIndex": 0,
        "explicacao": ""
      },
      "flashcards": [
        { "q": "", "a": "" },
        { "q": "", "a": "" }
      ],
      "mindmap": "A > B > C | X > Y"
    }
  ]
}

REGRAS:
- Nunca escreva nada fora do JSON.
- Nunca adicione comentários.
- Todos os campos devem vir preenchidos.
- As listas devem ser úteis, densas e didáticas.
- O JSON deve ser 100% válido.
    `;

    // -------------------------------------------------------
    // 🔧 Função auxiliar para tentar parse
    // -------------------------------------------------------
    const tryParseJSON = (str) => {
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    };

    // -------------------------------------------------------
    // 🔁 Função com retry automático (2 tentativas)
    // -------------------------------------------------------
    async function gerarComRetry() {
      for (let tentativa = 1; tentativa <= 2; tentativa++) {
        try {
          const completion = await client.chat.completions.create({
            model: "gpt-4.1",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.25,
          });

          let output = completion.choices[0].message.content.trim();

          // limpar blocos ```json
          output = output.replace(/```json/gi, "").replace(/```/g, "").trim();

          const parsed = tryParseJSON(output);

          // validar estrutura
          if (
            parsed &&
            parsed.sessoes &&
            Array.isArray(parsed.sessoes) &&
            parsed.sessoes.length > 0
          ) {
            return parsed; // retorna OBJETO parsed diretamente
          }

          console.warn(`⚠️ Tentativa ${tentativa}: JSON inválido ou sem sessões.`);
        } catch (err) {
          console.warn(`⚠️ Tentativa ${tentativa} falhou:`, err);
        }
      }

      throw new Error("A IA não retornou JSON válido após 2 tentativas.");
    }

    // -------------------------------------------------------
    // EXECUÇÃO REAL
    // -------------------------------------------------------
    const parsed = await gerarComRetry();

    if (!parsed.sessoes || !parsed.sessoes.length) {
      throw new Error("JSON retornado pela IA não contém sessões.");
    }

    // -------------------------------------------------------
    // ✔ FORMATO FINAL EXIGIDO PELO CORE v74
    // -------------------------------------------------------
    return res.status(200).json({
      plano: JSON.stringify(parsed.sessoes), // <-- STRING contendo APENAS O ARRAY
    });

  } catch (error) {
    console.error("❌ Erro ao gerar plano:", error);
    return res.status(500).json({ error: "Erro ao gerar plano." });
  }
}
