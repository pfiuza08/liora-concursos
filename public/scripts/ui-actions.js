// =======================================================
// 🎯 LIORA — UI ACTIONS (ORQUESTRADOR ÚNICO)
// =======================================================

(function () {
  console.log("🎯 UI Actions inicializado");

  window.lioraAuth = window.lioraAuth || { user: null };

  window.lioraActions = {

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

    openSimulados() {
      console.log("🎯 openSimulados");
      if (!window.lioraAuth.user) {
        return window.lioraActions.openAuth();
      }
      window.lioraUI.show("liora-app");
      window.dispatchEvent(new Event("liora:enter-simulado"));
    },

    openUpgrade() {
      console.log("🎯 openUpgrade");
      if (!window.lioraAuth.user) {
        return window.lioraActions.openAuth();
      }
      alert("Liora+ em breve");
    }
  };

})(); // ⬅️ FECHA O IIFE


// =======================================================
// 🧭 PASSO 2 — BINDER GLOBAL (COLE AQUI)
// =======================================================

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;

  const action = el.dataset.action;
  const fn = window.lioraActions?.[action];

  console.log("🧭 intenção:", action);

  if (!fn) {
    console.warn("⚠️ ação não registrada:", action);
    return;
  }

  fn();
});
