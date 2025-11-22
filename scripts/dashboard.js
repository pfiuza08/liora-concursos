// ==========================================================
// 📊 LIORA — DASHBOARD / ÁREA DO ALUNO (v2)
// - Lê histórico de simulados em localStorage
// - Mostra resumo, bancas mais usadas e últimos simulados
// - Exporta window.lioraRenderDashboard() para ser chamado pelo nav-home
// ==========================================================

(function () {
  console.log("🔵 Liora Dashboard v2 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    const HIST_KEY = "liora:simulados:historico";

    const els = {
      areaDashboard: document.getElementById("area-dashboard"),
      dashResumo: document.getElementById("dash-resumo"),
      dashBancas: document.getElementById("dash-bancas"),
      dashUltimos: document.getElementById("dash-ultimos"),
    };

    if (!els.areaDashboard || !els.dashResumo) {
      console.warn("⚠️ Dashboard: elementos principais não encontrados.");
      return;
    }

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

    function renderDashboard() {
      const hist = carregarHistorico();

      if (els.dashResumo) els.dashResumo.innerHTML = "";
      if (els.dashBancas) els.dashBancas.innerHTML = "";
      if (els.dashUltimos) els.dashUltimos.innerHTML = "";

      if (!hist.length) {
        els.dashResumo.innerHTML = `
          <div class="sim-resultado-card col-span-3">
            <div class="sim-resultado-titulo">Ainda não há simulados registrados</div>
            <p class="text-sm text-[var(--muted)] mt-1">
              Quando você concluir simulados na Liora, um resumo da sua evolução vai aparecer aqui.
            </p>
          </div>
        `;
        return;
      }

      const total = hist.length;
      const mediaPerc =
        Math.round(
          (hist.reduce((acc, h) => acc + (Number(h.perc) || 0), 0) / total) *
            10
        ) / 10;

      const totalQuestoes = hist.reduce(
        (acc, h) => acc + (Number(h.qtd) || 0),
        0
      );

      const tempoTotalSeg = hist.reduce(
        (acc, h) => acc + (Number(h.tempoSeg) || 0),
        0
      );
      const tempoMin = Math.round(tempoTotalSeg / 60);

      const freqBanca = {};
      hist.forEach((h) => {
        const b = (h.banca || "Outra").toUpperCase();
        freqBanca[b] = (freqBanca[b] || 0) + 1;
      });
      const bancaTop = Object.entries(freqBanca).sort(
        (a, b) => b[1] - a[1]
      )[0][0];

      const freqTema = {};
      hist.forEach((h) => {
        const t = (h.tema || "").trim();
        if (!t) return;
        freqTema[t] = (freqTema[t] || 0) + 1;
      });
      const temaTopEntry = Object.entries(freqTema).sort(
        (a, b) => b[1] - a[1]
      )[0];
      const temaTop = temaTopEntry ? temaTopEntry[0] : "Diversos temas";

      els.dashResumo.innerHTML = `
        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Simulados realizados</div>
          <div class="sim-score" style="font-size:1.8rem;">${total}</div>
          <p class="text-xs text-[var(--muted)]">
            Quantidade de simulados concluídos neste dispositivo.
          </p>
        </div>

        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Média de acertos</div>
          <div class="sim-score" style="font-size:1.8rem;">${mediaPerc}%</div>
          <p class="text-xs text-[var(--muted)]">
            Média percentual considerando todos os simulados.
          </p>
        </div>

        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Tempo & questões</div>
          <p class="text-sm mt-1"><strong>Tempo total:</strong> ${tempoMin} min</p>
          <p class="text-sm"><strong>Questões respondidas:</strong> ${totalQuestoes}</p>
          <p class="text-xs text-[var(--muted)] mt-1">
            Banca mais treinada: <strong>${bancaTop}</strong><br>
            Tema mais recorrente: <strong>${temaTop}</strong>
          </p>
        </div>
      `;

      const statsPorBanca = {};
      hist.forEach((h) => {
        const b = (h.banca || "Outra").toUpperCase();
        if (!statsPorBanca[b]) {
          statsPorBanca[b] = { qtd: 0, somaPerc: 0 };
        }
        statsPorBanca[b].qtd += 1;
        statsPorBanca[b].somaPerc += Number(h.perc) || 0;
      });

      const linhasBanca = Object.entries(statsPorBanca)
        .sort((a, b) => b[1].qtd - a[1].qtd)
        .map(([banca, st]) => {
          const media = Math.round((st.somaPerc / st.qtd) * 10) / 10;
          const largura = Math.min(100, Math.max(5, media));

          return `
            <tr>
              <td>${banca}</td>
              <td>${st.qtd}</td>
              <td>${media}%</td>
              <td>
                <div style="
                  width:100%;
                  height:6px;
                  border-radius:999px;
                  background:rgba(255,255,255,0.06);
                  overflow:hidden;
                ">
                  <div style="
                    width:${largura}%;
                    height:100%;
                    border-radius:999px;
                    background:linear-gradient(90deg,#c44b04,#f97316);
                  "></div>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");

      if (els.dashBancas) {
        els.dashBancas.innerHTML = `
          <div class="sim-dashboard">
            <h4>Desempenho por banca</h4>
            <table class="sim-dashboard-table">
              <thead>
                <tr>
                  <th>Banca</th>
                  <th>Simulados</th>
                  <th>Média %</th>
                  <th>Progresso</th>
                </tr>
              </thead>
              <tbody>
                ${linhasBanca}
              </tbody>
            </table>
          </div>
        `;
      }

      const ultimos = hist.slice(-5).reverse();

      if (els.dashUltimos) {
        const itens = ultimos
          .map((h) => {
            const d = new Date(h.dataISO || Date.now());
            const dataFmt = d.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            });
            const horaFmt = d.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return `
              <li class="sim-resultado-item">
                <h4>${dataFmt} · ${horaFmt} — ${h.banca}</h4>
                <p class="text-xs text-[var(--muted)] mb-1">
                  Tema: ${h.tema || "Não informado"}
                </p>
                <p class="text-sm">
                  <strong>Acertos:</strong> ${h.acertos} de ${h.qtd}
                  (${h.perc}%)
                </p>
              </li>
            `;
          })
          .join("");

        els.dashUltimos.innerHTML = `
          <div class="sim-dashboard">
            <h4>Últimos simulados</h4>
            <ul class="sim-lista-resultados">
              ${itens}
            </ul>
          </div>
        `;
      }
    }

    // expõe função global para o nav-home chamar ao entrar em "Minha evolução"
    window.lioraRenderDashboard = renderDashboard;

    console.log("🟢 Liora Dashboard v2 inicializado.");
  });
})();
