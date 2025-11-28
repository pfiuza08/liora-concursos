// /api/gerarPlano.js
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
    
    const qtdSessoes = sessoes || 6; // padrão saudável
    
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Você é a Liora, especialista em criar planos de estudo.

Tema: ${tema}
Nível: ${nivel}
Sessões: ${qtdSessoes}

Regras:
- Cada sessão deve conter: título curto, resumo, tópicos e conceitos-chave.
- Responda em JSON válido e SEM comentários.

Estrutura:
{
  "origem": "tema",
  "meta": {
    "tema": "${tema}",
    "nivel": "${nivel}"
  },
  "sessoes": [
    {
      "titulo": "",
      "resumo": "",
      "descricao": "",
      "conceitos": [],
      "densidade": ""
    }
  ]
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1", // ou gpt-4.1-mini para reduzir custo
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const output = completion.choices[0].message.content;

    // retorna JSON
    res.status(200).json(JSON.parse(output));

  } catch (error) {
    console.error("Erro na IA:", error);
    res.status(500).json({ error: "Erro ao gerar plano" });
  }
}
