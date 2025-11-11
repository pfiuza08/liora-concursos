// ============================================================================
// semantic.js v33 (ES Module + anti-cache + upload fixado)
// ============================================================================

console.log("🧩 semantic.js (v33) carregado");

export async function processarArquivoUpload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      window.__liora_upload_text = e.target.result;
      resolve(window.__liora_upload_text);
    };

    reader.onerror = reject;

    if (file.type.includes("pdf")) {
      pdfjsLib.getDocument({ data: file }).promise.then(async (pdf) => {
        let txt = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          txt += content.items.map((s) => s.str).join(" ") + "\n";
        }
        window.__liora_upload_text = txt;
        resolve(txt);
      });
    } else {
      reader.readAsText(file);
    }
  });
}

export async function gerarPlanoViaUploadAI(nivel) {
  if (!window.__liora_upload_text) throw new Error("Nenhum arquivo processado.");

  const prompt = `
Analise o conteúdo abaixo e devolva SESSÕES de aprendizado.
FORMATO JSON EXATO:

[
  {"nome": "Conceitos básicos"},
  {"nome": "Aplicações"}
]

"${window.__liora_upload_text.substring(0, 15000)}"
`;

  const res = await fetch("/api/liora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: "Você é Liora.", user: prompt }),
  });

  const data = await res.json();
  let sessoes = [];

  try {
    sessoes = JSON.parse(data.output);
  } catch (e) {
    console.warn("[LIORA-UPLOAD] JSON inválido vindo da IA, fallback aplicado");
    sessoes = [{ nome: "Sessão 1" }];
  }

  return sessoes.map((s, i) => ({
    numero: i + 1,
    nome: s.nome || `Sessão ${i + 1}`
  }));
}

console.log("✅ semantic.js pronto (v33)");
