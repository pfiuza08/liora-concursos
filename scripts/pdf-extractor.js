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
