import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log("🔵 Iniciando teste OpenAI…");

    // -------------------------------
    // 1) Teste simples de completions
    // -------------------------------
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Responda apenas com um JSON curto: {\"ok\": true}"
        }
      ],
      max_tokens: 50,
      temperature: 0,
    });

    const text = r.choices?.[0]?.message?.content || "";
    const finish = r.choices?.[0]?.finish_reason || "desconhecido";

    // -------------------------------
    // 2) Verificar se truncou
    // -------------------------------
    let truncado = finish === "length" || text.length < 5;

    // -------------------------------
    // 3) Teste JSON
    // -------------------------------
    let parsed = null;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch (e) {}

    // -------------------------------
    // 4) Retorno final
    // -------------------------------
    return res.status(200).json({
      status: "ok",
      raw: text,
      finish_reason: finish,
      truncado,
      json_valido: parsed !== null,
      parsed,
    });

  } catch (err) {
    console.error("❌ ERRO forte:", err);
    return res.status(500).json({
      status: "erro",
      mensagem: err.message,
      stack: err.stack,
    });
  }
}
