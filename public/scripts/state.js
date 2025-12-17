// ==========================================================
// 🧠 LIORA — STATE CANÔNICO v1.1
// Fonte única de verdade para auth + plano
// ==========================================================

(function () {
  if (window.lioraState) return;

  const state = {
    logged: false,
    plan: "free", // free | premium
    user: null,
  };

  function sync(origin = "unknown") {
    // 🔔 Evento canônico
    window.dispatchEvent(
      new CustomEvent("liora:state-changed", {
        detail: { ...state, origin },
      })
    );

    // 🔁 Retrocompatibilidade
    window.lioraUserPlan = state.plan;
  }

  window.lioraState = {
    // -------------------------
    // GETTERS
    // -------------------------
    get logged() {
      return state.logged;
    },
    get plan() {
      return state.plan;
    },
    get user() {
      return state.user;
    },

    // -------------------------
    // SETTERS CANÔNICOS
    // -------------------------
    setLogged(value, user = null) {
      state.logged = !!value;
      state.user = value ? user : null;
      sync("setLogged");
    },

    setPlan(plan) {
      state.plan = plan === "premium" ? "premium" : "free";
      sync("setPlan");
    },

    // -------------------------
    // HELPERS
    // -------------------------
    isPremium() {
      return state.plan === "premium";
    },

    snapshot() {
      return { ...state };
    },
  };

  console.log("🧠 Liora State v1.1 inicializado:", state);
})();
