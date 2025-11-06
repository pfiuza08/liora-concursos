// /scripts/plano-simulador.js — v14
(function () {

  const LOG = (...a) => console.log("[plano-simulador]", ...a);

  // =======================
  // 🔧 Utils de robustez
  // =======================

  /** Extrai JSON mesmo se vier texto fora do JSON */
  function extractJSON(text) {
    if (!text) return null;
    let cleaned = text.replace(/```json|```/g, "").trim();

    try {
      return JSON.parse(cleaned);
    } catch {}

    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last !== -1)
      try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}

    return null;
  }

  /** Garante estrutura limpa do plano */
  function sanitizePlan(obj, tema, nivel) {
    const sessoes = Number(obj?.sessoes || obj?.total_sessoes || (obj?.plano?.length || 0));
    const raw = Array.isArray(obj?.plano) ? obj.plano : [];

    const plano = raw.map((item, i) => {
      const titulo = item.titulo || `Sessão ${i + 1} — ${tema}`;
      const resumo = item.resumo || `Objetivo da sessão ${i + 1} sobre ${tema} (nível ${nivel}).`;

      let conteudo = item.conteudo;
      if (Array.isArray(conteudo)) conteudo = conteudo.map(c => `• ${c}`).join("\n");

      if (!conteudo || typeof conteudo !== "string") {
        conteudo = "• Conteúdo não especificado\n• Desenvolver bullet points no ajuste manual";
      }

      return { titulo, resumo, conteudo };
    });

    return { sessoes, plano };
  }

  /** fallback local (último recurso) */
  function fallbackLocal(tema, nivel) {
    const sugestao = nivel === "avancado" ? 5 : nivel === "intermediario" ? 6 : 7;
    return {
      sessoes: sugestao,
      plano: Array.from({ length: sugestao }, (_, i) => ({
        titulo: `Sessão ${i + 1} — ${tema}`,
        resumo: `Exploração progressiva do tema no nível ${nivel}.`,
        conteudo: `• Conceitos principais\n• Aplicação prática\n• Exercícios\n`
      }))
    };
  }

  // =======================
  // 🚀 IA — Geração Automática
  // =======================

  window.generatePlanByTheme = async function (tema, nivel) {
    LOG("🔍 solicitando plano automático:", { tema, nivel });

    const prompt = `
Você é especialista em microlearning (Barbara Oakley) e design instrucional.

1️⃣ IDENTIFIQUE OS SUBTÓPICOS
- Liste os principais subtópicos do tema
- Em ordem progressiva (do mais básico ao avançado)
- Quantidade ideal baseada no nível:
  iniciante = + fragmentado
  intermediário = médio
  avançado = mais denso

2️⃣ CRIE O PLANO
Cada subtópico vira uma SESSÃO.

⚠️ NUNCA repita bullets genéricos como:
• conceitos principais
• exemplos práticos

Crie bullets CONCRETOS, específicos e acionáveis.

✅ SAÍDA OBRIGATÓRIA EM JSON PURO (sem texto fora do JSON):

{
  "sessoes": <numero>,
  "plano": [
    {
      "titulo": "Sessão X — Nome do Subtópico",
      "resumo": "Objetivo da sessão (1 parágrafo)",
      "conteudo": "• bullet 1\\n• bullet 2\\n• bullet 3"
    }
  ]
}

Tema: "${tema}"
Nível do aluno: "${nivel}"

Agora gere APENAS o JSON.
`.trim();

    try {

      if (!window.OPENAI_API_KEY) {
        LOG("⚠️ Sem API key — usando fallback");
        return fallbackLocal(tema, nivel);
      }

      LOG("🌐 Enviando para OpenAI…");

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          temperature: 0.1,         // pouca aleatoriedade
          messages: [
            { role: "system", content: "Você gera planos de estudo perfeitos." },
            { role: "user", content: prompt }
          ],
        }),
      });

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;

      LOG("📥 IA respondeu:", content);

      const json = extractJSON(content);
      if (!json) throw new Error("JSON inválido retornado pela IA");

      return sanitizePlan(json, tema, nivel);

    } catch (err) {
      LOG("❌ Erro OpenAI:", err);
      return fallbackLocal(tema, nivel);
    }
  };

  LOG("✅ plano-simulador.js carregado (v14)");

})();
