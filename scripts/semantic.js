// ==========================================================
// 🧠 Liora — Módulo de Processamento Semântico (semantic.js)
// ==========================================================
// Responsável por ler arquivos PDF/TXT, extrair tópicos,
// e montar um plano de estudo baseado no conteúdo enviado.
// ==========================================================

console.log("🧩 semantic.js carregado com sucesso");

// ==========================================================
// 🔍 Funções de análise semântica (já existentes)
// ==========================================================
function analisarSemantica(texto) {
  if (!texto || texto.trim().length < 20) {
    return {
      titulo: "Conteúdo breve",
      resumo: texto.trim(),
      conceitos: [],
      densidade: "📗 leve"
    };
  }

  const textoLimpo = texto
    .replace(/\s+/g, " ")
    .replace(/[“”‘’"']/g, "")
    .trim();

  const palavras = textoLimpo.split(/\s+/).filter(w => w.length > 2);
  const freq = {};

  for (const w of palavras) {
    const key = w.toLowerCase().replace(/[.,;:!?()]/g, "");
    if (!key.match(/^(para|com|como|onde|quando|pois|ser|mais|menos|muito|porque|que|tem|nos|nas|dos)$/)) {
      freq[key] = (freq[key] || 0) + 1;
    }
  }

  const conceitos = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(e => e[0]);

  const frases = textoLimpo.split(/(?<=[.!?])\s+/).filter(s => s.length > 40);
  const resumo = frases.slice(0, 2).join(" ") + (frases.length > 2 ? " ..." : "");

  const titulo = conceitos.length > 0
    ? conceitos[0].charAt(0).toUpperCase() + conceitos[0].slice(1)
    : "Conteúdo analisado";

  let densidade = "📗 leve";
  const mediaPalavras = palavras.length / (frases.length || 1);
  if (mediaPalavras > 18 && conceitos.length > 7) densidade = "📙 densa";
  else if (mediaPalavras > 12) densidade = "📘 média";

  return { titulo, resumo, conceitos, densidade };
}


// ==========================================================
// 🧩 Leitura / processamento do arquivo (PDF / TXT)
// ==========================================================
async function processarArquivoUpload(file) {
  const tipo = file.type;

  let textoExtraido = "";

  if (tipo === "text/plain") {
    textoExtraido = await file.text();
  }

  else if (tipo === "application/pdf") {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      textoExtraido += content.items.map(item => item.str).join(" ") + "\n";
    }
  }

  else {
    throw new Error("Formato não suportado.");
  }

  // Quebra o texto em blocos (~200 palavras por tópico)
  const blocos = textoExtraido
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(b => b.length > 50);

  const topicos = blocos.map(analisarSemantica);

  return {
    tipoMsg: `✅ Arquivo lido (${topicos.length} tópicos detectados)`,
    topicos
  };
}


// ==========================================================
// 🧠 Gera plano de estudo baseado no conteúdo do arquivo
// ==========================================================
async function gerarPlanoPorUpload(sessoes = 7) {

  if (!window.__ultimoUpload) {
    throw new Error("processarArquivoUpload deve ser chamado antes.");
  }

  const blocos = window.__ultimoUpload.topicos.slice(0, sessoes);

  return blocos.map((b, i) => ({
    titulo: `Sessão ${i + 1} — ${b.titulo}`,
    resumo: b.resumo,
    conteudo: `• ${b.conceitos.join("\n• ")}\n\nDensidade: ${b.densidade}`
  }));
}


// ==========================================================
// 🌐 Exporta funções para o CORE (agora expõe tudo que ele espera)
// ==========================================================
window.processarArquivoUpload = async (file) => {
  const resultado = await processarArquivoUpload(file);
  window.__ultimoUpload = resultado;  // guarda internamente
  return resultado;
};

window.gerarPlanoPorUpload = gerarPlanoPorUpload;

console.log("✅ semantic.js pronto e integrado ao escopo global");
