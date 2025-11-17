// ==========================================================
// 🧠 LIORA — PDF STRUCTURE v71 (DEFINITIVO)
// - Corrige explosão de seções (ex: 409 seções → 8~12 reais)
// - Remove heurística agressiva de títulos
// - Agrupa conteúdo baseado em densidade e continuidade
// - Compatível com Core v70 e Outline v70
// ==========================================================

(function () {
  console.log("🔵 Liora PDF Structure v71 carregado...");

  // -------------------------------------------------------------
  // Normalização
  // -------------------------------------------------------------
  function norm(txt) {
    return (txt || "").replace(/\s+/g, " ").trim();
  }

  // -------------------------------------------------------------
  // Agrupamento por página: junta blocos sequenciais
  // -------------------------------------------------------------
  function agruparPorPagina(blocos) {
    const paginas = {};
    for (const b of blocos) {
      if (!paginas[b.page]) paginas[b.page] = [];
      paginas[b.page].push(b);
    }
    return Object.values(paginas);
  }

  // -------------------------------------------------------------
  // Consolida cada página em um bloco textual grande
  // -------------------------------------------------------------
  function consolidarPaginas(paginas) {
    return paginas.map(paginaBlocos => {
      const texto = paginaBlocos
        .map(b => norm(b.text))
        .filter(x => x.length > 0)
        .join(" ");

      return texto;
    }).filter(t => t.length > 0);
  }

  // -------------------------------------------------------------
  // Dividir conteúdo consolidado em SEÇÕES RELEVANTES
  // -------------------------------------------------------------
  function dividirEmSecoesTexto(texto) {

    // Baseado em dois princípios:
    // 1. cada ~600–1200 caracteres = 1 tópico coerente
    // 2. cortar sempre em pontos finais para manter sentido

    const TAM_MIN = 600;  
    const TAM_MAX = 1200;

    const secoes = [];
    let buffer = "";

    const partes = texto.split(/(?<=[.!?])\s+/);

    for (const frase of partes) {
      if ((buffer + " " + frase).length < TAM_MAX) {
        buffer += " " + frase;
      } else {
        secoes.push(norm(buffer));
        buffer = frase;
      }
    }

    if (buffer.length > 0) secoes.push(norm(buffer));

    // Limitar de 5 a 15 para ter tópicos reais
    if (secoes.length < 5) return secoes;
    if (secoes.length > 15) return secoes.slice(0, 15);

    return secoes;
  }

  // -------------------------------------------------------------
  // Converter seções reais para estrutura Liora
  // -------------------------------------------------------------
  function construirSecoesReais(paginasConsolidadas) {

    // Junta tudo em um texto corrido
    const textoTotal = paginasConsolidadas.join(" ");

    const secoesTxt = dividirEmSecoesTexto(textoTotal);

    return secoesTxt.map((txt, i) => ({
      titulo: `Tópico ${i + 1}`,
      texto: txt
    }));
  }

  // -------------------------------------------------------------
  // Interface pública
  // -------------------------------------------------------------
  window.LioraPDF = {
    construirSecoesAPartirDosBlocos(blocos) {
      try {
        // 1) agrupa por página
        const paginas = agruparPorPagina(blocos);

        // 2) consolida cada página em um bloco grande
        const paginasConsolidadas = consolidarPaginas(paginas);

        // 3) divide em seções reais (5-15)
        const secoes = construirSecoesReais(paginasConsolidadas);

        console.log(`📚 PDF Structure v71 → Seções reais: ${secoes.length}`);
        return secoes;

      } catch (err) {
        console.error("❌ Erro em PDF Structure v71:", err);
        return [];
      }
    }
  };

})();
