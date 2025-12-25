// =======================================================
// 🎯 LIORA — UI ACTIONS (FONTE ÚNICA)
// =======================================================

(function () {
  console.log("🎯 UI Actions ativo");

  window.lioraActions = {

    // ---------- AUTH ----------
    openAuth() {
      console.log("🎯 Ação: abrir login");
      window.lioraUI.show("liora-auth");
    },

    loginSuccess() {
      console.log("🎯 Ação: login efetuado");
      window.lioraUI.show("liora-home");
      window.dispatchEvent(new Event("liora:render-auth-ui"));
    },

    logout() {
      console.log("🎯 Ação: logout");
      window.lioraAuth.user = null;
      localStorage.removeItem("liora:user");
      window.dispatchEvent(new Event("liora:render-auth-ui"));
      window.lioraUI.show("liora-home");
    },

    // ---------- SIMULADOS ----------
    openSimulados() {
      if (!window.lioraAuth?.user) {
        console.log("🔐 Bloqueado → login necessário");
        return window.lioraActions.openAuth();
      }
      window.lioraUI.show("liora-app");
      window.dispatchEvent(new Event("liora:enter-simulado"));
    },

    // ---------- UPGRADE ----------
    openUpgrade() {
      if (!window.lioraAuth?.user) {
        return window.lioraActions.openAuth();
      }
      console.log("💎 Abrir Liora+ (screen futura)");
      // window.lioraUI.show("liora-upgrade");
    }
  };
})();
