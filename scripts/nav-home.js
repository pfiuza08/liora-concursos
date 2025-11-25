// ==========================================================
// 🧭 LIORA — NAV-HOME v70-COMMERCIAL-SYNC-IA (FIXED)
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v70-COMMERCIAL-SYNC-IA + FIX) carregado...");

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
    window.showSimFab = () => fabSim && (fabSim.style.display = "flex");
    window.hideSimFab = () => fabSim && (fabSim.style.display = "none");
    window.showFabHome = () => fabHome && (fabHome.style.display = "flex");
    window.hideFabHome = () => fabHome && (fabHome.style.display = "none");

    // ------------------------------------------------------
    // VISIBILIDADE
    // ------------------------------------------------------
    function showApp() {
      home?.classList.add("hidden");
      app?.classList.remove("hidden");
    }

    function showHome() {
      home?.classList.remove("hidden");
      app?.classList.add("hidden");
      viewTitle.textContent = "";
      viewSubtitle.textContent = "";
    }

    function hideAllPanels() {
      painelEstudo?.classList.add("hidden");
      painelTema?.classList.add("hidden");
      painelUpload?.classList.add("hidden");
      areaSimulado?.classList.add("hidden");
      areaDashboard?.classList.add("hidden");
    }

    function setView(title, subtitle) {
      viewTitle.textContent = title;
      viewSubtitle.textContent = subtitle;
    }

    // ------------------------------------------------------
    // FAB HOME
    // ------------------------------------------------------
    fabHome?.addEventListener("click", () => {
      showHome();
      hideAllPanels();
      window.hideSimFab();
      window.hideFabHome();
    });

    // ------------------------------------------------------
    // HOME → TEMA
    // ------------------------------------------------------
    btnHomeTema?.addEventListener("click", () => {
      showApp();
      hideAllPanels();
      painelEstudo?.classList.remove("hidden");
      painelTema?.classList.remove("hidden");

      setView("Plano por tema", "Defina um tema e deixe a Liora quebrar o estudo em sessões.");

      window.hideSimFab();
      window.showFabHome();
    });

    // ------------------------------------------------------
    // HOME → UPLOAD
    // ------------------------------------------------------
    btnHomeUpload?.addEventListener("click", () => {
      showApp();
      hideAllPanels();
      painelEstudo?.classList.remove("hidden");
      painelUpload?.classList.remove("hidden");

      setView("Plano a partir do PDF", "Envie seu material e a Liora monta um plano completo.");

      window.hideSimFab();
      window.showFabHome();
    });

    // ------------------------------------------------------
    // HOME → SIMULADOS
    // ------------------------------------------------------
    function goSimulados() {
      showApp();
      hideAllPanels();
      areaSimulado?.classList.remove("hidden");

      setView("Simulados inteligentes", "Monte simulados com IA por banca, tema e dificuldade.");

      window.showSimFab();
      window.showFabHome();
    }

    btnHomeSimulados?.addEventListener("click", goSimulados);

    // ------------------------------------------------------
    // HOME → DASHBOARD  (🔥 FIX AQUI)
    // ------------------------------------------------------
    function goDashboard() {
      showApp();
      hideAllPanels();
      areaDashboard?.classList.remove("hidden");

      setView("Meu desempenho", "Veja o resumo dos seus simulados.");

      window.hideSimFab();
      window.showFabHome();

      // 🔥 CORREÇÃO DEFINITIVA: atualiza dashboard ao abrir
      if (window.lioraDashboard && typeof window.lioraDashboard.atualizar === "function") {
        window.lioraDashboard.atualizar();
      }
    }

    btnHomeDashboard?.addEventListener("click", goDashboard);

    // expõe globalmente para simulados.js
    window.homeDashboard = goDashboard;

    // ------------------------------------------------------
    // ESTADO INICIAL
    // ------------------------------------------------------
    hideAllPanels();
    showHome();
    window.hideSimFab();
    window.hideFabHome();

    console.log("🟢 nav-home.js OK");
  });
})();
