// ==========================================================
// 🧭 LIORA — NAV-HOME v87-COMMERCIAL-PREMIUM (FINAL)
// ----------------------------------------------------------
// Melhorias v87:
// ✔ FAB do simulado totalmente funcional
// ✔ Modal do simulado abre/fecha corretamente
// ✔ "Meu Desempenho" funciona globalmente (fix universal)
// ✔ Continue Study estável
// ✔ Meus Planos com modal funcional
// ✔ Home reflete sempre o plano ativo
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v87) carregado...");

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
    const simModalClose = document.getElementById("sim-modal-close-btn");

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
    // NAVEGAÇÃO ENTRE ÁREAS
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
        if (!sm) return;

        const plano = sm.getPlanoAtivo();

        if (!plano) {
          btnContinue?.classList.add("hidden");
          if (resumoEl)
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
        if (!sm) return alert("Aguarde carregar os dados de estudo.");

        const plano = sm.getPlanoAtivo();
        if (!plano) return alert("Nenhum plano criado ainda.");

        let idx = plano.sessoes.findIndex((s) => (s.progresso || 0) < 100);
        if (idx < 0) idx = plano.sessoes.length - 1;

        if (typeof window.lioraSetWizardFromPlano !== "function") {
          alert("Erro interno: wizard não carregado.");
          return;
        }

        window.lioraSetWizardFromPlano(plano, idx);

        showApp();
        hideAllAppSections();
        document.getElementById("liora-sessoes")?.classList.remove("hidden");
        document.getElementById("area-plano")?.classList.remove("hidden");

        simFab?.classList.add("hidden");

        if (typeof window.lioraIrParaSessao === "function") {
          window.lioraIrParaSessao(idx, false);
        }
      } catch (e) {
        console.error("❌ Erro no ContinueStudy:", e);
      }
    };

    // ======================================================
    // 📚 MEUS PLANOS — MODAL
    // ======================================================
    function fecharMeusPlanosModal() {
      meusPlanosModal?.classList.add("hidden");
    }

    function abrirMeusPlanosModal() {
      const sm = window.lioraEstudos;
      if (!sm) return alert("Aguarde carregar os planos.");

      const planos = sm.listarRecentes?.(10) || [];
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
        const avg =
          total > 0
            ? Math.round(
                plano.sessoes.reduce((acc, s) => acc + (s.progresso || 0), 0) /
                  total
              )
            : 0;

        const item = document.createElement("button");
        item.className = "liora-plan-item";
        item.innerHTML = `
          <div class="liora-plan-item-top">
            <h3>${plano.tema}</h3>
            <span>${total} sessões</span>
          </div>
          <div class="liora-plan-item-middle">
            <span>Progresso médio: ${avg}%</span>
            <span>Concluídas: ${concluidas}/${total}</span>
          </div>
          <div class="liora-plan-item-footer">
            <span>Criado: ${plano.criadoEm}</span>
            <span class="liora-plan-cta">Ativar plano</span>
          </div>
        `;

        item.addEventListener("click", () => {
          ativarPlanoEIr(plano.id);
        });

        meusPlanosList.appendChild(item);
      });

      meusPlanosModal.classList.remove("hidden");
    }

    function ativarPlanoEIr(planoId) {
      const sm = window.lioraEstudos;
      if (!sm) return;

      const planos = sm.listarRecentes?.(20) || [];
      const plano = planos.find((p) => p.id === planoId);
      if (!plano) return;

      if (sm.ativarPlano) sm.ativarPlano(planoId);
      else {
        sm._forcarAtivo = planoId;
        window.dispatchEvent(new Event("liora:plan-updated"));
      }

      if (window.lioraSetWizardFromPlano)
        window.lioraSetWizardFromPlano(plano, 0);

      showApp();
      hideAllAppSections();
      document.getElementById("liora-sessoes")?.classList.remove("hidden");
      document.getElementById("area-plano")?.classList.remove("hidden");

      if (window.lioraIrParaSessao) window.lioraIrParaSessao(0, false);

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
        simModalBackdrop.classList.add("visible");
      });

      simModalBackdrop.addEventListener("click", (ev) => {
        if (ev.target === simModalBackdrop)
          simModalBackdrop.classList.remove("visible");
      });
    }

    simModalClose?.addEventListener("click", () => {
      simModalBackdrop.classList.remove("visible");
    });

    // ======================================================
    // 🔥 FIX GLOBAL — "Meu Desempenho" sempre funciona
    // ======================================================
    document.addEventListener("click", (ev) => {
      if (ev.target?.id === "home-dashboard") {
        console.log("📊 (GLOBAL) Dashboard acionado");
        goToDashboard();
      }
    });

    // ======================================================
    // BOTÕES DA HOME
    // ======================================================
    btnTema?.addEventListener("click", goToEstudoTema);
    btnUpload?.addEventListener("click", goToEstudoUpload);
    btnSimulados?.addEventListener("click", goToSimulados);

    btnDashboard?.addEventListener("click", () => goToDashboard());
    btnContinue?.addEventListener("click", () => window.lioraContinueStudy());
    btnMeusPlanos?.addEventListener("click", abrirMeusPlanosModal);

    // FAB HOME
    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    console.log("🟢 NAV-HOME v87 pronto!");
  });
})();
