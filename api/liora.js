// /api/liora.js — serverless (Node.js runtime)

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { system, user } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
    });

    return res.status(200).json({
      output: completion.choices[0].message.content
    });

  } catch (err) {
    console.error("❌ Erro no servidor:", err);
    return res.status(500).json({
      error: "IA error",
      detail: err.message || err.toString(),
    });
  }
}
