// =============================================
// 🧩 semantic.js — Liora Semantic v41
// Compatível com Modelo D (outline + sessões IA)
// Acrescenta: gerarMapaMental() sem quebrar nada
// =============================================

(function () {
  console.log("🧩 semantic.js (v41) carregado");

  const Semantic = {};

  // ----------------------------------------------------
  // 1) LIMPEZA DE TEXTO
  // ----------------------------------------------------
  Semantic.limparTexto = function (t) {
    if (!t) return "";

    return String(t)
      .replace(/\s+/g, " ")
      .replace(/•/g, "- ")
      .replace(/̄/g, "")
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, " ")
      .trim();
  };

  // ----------------------------------------------------
  // 2) DETECTAR RUÍDO (linhas inúteis)
  // ----------------------------------------------------
  Semantic.ehRuido = function (textoOriginal) {
    if (!textoOriginal) return true;

    const t = textoOriginal.trim();

    // muito pequeno
    if (t.length <= 2) return true;

    // números soltos
    if (/^[0-9]+$/.test(t)) return true;

    // rodapé típico
    if (/p[aá]gina\s+\d+/i.test(t)) return true;

    // URLs, e-mails
    if (/https?:\/\//i.test(t) || /@/i.test(t)) return true;

    // símbolos isolados
    if (/^[.,;:!?()]+$/.test(t)) return true;

    return false;
  };

  // ----------------------------------------------------
  // 3) PONTUAR BLOCO
  //    Quanto mais alto, mais útil para IA.
  // ----------------------------------------------------
  Semantic.pontuarBloco = function (texto) {
    if (!texto) return 0;

    const t = texto.trim();

    // tamanho base
    let score = Math.min(t.length / 50, 4); // máximo 4

    // presença de palavras-chave técnicas
    const palavrasTecnicas = [
      "definição",
      "conceito",
      "teorema",
      "exemplo",
      "cálculo",
      "modelo",
      "método",
      "procedimento",
      "propriedade",
      "aplicação",
    ];

    palavrasTecnicas.forEach((p) => {
      if (t.toLowerCase().includes(p)) score += 1;
    });

    // frases mais longas = geralmente explicativas
    const frases = t.split(/\.|;|:/).length;
    if (frases > 3) score += 1;

    // limite superior
    if (score > 10) score = 10;

    return score;
  };

  // ----------------------------------------------------
  // 4) FUNDIR TRECHOS REDUNDANTES
  // ----------------------------------------------------
  Semantic.fundirRedundancias = function (lista) {
    if (!Array.isArray(lista)) return [];

    const unicos = new Map();

    lista.forEach((t) => {
      if (!t) return;
      const chave = t.toLowerCase().slice(0, 80); // início do texto
      if (!unicos.has(chave)) unicos.set(chave, t);
    });

    return Array.from(unicos.values());
  };

  // ----------------------------------------------------
  // 5) SELECIONAR TRECHOS MAIS FORTES
  // ----------------------------------------------------
  Semantic.selecionarTrechosFortes = function (linhas, limite = 18) {
    const avaliados = linhas
      .map((l) => ({ texto: l, score: Semantic.pontuarBloco(l) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limite)
      .map((x) => x.texto);

    return avaliados;
  };

  // ----------------------------------------------------
  // 6) CONSTRUIR TEXTO BASE (para IA)
  // ----------------------------------------------------
  Semantic.construirTextoBase = function (linhas) {
    if (!Array.isArray(linhas)) return "";

    const limpas = linhas
      .map((t) => Semantic.limparTexto(t))
      .filter((t) => !Semantic.ehRuido(t));

    const fortes = Semantic.selecionarTrechosFortes(limpas, 18);
    const unicos = Semantic.fundirRedundancias(fortes);

    return unicos.join("\n\n");
  };

  // ----------------------------------------------------
  // 7) 🧠 MAPA MENTAL TEXTUAL (básico, não quebra nada)
  // ----------------------------------------------------
  Semantic.gerarMapaMental = async function (titulo, textoBase) {
    if (!window.callLLM) {
      console.warn("callLLM() indisponível — mapa mental não será gerado.");
      return "";
    }

    const prompt = `
Você é Liora. Gere um mapa mental textual, com no máximo 3 níveis.

FORMATO OBRIGATÓRIO (sem explicações extras):

- ${titulo}
  - tópico importante
    - detalhe específico
  - tópico importante
    - detalhe específico

Use SOMENTE o conteúdo do texto-base. Não invente conceitos externos.

TEXTO-BASE:
${textoBase}
`;

    try {
      const raw = await window.callLLM(
        "Você é Liora e responde apenas mapas mentais textuais neste formato.",
        prompt
      );
      return String(raw || "").trim();
    } catch (err) {
      console.error("Erro ao gerar mapa mental:", err);
      return "";
    }
  };

  // ----------------------------------------------------
  // Exporta para o escopo global
  // ----------------------------------------------------
  window.LioraSemantic = Semantic;

  console.log("✅ semantic.js pronto (v41)");
})();
