// ==========================================================
// 📚 LIORA — PDF Structure v74-SUPREME-STABLE
// - Anti-explosão (máx. 30 seções)
// - Detecção de títulos REALISTAS
// - Agrupamento inteligente de blocos
// - Remoção de ruído (headers/footers)
// ==========================================================
(function () {
  console.log("🔵 Liora PDF Structure v74-SUPREME-STABLE carregado...");

  const MAX_SECOES = 30;       // limite ABSOLUTO
  const MIN_TITULO_LEN = 6;   // evita títulos curtos demais
  const MIN_BLOCO_LEN = 20;   // evita blocos de 1–2 palavras virarem seção
  const FONT_TITULO_MIN = 16; // tamanho mínimo pra considerar título real

  function limparTexto(t) {
    return String(t || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Remove claramente números de página e rodapés
  function ehRuido(t) {
    if (/^Página\s+\d+/i.test(t)) return true;
    if (/^\d+$/.test(t)) return true;     // número isolado
    if (/^\-\s*\d+\s*\-$/.test(t)) return true; // "- 12 -"
    if (t.length < 3) return true;        // linhas curtas são ruído quase sempre
    return false;
  }

  // Avaliação mais robusta de título
  function classificarTitulo(t, bloco) {
    let score = 0;

    const texto = t.trim();

    // Não considerar textos muito curtos como título
    if (texto.length < MIN_TITULO_LEN) return 0;

    // Sinais fortes
    if (/^(CAP[IÍ]TULO|SEÇÃO)\s+\d+/i.test(texto)) score += 3;
    if (/^\d+(\.\d+)*\s+/.test(texto)) score += 3; // 1. / 1.1 / 2.3.1 etc.

    // Título por estilização
    if (bloco.fontSize >= FONT_TITULO_MIN) score += 2;

    // Muitas palavras em maiúsculas? (mas não gritos)
    if (/^[A-Z][A-Za-z0-9\s:]{6,80}$/.test(texto)) score += 1;

    // Títulos costumam NÃO terminar com ponto
    if (!texto.endsWith(".")) score += 1;

    // Linhas longas demais não são títulos
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

      // TÍTULO REAL
      if (score >= 3) {
        // Salva seção anterior
        if (atual.conteudo.length > 0 || atual.titulo) {
          secoes.push(atual);
        }

        atual = { titulo: texto, conteudo: [] };

        if (secoes.length >= MAX_SECOES) break;

        continue;
      }

      // BLOCO PEQUENO → junta ao anterior
      if (texto.length < MIN_BLOCO_LEN) {
        if (atual.conteudo.length > 0) {
          atual.conteudo[atual.conteudo.length - 1] += " " + texto;
        } else {
          atual.conteudo.push(texto);
        }
        continue;
      }

      // Conteúdo normal
      atual.conteudo.push(texto);
    }

    if (atual.conteudo.length > 0) {
      secoes.push(atual);
    }

    // LIMITE FINAL
    if (secoes.length > MAX_SECOES) {
      console.warn(`⚠️ PDF gerou ${secoes.length} seções; limitando para ${MAX_SECOES}.`);
      return secoes.slice(0, MAX_SECOES);
    }

    console.log("🧱 Seções construídas:", secoes);
    return secoes;
  }

  window.lioraPDFStructure = { fromBlocks };
})();
