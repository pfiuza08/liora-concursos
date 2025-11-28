// /api/gerarPlano.js — COMPATÍVEL COM LIORA CORE v73
import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const { tema, nivel, sessoes } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({ error: "Parâmetros incompletos." });
    }

    const qtdSessoes = Math.max(6, Math.min(12, Number(sessoes) || 8));

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Você é a IA da Liora, especialista em criar planos de estudo completos e didáticos.

Gere EXATAMENTE ${qtdSessoes} sessões completas.

Tema: ${tema}
Nível: ${nivel}

Formato OBRIGATÓRIO (JSON VÁLIDO):

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
        "conceitos": [],
        "exemplos": [],
        "aplicacoes": [],
        "resumoRapido": []
      },
      "ativacao": [],
      "quiz": {
        "pergunta": "",
        "alternativas": [],
        "corretaIndex": 0,
        "explicacao": ""
      },
      "flashcards": [],
      "mindmap": ""
    }
  ]
}

REGRAS:
- NÃO inclua comentários fora do JSON.
- NÃO acrescente texto antes ou depois do JSON.
- As sessões devem ser completas, coerentes e sem campos vazios.
- Gere conceitos e exemplos reais sobre o tema.
- Gere 1 quiz por sessão.
- Gere 3 a 5 flashcards por sessão.
- Gere mindmap no formato: "A > B > C | X > Y".
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35,
    });

    const output = completion.choices[0].message.content.trim();

    return res.status(200).json(JSON.parse(output));

  } catch (error) {
    console.error("Erro na IA:", error);
    return res.status(500).json({ error: "Erro ao gerar plano" });
  }
}
