// ==========================================================
// 🧭 LIORA — NAV-HOME v72-COMMERCIAL-SYNC-IA-PREMIUM-RESET
// ----------------------------------------------------------
// Agora inclui:
// ✔ Reset total (lioraHardReset)
// ✔ Botão Início sempre começa do ZERO
// ✔ Limpa plano, wizard, simulados, dashboard, modais, loaders
// ✔ Evita telas “fantasmas” e vazamento de estado
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v72-COMMERCIAL-SYNC-IA-PREMIUM-RESET) carregado...");

  document.addEventListener("DOMContentLoaded", () => {

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
    

      // ======================================================
      // ESTUDOS RECENTES NA HOME
      // ======================================================
      window.homeLoadEstudos = function () {
        const box = document.getElementById("liora-estudos-recentes");
        const list = document.getElementById("liora-estudos-list");
      
        if (!box || !list || !window.lioraEstudos) return;
      
        const recentes = window.lioraEstudos.getRecentes(5);
      
        list.innerHTML = "";
      
        if (!recentes.length) {
          box.classList.add("hidden");
          return;
        }
      
        box.classList.remove("hidden");
      
        recentes.forEach((rec) => {
          const div = document.createElement("div");
          div.className = "p-3 rounded-lg bg-[var(--card)] cursor-pointer hover:bg-[var(--card-hover)]";
      
          div.innerHTML = `
            <div class="font-semibold">${rec.tema}</div>
            <div class="text-xs text-[var(--muted)]">
              ${rec.nivel} · ${rec.sessoesConcluidas}/${rec.sessoesTotal} sessões · ${
                rec.origem === "tema" ? "Tema" : "Upload"
              }
            </div>
          `;
      
          div.addEventListener("click", () => {
            // abrir painel TEMAS/UPLOAD conforme origem
            if (rec.origem === "tema") {
              document.getElementById("home-tema")?.click();
              setTimeout(() => {
                const input = document.getElementById("inp-tema");
                if (input) input.value = rec.tema;
              }, 150);
            } else {
              document.getElementById("home-upload")?.click();
            }
          });
      
          list.appendChild(div);
        });
      };
  

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
    }

    function showHome() {
      home?.classList.remove("hidden");
      app?.classList.add("hidden");

      if (viewTitle) viewTitle.textContent = "";
      if (viewSubtitle) viewSubtitle.textContent = "";
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
    // 🔥 RESET TOTAL (botão INÍCIO)
    // ------------------------------------------------------
    window.lioraHardReset = function () {
      console.log("🧹✨ Reset completo iniciado...");

      hideAllPanels();
      showHome();
      window.hideSimFab();
      window.hideFabHome();

      // LIMPA PLANO
      const plano = document.getElementById("plano");
      if (plano) plano.innerHTML = "";

      // LINPA STATUS
      const status = document.getElementById("status");
      if (status) status.textContent = "";

      const statusUpload = document.getElementById("status-upload");
      if (statusUpload) statusUpload.textContent = "";

      // LIMPA BARRAS
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

      // FECHA ERRO E LOADING
      if (window.lioraLoading?.hide) window.lioraLoading.hide();
      if (window.lioraError?.hide) window.lioraError.hide();

      console.log("🧹✨ Reset completo FINALIZADO!");
    };

    // ------------------------------------------------------
    // Botão FAB HOME chama RESET TOTAL
    // ------------------------------------------------------
    if (fabHome) {
      fabHome.addEventListener("click", () => {
        window.lioraHardReset();
      });

     // Atualiza estudos recentes quando volta ao início
     if (window.homeLoadEstudos) window.homeLoadEstudos();
     
    }

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

    // Exposto globalmente para simulados.js
    window.homeDashboard = goDashboard;

    // ------------------------------------------------------
    // ESTADO INICIAL
    // ------------------------------------------------------
    window.lioraHardReset();
    window.homeLoadEstudos();

    console.log("🟢 nav-home.js v72 OK");
  });
})();
