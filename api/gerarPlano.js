// /api/gerarPlano.js — COMPATÍVEL COM LIORA CORE v73 (VERSÃO RECOMENDADA)
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

    const system = `
Você é LIORA, especialista em criar planos de estudo organizados,
concisos e com estrutura JSON estável e VALIDADA.

Você NUNCA deve gerar nada fora do JSON.
    `;

    const user = `
Gere um plano de estudo completo.

Tema: ${tema}
Nível: ${nivel}
Quantidade exata de sessões: ${qtdSessoes}

Regras CRÍTICAS:
- Responda somente com JSON válido.
- Sem texto antes ou depois.
- Sem comentários.
- Sem campos vazios.
- Sem listas vazias.
- Flashcards: mínimo 3, máximo 5.
- Mindmap no formato: "A > B > C | D > E".
- Quiz deve ter 1 pergunta, 4 alternativas e 1 corretaIndex.

Modelo OBRIGATÓRIO:

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

IMPORTANTE:
- Todas as sessões devem ser coerentes entre si.
- Nenhum campo pode vir vazio.
- "conteudo" deve sempre ter introdução, conceitos, exemplos, aplicações e resumo rápido.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.25,
    });

    const output = completion.choices[0].message.content.trim();

    return res.status(200).json(JSON.parse(output));

  } catch (error) {
    console.error("Erro na IA:", error);
    return res.status(500).json({ error: "Erro ao gerar plano" });
  }
}
