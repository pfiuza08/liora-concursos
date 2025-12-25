// ==========================================================
// 🧭 LIORA — NAV-HOME v99.1-CANONICAL-APP-ROUTER
// - UI reativa ao estado de auth
// - NÃO decide ações (isso é do ui-actions)
// - APENAS reage a eventos e mostra telas
// - Controla corretamente o FAB ⬅ Início
// ==========================================================

(function () {
  console.log("🔵 nav-home.js v99.1 carregado…");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS PRINCIPAIS
    // ------------------------------------------------------
    const home = document.getElementById("liora-home");
    const app  = document.getElementById("liora-app");
    const fabHome = document.getElementById("fab-home");
    const fabSim = document.getElementById("sim-fab");


    // HEADER
    const userInfo  = document.getElementById("liora-user-info");
    const userName  = document.getElementById("liora-user-name");
    const btnLogout = document.getElementById("btn-logout");
    const btnLogin  = document.getElementById("btn-login");

    // ------------------------------------------------------
    // REGISTRO DA HOME NO UI ROUTER
    // ------------------------------------------------------
    if (home && window.lioraUI) {
      window.lioraUI.register("liora-home", home);
    }

    // ------------------------------------------------------
    // ESTADO GLOBAL DE AUTH
    // ------------------------------------------------------
    window.lioraAuth = window.lioraAuth || { user: null };

    // restaura sessão
    try {
      const saved = localStorage.getItem("liora:user");
      if (saved && !window.lioraAuth.user) {
        window.lioraAuth.user = JSON.parse(saved);
        console.log("🔁 Sessão restaurada:", window.lioraAuth.user.email);
      }
    } catch {}

    // ------------------------------------------------------
    // HELPERS DE TELA (ÚNICA FONTE DE CONTROLE VISUAL)
    // ------------------------------------------------------
    function showHome() {
      app?.classList.add("hidden");
      home?.classList.remove("hidden");
      fabHome?.classList.add("hidden");
    }

    function showApp() {
      home?.classList.add("hidden");
      app?.classList.remove("hidden");
      fabHome?.classList.remove("hidden");
    }

    function hideAllPanels() {
      [
        "painel-estudo",
        "painel-tema",
        "painel-upload",
        "area-plano",
        "liora-sessoes",
        "area-simulado",
        "area-dashboard"
      ].forEach(id =>
        document.getElementById(id)?.classList.add("hidden")
      );
    }

    // ------------------------------------------------------
    // RENDERIZAÇÃO REATIVA DO HEADER (AUTH)
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
    // LOGOUT (AÇÃO PURA)
    // ------------------------------------------------------
    btnLogout?.addEventListener("click", () => {
      window.lioraActions?.logout?.();
    });

    // ------------------------------------------------------
    // FAB ⬅ INÍCIO
    // ------------------------------------------------------
    fabHome?.addEventListener("click", () => {
      console.log("⬅️ Voltar para Home");
      showHome();
    });

    // ======================================================
    // 🎯 REAÇÃO A EVENTOS DO UI-ACTIONS
    // ======================================================

    // -----------------------------
    // ESTUDO — TEMA
    // -----------------------------
    window.addEventListener("liora:open-estudo-tema", () => {
      console.log("🧭 Tela: Estudo por Tema");
      showApp();
      hideAllPanels();

      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-tema")?.classList.remove("hidden");
    });

    // -----------------------------
    // ESTUDO — PDF
    // -----------------------------
    window.addEventListener("liora:open-estudo-upload", () => {
      console.log("🧭 Tela: Estudo por PDF");
      showApp();
      hideAllPanels();

      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-upload")?.classList.remove("hidden");
    });

    // -----------------------------
    // SIMULADOS
    // -----------------------------
    window.addEventListener("liora:open-simulados", () => {
      console.log("🧭 Tela: Simulados");
      showApp();
      hideAllPanels();

      document.getElementById("area-simulado")?.classList.remove("hidden");
    });

    // -----------------------------
    // DASHBOARD
    // -----------------------------
    window.addEventListener("liora:open-dashboard", () => {
      console.log("🧭 Tela: Dashboard");
      showApp();
      hideAllPanels();

      document.getElementById("area-dashboard")?.classList.remove("hidden");
    });

    // -----------------------------
    // PREMIUM
    // -----------------------------
    window.addEventListener("liora:open-premium", () => {
      console.log("🧭 Modal: Liora Premium");

      if (window.lioraModal?.open) {
        window.lioraModal.open("liora-premium-modal");
      }
    });

    console.log("🟢 NAV-HOME v99.1 pronto!");
  });
})();
