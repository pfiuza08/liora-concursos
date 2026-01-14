// =======================================================
// 🎯 LIORA — UI ACTIONS v106-CLEAN
// Orquestrador de intenções (sem DOM)
// =======================================================

console.log("🔖 UI-ACTIONS v106-CLEAN carregado");

(function () {

  // ------------------------------------------------------
  // AUTH STATE (read-only)
  // ------------------------------------------------------
  window.lioraAuth = window.lioraAuth || { user: null };

  // ------------------------------------------------------
  // AÇÕES CANÔNICAS
  // ------------------------------------------------------
  const actions = {

    // -------------------------
    // AUTH
    // -------------------------
    openAuth() {
      console.log("🎯 openAuth");
      window.dispatchEvent(new Event("liora:open-auth"));
    },

    logout() {
      console.log("🎯 logout");
      window.lioraAuth.user = null;
      localStorage.removeItem("liora:user");

      window.dispatchEvent(new Event("liora:render-auth-ui"));
      window.dispatchEvent(new Event("liora:go-home"));
    },

    // -------------------------
    // ESTUDO
    // -------------------------
    openTema() {
      window.dispatchEvent(new Event("liora:open-estudo-tema"));
    },

    openUpload() {
      window.dispatchEvent(new Event("liora:open-estudo-upload"));
    },

    // -------------------------
    // SIMULADOS
    // -------------------------
    openSimulados() {
      console.log("🎯 openSimulados");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      // 👉 entra na área (nav-home decide)
      window.dispatchEvent(new Event("liora:open-simulados"));
    },

    openSimConfig() {
      console.log("🎯 openSimConfig");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      // 👉 apenas pede abertura do modal
      window.dispatchEvent(new Event("liora:open-sim-config"));
    },

    // -------------------------
    // DASHBOARD / PREMIUM
    // -------------------------
    openDashboard() {
      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }
      window.dispatchEvent(new Event("liora:open-dashboard"));
    },

    openUpgrade() {
      window.dispatchEvent(new Event("liora:open-premium"));
    }
  };

  // ------------------------------------------------------
  // EXPÕE AÇÕES
  // ------------------------------------------------------
  Object.defineProperty(window, "lioraActions", {
    value: actions,
    writable: false,
    configurable: false
  });

  // ------------------------------------------------------
  // BINDER CANÔNICO (data-action)
  // ------------------------------------------------------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;

    const action = el.dataset.action;
    const fn = window.lioraActions[action];

    if (typeof fn !== "function") {
      console.warn("⚠️ Ação não registrada:", action);
      return;
    }

    console.log("🧭 Ação disparada:", action);
    fn.call(window.lioraActions);
  });

})();
