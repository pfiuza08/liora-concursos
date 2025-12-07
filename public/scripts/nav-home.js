// ==========================================================
// 🧭 LIORA — NAV-HOME v91-COMMERCIAL-PREMIUM (FINAL)
// ----------------------------------------------------------
// Melhorias v91:
// ✔ Exposto window.homeDashboard para integração com Simulados v99
// ✔ "Ver meu desempenho" funciona 100% em todas as telas
// ✔ Mantido fix do FAB Simulado
// ✔ Mantidos todos os ajustes de estabilidade do v89–v90
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v91) carregado...");

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

    // Modal "Meus Planos"
    const meusPlanosModal = document.getElementById("meus-planos-modal");
    const meusPlanosList = document.getElementById("meus-planos-list");
    const meusPlanosFechar = document.getElementById("meus-planos-fechar");

    // Estado inicial
    fabHome?.classList.add("hidden");
    simFab?.classList.add("hidden");
    meusPlanosModal?.classList.add("hidden");

    // ------------------------------------------------------
    // FUNÇÕES DE UI
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
      [
        "painel-estudo",
        "painel-tema",
        "painel-upload",
        "liora-sessoes",
        "area-plano",
        "area-simulado",
        "area-dashboard",
      ].forEach((id) => document.getElementById(id)?.classList.add("hidden"));
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

      if (window.lioraDashboard?.atualizar) {
        console.log("📊 Atualizando Dashboard…");
        window.lioraDashboard.atualizar();
      } else {
        console.warn("⚠️ lioraDashboard.atualizar não disponível.");
      }
    }

    // Expor globalmente — FIX v91
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
        if (!sm) return alert("Aguarde o carregamento dos dados.");

        const plano = sm.getPlanoAtivo?.();
        if (!plano) return alert("Você ainda não tem um plano criado.");

        let idx = plano.sessoes.findIndex((s) => (s.progresso || 0) < 100);
        if (idx < 0) idx = plano.sessoes.length - 1;

        window.lioraSetWizardFromPlano?.(plano, idx);

        showApp();
        hideAllAppSections();

        document.getElementById("liora-sessoes")?.classList.remove("hidden");
        document.getElementById("area-plano")?.classList.remove("hidden");

        simFab?.classList.add("hidden");

        window.lioraIrParaSessao?.(idx, false);
      } catch (e) {
        console.error("❌ Erro no ContinueStudy:", e);
      }
    };

    // ------------------------------------------------------
    // MODAL "MEUS PLANOS"
    // ------------------------------------------------------
    function abrirMeusPlanosModal() {
      const sm = window.lioraEstudos;
      if (!sm) return;

      const planos = sm.listarRecentes?.(20) || [];
      meusPlanosList.innerHTML = "";

      if (!planos.length) {
        meusPlanosList.innerHTML =
          "<p class='liora-modal-empty'>Você ainda não tem planos salvos.</p>";
      } else {
        planos.forEach((plano) => {
          const total = plano.sessoes?.length || 0;
          const concluidas = plano.sessoes.filter(
            (s) => (s.progresso || 0) >= 100
          ).length;

          const item = document.createElement("button");
          item.className = "liora-plan-item";
          item.dataset.id = plano.id;

          item.innerHTML = `
            <div class="liora-plan-item-top">
              <h3 class="liora-plan-title">${plano.tema}</h3>
              <span class="liora-plan-badge">${total} sessão(ões)</span>
            </div>
            <div class="liora-plan-item-middle">
              <span>Progresso médio: ${
                total
                  ? Math.round(
                      plano.sessoes.reduce(
                        (a, s) => a + (s.progresso || 0),
                        0
                      ) / total
                    )
                  : 0
              }%</span>
              <span>Concluídas: ${concluidas}/${total}</span>
            </div>
            <div class="liora-plan-item-footer">
              <span class="liora-plan-cta">Ativar plano</span>
            </div>
          `;

          item.onclick = () => ativarPlanoEIr(plano.id);
          meusPlanosList.appendChild(item);
        });
      }

      meusPlanosModal.classList.remove("hidden");
    }

    function ativarPlanoEIr(id) {
      const sm = window.lioraEstudos;
      if (!sm) return;

      sm.ativarPlano?.(id);
      const plano = sm.listarRecentes?.(20).find((p) => p.id === id);
      if (!plano) return;

      window.lioraSetWizardFromPlano?.(plano, 0);

      showApp();
      hideAllAppSections();

      document.getElementById("liora-sessoes")?.classList.remove("hidden");
      document.getElementById("area-plano")?.classList.remove("hidden");

      window.lioraIrParaSessao?.(0, false);
      meusPlanosModal.classList.add("hidden");
    }

    meusPlanosFechar?.addEventListener("click", () =>
      meusPlanosModal.classList.add("hidden")
    );

    // ------------------------------------------------------
    // AÇÕES PRINCIPAIS
    // ------------------------------------------------------
    btnTema?.addEventListener("click", goToEstudoTema);
    btnUpload?.addEventListener("click", goToEstudoUpload);
    btnSimulados?.addEventListener("click", goToSimulados);
    btnDashboard?.addEventListener("click", goToDashboard);

    btnContinue?.addEventListener("click", () => window.lioraContinueStudy());
    btnMeusPlanos?.addEventListener("click", abrirMeusPlanosModal);

    // ------------------------------------------------------
    // FAB HOME
    // ------------------------------------------------------
    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    // ------------------------------------------------------
    // ⭐ FIX DO FAB DO SIMULADO
    // ------------------------------------------------------
    if (simFab && simModalBackdrop) {
      simFab.addEventListener("click", () => {
        console.log("⚙ FAB Simulado clicado → abrir modal");
        simModalBackdrop.classList.add("visible");
      });
    }

    // ------------------------------------------------------
    // GLOBAL CLICK LISTENER
    // ------------------------------------------------------
    document.addEventListener("click", (ev) => {
      if (ev.target?.id === "home-dashboard") {
        window.homeDashboard();
      }
    });

    console.log("🟢 NAV-HOME v91 pronto!");
  });
})();
