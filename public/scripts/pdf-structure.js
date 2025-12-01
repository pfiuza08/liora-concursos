// ==========================================================
// 📚 LIORA — PDF Structure v74-SUPREME-STABLE-FILTER
// - Anti-explosão
// - Detecção de títulos REALISTAS
// - Agrupamento inteligente
// - Remoção de RUÍDO editorial
// ==========================================================
(function () {
  console.log("🔵 Liora PDF Structure v74-SUPREME-STABLE-FILTER carregado...");

  const MAX_SECOES = 30;
  const MIN_TITULO_LEN = 6;
  const MIN_BLOCO_LEN = 20;
  const FONT_TITULO_MIN = 16;

  const PALAVRAS_EDITORIAIS = [
    "isbn", "edição", "copyright", "direitos",
    "revisão", "revisor", "coordenação", "organização",
    "autor", "autores", "ilustração", "diagramação",
    "editora", "publicação", "impresso", "contato",
    "www.", "http", "@", "ficha catalográfica",
    "sumário", "índice remissivo", "índice", "apresentação"
  ];

  function limparTexto(t) {
    return String(t || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Detecta ruído óbvio
  function ehRuido(t) {
    const texto = t.toLowerCase();

    if (/^p[aá]gina\s*\d+$/i.test(texto)) return true;
    if (/^\d+$/.test(texto)) return true;
    if (texto.length < 3) return true;

    return false;
  }

  // Detecta se bloco pertence a metadados editoriais
  function ehEditorial(t) {
    if (!t) return true;
    const txt = t.toLowerCase();

    return PALAVRAS_EDITORIAIS.some((w) => txt.includes(w));
  }

  function classificarTitulo(t, b) {
    let score = 0;

    const texto = t.trim();
    if (texto.length < MIN_TITULO_LEN) return 0;

    if (/^(cap[ií]tulo|seç[aã]o)\s+\d+/i.test(texto)) score += 3;
    if (/^\d+(\.\d+)*\s+/.test(texto)) score += 3;

    if (b.fontSize >= FONT_TITULO_MIN) score += 2;

    if (/^[A-Z][A-Za-z0-9\s:]{6,80}$/.test(texto)) score += 1;

    if (!texto.endsWith(".")) score += 1;

    if (texto.length > 120) score = 0;

    return score;
  }

  function fromBlocks(blocos) {
    if (!Array.isArray(blocos)) {
      console.warn("⚠️ fromBlocks recebeu blocos inválidos:", blocos);
      return [];
    }

    console.log("📦 PDF Structure → recebendo blocos:", blocos.length);

    const secoes = [];
    let atual = { titulo: "Introdução", conteudo: [] };

    for (const b of blocos) {
      const texto = limparTexto(b.text);
      if (!texto) continue;

      if (ehRuido(texto)) continue;

      const score = classificarTitulo(texto, b);

      // TÍTULO
      if (score >= 3) {
        if (atual.conteudo.length > 0) secoes.push(atual);

        atual = { titulo: texto, conteudo: [] };
        if (secoes.length >= MAX_SECOES) break;

        continue;
      }

      // Conteúdo normal
      atual.conteudo.push(texto);
    }

    if (atual.conteudo.length > 0) secoes.push(atual);

    // -------------------------------
    // FILTRO FINAL: REMOVE SEÇÕES EDITORIAIS
    // -------------------------------
    const filtradas = secoes.filter((sec, idx) => {
      const titulo = sec.titulo?.toLowerCase() || "";
      const primeiro = (sec.conteudo[0] || "").toLowerCase();

      // Seção editorial quase sempre está entre as 3 primeiras:
      // — capa, créditos, revisão, ISBN, ficha catalográfica, sumário, etc.
      if (idx < 3) {
        if (PALAVRAS_EDITORIAIS.some((w) => titulo.includes(w))) return false;
        if (PALAVRAS_EDITORIAIS.some((w) => primeiro.includes(w))) return false;
      }

      return true;
    });

    console.log("🧱 Seções construídas (filtradas):", filtradas);
    return filtradas.slice(0, MAX_SECOES);
  }

  window.lioraPDFStructure = { fromBlocks };
})();
