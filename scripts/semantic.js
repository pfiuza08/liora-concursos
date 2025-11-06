// ==========================================================
// 🧠 Liora — semantic.js (v2)
// Upload: extrai texto (PDF/TXT) e prepara dados para IA
// ==========================================================
console.log("🧩 semantic.js carregado");

(function () {
  // ----------------------------------------------------------
  // 🔧 Utilitários
  // ----------------------------------------------------------
  function normalizarTexto(txt) {
    return (txt || "")
      .replace(/\u00AD/g, "")           // soft hyphen
      .replace(/[“”‘’]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  // ----------------------------------------------------------
  // 🔍 Extração de texto (TXT / PDF)
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
            .map(it => (typeof it.str === "string" ? it.str : ""))
            .filter(Boolean);
          texto += linhas.join(" ") + "\n";
        } catch (e) {
          console.warn(`⚠️ Falha ao ler página ${i}:`, e);
        }
      }
      return normalizarTexto(texto);
    }

    throw new Error("Formato não suportado. Envie .pdf ou .txt");
  }

  // ----------------------------------------------------------
  // 🧩 Tópicos simples para preview (não é o plano final)
  // ----------------------------------------------------------
  function detectarTopicosParaPreview(texto) {
    // corta por parágrafos/dobras de linha
    let blocos = texto.split(/\n{2,}/).map(normalizarTexto).filter(b => b.length > 80);

    // se pouco, faz chunking por ~220 palavras
    if (blocos.length < 6) {
      const palavras = texto.split(/\s+/);
      const chunkSize = 220;
      const chunks = [];
      for (let i = 0; i < palavras.length; i += chunkSize) {
        chunks.push(palavras.slice(i, i + chunkSize).join(" "));
      }
      blocos = chunks.map(normalizarTexto).filter(b => b.length > 80);
    }

    // gera rótulos por palavra frequente
    const stop = /^(de|da|do|das|dos|em|no|na|para|por|com|como|que|uma|um|e|ou|se|os|as|a|o|é|ser|há|quando|onde|entre|mais|menos|muito|pouco|sobre)$/i;
    return blocos.slice(0, 30).map((b, i) => {
      const freq = Object.create(null);
      b.split(/\s+/).forEach(w => {
        const k = w.toLowerCase().replace(/[.,;:!?()]/g, "");
        if (k.length > 3 && !stop.test(k)) freq[k] = (freq[k] || 0) + 1;
      });
      const termo = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] || `Bloco ${i+1}`;
      return { titulo: termo[0]?.toUpperCase() + termo.slice(1), resumo: b.slice(0,140) + (b.length>140?"…":""), conceitos: Object.keys(freq).slice(0,5) };
    });
  }

  // ----------------------------------------------------------
  // 🌐 IA para módulos/sessões (mini-aula)
  // ----------------------------------------------------------
  async function gerarModulosESessoesPelaIA(texto, nivel = "iniciante") {
    // Se não houver API, cai no fallback
    if (!window.OPENAI_API_KEY) return fallbackModulos(texto, nivel);

    const prompt = `
Você é especialista em design instrucional (Barbara Oakley). Transforme o CONTEÚDO abaixo em um PLANO DE MICRO-LEARNING organizado por MÓDULOS → SESSÕES.

Regras:
- Decida a quantidade adequada de módulos e sessões (progressão básica → prática).
- Cada sessão deve conter: "titulo", "resumo" (máx. 140c) e "detalhamento" (mini aula com: objetivo, explicação, exemplos, exercício guiado e checklist).
- Use JSON válido neste formato, sem comentários e sem texto fora do JSON:

{
  "modulos": [
    {
      "titulo": "Módulo X — Nome",
      "sessoes": [
        { "titulo": "Sessão Y — Nome",
          "resumo": "Descrição breve (máx. 140c).",
          "detalhamento": "🎯 Objetivo...\\n📘 Explicação...\\n🧠 Exemplos...\\n🧪 Exercício...\\n✅ Checklist..."
        }
      ]
    }
  ]
}

Nível do aluno: "${nivel}"
CONTEÚDO:
"""${texto.slice(0, 120000)}"""
(Se o conteúdo for maior, assuma continuação similar. Foque em uma cobertura representativa.)
`.trim();

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          temperature: 0.3,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      let content = data?.choices?.[0]?.message?.content || "";
      content = content.replace(/```json|```/g, "").trim();

      const obj = JSON.parse(content);
      if (!obj?.modulos || !Array.isArray(obj.modulos)) throw new Error("Formato inválido");

      // Sanitização leve
      obj.modulos.forEach((m, mi) => {
        m.titulo = m.titulo || `Módulo ${mi+1}`;
        m.sessoes = Array.isArray(m.sessoes) ? m.sessoes : [];
        m.sessoes = m.sessoes.map((s, si) => ({
          titulo: s?.titulo || `Sessão ${si+1}`,
          resumo: (s?.resumo || "").slice(0, 140),
          detalhamento: s?.detalhamento || "🎯 Objetivo...\n📘 Explicação...\n🧠 Exemplos...\n🧪 Exercício...\n✅ Checklist..."
        }));
      });

      return obj;
    } catch (e) {
      console.warn("⚠️ IA falhou, usando fallback:", e);
      return fallbackModulos(texto, nivel);
    }
  }

  // ----------------------------------------------------------
  // 🛟 Fallback local para módulos/sessões
  // ----------------------------------------------------------
  function fallbackModulos(texto, nivel) {
    // Cria 3 módulos × 3 sessões como estrutura padrão
    const temas = ["Fundamentos", "Ferramentas e Operações", "Aplicações e Prática"];
    const mkSess = (idx, base) => ({
      titulo: `Sessão ${idx} — ${base}`,
      resumo: `Objetivo prático sobre ${base}.`,
      detalhamento:
        `🎯 Objetivo: dominar ${base}.\n` +
        `📘 Explicação: visão direta do conceito e quando aplicar.\n` +
        `🧠 Exemplos: 2 casos simples do material.\n` +
        `🧪 Exercício: reproduza o procedimento com seu próprio exemplo.\n` +
        `✅ Checklist: [ ] Conceito entendido [ ] Exemplo feito [ ] Exercício concluído`
    });

    const modulos = temas.map((t, i) => ({
      titulo: `Módulo ${i+1} — ${t}`,
      sessoes: [mkSess(1, t), mkSess(2, t), mkSess(3, t)]
    }));

    return { modulos };
  }

  // ----------------------------------------------------------
  // 🌐 APIs expostas no window
  // ----------------------------------------------------------
  window.processarArquivoUpload = async (file) => {
    try {
      const texto = await extrairTextoDeArquivo(file);
      const topicos = detectarTopicosParaPreview(texto);
      window.__uploadTextoBruto = texto;
      return { tipoMsg: `✅ Arquivo lido (${topicos.length} tópicos detectados)`, topicos };
    } catch (err) {
      console.error("processarArquivoUpload erro:", err);
      return { tipoMsg: `❌ Falha ao ler o arquivo: ${err.message}`, topicos: [] };
    }
  };

  window.generatePlanFromUploadAI = async (nivel = "iniciante") => {
    const texto = window.__uploadTextoBruto;
    if (!texto || texto.length < 80) {
      throw new Error("processarArquivoUpload deve concluir com sucesso antes.");
    }
    return await gerarModulosESessoesPelaIA(texto, nivel);
  };

  console.log("✅ semantic.js pronto");
})();
