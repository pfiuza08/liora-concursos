console.log("🧩 semantic.js v37 carregado");

window.processarArquivoUpload = function (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (!file.type.includes("pdf")) {
        window.__liora_upload_text = e.target.result;
        return resolve();
      }

      const pdfData = new Uint8Array(e.target.result);
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

      let texto = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        texto += content.items.map((t) => t.str).join(" ") + "\n";
      }

      window.__liora_upload_text = texto;
      resolve();
    };

    reader.readAsArrayBuffer(file);
  });
};


window.generatePlanFromUploadAI = async function (nivel) {
  const prompt = `
Analise o conteúdo e divida em sessões didáticas. Retorne JSON puro.

CONTEÚDO:
${window.__liora_upload_text}

Formato:
{
 "tema":"detectado",
 "sessoes":[ {"numero":1,"nome":"..."}, ... ]
}`;

  const res = await fetch("/api/liora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: "Você é Liora.", user: prompt }),
  });

  return JSON.parse((await res.json()).output);
};
