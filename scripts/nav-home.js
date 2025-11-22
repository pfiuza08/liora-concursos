// ==============================================================
// 🧠 LIORA — HOME COMERCIAL (APP LAYOUT FINAL + FAB HOME)
// - Home fullscreen
// - Workspace único (#liora-app)
// - Navegação: Tema, Upload, Simulados, Dashboard
// - CORRIGIDO: area-sessoes só aparece quando existem sessões
// ==============================================================

(function () {
  document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // ELEMENTOS
    // ==============================
    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    const homeTema = document.getElementById("home-tema");
    const homeUpload = document.getElementById("home-upload");
    const homeSimulados = document.getElementById("home-simulados");
    const homeDashboard = document.getElementById("home-dashboard");

    const fabHome = document.getElementById("fab-home");

    const painelEstudo = document.getElementById("painel-estudo");
    const painelTema = document.getElementById("painel-tema");
    const painelUpload = document.getElementById("painel-upload");

    const areaPlano = document.getElementById("area-plano");
    const areaSessoes = document.getElementById("liora-sessoes");
    const areaSimulado = document.getElementById("area-simulado");
    const areaDashboard = document.getElementById("area-dashboard");

    const viewTitle = document.getElementById("liora-view-title");
    const viewSubtitle = document.getElementById("liora-view-subtitle");

    // Segurança
    const required = {
      home, app,
      homeTema, homeUpload, homeSimulados, homeDashboard,
      fabHome,
      painelEstudo, painelTema, painelUpload,
      areaPlano, areaSessoes, areaSimulado, areaDashboard,
      viewTitle, viewSubtitle
    };

    for (const k in required) {
      if (!required[k]) {
        console.error("❌ NAV-HOME ERRO: elemento não encontrado →", k);
        return;
      }
    }

    // ==============================
    // FUNÇÕES AUXILIARES
    // ==============================
    function esconderTudo() {
      painelEstudo.classList.add("hidden");
      painelTema.classList.add("hidden");
      painelUpload.classList.add("hidden");
      areaPlano.classList.add("hidden");
      areaSessoes.classList.add("hidden");
      areaSimulado.classList.add("hidden");
      areaDashboard.classList.add("hidden");
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

    // ==============================
    // 🚨 NOVO → função global chamada pelo CORE
    // Somente exibe sessões caso existam
    // ==============================
    window.lioraMostrarSessoes = function (existePlano) {
      if (!existePlano) {
        areaSessoes.classList.add("hidden");
      } else {
        areaSessoes.classList.remove("hidden");
      }
    };

    // ==============================
    // ENTRAR EM TEMA
    // ==============================
    function entrarTema() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Estudo por tema";
      viewSubtitle.textContent =
        "Monte um plano de estudo personalizado a partir de um assunto.";

      painelEstudo.classList.remove("hidden");
      painelTema.classList.remove("hidden");
      areaPlano.classList.remove("hidden");

      // Nunca mostrar sessões antes da hora
      window.lioraMostrarSessoes(false);
    }

    // ==============================
    // ENTRAR EM UPLOAD
    // ==============================
    function entrarUpload() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Estudo a partir de PDF";
      viewSubtitle.textContent =
        "Envie um material em PDF para gerar um plano de estudo.";

      painelEstudo.classList.remove("hidden");
      painelUpload.classList.remove("hidden");
      areaPlano.classList.remove("hidden");

      // Nunca mostrar sessões antes da geração
      window.lioraMostrarSessoes(false);
    }

    // ==============================
    // ENTRAR EM SIMULADOS
    // ==============================
    function entrarSimulados() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Simulados";
      viewSubtitle.textContent =
        "Monte provas com perfil de banca, quantidade de questões e tempo de prova.";

      areaSimulado.classList.remove("hidden");
      window.lioraMostrarSessoes(false);
    }

    // ==============================
    // ENTRAR EM DASHBOARD
    // ==============================
    function entrarDashboard() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Minha evolução";
      viewSubtitle.textContent =
        "Resumo dos seus simulados e desempenho neste dispositivo.";

      areaDashboard.classList.remove("hidden");
      window.lioraMostrarSessoes(false);

      if (window.lioraRenderDashboard) {
        window.lioraRenderDashboard();
      }
    }

    // ==============================
    // EVENTOS
    // ==============================
    homeTema.onclick = entrarTema;
    homeUpload.onclick = entrarUpload;
    homeSimulados.onclick = entrarSimulados;
    homeDashboard.onclick = entrarDashboard;

    fabHome.onclick = mostrarHome;

    // estado inicial
    mostrarHome();
  });
})();
