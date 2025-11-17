// ==========================================================
// 🧠 LIORA — PDF STRUCTURE v70
// - Neutro e compatível com qualquer área temática
// - Detecta seções, títulos e estrutura inicial
// - Trabalha com blocos já extraídos (texto, posição, página)
// - Prepara seções para o Outline v70
// ==========================================================

(function () {
  console.log("🔵 Liora PDF Structure v70 carregado...");

  // -------------------------------------------------------------
  // 1. Heurísticas para identificar blocos importantes
  // -------------------------------------------------------------

  function normalizarTexto(txt) {
    return (txt || "").replace(/\s+/g, " ").trim();
  }

  function ehTitulo(texto) {
    if (!texto) return false;
    const t = texto.trim();

    if (t.length <= 50 && /^[A-ZÁÉÍÓÚÂÊÔÃÕ0-9]/.test(t)) return true;
    if (/^\d+(\.\d+)*\s+/.test(t)) return true;
    if (t === t.toUpperCase() && t.length < 80) return true;
    if (/^(cap[ií]tulo|se[cç]ão|parte|módulo)\b/i.test(t)) return true;

    return false;
  }

  function ehSeparador(texto) {
    if (!texto) return false;
    if (/^[\-\–\—\=]{3,}$/.test(texto)) return true;
    return false;
  }

  // -------------------------------------------------------------
  // 2. Agrupamento de blocos por proximidade vertical
  // -------------------------------------------------------------
  function agruparBlocos(blocos) {
    const grupos = [];
    let atual = [];

    for (let i = 0; i < blocos.length; i++) {
      const b = blocos[i];

      if (atual.length === 0) {
        atual.push(b);
        continue;
      }

      const ultimo = atual[atual.length - 1];

      const mesmaPagina = b.page === ultimo.page;
      const pertoVerticalmente = Math.abs(b.y - ultimo.y) < 25;

      if (mesmaPagina && pertoVerticalmente) {
        atual.push(b);
      } else {
        grupos.push(atual);
        atual = [b];
      }
    }

    if (atual.length) grupos.push(atual);

    return grupos;
  }

  // -------------------------------------------------------------
  // 3. Construção de seções heurísticas
  // -------------------------------------------------------------
  function construirSecoes(grupos) {
    const secoes = [];
    let atual = {
      titulo: null,
      texto: ""
    };

    function pushAtual() {
      if (atual && normalizarTexto(atual.texto).length > 0) {
        secoes.push({ ...atual });
      }
    }

    for (const g of grupos) {
      const blocoCompleto = g.map(b => b.text).join(" ").trim();
      const texto = normalizarTexto(blocoCompleto);

      if (!texto) continue;
      if (ehSeparador(texto)) continue;

      // TÍTULO
      if (ehTitulo(texto)) {
        pushAtual();
        atual = {
          titulo: texto,
          texto: ""
        };
        continue;
      }

      // CONTEÚDO
      atual.texto += (atual.texto ? "\n" : "") + texto;
    }

    pushAtual();

    return secoes;
  }

  // -------------------------------------------------------------
  // 4. Interface Pública
  // -------------------------------------------------------------
  window.LioraPDF = {
    construirSecoesAPartirDosBlocos(blocos) {
      try {
        if (!Array.isArray(blocos) || blocos.length === 0) {
          console.warn("⚠️ Nenhum bloco recebido em construirSecoesAPartirDosBlocos");
          return [];
        }

        // Agrupamento inicial
        const grupos = agruparBlocos(blocos);

        // Construção das seções
        const secoes = construirSecoes(grupos);

        console.log("📚 PDF Structure v70 → Seções construídas:", secoes.length);
        return secoes;
      } catch (e) {
        console.error("❌ Erro em LioraPDF.construirSecoesAPartirDosBlocos:", e);
        return [];
      }
    }
  };
})();
