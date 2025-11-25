// ==========================================================
// 🧭 LIORA — NAV-HOME v71
// - Home → Tema / Upload / Simulados / Dashboard
// - Controla a troca para o workspace
// - Garante que "Meu Desempenho" abra area-dashboard
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v71) carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // HOME
    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    const btnTema = document.getElementById("home-tema");
    const btnUpload = document.getElementById("home-upload");
    const btnSimulados = document.getElementById("home-simulados");
    const btnDashboard = document.getElementById("home-dashboard");

    // PAINÉIS
    const painelEstudo = document.getElementById("painel-estudo");
    const painelTema = document.getElementById("painel-tema");
    const painelUpload = document.getElementById("painel-upload");
    const painelSim = document.getElementById("area-simulado");
    const painelDashboard = document.getElementById("area-dashboard");

    // FAB
    const fabHome = document.getElementById("fab-home");

    function abrirApp() {
      home.classList.add("hidden");
      app.classList.remove("hidden");
    }

    function esconderTodos() {
      painelEstudo.classList.add("hidden");
      painelTema.classList.add("hidden");
      painelUpload.classList.add("hidden");
      painelSim.classList.add("hidden");
      painelDashboard.classList.add("hidden");
    }

    // ======================================================
    // EVENTOS — HOME
    // ======================================================

    btnTema.onclick = () => {
      abrirApp();
      esconderTodos();
      painelEstudo.classList.remove("hidden");
      painelTema.classList.remove("hidden");
      document.getElementById("liora-view-title").textContent = "Estudo por tema";
      document.getElementById("liora-view-subtitle").textContent = "Gere um plano de estudo personalizado.";
    };

    btnUpload.onclick = () => {
      abrirApp();
      esconderTodos();
      painelEstudo.classList.remove("hidden");
      painelUpload.classList.remove("hidden");
      document.getElementById("liora-view-title").textContent = "Estudo por PDF";
      document.getElementById("liora-view-subtitle").textContent = "Envie seu PDF para gerar um plano.";
    };

    btnSimulados.onclick = () => {
      abrirApp();
      esconderTodos();
      painelSim.classList.remove("hidden");
      document.getElementById("liora-view-title").textContent = "Simulados";
      document.getElementById("liora-view-subtitle").textContent = "Avalie seu desempenho.";
    };

    btnDashboard.onclick = () => {
      abrirApp();
      esconderTodos();
      painelDashboard.classList.remove("hidden");
      document.getElementById("liora-view-title").textContent = "Meu Desempenho";
      document.getElementById("liora-view-subtitle").textContent = "Acompanhe sua evolução.";
    };

    // ======================================================
    // FAB HOME
    // ======================================================
    fabHome.onclick = () => {
      home.classList.remove("hidden");
      app.classList.add("hidden");
      esconderTodos();
    };

  });
})();
