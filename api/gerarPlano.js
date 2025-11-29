// /api/gerarPlano.js — COMPATÍVEL COM LIORA CORE v74
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

    // Adaptativo: mínimo 6, máximo 12, padrão 8
    const qtdSessoes = Math.max(6, Math.min(12, Number(sessoes) || 8));

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Você é a IA da Liora, especialista em criar planos de estudo completos e curtos.

Gere EXATAMENTE ${qtdSessoes} sessões.

TEMA: ${tema}
NÍVEL: ${nivel}

⚠️ SAÍDA OBRIGATÓRIA (JSON VÁLIDO, SEM QUALQUER TEXTO FORA DO JSON):

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
        { "q": "", "a": "" },
        { "q": "", "a": "" }
      ],
      "mindmap": "A > B > C | X > Y"
    }
  ]
}

REGRAS IMPORTANTES:
- NÃO gere texto fora do JSON.
- NÃO deixe campos vazios.
- Alternativas do quiz devem ser curtas, SEM HTML.
- flashcards devem ter pares {q, a}.
- mindmap deve usar o formato "A > B > C | X > Y".
- Sem quebras de linha dentro dos campos.
- NUNCA coloque comentários // ou texto solto.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.25
    });

    const output = completion.choices[0].message.content.trim();

    return res.status(200).json(JSON.parse(output));

  } catch (error) {
    console.error("Erro na IA:", error);
    return res.status(500).json({ error: "Erro ao gerar plano" });
  }
}
