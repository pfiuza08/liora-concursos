// ===============================
// 🧱 pdf-structure.js
// Constrói seções { titulo, conteudo } a partir dos blocos do PDF
// Depende de: LioraPDF.extrairBlocosDoPDF
// ===============================
(function () {
  console.log("🔵 Liora PDF Structure carregado...");

  /**
   * Heurística simples para decidir se um bloco parece ser título
   * @param {Object} bloco
   * @param {number} limiarFonte
   * @returns {boolean}
   */
  function ehPossivelTitulo(bloco, limiarFonte) {
    const txt = bloco.text.trim();

    if (bloco.fontSize < limiarFonte) return false;
    if (txt.length > 120) return false;
    if (/^[0-9.,;:]+$/.test(txt)) return false;
    if (/[.!?]$/.test(txt) && txt.length > 60) return false;

    const padroesTitulo = [
      /^cap[ií]tulo\s+\d+/i,
      /^unidade\s+\d+/i,
      /^\d+(\.\d+)*\s+/,
      /^aula\s+\d+/i
    ];

    if (padroesTitulo.some(rx => rx.test(txt))) return true;

    // palavras todas em maiúsculo (com acentos)
    const semAcento = txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const letras = semAcento.replace(/[^A-Za-z]/g, "");
    if (letras && letras === letras.toUpperCase()) return true;

    return true;
  }

  /**
   * Constrói seções heurísticas a partir de blocos
   * @param {Array<{page:number,y:number,fontSize:number,text:string}>} blocos
   * @returns {Array<{titulo:string,conteudo:string}>}
   */
  function construirSecoesAPartirDosBlocos(blocos) {
    if (!blocos || blocos.length === 0) {
      return [];
    }

    // Calcula um limiar de fonte baseado na mediana
    const tamanhos = blocos.map(b => b.fontSize).sort((a, b) => a - b);
    const mediana = tamanhos[Math.floor(tamanhos.length / 2)] || 12;
    const limiarFonte = mediana + 1.5; // um pouco acima da mediana

    const secoes = [];
    let secaoAtual = null;

    function iniciarNovaSecao(titulo) {
      if (secaoAtual && secaoAtual.conteudo.trim()) {
        secoes.push(secaoAtual);
      }
      secaoAtual = {
        titulo: titulo || "Seção sem título",
        conteudo: ""
      };
    }

    blocos.forEach((bloco, idx) => {
      const txt = bloco.text.trim();
      if (!txt) return;

      const possivelTitulo = ehPossivelTitulo(bloco, limiarFonte);

      if (possivelTitulo) {
        // Se já temos seção aberta e esse título é idêntico ao anterior, ignora
        if (
          secaoAtual &&
          secaoAtual.titulo &&
          secaoAtual.titulo.trim() === txt &&
          !secaoAtual.conteudo.trim()
        ) {
          return;
        }
        iniciarNovaSecao(txt);
      } else {
        if (!secaoAtual) {
          iniciarNovaSecao("Introdução");
        }
        secaoAtual.conteudo += (secaoAtual.conteudo ? "\n" : "") + txt;
      }
    });

    if (secaoAtual && secaoAtual.conteudo.trim()) {
      secoes.push(secaoAtual);
    }

    // Fallback: se por algum motivo deu muito fragmentado, junta tudo em uma seção
    if (secoes.length === 0) {
      const textoUnico = blocos.map(b => b.text).join("\n");
      return [
        {
          titulo: "Conteúdo do PDF",
          conteudo: textoUnico
        }
      ];
    }

    console.log("🧱 Seções heurísticas construídas:", secoes);
    return secoes;
  }

  window.LioraPDF = window.LioraPDF || {};
  window.LioraPDF.construirSecoesAPartirDosBlocos = construirSecoesAPartirDosBlocos;
})();
