// ============================================================
// semantic.js v35 — responsavel por ler TXT/PDF e enviar para IA
// ============================================================

console.log("🧩 semantic.js (v35) carregado");

export async function processarArquivoUpload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const isPDF = file.type.includes("pdf");

      // ✅ TXT direto
      if (!isPDF) {
        window.__liora_upload_text = e.target.result;
        console.log("📄 TXT carregado com sucesso");
        return resolve(window.__liora_upload_text);
      }

      // ✅ PDF — precisa ser convertido para ArrayBuffer
      const pdfData = new Uint8Array(e.target.result);

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

      let textoFinal = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        textoFinal += content.items.map((t) => t.str).join(" ") + "\n";
      }

      window.__liora_upload_text = textoFinal;
      console.log("📄 PDF carregado e convertido em texto");

      resolve(textoFinal);
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file); // ✅ CORREÇÃO PRINCIPAL
  });
}


// ============================================================
// generatePlanFromUploadAI  (IA decide quantidade de sessões)
// ============================================================

export async function generatePlanFromUploadAI(nivel) {

  if (!window.__liora_upload_text) throw new Error("Nenhum arquivo foi carregado");

  const prompt = `
Analise o conteúdo abaixo e produza um plano de estudo em JSON puro.
Quantidade de sessões você decide, conforme a lógica e organização do conteúdo.

CONTEÚDO:
---
${window.__liora_upload_text}
---

Formato EXATO esperado:
{
 "tema": "nome detectado",
 "sessoes": [
   {"numero":1, "nome":"Título da sessão"},
   {"numero":2, "nome":"Outro título"}
 ]
}
`;

  const response = await fetch("/api/liora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: "Você é Liora, especialista em microlearning.",
      user: prompt
    })
  });

  const json = await response.json();

  let result = {};
  try {
    result = JSON.parse(json.output);
  } catch (err) {
    console.error("❌ Erro no JSON retornado pela IA", err, json.output);
    throw new Error("Formato inválido retornado pela IA");
  }

  console.log("✅ Plano gerado via upload:", result);
  return result;
}

console.log("✅ semantic.js pronto (v35)");
