// ==========================================================
// 🧭 LIORA — NAV-HOME v71-COMMERCIAL-SYNC-IA
// Controla:
// - Home → Tema / Upload / Simulados / Dashboard
// - Mostra/esconde painéis
// - Mostra/esconde FAB Início
// - Mostra/esconde FAB de simulado (#sim-fab)
// - Integra com simulados.js (window.homeDashboard)
// - Integra com dashboard.js (window.lioraDashboard.atualizar())
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v71-COMMERCIAL-SYNC-IA) carregado...");

  document.addEventListener("DOMContentLoaded", () => {

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

    const viewTitle = document.getElementById("liora-view-title");
    const viewSubtitle = document.getElementById("liora-view-subtitle");

    // ------------------------------------------------------
    // FAB helpers
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
    // VISIBILIDADE
    // ------------------------------------------------------
    function showApp() {
      if (home) home.classList.add("hidden");
      if (app) app.classList.remove("hidden");
    }

    function showHome() {
      if (home) home.classList.remove("hidden");
      if (app) app.classList.add("hidden");

      if (viewTitle) viewTitle.textContent = "";
      if (viewSubtitle) viewSubtitle.textContent = "";
    }

    function hideAllPanels() {
      if (painelEstudo) painelEstudo.classList.add("hidden");
      if (painelTema) painelTema.classList.add("hidden");
      if (painelUpload) painelUpload.classList.add("hidden");
      if (areaSimulado) areaSimulado.classList.add("hidden");
      if (areaDashboard) areaDashboard.classList.add("hidden");
    }

    function setView(title, subtitle) {
      if (viewTitle) viewTitle.textContent = title || "";
      if (viewSubtitle) viewSubtitle.textContent = subtitle || "";
    }

    // ------------------------------------------------------
    // FAB HOME
    // ------------------------------------------------------
    if (fabHome) {
      fabHome.addEventListener("click", () => {
        showHome();
        hideAllPanels();
        window.hideSimFab();
        window.hideFabHome();
      });
    }

    // ------------------------------------------------------
    // HOME → TEMA
    // ------------------------------------------------------
    if (btnHomeTema) {
      btnHomeTema.addEventListener("click", () => {
        showApp();
        hideAllPanels();

        if (painelEstudo) painelEstudo.classList.remove("hidden");
        if (painelTema) painelTema.classList.remove("hidden");

        setView(
          "Plano por tema",
          "Defina um tema e deixe a Liora quebrar o estudo em sessões."
        );

        window.hideSimFab();
        window.showFabHome();
      });
    }

    // ------------------------------------------------------
    // HOME → UPLOAD
    // ------------------------------------------------------
    if (btnHomeUpload) {
      btnHomeUpload.addEventListener("click", () => {
        showApp();
        hideAllPanels();

        if (painelEstudo) painelEstudo.classList.remove("hidden");
        if (painelUpload) painelUpload.classList.remove("hidden");

        setView(
          "Plano a partir do PDF",
          "Envie seu material e a Liora monta um plano completo."
        );

        window.hideSimFab();
        window.showFabHome();
      });
    }

    // ------------------------------------------------------
    // HOME → SIMULADOS
    // ------------------------------------------------------
    function goSimulados() {
      showApp();
      hideAllPanels();

      if (areaSimulado) areaSimulado.classList.remove("hidden");

      setView(
        "Simulados inteligentes",
        "Monte simulados com IA por banca, tema e dificuldade."
      );

      window.showSimFab();
      window.showFabHome();
    }

    if (btnHomeSimulados) {
      btnHomeSimulados.addEventListener("click", goSimulados);
    }

    // ------------------------------------------------------
    // HOME → DASHBOARD
    // ------------------------------------------------------
    function goDashboard() {
      showApp();
      hideAllPanels();

      if (areaDashboard) areaDashboard.classList.remove("hidden");

      setView(
        "Meu desempenho",
        "Veja o resumo dos seus simulados."
      );

      window.hideSimFab();
      window.showFabHome();

      // Atualiza dashboard sempre que abrir
      if (
        window.lioraDashboard &&
        typeof window.lioraDashboard.atualizar === "function"
      ) {
        window.lioraDashboard.atualizar();
      }
    }

    if (btnHomeDashboard) {
      btnHomeDashboard.addEventListener("click", goDashboard);
    }

    // Exposto globalmente para simulados.js (botão "Ver meu desempenho")
    window.homeDashboard = goDashboard;

    // ------------------------------------------------------
    // ESTADO INICIAL
    // ------------------------------------------------------
    hideAllPanels();
    showHome();
    window.hideSimFab();
    window.hideFabHome();

    console.log("🟢 nav-home.js v71 OK");
  });
})();
