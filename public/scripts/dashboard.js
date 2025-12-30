// ==========================================================
// 📊 LIORA — DASHBOARD CANONICAL (v7.3-LAZY)
// - Vive em liora-app
// - Lazy init via ui-router (ui:liora-app)
// - Histórico: localStorage "liora:simulados:historico"
// - Estudos: lioraEstudos.listarRecentes / getAll
// - API global: window.lioraDashboard.atualizar()
// ==========================================================

(function () {
  const HIST_KEY = "liora:simulados:historico";
  let initialized = false;
  let els = null;

  console.log("🔵 Liora Dashboard v7.3 carregado (lazy)");

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
      dashBancas: $("dash-bancas"),
      dashUltimos: $("dash-ultimos"),
    };

    if (
      !els.dashEmpty ||
      !els.dashResumo ||
      !els.dashBancas ||
      !els.dashUltimos
    ) {
      // UI ainda não ativa → não inicializa
      return;
    }

    initialized = true;
    console.log("🟢 Dashboard v7.3 inicializado");
    renderDashboard();
  }

  // ======================================================
  // HELPERS
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

  function carregarEstudos() {
    try {
      if (!window.lioraEstudos) return [];

      if (typeof window.lioraEstudos.getAll === "function") {
        return window.lioraEstudos.getAll() || [];
      }

      if (typeof window.lioraEstudos.listarRecentes === "function") {
        const planos = window.lioraEstudos.listarRecentes(10) || [];
        return planos.map((p) => {
          const sessoes = Array.isArray(p.sessoes) ? p.sessoes : [];
          const concluidas = sessoes.filter(
            (s) => (s.progresso || 0) >= 100
          ).length;

          return {
            tema: p.tema || "Plano sem título",
            origem: p.origem || "tema",
            nivel: p.nivel || "—",
            sessoesTotal: sessoes.length,
            sessoesConcluidas: concluidas,
            atualizadoEm:
              p.atualizadoEm || p.criadoEm || new Date().toISOString(),
          };
        });
      }

      return [];
    } catch {
      return [];
    }
  }

  function formatarData(value) {
    const d = new Date(value || Date.now());
    if (isNaN(d.getTime())) return "—";
    return `${d.toLocaleDateString("pt-BR")} · ${d.toLocaleTimeString(
      "pt-BR",
      { hour: "2-digit", minute: "2-digit" }
    )}`;
  }

  function criarBarra(valor) {
    const pct = Math.min(100, Math.max(5, Number(valor) || 0));
    return `
      <div class="sim-bar-outer">
        <div class="sim-bar-inner" style="width:${pct}%"></div>
      </div>
    `;
  }

  function calcularProgresso(estudo) {
    const t = Number(estudo.sessoesTotal || 0);
    const c = Number(estudo.sessoesConcluidas || 0);
    return t > 0 ? Math.round((c / t) * 100) : 0;
  }

  function ordenarPorData(hist) {
    return hist
      .slice()
      .sort(
        (a, b) =>
          new Date(a.dataISO || 0).getTime() -
          new Date(b.dataISO || 0).getTime()
      );
  }

  // ======================================================
  // RENDER
  // ======================================================
  function renderDashboard() {
    if (!initialized || !els) return;

    const hist = carregarHistoricoSimulados();
    const estudos = carregarEstudos();

    const temSimulados = hist.length > 0;
    const temEstudos = estudos.length > 0;

    els.dashResumo.innerHTML = "";
    els.dashBancas.innerHTML = "";
    els.dashUltimos.innerHTML = "";

    // ------------------------------
    // ESTADO VAZIO REAL
    // ------------------------------
    if (!temSimulados && !temEstudos) {
      els.dashEmpty.classList.remove("hidden");
      els.dashEmpty.innerHTML = `
        <div class="text-center opacity-80">
          <p class="text-sm">
            Você ainda não fez simulados nem criou planos de estudo.
          </p>
          <p class="text-xs text-[var(--muted)] mt-1">
            Assim que começar a estudar, sua evolução aparecerá aqui.
          </p>
        </div>
      `;
      return;
    }

    els.dashEmpty.classList.add("hidden");
    els.dashEmpty.innerHTML = "";

    // ======================================================
    // RESUMO GERAL
    // ======================================================
    let mediaPerc = 0;
    let totalQuestoes = 0;
    let tempoMin = 0;

    if (temSimulados) {
      mediaPerc =
        Math.round(
          (hist.reduce((a, h) => a + Number(h.perc || 0), 0) /
            hist.length) *
            10
        ) / 10;

      totalQuestoes = hist.reduce((a, h) => a + Number(h.qtd || 0), 0);
      tempoMin = Math.round(
        hist.reduce((a, h) => a + Number(h.tempoSeg || 0), 0) / 60
      );
    }

    const totalEstudos = estudos.length;
    const mediaProgresso =
      totalEstudos > 0
        ? Math.round(
            (estudos.reduce(
              (a, e) => a + calcularProgresso(e),
              0
            ) /
              totalEstudos) *
              10
          ) / 10
        : 0;

    els.dashResumo.innerHTML = `
      <div class="sim-resultado-card">
        <div class="sim-resultado-titulo">Visão geral</div>
        <div class="sim-score">${temSimulados ? `${mediaPerc}%` : "—"}</div>
        <p class="sim-desc">
          ${
            temSimulados
              ? "Média geral de desempenho nos simulados."
              : "Faça seu primeiro simulado para ver métricas aqui."
          }
        </p>
        <p class="sim-detail mt-1">
          Simulados: <strong>${hist.length}</strong><br>
          Questões: <strong>${totalQuestoes}</strong><br>
          Tempo total: <strong>${tempoMin} min</strong><br>
          Planos ativos: <strong>${totalEstudos}</strong><br>
          Progresso médio dos planos: <strong>${mediaProgresso}%</strong>
        </p>
      </div>
    `;

    // ======================================================
    // DESEMPENHO POR BANCA
    // ======================================================
    if (temSimulados) {
      const stats = {};
      hist.forEach((h) => {
        const b = (h.banca || "OUTRA").toUpperCase();
        if (!stats[b]) stats[b] = { qtd: 0, soma: 0 };
        stats[b].qtd++;
        stats[b].soma += Number(h.perc || 0);
      });

      els.dashBancas.innerHTML = `
        <div class="sim-dashboard">
          <h4 class="sim-subtitulo">Desempenho por banca</h4>
          <table class="sim-dashboard-table">
            <thead>
              <tr>
                <th>Banca</th>
                <th>Simulados</th>
                <th>Média</th>
                <th>Progresso</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stats)
                .map(([b, s]) => {
                  const m = Math.round((s.soma / s.qtd) * 10) / 10;
                  return `
                    <tr>
                      <td>${b}</td>
                      <td>${s.qtd}</td>
                      <td>${m}%</td>
                      <td>${criarBarra(m)}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    // ======================================================
    // ÚLTIMOS SIMULADOS + ESTUDOS
    // ======================================================
    const blocos = [];

    if (temSimulados) {
      const ult = ordenarPorData(hist).slice(-5).reverse();
      blocos.push(`
        <div class="sim-dashboard">
          <h4 class="sim-subtitulo">Últimos simulados</h4>
          <ul class="sim-lista-resultados">
            ${ult
              .map(
                (h) => `
                <li class="sim-resultado-item">
                  <div class="sim-resultado-header">
                    <span>${formatarData(h.dataISO)}</span>
                    <span>${h.banca}</span>
                  </div>
                  <p class="text-xs text-[var(--muted)]">
                    Tema: ${h.tema || "—"}
                  </p>
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
      `);
    }

    if (temEstudos) {
      blocos.push(`
        <div class="sim-dashboard" style="margin-top:1rem">
          <h4 class="sim-subtitulo">Estudos recentes</h4>
          <ul class="sim-lista-resultados">
            ${estudos
              .slice(0, 5)
              .map((e) => {
                const p = calcularProgresso(e);
                return `
                  <li class="sim-resultado-item">
                    <div class="sim-resultado-header">
                      <span>${formatarData(e.atualizadoEm)}</span>
                      <span>${e.origem === "upload" ? "PDF" : "Tema"}</span>
                    </div>
                    <p class="text-xs text-[var(--muted)]">
                      ${e.tema} · Nível ${e.nivel}
                    </p>
                    <div class="sim-resultado-info">
                      <span>${e.sessoesConcluidas}/${e.sessoesTotal}</span>
                      <span class="sim-badge">${p}%</span>
                    </div>
                    ${criarBarra(p)}
                  </li>
                `;
              })
              .join("")}
          </ul>
        </div>
      `);
    }

    els.dashUltimos.innerHTML = blocos.join("");
  }

  // ======================================================
  // API GLOBAL
  // ======================================================
  window.lioraDashboard = {
    atualizar() {
      try {
        window.lioraLoading?.show?.("Carregando dashboard...");
        initDashboard();
        renderDashboard();
      } catch (e) {
        console.error(e);
        window.lioraError?.show?.(
          "Não foi possível carregar o dashboard agora."
        );
      } finally {
        window.lioraLoading?.hide?.();
      }
    },
  };

  // ------------------------------------------------------
  // Lazy hook
  // ------------------------------------------------------
  document.addEventListener("ui:liora-app", initDashboard);
})();
