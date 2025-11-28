// ==========================================================
// 🧭 LIORA — NAV-HOME v79-COMMERCIAL-SYNC-IA-PREMIUM
// ----------------------------------------------------------
// Melhorias v79:
// ✔ Remove bloco registrarEventos (não usado no v73+)
// ✔ Logs mais claros e padronizados
// ✔ Home Inteligente mais estável (mobile + desktop)
// ✔ Safe-events para evitar corridas com estudos.js
// ✔ Compatível com Simulados, Dashboard e Revisões
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v79) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    console.log("🔵 NAV-HOME: DOM pronto, inicializando...");

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
    // VISIBILIDADE PRINCIPAL
    // ------------------------------------------------------
    function showApp() {
      home?.classList.add("hidden");
      app?.classList.remove("hidden");
      window.showFabHome();
    }

    function showHome() {
      home?.classList.remove("hidden");
      app?.classList.add("hidden");

      if (viewTitle) viewTitle.textContent = "";
      if (viewSubtitle) viewSubtitle.textContent = "";

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
      if (viewTitle) viewTitle.textContent = title;
      if (viewSubtitle) viewSubtitle.textContent = subtitle;
    }

    // ------------------------------------------------------
    // 🔥 HARD RESET
    // ------------------------------------------------------
    window.lioraHardReset = function () {
      console.log("🧹 NAV-HOME: Reset geral iniciado...");

      hideAllPanels();
      showHome();
      window.hideSimFab();

      // LIMPA ÁREAS
      document.getElementById("plano").innerHTML = "";
      document.getElementById("status").textContent = "";
      document.getElementById("status-upload").textContent = "";

      document.getElementById("barra-tema-fill").style.width = "0%";
      document.getElementById("barra-upload-fill").style.width = "0%";

      // Wizard
      document.getElementById("liora-sessoes").classList.add("hidden");

      // Simulados
      document.getElementById("sim-questao-container").innerHTML = "";
      document.getElementById("sim-resultado").innerHTML = "";
      document.getElementById("sim-resultado").classList.add("hidden");
      document.getElementById("sim-nav").classList.add("hidden");

      document.getElementById("sim-progress-bar").style.width = "0%";
      const timer = document.getElementById("sim-timer");
      timer.textContent = "00:00";
      timer.classList.add("hidden");

      // Fecha modal
      document.getElementById("sim-modal-backdrop").classList.remove("visible");

      // Overlays
      window.lioraLoading?.hide?.();
      window.lioraError?.hide?.();

      atualizarHomeEstudo("reset");
      preencherRevisoesPendentes();
      preencherEstudosRecentes();

      console.log("🧹 NAV-HOME: Reset completo!");
    };

    fabHome?.addEventListener("click", () => window.lioraHardReset());

    // ------------------------------------------------------
    // ⭐ CONTINUE STUDY ENGINE
    // ------------------------------------------------------
    window.lioraContinueStudy = function () {
      try {
        const sm = window.lioraEstudos;
        console.log("▶ continueStudy(): sm =", !!sm);

        if (!sm?.getPlanoAtivo) return;

        const plano = sm.getPlanoAtivo();
        console.log("▶ Plano ativo encontrado:", plano);

        if (!plano || !plano.sessoes?.length) return;

        // primeira sessão não concluída
        let alvo = plano.sessoes.find(s => (s.progresso || 0) < 100);
        if (!alvo) alvo = plano.sessoes[plano.sessoes.length - 1];

        const index = (alvo.ordem || 1) - 1;

        // abre a origem correta
        (plano.origem === "tema" ? btnHomeTema : btnHomeUpload)?.click();

        setTimeout(() => {
          window.lioraIrParaSessao?.(index);
        }, 350);
      } catch (e) {
        console.error("❌ Erro no continueStudy:", e);
      }
    };

    // ------------------------------------------------------
    // BOTÃO: CONTINUAR ESTUDO
    // ------------------------------------------------------
    if (btnContinue) {
      btnContinue.addEventListener("click", () => {
        try {
          const sm = window.lioraEstudos;
          console.log("🟦 CONTINUAR ESTUDO clicado. sm =", sm);

          if (!sm) return alert("Aguarde o carregamento dos dados de estudo.");

          const plano = sm.getPlanoAtivo();
          if (!plano)
            return alert("Você ainda não tem um plano criado neste dispositivo.");

          window.lioraContinueStudy();
        } catch (e) {
          console.error(e);
        }
      });
    }

    // ------------------------------------------------------
    // HOME INTELIGENTE
    // ------------------------------------------------------
    function atualizarHomeEstudo(from = "manual") {
      try {
        const sm = window.lioraEstudos;
        const plano = sm?.getPlanoAtivo?.();

        console.log(
          `🏠 atualizarHomeEstudo(${from}) → sm:`, !!sm,
          "plano:", !!plano
        );

        if (!btnContinue || !resumoEstudoEl) return;

        if (!plano) {
          btnContinue.classList.add("hidden");
          btnContinue.style.display = "none";
          resumoEstudoEl.textContent =
            "Crie um plano de estudo por Tema ou PDF para começar.";
          return;
        }

        // Plano existe → força exibir botão (especialmente no mobile)
        btnContinue.classList.remove("hidden");
        btnContinue.style.display = "block";

        resumoEstudoEl.textContent =
          `Você está estudando: ${plano.tema} (${plano.sessoes.length} sessões)`;
      } catch (e) {
        console.error("Erro atualizarHomeEstudo:", e);
      }
    }

    // ------------------------------------------------------
    // REVISÕES PENDENTES
    // ------------------------------------------------------
    function preencherRevisoesPendentes() {
      const box = document.getElementById("liora-revisoes-box");
      const list = document.getElementById("liora-revisoes-list");

      const sm = window.lioraEstudos;
      if (!sm?.getRevisoesPendentes) return;

      const revs = sm.getRevisoesPendentes();
      if (!revs.length) return box.classList.add("hidden");

      box.classList.remove("hidden");
      list.innerHTML = "";

      revs.forEach(s => {
        const pct = Math.round(s.retencao || 0);
        const color =
          pct >= 70 ? "var(--brand)"
            : pct >= 40 ? "orange"
              : "red";

        const card = document.createElement("div");
        card.className = "liora-rev-card";

        card.innerHTML = `
          <div class="flex justify-between items-start">
            <div>
              <div class="font-semibold">${s.titulo}</div>
              <div class="text-xs text-[var(--muted)] mt-1">Próxima revisão: ${s.nextReviewISO}</div>
              <div class="liora-ret-bar mt-2">
                <div class="liora-ret-bar-fill" style="width:${pct}%; background:${color}"></div>
              </div>
              <div class="text-xs text-[var(--muted)] mt-1">${pct}% de retenção</div>
            </div>
            <button class="liora-rev-btn">Revisar</button>
          </div>
        `;

        card.querySelector(".liora-rev-btn").addEventListener("click", e => {
          e.stopPropagation();
          abrirSessaoParaRevisao(s.id);
        });

        card.addEventListener("click", () => abrirSessaoParaRevisao(s.id));

        list.appendChild(card);
      });
    }

    function abrirSessaoParaRevisao(sessaoId) {
      const sm = window.lioraEstudos;
      const plano = sm?.getPlanoAtivo();
      if (!plano) return;

      (plano.origem === "tema" ? btnHomeTema : btnHomeUpload)?.click();

      const index = plano.sessoes.findIndex(s => s.id === sessaoId);
      if (index < 0) return;

      setTimeout(() => {
        window.lioraIrParaSessao?.(index, true);
      }, 350);
    }

    // ------------------------------------------------------
    // ESTUDOS RECENTES
    // ------------------------------------------------------
    function preencherEstudosRecentes() {
      const container = document.getElementById("liora-estudos-recentes");
      const list = document.getElementById("liora-estudos-list");

      const sm = window.lioraEstudos;
      if (!sm?.listarRecentes) return;

      const recentes = sm.listarRecentes(5);
      if (!recentes.length) return container.classList.add("hidden");

      container.classList.remove("hidden");
      list.innerHTML = "";

      recentes.forEach(plano => {
        const progresso =
          plano.sessoes.reduce((a, s) => a + (s.progresso || 0), 0) /
          plano.sessoes.length;

        const b = document.createElement("button");
        b.className =
          "liora-card-recent p-3 border rounded-xl text-left border-[var(--border)]";
        b.innerHTML = `
          <div class="font-semibold">${plano.tema}</div>
          <div class="text-sm text-[var(--muted)]">
            ${plano.sessoes.length} sessões • ${progresso.toFixed(0)}% concluído
          </div>
        `;

        b.addEventListener("click", () => {
          window.lioraEstudos._forcarAtivo = plano.id;
          window.lioraContinueStudy?.();
        });

        list.appendChild(b);
      });
    }

    // ------------------------------------------------------
    // LISTENERS GLOBAIS
    // ------------------------------------------------------
    window.addEventListener("liora:plan-updated", () => atualizarHomeEstudo("event"));
    window.addEventListener("liora:plan-updated", preencherRevisoesPendentes);
    window.addEventListener("liora:review-updated", preencherRevisoesPendentes);
    window.addEventListener("liora:plan-updated", preencherEstudosRecentes);

    // ------------------------------------------------------
    // NAVEGAÇÃO PRINCIPAL
    // ------------------------------------------------------
    btnHomeTema?.addEventListener("click", () => {
      showApp();
      hideAllPanels();
      painelEstudo.classList.remove("hidden");
      painelTema.classList.remove("hidden");

      setView("Plano por tema", "A Liora monta um plano completo para você.");
      window.hideSimFab();
      window.showFabHome();
    });

    btnHomeUpload?.addEventListener("click", () => {
      showApp();
      hideAllPanels();
      painelEstudo.classList.remove("hidden");
      painelUpload.classList.remove("hidden");

      setView("Plano via PDF", "Envie seu PDF para gerar um plano completo.");
      window.hideSimFab();
      window.showFabHome();
    });

    btnHomeSimulados?.addEventListener("click", () => {
      showApp();
      hideAllPanels();
      areaSimulado.classList.remove("hidden");

      setView(
        "Simulados Inteligentes",
        "Monte simulados personalizados com IA"
      );

      window.showSimFab();
      window.showFabHome();

      setTimeout(() => {
        window.lioraPreFillSimulado?.();
      }, 150);
    });

    btnHomeDashboard?.addEventListener("click", () => {
      showApp();
      hideAllPanels();
      areaDashboard.classList.remove("hidden");

      setView("Meu desempenho", "Veja seu resultado em simulados");

      window.hideSimFab();
      window.showFabHome();

      window.lioraDashboard?.atualizar?.();
    });

    // ------------------------------------------------------
    // ESTADO INICIAL
    // ------------------------------------------------------
    window.lioraHardReset();
    setTimeout(() => atualizarHomeEstudo("startup"), 150);

    console.log("🟢 NAV-HOME v79 pronto!");
  });

  // ------------------------------------------------------
  // LOAD REAL — GARANTE MOBILE E LOCALSTORAGE
  // ------------------------------------------------------
  window.addEventListener("load", () => {
    console.log("🌐 NAV-HOME: window.load → safe sync");

    const safe = from =>
      window.dispatchEvent(new Event("liora:plan-updated"));

    setTimeout(() => safe("load+300"), 300);
    setTimeout(() => safe("load+1000"), 1000);
    setTimeout(() => safe("load+2500"), 2500);
  });
})();
