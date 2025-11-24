// =============================================================
// 🏠 NAV-HOME v7 — Navegação Comercial Completa
// - Tema / Upload / Simulados / Dashboard
// - Controla FAB Home
// - Controla FAB de Simulados
// - Controla o workspace
// =============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ELEMENTOS
  const home = document.getElementById("liora-home");
  const app = document.getElementById("liora-app");
  const areaSimulado = document.getElementById("area-simulado");
  const areaDashboard = document.getElementById("area-dashboard");
  const painelEstudo = document.getElementById("painel-estudo");
  const painelTema = document.getElementById("painel-tema");
  const painelUpload = document.getElementById("painel-upload");

  const btnHomeTema = document.getElementById("home-tema");
  const btnHomeUpload = document.getElementById("home-upload");
  const btnHomeSim = document.getElementById("home-simulados");
  const btnHomeDash = document.getElementById("home-dashboard");

  const fabHome = document.getElementById("fab-home");

  // FAB simulados (declarado no simulados.js)
  const showSimFab = window.showSimFab;
  const hideSimFab = window.hideSimFab;

  // --------------------------------------
  // FUNÇÕES UTILITÁRIAS
  // --------------------------------------
  function showHome() {
    home.classList.remove("hidden");
    app.classList.add("hidden");
    hideSimFab();
    fabHome.style.display = "none";
  }

  function showApp() {
    home.classList.add("hidden");
    app.classList.remove("hidden");
    fabHome.style.display = "flex";
  }

  function hideAllPanels() {
    painelEstudo.classList.add("hidden");
    painelTema.classList.add("hidden");
    painelUpload.classList.add("hidden");
    areaSimulado.classList.add("hidden");
    areaDashboard.classList.add("hidden");
  }

  // --------------------------------------
  // HOME → TEMA
  // --------------------------------------
  btnHomeTema.addEventListener("click", () => {
    hideAllPanels();
    showApp();

    painelEstudo.classList.remove("hidden");
    painelTema.classList.remove("hidden");

    hideSimFab();
  });

  // --------------------------------------
  // HOME → UPLOAD
  // --------------------------------------
  btnHomeUpload.addEventListener("click", () => {
    hideAllPanels();
    showApp();

    painelEstudo.classList.remove("hidden");
    painelUpload.classList.remove("hidden");

    hideSimFab();
  });

  // --------------------------------------
  // HOME → SIMULADOS
  // --------------------------------------
  btnHomeSim.addEventListener("click", () => {
    hideAllPanels();
    showApp();

    areaSimulado.classList.remove("hidden");

    showSimFab();   // <- FAB aparece aqui
  });

  // --------------------------------------
  // HOME → DASHBOARD
  // --------------------------------------
  btnHomeDash.addEventListener("click", () => {
    hideAllPanels();
    showApp();

    areaDashboard.classList.remove("hidden");

    hideSimFab();
  });

  // --------------------------------------
  // FAB HOME (voltar ao início)
  // --------------------------------------
  fabHome.addEventListener("click", () => {
    showHome();
  });

  // Expor para outros módulos
  window.homeDashboard = () => {
    hideAllPanels();
    showApp();
    areaDashboard.classList.remove("hidden");
    hideSimFab();
  };
});
