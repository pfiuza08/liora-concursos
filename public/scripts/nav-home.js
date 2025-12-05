// ==========================================================
// 🧭 LIORA — NAV-HOME v88-COMMERCIAL-PREMIUM (FINAL)
// ----------------------------------------------------------
// ✔ FAB Simulado 100% funcional (abre/fecha modal corretamente)
// ✔ Continue Study funcionando
// ✔ Meus Planos funcional
// ✔ Dashboard abre de qualquer lugar (fix global)
// ✔ FAB Home correto
// ✔ Sincronia com Core v75 e Estudos v2
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v88) carregado...");

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

    // Estado inicial dos FABs e modais
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
      [
        "painel-estudo",
        "painel-tema",
        "painel-upload",
        "liora-sessoes",
        "area-plano",
        "area-simulado",
        "area-dashboard",
      ].forEach((id) => {
        document.getElementById(id)?.classList.add("hidden");
      });
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


    // ------------------------------------------------------
    // CONTINUE STUDY
    // ------------------------------------------------------
    window.lioraContinueStudy = function () {
      try {
        const sm = window.lioraEstudos;
        const plano = sm?.getPlanoAtivo();
        if (!plano) return alert("Nenhum plano ativo.");

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
        console.error("❌ Erro no ContinueStudy:", e);
      }
    };


    // ------------------------------------------------------
    // MODAL "MEUS PLANOS"
    // ------------------------------------------------------
    function fecharMeusPlanosModal() {
      meusPlanosModal?.classList.add("hidden");
    }

    function abrirMeusPlanosModal() {
      const sm = window.lioraEstudos;
      if (!sm) return alert("Carregando dados...");

      const planos = sm.listarRecentes?.(10) || [];
      meusPlanosList.innerHTML = "";

      if (!planos.length) {
        meusPlanosList.innerHTML =
          "<p class='liora-modal-empty'>Nenhum plano salvo.</p>";
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
        const media = total ? Math.round(soma / total) : 0;

        const item = document.createElement("button");
        item.className = "liora-plan-item";
        item.dataset.id = plano.id;

        item.innerHTML = `
          <div class="liora-plan-item-top">
            <h3 class="liora-plan-title">${plano.tema}</h3>
            <span class="liora-plan-badge">${total} sessões</span>
          </div>
          <div class="liora-plan-item-middle">
            <span>Progresso médio: ${media}%</span>
            <span>Concluídas: ${concluidas}/${total}</span>
          </div>
          <div class="liora-plan-item-footer">
            <span>Criado em: ${plano.criadoEm}</span>
            <span class="liora-plan-cta">Ativar plano</span>
          </div>
        `;

        item.addEventListener("click", () => ativarPlanoEIr(plano.id));
        meusPlanosList.appendChild(item);
      });

      meusPlanosModal.classList.remove("hidden");
    }

    function ativarPlanoEIr(id) {
      const sm = window.lioraEstudos;
      if (!sm) return;

      const plano = sm.listarRecentes(20).find((p) => p.id === id);
      if (!plano) return;

      if (sm.ativarPlano) sm.ativarPlano(id);
      else sm._forcarAtivo = id;

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


    // ------------------------------------------------------
    // ⭐ FAB DO SIMULADO — ABRIR/FECHAR MODAL (CORRETO v88)
    // ------------------------------------------------------
    if (simFab && simModalBackdrop) {

      simFab.addEventListener("click", () => {
        console.log("⚙ Abrindo modal de simulado...");
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

    simModalClose?.addEventListener("click", () => {
      simModalBackdrop.classList.remove("visible");
      simModalBackdrop.classList.add("hidden");
    });


    // ------------------------------------------------------
    // BOTÕES DE NAVEGAÇÃO
    // ------------------------------------------------------
    btnTema?.addEventListener("click", goToEstudoTema);
    btnUpload?.addEventListener("click", goToEstudoUpload);
    btnSimulados?.addEventListener("click", goToSimulados);
    btnDashboard?.addEventListener("click", goToDashboard);
    btnContinue?.addEventListener("click", window.lioraContinueStudy);
    btnMeusPlanos?.addEventListener("click", abrirMeusPlanosModal);


    // ------------------------------------------------------
    // FIX GLOBAL — "Meu Desempenho" sempre funciona
    // ------------------------------------------------------
    document.addEventListener("click", (ev) => {
      if (ev.target?.id === "home-dashboard") {
        console.log("📊 (GLOBAL) home-dashboard clicado → Dashboard");
        goToDashboard();
      }
    });


    // FAB HOME
    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    console.log("🟢 NAV-HOME v88 pronto!");
  });
})();
