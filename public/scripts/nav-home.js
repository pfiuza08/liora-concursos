// ==========================================================
// 🧭 LIORA — NAV-HOME v85-COMMERCIAL-PREMIUM (FINAL)
// ----------------------------------------------------------
// Novidades v85:
// ✔ Botão "📚 Meus Planos" ao lado de "Continuar estudo"
// ✔ Modal "Meus Planos" listando planos recentes (Study Manager)
// ✔ Ao escolher um plano, ele vira ATIVO e já abre o wizard na sessão 1
// ✔ FAB "Início" aparece sempre que estiver no app (fora da home)
// ✔ FAB do Simulado (⚙) aparece ao entrar em Simulados e some ao sair
// ✔ Continue Study 100% funcional com Core v75 + Estudos v2
// ✔ Home sempre reflete o plano ativo do Study Manager
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v85) carregado...");

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

    // Estado inicial dos FABs
    if (fabHome) fabHome.classList.add("hidden");
    if (simFab) simFab.classList.add("hidden");
    if (meusPlanosModal) meusPlanosModal.classList.add("hidden");

    // ------------------------------------------------------
    // UI HELPERS GERAIS
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
    // 📚 MEUS PLANOS — MODAL
    // ======================================================
    function fecharMeusPlanosModal() {
      if (meusPlanosModal) meusPlanosModal.classList.add("hidden");
    }

    function abrirMeusPlanosModal() {
      try {
        const sm = window.lioraEstudos;
        if (!sm) {
          alert("Os dados de estudo ainda estão carregando. Tente novamente em alguns segundos.");
          return;
        }

        if (!meusPlanosModal || !meusPlanosList) {
          console.warn("Modal 'Meus Planos' não está no HTML.");
          return;
        }

        const planos =
          typeof sm.listarRecentes === "function"
            ? sm.listarRecentes(10)
            : [];

        meusPlanosList.innerHTML = "";

        if (!planos || !planos.length) {
          meusPlanosList.innerHTML =
            "<p class='liora-modal-empty'>Você ainda não tem planos salvos.</p>";
          meusPlanosModal.classList.remove("hidden");
          return;
        }

        planos.forEach((plano) => {
          const total = (plano.sessoes || []).length;
          const concluidas = (plano.sessoes || []).filter(
            (s) => (s.progresso || 0) >= 100
          ).length;
          const somaProgresso = (plano.sessoes || []).reduce(
            (acc, s) => acc + (s.progresso || 0),
            0
          );
          const progressoMedio = total ? Math.round(somaProgresso / total) : 0;

          const item = document.createElement("button");
          item.type = "button";
          item.className = "liora-plan-item";
          item.dataset.id = plano.id;

          const criadoEm = plano.criadoEm || "";
          const atualizadoEm = plano.atualizadoEm || "";

          item.innerHTML = `
            <div class="liora-plan-item-top">
              <h3 class="liora-plan-title">${plano.tema}</h3>
              <span class="liora-plan-badge">${total} sessão(ões)</span>
            </div>
            <div class="liora-plan-item-middle">
              <span class="liora-plan-progress">
                Progresso médio: ${progressoMedio}%
              </span>
              <span class="liora-plan-status">
                Concluídas: ${concluidas}/${total}
              </span>
            </div>
            <div class="liora-plan-item-footer">
              <span class="liora-plan-dates">
                Criado em: ${criadoEm || "—"}
                ${
                  atualizadoEm && atualizadoEm !== criadoEm
                    ? ` • Atualizado em: ${atualizadoEm}`
                    : ""
                }
              </span>
              <span class="liora-plan-cta">Ativar plano</span>
            </div>
          `;

          item.addEventListener("click", () => {
            ativarPlanoEIr(plano.id);
          });

          meusPlanosList.appendChild(item);
        });

        meusPlanosModal.classList.remove("hidden");
      } catch (e) {
        console.error("❌ Erro ao abrir modal Meus Planos:", e);
      }
    }

    function ativarPlanoEIr(planoId) {
      try {
        const sm = window.lioraEstudos;
        if (!sm) return;

        // Recarrega a lista para pegar o objeto completo do plano
        const planos =
          typeof sm.listarRecentes === "function"
            ? sm.listarRecentes(20)
            : [];
        const plano = planos.find((p) => p.id === planoId);
        if (!plano) {
          console.warn("Plano não encontrado para ativar:", planoId);
          return;
        }

        // Marca como ativo no Study Manager (se existir o método novo)
        if (typeof sm.ativarPlano === "function") {
          sm.ativarPlano(planoId);
        } else {
          // fallback: força ativo apenas em memória
          sm._forcarAtivo = planoId;
          window.dispatchEvent(new Event("liora:plan-updated"));
        }

        // Reconstrói wizard a partir do plano escolhido
        if (typeof window.lioraSetWizardFromPlano === "function") {
          window.lioraSetWizardFromPlano(plano, 0);
        }

        // Abre o app já na área de estudo + wizard do plano
        showApp();
        hideAllAppSections();
        document.getElementById("liora-sessoes")?.classList.remove("hidden");
        document.getElementById("area-plano")?.classList.remove("hidden");

        if (typeof window.lioraIrParaSessao === "function") {
          window.lioraIrParaSessao(0, false);
        }

        fecharMeusPlanosModal();
      } catch (e) {
        console.error("❌ Erro ao ativar plano:", e);
      }
    }

    // Listeners do modal
    meusPlanosFechar?.addEventListener("click", fecharMeusPlanosModal);
    meusPlanosModal?.addEventListener("click", (ev) => {
      if (ev.target === meusPlanosModal) fecharMeusPlanosModal();
    });

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

    btnMeusPlanos?.addEventListener("click", () => {
      abrirMeusPlanosModal();
    });

    // FAB HOME
    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    console.log("🟢 NAV-HOME v85 pronto!");
  });
})();
