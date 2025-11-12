// ==========================================================
// 🧩 semantic.js v39 — Upload + Geração de plano (tema ou arquivo)
// ==========================================================
console.log("🧩 semantic.js (v39) carregado");

// ==========================================================
// 📄 Leitura de arquivos (PDF ou TXT)
// ==========================================================
window.processarArquivoUpload = function (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        if (!file.type.includes("pdf")) {
          window.__liora_upload_text = e.target.result || "";
          console.log("📘 Arquivo TXT lido com sucesso.");
          return resolve();
        }

        // Para PDF → extrair texto
        const pdfData = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        let texto = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          texto += content.items.map((t) => t.str).join(" ") + "\n";
        }

        window.__liora_upload_text = texto;
        console.log(`📘 PDF lido com ${pdf.numPages} páginas.`);
        resolve();
      } catch (err) {
        console.error("❌ Erro ao processar arquivo:", err);
        reject(err);
      }
    };

    // 🔧 leitura binária universal
    reader.readAsArrayBuffer(file);
  });
};

// ==========================================================
// 📚 Criação de plano via Tema (sem upload)
// ==========================================================
window.generatePlanFromTemaAI = async function (tema, nivel) {
  const prompt = `
Você é Liora, especialista em microlearning.
Crie um PLANO DE ESTUDO completo e progressivo para o tema **"${tema}"**, no nível **${nivel}**.

Formato obrigatório (JSON puro):
{
  "tema": "${tema}",
  "sessoes": [
    {"numero":1,"nome":"Introdução ao tema"},
    {"numero":2,"nome":"Fundamentos e conceitos-chave"},
    {"numero":3,"nome":"Aplicações práticas"},
    {"numero":4,"nome":"Revisão e avaliação"}
  ]
}

Regras:
- Gere entre **4 e 10 sessões**, com nomes curtos, claros e sequenciais.
- Não repita prefixos como “Sessão 1 — ...”.
- As sessões devem evoluir logicamente (do básico ao avançado).
- Retorne apenas JSON puro, sem texto adicional.
`;

  console.log("📗 Solicitando plano por tema à IA...");
  const res = await fetch("/api/liora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: "Você é Liora.", user: prompt }),
  });

  const json = await res.json();
  let out = {};
  try {
    out = JSON.parse(json.output);
    out.sessoes = sanitizeSessions(out.sessoes || []);
  } catch (err) {
    console.error("❌ Erro ao interpretar plano (tema):", err);
    throw new Error("Plano em formato inválido (tema)");
  }
  console.log(`✅ Plano (tema) criado com ${out.sessoes.length} sessões.`);
  return out;
};

// ==========================================================
// 📚 Criação de plano via Upload (usando texto do PDF/TXT)
// ==========================================================
window.generatePlanFromUploadAI = async function (nivel) {
  const texto = (window.__liora_upload_text || "").slice(0, 140000);

  if (!texto || texto.length < 500) {
    throw new Error("Texto insuficiente para gerar plano.");
  }

  const prompt = `
Você é Liora, especialista em microlearning.
Analise o conteúdo a seguir e crie um PLANO DE ESTUDO estruturado.
Nível do aluno: ${nivel}

Conteúdo do material:
---
${texto}
---

Formato obrigatório (JSON puro):
{
  "tema": "Tema detectado no texto",
  "sessoes": [
    {"numero":1,"nome":"..."},
    {"numero":2,"nome":"..."}
  ]
}

Regras:
- Gere entre **4 e 12 sessões**, com títulos curtos e coerentes.
- Evite repetir nomes ou prefixos “Sessão X —”.
- Agrupe o conteúdo de forma lógica e progressiva.
- Retorne apenas JSON puro.
`;

  console.log("📗 Solicitando plano via upload à IA...");
  const res = await fetch("/api/liora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: "Você é Liora.", user: prompt }),
  });

  const json = await res.json();
  let out = {};
  try {
    out = JSON.parse(json.output);
    out.sessoes = sanitizeSessions(out.sessoes || []);
  } catch (err) {
    console.error("❌ Erro ao interpretar plano (upload):", err);
    throw new Error("Plano em formato inválido (upload)");
  }

  console.log(`✅ Plano (upload) criado com ${out.sessoes.length} sessões.`);
  return out;
};

// ==========================================================
// 🧹 Sanitização de sessões duplicadas e formatação
// ==========================================================
function sanitizeSessions(arr) {
  return (arr || [])
    .map((s, i) => {
      const nome = String(s.nome || s.titulo || `Sessão ${i + 1}`)
        .replace(/^Sessão\s*\d+\s*[—-]\s*/i, "")
        .replace(/^Sessão\s*\d+\s*[—-]\s*/i, "")
        .trim();
      return { numero: s.numero ?? i + 1, nome };
    })
    .filter((s) => s.nome && s.nome.length > 1);
}

console.log("✅ semantic.js pronto (v39)");
