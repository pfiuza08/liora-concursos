// ==========================================================
// 🧭 LIORA — NAV-HOME v86-COMMERCIAL-PREMIUM
// ----------------------------------------------------------
// Novidades v86:
// ✔ Correção completa do modal do Simulado
// ✔ FAB ⚙ abre e fecha modal corretamente
// ✔ Suporte a id="sim-modal-close-btn"
// ✔ Fecha modal ao clicar fora
// ✔ Mantém toda a lógica de planos, continuar estudo,
//   FAB home, navegação e integração com Estudos v2
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v86) carregado...");

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
    const btnMeusPlanos = document.getElementById("home-meus-planos");
    const resumoEl = document.getElementById("home-resumo-estudo");

    const fabHome = document.getElementById("fab-home");
    const simFab = document.getElementById("sim-fab");

    // Modal do Simulado
    const simModalBackdrop = document.getElementById("sim-modal-backdrop");
    const simModalClose =
      document.getElementById("sim-modal-close-btn") ||
      document.getElementById("sim-modal-close");

    // Modal "Meus Planos"
    const meusPlanosModal = document.getElementById("meus-planos-modal");
    const meusPlanosList = document.getElementById("meus-planos-list");
    const meusPlanosFechar = document.getElementById("meus-planos-fechar");

    // Estado inicial
    fabHome?.classList.add("hidden");
    simFab?.classList.add("hidden");
    meusPlanosModal?.classList.add("hidden");

    // ------------------------------------------------------
    // UI HELPERS
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

      simModalBackdrop?.classList.add("hidden");
      simModalBackdrop?.classList.remove("visible");
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

      simFab?.classList.add("hidden");
      window.dispatchEvent(new Event("liora:enter-estudo-tema"));
    }

    function goToEstudoUpload() {
      showApp();
      hideAllAppSections();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-upload")?.classList.remove("hidden");

      simFab?.classList.add("hidden");
      window.dispatchEvent(new Event("liora:enter-estudo-upload"));
    }

    function goToSimulados() {
      showApp();
      hideAllAppSections();
      document.getElementById("area-simulado")?.classList.remove("hidden");

      simFab?.classList.remove("hidden");
      window.dispatchEvent(new Event("liora:enter-simulado"));

      if (window.lioraPreFillSimulado) window.lioraPreFillSimulado();
    }

    function goToDashboard() {
      showApp();
      hideAllAppSections();
      document.getElementById("area-dashboard")?.classList.remove("hidden");

      simFab?.classList.add("hidden");
      window.dispatchEvent(new Event("liora:enter-dashboard"));
    }

    // ------------------------------------------------------
    // ATUALIZAÇÃO DA HOME
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

        const plano = sm.getPlanoAtivo();
        if (!plano) {
          btnContinue?.classList.add("hidden");
          resumoEl.textContent =
            "Gere um plano de estudo por Tema ou PDF para começar.";
          return;
        }

        btnContinue?.classList.remove("hidden");
        resumoEl.textContent = `Tema ativo: ${plano.tema} — ${plano.sessoes.length} sessões`;

      } catch (e) {
        console.warn("Erro ao atualizar home:", e);
      }
    }

    setTimeout(atualizarHome, 150);
    window.addEventListener("liora:plan-updated", atualizarHome);
    window.addEventListener("liora:review-updated", atualizarHome);

    // ======================================================
    // ⭐ CONTINUE STUDY
    // ======================================================
    window.lioraContinueStudy = function () {
      try {
        const sm = window.lioraEstudos;
        if (!sm) return alert("Aguarde o carregamento dos dados.");

        const plano = sm.getPlanoAtivo();
        if (!plano) return alert("Você ainda não tem um plano criado.");

        let idx = plano.sessoes.findIndex((s) => (s.progresso || 0) < 100);
        if (idx < 0) idx = plano.sessoes.length - 1;

        if (typeof window.lioraSetWizardFromPlano === "function") {
          window.lioraSetWizardFromPlano(plano, idx);
        }

        showApp();
        hideAllAppSections();
        document.getElementById("liora-sessoes")?.classList.remove("hidden");
        document.getElementById("area-plano")?.classList.remove("hidden");

        simFab?.classList.add("hidden");

        if (typeof window.lioraIrParaSessao === "function") {
          window.lioraIrParaSessao(idx, false);
        }
      } catch (e) {
        console.error("Erro no ContinueStudy:", e);
      }
    };

    // ======================================================
    // 📚 MODAL "MEUS PLANOS"
    // ======================================================
    function fecharMeusPlanosModal() {
      meusPlanosModal?.classList.add("hidden");
    }

    function abrirMeusPlanosModal() {
      try {
        const sm = window.lioraEstudos;
        if (!sm) return alert("Aguarde o carregamento dos dados.");

        const planos =
          typeof sm.listarRecentes === "function" ? sm.listarRecentes(10) : [];

        meusPlanosList.innerHTML = "";

        if (!planos.length) {
          meusPlanosList.innerHTML =
            "<p class='liora-modal-empty'>Você ainda não tem planos salvos.</p>";
          meusPlanosModal.classList.remove("hidden");
          return;
        }

        planos.forEach((plano) => {
          const total = plano.sessoes.length;
          const concluidas = plano.sessoes.filter(
            (s) => (s.progresso || 0) >= 100
          ).length;
          const soma = plano.sessoes.reduce(
            (acc, s) => acc + (s.progresso || 0),
            0
          );
          const progressoMedio = total ? Math.round(soma / total) : 0;

          const item = document.createElement("button");
          item.className = "liora-plan-item";
          item.dataset.id = plano.id;

          item.innerHTML = `
            <div class="liora-plan-item-top">
              <h3 class="liora-plan-title">${plano.tema}</h3>
              <span class="liora-plan-badge">${total} sessões</span>
            </div>
            <div class="liora-plan-item-middle">
              <span class="liora-plan-progress">Progresso: ${progressoMedio}%</span>
              <span class="liora-plan-status">${concluidas}/${total} concluídas</span>
            </div>
            <div class="liora-plan-item-footer">
              <span class="liora-plan-dates">
                Criado em: ${plano.criadoEm || "—"}
                ${
                  plano.atualizadoEm && plano.atualizadoEm !== plano.criadoEm
                    ? ` • Atualizado: ${plano.atualizadoEm}`
                    : ""
                }
              </span>
              <span class="liora-plan-cta">Ativar plano</span>
            </div>
          `;

          item.addEventListener("click", () => ativarPlanoEIr(plano.id));
          meusPlanosList.appendChild(item);
        });

        meusPlanosModal.classList.remove("hidden");
      } catch (e) {
        console.error("Erro ao abrir modal Meus Planos:", e);
      }
    }

    function ativarPlanoEIr(planoId) {
      const sm = window.lioraEstudos;
      if (!sm) return;

      const planos =
        typeof sm.listarRecentes === "function" ? sm.listarRecentes(20) : [];
      const plano = planos.find((p) => p.id === planoId);
      if (!plano) return;

      if (typeof sm.ativarPlano === "function") {
        sm.ativarPlano(planoId);
      }

      if (typeof window.lioraSetWizardFromPlano === "function") {
        window.lioraSetWizardFromPlano(plano, 0);
      }

      showApp();
      hideAllAppSections();
      document.getElementById("liora-sessoes")?.classList.remove("hidden");
      document.getElementById("area-plano")?.classList.remove("hidden");

      window.lioraIrParaSessao?.(0, false);

      fecharMeusPlanosModal();
    }

    meusPlanosFechar?.addEventListener("click", fecharMeusPlanosModal);
    meusPlanosModal?.addEventListener("click", (ev) => {
      if (ev.target === meusPlanosModal) fecharMeusPlanosModal();
    });

    // ======================================================
    // ⭐ FAB DO SIMULADO — ABRIR E FECHAR MODAL
    // ======================================================
    if (simFab && simModalBackdrop) {
      simFab.addEventListener("click", () => {
        simModalBackdrop.classList.remove("hidden");
        simModalBackdrop.classList.add("visible");
      });

      simModalBackdrop.addEventListener("click", (ev) => {
        if (ev.target === simModalBackdrop) {
          simModalBackdrop.classList.remove("visible");
          simModalBackdrop.classList.add("hidden");
        }
      });
    }

    if (simModalClose && simModalBackdrop) {
      simModalClose.addEventListener("click", () => {
        simModalBackdrop.classList.remove("visible");
        simModalBackdrop.classList.add("hidden");
      });
    }

    // ======================================================
    // BOTÕES DE NAVEGAÇÃO
    // ======================================================
    btnTema?.addEventListener("click", goToEstudoTema);
    btnUpload?.addEventListener("click", goToEstudoUpload);
    btnSimulados?.addEventListener("click", goToSimulados);
    btnDashboard?.addEventListener("click", goToDashboard);

    btnContinue?.addEventListener("click", () => {
      window.lioraContinueStudy();
    });

    btnMeusPlanos?.addEventListener("click", abrirMeusPlanosModal);

    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    console.log("🟢 NAV-HOME v86 pronto!");
  });
})();
