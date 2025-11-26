// ==========================================================
// 📊 LIORA — DASHBOARD PREMIUM (v5-COMMERCIAL-DIA2)
// - UI refinada + microinterações
// - Estados vazios premium (simulados + estudos)
// - Mini-gráficos nativos HTML/CSS
// - Lê histórico de simulados (localStorage)
// - Lê memória de estudos (window.lioraEstudos)
// - Integra com lioraLoading e lioraError
// - Integrado ao nav-home via window.lioraDashboard.atualizar()
// ==========================================================

(function () {
  console.log("🔵 Liora Dashboard PREMIUM v5 carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    const HIST_KEY = "liora:simulados:historico";

    const els = {
      dashEmpty: document.getElementById("dash-empty"),
      dashResumo: document.getElementById("dash-resumo"),
      dashBancas: document.getElementById("dash-bancas"),
      dashUltimos: document.getElementById("dash-ultimos"),
    };

    if (!els.dashResumo || !els.dashBancas || !els.dashUltimos) {
      console.warn("⚠️ Dashboard Premium: elementos não encontrados.");
      return;
    }

    // ==========================================================
    // HELPERS
    // ==========================================================

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
        if (!window.lioraEstudos || typeof window.lioraEstudos.getAll !== "function") {
          return [];
        }
        return window.lioraEstudos.getAll();
      } catch {
        return [];
      }
    }

    function formatarData(value) {
      let d;
      if (value instanceof Date) {
        d = value;
      } else {
        d = new Date(value || Date.now());
      }
      if (isNaN(d.getTime())) d = new Date();

      const data = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
      const hora = d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${data} · ${hora}`;
    }

    function criarBarra(valor) {
      const pct = Math.min(100, Math.max(5, Number(valor) || 0));
      return `
        <div class="sim-bar-outer">
          <div class="sim-bar-inner" style="width:${pct}%;"></div>
        </div>
      `;
    }

    function calcularProgresso(estudo) {
      const total = Number(estudo.sessoesTotal || 0);
      const concl = Number(estudo.sessoesConcluidas || 0);
      if (!total || total <= 0) return 0;
      return Math.round((concl / total) * 100);
    }

    // ==========================================================
    // RENDER PRINCIPAL
    // ==========================================================
    function renderDashboard() {
      const hist = carregarHistoricoSimulados();
      const estudos = carregarEstudos();

      // limpa áreas
      els.dashResumo.innerHTML = "";
      els.dashBancas.innerHTML = "";
      els.dashUltimos.innerHTML = "";

      const temSimulados = hist.length > 0;
      const temEstudos = estudos.length > 0;

      // ------------------------------------------------------
      // ESTADO VAZIO PREMIUM
      // ------------------------------------------------------
      if (!temSimulados && !temEstudos) {
        if (els.dashEmpty) {
          els.dashEmpty.classList.remove("hidden");
          els.dashEmpty.innerHTML = `
            <div class="text-center opacity-80">
              <p class="text-sm">Você ainda não fez simulados nem gerou planos de estudo.</p>
              <p class="text-xs text-[var(--muted)] mt-1">
                Assim que criar um plano ou concluir um simulado, sua evolução aparecerá aqui.
              </p>
            </div>
          `;
        }
        return;
      }

      if (els.dashEmpty) {
        els.dashEmpty.classList.add("hidden");
        els.dashEmpty.innerHTML = "";
      }

      // ======================================================
      // 1) RESUMO GERAL PREMIUM (Simulados + Estudos)
      // ======================================================
      let totalSimulados = hist.length;
      let mediaPerc = 0;
      let totalQuestoes = 0;
      let tempoSeg = 0;

      let freqBanca = {};
      let freqTemaSim = {};

      if (temSimulados) {
        mediaPerc =
          Math.round(
            (hist.reduce((acc, h) => acc + Number(h.perc || 0), 0) / totalSimulados) * 10
          ) / 10;

        totalQuestoes = hist.reduce(
          (acc, h) => acc + Number(h.qtd || 0),
          0
        );

        tempoSeg = hist.reduce(
          (acc, h) => acc + Number(h.tempoSeg || 0),
          0
        );

        hist.forEach(h => {
          const b = (h.banca || "OUTRA").toUpperCase();
          freqBanca[b] = (freqBanca[b] || 0) + 1;

          const t = (h.tema || "").trim();
          if (t) freqTemaSim[t] = (freqTemaSim[t] || 0) + 1;
        });
      }

      const tempoMin = Math.round(tempoSeg / 60);

      const bancaTop = temSimulados
        ? Object.entries(freqBanca).sort((a, b) => b[1] - a[1])[0][0]
        : "—";

      const temaTopSim = temSimulados
        ? (Object.entries(freqTemaSim).sort((a, b) => b[1] - a[1])[0]?.[0] || "Diversos")
        : "—";

      // Estudos
      const totalEstudos = estudos.length;
      const totalSessoes = estudos.reduce(
        (acc, e) => acc + Number(e.sessoesTotal || 0),
        0
      );
      const mediaProgresso =
        totalEstudos > 0
          ? Math.round(
              (estudos.reduce((acc, e) => acc + calcularProgresso(e), 0) /
                totalEstudos) * 10
            ) / 10
          : 0;

      const freqTemaEstudos = {};
      estudos.forEach(e => {
        const t = (e.tema || "").trim();
        if (!t) return;
        freqTemaEstudos[t] = (freqTemaEstudos[t] || 0) + 1;
      });

      const temaTopEstudo = totalEstudos
        ? (Object.entries(freqTemaEstudos).sort((a, b) => b[1] - a[1])[0]?.[0] || "Diversos")
        : "—";

      els.dashResumo.innerHTML = `
        <!-- Card 1: Simulados realizados -->
        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Simulados realizados</div>
          <div class="sim-score">${temSimulados ? totalSimulados : 0}</div>
          <p class="sim-desc">
            ${temSimulados ? "Quantidade total concluída" : "Ainda não há simulados concluídos"}
          </p>
        </div>

        <!-- Card 2: Desempenho em simulados -->
        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Média de acertos</div>
          <div class="sim-score">${temSimulados ? `${mediaPerc}%` : "—"}</div>
          <p class="sim-desc">
            ${temSimulados ? "Percentual médio nos simulados" : "Faça um simulado para ver seu desempenho."}
          </p>
        </div>

        <!-- Card 3: Estudos e progresso -->
        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Estudos & progresso</div>
          <p class="sim-detail">
            <strong>Planos ativos:</strong> ${totalEstudos}
          </p>
          <p class="sim-detail">
            <strong>Sessões planejadas:</strong> ${totalSessoes}
          </p>
          <p class="sim-detail">
            <strong>Progresso médio:</strong> ${totalEstudos ? `${mediaProgresso}%` : "—"}
          </p>
          <p class="sim-desc mt-1">
            Tema mais recorrente em simulados: <strong>${temaTopSim}</strong><br>
            Tema mais estudado: <strong>${temaTopEstudo}</strong>
          </p>
        </div>
      `;

      // ======================================================
      // 2) DESEMPENHO POR BANCA (Simulados)
      // ======================================================
      if (temSimulados) {
        const stats = {};
        hist.forEach(h => {
          const b = (h.banca || "OUTRA").toUpperCase();
          if (!stats[b]) stats[b] = { qtd: 0, soma: 0 };
          stats[b].qtd++;
          stats[b].soma += Number(h.perc || 0);
        });

        const linhas = Object.entries(stats)
          .sort((a, b) => b[1].qtd - a[1].qtd)
          .map(([banca, st]) => {
            const media = Math.round((st.soma / st.qtd) * 10) / 10;
            return `
              <tr>
                <td>${banca}</td>
                <td>${st.qtd}</td>
                <td>${media}%</td>
                <td>${criarBarra(media)}</td>
              </tr>
            `;
          })
          .join("");

        els.dashBancas.innerHTML = `
          <div class="sim-dashboard">
            <h4 class="sim-subtitulo">Desempenho por banca</h4>
            <table class="sim-dashboard-table">
              <thead>
                <tr>
                  <th>Banca</th>
                  <th>Total</th>
                  <th>Média</th>
                  <th>Progresso</th>
                </tr>
              </thead>
              <tbody>${linhas}</tbody>
            </table>
          </div>
        `;
      } else {
        els.dashBancas.innerHTML = `
          <div class="sim-dashboard">
            <h4 class="sim-subtitulo">Desempenho por banca</h4>
            <p class="text-sm text-[var(--muted)]">
              Assim que você concluir simulados, o desempenho por banca aparecerá aqui.
            </p>
          </div>
        `;
      }

      // ======================================================
      // 3) ÚLTIMOS SIMULADOS + ESTUDOS RECENTES
      // ======================================================
      const blocos = [];

      // 3.1 Últimos simulados
      if (temSimulados) {
        const ultimos = hist.slice(-5).reverse();

        const htmlSimulados = `
          <div class="sim-dashboard">
            <h4 class="sim-subtitulo">Últimos simulados</h4>
            <ul class="sim-lista-resultados">
              ${ultimos
                .map(h => `
                  <li class="sim-resultado-item">
                    <div class="sim-resultado-header">
                      <span class="sim-resultado-data">${formatarData(h.dataISO)}</span>
                      <span class="sim-resultado-banca">${h.banca}</span>
                    </div>

                    <p class="sim-resultado-tema text-xs text-[var(--muted)]">
                      Tema: ${h.tema || "Não informado"}
                    </p>

                    <div class="sim-resultado-info">
                      <span><strong>Acertos:</strong> ${h.acertos}/${h.qtd}</span>
                      <span class="sim-badge">${h.perc}%</span>
                    </div>

                    ${criarBarra(h.perc)}
                  </li>
                `)
                .join("")}
            </ul>
          </div>
        `;
        blocos.push(htmlSimulados);
      }

      // 3.2 Estudos recentes (vinculados à memória de estudos)
      if (temEstudos) {
        const recentes = estudos.slice(0, 5);

        const htmlEstudos = `
          <div class="sim-dashboard" style="margin-top:1rem;">
            <h4 class="sim-subtitulo">Estudos recentes</h4>
            <ul class="sim-lista-resultados">
              ${recentes
                .map(e => {
                  const prog = calcularProgresso(e);
                  const labelOrigem =
                    e.origem === "upload" ? "Plano por PDF" : "Plano por tema";
                  return `
                    <li class="sim-resultado-item">
                      <div class="sim-resultado-header">
                        <span class="sim-resultado-data">
                          ${formatarData(e.atualizadoEm)}
                        </span>
                        <span class="sim-resultado-banca">
                          ${labelOrigem}
                        </span>
                      </div>

                      <p class="sim-resultado-tema text-xs text-[var(--muted)]">
                        Tema: ${e.tema} · Nível: ${e.nivel || "—"}
                      </p>

                      <div class="sim-resultado-info">
                        <span>
                          <strong>Sessões:</strong> ${e.sessoesConcluidas}/${e.sessoesTotal}
                        </span>
                        <span class="sim-badge">${prog}%</span>
                      </div>

                      ${criarBarra(prog)}
                    </li>
                  `;
                })
                .join("")}
            </ul>
          </div>
        `;
        blocos.push(htmlEstudos);
      }

      els.dashUltimos.innerHTML = blocos.join("");
    }

    // ==========================================================
    // EXPOSTO GLOBAL (nav-home chama aqui)
    // ==========================================================
    function atualizarDashboard() {
      try {
        if (window.lioraLoading && typeof window.lioraLoading.show === "function") {
          window.lioraLoading.show("Carregando dashboard...");
        }
        renderDashboard();
      } catch (e) {
        console.error("❌ Erro ao atualizar dashboard:", e);
        if (window.lioraError && typeof window.lioraError.show === "function") {
          window.lioraError.show("Não foi possível carregar o dashboard agora. Tente novamente em instantes.");
        }
      } finally {
        if (window.lioraLoading && typeof window.lioraLoading.hide === "function") {
          window.lioraLoading.hide();
        }
      }
    }

    window.lioraDashboard = {
      atualizar: atualizarDashboard,
    };

    console.log("🟢 Dashboard PREMIUM v5 inicializado.");
  });
})();
