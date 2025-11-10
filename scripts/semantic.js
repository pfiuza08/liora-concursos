// ==========================================================
// 🧠 Liora — semantic.js (v3 FINAL)
// Upload: extrai texto (PDF/TXT) → detecta tópicos → converte
// em plano no formato esperado pelo core.js
// ==========================================================
console.log("🧩 semantic.js carregado");

(function () {

  // ----------------------------------------------------------
  // 🔧 utilitário para limpar texto
  // ----------------------------------------------------------
  function normalizarTexto(txt) {
    return (txt || "")
      .replace(/\u00AD/g, "")              // soft hyphen
      .replace(/[“”‘’]/g, '"')             // aspas especiais
      .replace(/\s+/g, " ")
      .trim();
  }

  // ----------------------------------------------------------
  // 📄 extrair texto (PDF ou TXT)
  // ----------------------------------------------------------
  async function extrairTextoDeArquivo(file) {
    const nome = (file.name || "").toLowerCase();
    const mime = file.type || "";
    const isTXT = mime === "text/plain" || /\.txt$/.test(nome);
    const isPDF = mime === "application/pdf" || /\.pdf$/.test(nome);

    if (isTXT) {
      const texto = await file.text();
      return normalizarTexto(texto);
    }

    if (isPDF) {
      if (!window.pdfjsLib || !pdfjsLib.getDocument) {
        throw new Error("PDF.js não está disponível.");
      }

      const data = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;

      let texto = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const linhas = content.items
            .map(it => typeof it.str === "string" ? it.str : "")
            .filter(Boolean);

          texto += linhas.join(" ") + "\n";
        } catch (e) {
          console.warn(`⚠️ erro lendo página ${i}:`, e);
        }
      }
      return normalizarTexto(texto);
    }

    throw new Error("Formato não suportado. Envie .pdf ou .txt");
  }

  // ----------------------------------------------------------
  // 🔍 tópicos para preview antes de gerar plano
  // ----------------------------------------------------------
  function detectarTopicosParaPreview(texto) {
    let blocos = texto.split(/\n{2,}/).map(normalizarTexto).filter(b => b.length > 80);

    if (blocos.length < 6) {
      // fragmenta em ~220 palavras quando não há muitos blocos
      const palavras = texto.split(/\s+/);
      const chunkSize = 220;
      const chunks = [];

      for (let i = 0; i < palavras.length; i += chunkSize) {
        chunks.push(palavras.slice(i, i + chunkSize).join(" "));
      }

      blocos = chunks.map(normalizarTexto).filter(b => b.length > 80);
    }

    const stop = /^(de|da|do|das|dos|em|no|na|para|por|com|como|que|uma|um|e|ou|se|os|as|a|o|é|ser|há|quando|onde|entre|mais|menos)$/i;

    return blocos.slice(0, 30).map((b, i) => {
      const freq = {};
      b.split(/\s+/).forEach(w => {
        const k = w.toLowerCase().replace(/[.,;:!?()]/g, "");
        if (k.length > 3 && !stop.test(k)) {
          freq[k] = (freq[k] || 0) + 1;
        }
      });

      const termoForte = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] || `Bloco ${i+1}`;

      return {
        titulo: termoForte[0]?.toUpperCase() + termoForte.slice(1),
        resumo: b.slice(0,140) + (b.length>140?"…":""),
        conceitos: Object.keys(freq).slice(0,5)
      };
    });
  }

  // ----------------------------------------------------------
  // 🤖 IA → converte conteúdo em módulos e sessões
  // ----------------------------------------------------------
  async function gerarModulosESessoesPelaIA(texto, nivel = "iniciante") {

    // ❗ não usa OPENAI direto → o core.js usa /api/liora
    const prompt = `
Você é especialista em microlearning (Barbara Oakley).
Transforme o conteúdo abaixo em MÓDULOS ➝ SESSÕES.

Formato JSON exato:
{
  "modulos":[
    {
      "titulo":"Módulo X — Nome",
      "sessoes":[
        { "titulo":"Sessão Y — Nome", "resumo":"...", "detalhamento":"..." }
      ]
    }
  ]
}

CONTEÚDO:
"""${texto.slice(0, 120000)}"""
`.trim();

    const res = await window.LIORA.ask({
      system: "Você é a Liora, especialista em microlearning.",
      user: prompt
    });

    let parsed;
    try {
      parsed = JSON.parse(
        res.replace(/```json/gi, "").replace(/```/g, "").trim()
      );
    } catch (e) {
      console.warn("⚠️ IA retornou JSON inválido, fallback ativado");
      return fallbackModulos(texto);
    }

    return parsed;
  }

  // ----------------------------------------------------------
  // 🛟 fallback sem IA (estrutural)
  // ----------------------------------------------------------
  function fallbackModulos() {
    return {
      modulos: [
        { titulo: "Módulo 1 — Fundamentos", sessoes: [{ titulo: "Sessão 1 — Fundamentos" }] },
        { titulo: "Módulo 2 — Aplicações", sessoes: [{ titulo: "Sessão 2 — Aplicações" }] }
      ]
    };
  }

  // ----------------------------------------------------------
  // ✅ API usada pelo core.js
  // ----------------------------------------------------------
  window.processarArquivoUpload = async (file) => {
    try {
      const texto = await extrairTextoDeArquivo(file);
      const topicos = detectarTopicosParaPreview(texto);

      window.__uploadTextoBruto = texto;
      return {
        tipoMsg: `✅ Arquivo lido (${topicos.length} tópicos detectados)`,
        topicos
      };
    } catch (err) {
      console.error("processarArquivoUpload erro:", err);
      return { tipoMsg: `❌ Falha ao ler: ${err.message}`, topicos: [] };
    }
  };

  // ✅ *** ALTERAÇÃO IMPORTANTE ***
  // retorna o plano no formato esperado pelo core.js
  window.generatePlanFromUploadAI = async (nivel = "iniciante") => {
    const texto = window.__uploadTextoBruto;
    if (!texto) throw new Error("processarArquivoUpload deve ser executado antes.");

    const result = await gerarModulosESessoesPelaIA(texto, nivel);

    const sessoes = [];
    result.modulos?.forEach((m) => {
      m.sessoes?.forEach((s) => {
        sessoes.push({
          numero: sessoes.length + 1,
          nome: s.titulo || `Sessão ${sessoes.length + 1}`
        });
      });
    });

    return {
      plano: sessoes,   // ✅ agora o core entende
      sessoes          // apenas debugging
    };
  };

  console.log("✅ semantic.js pronto (v3)");

})();
