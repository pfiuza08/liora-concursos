// ==========================================================
// 🧭 LIORA — NAV-HOME v84-COMMERCIAL-PREMIUM (FINAL)
// ----------------------------------------------------------
// Versão estável com fixes de navegação:
// ✔ FAB "Início" aparece sempre que estiver no app (fora da home)
// ✔ FAB do Simulado (⚙) aparece ao entrar em Simulados
// ✔ FAB do Simulado some ao voltar para Estudo/Dashboard/Home
// ✔ Continue Study 100% funcional com Core v74/75 + Estudos v2
// ✔ Home sempre reflete o plano ativo do Study Manager
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v84) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------
    // ELEMENTOS DA INTERFACE
    // ------------------------------------------------------
    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    const btnTema = document.getElementById("home-tema");
    const btnUpload = document.getElementById("home-upload");
    const btnSimulados = document.getElementById("home-simulados");
    const btnDashboard = document.getElementById("home-dashboard");

    const btnContinue = document.getElementById("home-continuar-estudo");
    const resumoEl = document.getElementById("home-resumo-estudo");

    const fabHome = document.getElementById("fab-home");
    const simFab = document.getElementById("sim-fab");
    const simModalBackdrop = document.getElementById("sim-modal-backdrop");

    // Estado inicial dos FABs
    if (fabHome) fabHome.classList.add("hidden");
    if (simFab) simFab.classList.add("hidden");

    // ------------------------------------------------------
    // UI HELPERS
    // ------------------------------------------------------
    function showApp() {
      if (!home || !app) return;
      home.classList.add("hidden");
      app.classList.remove("hidden");

      // Sempre que entrar no app, mostra o FAB Home
      if (fabHome) fabHome.classList.remove("hidden");
    }

    function showHome() {
      if (!home || !app) return;
      app.classList.add("hidden");
      home.classList.remove("hidden");

      // Na home, esconde FAB Home e FAB Simulado
      if (fabHome) fabHome.classList.add("hidden");
      if (simFab) simFab.classList.add("hidden");

      // Fecha o modal de simulado, se estiver aberto
      if (simModalBackdrop) simModalBackdrop.classList.add("hidden");
    }

    function hideAllAppSections() {
      document.getElementById("painel-estudo")?.classList.add("hidden");
      document.getElementById("painel-tema")?.classList.add("hidden");
      document.getElementById("painel-upload")?.classList.add("hidden");
      document.getElementById("liora-sessoes")?.classList.add("hidden");
      document.getElementById("area-plano")?.classList.add("hidden");
      document.getElementById("area-simulado")?.classList.add("hidden");
      document.getElementById("area-dashboard")?.classList.add("hidden");
    }

    function goToEstudoTema() {
      showApp();
      hideAllAppSections();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-tema")?.classList.remove("hidden");

      // Estudo → sem FAB do simulado
      if (simFab) simFab.classList.add("hidden");
      window.dispatchEvent(new Event("liora:enter-estudo-tema"));
    }

    function goToEstudoUpload() {
      showApp();
      hideAllAppSections();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-upload")?.classList.remove("hidden");

      if (simFab) simFab.classList.add("hidden");
      window.dispatchEvent(new Event("liora:enter-estudo-upload"));
    }

    function goToSimulados() {
      showApp();
      hideAllAppSections();
      document.getElementById("area-simulado")?.classList.remove("hidden");

      // Mostrar FAB do simulado quando estiver na área de simulados
      if (simFab) simFab.classList.remove("hidden");

      // Deixar claro para outros scripts (simulados.js) que entramos em Simulados
      window.dispatchEvent(new Event("liora:enter-simulado"));

      if (window.lioraPreFillSimulado) window.lioraPreFillSimulado();
    }

    function goToDashboard() {
      showApp();
      hideAllAppSections();
      document.getElementById("area-dashboard")?.classList.remove("hidden");

      // Dashboard não precisa do FAB do simulado
      if (simFab) simFab.classList.add("hidden");
      window.dispatchEvent(new Event("liora:enter-dashboard"));
    }

    // ------------------------------------------------------
    // ATUALIZAÇÃO DA HOME
    // ------------------------------------------------------
    function atualizarHome() {
      try {
        const sm = window.lioraEstudos;

        if (!sm) {
          console.log("A4: Estudos ainda não carregado.");
          btnContinue?.classList.add("hidden");
          if (resumoEl) {
            resumoEl.textContent =
              "Gere um plano de estudo por Tema ou PDF para começar.";
          }
          return;
        }

        const plano = sm.getPlanoAtivo();

        if (!plano) {
          console.log("A4: Nenhum plano ativo.");
          btnContinue?.classList.add("hidden");
          if (resumoEl) {
            resumoEl.textContent =
              "Gere um plano de estudo por Tema ou PDF para começar.";
          }
          return;
        }

        btnContinue?.classList.remove("hidden");
        if (resumoEl) {
          resumoEl.textContent = `Tema ativo: ${plano.tema} — ${plano.sessoes.length} sessões`;
        }

        console.log("A4: Plano ativo identificado:", plano);
      } catch (e) {
        console.warn("Erro ao atualizar home:", e);
      }
    }

    // Atualização inicial + listeners dos eventos do Study Manager
    setTimeout(atualizarHome, 150);
    window.addEventListener("liora:plan-updated", atualizarHome);
    window.addEventListener("liora:review-updated", atualizarHome);

    // ======================================================
    // ⭐ CONTINUE STUDY — VERSÃO FINAL
    // ======================================================
    window.lioraContinueStudy = function () {
      try {
        const sm = window.lioraEstudos;
        console.log("🟦 CONTINUAR ESTUDO clicado. sm =", sm);

        if (!sm) {
          return alert("Aguarde o carregamento dos dados de estudo.");
        }

        const plano = sm.getPlanoAtivo();
        if (!plano) {
          return alert("Você ainda não tem um plano criado.");
        }

        console.log("▶ ContinueStudy: plano ativo encontrado:", plano.tema);

        // Próxima sessão incompleta
        let idx = plano.sessoes.findIndex((s) => (s.progresso || 0) < 100);
        if (idx < 0) idx = plano.sessoes.length - 1;

        console.log("➡ Próxima sessão selecionada:", idx + 1);

        window.lioraModoRevisao = false;

        // Reconstrói o wizard a partir do plano ativo
        if (typeof window.lioraSetWizardFromPlano === "function") {
          const ok = window.lioraSetWizardFromPlano(plano, idx);
          if (!ok) {
            console.error("❌ Falha ao reconstruir wizard");
            alert("Erro ao abrir sessão. Recarregue a página.");
            return;
          }
        } else {
          console.error("❌ lioraSetWizardFromPlano não existe! Core não carregou?");
          alert("Erro interno. Recarregue a página.");
          return;
        }

        // Abre área do app na parte de estudos
        showApp();
        hideAllAppSections();
        document.getElementById("liora-sessoes")?.classList.remove("hidden");
        document.getElementById("area-plano")?.classList.remove("hidden");

        // Continue Study não é simulados → esconder FAB do simulado
        if (simFab) simFab.classList.add("hidden");

        // Move para a sessão correta
        if (typeof window.lioraIrParaSessao === "function") {
          window.lioraIrParaSessao(idx, false);
        } else {
          console.error("❌ lioraIrParaSessao não existe!");
          alert("Erro ao abrir sessão. Recarregue a página.");
        }
      } catch (e) {
        console.error("❌ Erro no ContinueStudy:", e);
      }
    };

    // ======================================================
    // BOTÕES DE NAVEGAÇÃO
    // ======================================================
    btnTema?.addEventListener("click", () => {
      goToEstudoTema();
    });

    btnUpload?.addEventListener("click", () => {
      goToEstudoUpload();
    });

    btnSimulados?.addEventListener("click", () => {
      goToSimulados();
    });

    btnDashboard?.addEventListener("click", () => {
      goToDashboard();
    });

    btnContinue?.addEventListener("click", () => {
      window.lioraContinueStudy();
    });

    // FAB HOME
    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    console.log("🟢 NAV-HOME v84 pronto!");
  });
})();
