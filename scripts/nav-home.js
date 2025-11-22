// ==========================================================
// 🧠 LIORA — HOME COMERCIAL (APP LAYOUT FINAL + FAB HOME)
// - Controla visibilidade das áreas
// - Só exibe 'area-sessoes' quando houver sessões geradas
// - Evita que o box preto apareça fora de hora
// ==========================================================
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------
    // ELEMENTOS
    // -------------------------------
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

    // -------------------------------
    // CHECK
    // -------------------------------
    const required = {
      home, app,
      homeTema, homeUpload, homeSimulados, homeDashboard,
      fabHome,
      painelEstudo, painelTema, painelUpload,
      areaPlano, areaSessoes, areaSimulado, areaDashboard,
      viewTitle, viewSubtitle,
    };

    for (const [k, el] of Object.entries(required)) {
      if (!el) {
        console.error("❌ NAV-HOME — elemento ausente:", k);
        return;
      }
    }

    // -------------------------------
    // FUNÇÕES UTILITÁRIAS
    // -------------------------------
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

    function existePlano() {
      return (
        window.lioraWizardState &&
        Array.isArray(window.lioraWizardState.sessoes) &&
        window.lioraWizardState.sessoes.length > 0
      );
    }

    // -------------------------------
    // TELAS
    // -------------------------------
    function entrarTema() {
      mostrarWorkspace();
      esconderTudo();

      viewTitle.textContent = "Estudo por tema";
      viewSubtitle.textContent =
        "Monte um plano de estudo personalizado a partir de um assunto.";

      painelEstudo.classList.remove("hidden");
      painelTema.classList.remove("hidden");
      areaPlano.classList.remove("hidden");

      if (existePlano()) areaSessoes.classList.remove("hidden");
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

      if (existePlano()) areaSessoes.classList.remove("hidden");
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

    // -------------------------------
    // EVENTOS
    // -------------------------------
    homeTema.onclick = entrarTema;
    homeUpload.onclick = entrarUpload;
    homeSimulados.onclick = entrarSimulados;
    homeDashboard.onclick = entrarDashboard;

    fabHome.onclick = mostrarHome;

    // -------------------------------
    // ESTADO INICIAL
    // -------------------------------
    mostrarHome();

    // Exponho a função para que o CORE possa forçar atualização
    window.lioraRefreshNav = function () {
      if (home.style.display !== "none") return; // ainda na home
      if (existePlano()) {
        areaSessoes.classList.remove("hidden");
      } else {
        areaSessoes.classList.add("hidden");
      }
    };
  });
})();
