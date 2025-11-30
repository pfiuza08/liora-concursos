// ==========================================================
// 📚 LIORA — PDF Structure v74-C3
// - Constrói seções heurísticas a partir dos blocos do PDF
// - Fornece window.lioraPDFStructure.fromBlocks()
// - Totalmente compatível com core v74 Premium C3
// ==========================================================
(function () {
  console.log("🔵 Liora PDF Structure v74-C3 carregado...");

  function limparTexto(t) {
    return String(t || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function fromBlocks(blocos) {
    if (!Array.isArray(blocos)) {
      console.warn("⚠️ fromBlocks recebeu blocos inválidos:", blocos);
      return [];
    }

    console.log("📦 PDF Structure → recebendo blocos:", blocos.length);

    const secoes = [];
    let atual = { titulo: null, conteudo: [] };

    blocos.forEach((b) => {
      const t = limparTexto(b.text);
      if (!t) return;

      const ehTitulo =
        /^(CAP[IÍ]TULO\s+\d+.*)$/i.test(t) ||
        /^\d+\.\s+.+/.test(t) ||
        (/^[A-Z].{0,40}$/.test(t) && b.fontSize > 14);

      if (ehTitulo) {
        if (atual.titulo || atual.conteudo.length) secoes.push(atual);
        atual = { titulo: t, conteudo: [] };
      } else {
        atual.conteudo.push(t);
      }
    });

    if (atual.titulo || atual.conteudo.length) secoes.push(atual);

    console.log("🧱 Seções construídas:", secoes);
    return secoes;
  }

  // 🔥 API global esperada pelo core v74
  window.lioraPDFStructure = { fromBlocks };
})();
