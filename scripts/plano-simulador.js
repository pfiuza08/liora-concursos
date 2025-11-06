// ==========================================================
// 📚 plano-simulador.js (v18)
// Tema → IA decide sessões (retorno compatível com core v14)
// Upload em módulos é tratado pelo semantic.js (generatePlanFromUploadAI)
// ==========================================================
(function () {
  const LOG = (...a) => console.log("[plano-simulador]", ...a);

  function sanitizeTitle(t, tema, i) {
    if (!t) return `Sessão ${i} — ${tema}`;
    return t.length > 60 ? t.slice(0, 58) + "…" : t;
  }
  function shortText(t, fb) { return t ? (t.length > 140 ? t.slice(0,137) + "..." : t) : fb; }
  function shortBullets(c, tema) {
    if (!c) return "• Objetivo claro\n• Exemplo simples\n• Mini tarefa";
    const linhas = c.split(/\n|•/).map(s=>s.trim()).filter(Boolean).slice(0,3);
    return "• " + linhas.join("\n• ");
  }

  window.generatePlanByTheme = async function (tema, nivel) {
    const prompt = `
Crie um plano de estudo em microlearning para o tema "${tema}" (${nivel}).
Retorne APENAS JSON válido:

{
  "sessoes": <numero>,
  "plano": [
    {"titulo":"Sessão X — Subtópico","resumo":"até 140c","conteudo":"• bullet 1\\n• bullet 2\\n• bullet 3"}
  ]
}
`.trim();

    if (window.OPENAI_API_KEY) {
      try {
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
        let content = data?.choices?.[0]?.message?.content || "";
        content = content.replace(/```json|```/g,"").trim();
        const obj = JSON.parse(content);
        if (!Array.isArray(obj?.plano)) throw new Error("Formato inválido");
        const out = obj.plano.map((s, i) => ({
          titulo: sanitizeTitle(s?.titulo, tema, i+1),
          resumo: shortText(s?.resumo, `Objetivo da sessão sobre ${tema}.`),
          detalhamento:
            `🎯 Objetivo: ${shortText(s?.resumo, `Entender subtema do tema ${tema}.`)}\n` +
            `📘 Mini-aula:\n${shortBullets(s?.conteudo, tema)}\n` +
            `🧪 Exercício: aplique o subtema em um exemplo real.\n` +
            `✅ Checklist: [ ] conceito [ ] exemplo [ ] exercício`
        }));
        return { sessoes: out.length, plano: out };
      } catch(e) { console.warn("IA tema falhou:", e); }
    }

    // Fallback simples
    const base = ["Fundamentos","Aplicações","Ferramentas","Exemplos","Projeto","Revisão"];
    const plano = base.map((b, i) => ({
      titulo: `Sessão ${i+1} — ${b} de ${tema}`,
      resumo: `Objetivo prático sobre ${b}.`,
      detalhamento:
        `🎯 Objetivo: dominar ${b} de ${tema}.\n` +
        `📘 Explicação: visão direta do conceito.\n` +
        `🧠 Exemplos: 2 casos.\n` +
        `🧪 Exercício: produza seu exemplo.\n` +
        `✅ Checklist: [ ] Conceito [ ] Exemplo [ ] Exercício`
    }));
    return { sessoes: plano.length, plano };
  };

  LOG("✅ plano-simulador.js v18 carregado");
})();
