// ==========================================================
// 📄 LIORA — PDF Extractor v74-C3
// - Extrai blocos textuais do PDF
// - Fornece window.lioraPDFExtractor.extract()
// - Totalmente compatível com o core v74-C3
// ==========================================================

(function () {
  console.log("🔵 Liora PDF Extractor v74-C3 carregado...");

  async function extract(file) {
    if (!file) throw new Error("Nenhum arquivo recebido.");

    const typedArray = new Uint8Array(await file.arrayBuffer());

    const pdf = await pdfjsLib.getDocument({
      data: typedArray,
      useWorkerFetch: false,
      isEvalSupported: false,
    }).promise;

    const blocos = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      content.items.forEach((item) => {
        blocos.push({
          text: item.str || "",
          x: item.transform?.[4] || 0,
          y: item.transform?.[5] || 0,
          page: pageNum,
          fontSize: item.height || 0,
        });
      });
    }

    console.log(`📄 PDF Extractor → ${blocos.length} blocos extraídos.`);
    return blocos;
  }

  // 🔥 API global esperada pelo core.js
  window.lioraPDFExtractor = { extract };
})();
