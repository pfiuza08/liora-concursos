// ==========================================================
// 🧠 Liora — Módulo de Processamento Semântico (v13)
// Extração de tópicos + montagem automática do plano por upload
// ==========================================================

console.log("🧩 semantic.js carregado com sucesso");

// ----------------------------------------------------------
// 🔎 Utilitários
// ----------------------------------------------------------
function normalizarTexto(txt) {
  return (txt || "")
    .replace(/\u00AD/g, "")          // remove soft hyphen
    .replace(/[“”‘’]/g, '"')         // padroniza aspas
    .replace(/\s+/g, " ")            // remove múltiplos espaços
    .trim();
}

// ----------------------------------------------------------
// 🔍 Análise semântica: extrai título, resumo, conceitos e densidade
// ----------------------------------------------------------
function analisarSemantica(texto) {
  const t = normalizarTexto(texto);
  if (!t || t.length < 40) {
    return { titulo: "Conteúdo breve", resumo: t, conceitos: [], densidade: "📗 leve" };
  }

  const palavras = t.split(/\s+/).filter(w => w.length > 3);
  const freq = {};

  for (const w of palavras) {
    const key = w.toLowerCase().replace(/[.,;:!?()]/g, "");
    if (!/^(para|como|onde|quando|pois|este|esta|isso|são|estão|mais|menos|cada|porque|todo|toda|tem|que|nos|nas|dos|das|uma|numa|num|pela|pelas|seja|outro|essa|esse|há)$/.test(key)) {
      freq[key] = (freq[key] || 0) + 1;
    }
  }

  const conceitos = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(e => e[0]);

  const frases = t.split(/(?<=[.!?])\s+/).filter(s => s.length > 40);
  const resumo = frases.slice(0, 2).join(" ") + (frases.length > 2 ? " ..." : "");

  const titulo = conceitos.length
    ? conceitos[0].charAt(0).toUpperCase() + conceitos[0].slice(1)
    : "Conteúdo analisado";

  const mediaPalavras = palavras.length / (frases.length || 1);
  let densidade = "📗 leve";
  if (mediaPalavras > 18 && conceitos.length > 7) densidade = "📙 densa";
  else if (mediaPalavras > 12) densidade = "📘 média";

  return { titulo, resumo, conceitos, densidade };
}

// ----------------------------------------------------------
// 📄 Processa arquivo (TXT ou PDF)
// ----------------------------------------------------------
async function processarArquivoUpload(file) {
  if (!file) throw new Error("Nenhum arquivo recebido.");

  const nome = (file.name || "").toLowerCase();
  const mime = file.type || "";
  const isTXT = mime === "text/plain" || /\.txt$/.test(nome);
  const isPDF = mime === "application/pdf" || /\.pdf$/.test(nome);

  try {
    let textoExtraido = "";

    if (isTXT) {
      textoExtraido = await file.text();
    }

    if (isPDF) {
      if (!window.pdfjsLib || !pdfjsLib.getDocument) {
        throw new Error("PDF.js não está disponível. Verifique a inclusão do script.");
      }

      const data = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const linhas = content.items
            .map(it => (typeof it.str === "string" ? it.str : ""))
            .filter(Boolean);
          textoExtraido += linhas.join(" ") + "\n";
        } catch (pgErr) {
          console.warn(`⚠️ Falha ao ler página ${i}:`, pgErr);
        }
      }
    }

    const limpo = normalizarTexto(textoExtraido);
    if (!limpo || limpo.length < 40) {
      throw new Error("Não foi possível extrair texto do PDF (pode estar escaneado/sem texto).");
    }

    return montarTopicos(limpo);

  } catch (err) {
    console.error("processarArquivoUpload erro:", err);
    return {
      tipoMsg: `❌ Falha ao ler o arquivo: ${err.message}`,
      topicos: []
    };
  }
}

// ----------------------------------------------------------
// 🧠 Quebra o conteúdo em blocos e analisa semanticamente
// ----------------------------------------------------------
function montarTopicos(textoCru) {
  let blocos = textoCru
    .split(/\n{2,}/)                // tenta dividir por parágrafos
    .map(normalizarTexto)
    .filter(b => b.length > 60);

  if (blocos.length < 3) {
    const palavras = textoCru.split(/\s+/);
    const chunkSize = 220;
    const tmp = [];
    for (let i = 0; i < palavras.length; i += chunkSize) {
      tmp.push(palavras.slice(i, i + chunkSize).join(" "));
    }
    blocos = tmp.map(normalizarTexto).filter(b => b.length > 60);
  }

  const topicos = blocos.map(analisarSemantica);

  return {
    tipoMsg: `✅ Arquivo processado — ${topicos.length} tópicos detectados`,
    topicos
  };
}

// ----------------------------------------------------------
// 🎯 1 tópico = 1 sessão do plano
// ----------------------------------------------------------
async function gerarPlanoPorUpload() {
  const dados = window.__ultimoUpload;

  if (!dados || !Array.isArray(dados.topicos) || dados.topicos.length === 0) {
    throw new Error("processarArquivoUpload deve ser chamado antes.");
  }

  const plano = dados.topicos.map((b, i) => ({
    titulo: `Sessão ${i + 1} — ${b.titulo || "Tópico"}`,
    resumo: b.resumo || "Resumo não disponível.",
    conteudo: (Array.isArray(b.conceitos) && b.conceitos.length)
      ? `• ${b.conceitos.join("\n• ")}\n\nDensidade cognitiva: ${b.densidade || "📗 leve"}`
      : `• Conceitos principais\n• Exemplos práticos\n• Exercícios\n\nDensidade cognitiva: ${b.densidade || "📗 leve"}`
  }));

  return { sessoes: plano.length, plano };
}

// ----------------------------------------------------------
// 🌐 Exportação para o escopo global
// ----------------------------------------------------------
const _processarUploadInterno = processarArquivoUpload;

window.processarArquivoUpload = async (file) => {
  const resultado = await _processarUploadInterno(file);
  window.__ultimoUpload = resultado;       // guarda para uso posterior
  return resultado;
};

window.gerarPlanoPorUpload = async () => gerarPlanoPorUpload();

console.log("✅ semantic.js pronto e integrado ao escopo global");
