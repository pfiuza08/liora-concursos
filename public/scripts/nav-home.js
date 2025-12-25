// ==========================================================
// 🧭 LIORA — NAV-HOME v97-AUTH-STATEFUL
// - Gating por auth real (window.lioraAuth.user)
// - Reage a login/logout
// - Exibe usuário e botão SAIR
// ==========================================================

(function () {
  console.log("🔵 nav-home.js v97 carregado…");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS PRINCIPAIS
    // ------------------------------------------------------
    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    // header / área de usuário (ajuste IDs se necessário)
    const userLabel = document.getElementById("liora-user-label");
    const btnLogout = document.getElementById("liora-logout");

    // ------------------------------------------------------
    // REGISTRO DA HOME NO UI ROUTER
    // ------------------------------------------------------
    if (home && window.lioraUI) {
      window.lioraUI.register("liora-home", home);
    }

    // ------------------------------------------------------
    // GARANTE ESTADO GLOBAL DE AUTH
    // ------------------------------------------------------
    window.lioraAuth = window.lioraAuth || { user: null };

    // restaura sessão (se existir)
    try {
      const saved = localStorage.getItem("liora:user");
      if (saved && !window.lioraAuth.user) {
        window.lioraAuth.user = JSON.parse(saved);
        console.log("🔁 Sessão restaurada:", window.lioraAuth.user.email);
      }
    } catch (e) {
      console.warn("Falha ao restaurar sessão:", e);
    }

    // ------------------------------------------------------
    // ELEMENTOS DA HOME
    // ------------------------------------------------------
    const btnTema = document.getElementById("home-tema");
    const btnUpload = document.getElementById("home-upload");
    const btnSimulados = document.getElementById("home-simulados");
    const btnDashboard = document.getElementById("home-dashboard");

    const btnContinue = document.getElementById("home-continuar-estudo");
    const btnMeusPlanos = document.getElementById("home-meus-planos");
    const resumoEl = document.getElementById("home-resumo-estudo");

    const fabHome = document.getElementById("fab-home");
    const simFab = document.getElementById("sim-fab");

    // MODAL — MEUS PLANOS
    const meusPlanosModalId = "meus-planos-modal";
    const meusPlanosList = document.getElementById("meus-planos-list");

    // ------------------------------------------------------
    // UI BÁSICA
    // ------------------------------------------------------
    function showApp() {
      home?.classList.add("hidden");
      app?.classList.remove("hidden");
      fabHome?.classList.remove("hidden");
    }

    function showHome() {
      app?.classList.add("hidden");
      home?.classList.remove("hidden");
      fabHome?.classList.add("hidden");
      simFab?.classList.add("hidden");
    }

    function hideAllAppSections() {
      [
        "painel-estudo",
        "painel-tema",
        "painel-upload",
        "liora-sessoes",
        "area-plano",
        "area-simulado",
        "area-dashboard",
      ].forEach((id) =>
        document.getElementById(id)?.classList.add("hidden")
      );
    }

    // ------------------------------------------------------
    // AUTH UI STATE
    // ------------------------------------------------------
    function refreshAuthUI() {
      const user = window.lioraAuth.user;

      if (user) {
        if (userLabel) {
          userLabel.textContent = user.email;
          userLabel.classList.remove("hidden");
        }
        btnLogout?.classList.remove("hidden");
      } else {
        userLabel?.classList.add("hidden");
        btnLogout?.classList.add("hidden");
      }
    }

    // logout global
    window.lioraLogout = function () {
      console.log("🚪 Logout efetuado");
      window.lioraAuth.user = null;
      localStorage.removeItem("liora:user");
      refreshAuthUI();
      showHome();
    };

    // reage ao login
    window.addEventListener("liora:auth-success", () => {
      console.log("🟢 Auth success recebido no nav");
      refreshAuthUI();
      showHome();
    });

    // inicial
    refreshAuthUI();

    // ------------------------------------------------------
    // NAVEGAÇÃO PRINCIPAL
    // ------------------------------------------------------
    function goToEstudoTema() {
      showApp();
      hideAllAppSections();
      qs("painel-estudo")?.classList.remove("hidden");
      qs("painel-tema")?.classList.remove("hidden");
      simFab?.classList.add("hidden");
      window.dispatchEvent(new Event("liora:enter-estudo-tema"));
    }

    function goToEstudoUpload() {
      showApp();
      hideAllAppSections();
      qs("painel-estudo")?.classList.remove("hidden");
      qs("painel-upload")?.classList.remove("hidden");
      simFab?.classList.add("hidden");
      window.dispatchEvent(new Event("liora:enter-estudo-upload"));
    }

    function goToSimulados() {
      if (!window.lioraAuth.user) {
        console.log("🔐 Simulados → login necessário");
        window.lioraUI?.show("liora-auth");
        return;
      }

      showApp();
      hideAllAppSections();
      qs("area-simulado")?.classList.remove("hidden");
      simFab?.classList.remove("hidden");
      window.dispatchEvent(new Event("liora:enter-simulado"));
      window.lioraPreFillSimulado?.();
    }

    function goToDashboard() {
      if (!window.lioraAuth.user) {
        console.log("🔐 Dashboard → login necessário");
        window.lioraUI?.show("liora-auth");
        return;
      }

      showApp();
      hideAllAppSections();
      qs("area-dashboard")?.classList.remove("hidden");
      simFab?.classList.add("hidden");
      window.lioraDashboard?.atualizar?.();
    }

    window.homeDashboard = goToDashboard;

    // ------------------------------------------------------
    // ATUALIZAR HOME
    // ------------------------------------------------------
    function atualizarHome() {
      try {
        const sm = window.lioraEstudos;
        if (!sm) {
          btnContinue?.classList.add("hidden");
          resumoEl.textContent =
            "Gere um plano de estudo por Tema ou PDF para começar.";
          return;
        }

        const plano = sm.getPlanoAtivo?.();
        if (!plano) {
          btnContinue?.classList.add("hidden");
          resumoEl.textContent =
            "Gere um plano de estudo por Tema ou PDF para começar.";
          return;
        }

        btnContinue?.classList.remove("hidden");
        resumoEl.textContent =
          `Tema ativo: ${plano.tema} — ${plano.sessoes.length} sessões`;
      } catch (e) {
        console.warn("Erro ao atualizar home:", e);
      }
    }

    setTimeout(atualizarHome, 150);
    window.addEventListener("liora:plan-updated", atualizarHome);

    // ------------------------------------------------------
    // BIND DE BOTÕES
    // ------------------------------------------------------
    btnTema?.addEventListener("click", goToEstudoTema);
    btnUpload?.addEventListener("click", goToEstudoUpload);
    btnSimulados?.addEventListener("click", goToSimulados);
    btnDashboard?.addEventListener("click", goToDashboard);

    btnContinue?.addEventListener("click", () =>
      window.lioraContinueStudy?.()
    );

    btnMeusPlanos?.addEventListener("click", abrirMeusPlanosModal);

    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    simFab?.addEventListener("click", () => {
      window.dispatchEvent(new Event("liora:abrir-simulado"));
    });

    btnLogout?.addEventListener("click", window.lioraLogout);

    console.log("🟢 NAV-HOME v97 pronto!");
  });

  // helper
  function qs(id) {
    return document.getElementById(id);
  }
})();
