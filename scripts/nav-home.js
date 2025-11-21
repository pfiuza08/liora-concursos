// ==========================================================
// 🧠 LIORA — HOME COMERCIAL (v2)
// Com verificação de elementos e fallback seguro
// ==========================================================
(function () {
  document.addEventListener("DOMContentLoaded", () => {

    const home = document.getElementById("liora-home");

    // Botões da home
    const homeTema = document.getElementById("home-tema");
    const homeUpload = document.getElementById("home-upload");
    const homeSimulados = document.getElementById("home-simulados");
    const homeDashboard = document.getElementById("home-dashboard");

    // Painéis da aplicação
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

    // ================================
    // 👉 VERIFICAÇÃO DE EXISTÊNCIA
    // ================================
    const required = {
      home,
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

    for (const [key, value] of Object.entries(required)) {
      if (!value) {
        console.error(`❌ NAV-HOME ERRO: Elemento não encontrado → ${key}`);
        console.log("Dica: Verifique o ID no HTML.");
        return; // aborta a navegação, mas não trava o app
      }
    }

    console.log("🟢 NAV-HOME: todos os elementos foram encontrados com sucesso.");

    // ================================
    // 👉 Funções de navegação
    // ================================
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
      esconderTudo();
      painelTema.style.display = "block";
      areaPlano.style.display = "block";
      areaSessoes.style.display = "block";
      btnTema.click();
    }

    function entrarUpload() {
      home.style.display = "none";
      esconderTudo();
      painelUpload.style.display = "block";
      areaPlano.style.display = "block";
      areaSessoes.style.display = "block";
      btnUpload.click();
    }

    function entrarSimulados() {
      home.style.display = "none";
      esconderTudo();
      areaSimulado.style.display = "block";
      btnSimulados.click();
    }

    function entrarDashboard() {
      home.style.display = "none";
      esconderTudo();
      areaDashboard.style.display = "block";
      btnDashboard.click();
    }

    // ================================
    // 👉 Eventos (somente se existir)
    // ================================
    homeTema.onclick = entrarTema;
    homeUpload.onclick = entrarUpload;
    homeSimulados.onclick = entrarSimulados;
    homeDashboard.onclick = entrarDashboard;

    // Começa na HOME
    esconderTudo();
    home.style.display = "block";

  });
})();
