// ==========================================================
// 🧠 Liora — Módulo de Processamento Semântico (semantic.js)
// ==========================================================
console.log("🧩 semantic.js carregado com sucesso");

// ----------------------------------------------------------
// 🔎 Utilitários
// ----------------------------------------------------------
function normalizarTexto(txt) {
  return (txt || "")
    .replace(/\u00AD/g, "")           // soft hyphen
    .replace(/[“”‘’]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// ----------------------------------------------------------
// 🔍 Análise semântica básica (já existente, levemente otimizada)
// ----------------------------------------------------------
function analisarSemantica(texto) {
  const t = normalizarTexto(texto);
  if (!t || t.length < 20) {
    return { titulo: "Conteúdo breve", resumo: t, conceitos: [], densidade: "📗 leve" };
  }

  const palavras = t.split(/\s+/).filter(w => w.length > 2);
  const freq = Object.create(null);
  for (const w of palavras) {
    const key = w.toLowerCase().replace(/[.,;:!?()]/g, "");
    if (!/^(para|com|como|onde|quando|pois|ser|mais|menos|muito|porque|que|tem|nos|nas|dos|das|uma|numa|num|pela|pelas|seja|cada|outro|essa|esse|este|esta)$/.test(key)) {
      freq[key] = (freq[key] || 0) + 1;
    }
  }

  const conceitos = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10).map(e=>e[0]);

  const frases = t.split(/(?<=[.!?])\s+/).filter(s => s.length > 40);
  const resumo = frases.slice(0,2).join(" ") + (frases.length > 2 ? " ..." : "");

  const titulo = conceitos[0] ? (conceitos[0][0].toUpperCase() + conceitos[0].slice(1)) : "Conteúdo analisado";

  let densidade = "📗 leve";
  const mediaPalavras = palavras.length / (frases.length || 1);
  if (mediaPalavras > 18 && conceitos.length > 7) densidade = "📙 densa";
  else if (mediaPalavras > 12) densidade = "📘 média";

  return { titulo, resumo, conceitos, densidade };
}

// ----------------------------------------------------------
// 🧩 Processamento de arquivo (TXT / PDF)
// ----------------------------------------------------------
async function processarArquivoUpload(file) {
  if (!file) throw new Error("Nenhum arquivo recebido.");

  const nome = (file.name || "").toLowerCase();
  const mime = file.type || "";
  const isTXT = mime === "text/plain" || /\.txt$/.test(nome);
  const isPDF = mime === "application/pdf" || /\.pdf$/.test(nome);

  try {
    if (isTXT) {
      const texto = await file.text();
      return montarResposta(normalizarTexto(texto));
    }

    if (isPDF) {
      // Usa ArrayBuffer para evitar problemas de CORS com blob URL
      const data = await file.arrayBuffer();

      if (!window.pdfjsLib || !pdfjsLib.getDocument) {
        throw new Error("PDF.js não está disponível. Verifique a inclusão do script e o workerSrc.");
      }

      // Carrega o documento
      const loadingTask = pdfjsLib.getDocument({
        data,
        // Opcional: ajuste cMap se necessário para PDFs complexos
        // cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/cmaps/",
        // cMapPacked: true,
      });

      const pdf = await loadingTask.promise;

      let textoExtraido = "";
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
          // continua nas demais páginas
        }
      }

      const limpo = normalizarTexto(textoExtraido);
      if (!limpo || limpo.length < 40) {
        throw new Error("Não foi possível extrair texto do PDF (pode estar escaneado/sem texto).");
      }

      return montarResposta(limpo);
    }

    // MIME genérico sem extensão reconhecida
    throw new Error("Formato não suportado. Envie .pdf ou .txt");

  } catch (err) {
    console.error("processarArquivoUpload erro:", err);
    return {
      tipoMsg: `❌ Falha ao ler o arquivo: ${err.message}`,
      topicos: []
    };
  }
}

// ----------------------------------------------------------
// 🌐 Exportação para o escopo global (CORRIGIDO - sem recursão)
// ----------------------------------------------------------

// 🔧 renomeia as funções internas antes de exportar
const _processarUploadInterno = processarArquivoUpload;   // <-- agora usa função interna REAL
const _gerarPlanoUploadInterno = gerarPlanoPorUpload;

// ✅ expõe corretamente para o core.js
window.processarArquivoUpload = async (file) => {
  const resultado = await _processarUploadInterno(file);
  window.__ultimoUpload = resultado;   // guarda para uso posterior
  return resultado;
};

window.gerarPlanoPorUpload = async (sessoes) => {
  return await _gerarPlanoUploadInterno(sessoes);
};

console.log("✅ semantic.js pronto e integrado ao escopo global");

// ----------------------------------------------------------
// 🔧 Montagem de tópicos a partir do texto cru
// ----------------------------------------------------------
function montarResposta(textoCru) {
  // Tenta por parágrafos primeiro
  let blocos = textoCru
    .split(/\n{2,}/)
    .map(b => normalizarTexto(b))
    .filter(b => b.length > 60);

  // Se ainda ficou pouco, faz chunking por palavras (~220 palavras)
  if (blocos.length < 4) {
    const palavras = textoCru.split(/\s+/);
    const chunkSize = 220;
    const chunks = [];
    for (let i = 0; i < palavras.length; i += chunkSize) {
      chunks.push(palavras.slice(i, i + chunkSize).join(" "));
    }
    blocos = chunks.map(normalizarTexto).filter(b => b.length > 60);
  }

  const topicos = blocos.map(analisarSemantica);

  const msg = topicos.length
    ? `✅ Arquivo lido (${topicos.length} tópicos detectados)`
    : "⚠️ Arquivo lido, mas poucos tópicos detectados";

  return { tipoMsg: msg, topicos };
}

// ----------------------------------------------------------
// 🌐 Exportação para o escopo global
// ----------------------------------------------------------
window.analisarSemantica = analisarSemantica;
window.processarArquivoUpload = async (file) => {
  const resultado = await processarArquivoUpload(file);
  window.__ultimoUpload = resultado; // guarda para gerarPlanoPorUpload
  return resultado;
};
window.gerarPlanoPorUpload = gerarPlanoPorUpload;

console.log("✅ semantic.js pronto e integrado ao escopo global");
