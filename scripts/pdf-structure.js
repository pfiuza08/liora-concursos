// ===============================
// 🧱 pdf-structure.js (v3.1)
// Construção robusta de seções a partir de blocos do PDF
// ===============================

(function () {
  console.log("🔵 Liora PDF Structure (v3.1) carregado...");

  // ----------------------------------------------
  // REMOVE CABEÇALHO, RODAPÉ, NÚMEROS DE PÁGINA
  // ----------------------------------------------
  function filtrarBlocosRuido(blocos) {
    return blocos.filter(b => {
      const t = b.text.trim();
      if (!t) return false;

      // Números de página simples
      if (/^\d+$/.test(t)) return false;

      // Página 12 / Page 12
      if (/^(Página|Page)\s*\d+$/i.test(t)) return false;

      // Rodapé padrões (copyrights, nome do livro)
      if (/direitos reservados|copyright/i.test(t)) return false;

      // Cabeçalhos típicos
      if (/sumário|índice|conteúdo programático/i.test(t)) return false;

      // Linhas muito pequenas com fonte muito baixa
      if (t.length <= 3 && b.fontSize < 9) return false;

      return true;
    });
  }

  // ----------------------------------------------
  // DETECÇÃO ROBUSTA DE TÍTULOS
  // ----------------------------------------------
  function ehTitulo(bloco, medianaFonte) {
    const txt = bloco.text.trim();
    if (!txt) return false;

    const palavras = txt.split(/\s+/).length;
    const tamanho = txt.length;

    // 1) Padrões explícitos fortes de capítulos
    const regexTitulo = /^(cap[ií]tulo|unidade|aula|m[oó]dulo)\s+\d+/i;
    if (regexTitulo.test(txt)) return true;

    // 2) FontSize muito maior que a média
    if (bloco.fontSize >= medianaFonte + 4) return true;

    // 3) Títulos geralmente são curtos
    if (palavras <= 7 && tamanho <= 60 && bloco.fontSize >= medianaFonte + 2)
      return true;

    // 4) Posição no topo da página (provável título)
    if (bloco.y > 700 && bloco.fontSize >= medianaFonte + 2) return true;

    return false;
  }

  // ----------------------------------------------
  // AGRUPAR SEÇÕES PEQUENAS PARA EVITAR FRAGMENTAÇÃO
  // ----------------------------------------------
function agruparSecoes(secoes) {
  const agrupadas = [];
  let buffer = null;

  secoes.forEach((sec, i) => {
    const len = sec.conteudo.length;

    const titulo = sec.titulo.trim();
    const palavrasTitulo = titulo.split(/\s+/).length;

    const ehSubtitulo =
      !/^(cap[ií]tulo|unidade|aula|m[oó]dulo)\s+\d+/i.test(titulo) &&
      palavrasTitulo <= 5;

    // Critério 1: conteúdo pequeno → agrupar
    if (len < 1200) {
      if (!buffer)
        buffer = { titulo: sec.titulo, conteudo: "" };

      buffer.conteudo += "\n" + sec.conteudo;
      return;
    }

    // Critério 2: parece subtítulo → agrupar
    if (ehSubtitulo) {
      if (!buffer)
        buffer = { titulo: sec.titulo, conteudo: "" };

      buffer.conteudo += "\n" + sec.conteudo;
      return;
    }

    // Se chegou aqui → secção é realmente grande e deve ser mantida
    if (buffer) {
      agrupadas.push(buffer);
      buffer = null;
    }

    agrupadas.push(sec);
  });

  if (buffer) agrupadas.push(buffer);

  return agrupadas;
}


  // ----------------------------------------------
  // CONSTRUIR SEÇÕES A PARTIR DOS BLOCOS
  // ----------------------------------------------
  function construirSecoesAPartirDosBlocos(blocos) {
    if (!blocos || blocos.length === 0) {
      console.warn("⚠️ Nenhum bloco recebido.");
      return [];
    }

    // 1) Filtrar ruído
    const limpos = filtrarBlocosRuido(blocos);

    if (!limpos.length) {
      console.warn("⚠️ Todos os blocos foram filtrados.");
      return [];
    }

    // 2) Calcular mediana da fonte
    const tamanhos = limpos.map(b => b.fontSize).sort((a, b) => a - b);
    const mediana = tamanhos[Math.floor(tamanhos.length / 2)] || 12;

    let secoes = [];
    let atual = null;

    function novaSecao(titulo) {
      if (atual && atual.conteudo.trim()) secoes.push(atual);
      atual = { titulo: titulo || "Seção", conteudo: "" };
    }

    // 3) Construção das seções
    limpos.forEach(b => {
      const txt = b.text.trim();
      if (!txt) return;

      if (ehTitulo(b, mediana)) {
        novaSecao(txt);
      } else {
        if (!atual) novaSecao("Introdução");
        atual.conteudo += (atual.conteudo ? "\n" : "") + txt;
      }
    });

    if (atual && atual.conteudo.trim()) secoes.push(atual);

    // 4) Agrupar seções pequenas
    secoes = agruparSecoes(secoes);

    // 5) Limite máximo de seções (segurança)
    const MAX = 20;
    if (secoes.length > MAX) {
      console.warn(`⚠️ Muitas seções (${secoes.length}), reduzindo para ${MAX}.`);
      secoes = secoes.slice(0, MAX);
    }

    console.log("🧱 Seções heurísticas construídas:", secoes);
    return secoes;
  }

  // Exporta no escopo global
  window.LioraPDF = window.LioraPDF || {};
  window.LioraPDF.construirSecoesAPartirDosBlocos = construirSecoesAPartirDosBlocos;

})();
