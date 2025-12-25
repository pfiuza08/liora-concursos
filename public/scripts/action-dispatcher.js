// =======================================================
// 🎯 LIORA — ACTION DISPATCHER
// - Única fonte de verdade para ações
// =======================================================

(function () {
  window.lioraActions = {
    login() {
      console.log("🎯 Ação: LOGIN");
      window.lioraUI.show("liora-auth");
    },

    logout() {
      console.log("🎯 Ação: LOGOUT");
      window.lioraLogout?.();
    },

    togglePassword() {
      console.log("🎯 Ação: TOGGLE PASSWORD");
      const input = document.getElementById("auth-senha");
      if (!input) return;

      input.type = input.type === "password" ? "text" : "password";
    },

    goSimulados() {
      console.log("🎯 Ação: SIMULADOS");
      if (!window.lioraAuth?.user) {
        window.lioraUI.show("liora-auth");
        return;
      }
      window.homeSimulados?.();
    }
  };
})();
