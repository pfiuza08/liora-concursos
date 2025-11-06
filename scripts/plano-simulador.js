// /scripts/plano-simulador.js (v17 — somente resumo no plano principal + conteúdo detalhado separado)
(function () {
  const LOG = (...a) => console.log("[plano-simulador]", ...a);

  // ==========================================================
  // API PRINCIPAL (exposta ao core.js)
  // ==========================================================
  window.generatePlanByTheme = async function (tema, nivel, sessoesUsuario) {
    LOG("📥 parâmetros recebidos:", { tema, nivel, sessoesUsuario });

    const sess = parseInt(sessoesUsuario) || null;

    const prompt = `
Você é especialista em microlearning (Barbara Oakley).

Divida o tema em subtópicos e gere um plano progressivo.

RETORNE SOMENTE JSON VÁLIDO:

{
  "plano": [
    {
      "titulo": "Sessão X — Nome do subtópico",
      "resumo": "Descrição breve e clara do objetivo da sessão.",
      "detalhamento": "Aqui sim você pode expandir: explicação + exemplos + mini tarefa."
    }
  ]
}

Tema: "${tema}"
Nível do aluno: "${nivel}"
Se o usuário não informou quantidade de sessões, você pode decidir a quantidade ideal.
`.trim();

    try {
      if (window.OPENAI_API_KEY) {
        LOG("🔗 Chamando OpenAI diretamente…");

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            temperature: 0.35,
            messages: [{ role: "user", content: prompt }]
          }),
        });

        const data = await res.json();
        let json = data.choices?.[0]?.message?.content?.trim();

        json = json.replace(/```json|```/g, "").trim();

        const parsed = JSON.parse(json);

        return normalizePlan(parsed);
      }
    } catch (err) {
      LOG("❌ Erro OpenAI:", err);
    }

    LOG("⚠️ fallback local (sem IA)");
    return fallbackLocal(tema, nivel, sess || 6);
  };


  // ==========================================================
  // Normalização da estrutura recebida
  // ==========================================================
  function normalizePlan(data) {
    const lista = Array.isArray(data.plano) ? data.plano : [];

    return lista.map((item, index) => ({
      titulo: item?.titulo || `Sessão ${index + 1}`,
      resumo: item?.resumo || "Resumo não disponível.",
      detalhamento: item?.detalhamento || "Detalhamento não disponível."
    }));
  }


  // ==========================================================
  // Fallback local (excelente agora no novo formato)
  // ==========================================================
  function fallbackLocal(tema, nivel, qtd) {
    const base = ["Fundamentos", "Aplicações", "Ferramentas", "Exemplos reais", "Projeto guiado", "Revisão"];

    return Array.from({ length: qtd }, (_, i) => ({
      titulo: `Sessão ${i + 1} — ${base[i] || tema}`,
      resumo: `Nesta sessão você vai aprender sobre ${base[i] || tema} aplicado ao tema.`,
      detalhamento: `
• O que é ${base[i] || tema}
• Exemplo aplicado a ${tema}
• Mini tarefa para praticar
`
    }));
  }

  LOG("✅ plano-simulador.js carregado (v17)");
})();
