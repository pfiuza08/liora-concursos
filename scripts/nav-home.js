// ==========================================================
// 🧠 LIORA — HOME COMERCIAL (APP LAYOUT)
// Home ocupa a tela; depois abre um único workspace (liora-app)
// ==========================================================
(function () {
  document.addEventListener("DOMContentLoaded", () => {

    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    // Botões da home
    const homeTema = document.getElementById("home-tema");
    const homeUpload = document.getElementById("home-upload");
    const homeSimulados = document.getElementById("home-simulados");
    const homeDashboard = document.getElementById("home-dashboard");

    // Painéis
    const painelTema = document.getElementById("painel-tema");
    const painelUpload = document.getElementById("painel-upload");
    const areaPlano = document.getElementById("area-plano");
    const areaSessoes = document.getElementById("liora-sessoes");
    const areaSimulado = document.getElementById("area-simulado");
    const areaDashboard = document.getElementById("area-dashboard");

    const required = {
      home,
      app,
      homeTema,
      homeUpload,
      homeSimulados,
      homeDashboard,
      painelTema,
      painelUpload,
      areaPlano,
      areaSessoes,
      areaSimulado,
      areaDashboard
    };

    for (const [key, el] of Object.entries(required)) {
      if (!el) {
        console.error(`❌ NAV-HOME ERRO: Elemento não encontrado → ${key}`);
        return;
      }
    }

    function esconderTudo() {
      painelTema.style.display = "none";
      painelUpload.style.display = "none";
      areaPlano.style.display = "none";
      areaSessoes.style.display = "none";
      areaSimulado.style.display = "none";
      areaDashboard.style.display = "none";
    }

    function entrarTema() {
      home.style.display = "none";
      app.style.display = "block";
      esconderTudo();

      painelTema.style.display = "block";
      areaPlano.style.display = "block";
      if (areaSessoes) areaSessoes.style.display = "block";
    }

    function entrarUpload() {
      home.style.display = "none";
      app.style.display = "block";
      esconderTudo();

      painelUpload.style.display = "block";
      areaPlano.style.display = "block";
      if (areaSessoes) areaSessoes.style.display = "block";
    }

    function entrarSimulados() {
      home.style.display = "none";
      app.style.display = "block";
      esconderTudo();

      areaSimulado.style.display = "block";
    }

    function entrarDashboard() {
      home.style.display = "none";
      app.style.display = "block";
      esconderTudo();

      areaDashboard.style.display = "block";
    }

    // Ligações
    homeTema.onclick = entrarTema;
    homeUpload.onclick = entrarUpload;
    homeSimulados.onclick = entrarSimulados;
    homeDashboard.onclick = entrarDashboard;

    // Estado inicial
    app.style.display = "none";
    esconderTudo();
    home.style.display = "block";
  });
})();
