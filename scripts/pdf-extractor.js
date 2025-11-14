// ===============================
// 📄 pdf-extractor.js
// Extrai blocos de texto estruturados de um PDF
// Dependência: pdfjsLib já carregado no HTML
// ===============================
(function () {
  console.log("🔵 Liora PDF Extractor carregado...");

  if (!window.pdfjsLib) {
    console.warn("⚠️ pdfjsLib não encontrado. Certifique-se de incluir o PDF.js antes deste arquivo.");
  }

  /**
   * Lê um arquivo File (input type="file") e devolve um ArrayBuffer
   * @param {File} file
   * @returns {Promise<ArrayBuffer>}
   */
  function lerArquivoComoArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extrai blocos de texto de um PDF com info de posição e tamanho da fonte.
   * Retorno: [{ page, y, fontSize, text }]
   * @param {File} file - arquivo PDF vindo do input
   * @returns {Promise<Array<{page:number,y:number,fontSize:number,text:string}>>}
   */
  async function extrairBlocosDoPDF(file) {
    if (!window.pdfjsLib) {
      throw new Error("pdfjsLib não está disponível no contexto global.");
    }

    const data = await lerArquivoComoArrayBuffer(file);
    const loadingTask = window.pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    const blocos = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      content.items.forEach(item => {
        const str = (item.str || "").trim();
        if (!str) return;

        const transform = item.transform || [];
        const fontSize = Math.abs(transform[0] || transform[3] || 12);
        const y = transform[5] || 0;

        blocos.push({
          page: pageNum,
          y,
          fontSize,
          text: str
        });
      });
    }

    // Ordena por página e posição vertical (de cima pra baixo)
    blocos.sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      return b.y - a.y;
    });

    console.log("📄 Blocos extraídos do PDF:", blocos);
    return blocos;
  }

  // Expor no escopo global
  window.LioraPDF = window.LioraPDF || {};
  window.LioraPDF.extrairBlocosDoPDF = extrairBlocosDoPDF;
})();
