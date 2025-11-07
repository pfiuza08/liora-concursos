// /api/liora.js
import OpenAI from "openai";

export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  try {
    const { system, user } = await req.json();

    if (!system || !user) {
      return new Response(
        JSON.stringify({ error: "Missing system or user message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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

    return new Response(
      JSON.stringify({
        output: completion.choices[0].message.content,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("❌ Erro no handler:", err);

    return new Response(
      JSON.stringify({
        error: "IA error",
        detail: err.message || err.toString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
