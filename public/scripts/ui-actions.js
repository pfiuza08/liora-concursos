// =======================================================
// 🎯 LIORA — UI ACTIONS (ORQUESTRADOR ÚNICO)
// =======================================================

(function () {
  console.log("🎯 UI Actions inicializado");

  // garante estado global
  window.lioraAuth = window.lioraAuth || { user: null };

  window.lioraActions = {

    // -------------------------
    // AUTH
    // -------------------------
    openAuth() {
      console.log("🎯 openAuth");
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

    // -------------------------
    // SIMULADOS
    // -------------------------
    openSimulados() {
      console.log("🎯 openSimulados");

      if (!window.lioraAuth.user) {
        console.log("🔐 bloqueado → login");
        return window.lioraActions.openAuth();
      }

      window.lioraUI.show("liora-app");
      window.dispatchEvent(new Event("liora:enter-simulado"));
    },

    // -------------------------
    // UPGRADE
    // -------------------------
    openUpgrade() {
      console.log("🎯 openUpgrade");

      if (!window.lioraAuth.user) {
        return window.lioraActions.openAuth();
      }

      alert("Tela Liora+ (em breve)");
    }
  };
})();
