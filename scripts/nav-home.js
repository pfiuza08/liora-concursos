// ==========================================================
// 🧠 LIORA — HOME COMERCIAL (APP LAYOUT FINAL + FAB HOME)
// ==========================================================
(function () {
  document.addEventListener("DOMContentLoaded", () => {

    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    // Botões da HOME
    const homeTema = document.getElementById("home-tema");
    const homeUpload = document.getElementById("home-upload");
    const homeSimulados = document.getElementById("home-simulados");
    const homeDashboard = document.getElementById("home-dashboard");

    // FAB de retorno ao início
    const fabHome = document.getElementById("fab-home");

    // Painéis do workspace
    const painelEstudo = document.getElementById("painel-estudo");
    const painelTema = document.getElementById("painel-tema");
    const painelUpload = document.getElementById("painel-upload");
    const areaPlano = document.getElementById("area-plano");
    const areaSessoes = document.getElementById("liora-sessoes");
    const areaSimulado = document.getElementById("area-simulado");
    const areaDashboard = document.getElementById("area-dashboard");

    const viewTitle = document.getElementById("liora-view-title");
    const viewSubtitle = document.getElementById("liora-view-subtitle");

    const required = {
      home,
      app,
      homeTema,
      homeUpload,
      homeSimulados,
      homeDashboard,
      fabHome,
      painelEstudo,
      painelTema,
      painelUpload,
      areaPlano,
      areaSessoes,
      areaSimulado,
      areaDashboard,
      viewTitle,
      viewSubtitle,
    };

    for (const [key, el] of Object.entries(required)) {
      if (!el) {
        console.error(`❌ NAV-HOME ERRO: Elemento não encontrado → ${key}`);
        return;
      }
    }

    function esconderTudo() {
      painelEstudo.style.display = "none";
      painelTema.style.display = "none";
      painelUpload.style.display = "none";
      areaPlano.style.display = "none";
      areaSessoes.style.display = "none";
      areaSimulado.style.display = "none";
      areaDashboard.style.display = "none";
    }

    function mostrarHome() {
      home.style.display = "flex";
      app.style.display = "none";
      fabHome.style.display = "none";
      esconderTudo();
      viewTitle.textContent = "";
      viewSubtitle.textContent = "";
    }

    function mostrarWorkspace() {
      home.style.display = "none";
      app.style.display = "block";
      fabHome.style.display = "inline-flex";
    }

    function entrarTema() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Estudo por tema";
      viewSubtitle.textContent = "Monte um plano de estudo personalizado a partir de um assunto.";

      painelEstudo.style.display = "block";
      painelTema.style.display = "block";
      areaPlano.style.display = "block";
      if (areaSessoes) areaSessoes.style.display = "block";
    }

    function entrarUpload() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Estudo a partir de PDF";
      viewSubtitle.textContent = "Envie um material em PDF para gerar um plano de estudo.";

      painelEstudo.style.display = "block";
      painelUpload.style.display = "block";
      areaPlano.style.display = "block";
      if (areaSessoes) areaSessoes.style.display = "block";
    }

    function entrarSimulados() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Simulados";
      viewSubtitle.textContent = "Monte provas com perfil de banca e acompanhe seu desempenho.";

      areaSimulado.style.display = "block";
    }

    function entrarDashboard() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Minha evolução";
      viewSubtitle.textContent = "Histórico e estatísticas dos seus simulados.";

      areaDashboard.style.display = "block";
    }

    // Ligações HOME
    homeTema.addEventListener("click", entrarTema);
    homeUpload.addEventListener("click", entrarUpload);
    homeSimulados.addEventListener("click", entrarSimulados);
    homeDashboard.addEventListener("click", entrarDashboard);

    // FAB "Início"
    fabHome.addEventListener("click", mostrarHome);

    // Estado inicial
    mostrarHome();
  });
})();
