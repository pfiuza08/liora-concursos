// ==========================
// 📄 pdf-extractor.js
// ==========================
(function () {
  console.log("🔵 Liora PDF Extractor carregado...");

  async function extrairBlocos(file) {
    const typedArray = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

    const blocos = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      content.items.forEach(item => {
        blocos.push({
          text: item.str || "",
          x: item.transform[4] || 0,
          y: item.transform[5] || 0,
          page: pageNum,
          fontSize: item.height || 0
        });
      });
    }

    console.log("📄 Blocos extraídos do PDF:", blocos.length);
    return blocos;
  }

  window.LioraPDFExtractor = { extrairBlocos };
})();


// ==========================
// 📚 pdf-structure.js
// ==========================
(function () {
  console.log("🔵 Liora PDF Structure carregado...");

  function limparTexto(t) {
    return t.replace(/\s+/g, " ").trim();
  }

  function construirSecoesAPartirDosBlocos(blocos) {
    console.log("📦 Recebendo blocos:", blocos.length);

    const secoes = [];
    let atual = { titulo: null, conteudo: [] };

    blocos.forEach(b => {
      const t = limparTexto(b.text);
      if (!t) return;

      const ehTitulo =
        /^(CAP[IÍ]TULO\s+\d+.*)$/i.test(t) ||
        /^\d+\.\s+.+/.test(t) ||
        /^[A-Z].{0,40}$/.test(t) && b.fontSize > 14;

      if (ehTitulo) {
        if (atual.titulo || atual.conteudo.length) secoes.push(atual);
        atual = { titulo: t, conteudo: [] };
      } else {
        atual.conteudo.push(t);
      }
    });

    if (atual.titulo || atual.conteudo.length) secoes.push(atual);

    console.log("🧱 Seções heurísticas construídas:", secoes);
    return secoes;
  }

  window.LioraPDF = { construirSecoesAPartirDosBlocos };
})();


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
    gerarPlanoEstudo
  };
})();
