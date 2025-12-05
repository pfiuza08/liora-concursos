// ==========================================================
// 🧭 LIORA — NAV-HOME v86-COMMERCIAL-PREMIUM (FINAL)
// ----------------------------------------------------------
// Novidades v86:
// ✔ FAB do Simulado agora ABRE corretamente o modal de configuração
// ✔ Modal fecha ao clicar fora (backdrop) ou no botão X
// ✔ Correção de classe: usa .visible no backdrop (compatível com CSS)
// ✔ Nenhuma funcionalidade anterior foi alterada
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
    const simModalBackdrop = document.getElementById("sim-modal-backdrop");
    const simModalClose = document.getElementById("sim-modal-close");

    // Modal "Meus Planos"
    const meusPlanosModal = document.getElementById("meus-planos-modal");
    const meusPlanosList = document.getElementById("meus-planos-list");
    const meusPlanosFechar = document.getElementById("meus-planos-fechar");

    // Estado inicial
    fabHome?.classList.add("hidden");
    simFab?.classList.add("hidden");
    meusPlanosModal?.classList.add("hidden");

    // ------------------------------------------------------
    // UI HELPERS GERAIS
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

    // ------------------------------------------------------
    // NAVEGAÇÃO PRINCIPAL
    // ------------------------------------------------------
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

      simFab?.classList.remove("hidden"); // MOSTRAR FAB

      window.dispatchEvent(new Event("liora:enter-simulado"));
      window.lioraPreFillSimulado?.();
    }

    function goToDashboard() {
      showApp();
      hideAllAppSections();
      document.getElementById("area-dashboard")?.classList.remove("hidden");

      simFab?.classList.add("hidden");
      window.dispatchEvent(new Event("liora:enter-dashboard"));
    }

    // ------------------------------------------------------
    // ATUALIZAÇÃO DA HOME (RESUMO + CONTINUE)
    // ------------------------------------------------------
    function atualizarHome() {
      try {
        const sm = window.lioraEstudos;
        if (!sm) return;

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

    // ------------------------------------------------------
    // ⭐ CONTINUE STUDY
    // ------------------------------------------------------
    window.lioraContinueStudy = function () {
      try {
        const sm = window.lioraEstudos;
        const plano = sm?.getPlanoAtivo();
        if (!plano) return alert("Você ainda não tem um plano criado.");

        let idx = plano.sessoes.findIndex((s) => (s.progresso || 0) < 100);
        if (idx < 0) idx = plano.sessoes.length - 1;

        window.lioraModoRevisao = false;

        if (typeof window.lioraSetWizardFromPlano === "function") {
          window.lioraSetWizardFromPlano(plano, idx);
        }

        showApp();
        hideAllAppSections();
        document.getElementById("liora-sessoes")?.classList.remove("hidden");
        document.getElementById("area-plano")?.classList.remove("hidden");

        simFab?.classList.add("hidden");

        window.lioraIrParaSessao?.(idx, false);

      } catch (e) {
        console.error("Erro ContinueStudy", e);
      }
    };

    // ------------------------------------------------------
    // 📚 MEUS PLANOS
    // ------------------------------------------------------
    function fecharMeusPlanosModal() {
      meusPlanosModal?.classList.add("hidden");
    }

    function abrirMeusPlanosModal() {
      try {
        const sm = window.lioraEstudos;
        if (!sm || !meusPlanosModal || !meusPlanosList) return;

        const planos = sm.listarRecentes?.(10) || [];
        meusPlanosList.innerHTML = "";

        if (!planos.length) {
          meusPlanosList.innerHTML =
            "<p class='liora-modal-empty'>Você ainda não tem planos salvos.</p>";
          meusPlanosModal.classList.remove("hidden");
          return;
        }

        planos.forEach((plano) => {
          const total = plano.sessoes?.length || 0;
          const concluidas = plano.sessoes.filter(
            (s) => (s.progresso || 0) >= 100
          ).length;
          const media =
            total > 0
              ? Math.round(
                  plano.sessoes.reduce((a, s) => a + (s.progresso || 0), 0) /
                    total
                )
              : 0;

          const item = document.createElement("button");
          item.type = "button";
          item.className = "liora-plan-item";
          item.dataset.id = plano.id;

          item.innerHTML = `
            <div class="liora-plan-item-top">
              <h3 class="liora-plan-title">${plano.tema}</h3>
              <span class="liora-plan-badge">${total} sessão(ões)</span>
            </div>
            <div class="liora-plan-item-middle">
              <span class="liora-plan-progress">Progresso médio: ${media}%</span>
              <span class="liora-plan-status">Concluídas: ${concluidas}/${total}</span>
            </div>
            <div class="liora-plan-item-footer">
              <span class="liora-plan-dates">
                Criado em: ${plano.criadoEm || "—"}
                ${
                  plano.atualizadoEm &&
                  plano.atualizadoEm !== plano.criadoEm
                    ? ` • Atualizado em: ${plano.atualizadoEm}`
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
        console.error("Erro ao abrir modal 'Meus Planos'", e);
      }
    }

    function ativarPlanoEIr(id) {
      const sm = window.lioraEstudos;
      if (!sm) return;

      const plano = sm.listarRecentes?.(20)?.find((p) => p.id === id);
      if (!plano) return;

      sm.ativarPlano?.(id);
      window.dispatchEvent(new Event("liora:plan-updated"));

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

    // ------------------------------------------------------
    // ⭐ FAB DO SIMULADO — ABRIR E FECHAR MODAL
    // ------------------------------------------------------
    if (simFab && simModalBackdrop) {
      // Abrir modal ao clicar no FAB ⚙
      simFab.addEventListener("click", () => {
        simModalBackdrop.classList.add("visible");
      });

      // Fechar ao clicar no fundo
      simModalBackdrop.addEventListener("click", (ev) => {
        if (ev.target === simModalBackdrop) {
          simModalBackdrop.classList.remove("visible");
        }
      });
    }

    // Fechar no botão X (se existir)
    simModalClose?.addEventListener("click", () => {
      simModalBackdrop.classList.remove("visible");
    });

    // ------------------------------------------------------
    // BOTÕES DE NAVEGAÇÃO
    // ------------------------------------------------------
    btnTema?.addEventListener("click", goToEstudoTema);
    btnUpload?.addEventListener("click", goToEstudoUpload);
    btnSimulados?.addEventListener("click", goToSimulados);
    btnDashboard?.addEventListener("click", goToDashboard);

    btnContinue?.addEventListener("click", () => window.lioraContinueStudy());
    btnMeusPlanos?.addEventListener("click", abrirMeusPlanosModal);

    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    console.log("🟢 NAV-HOME v86 pronto!");
  });
})();
