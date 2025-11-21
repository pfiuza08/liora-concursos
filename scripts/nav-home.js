// ==========================================================
// 🧠 LIORA — HOME COMERCIAL v1
// Tela inicial: "O que você deseja fazer hoje?"
// ==========================================================
(function () {
  document.addEventListener("DOMContentLoaded", () => {

    const home = document.getElementById("liora-home");

    // Painel e modos existentes
    const painelTema = document.getElementById("painel-tema");
    const painelUpload = document.getElementById("painel-upload");
    const areaPlano = document.getElementById("area-plano");
    const areaSessoes = document.getElementById("liora-sessoes");
    const areaSimulado = document.getElementById("area-simulado");
    const areaDashboard = document.getElementById("area-dashboard");

    const btnTema = document.getElementById("modo-tema");
    const btnUpload = document.getElementById("modo-upload");
    const btnSimulados = document.getElementById("modo-simulados");
    const btnDashboard = document.getElementById("modo-dashboard");

    // Botões da HOME
    const homeTema = document.getElementById("home-tema");
    const homeUpload = document.getElementById("home-upload");
    const homeSimulados = document.getElementById("home-simulados");
    const homeDashboard = document.getElementById("home-dashboard");

    // Esconde tudo menos a HOME
    function mostrarHome() {
      painelTema.style.display = "none";
      painelUpload.style.display = "none";
      areaPlano.style.display = "none";
      areaSessoes.style.display = "none";
      areaSimulado.style.display = "none";
      areaDashboard.style.display = "none";

      home.style.display = "block";
    }

    // Mostra estudo por tema
    function entrarTema() {
      home.style.display = "none";
      painelTema.style.display = "block";
      painelUpload.style.display = "none";
      areaPlano.style.display = "block";
      areaSessoes.style.display = "block";
      areaSimulado.style.display = "none";
      areaDashboard.style.display = "none";
      btnTema.click();
    }

    // Mostra estudo por upload
    function entrarUpload() {
      home.style.display = "none";
      painelTema.style.display = "none";
      painelUpload.style.display = "block";
      areaPlano.style.display = "block";
      areaSessoes.style.display = "block";
      areaSimulado.style.display = "none";
      areaDashboard.style.display = "none";
      btnUpload.click();
    }

    // Mostra simulados
    function entrarSimulados() {
      home.style.display = "none";
      painelTema.style.display = "none";
      painelUpload.style.display = "none";
      areaPlano.style.display = "none";
      areaSessoes.style.display = "none";
      areaSimulado.style.display = "block";
      areaDashboard.style.display = "none";
      btnSimulados.click();
    }

    // Mostra dashboard
    function entrarDashboard() {
      home.style.display = "none";
      painelTema.style.display = "none";
      painelUpload.style.display = "none";
      areaPlano.style.display = "none";
      areaSessoes.style.display = "none";
      areaSimulado.style.display = "none";
      areaDashboard.style.display = "block";
      btnDashboard.click();
    }

    // Ligações da HOME
    homeTema.onclick = entrarTema;
    homeUpload.onclick = entrarUpload;
    homeSimulados.onclick = entrarSimulados;
    homeDashboard.onclick = entrarDashboard;

    // Inicializa mostrando a HOME
    mostrarHome();
  });
})();
