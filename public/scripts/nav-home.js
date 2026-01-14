// ==========================================================
// 🧭 LIORA — NAV-HOME v100.0-CANONICAL
// - HOME e APP controlados APENAS por .hidden
// - Auth é modal (não passa aqui)
// - Premium é painel do APP
// - FABs sincronizados com o contexto
// ==========================================================

(function () {
  console.log("🔵 nav-home.js v100 carregado…");

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

    // ------------------------------------------------------
    // AUTH STATE (read-only aqui)
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
    // HELPERS
    // ------------------------------------------------------
    function resetScroll() {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    }

   function hideAllPanels() {
    app?.querySelectorAll(
    "#painel-estudo, #painel-tema, #painel-upload, #area-plano, #liora-sessoes, #area-simulado, #liora-sim-config, #area-dashboard"
     ).forEach(el => el.classList.add("hidden"));
   }


    // ------------------------------------------------------
    // HOME / APP
    // ------------------------------------------------------
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
    fabHome?.addEventListener("click", showHome);

    // ======================================================
    // 🎯 EVENTOS DO UI-ACTIONS
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
    // 🎯 SIMULADOS — ENTRAR NA ÁREA (Opção B)
    // ======================================================
    window.addEventListener("liora:open-simulados", () => {
      console.log("🧭 NAV → abrir área de simulados");
    
      // Ativa o workspace
      showApp();
      hideAllPanels();
    
      // Ativa área de simulados
      const area = document.getElementById("area-simulado");
      area?.classList.remove("hidden");
      area?.classList.add("is-active");
    
      // Mostra FAB de configuração
      const fab = document.getElementById("sim-fab");
      fab?.classList.remove("hidden");
    
      // Scroll defensivo
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    });

    window.addEventListener("liora:open-sim-config", () => {
      showApp();
      hideAllPanels();
      document.getElementById("liora-sim-config")?.classList.remove("hidden");
    });

    window.addEventListener("liora:open-dashboard", () => {
      showApp();
      hideAllPanels();
      document.getElementById("area-dashboard")?.classList.remove("hidden");
    });

   window.addEventListener("liora:open-premium", () => {
    // desativa todas as screens
    document.querySelectorAll(".liora-screen").forEach(el =>
      el.classList.remove("is-active")
    );
  
    // ativa premium como screen
    const premium = document.getElementById("liora-premium");
    premium?.classList.add("is-active");
  
    // FABs
    fabHome?.classList.remove("hidden");
    fabSim?.classList.add("hidden");
  
    // reset de scroll
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  });


    // ------------------------------------------------------
    // ESTADO INICIAL
    // ------------------------------------------------------
    showHome();

    console.log("🟢 NAV-HOME v100 pronto!");
  });
})();
