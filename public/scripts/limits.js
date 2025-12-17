// ==========================================================
// 🧠 LIORA — LIMITES CANÔNICOS v1
// Fonte única de verdade do modelo freemium
// ==========================================================

(function () {
  console.log("🧠 Liora Limits v1 carregado");

  const FREE_LIMITS = {
    planos: {
      porDia: 1,
      maxSessoes: 6,
      flashcards: false,
      mapaMental: false,
      revisao: false,
      multiplosAtivos: false,
    },

    pdf: {
      permitido: true,
      maxPaginas: 5,          // ou usar blocos
      maxBlocos: 30,
      flashcards: false,
      mapaMental: false,
      aprofundamento: false,
    },

    simulados: {
      porDia: 1,
      maxQuestoes: 5,
      correcaoCompleta: true,
      historico: false,
    },
  };

  const PREMIUM_LIMITS = {
    planos: { ilimitado: true },
    pdf: { ilimitado: true },
    simulados: { ilimitado: true },
  };

  // ----------------------------------------------------------
  // API GLOBAL
  // ----------------------------------------------------------
  window.lioraLimits = {
    FREE: FREE_LIMITS,
    PREMIUM: PREMIUM_LIMITS,

    getCurrent() {
      return window.lioraUserPlan === "premium"
        ? PREMIUM_LIMITS
        : FREE_LIMITS;
    },

    isPremium() {
      return window.lioraUserPlan === "premium";
    },
  };
})();
