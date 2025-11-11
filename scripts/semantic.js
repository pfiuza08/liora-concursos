// ============================================================
// semantic.js v36 — processa TXT / PDF e gera plano via IA
// ============================================================

console.log("🧩 semantic.js (v36) carregado");

export async function processarArquivoUpload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (!file.type.includes("pdf")) {
        window.__liora_upload_text = e.target.result;
        return resolve(window.__liora_upload_text);
      }

      try {
        const pdfData = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

        let textoFinal = "";
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          textoFinal += content.items.map((t) => t.str).join(" ") + "\n";
        }

        window.__liora_upload_text = textoFinal;
        resolve(textoFinal);

      } catch (err) {
        reject("Erro ao ler PDF");
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export async function generatePlanFromUploadAI(nivel) {
  const prompt = `
Analise o conteúdo abaixo e produza um plano de estudo.
Você decide a quantidade de sessões. Retorne APENAS JSON puro.

CONTEÚDO:
---
${window.__liora_upload_text}
---

Formato:
{
 "tema":"detectado",
 "sessoes":[
   {"numero":1,"nome":"..."},
   {"numero":2,"nome":"..."}
 ]
}`;

  const res = await fetch("/api/liora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: "Você é Liora, especialista em microlearning.",
      user: prompt
    })
  });

  const json = await res.json();
  return JSON.parse(json.output);
}
