// ==========================================================
// 🧠 LIORA — STATE CANÔNICO v1
// Fonte única de verdade para auth + plano
// ==========================================================

(function () {
  if (window.lioraState) return;

  const state = {
    logged: false,
    plan: "free", // free | premium
  };

  function sync() {
    window.dispatchEvent(
      new CustomEvent("liora:state-changed", {
        detail: { ...state },
      })
    );
  }

  window.lioraState = {
    get logged() {
      return state.logged;
    },
    get plan() {
      return state.plan;
    },

    setLogged(value) {
      state.logged = !!value;
      sync();
    },

    setPlan(plan) {
      state.plan = plan === "premium" ? "premium" : "free";
      sync();
    },

    snapshot() {
      return { ...state };
    },
  };

  console.log("🧠 Liora State v1 inicializado:", state);
})();
