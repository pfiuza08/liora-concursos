// ==========================================================
// 🧭 LIORA — NAV-HOME v70-COMMERCIAL-SYNC
// Controla:
// - Home → Tema / Upload / Simulados / Dashboard
// - Mostra/esconde painéis
// - Mostra/esconde FAB Início
// - Mostra/esconde FAB de simulado
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v70-COMMERCIAL-SYNC) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------
    // ELEMENTOS
    // ------------------------------------------------------
    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    const painelEstudo = document.getElementById("painel-estudo");
    const painelTema = document.getElementById("painel-tema");
    const painelUpload = document.getElementById("painel-upload");

    const areaSimulado = document.getElementById("area-simulado");
    const areaDashboard = document.getElementById("area-dashboard");

    const fabHome = document.getElementById("fab-home");
    const fabSim = document.getElementById("sim-fab");

    const btnHomeTema = document.getElementById("home-tema");
    const btnHomeUpload = document.getElementById("home-upload");
    const btnHomeSimulados = document.getElementById("home-simulados");
    const btnHomeDashboard = document.getElementById("home-dashboard");

    // ------------------------------------------------------
    // FUNÇÕES GLOBAIS
    // ------------------------------------------------------
    window.showSimFab = () => {
      if (fabSim) fabSim.style.display = "flex";
    };

    window.hideSimFab = () => {
      if (fabSim) fabSim.style.display = "none";
    };

    window.showFabHome = () => {
      if (fabHome) fabHome.style.display = "flex";
    };

    window.hideFabHome = () => {
      if (fabHome) fabHome.style.display = "none";
    };

    // ------------------------------------------------------
    // FUNÇÕES DE VISIBILIDADE
    // ------------------------------------------------------
    function showApp() {
      home.classList.add("hidden");
      app.classList.remove("hidden");
    }

    function showHome() {
      home.classList.remove("hidden");
      app.classList.add("hidden");
    }

    function hideAllPanels() {
      painelEstudo.classList.add("hidden");
      painelTema.classList.add("hidden");
      painelUpload.classList.add("hidden");
      areaSimulado.classList.add("hidden");
      areaDashboard.classList.add("hidden");
    }

    // ------------------------------------------------------
    // FAB INÍCIO → volta para a home
    // ------------------------------------------------------
    if (fabHome) {
      fabHome.addEventListener("click", () => {
        showHome();
        hideSimFab();
        hideFabHome();
        hideAllPanels();
      });
    }

    // ------------------------------------------------------
    // HOME → TEMA
    //---------------------------------------------
    btnHomeTema.addEventListener("click", () => {
      showApp();
      hideAllPanels();

      painelEstudo.classList.remove("hidden");
      painelTema.classList.remove("hidden");

      hideSimFab();   // <<< IMPORTANTÍSSIMO
      showFabHome();
    });

    // ------------------------------------------------------
    // HOME → UPLOAD
    //---------------------------------------------
    btnHomeUpload.addEventListener("click", () => {
      showApp();
      hideAllPanels();

      painelEstudo.classList.remove("hidden");
      painelUpload.classList.remove("hidden");

      hideSimFab();
      showFabHome();
    });

    // ------------------------------------------------------
    // HOME → SIMULADOS
    //---------------------------------------------
    btnHomeSimulados.addEventListener("click", () => {
      showApp();
      hideAllPanels();

      areaSimulado.classList.remove("hidden");

      showSimFab();  // <<< AGORA FUNCIONA PERFEITO
      showFabHome();
    });

    // ------------------------------------------------------
    // HOME → DASHBOARD
    //---------------------------------------------
    btnHomeDashboard.addEventListener("click", () => {
      showApp();
      hideAllPanels();

      areaDashboard.classList.remove("hidden");

      hideSimFab();
      showFabHome();
    });

    // ------------------------------------------------------
    // ESTADO INICIAL (ESSENCIAL)
    //---------------------------------------------
    hideSimFab();    // FAB NÃO aparece na carga inicial
    hideFabHome();   // O botão Início também não deve aparecer
    hideAllPanels(); // Garantia total
    showHome();      // Mostra a home limpa

    console.log("🟢 nav-home.js OK (controle comercial ativado)");
  });
})();
