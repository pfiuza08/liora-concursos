// ============================================================================
// semantic.js v32
// Processamento de arquivo + geração de plano orientado por conteúdo
// ============================================================================

console.log("🧩 semantic.js carregado");

window.processarArquivoUpload = async function (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const content = e.target.result;
      window.__liora_upload_text = content; // cache global
      resolve(content);
    };

    reader.onerror = reject;

    if (file.type.includes("pdf")) {
      pdfjsLib
        .getDocument({ data: file })
        .promise.then(async (pdf) => {
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((s) => s.str).join(" ") + "\n";
          }
          window.__liora_upload_text = text;
          resolve(text);
        })
        .catch(reject);
    } else {
      reader.readAsText(file);
    }
  });
};

window.generatePlanFromUploadAI = async function (nivel) {
  if (!window.__liora_upload_text) {
    throw new Error("Nenhum arquivo carregado.");
  }

  const prompt = `
Você é especialista em microlearning.
Analise o conteúdo abaixo e QUEBRE em sessões lógicas de estudo.
Cada sessão deve ter um nome curto, forte e objetivo.

Retorno obrigatório: JSON puro

[
  {"nome": "Fundamentos"},
  {"nome": "Aplicações"},
  {"nome": "Exemplos Práticos"}
]

Conteúdo:
"""
${window.__liora_upload_text}
"""`;

  const res = await fetch("/api/liora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: "Você é Liora.", user: prompt }),
  });

  const json = await res.json();
  let sessoes = [];

  try {
    sessoes = JSON.parse(json.output);
  } catch {
    sessoes = [];
  }

  // ✅ normalização: SEM número vindo do LLM
  return {
    sessoes: sessoes.map((s, i) => ({
      numero: i + 1,
      nome: s.nome || s.titulo || `Sessão ${i + 1}`
    }))
  };
};

console.log("✅ semantic.js pronto (v32)");
