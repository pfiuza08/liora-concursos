// 🧩 semantic.js v38 — TXT/PDF + planos por TEMA/UPLOAD
console.log("🧩 semantic.js v38 carregado");

// Lê TXT/PDF e guarda o texto em window.__liora_upload_text
window.processarArquivoUpload = function (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        if (!file.type.includes("pdf")) {
          window.__liora_upload_text = e.target.result || "";
          return resolve();
        }

        // PDF → ArrayBuffer → texto
        const pdfData = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

        let texto = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          texto += content.items.map(t => t.str).join(" ") + "\n";
        }
        window.__liora_upload_text = texto;
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    // importante: sempre usar ArrayBuffer (mesmo p/ TXT funciona)
    reader.readAsArrayBuffer(file);
  });
};

// 🔹 Plano a partir de TEMA (sem upload)
window.generatePlanFromTemaAI = async function (tema, nivel) {
  const prompt = `
Você é Liora, especialista em microlearning.
Crie um PLANO DE ESTUDO para o tema "${tema}" no nível ${nivel}.
Retorne JSON PURO neste formato exato:
{
  "tema": "${tema}",
  "sessoes": [
    {"numero":1,"nome":"..."},
    {"numero":2,"nome":"..."}
  ]
}
Quantidade de sessões: você decide (entre 4 e 10), de forma lógica e progressiva.
Não repita prefixos como "Sessão X —" no campo "nome".
`;
  const res = await fetch("/api/liora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: "Você é Liora.", user: prompt })
  });
  const json = await res.json();
  let out = {};
  try { out = JSON.parse(json.output); } catch { throw new Error("Plano (tema) em formato inválido"); }
  out.sessoes = sanitizeSessions(out.sessoes || []);
  return out;
};

// 🔹 Plano a partir de UPLOAD (usa texto extraído)
window.generatePlanFromUploadAI = async function (nivel) {
  const texto = (window.__liora_upload_text || "").slice(0, 120000); // limita tamanho
  const prompt = `
Você é Liora, especialista em microlearning.
Analise o CONTEÚDO abaixo e crie um PLANO DE ESTUDO.
Retorne JSON PURO:
{
  "tema":"detectado a partir do conteúdo",
  "sessoes":[{"numero":1,"nome":"..."}, {"numero":2,"nome":"..."}]
}
Quantidade de sessões: 4 a 12, dependendo da densidade do conteúdo.
Não repita prefixos como "Sessão X —" no campo "nome".
CONTEÚDO:
---
${texto}
---`;
  const res = await fetch("/api/liora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: "Você é Liora.", user: prompt })
  });
  const json = await res.json();
  let out = {};
  try { out = JSON.parse(json.output); } catch { throw new Error("Plano (upload) em formato inválido"); }
  out.sessoes = sanitizeSessions(out.sessoes || []);
  return out;
};

// util: renumera, remove duplicações do tipo "Sessão 1 — Sessão 1 — Título"
function sanitizeSessions(arr) {
  return (arr || [])
    .map((s, i) => {
      const nome = String(s.nome || s.titulo || `Sessão ${i + 1}`)
        .replace(/^Sessão\s*\d+\s*[—-]\s*/i, "")
        .replace(/^Sessão\s*\d+\s*[—-]\s*/i, ""); // duas vezes para casos duplicados
      return { numero: s.numero ?? (i + 1), nome: nome.trim() };
    })
    .filter(s => s.nome);
}

console.log("✅ semantic.js pronto (v38)");
