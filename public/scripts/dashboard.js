// ==========================================================
// 📊 LIORA — DASHBOARD CANONICAL (v8.0-STUDY)
// - Integra Study Manager (planos, sessões, tempo, streak)
// - Simulados continuam como histórico complementar
// - Lazy init via ui-router (ui:liora-app)
// ==========================================================

(function () {
  const HIST_KEY = "liora:simulados:historico";
  let initialized = false;
  let els = null;

  console.log("🔵 Liora Dashboard v8.0-STUDY carregado (lazy)");

  // ------------------------------------------------------
  // Utilitário
  // ------------------------------------------------------
  function $(id) {
    return document.getElementById(id);
  }

  // ------------------------------------------------------
  // INIT (lazy)
  // ------------------------------------------------------
  function initDashboard() {
    if (initialized) return;

    els = {
      dashEmpty: $("dash-empty"),
      dashResumo: $("dash-resumo"),
      dashUltimos: $("dash-ultimos"),
    };

    if (!els.dashEmpty || !els.dashResumo || !els.dashUltimos) {
      return; // UI ainda não ativa
    }

    initialized = true;
    console.log("🟢 Dashboard v8.0 inicializado");
    renderDashboard();
  }

  // ======================================================
  // HELPERS — ESTUDOS
  // ======================================================
  function getResumoPlanoAtual() {
    const estudos = window.lioraEstudos;
    const sessoes = estudos?.sessoes || [];
    const meta = estudos?.meta || {};

    if (!sessoes.length) return null;

    let concluidas = 0;
    sessoes.forEach((s, i) => {
      if (window.lioraStudy.statusSessao(s, i) === "concluida") concluidas++;
    });

    const pct = Math.round((concluidas / sessoes.length) * 100);

    return {
      titulo: meta.titulo || meta.tema || "Plano atual",
      total: sessoes.length,
      concluidas,
      pct,
    };
  }

  function getTempoTotalMin() {
    const sessoes = window.lioraEstudos?.sessoes || [];
    let totalMs = 0;
    sessoes.forEach((s, i) => {
      totalMs += window.lioraStudy.tempoSessao(s, i);
    });
    return Math.round(totalMs / 60000);
  }

  function getStreak() {
    return window.lioraStudy.estado?.streak || {
      atual: 0,
      recorde: 0,
    };
  }

  function getProximaSessao() {
    const sessoes = window.lioraEstudos?.sessoes || [];
    for (let i = 0; i < sessoes.length; i++) {
      if (window.lioraStudy.statusSessao(sessoes[i], i) !== "concluida") {
        return { index: i, sessao: sessoes[i] };
      }
    }
    return null;
  }

  // ======================================================
  // HELPERS — SIMULADOS
  // ======================================================
  function carregarHistoricoSimulados() {
    try {
      const raw = localStorage.getItem(HIST_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function formatarData(value) {
    const d = new Date(value || Date.now());
    if (isNaN(d.getTime())) return "—";
    return `${d.toLocaleDateString("pt-BR")} · ${d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  function criarBarra(valor) {
    const pct = Math.min(100, Math.max(5, Number(valor) || 0));
    return `
      <div class="sim-bar-outer">
        <div class="sim-bar-inner" style="width:${pct}%"></div>
      </div>
    `;
  }

  // ======================================================
  // RENDER
  // ======================================================
  function renderDashboard() {
    if (!initialized || !els) return;

    const plano = getResumoPlanoAtual();
    const tempoMin = getTempoTotalMin();
    const streak = getStreak();
    const prox = getProximaSessao();
    const hist = carregarHistoricoSimulados();

    els.dashResumo.innerHTML = "";
    els.dashUltimos.innerHTML = "";

    if (!plano && hist.length === 0) {
      els.dashEmpty.classList.remove("hidden");
      els.dashEmpty.innerHTML = `
        <div class="text-center opacity-80">
          <p class="text-sm">
            Você ainda não iniciou estudos nem simulados.
          </p>
          <p class="text-xs text-[var(--muted)] mt-1">
            Assim que começar, sua evolução aparecerá aqui.
          </p>
        </div>
      `;
      return;
    }

    els.dashEmpty.classList.add("hidden");

    // ------------------------------
    // RESUMO CENTRAL
    // ------------------------------
    els.dashResumo.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div class="p-4 rounded-xl border bg-[var(--card)]">
          <div class="text-sm text-[var(--muted)]">Plano atual</div>
          <div class="font-semibold mt-1">${plano?.titulo || "—"}</div>
          ${
            plano
              ? `
            <div class="text-sm mt-2">
              ${plano.concluidas}/${plano.total} sessões · ${plano.pct}%
            </div>
            <div class="mt-3 h-2 rounded-full bg-black/30 overflow-hidden">
              <div class="h-2 rounded-full bg-[var(--brand)]" style="width:${plano.pct}%"></div>
            </div>
          `
              : `<p class="text-sm mt-2">Nenhum plano ativo</p>`
          }
        </div>

        <div class="p-4 rounded-xl border bg-[var(--card)]">
          <div class="text-sm text-[var(--muted)]">Tempo estudado</div>
          <div class="text-2xl font-bold mt-1">${tempoMin} min</div>
          <div class="text-xs text-[var(--muted)] mt-1">Tempo real acumulado</div>
        </div>

        <div class="p-4 rounded-xl border bg-[var(--card)]">
          <div class="text-sm text-[var(--muted)]">Ritmo</div>
          <div class="text-2xl font-bold mt-1">🔥 ${streak.atual}</div>
          <div class="text-xs text-[var(--muted)] mt-1">
            ${streak.atual === 0 ? "Comece hoje" : "dias consecutivos"}
          </div>
        </div>

      </div>
    `;

    // ------------------------------
    // AÇÃO RECOMENDADA
    // ------------------------------
    els.dashUltimos.innerHTML = `
      <div class="p-5 rounded-xl border bg-[var(--card)]">
        <div class="font-semibold mb-2">Próxima ação</div>
        ${
          prox
            ? `
          <button class="btn-primary" id="btn-dashboard-continuar">
            Continuar: ${prox.sessao.titulo || `Sessão ${prox.index + 1}`}
          </button>
        `
            : `<p class="text-sm text-[var(--muted)]">🎉 Todas as sessões concluídas.</p>`
        }
      </div>

      ${
        hist.length
          ? `
        <div class="sim-dashboard mt-6">
          <h4 class="sim-subtitulo">Últimos simulados</h4>
          <ul class="sim-lista-resultados">
            ${hist
              .slice(-5)
              .reverse()
              .map(
                (h) => `
              <li class="sim-resultado-item">
                <div class="sim-resultado-header">
                  <span>${formatarData(h.dataISO)}</span>
                  <span>${h.banca}</span>
                </div>
                <div class="sim-resultado-info">
                  <span>${h.acertos}/${h.qtd}</span>
                  <span class="sim-badge">${h.perc}%</span>
                </div>
                ${criarBarra(h.perc)}
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      `
          : ""
      }
    `;

    document
      .getElementById("btn-dashboard-continuar")
      ?.addEventListener("click", () => {
        window.dispatchEvent(
          new CustomEvent("liora:abrir-sessao", {
            detail: prox,
          })
        );
      });
  }

  // ======================================================
  // API GLOBAL
  // ======================================================
  window.lioraDashboard = {
    atualizar() {
      initDashboard();
      renderDashboard();
    },
  };

  // ------------------------------------------------------
  // Lazy hook
  // ------------------------------------------------------
  document.addEventListener("ui:liora-app", initDashboard);

  // ==========================================================
  // 🧠 LIORA — DASHBOARD COGNITIVO v1
  // ==========================================================
  
  function renderDashboardCognitivo() {
    const containerId = "dash-cognitivo";
    let container = document.getElementById(containerId);
  
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      container.className = "sim-dashboard";
      document.getElementById("area-dashboard")?.appendChild(container);
    }
  
    const hoje = new Date().toISOString().slice(0, 10);
    const estudos = window.lioraEstudos?.sessoes || [];
    const progresso = window.lioraStudy?.estado?.progresso || {};
    const conteudos = window.lioraStudy?.estado?.conteudo || {};
    const streak = window.lioraStudy?.estado?.streak || {};
  
    // --------------------------------------------------
    // Flashcards vencidos
    // --------------------------------------------------
    const planoId = window.lioraEstudos?.meta?.planoId;
    const flashVencidos =
      window.lioraFlashcards?.listarVencidosDoPlano?.(planoId) || [];
  
    // --------------------------------------------------
    // Sessões para revisão
    // --------------------------------------------------
    const sessoesRevisar = estudos.filter((s, i) =>
      typeof sessaoPrecisaRevisao === "function"
        ? sessaoPrecisaRevisao(s, i)
        : false
    );
  
    // --------------------------------------------------
    // Tempo de estudo
    // --------------------------------------------------
    let tempoHoje = 0;
    let tempoSemana = 0;
  
    Object.values(progresso).forEach((p) => {
      if (!p.finishedAt) return;
  
      const data = new Date(p.finishedAt).toISOString().slice(0, 10);
      const dias = (Date.now() - p.finishedAt) / 86400000;
  
      if (data === hoje) tempoHoje += p.totalTime || 0;
      if (dias <= 7) tempoSemana += p.totalTime || 0;
    });
  
    const fmt = (ms) => {
      const m = Math.floor(ms / 60000);
      return `${m} min`;
    };
  
    // --------------------------------------------------
    // Flashcards difíceis
    // --------------------------------------------------
    const flashDificeis = [];
  
    Object.values(conteudos).forEach((c) => {
      if (!Array.isArray(c.flashcards)) return;
      c.flashcards.forEach((f) => {
        if (f.ease && f.ease < 2.0) {
          flashDificeis.push(f);
        }
      });
    });
  
    // --------------------------------------------------
    // Render
    // --------------------------------------------------
    container.innerHTML = `
      <h4 class="sim-subtitulo">Painel Cognitivo</h4>
  
      <div class="grid gap-4">
  
        <div class="p-4 rounded-xl border bg-[var(--card)]">
          <div class="font-semibold">Hoje</div>
          <div class="text-sm text-[var(--muted)] mt-1">
            Flashcards vencidos: <b>${flashVencidos.length}</b><br>
            Sessões para revisão: <b>${sessoesRevisar.length}</b>
          </div>
        </div>
  
        <div class="p-4 rounded-xl border bg-[var(--card)]">
          <div class="font-semibold">Treino</div>
          <div class="text-sm text-[var(--muted)] mt-1">
            Tempo hoje: <b>${fmt(tempoHoje)}</b><br>
            Tempo na semana: <b>${fmt(tempoSemana)}</b><br>
            Streak atual: <b>${streak.atual || 0} dias</b>
          </div>
        </div>
  
        <div class="p-4 rounded-xl border bg-[var(--card)]">
          <div class="font-semibold">Fragilidades</div>
          <div class="text-sm text-[var(--muted)] mt-1">
            Sessões frágeis: <b>${sessoesRevisar.length}</b><br>
            Flashcards difíceis: <b>${flashDificeis.length}</b>
          </div>
        </div>
  
      </div>
    `;
  }
  
  // --------------------------------------------------
  // Hook automático no dashboard existente
  // --------------------------------------------------
  document.addEventListener("ui:liora-app", () => {
    try {
      renderDashboardCognitivo();
    } catch (e) {
      console.error("Erro no Dashboard Cognitivo", e);
    }
  });
  
})();
