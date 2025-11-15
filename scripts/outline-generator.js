// ==========================
// 🧠 outline-generator.js
// ==========================
(function () {
  console.log("🔵 Liora Outline Generator carregado...");

  async function chamarIA(system, user) {
    if (!window.callLLM) throw new Error("callLLM() não encontrado");
    return await window.callLLM(system, user);
  }

  async function gerarOutlinesPorSecao(secoes, nivel) {
    const outlines = [];

    for (const sec of secoes) {
      const prompt = `Analise o seguinte trecho de apostila e descreva os tópicos centrais.
Retorne JSON assim: {"topicos": ["t1", "t2"]}

TÍTULO: ${sec.titulo}

CONTEÚDO:
${sec.conteudo.join("\n")}`;

      const raw = await chamarIA(
        "Você é Liora e retorna sempre JSON válido.",
        prompt
      );

      try {
        const json = JSON.parse(raw);
        outlines.push(json);
      } catch {
        outlines.push({ topicos: [] });
      }
    }

    console.log("🧠 Outlines por seção:", outlines);
    return outlines;
  }

  function unificarOutlines(listas) {
    const mapa = new Map();
    listas.forEach(o => {
      (o.topicos || []).forEach(t => {
        mapa.set(t.toLowerCase(), t);
      });
    });

    const unificado = Array.from(mapa.values()).map((t, i) => ({
      numero: i + 1,
      nome: t
    }));

    console.log("🧠 Outline unificado:", { outline: unificado });
    return unificado;
  }

  async function gerarPlanoEstudo(outline, nivel) {
    return {
      nivel,
      sessoes: outline
    };
  }

 window.LioraOutline = {
    gerarOutlinesPorSecao,
    unificarOutlines,
    gerarPlanoEstudo,
    gerarPlanoDeEstudo: gerarPlanoEstudo   // alias para compatibilidade com core.js
};

})();
