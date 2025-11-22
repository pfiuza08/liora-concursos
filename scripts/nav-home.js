// ==========================================================
// 🧠 LIORA — HOME COMERCIAL (APP LAYOUT FINAL + FAB HOME) v7
// - Home fullscreen
// - Workspace único (#liora-app)
// - Navegação: Tema, Upload, Simulados, Dashboard
// - Wizard (#liora-sessoes) só é exibido pelo core.js
//   depois que existirem sessões
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

    // FAB "Início"
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

    // ------------------------------------------------------
    // Helpers
    // ------------------------------------------------------
    function esconderTudo() {
      painelEstudo.classList.add("hidden");
      painelTema.classList.add("hidden");
      painelUpload.classList.add("hidden");
      areaPlano.classList.add("hidden");
      areaSimulado.classList.add("hidden");
      areaDashboard.classList.add("hidden");

      // 👇 Wizard SEMPRE some quando trocamos de tela
      areaSessoes.classList.add("hidden");
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

    // ------------------------------------------------------
    // Entrar em cada modo
    // ------------------------------------------------------
    function entrarTema() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Estudo por tema";
      viewSubtitle.textContent =
        "Monte um plano de estudo personalizado a partir de um assunto.";

      painelEstudo.classList.remove("hidden");
      painelTema.classList.remove("hidden");
      areaPlano.classList.remove("hidden");

      // ❌ NÃO mostramos o wizard aqui.
      // Ele só será exibido pelo core.js quando as sessões existirem.
    }

    function entrarUpload() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Estudo a partir de PDF";
      viewSubtitle.textContent =
        "Envie um material em PDF para gerar um plano de estudo.";

      painelEstudo.classList.remove("hidden");
      painelUpload.classList.remove("hidden");
      areaPlano.classList.remove("hidden");
    }

    function entrarSimulados() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Simulados";
      viewSubtitle.textContent =
        "Monte provas com perfil de banca, quantidade de questões e tempo de prova.";

      areaSimulado.classList.remove("hidden");
    }

    function entrarDashboard() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Minha evolução";
      viewSubtitle.textContent =
        "Resumo dos seus simulados e desempenho neste dispositivo.";

      areaDashboard.classList.remove("hidden");

      if (window.lioraRenderDashboard) {
        window.lioraRenderDashboard();
      }
    }

    // ------------------------------------------------------
    // Ligações
    // ------------------------------------------------------
    homeTema.addEventListener("click", entrarTema);
    homeUpload.addEventListener("click", entrarUpload);
    homeSimulados.addEventListener("click", entrarSimulados);
    homeDashboard.addEventListener("click", entrarDashboard);

    fabHome.addEventListener("click", mostrarHome);

    // Estado inicial
    mostrarHome();
  });
})();
