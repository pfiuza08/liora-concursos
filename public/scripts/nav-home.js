// ==========================================================
// 🧭 LIORA — NAV-HOME v98-CANONICAL
// - UI reativa ao estado de auth
// - SEM navegação direta de auth/simulados
// - Compatível com ui-actions
// ==========================================================

(function () {
  console.log("🔵 nav-home.js v98 carregado…");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS PRINCIPAIS
    // ------------------------------------------------------
    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    // HEADER — IDs REAIS DO HTML
    const userInfo = document.getElementById("liora-user-info");
    const userName = document.getElementById("liora-user-name");
    const btnLogout = document.getElementById("btn-logout");

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
    // UI BÁSICA
    // ------------------------------------------------------
    function showHome() {
      app?.classList.add("hidden");
      home?.classList.remove("hidden");
    }

    // ------------------------------------------------------
    // RENDERIZAÇÃO REATIVA AO AUTH
    // ------------------------------------------------------
    function renderAuthUI() {
      const user = window.lioraAuth.user;

      if (user) {
        userInfo?.classList.remove("hidden");
        userName.textContent = user.email;
        btnLogout?.classList.remove("hidden");
      } else {
        userInfo?.classList.add("hidden");
        btnLogout?.classList.add("hidden");
      }
    }

    window.addEventListener("liora:render-auth-ui", renderAuthUI);

    // inicial
    renderAuthUI();

    // ------------------------------------------------------
    // LOGOUT (AÇÃO PURA)
    // ------------------------------------------------------
    btnLogout?.addEventListener("click", () => {
      window.lioraActions?.logout?.();
    });

    console.log("🟢 NAV-HOME v98 pronto!");
  });
})();
