// ==========================================================
// 🧭 LIORA — NAV-HOME v99.4-CANONICAL-APP-ROUTER
// - UI reativa ao estado de auth
// - NÃO decide ações (isso é do ui-actions)
// - APENAS reage a eventos e mostra telas
// - Controla FAB ⬅ Início e FAB ⚙ Simulado
// - Premium como SCREEN
// - Reset de scroll global (desktop + mobile)
// - Blindagem contra interferência da HOME
// ==========================================================

(function () {
  console.log("🔵 nav-home.js v99.4 carregado…");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS PRINCIPAIS
    // ------------------------------------------------------
    const home = document.getElementById("liora-home");
    const app  = document.getElementById("liora-app");

    const fabHome = document.getElementById("fab-home");
    const fabSim  = document.getElementById("sim-fab");

    // HEADER
    const userInfo  = document.getElementById("liora-user-info");
    const userName  = document.getElementById("liora-user-name");
    const btnLogout = document.getElementById("btn-logout");
    const btnLogin  = document.getElementById("btn-login");

    // ------------------------------------------------------
    // ESTADO GLOBAL DE AUTH
    // ------------------------------------------------------
    window.lioraAuth = window.lioraAuth || { user: null };

    try {
      const saved = localStorage.getItem("liora:user");
      if (saved && !window.lioraAuth.user) {
        window.lioraAuth.user = JSON.parse(saved);
        console.log("🔁 Sessão restaurada:", window.lioraAuth.user.email);
      }
    } catch {}

    // ------------------------------------------------------
    // HELPERS CANÔNICOS
    // ------------------------------------------------------
    function resetScroll() {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    function hideAllFABs() {
      fabHome?.classList.add("hidden");
      fabSim?.classList.add("hidden");
    }

    function showHome() {
      app?.classList.add("hidden");
      home?.classList.remove("hidden");
      hideAllFABs();
      resetScroll();
    }

    function showApp() {
      home?.classList.add("hidden");
      app?.classList.remove("hidden");

      fabHome?.classList.remove("hidden");
      fabSim?.classList.add("hidden");

      resetScroll();
    }

    function hideAllPanels() {
      [
        "painel-estudo",
        "painel-tema",
        "painel-upload",
        "area-plano",
        "liora-sessoes",
        "area-simulado",
        "liora-sim-config",
        "area-dashboard",
        "liora-premium"
      ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
      });
    }

    // ------------------------------------------------------
    // HEADER — AUTH REATIVO
    // ------------------------------------------------------
    function renderAuthUI() {
      const user = window.lioraAuth.user;

      if (user) {
        userInfo?.classList.remove("hidden");
        userName.textContent = user.email;
        btnLogout?.classList.remove("hidden");
        btnLogin?.classList.add("hidden");
      } else {
        userInfo?.classList.add("hidden");
        btnLogout?.classList.add("hidden");
        btnLogin?.classList.remove("hidden");
      }
    }

    window.addEventListener("liora:render-auth-ui", renderAuthUI);
    renderAuthUI();

    // ------------------------------------------------------
    // LOGOUT
    // ------------------------------------------------------
    btnLogout?.addEventListener("click", () => {
      window.lioraActions?.logout?.();
      showHome();
    });

    // ------------------------------------------------------
    // FAB ⬅ INÍCIO
    // ------------------------------------------------------
    fabHome?.addEventListener("click", () => {
      console.log("⬅️ Voltar para Home");
      showHome();
    });

    // ======================================================
    // 🎯 EVENTOS DO UI-ACTIONS
    // ======================================================

    // ESTUDO — TEMA
    window.addEventListener("liora:open-estudo-tema", () => {
      showApp();
      hideAllPanels();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-tema")?.classList.remove("hidden");
    });

    // ESTUDO — PDF
    window.addEventListener("liora:open-estudo-upload", () => {
      showApp();
      hideAllPanels();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-upload")?.classList.remove("hidden");
    });

    // SIMULADOS — LISTA
    window.addEventListener("liora:open-simulados", () => {
      showApp();
      hideAllPanels();
      document.getElementById("area-simulado")?.classList.remove("hidden");
      fabSim?.classList.remove("hidden");
    });

    // CONFIGURAR SIMULADO
    window.addEventListener("liora:open-sim-config", () => {
      showApp();
      hideAllPanels();
      document.getElementById("liora-sim-config")?.classList.remove("hidden");
    });

    // SIMULADO EM ANDAMENTO
    window.addEventListener("liora:start-simulado", () => {
      showApp();
      hideAllPanels();
      document.getElementById("area-simulado")?.classList.remove("hidden");
      fabSim?.classList.remove("hidden");
    });

    // DASHBOARD
    window.addEventListener("liora:open-dashboard", () => {
      showApp();
      hideAllPanels();
      document.getElementById("area-dashboard")?.classList.remove("hidden");
    });

    // ⭐ LIORA PREMIUM (SCREEN)
    window.addEventListener("liora:open-premium", () => {
      showApp();
      hideAllPanels();
    
      const premium = document.getElementById("liora-premium");
      if (!premium) return;
    
      premium.classList.remove("hidden");
    
      // 🔒 força layout antes do scroll
      premium.getBoundingClientRect();
    
      window.scrollTo({ top: 0, behavior: "auto" });
    });

    console.log("🟢 NAV-HOME v99.4 pronto!");
  });
})();
