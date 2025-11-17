// ==========================================================
// 🧠 LIORA — OUTLINE GENERATOR v70
// - Detecta estruturas hierárquicas espontâneas
// - Zero dependência de área do conhecimento
// - Compatível com core v70-UPLOAD
// - Heurísticas fortes para títulos/subtítulos
// ==========================================================

(function () {
  console.log("🔵 Liora Outline Generator v70 carregado...");

  // --------------------------------------------------------------
  // 1. Heurísticas para detecção de títulos e subtítulos
  // --------------------------------------------------------------

  function ehTitulo(bloco) {
    if (!bloco || !bloco.text) return false;

    const t = bloco.text.trim();

    // Muito curto → geralmente título
    if (t.length <= 50 && /^[A-ZÁÉÍÓÚÂÊÔÃÕ0-9][^.!?]*$/.test(t))
      return true;

    // Começa com número (ex: "1 Introdução", "2.1 Conceitos")
    if (/^\d+(\.\d+)*\s+/.test(t)) return true;

    // Maiúsculas predominantes (mas poucas linhas)
    if (t === t.toUpperCase() && t.length < 80) return true;

    // Palavras-chaves típicas (mas sem assumir domínio)
    if (/^(cap(ítulo)?|se(c|ç)ão|parte|módulo)\b/i.test(t))
      return true;

    return false;
  }

  function nivelDoTitulo(texto) {
    // Ex: 1 → nível 1
    // Ex: 1.2 → nível 2
    // Ex: 1.2.3 → nível 3
    const m = texto.trim().match(/^(\d+(\.\d+)*)/);
    if (!m) return 1;
    return m[1].split(".").length;
  }

  // --------------------------------------------------------------
  // 2. Construção do Outline
  // --------------------------------------------------------------

  function gerarEstrutura(secoes) {
    if (!Array.isArray(secoes)) return [];

    const raiz = [];
    const pilha = []; // estrutura hierárquica

    secoes.forEach((sec) => {
      const titulo = sec.titulo?.trim() || "";
      const nivel = nivelDoTitulo(titulo);

      const item = {
        titulo,
        conteudo: sec.texto || "",
        children: []
      };

      // Se não há pilha → topo do outline
      if (pilha.length === 0) {
        pilha.push({ nivel, item });
        raiz.push(item);
        return;
      }

      // Se nível maior → fica como filho do anterior
      const topo = pilha[pilha.length - 1];
      if (nivel > topo.nivel) {
        topo.item.children.push(item);
        pilha.push({ nivel, item });
        return;
      }

      // Se nível igual ou menor → subir a pilha até se encaixar
      while (pilha.length && nivel <= pilha[pilha.length - 1].nivel) {
        pilha.pop();
      }

      if (!pilha.length) {
        raiz.push(item);
        pilha.push({ nivel, item });
      } else {
        pilha[pilha.length - 1].item.children.push(item);
        pilha.push({ nivel, item });
      }
    });

    return raiz;
  }

  // --------------------------------------------------------------
  // 3. Interface Pública
  // --------------------------------------------------------------
  window.LioraOutline = {
    /**
     * Gera outline para cada seção otimizada (por título)
     */
    async gerarOutlinesPorSecao(secoes) {
      try {
        const blocosDeTitulo = secoes.filter((s) => ehTitulo({ text: s.titulo }));
        return blocosDeTitulo.map((s) => ({
          titulo: s.titulo,
          conteudo: s.texto,
          children: []
        }));
      } catch (e) {
        console.error("Erro em gerarOutlinesPorSecao:", e);
        return [];
      }
    },

    /**
     * Une vários outlines (lista plana) em um outline hierárquico
     */
    async unificarOutlines(lista) {
      try {
        const secoesFormatadas = lista.map((o) => ({
          titulo: o.titulo,
          texto: o.conteudo,
        }));
        return gerarEstrutura(secoesFormatadas);
      } catch (e) {
        console.error("Erro ao unificar outlines:", e);
        return [];
      }
    },

    /**
     * A partir do outline hierárquico final, gera um plano básico
     * O core aplicará o pipeline D depois
     */
    async gerarPlanoDeEstudo(outline) {
      const sessoes = [];

      function percorrer(nos) {
        for (const n of nos) {
          sessoes.push({
            titulo: n.titulo,
            objetivo: `Compreender o tópico: ${n.titulo}`,
            conteudo: {
              introducao: n.conteudo || "",
            }
          });
          if (n.children?.length) percorrer(n.children);
        }
      }

      percorrer(outline);

      return { sessoes };
    }
  };

})();
