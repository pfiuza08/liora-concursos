// =======================================================
// 🧭 LIORA — NAV HOME
// Versão: v101-CLEAN
// Data: 2026-01-14
//
// RESPONSABILIDADE:
// - Controle de telas (screens)
// - Mostrar / esconder painéis
// - Controlar FABs
// - NÃO abre modal
// - NÃO inicia simulado
// =======================================================

(function () {
  console.log("🔵 nav-home.js v101-CLEAN carregado…");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS BASE
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

    window.lioraAuth = window.lioraAuth || { user: null };

    // ------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------
    function resetScroll() {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    function hideAllPanels() {
      app?.querySelectorAll(
        "#painel-estudo, #painel-tema, #painel-upload, #area-plano, #liora-sessoes, #area-simulado, #area-dashboard"
      ).forEach(el => el.classList.add("hidden"));
    }

    function showHome() {
      document.querySelectorAll(".liora-screen").forEach(el =>
        el.classList.remove("is-active")
      );

      home?.classList.add("is-active");
      fabHome?.classList.add("hidden");
      fabSim?.classList.add("hidden");

      resetScroll();
    }

    function showApp() {
      document.querySelectorAll(".liora-screen").forEach(el =>
        el.classList.remove("is-active")
      );

      app?.classList.add("is-active");
      fabHome?.classList.remove("hidden");
      fabSim?.classList.add("hidden");

      resetScroll();
    }

    // ------------------------------------------------------
    // EXPÕE GLOBALMENTE (usado por simulados.js)
    // ------------------------------------------------------
    window.showHome = showHome;
    window.showApp = showApp;
    window.hideAllPanels = hideAllPanels;
    window.fabSim = fabSim;

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
    // FAB HOME
    // ------------------------------------------------------
    fabHome?.addEventListener("click", showHome);

    // ======================================================
    // EVENTOS DE NAVEGAÇÃO
    // ======================================================

    window.addEventListener("liora:open-estudo-tema", () => {
      showApp();
      hideAllPanels();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-tema")?.classList.remove("hidden");
    });

    window.addEventListener("liora:open-estudo-upload", () => {
      showApp();
      hideAllPanels();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-upload")?.classList.remove("hidden");
    });

    // ======================================================
    // SIMULADOS — OPÇÃO B
    // ======================================================
    window.addEventListener("liora:open-simulados", () => {
      console.log("🧭 NAV → área de simulados");

      showApp();
      hideAllPanels();

      const area = document.getElementById("area-simulado");
      area?.classList.remove("hidden");
      area?.classList.add("is-active");

      fabSim?.classList.remove("hidden");
      resetScroll();
    });

    window.addEventListener("liora:open-dashboard", () => {
      showApp();
      hideAllPanels();
      document.getElementById("area-dashboard")?.classList.remove("hidden");
    });

    window.addEventListener("liora:open-premium", () => {
      document.querySelectorAll(".liora-screen").forEach(el =>
        el.classList.remove("is-active")
      );

      document.getElementById("liora-premium")?.classList.add("is-active");

      fabHome?.classList.remove("hidden");
      fabSim?.classList.add("hidden");

      resetScroll();
    });

    // ------------------------------------------------------
    // ESTADO INICIAL
    // ------------------------------------------------------
    showHome();

    console.log("🟢 nav-home v101-CLEAN pronto!");
  });
})();
