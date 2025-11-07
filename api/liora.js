// /api/liora.js

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, user } = req.body;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",    // pode trocar por "gpt-4.1" se quiser mais qualidade
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    return res.status(200).json({
      output: completion.choices[0].message.content,  // retorno para o core.js
    });

  } catch (err) {
    console.error("❌ Erro na IA:", err?.response?.data || err?.message);
    return res.status(500).json({
      error: "IA error",
      detail: err?.response?.data || err?.message,
    });
  }
}
