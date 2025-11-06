// /scripts/plano-simulador.js  (v11)
(function () {
  const LOG = (...a) => console.log('[plano-simulador]', ...a);

  // ==========================================================
  // 🌟 GERADOR DE PLANO POR TEMA (IA + backend + fallback)
  // ==========================================================

  window.generatePlanByTheme = async function (tema, nivel, sessoes) {
    LOG("parâmetros recebidos:", { tema, nivel, sessoes });

    if (!tema || !nivel || !sessoes || isNaN(parseInt(sessoes))) {
      throw new Error("Parâmetros inválidos (tema, nivel, sessoes)");
    }

    sessoes = parseInt(sessoes); // normaliza

    // PROMPT reforçado (obriga JSON sem texto fora)
    const prompt = `
Você é especialista em microlearning e Barbara Oakley.

Gere um PLANO DE ESTUDOS dividido em **${sessoes} sessões**.

Tema: **${tema}**
Nível do aluno: **${nivel}**

⚠️ FORMATO OBRIGATÓRIO DA RESPOSTA (apenas JSON válido, sem markdown e sem explicações):
[
  {
    "titulo": "Sessão X — título curto",
    "resumo": "Objetivo da sessão (1 parágrafo)",
    "conteudo": "• item 1\\n• item 2\\n• item 3"
  }
]
`.trim();


    // ======================================================
    // ✅ 1) CHAMADA DIRETA À OPENAI (se houver API KEY)
    // ======================================================
    if (window.OPENAI_API_KEY) {
      try {
        LOG("usando chamada direta à OpenAI");

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            temperature: 0.3,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await res.json();
        LOG("resposta da IA:", data);

        let json = data.choices?.[0]?.message?.content;
        if (!json) throw new Error("IA retornou vazio");

        // remove possíveis fences markdown
        json = json.replace(/```json|```/g, "").trim();

        let plano = JSON.parse(json);

        // ✅ Normaliza sessões sem conteúdo
        plano = plano.map((sessao, index) => ({
          titulo: sessao.titulo || `Sessão ${index + 1} — ${tema}`,
          resumo: sessao.resumo || `Exploração do tema para o nível ${nivel}.`,
          conteudo: sessao.conteudo?.trim() ||
            `• Conceitos principais\n• Exemplos práticos\n• Exercícios de fixação`,
        }));

        return plano;
      } catch (err) {
        LOG("Falha ao chamar OpenAI direto:", err.message);
      }
    }


    // ======================================================
    // ✅ 2) BACKEND OPCIONAL (/api/plan)
    // ======================================================
    try {
      LOG("tentando backend /api/plan...");

      const resp = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, nivel, sessoes }),
      });

      if (resp.ok) {
        const result = await resp.json();

        if (result?.plano && Array.isArray(result.plano)) {
          LOG("Plano gerado pelo backend:", result.origem);
          return result.plano;
        }
      }

      LOG("backend não retornou formato válido.");
    } catch (err) {
      LOG("Erro no backend /api/plan:", err.message);
    }


    // ======================================================
    // ✅ 3) FALLBACK (sempre funciona)
    // ======================================================
    LOG("usando fallback local");

    return fallbackLocal(tema, nivel, sessoes);
  };


  // ======================================================
  // 🔄 FALLBACK → garante plano SEM undefined
  // ======================================================
  function fallbackLocal(tema, nivel, sessoes) {
    const dens = nivel === "avancado" ? "📙" :
                 nivel === "intermediario" ? "📘" : "📗";

    return Array.from({ length: sessoes }, (_, i) => ({
      titulo: `Sessão ${i + 1} — ${tema}`,
      resumo: `Exploração do tema adaptado ao nível ${nivel}.`,
      conteudo: `• Conceitos principais\n• Leituras recomendadas\n• Exercícios\n• Densidade cognitiva ${dens}`,
    }));
  }

  LOG("✅ plano-simulador.js carregado");
})();
