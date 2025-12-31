// =======================================================
// 🎯 LIORA — UI ACTIONS (ORQUESTRADOR ÚNICO)
// - NÃO navega auth
// - NÃO fecha auth
// - Router só para telas reais
// - Auth é modal independente
// =======================================================

(function () {
  console.log("🎯 UI Actions inicializado (canônico)");

  // ------------------------------------------------------
  // AÇÕES CANÔNICAS
  // ------------------------------------------------------
  window.lioraActions = {

    // =============================
    // AUTH (MODAL)
    // =============================
    openAuth() {
      console.log("🎯 openAuth (modal)");

      if (window.lioraAuthUI?.open) {
        window.lioraAuthUI.open();
        return;
      }

      console.warn("⚠️ Auth UI modal não disponível");
    },

    logout() {
      console.log("🎯 logout");

      if (window.lioraAuth?.logout) {
        window.lioraAuth.logout();
      }
    },

    // =============================
    // ESTUDO
    // =============================
    openTema() {
      console.log("🎯 openTema");
      window.dispatchEvent(new Event("liora:open-estudo-tema"));
    },

    openUpload() {
      console.log("🎯 openUpload");
      window.dispatchEvent(new Event("liora:open-estudo-upload"));
    },

    // =============================
    // SIMULADOS
    // =============================
    openSimulados() {
      console.log("🎯 openSimulados");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      window.dispatchEvent(new Event("liora:open-simulados"));
    },

    openSimConfig() {
      console.log("🎯 openSimConfig");
      window.dispatchEvent(new Event("liora:open-sim-config"));
    },

    // =============================
    // DASHBOARD
    // =============================
    openDashboard() {
      console.log("🎯 openDashboard");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      window.dispatchEvent(new Event("liora:open-dashboard"));
    },

    // =============================
    // PREMIUM
    // =============================
    openUpgrade() {
      console.log("🎯 openUpgrade");
      window.dispatchEvent(new Event("liora:open-premium"));
    }
  };

  // =======================================================
  // 🔗 BINDER CANÔNICO — DATA-ACTION
  // =======================================================
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;

    const action = el.dataset.action;
    const fn = window.lioraActions?.[action];

    if (typeof fn !== "function") {
      console.warn("⚠️ Ação não registrada:", action);
      return;
    }

    cons
