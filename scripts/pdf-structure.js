// ===============================
// 🧱 pdf-structure.js (v3)
// Lógica robusta de construção de seções a partir de blocos PDF
// ===============================

(function () {
  console.log("🔵 Liora PDF Structure (v3) carregado...");

  /**
   * Remove cabeçalhos, rodapés, números de página,
   * elementos decorativos e blocos irrelevantes.
   */
  function filtrarBlocosRuido(blocos) {
    return blocos.filter(b => {
      const t = b.text.trim();

      if (!t) return false;

      // números soltos (página, elementos gráficos etc.)
      if (/^\d+$/.test(t)) return false;

      // Página 12 / Page 7
      if (/^(Página|Page)\s*\d+$/i.test(t)) return false;

      // copyright, "Todos os direitos reservados"
      if (/direitos reservados|copyright/i.test(t)) return false;

      // cabeçalhos comuns
      if (/sumário|índice|faculdade|universidade|apostila/i.test(t)) return false;

      // rodapés com nome de curso/autor
      if (t.length < 5 && b.fontSize < 9) return false;

      return true;
    });
  }

  /**
   * Critério robusto para identificar títulos reais
   */
  function ehTitulo(bloco, medianaFonte) {
    const txt = bloco.text.trim();
    if (!txt) return false;

    const palavras = txt.split(/\s+/).length;
    const tamanho = txt.length;

    // 1) Padrões explícitos de capítulos
    const regexTitulo = /^(cap[ií]tulo|unidade|aula|m[oó]dulo)\s+\d+/i;
    if (regexTitulo.test(txt)) return true;

    // 2) Fonte significativamente maior
    if (bloco.fontSize >= medianaFonte + 4) return true;

    // 3) Título curto
    if (palavras <= 8 && tamanho <= 60 && bloco.fontSize >= medianaFonte + 2) return true;

    // 4) Posição no topo da página
    if (bloco.y > 700 && bloco.fontSize >= medianaFonte + 2) return true;

    return false;
  }

  /**
   * Agrupamento de seções pequenas (remover fragmentação)
   */
  function agruparSecoes(secoes) {
    const agrupadas = [];
    let buffer = null;

    secoes.forEach(sec => {
      const len = sec.conteudo.length;

      if (len < 600) {
        // juntar no buffer
        if (!buffer) buffer = { titulo: sec.titulo, conteudo: "" };
        buffer.conteudo += "\n" + sec.conteudo;
      } else {
        if (buffer) {
          agrupadas.push(buffer);
          buffer = null;
        }
        agrupadas.push(sec);
      }
    });

    if (buffer) agrupadas.push(buffer);

    return agrupadas;
  }

  /**
   * Constrói seções a partir dos blocos do PDF
   */
  function construirSecoesAPartirDosBlocos(blocos) {
    if (!blocos || blocos.length === 0) {
      console.warn("⚠️ Nenhum bloco recebido.");
      return [];
    }

    // 1) Filtrar ruído
    const limpos = filtrarBlocosRuido(blocos);

    if (!limp
