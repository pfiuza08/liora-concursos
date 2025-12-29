// =======================================================
// 🎯 LIORA — UI ACTIONS (ORQUESTRADOR ÚNICO)
// - Fonte única de decisão de navegação
// - Usado por TODOS os botões via data-action
// - SEM MODAIS (tudo é SCREEN)
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

      if (!window.lioraAuthUI?.ready?.()) {
        console.warn("⏳ Auth UI ainda não pronta");
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
      console.log("🎯 openTema");
      window.dispatchEvent(new Event("liora:open-estudo-tema"));
    },

    openUpload() {
      console.log("🎯 openUpload");
      window.dispatchEvent(new Event("liora:open-estudo-upload"));
    },

    // -----------------------------
    // SIMULADOS
    // -----------------------------
    openSimulados() {
      console.log("🎯 openSimulados");

      if (!window.lioraAuth.user) {
        return window.lioraActions.openAuth();
      }

      window.dispatchEvent(new Event("liora:open-simulados"));
    },

    openSimConfig() {
      console.log("🎯 openSimConfig");

      if (!window.lioraAuth.user) {
        return window.lioraActions.openAuth();
      }

      // 👉 SCREEN (não modal)
      window.dispatchEvent(new Event("liora:open-sim-config"));
    },

    startSimulado() {
      console.log("🎯 startSimulado");

      const config = {
        banca: document.getElementById("sim-banca")?.value || null,
        qtd: Number(document.getElementById("sim-qtd")?.value || 0),
        tempo: Number(document.getElementById("sim-tempo")?.value || 0),
        dificuldade: document.getElementById("sim-dificuldade")?.value || null,
        tema: document.getElementById("sim-tema")?.value || null
      };

      window.lioraSimuladoConfig = config;

      console.log("🧪 Configuração do simulado salva:", config);

      window.dispatchEvent(new Event("liora:start-simulado"));
    },

    // -----------------------------
    // DASHBOARD
    // -----------------------------
    openDashboard() {
      console.log("🎯 openDashboard");

      if (!window.lioraAuth.user) {
        return window.lioraActions.openAuth();
      }

      window.dispatchEvent(new Event("liora:open-dashboard"));
    },

    // -----------------------------
    // PREMIUM (SCREEN)
    // -----------------------------
       openUpgrade() {
      console.log("🎯 openUpgrade");
    
      // ❌ REMOVE o gate de auth aqui
      window.dispatchEvent(new Event("liora:open-premium"));
    }


  }; // ✅ FECHAMENTO DO OBJETO

})(); // ✅ FECHAMENTO DO IIFE

// =======================================================
// 🧭 BINDER GLOBAL — DATA-ACTION
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
