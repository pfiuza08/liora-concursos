// =======================================================
// 🎯 LIORA — UI ACTIONS (ORQUESTRADOR ÚNICO)
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

    // -----------------------------
    // AUTH
    // -----------------------------
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
      window.lioraUI.show("liora-home");
    },

    logout() {
      console.log("🎯 logout");

      window.lioraAuth.user = null;
      localStorage.removeItem("liora:user");

      window.dispatchEvent(new Event("liora:render-auth-ui"));
      window.lioraUI.show("liora-home");
    },

    // -----------------------------
    // ESTUDO
    // -----------------------------
    openTema() {
      window.dispatchEvent(new Event("liora:open-estudo-tema"));
    },

    openUpload() {
      window.dispatchEvent(new Event("liora:open-estudo-upload"));
    },

    // -----------------------------
    // SIMULADOS
    // -----------------------------
    openSimulados() {
      if (!window.lioraAuth.user) {
        this.openAuth();
        return;
      }
      window.dispatchEvent(new Event("liora:open-simulados"));
    },

    openSimConfig() {
      window.dispatchEvent(new Event("liora:open-sim-config"));
    },

    // -----------------------------
    // DASHBOARD
    // -----------------------------
    openDashboard() {
      if (!window.lioraAuth.user) {
        this.openAuth();
        return;
      }
      window.dispatchEvent(new Event("liora:open-dashboard"));
    },

    // -----------------------------
    // PREMIUM
    // -----------------------------
    openUpgrade() {
      window.dispatchEvent(new Event("liora:open-premium"));
    }

  };

})();
