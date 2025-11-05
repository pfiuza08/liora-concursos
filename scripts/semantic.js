// ==========================================================
// 🧠 Liora — Módulo de Processamento Semântico (semantic.js)
// ==========================================================
console.log("🧩 semantic.js carregado com sucesso");

// ----------------------------------------------------------
// 🔎 Utilitário
// ----------------------------------------------------------
function normalizarTexto(txt) {
  return (txt || "")
    .replace(/\u00AD/g, "")  // remove soft hyphen
    .replace(/[“”‘’]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// ----------------------------------------------------------
// 🔍 Análise semântica básica
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
  const titulo = conceitos[0] ? conceitos[0][0].toUpperCase() + conceitos[0].slice(1) : "Conteúdo analisado";

  let densidade = "📗 leve";
  const mediaPalavras = palavras.length / (frases.length || 1);
  if (mediaPalavras > 18 && conceitos.length > 7) densidade = "📙 densa";
  else if (mediaPalavras > 12) densidade = "📘 média";

  return { titulo, resumo, conceitos, densidade };
}

// ----------------------------------------------------------
// 🧩 Processamento de arquivo (TXT / PDF)
// ----------------------------------------------------------
async function _processarUploadInterno(file) {
  if (!file) throw new Error("Nenhum arquivo recebido.");

  const nome = (file.name || "").toLowerCase();
  const mime = file.type || "";
  const isTXT = mime === "text/plain" || /\.txt$/.test(nome);
  const isPDF = mime === "application/pdf" || /\.pdf$/.test(nome);

  try {
    if (isTXT) {
      const texto = await file.text();
      return _montarResposta(normalizarTexto(texto));
    }

    if (isPDF) {
      const data = await file.arrayBuffer();

      if (!window.pdfjsLib || !pdfjsLib.getDocument) {
        throw new Error("PDF.js não está disponível. Verifique o script e o workerSrc.");
      }

      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;

      let textoExtraido = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          textoExtraido += content.items.map(it => it.str).join(" ") + "\n";
        } catch (errPage) {
          console.warn(`⚠️ Falha ao ler página ${i}`, errPage);
        }
      }

      const limpo = normalizarTexto(textoExtraido);
      if (!limpo || limpo.length < 40) {
        throw new Error("Não foi possível extrair texto do PDF (pode estar escaneado/sem OCR)");
      }

      return _montarResposta(limpo);
    }

    throw new Error("Formato não suportado. Envie .pdf ou .txt");

  } catch (err) {
    console.error("processarArquivoUpload erro:", err);
    return { tipoMsg: `❌ Falha ao ler o arquivo: ${err.message}`, topicos: [] };
  }
}

// ----------------------------------------------------------
// 🧠 Geração do plano a partir do último upload processado
// ----------------------------------------------------------
async function _gerarPlanoUploadInterno(sessoes = 7) {
  const dados = window.__ultimoUpload;
  if (!dados || !Array.isArray(dados.topicos) || dados.topicos.length === 0) {
    throw new Error("processarArquivoUpload deve ser chamado antes.");
  }

  return dados.topicos.slice(0, sessoes).map((b, i) => ({
    titulo: `Sessão ${i + 1} — ${b.titulo}`,
    resumo: b.resumo,
    conteudo: `• ${b.conceitos.join("\n• ")}\n\nDensidade: ${b.densidade}`
  }));
}

// ----------------------------------------------------------
// 🔧 Montagem de tópicos a partir do texto cru
// ----------------------------------------------------------
function _montarResposta(textoCru) {
  let blocos = textoCru
    .split(/\n{2,}/)
    .map(b => normalizarTexto(b))
    .filter(b => b.length > 60);

  if (blocos.length < 4) {
    const palavras = textoCru.split(/\s+/);
    const chunkSize = 220;
    blocos = [];
    for (let i = 0; i < palavras.length; i += chunkSize) {
      blocos.push(palavras.slice(i, i + chunkSize).join(" "));
    }
  }

  return {
    tipoMsg: `✅ Arquivo lido (${blocos.length} tópicos detectados)`,
    topicos: blocos.map(analisarSemantica),
  };
}

// ----------------------------------------------------------
// ✅ Exportação global (agora sem erro e sem recursão)
// ----------------------------------------------------------
window.processarArquivoUpload = async (file) => {
  const resultado = await _processarUploadInterno(file);
  window.__ultimoUpload = resultado;
  return resultado;
};

window.gerarPlanoPorUpload = async (sessoes) => {
  return await _gerarPlanoUploadInterno(sessoes);
};

console.log("✅ semantic.js pronto e integrado ao escopo global");
