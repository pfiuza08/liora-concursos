// ==========================================================
// 📊 LIORA — DASHBOARD PREMIUM (v4-COMMERCIAL)
// - UI refinada + microinterações
// - Estados vazios premium
// - Mini-gráficos nativos HTML/CSS
// - Integra com lioraLoading e lioraError
// - Integrado ao nav-home via window.lioraDashboard.atualizar()
// ==========================================================

(function () {
  console.log("🔵 Liora Dashboard PREMIUM v4 carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    const HIST_KEY = "liora:simulados:historico";

    const els = {
      dashEmpty: document.getElementById("dash-empty"),
      dashResumo: document.getElementById("dash-resumo"),
      dashBancas: document.getElementById("dash-bancas"),
      dashUltimos: document.getElementById("dash-ultimos"),
    };

    if (!els.dashResumo) {
      console.warn("⚠️ Dashboard Premium: elementos não encontrados.");
      return;
    }

    // ==========================================================
    // HELPERS PREMIUM
    // ==========================================================

    function carregarHistorico() {
      try {
        const raw = localStorage.getItem(HIST_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function formatarData(iso) {
      const d = new Date(iso || Date.now());
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
      const pct = Math.min(100, Math.max(5, valor));
      return `
        <div class="sim-bar-outer">
          <div class="sim-bar-inner" style="width:${pct}%;"></div>
        </div>
      `;
    }

    // ==========================================================
    // DASHBOARD PREMIUM
    // ==========================================================
    function renderDashboard() {
      const hist = carregarHistorico();

      // limpa áreas
      els.dashResumo.innerHTML = "";
      els.dashBancas.innerHTML = "";
      els.dashUltimos.innerHTML = "";

      // ------------------------------------------------------
      // ESTADO VAZIO PREMIUM
      // ------------------------------------------------------
      if (!hist.length) {
        els.dashEmpty.classList.remove("hidden");
        els.dashEmpty.innerHTML = `
          <div class="text-center opacity-80">
            <p class="text-sm">Você ainda não fez simulados.</p>
            <p class="text-xs text-[var(--muted)] mt-1">
              Quando você concluir um simulado, sua evolução aparecerá aqui.
            </p>
          </div>
        `;
        return;
      }

      els.dashEmpty.classList.add("hidden");

      // ------------------------------------------------------
      // 1) RESUMO GERAL PREMIUM
      // ------------------------------------------------------
      const total = hist.length;
      const mediaPerc =
        Math.round(
          (hist.reduce((acc, h) => acc + Number(h.perc || 0), 0) / total) * 10
        ) / 10;

      const totalQuestoes = hist.reduce(
        (acc, h) => acc + Number(h.qtd || 0),
        0
      );

      const tempoSeg = hist.reduce(
        (acc, h) => acc + Number(h.tempoSeg || 0),
        0
      );
      const tempoMin = Math.round(tempoSeg / 60);

      const freqBanca = {};
      const freqTema = {};

      hist.forEach(h => {
        const b = (h.banca || "Outra").toUpperCase();
        freqBanca[b] = (freqBanca[b] || 0) + 1;

        const t = (h.tema || "").trim();
        if (t) freqTema[t] = (freqTema[t] || 0) + 1;
      });

      const bancaTop = Object.entries(freqBanca).sort((a,b)=>b[1]-a[1])[0][0];
      const temaTop = Object.entries(freqTema).sort((a,b)=>b[1]-a[1])[0]?.[0] || "Diversos";

      els.dashResumo.innerHTML = `
        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Simulados realizados</div>
          <div class="sim-score">${total}</div>
          <p class="sim-desc">Quantidade total concluída</p>
        </div>

        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Média de acertos</div>
          <div class="sim-score">${mediaPerc}%</div>
          <p class="sim-desc">Percentual médio</p>
        </div>

        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Tempo & questões</div>
          <p class="sim-detail"><strong>Tempo total:</strong> ${tempoMin} min</p>
          <p class="sim-detail"><strong>Questões:</strong> ${totalQuestoes}</p>
          <p class="sim-desc mt-1">
            Banca mais treinada: <strong>${bancaTop}</strong><br>
            Tema mais recorrente: <strong>${temaTop}</strong>
          </p>
        </div>
      `;

      // ------------------------------------------------------
      // 2) DESEMPENHO POR BANCA (tabela premium)
      // ------------------------------------------------------
      const stats = {};
      hist.forEach(h => {
        const b = (h.banca || "OUTRA").toUpperCase();
        if (!stats[b]) stats[b] = { qtd: 0, soma: 0 };
        stats[b].qtd++;
        stats[b].soma += Number(h.perc || 0);
      });

      const linhas = Object.entries(stats)
        .sort((a,b)=>b[1].qtd - a[1].qtd)
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

      // ------------------------------------------------------
      // 3) ÚLTIMOS SIMULADOS (cartões premium)
      // ------------------------------------------------------
      const ultimos = hist.slice(-5).reverse();

      els.dashUltimos.innerHTML = `
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
    }

    // torna pública para nav-home
    window.lioraDashboard = {
      atualizar: renderDashboard,
    };

    console.log("🟢 Dashboard PREMIUM v4 inicializado.");
  });
})();
