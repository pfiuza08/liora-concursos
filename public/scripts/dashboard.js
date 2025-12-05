// ==========================================================
// 📊 LIORA — DASHBOARD PREMIUM (v7-COMMERCIAL-COMPAT)
// - UI refinada + microinterações
// - Estados vazios premium (simulados + estudos)
// - Mini-gráficos nativos HTML/CSS
// - Lê histórico de simulados (localStorage, mesma chave do v97)
// - Lê memória de estudos via lioraEstudos.listarRecentes()
// - Insights extras:
//    • Evolução recente
//    • Melhor tema
//    • Tema que pede atenção
// - Integrado ao nav-home via window.lioraDashboard.atualizar()
// ==========================================================

(function () {
  console.log("🔵 Liora Dashboard PREMIUM v7 carregado...");

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
    // HELPERS — SIMULADOS
    // ==========================================================

    function carregarHistoricoSimulados() {
      try {
        const raw = localStorage.getItem(HIST_KEY);
        if (!raw) {
          console.log("📊 Dashboard: nenhum histórico de simulados encontrado.");
          return [];
        }
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : [];
        console.log("📊 Dashboard: histórico de simulados carregado:", arr.length);
        return arr;
      } catch (e) {
        console.warn("⚠️ Erro ao carregar histórico de simulados", e);
        return [];
      }
    }

    // ==========================================================
    // HELPERS — ESTUDOS (Study Manager v2)
    // ==========================================================

    /**
     * Constrói um "snapshot" dos planos de estudo a partir
     * do Study Manager v2 (estudos.js), usando listarRecentes().
     *
     * Cada item retornado tem a forma:
     * {
     *   tema,
     *   origem,
     *   nivel,
     *   sessoesTotal,
     *   sessoesConcluidas,
     *   atualizadoEm
     * }
     */
    function carregarEstudos() {
      try {
        if (!window.lioraEstudos || typeof window.lioraEstudos.listarRecentes !== "function") {
          console.log("📚 Dashboard: lioraEstudos.listarRecentes não disponível.");
          return [];
        }

        const planos = window.lioraEstudos.listarRecentes(20) || [];
        const estudos = planos.map((plano) => {
          const sessoes = Array.isArray(plano.sessoes) ? plano.sessoes : [];
          const total = sessoes.length;
          const concluidas = sessoes.filter((s) => (s.progresso || 0) >= 100).length;

          return {
            tema: plano.tema || "Plano de estudo",
            origem: plano.origem || "tema",
            nivel: plano.nivel || null,
            sessoesTotal: total,
            sessoesConcluidas: concluidas,
            atualizadoEm: plano.atualizadoEm || plano.criadoEm || new Date().toISOString(),
          };
        });

        console.log("📚 Dashboard: estudos carregados do Study Manager:", estudos.length);
        return estudos;
      } catch (e) {
        console.warn("⚠️ Erro ao carregar estudos (Study Manager)", e);
        return [];
      }
    }

    // ==========================================================
    // OUTROS HELPERS
    // ==========================================================

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

    function sortByDate(hist) {
      return hist
        .slice()
        .sort((a, b) => {
          const da = new Date(a.dataISO || a.data || 0).getTime();
          const db = new Date(b.dataISO || b.data || 0).getTime();
          return da - db;
        });
    }

    function buildTemaStats(hist) {
      const m = {};
      hist.forEach((h) => {
        const tema = (h.tema || "").trim() || "Tema não informado";
        if (!m[tema]) m[tema] = { qtd: 0, somaPerc: 0 };
        m[tema].qtd++;
        m[tema].somaPerc += Number(h.perc || 0);
      });
      return m;
    }

    function pickMelhorTema(temaStats) {
      const entries = Object.entries(temaStats);
      if (!entries.length) return null;

      const valid = entries.filter(([_, st]) => st.qtd >= 1);
      if (!valid.length) return null;

      const [tema, st] = valid
        .map(([t, st]) => [t, st, st.somaPerc / st.qtd])
        .sort((a, b) => b[2] - a[2])[0];

      return {
        tema,
        media: Math.round((st.somaPerc / st.qtd) * 10) / 10,
        qtd: st.qtd,
      };
    }

    function pickTemaCritico(temaStats) {
      const entries = Object.entries(temaStats);
      if (!entries.length) return null;

      const valid = entries.filter(([_, st]) => st.qtd >= 1);
      if (!valid.length) return null;

      const [tema, st] = valid
        .map(([t, st]) => [t, st, st.somaPerc / st.qtd])
        .sort((a, b) => a[2] - b[2])[0];

      return {
        tema,
        media: Math.round((st.somaPerc / st.qtd) * 10) / 10,
        qtd: st.qtd,
      };
    }

    function buildEvolucao(hist) {
      const ordenado = sortByDate(hist);
      if (ordenado.length < 2) {
        return {
          tipo: "neutro",
          texto: "Ainda não há dados suficientes para ver a evolução.",
          diff: 0,
        };
      }

      const primeiro = Number(ordenado[0].perc || 0);
      const ultimo = Number(ordenado[ordenado.length - 1].perc || 0);
      const diff = Math.round((ultimo - primeiro) * 10) / 10;

      if (diff > 0) {
        return {
          tipo: "up",
          texto: `Você evoluiu +${diff} p.p. desde o seu primeiro simulado.`,
          diff,
        };
      } else if (diff < 0) {
        return {
          tipo: "down",
          texto: `Seu desempenho oscilou −${Math.abs(diff)} p.p. em relação ao primeiro simulado.`,
          diff,
        };
      } else {
        return {
          tipo: "flat",
          texto: "Seu desempenho está estável em relação ao primeiro simulado.",
          diff: 0,
        };
      }
    }

    // ==========================================================
    // RENDER PRINCIPAL
    // ==========================================================
    function renderDashboard() {
      const hist = carregarHistoricoSimulados();
      const estudos = carregarEstudos();

      els.dashResumo.innerHTML = "";
      els.dashBancas.innerHTML = "";
      els.dashUltimos.innerHTML = "";

      const temSimulados = hist.length > 0;
      const temEstudos = estudos.length > 0;

      // ------------------------------------------------------
      // ESTADO VAZIO PREMIUM
      // ------------------------------------------------------
      // Estado realmente vazio: nenhum simulado E nenhum estudo
      if (hist.length === 0 && estudos.length === 0) {
        els.dashEmpty.classList.remove("hidden");
        els.dashEmpty.innerHTML = `
          <div class="text-center opacity-80">
            <p class="text-sm">Você ainda não fez simulados nem gerou planos de estudo.</p>
            <p class="text-xs text-[var(--muted)] mt-1">
              Assim que criar um plano ou concluir um simulado, sua evolução aparecerá aqui.
            </p>
          </div>
        `;
        return;
      }

    // Se há simulados, sempre esconde o estado vazio
    if (hist.length > 0) {
      els.dashEmpty.classList.add("hidden");
      els.dashEmpty.innerHTML = "";
    }


      if (els.dashEmpty) {
        els.dashEmpty.classList.add("hidden");
        els.dashEmpty.innerHTML = "";
      }

      // ======================================================
      // 1) RESUMO GERAL + INSIGHTS
      // ======================================================

      // SIMULADOS
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

        totalQuestoes = hist.reduce((acc, h) => acc + Number(h.qtd || 0), 0);

        tempoSeg = hist.reduce((acc, h) => acc + Number(h.tempoSeg || 0), 0);

        hist.forEach((h) => {
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
        ? Object.entries(freqTemaSim).sort((a, b) => b[1] - a[1])[0]?.[0] || "Diversos"
        : "—";

      // ESTUDOS
      const totalEstudos = estudos.length;
      const totalSessoes = estudos.reduce(
        (acc, e) => acc + Number(e.sessoesTotal || 0),
        0
      );
      const mediaProgresso =
        totalEstudos > 0
          ? Math.round(
              (estudos.reduce((acc, e) => acc + calcularProgresso(e), 0) /
                totalEstudos) *
                10
            ) / 10
          : 0;

      const freqTemaEstudos = {};
      estudos.forEach((e) => {
        const t = (e.tema || "").trim();
        if (!t) return;
        freqTemaEstudos[t] = (freqTemaEstudos[t] || 0) + 1;
      });

      const temaTopEstudo = totalEstudos
        ? Object.entries(freqTemaEstudos).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "Diversos"
        : "—";

      // INSIGHTS ADICIONAIS
      let evolucao = {
        tipo: "neutro",
        texto: "Ainda não há dados de evolução.",
        diff: 0,
      };
      let melhorTema = null;
      let temaCritico = null;

      if (temSimulados) {
        evolucao = buildEvolucao(hist);

        const temaStats = buildTemaStats(hist);
        melhorTema = pickMelhorTema(temaStats);
        temaCritico = pickTemaCritico(temaStats);
      }

      // Cards premium (3 colunas)
      els.dashResumo.innerHTML = `
        <!-- Card 1: Evolução recente -->
        <div class="sim-resultado-card dash-card-evolucao">
          <div class="sim-resultado-titulo">Evolução recente</div>
          <div class="sim-score">
            ${temSimulados ? `${mediaPerc}%` : "—"}
          </div>
          <p class="sim-desc">
            ${
              temSimulados
                ? evolucao.texto
                : "Faça seu primeiro simulado para ver a evolução aqui."
            }
          </p>
          <p class="sim-detail mt-1">
            Simulados realizados: <strong>${temSimulados ? totalSimulados : 0}</strong><br>
            Tempo total: <strong>${tempoMin} min</strong><br>
            Questões respondidas: <strong>${totalQuestoes}</strong>
          </p>
        </div>

        <!-- Card 2: Seu melhor tema -->
        <div class="sim-resultado-card dash-card-melhor-tema">
          <div class="sim-resultado-titulo">Seu melhor tema</div>
          <div class="sim-score">
            ${
              melhorTema
                ? `${melhorTema.media}%`
                : temSimulados
                ? `${mediaPerc}%`
                : "—"
            }
          </div>
          <p class="sim-desc">
            ${
              melhorTema
                ? `Você vai muito bem em <strong>${melhorTema.tema}</strong> (${melhorTema.qtd} simulado(s)).`
                : temSimulados
                ? `Ainda não há tema destacado. Continue fazendo simulados para descobrir seu ponto forte.`
                : `Comece um simulado para identificar em quais temas você se destaca.`
            }
          </p>
          <p class="sim-detail mt-1">
            Banca mais treinada: <strong>${bancaTop}</strong><br>
            Tema mais recorrente em simulados: <strong>${temaTopSim}</strong>
          </p>
        </div>

        <!-- Card 3: Tema que pede atenção + estudos -->
        <div class="sim-resultado-card dash-card-atencao">
          <div class="sim-resultado-titulo">Tema que pede atenção</div>
          <div class="sim-score">
            ${
              temaCritico
                ? `${temaCritico.media}%`
                : temSimulados
                ? `${mediaPerc}%`
                : "—"
            }
          </div>
          <p class="sim-desc">
            ${
              temaCritico
                ? `Vale revisar <strong>${temaCritico.tema}</strong> (${temaCritico.qtd} simulado(s)).`
                : temSimulados
                ? `Nenhum tema crítico evidente ainda. Observe os próximos simulados.`
                : `Gere um plano de estudo ou faça simulados para ver recomendações aqui.`
            }
          </p>
          <p class="sim-detail mt-1">
            Planos ativos/recentes: <strong>${totalEstudos}</strong><br>
            Sessões planejadas: <strong>${totalSessoes}</strong><br>
            Progresso médio nos planos: <strong>${
              totalEstudos ? `${mediaProgresso}%` : "—"
            }</strong><br>
            Tema mais estudado: <strong>${temaTopEstudo}</strong>
          </p>
        </div>
      `;

      // ======================================================
      // 2) DESEMPENHO POR BANCA (Simulados)
      // ======================================================
      if (temSimulados) {
        const stats = {};
        hist.forEach((h) => {
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
        const ultimos = sortByDate(hist).slice(-5).reverse();

        const htmlSimulados = `
          <div class="sim-dashboard">
            <h4 class="sim-subtitulo">Últimos simulados</h4>
            <ul class="sim-lista-resultados">
              ${ultimos
                .map(
                  (h) => `
                  <li class="sim-resultado-item">
                    <div class="sim-resultado-header">
                      <span class="sim-resultado-data">${formatarData(
                        h.dataISO
                      )}</span>
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
                `
                )
                .join("")}
            </ul>
          </div>
        `;
        blocos.push(htmlSimulados);
      }

      // 3.2 Estudos recentes (memória de estudos)
      if (temEstudos) {
        const recentes = estudos.slice(0, 5);

        const htmlEstudos = `
          <div class="sim-dashboard" style="margin-top:1rem;">
            <h4 class="sim-subtitulo">Estudos recentes</h4>
            <ul class="sim-lista-resultados">
              ${recentes
                .map((e) => {
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
                        Tema: ${e.tema} ${
                    e.nivel ? `· Nível: ${e.nivel}` : ""
                  }
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
          window.lioraError.show(
            "Não foi possível carregar o dashboard agora. Tente novamente em instantes."
          );
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

    console.log("🟢 Dashboard PREMIUM v7 inicializado.");
  });
})();
