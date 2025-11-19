// ==========================================================
// 🧠 LIORA — SIMULADOS v7 (UNIFICADO MOCK)
// - Modal estático (vem do index.html)
// - Timer regressivo
// - Distribuição de dificuldade (padrão / equilibrado / personalizado)
// - Resultado com dashboard por nível
// - Histórico em localStorage (para uso futuro)
// ==========================================================

(function () {
  console.log("🔵 Liora Simulados v7 (mock) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------
    // MAPA DE ELEMENTOS
    // ------------------------------------------------------
    const els = {
      // modos
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      modoSimulados: document.getElementById("modo-simulados"),

      // áreas direita
      areaPlano: document.getElementById("area-plano"),
      areaSimulado: document.getElementById("area-simulado"),

      // simulado
      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),
      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),

      // modal
      modalBackdrop: document.getElementById("sim-modal-backdrop"),
      modalClose: document.getElementById("sim-modal-close"),
      modalIniciar: document.getElementById("sim-modal-iniciar"),

      // campos modal
      selBanca: document.getElementById("sim-banca"),
      inpQtd: document.getElementById("sim-qtd"),
      inpTempo: document.getElementById("sim-tempo"),
      selModoDificuldade: document.getElementById("sim-dificuldade-modo"),

      difCustomContainer: document.getElementById("sim-dificuldade-custom"),
      difFacil: document.getElementById("dif-facil"),
      difMedio: document.getElementById("dif-medio"),
      difDificil: document.getElementById("dif-dificil"),
      difErro: document.getElementById("dif-erro"),
    };

    // helper para listeners seguros
    function on(el, ev, fn) {
      if (el) el.addEventListener(ev, fn);
      else console.warn("⚠️ Elemento não encontrado para listener:", ev);
    }

    // ------------------------------------------------------
    // ESTADO
    // ------------------------------------------------------
    const estado = {
      emAndamento: false,
      questoes: [],
      indiceAtual: 0,
      banca: "fgv",
      qtd: 20,
      dificuldadeModo: "padrao", // padrao | equilibrado | personalizado
      dificuldadeDist: { facil: 30, medio: 50, dificil: 20 },
      tempoProvaMin: 30,
      tempoRestanteSeg: 0,
      timerId: null,
    };

    const HIST_KEY = "liora:simulados:historico";

    // ------------------------------------------------------
    // HISTÓRICO (para futuros dashboards)
    // ------------------------------------------------------
    function carregarHistorico() {
      try {
        const raw = localStorage.getItem(HIST_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }

    function salvarNoHistorico(resumo) {
      const hist = carregarHistorico();
      hist.push(resumo);
      try {
        localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      } catch (e) {
        console.warn("⚠️ Não foi possível salvar histórico de simulados", e);
      }
    }

    // ------------------------------------------------------
    // VISUAL: ÁREAS
    // ------------------------------------------------------
    function mostrarPlano() {
      if (els.areaPlano) els.areaPlano.classList.remove("hidden");
      if (els.areaSimulado) els.areaSimulado.classList.add("hidden");
      limparSimulado();
    }

    function mostrarSimulado() {
      if (els.areaPlano) els.areaPlano.classList.add("hidden");
      if (els.areaSimulado) els.areaSimulado.classList.remove("hidden");
      limparSimulado();
    }

    function limparSimulado() {
      pararTimer();
      estado.emAndamento = false;
      estado.questoes = [];
      estado.indiceAtual = 0;
      estado.tempoRestanteSeg = 0;

      if (els.timer) {
        els.timer.classList.add("hidden");
        els.timer.textContent = "00:00";
      }
      if (els.progressBar) els.progressBar.style.width = "0%";
      if (els.questaoContainer) els.questaoContainer.innerHTML = "";
      if (els.nav) els.nav.classList.add("hidden");
      if (els.resultado) {
        els.resultado.classList.add("hidden");
        els.resultado.innerHTML = "";
      }
    }

    // ------------------------------------------------------
    // MODAL (abrir / fechar) — FORÇANDO display
    // ------------------------------------------------------
    function abrirModal() {
      if (!els.modalBackdrop) return;
      els.modalBackdrop.style.display = "flex";
      els.modalBackdrop.classList.add("visible");
      els.modalBackdrop.classList.remove("hidden");
      // esconder msg de erro de % se estiver visível
      if (els.difErro) els.difErro.classList.add("hidden");
    }

    function fecharModal() {
      if (!els.modalBackdrop) return;
      els.modalBackdrop.classList.remove("visible");
      els.modalBackdrop.classList.add("hidden");
      els.modalBackdrop.style.display = "none";
    }

    // clique no botão Simulados
    on(els.modoSimulados, "click", () => {
      abrirModal();
    });

    // fechar com X
    on(els.modalClose, "click", fecharModal);

    // fechar clicando fora do card
    on(els.modalBackdrop, "click", (e) => {
      if (e.target === els.modalBackdrop) fecharModal();
    });

    // ------------------------------------------------------
    // MODOS TEMA / UPLOAD
    // ------------------------------------------------------
    on(els.modoTema, "click", mostrarPlano);
    on(els.modoUpload, "click", mostrarPlano);

    // ------------------------------------------------------
    // DIFICULDADE PERSONALIZADA (mostrar/ocultar)
    // ------------------------------------------------------
    on(els.selModoDificuldade, "change", () => {
      if (!els.selModoDificuldade || !els.difCustomContainer) return;
      const modo = els.selModoDificuldade.value;
      if (modo === "personalizado") {
        els.difCustomContainer.classList.remove("hidden");
      } else {
        els.difCustomContainer.classList.add("hidden");
        if (els.difErro) els.difErro.classList.add("hidden");
      }
    });

    // ------------------------------------------------------
    // TIMER REGRESSIVO
    // ------------------------------------------------------
    function formatarTempo(segundos) {
      const m = Math.floor(segundos / 60);
      const s = segundos % 60;
      return `${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }

    function iniciarTimer() {
      estado.tempoRestanteSeg = estado.tempoProvaMin * 60;

      if (els.timer) {
        els.timer.classList.remove("hidden");
        els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);
      }

      pararTimer();
      estado.timerId = setInterval(() => {
        estado.tempoRestanteSeg--;

        if (els.timer) {
          els.timer.textContent = formatarTempo(
            Math.max(estado.tempoRestanteSeg, 0)
          );
        }

        if (estado.tempoRestanteSeg <= 0) {
          pararTimer();
          finalizarSimulado(true);
        }
      }, 1000);
    }

    function pararTimer() {
      if (estado.timerId) {
        clearInterval(estado.timerId);
        estado.timerId = null;
      }
    }

    // ------------------------------------------------------
    // GERAÇÃO MOCK DE QUESTÕES
    // ------------------------------------------------------
    function gerarQuestoesMock() {
      const qs = [];
      const total = estado.qtd || 0;

      let dist = { ...estado.dificuldadeDist };

      // equilibrado: 1/3 pra cada
      if (estado.dificuldadeModo === "equilibrado") {
        dist = { facil: 33, medio: 33, dificil: 34 };
      }

      // padrão da banca: mais médio
      if (estado.dificuldadeModo === "padrao") {
        dist = { facil: 20, medio: 60, dificil: 20 };
      }

      const qtdFacil = Math.round((total * dist.facil) / 100);
      const qtdMedio = Math.round((total * dist.medio) / 100);
      let qtdDificil = total - qtdFacil - qtdMedio;

      function add(n, nivel) {
        for (let i = 0; i < n; i++) {
          qs.push(criarQuestaoMock(qs.length + 1, nivel));
        }
      }

      add(qtdFacil, "facil");
      add(qtdMedio, "medio");
      add(qtdDificil, "dificil");

      return qs;
    }

    function criarQuestaoMock(indice, nivel) {
      const bancaNome = els.selBanca
        ? els.selBanca.options[els.selBanca.selectedIndex].text
        : "Banca";

      const nivelLabel =
        nivel === "facil"
          ? "Fácil"
          : nivel === "medio"
          ? "Médio"
          : "Difícil";

      const enunciado = `Questão ${nivelLabel.toUpperCase()} — Banca ${bancaNome}`;

      const alternativas = ["A", "B", "C", "D"];
      const corretaIndex = Math.floor(Math.random() * alternativas.length);

      return {
        indice,
        nivel,
        banca: bancaNome,
        enunciado,
        alternativas,
        corretaIndex,
        respostaAluno: null,
      };
    }

    // ------------------------------------------------------
    // RENDERIZAÇÃO DA QUESTÃO
    // ------------------------------------------------------
    function renderQuestaoAtual() {
      if (!els.questaoContainer || !estado.questoes.length) return;

      const q = estado.questoes[estado.indiceAtual];
      const total = estado.questoes.length;

      els.questaoContainer.innerHTML = "";

      // header
      const header = document.createElement("div");
      header.className =
        "flex justify-between items-center text-xs text-[var(--muted)] mb-3";

      const nivelLabel =
        q.nivel === "facil"
          ? "Fácil"
          : q.nivel === "medio"
          ? "Médio"
          : "Difícil";

      header.innerHTML = `
        <span>Questão ${q.indice} de ${total}</span>
        <span>${q.banca} · ${nivelLabel}</span>
      `;
      els.questaoContainer.appendChild(header);

      // enunciado
      const enu = document.createElement("p");
      enu.className = "sim-enunciado mb-3";
      enu.textContent = q.enunciado;
      els.questaoContainer.appendChild(enu);

      // alternativas
      q.alternativas.forEach((alt, idx) => {
        const div = document.createElement("div");
        div.className =
          "sim-alt" + (q.respostaAluno === idx ? " selected" : "");
        div.innerHTML = `
          <div class="sim-radio"></div>
          <div class="sim-alt-text">${alt}</div>
        `;
        div.addEventListener("click", () => {
          q.respostaAluno = idx;
          renderQuestaoAtual();
        });
        els.questaoContainer.appendChild(div);
      });

      // nav
      if (els.nav) els.nav.classList.remove("hidden");
      if (els.btnVoltar) els.btnVoltar.disabled = estado.indiceAtual === 0;
      if (els.btnProxima) {
        els.btnProxima.textContent =
          estado.indiceAtual === total - 1
            ? "Finalizar simulado ▶"
            : "Próxima ▶";
      }

      // progresso
      if (els.progressBar) {
        const pct = ((estado.indiceAtual + 1) / total) * 100;
        els.progressBar.style.width = pct + "%";
      }
    }

    // ------------------------------------------------------
    // FINALIZAÇÃO + RESULTADOS
    // ------------------------------------------------------
    function finalizarSimulado(porTempo = false) {
      pararTimer();
      estado.emAndamento = false;

      if (!els.resultado) return;

      const total = estado.questoes.length;
      let acertos = 0;
      let respondidas = 0;

      const statsPorNiveis = {
        facil: { total: 0, acertos: 0 },
        medio: { total: 0, acertos: 0 },
        dificil: { total: 0, acertos: 0 },
      };

      estado.questoes.forEach((q) => {
        const nivel = q.nivel || "medio";
        if (!statsPorNiveis[nivel]) {
          statsPorNiveis[nivel] = { total: 0, acertos: 0 };
        }
        statsPorNiveis[nivel].total++;

        if (q.respostaAluno != null) {
          respondidas++;
          if (q.respostaAluno === q.corretaIndex) {
            acertos++;
            statsPorNiveis[nivel].acertos++;
          }
        }
      });

      const perc = total ? Math.round((acertos / total) * 100) : 0;
      const tempoUsadoSeg =
        estado.tempoProvaMin * 60 - Math.max(estado.tempoRestanteSeg, 0);
      const tempoUsadoFmt = formatarTempo(Math.max(tempoUsadoSeg, 0));

      els.resultado.classList.remove("hidden");
      els.resultado.innerHTML = "";

      // card principal
      const card = document.createElement("div");
      card.className = "sim-resultado-card";
      card.innerHTML = `
        <div class="sim-resultado-titulo">Resultado do simulado</div>
        <div class="sim-score">${perc}%</div>
        <p><strong>Acertos:</strong> ${acertos} de ${total}</p>
        <p><strong>Respondidas:</strong> ${respondidas} de ${total}</p>
        <p><strong>Banca:</strong> ${
          els.selBanca
            ? els.selBanca.options[els.selBanca.selectedIndex].text
            : "Não informada"
        }</p>
        <p><strong>Tempo utilizado:</strong> ${tempoUsadoFmt} ${
        porTempo ? "(prova encerrada por tempo)" : ""
      }</p>
        <p class="sim-feedback">
          Este resultado é gerado em modo de simulação (mock). Em produção,
          as questões e análises serão baseadas na IA e no seu material.
        </p>
      `;
      els.resultado.appendChild(card);

      // dashboard por dificuldade
      const dash = document.createElement("div");
      dash.className = "sim-dashboard";
      dash.innerHTML = `
        <h4>Desempenho por nível de dificuldade</h4>
        <table class="sim-dashboard-table">
          <thead>
            <tr>
              <th>Nível</th>
              <th>Acertos</th>
              <th>Total</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            ${["facil", "medio", "dificil"]
              .map((nivel) => {
                const st = statsPorNiveis[nivel] || { total: 0, acertos: 0 };
                const label =
                  nivel === "facil"
                    ? "Fácil"
                    : nivel === "medio"
                    ? "Médio"
                    : "Difícil";
                if (!st.total) {
                  return `<tr>
                    <td>${label}</td>
                    <td>—</td>
                    <td>0</td>
                    <td>—</td>
                  </tr>`;
                }
                const p = Math.round((st.acertos / st.total) * 100);
                return `<tr>
                  <td>${label}</td>
                  <td>${st.acertos}</td>
                  <td>${st.total}</td>
                  <td>${p}%</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      `;
      els.resultado.appendChild(dash);

      // salvar no histórico
      salvarNoHistorico({
        dataISO: new Date().toISOString(),
        banca: estado.banca,
        qtd: total,
        acertos,
        perc,
        tempoSeg: tempoUsadoSeg,
        statsPorNiveis,
      });

      // esconder questão e navegação
      if (els.questaoContainer) els.questaoContainer.innerHTML = "";
      if (els.nav) els.nav.classList.add("hidden");
    }

    // ------------------------------------------------------
    // NAVEGAÇÃO (Voltar / Próxima)
    // ------------------------------------------------------
    on(els.btnVoltar, "click", () => {
      if (estado.indiceAtual > 0) {
        estado.indiceAtual--;
        renderQuestaoAtual();
      }
    });

    on(els.btnProxima, "click", () => {
      if (!estado.questoes.length) return;
      if (estado.indiceAtual < estado.questoes.length - 1) {
        estado.indiceAtual++;
        renderQuestaoAtual();
      } else {
        finalizarSimulado(false);
      }
    });

    // ------------------------------------------------------
    // INICIAR SIMULADO (botão do modal)
    // ------------------------------------------------------
    on(els.modalIniciar, "click", () => {
      // dificuldade personalizada: validar soma
      if (
        els.selModoDificuldade &&
        els.selModoDificuldade.value === "personalizado"
      ) {
        const soma =
          Number(els.difFacil.value || 0) +
          Number(els.difMedio.value || 0) +
          Number(els.difDificil.value || 0);

        if (soma !== 100) {
          if (els.difErro) els.difErro.classList.remove("hidden");
          return;
        }
        estado.dificuldadeDist = {
          facil: Number(els.difFacil.value || 0),
          medio: Number(els.difMedio.value || 0),
          dificil: Number(els.difDificil.value || 0),
        };
      }

      estado.banca = els.selBanca ? els.selBanca.value : "fgv";
      estado.qtd = Number(els.inpQtd ? els.inpQtd.value : 20) || 20;
      estado.tempoProvaMin =
        Number(els.inpTempo ? els.inpTempo.value : 30) || 30;
      estado.dificuldadeModo = els.selModoDificuldade
        ? els.selModoDificuldade.value
        : "padrao";

      fecharModal();
      mostrarSimulado();

      estado.questoes = gerarQuestoesMock();
      estado.indiceAtual = 0;
      estado.emAndamento = true;

      iniciarTimer();
      renderQuestaoAtual();
    });

    // estado inicial
    mostrarPlano();
    console.log("🟢 Liora Simulados v7 inicializado com sucesso.");
  });
})();
