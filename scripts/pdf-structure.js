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
