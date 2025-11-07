// /api/liora.js

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? null,
  });

  const { system, user } = req.body;

  if (!client.apiKey) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY",
      detail: "Adicione a variável OPENAI_API_KEY nas variáveis de ambiente da Vercel"
    });
  }

  try {
    const result = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
    });

    return res.status(200).json({
      output: result.choices[0].message.content
    });

  } catch (err) {
    console.error("❌ ERRO DA IA:", err);

    return res.status(500).json({
      error: "IA error",
      detail: err?.error || err?.message || "Erro desconhecido"
    });
  }
}
