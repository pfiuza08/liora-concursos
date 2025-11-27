// ==========================================================
// 🧭 LIORA — NAV-HOME v76-COMMERCIAL-SYNC-IA-PREMIUM-ESTUDOS
// ----------------------------------------------------------
// Inclui:
// ✔ Reset total (lioraHardReset)
// ✔ Prefill automático de simulados (lioraPreFillSimulado)
// ✔ Memória de estudos integrada (lioraEstudos)
// ✔ Botão Início sempre visível e funcional
// ✔ Home Inteligente (Continuar Estudo)
// ✔ Continue Study Engine (Modo Inteligente)
// ✔ Jump automático para sessão correta
// ✔ Sincronização com core.js / estudos.js
// ✔ Correção de FAB Home invisível
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v76) carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS
    // ------------------------------------------------------
    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    const painelEstudo = document.getElementById("painel-estudo");
    const painelTema = document.getElementById("painel-tema");
    const painelUpload = document.getElementById("painel-upload");

    const areaSimulado = document.getElementById("area-simulado");
    const areaDashboard = document.getElementById("area-dashboard");

    const fabHome = document.getElementById("fab-home");
    const fabSim = document.getElementById("sim-fab");

    const btnHomeTema = document.getElementById("home-tema");
    const btnHomeUpload = document.getElementById("home-upload");
    const btnHomeSimulados = document.getElementById("home-simulados");
    const btnHomeDashboard = document.getElementById("home-dashboard");

    const viewTitle = document.getElementById("liora-view-title");
    const viewSubtitle = document.getElementById("liora-view-subtitle");

    const btnContinue = document.getElementById("home-continuar-estudo");
    const resumoEstudoEl = document.getElementById("home-resumo-estudo");

    // ------------------------------------------------------
    // FAB helpers
    // ------------------------------------------------------
    window.showSimFab = () => fabSim && (fabSim.style.display = "flex");
    window.hideSimFab = () => fabSim && (fabSim.style.display = "none");
    window.showFabHome = () => fabHome && (fabHome.style.display = "flex");
    window.hideFabHome = () => fabHome && (fabHome.style.display = "none");

    // ------------------------------------------------------
    // VISIBILIDADE
    // ------------------------------------------------------
    function showApp() {
      home?.classList.add("hidden");
      app?.classList.remove("hidden");

      // Ao entrar no APP, FAB deve estar visível
      window.showFabHome();
    }

    function showHome() {
      home?.classList.remove("hidden");
      app?.classList.add("hidden");

      if (viewTitle) viewTitle.textContent = "";
      if (viewSubtitle) viewSubtitle.textContent = "";

      // ⭐ FAB sempre visível na Home
      window.showFabHome();
    }

    function hideAllPanels() {
      painelEstudo?.classList.add("hidden");
      painelTema?.classList.add("hidden");
      painelUpload?.classList.add("hidden");
      areaSimulado?.classList.add("hidden");
      areaDashboard?.classList.add("hidden");
    }

    function setView(title, subtitle) {
      if (viewTitle) viewTitle.textContent = title || "";
      if (viewSubtitle) viewSubtitle.textContent = subtitle || "";
    }

    // ------------------------------------------------------
    // 🔥 RESET TOTAL
    // ------------------------------------------------------
    window.lioraHardReset = function () {
      console.log("🧹✨ Reset completo iniciado...");

      hideAllPanels();
      showHome();
      window.hideSimFab();

      // LIMPA PLANO
      const plano = document.getElementById("plano");
      if (plano) plano.innerHTML = "";

      // STATUS
      const status = document.getElementById("status");
      if (status) status.textContent = "";

      const statusUpload = document.getElementById("status-upload");
      if (statusUpload) statusUpload.textContent = "";

      // BARRAS
      const barraTema = document.getElementById("barra-tema-fill");
      if (barraTema) barraTema.style.width = "0%";

      const barraUpload = document.getElementById("barra-upload-fill");
      if (barraUpload) barraUpload.style.width = "0%";

      // WIZARD
      const wiz = document.getElementById("liora-sessoes");
      if (wiz) wiz.classList.add("hidden");

      // SIMULADOS
      const simQuestao = document.getElementById("sim-questao-container");
      if (simQuestao) simQuestao.innerHTML = "";

      const simResultado = document.getElementById("sim-resultado");
      if (simResultado) {
        simResultado.innerHTML = "";
        simResultado.classList.add("hidden");
      }

      const simNav = document.getElementById("sim-nav");
      if (simNav) simNav.classList.add("hidden");

      const simProgress = document.getElementById("sim-progress-bar");
      if (simProgress) simProgress.style.width = "0%";

      const simTimer = document.getElementById("sim-timer");
      if (simTimer) {
        simTimer.textContent = "00:00";
        simTimer.classList.add("hidden");
      }

      // FECHA MODAL
      const modal = document.getElementById("sim-modal-backdrop");
      if (modal) modal.classList.remove("visible");

      // FECHA LOADING / ERRO
      if (window.lioraLoading?.hide) window.lioraLoading.hide();
      if (window.lioraError?.hide) window.lioraError.hide();

      // Atualiza home inteligente
      atualizarHomeEstudo();

      // ⭐ Garante FAB funcional após reset
      window.showFabHome();

      console.log("🧹✨ Reset completo FINALIZADO!");
    };

    // FAB HOME → sempre reset total
    fabHome?.addEventListener("click", () => window.lioraHardReset());

    // ------------------------------------------------------
    // ⭐ CONTINUE STUDY ENGINE — MODO INTELIGENTE
    // ------------------------------------------------------
    window.lioraContinueStudy = function () {
      try {
        const sm = window.lioraEstudos;
        if (!sm?.getPlanoAtivo) return;

        const plano = sm.getPlanoAtivo();
        if (!plano || !plano.sessoes?.length) return;

        const sessoes = plano.sessoes;

        // alvo é a primeira sessão NÃO concluída
        let alvo = sessoes.find(s => Number(s.progresso || 0) < 100);
        if (!alvo) alvo = sessoes[sessoes.length - 1];

        const index = Number(alvo.ordem || 1) - 1;

        // abre painel correto
        if (plano.origem === "tema") {
          btnHomeTema?.click();
        } else {
          btnHomeUpload?.click();
        }

        // jump após renderizar UI
        setTimeout(() => {
          if (window.lioraIrParaSessao) {
            window.lioraIrParaSessao(index);
          }
        }, 350);

      } catch (e) {
        console.error("❌ Erro no ContinueStudy:", e);
      }
    };

    // ------------------------------------------------------
    // CONTINUAR ESTUDO — Listener
    // ------------------------------------------------------
    if (btnContinue) {
      btnContinue.addEventListener("click", () => window.lioraContinueStudy());
    }

    // ------------------------------------------------------
    // Atualiza Home Inteligente
    // ------------------------------------------------------
    function atualizarHomeEstudo() {
      try {
        const sm = window.lioraEstudos;

        if (!sm?.getPlanoAtivo) return;

        const plano = sm.getPlanoAtivo();

        if (!btnContinue || !resumoEstudoEl) return;

        if (!plano) {
          btnContinue.classList.add("hidden");
          resumoEstudoEl.textContent =
            "Crie um plano de estudo por Tema ou PDF para começar.";
          return;
        }

        btnContinue.classList.remove("hidden");
        resumoEstudoEl.textContent =
          `Você está estudando: ${plano.tema} (${plano.sessoes.length} sessões)`;

      } catch (e) {
        console.error("Erro ao atualizar Home Inteligente:", e);
      }
    }
// =======================================================
// ⭐ LISTA DE ESTUDOS RECENTES (Home)
// =======================================================
function preencherEstudosRecentes() {
  const container = document.getElementById("liora-estudos-recentes");
  const list = document.getElementById("liora-estudos-list");
  if (!container || !list) return;

  const sm = window.lioraEstudos;
  if (!sm?.listarRecentes) return;

  const recentes = sm.listarRecentes(5);

  if (!recentes.length) {
    container.classList.add("hidden");
    return;
  }

        container.classList.remove("hidden");
        list.innerHTML = "";
      
        recentes.forEach(plano => {
          const progressoMedio =
            plano.sessoes.reduce((acc, s) => acc + (s.progresso || 0), 0) /
            plano.sessoes.length;
      
          const div = document.createElement("button");
          div.className = "liora-card-recent hover:bg-[var(--bg2)] transition p-3 rounded-xl text-left border border-[var(--border)]";
          div.innerHTML = `
            <div class="font-semibold text-[var(--fg)]">${plano.tema}</div>
            <div class="text-sm text-[var(--muted)]">
              ${plano.sessoes.length} sessões • ${progressoMedio.toFixed(0)}% concluído
            </div>
          `;
      
          // ⭐ Clicar em um estudo recente → continuar exatamente nele
          div.addEventListener("click", () => {
            window.lioraEstudos && (window.lioraEstudos._forcarAtivo = plano.id);
            if (window.lioraContinueStudy) window.lioraContinueStudy();
          });
      
          list.appendChild(div);
        });
      }
         
    window.addEventListener("liora:plan-updated", atualizarHomeEstudo);
    window.addEventListener("liora:plan-updated", preencherEstudosRecentes);
    document.addEventListener("DOMContentLoaded", preencherEstudosRecentes);

    // ------------------------------------------------------
    // HOME → TEMA
    // ------------------------------------------------------
    btnHomeTema?.addEventListener("click", () => {
      showApp();
      hideAllPanels();

      painelEstudo?.classList.remove("hidden");
      painelTema?.classList.remove("hidden");

      setView(
        "Plano por tema",
        "Defina um tema e deixe a Liora quebrar o estudo em sessões."
      );

      window.hideSimFab();
      window.showFabHome();
    });

    // ------------------------------------------------------
    // HOME → UPLOAD
    // ------------------------------------------------------
    btnHomeUpload?.addEventListener("click", () => {
      showApp();
      hideAllPanels();

      painelEstudo?.classList.remove("hidden");
      painelUpload?.classList.remove("hidden");

      setView(
        "Plano a partir do PDF",
        "Envie seu material e a Liora monta um plano completo."
      );

      window.hideSimFab();
      window.showFabHome();
    });

    // ------------------------------------------------------
    // HOME → SIMULADOS
    // ------------------------------------------------------
    function goSimulados() {
      showApp();
      hideAllPanels();

      areaSimulado?.classList.remove("hidden");

      setView(
        "Simulados inteligentes",
        "Monte simulados com IA por banca, tema e dificuldade."
      );

      window.showSimFab();
      window.showFabHome();

      setTimeout(() => {
        if (window.lioraPreFillSimulado) window.lioraPreFillSimulado();
      }, 150);
    }
    btnHomeSimulados?.addEventListener("click", goSimulados);

    // ------------------------------------------------------
    // HOME → DASHBOARD
    // ------------------------------------------------------
    function goDashboard() {
      showApp();
      hideAllPanels();

      areaDashboard?.classList.remove("hidden");

      setView("Meu desempenho", "Veja o resumo dos seus simulados.");

      window.hideSimFab();
      window.showFabHome();

      if (window.lioraDashboard?.atualizar) {
        window.lioraDashboard.atualizar();
      }
    }
    btnHomeDashboard?.addEventListener("click", goDashboard);
    window.homeDashboard = goDashboard;

    // ------------------------------------------------------
    // ESTADO INICIAL
    // ------------------------------------------------------
    window.lioraHardReset();
    atualizarHomeEstudo();
    window.showFabHome(); // ⭐ garantir FAB ativo

    console.log("🟢 nav-home.js v76 OK");
  });
})();
