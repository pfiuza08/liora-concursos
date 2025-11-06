// /scripts/plano-simulador.js (v16 — com subtópicos + sessões + conteúdo compacto)
(function () {
  const LOG = (...a) => console.log("[plano-simulador]", ...a);

  // ==========================================================
  // 🔥 Função principal exposta ao core
  // ==========================================================
  window.generatePlanByTheme = async function (tema, nivel, sessoesUsuario) {
    LOG("📥 parâmetros recebidos:", { tema, nivel, sessoesUsuario });

    const sess = parseInt(sessoesUsuario) || null;

    const prompt = `
Você é especialista em design instrucional e microlearning (Método Barbara Oakley).

OBJETIVO: criar um **plano de estudo progressivo**, dividido em sessões.  
Cada sessão deve abordar **um subconjunto diferente do tema**, sem repetição.

---
REGRAS
- Identifique os SUBTÓPICOS do tema antes de gerar o plano.
- Cada sessão deve ter apenas **1 assunto principal**.
- O conteúdo deve ser CURTO e objetivo (não estourar interface).
- Adaptar profundidade ao nível do aluno: ${nivel}.
- Se o aluno não informar quantidade de sessões, você define a melhor quantidade.

---
FORMATO OBRIGATÓRIO (somente JSON válido, sem texto fora):

{
  "sessoes": <numero>,
  "plano": [
    {
      "titulo": "Sessão X — Nome do subtópico",
      "resumo": "Objetivo da sessão (máx. 140 caracteres)",
      "conteudo": "• bullet 1\\n• bullet 2\\n• bullet 3"
    }
  ]
}

Tema: "${tema}"
Quantidade sugerida de sessões: ${sess || "a IA decide a melhor quantidade"}

Agora gere o JSON.
`.trim();


    // ==========================================================
    // 1) Tentativa — IA via OpenAI direto
    // ==========================================================
    if (window.OPENAI_API_KEY) {
      try {
        LOG("🔗 Chamando OpenAI diretamente...");

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            temperature: 0.35,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await res.json();
        LOG("📩 IA respondeu:", data);

        let json = data.choices?.[0]?.message?.content?.trim();
        if (!json) throw new Error("IA retornou vazio.");

        json = json.replace(/```json|```/g, "").trim();

        const parsed = JSON.parse(json);
        return normalizePlan(parsed, tema, nivel);

      } catch (err) {
        LOG("❌ erro OpenAI:", err);
      }
    }

    // ==========================================================
    // 2) Backend opcional (/api/plan)
    // ==========================================================
    try {
      LOG("🌐 Tentando backend /api/plan...");
      const req = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, nivel, sessoes: sess }),
      });

      const result = await req.json();

      if (result?.plano && Array.isArray(result.plano)) {
        return normalizePlan({ sessoes: result.plano.length, plano: result.plano }, tema, nivel);
      }
    } catch (err) {
      LOG("⚠️ erro backend:", err);
    }

    // ==========================================================
    // 3) Fallback — SEM IA
    // ==========================================================
    LOG("⚠️ Fallback local");
    return fallbackLocal(tema, nivel, sess || 6);
  };


  // ==========================================================
  // 🛠 Normalização — garante que cada sessão tenha campos válidos
  // ==========================================================
  function normalizePlan(data, tema, nivel) {
    const sessoes = data?.sessoes || data?.plano?.length || 5;
    const lista = Array.isArray(data.plano) ? data.plano : [];

    return lista.slice(0, sessoes).map((item, i) => ({
      titulo: sanitizeTitle(item.titulo, tema, i + 1),
      resumo: shortText(item?.resumo, `Objetivo: aprender ${tema}.`),
      conteudo: shortBullets(item?.conteudo, tema, nivel),
    }));
  }

  function sanitizeTitle(titulo, tema, index) {
    if (!titulo || typeof titulo !== "string") return `Sessão ${index} — ${tema}`;
    return titulo.length > 60 ? titulo.slice(0, 58) + "…" : titulo;
  }

  function shortText(texto, fallback) {
    if (!texto) return fallback;
    return texto.length > 140 ? texto.slice(0, 137) + "..." : texto;
  }

  function shortBullets(conteudo, tema, nivel) {
    if (!conteudo) {
      return bulletsFor("Subtópico", tema, nivel);
    }

    // mantém só os 3 primeiros bullets para evitar estourar o card
    const linhas = conteudo.split(/\n|•/).map(t => t.trim()).filter(Boolean).slice(0, 3);
    return "• " + linhas.join("\n• ");
  }


  // ==========================================================
  // ✅ Fallback Local (offline)
  // ==========================================================
  function fallbackLocal(tema, nivel, sessoes) {
    const dens =
      nivel === "avancado" ? "📙" :
      nivel === "intermediario" ? "📘" : "📗";

    const topicos = [
      "Fundamentos",
      "Aplicações",
      "Ferramentas",
      "Exemplos reais",
      "Projeto guiado",
      "Revisão prática",
      "Avaliação"
    ];

    return Array.from({ length: sessoes }, (_, i) => ({
      titulo: `Sessão ${i + 1} — ${topicos[i] || tema}`,
      resumo: `Aprender ${topicos[i]} do tema ${tema}.`,
      conteudo: bulletsFor(topicos[i] || tema, tema, nivel) + `\n${dens}`,
    }));
  }


  // ==========================================================
  // 📌 Bullets curtos para qualquer sessão
  // ==========================================================
  function bulletsFor(subtopic, theme, level) {
    const depth =
      level === "avancado" ? "aprofundamento" :
      level === "intermediario" ? "aplicação prática" :
      "compreensão básica";

    return [
      `• O que é ${subtopic}. (${depth})`,
      `• Exemplo aplicado em ${theme}`,
      `• Mini tarefa: criar um resumo de 3 frases`
    ].join("\n");
  }


  LOG("✅ plano-simulador.js carregado com sucesso");
})();
