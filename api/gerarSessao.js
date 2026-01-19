export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      planoTitulo,
      nivel,
      sessaoTitulo,
      indice
    } = req.body || {};

    if (!planoTitulo || !sessaoTitulo) {
      return res.status(400).json({ error: "Dados insuficientes" });
    }

    const prompt = `
Você é um tutor especialista em ensino estruturado e microlearning.

Gere o CONTEÚDO COMPLETO de uma sessão de estudo.

PLANO: ${planoTitulo}
NÍVEL: ${nivel}
SESSÃO ${indice}: ${sessaoTitulo}

REGRAS OBRIGATÓRIAS:
- Linguagem clara, didática e objetiva
- Estrutura em blocos
- Use títulos e subtítulos
- Inclua exemplos práticos
- Não use emojis
- Não cite que é uma IA
- Não faça perguntas ao final

FORMATO DE SAÍDA (HTML SIMPLES):
<h4>Introdução</h4>
<p>...</p>

<h4>Conceitos-chave</h4>
<ul>
  <li>...</li>
</ul>

<h4>Exemplo prático</h4>
<p>...</p>

<h4>Resumo da sessão</h4>
<p>...</p>
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: "Você é um tutor educacional experiente." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    const texto =
      data?.choices?.[0]?.message?.content ||
      "Conteúdo não disponível no momento.";

    return res.status(200).json({ conteudo: texto });

  } catch (err) {
    console.error("Erro IA sessão:", err);
    return res.status(500).json({ error: "IA error" });
  }
}
