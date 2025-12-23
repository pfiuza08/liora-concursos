// ==========================================================
// 🧭 LIORA — NAV-HOME v96-FULLSCREEN-CANONICAL
// - Simulados com gating de login
// - Compatível com UI fullscreen
// - Sem dependência de modal para login/premium
// ==========================================================

(function () {
  console.log("🔵 nav-home.js v96 carregado…");

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

    // MODAL — MEUS PLANOS (permanece modal)
    const meusPlanosModalId = "meus-planos-modal";
    const meusPlanosList = document.getElementById("meus-planos-list");

    // ------------------------------------------------------
    // FUNÇÕES DE UI BÁSICAS
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
      // 🔐 GATING DE LOGIN
      if (!window.lioraAuth?.user) {
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
      // 🔐 GATING DE LOGIN
      if (!window.lioraAuth?.user) {
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
    // CONTINUAR ESTUDO
    // ------------------------------------------------------
    window.lioraContinueStudy = function () {
      try {
        const sm = window.lioraEstudos;
        if (!sm) return;

        const plano = sm.getPlanoAtivo?.();
        if (!plano) return;

        let idx =
          plano.sessoes.findIndex((s) => (s.progresso || 0) < 100);
        if (idx < 0) idx = plano.sessoes.length - 1;

        window.lioraSetWizardFromPlano?.(plano, idx);

        showApp();
        hideAllAppSections();
        qs("liora-sessoes")?.classList.remove("hidden");
        qs("area-plano")?.classList.remove("hidden");

        simFab?.classList.add("hidden");
        window.lioraIrParaSessao?.(idx, false);
      } catch (e) {
        console.error("❌ Erro no ContinueStudy:", e);
      }
    };

    // ------------------------------------------------------
    // MODAL "MEUS PLANOS" (mantido)
    // ------------------------------------------------------
    function abrirMeusPlanosModal() {
      const sm = window.lioraEstudos;
      if (!sm || !meusPlanosList) return;

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

          item.addEventListener("click", () => {
            ativarPlanoEIr(plano.id);
            window.lioraModal?.close(meusPlanosModalId);
          });

          meusPlanosList.appendChild(item);
        });
      }

      window.lioraModal?.open(meusPlanosModalId);
    }

    function ativarPlanoEIr(id) {
      const sm = window.lioraEstudos;
      if (!sm) return;

      sm.ativarPlano?.(id);
      const plano = sm.listarRecentes?.().find((p) => p.id === id);
      if (!plano) return;

      window.lioraSetWizardFromPlano?.(plano, 0);

      showApp();
      hideAllAppSections();
      qs("liora-sessoes")?.classList.remove("hidden");
      qs("area-plano")?.classList.remove("hidden");

      window.lioraIrParaSessao?.(0, false);
    }

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

    console.log("🟢 NAV-HOME v96 pronto!");
  });

  // helper local
  function qs(id) {
    return document.getElementById(id);
  }
})();
