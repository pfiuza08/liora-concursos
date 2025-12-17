// ==========================================================
// 🧠 LIORA — LIMITS v1 (CANONICAL)
// Define limites oficiais por plano
// ==========================================================

(function () {
  console.log("📏 Liora Limits v1 carregado");

  const LIMITS = {
    free: {
      simulados: {
        porDia: 1,
        questoesPorSimulado: 5,
        permiteHistorico: false
      },

      estudo: {
        planosPorTemaDia: 1,
        permiteFlashcards: false,
        permiteMapaMental: false
      },

      pdf: {
        permiteUpload: true,
        maxPaginas: 5
      }
    },

    premium: {
      simulados: {
        porDia: Infinity,
        questoesPorSimulado: Infinity,
        permiteHistorico: true
      },

      estudo: {
        planosPorTemaDia: Infinity,
        permiteFlashcards: true,
        permiteMapaMental: true
      },

      pdf: {
        permiteUpload: true,
        maxPaginas: Infinity
      }
    }
  };

  // API pública imutável
  window.lioraLimits = Object.freeze(LIMITS);
})();
