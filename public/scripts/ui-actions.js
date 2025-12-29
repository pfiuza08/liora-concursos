// =======================================================
// 🎯 LIORA — UI ACTIONS (ORQUESTRADOR ÚNICO)
// - Fonte única de decisões de navegação
// - NÃO renderiza telas (isso é do nav-home / ui-router)
// - Binder canônico via data-action
// =======================================================

(function () {
  console.log("🎯 UI Actions inicializado");

  // ------------------------------------------------------
  // ESTADO GLOBAL DE AUTH
  // ------------------------------------------------------
  window.lioraAuth = window.lioraAuth || { user: null };

  // ------------------------------------------------------
  // AÇÕES CANÔNICAS
  // ------------------------------------------------------
  window.lioraActions = {

    // =============================
    // AUTH
    // =============================
    openAuth() {
      console.log("🎯 openAuth");

      if (!window.lioraUI) {
        console.warn("🚫 UI Router não disponível");
        return;
      }

      window.lioraUI.show("liora-auth");
    },

    loginSuccess(user) {
      console.log("🎯 loginSuccess", user);

      window.lioraAuth.user = user;
      localStorage.setItem("liora:user", JSON.stringify(user));

      window.dispatchEvent(new Event("liora:render-auth-ui"));

      if (window.lioraUI) {
        window.lioraUI.show("liora-home");
      }
    },

    logout() {
      console.log("🎯 logout");

      window.lioraAuth.user = null;
      localStorage.removeItem("liora:user");

      window.dispatchEvent(new Event("liora:render-auth-ui"));

      if (window.lioraUI) {
        window.lioraUI.show("liora-home");
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

      if (!window.lioraAuth.user) {
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

      if (!window.lioraAuth.user) {
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
    if (!action) return;

    const fn = window.lioraActions?.[action];

    if (typeof fn !== "function") {
      console.warn("⚠️ Ação não registrada:", action);
      return;
    }

    console.log("🧭 Ação disparada:", action);
    fn.call(window.lioraActions);
  });

})();
