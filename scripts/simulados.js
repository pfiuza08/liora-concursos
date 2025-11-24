// ==============================================================
// 🧠 LIORA — SIMULADOS v13 (LAYOUT COMERCIAL FINAL)
// - Usa FAB oficial (#sim-fab)
// - FAB só aparece no modo Simulados (controlado por nav-home.js)
// - Criação de simulados mock (banca / dificuldade / tema)
// - Timer + navegação + progresso + resultado + histórico
// ==============================================================

(function () {
  console.log("🔵 Liora Simulados v13 (comercial) carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS
    // ------------------------------------------------------
    const els = {
      areaSimulado: document.getElementById("area-simulado"),
      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),
      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),

      // modal
      modalBackdrop: document.getElementById("sim-modal-backdrop"),
      modalClose: document.getElementById("sim-modal-close-btn"),
      modalIniciar: document.getElementById("sim-modal-iniciar"),

      selBanca: document.getElementById("sim-modal-banca"),
      selQtd: document.getElementById("sim-modal-qtd"),
      selTempo: document.getElementById("sim-modal-tempo"),
      selDificuldade: document.getElementById("sim-modal-dificuldade"),
      inpTema: document.getElementById("sim-modal-tema"),

      // FAB comercial
      fabSim: document.getElementById("sim-fab"),
    };

    // ------------------------------------------------------
    // VISIBILIDADE DO FAB (controlado externamente)
    // ------------------------------------------------------
    window.showSimFab = () => {
      if (els.fabSim) els.fabSim.style.display = "flex";
    };
    window.hideSimFab = () => {
      if (els.fabSim) els.fabSim.style.display = "none";
    };

    // ------------------------------------------------------
    // ABRIR / FECHAR MODAL
    // ------------------------------------------------------
    function abrirModal() {
      els.modalBackdrop.classList.add("visible");
    }
    function fecharModal() {
      els.modalBackdrop.classList.remove("visible");
    }

    if (els.fabSim) {
      els.fabSim.addEventListener("click", (e) => {
        e.stopPropagation();
        abrirModal();
      });
    }

    if (els.modalClose) els.modalClose.addEventListener("click", fecharModal);

    els.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.modalBackdrop) fecharModal();
    });

    // ------------------------------------------------------
    // ESTADO
    // ------------------------------------------------------
    const HIST_KEY = "liora:simulados:historico";

    const estado = {
      questoes: [],
      indiceAtual: 0,
      banca: "FGV",
      qtd: 20,
      dificuldade: "misturado",
      tempoProvaMin: 30,
      tempoRestanteSeg: 0,
      tema: "",
      timerId: null,
    };

    // ------------------------------------------------------
    // HISTÓRICO
    // ------------------------------------------------------
    function carregarHistorico() {
      try {
        return JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
      } catch {
        return [];
      }
    }

    function salvarNoHistorico(resumo) {
      const hist = carregarHistorico();
      hist.push(resumo);
      try {
        localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      } catch {}
    }

    // ------------------------------------------------------
    // TIMER
    // ------------------------------------------------------
    function formatarTempo(seg) {
      const m = Math.floor(seg / 60);
      const s = seg % 60;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    function iniciarTimer() {
      estado.tempoRestanteSeg = estado.tempoProvaMin * 60;

      els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);
      els.timer.classList.remove("hidden");

      estado.timerId = setInterval(() => {
        estado.tempoRestanteSeg--;
        els.timer.textContent = formatarTempo(Math.max(estado.tempoRestanteSeg, 0));

        if (estado.tempoRestanteSeg <= 0) {
          pararTimer();
          finalizarSimulado(true);
        }
      }, 1000);
    }

    function pararTimer() {
      if (estado.timerId) clearInterval(estado.timerId);
      estado.timerId = null;
    }

    // ------------------------------------------------------
    // BANCA MOCK
    // ------------------------------------------------------
    const PERFIS = {
      FGV: {
        estilo: "contextual",
        texto: "A banca FGV explora texto longo, interpretação e pegadinhas conceituais.",
      },
      CESPE: {
        estilo: "certo_errado",
        texto:
          "O Cebraspe trabalha com itens de certo/errado, exigindo literalidade e lógica.",
      },
      VUNESP: { estilo: "objetiva", texto: "Questões diretas com detalhe conceitual." },
      FCC: { estilo: "objetiva", texto: "Foco em classificações, exceções e definição formal." },
      QUADRIX: { estilo: "objetiva", texto: "Mistura literalidade com cenários aplicados." },
      IBFC: { estilo: "objetiva", texto: "Alterna entre questões diretas e breves contextos." },
    };

    function getPerfil(banca) {
      return PERFIS[banca] || PERFIS.FGV;
    }

    function formatarNivelBadge(nivel) {
      let emoji = "🟢",
        label = "Fácil",
        bg = "rgba(34,197,94,0.18)",
        color = "rgb(187,247,208)";

      if (nivel === "medio") {
        emoji = "🟡";
        label = "Médio";
        bg = "rgba(250,204,21,0.18)";
        color = "rgb(254,240,138)";
      } else if (nivel === "dificil") {
        emoji = "🔴";
        label = "Difícil";
        bg = "rgba(248,113,113,0.2)";
        color = "rgb(254,202,202)";
      }

      return `<span style="
        display:inline-flex;
        padding:2px 10px;
        gap:4px;
        border-radius:999px;
        font-size:.75rem;
        font-weight:600;
        background:${bg};
        color:${color};
      ">${emoji} ${label}</span>`;
    }

    // ------------------------------------------------------
    // GERAR QUESTÕES MOCK
    // ------------------------------------------------------
    function gerarQuestoesMock() {
      const perfil = getPerfil(estado.banca);
      const total = estado.qtd;
      const qs = [];

      let qtdNivel = { facil: 0, medio: 0, dificil: 0 };

      if (estado.dificuldade === "misturado") {
        qtdNivel.facil = Math.floor(total * 0.3);
        qtdNivel.medio = Math.floor(total * 0.4);
        qtdNivel.dificil = total - qtdNivel.facil - qtdNivel.medio;
      } else {
        qtdNivel[estado.dificuldade] = total;
      }

      function add(n, nivel) {
        for (let i = 0; i < n; i++) qs.push(criarQuestaoMock(qs.length + 1, nivel, perfil));
      }

      add(qtdNivel.facil, "facil");
      add(qtdNivel.medio, "medio");
      add(qtdNivel.dificil, "dificil");

      return qs;
    }

    function criarQuestaoMock(ind, nivel, perfil) {
      const tema = estado.tema || "o tema escolhido";

      if (perfil.estilo === "certo_errado") {
        return {
          indice: ind,
          nivel,
          banca: estado.banca,
          tipo: "certo_errado",
          enunciado: `${perfil.texto}\n\nJulgue o item a seguir sobre ${tema}.`,
          alternativas: ["Certo", "Errado"],
          corretaIndex: Math.random() > 0.5 ? 0 : 1,
          respostaAluno: null,
        };
      }

      const alternativas = [
        `A) Alternativa correta sobre ${tema}.`,
        `B) Erro conceitual.`,
        `C) Parcialmente correta.`,
        `D) Pegadinha da banca.`,
      ];

      return {
        indice: ind,
        nivel,
        banca: estado.banca,
        tipo: "objetiva",
        enunciado: `${perfil.texto}\n\nAssinale a alternativa correta.`,
        alternativas,
        corretaIndex: Math.floor(Math.random() * 4),
        respostaAluno: null,
      };
    }

    // ------------------------------------------------------
    // RENDER DA QUESTÃO
    // ------------------------------------------------------
    function render() {
      const total = estado.questoes.length;

      if (!total) {
        els.questaoContainer.innerHTML =
          '<p class="text-sm text-[var(--muted)]">Nenhum simulado em andamento.</p>';
        els.nav.classList.add("hidden");
        els.progressBar.style.width = "0%";
        return;
      }

      const q = estado.questoes[estado.indiceAtual];
      els.questaoContainer.innerHTML = "";

      els.questaoContainer.innerHTML += `
        <div class="flex justify-between text-xs text-[var(--muted)] mb-3">
          <span>Questão ${q.indice} de ${total}</span>
          <span>${q.banca} • ${formatarNivelBadge(q.nivel)}</span>
        </div>
      `;
      els.questaoContainer.innerHTML += `
        <p class="sim-enunciado mb-3 whitespace-pre-line">${q.enunciado}</p>
      `;

      q.alternativas.forEach((alt, idx) => {
        const div = document.createElement("div");
        div.className = "sim-alt" + (q.respostaAluno === idx ? " selected" : "");
        div.innerHTML = `
          <div class="sim-radio"></div>
          <div class="sim-alt-text">${alt}</div>
        `;
        div.onclick = () => {
          q.respostaAluno = idx;
          render();
        };
        els.questaoContainer.appendChild(div);
      });

      els.nav.classList.remove("hidden");

      els.btnProxima.textContent =
        estado.indiceAtual === total - 1 ? "Finalizar simulado ▶" : "Próxima ▶";

      els.btnVoltar.disabled = estado.indiceAtual === 0;

      els.progressBar.style.width =
        ((estado.indiceAtual + 1) / total) * 100 + "%";
    }

    // ------------------------------------------------------
    // FINALIZAR SIMULADO
    // ------------------------------------------------------
    function finalizarSimulado(porTempo = false) {
      pararTimer();
      els.questaoContainer.innerHTML = "";
      els.resultado.innerHTML = "";
      els.nav.classList.add("hidden");

      const total = estado.questoes.length;
      let acertos = 0;

      estado.questoes.forEach((q) => {
        if (q.respostaAluno === q.corretaIndex) acertos++;
      });

      const perc = total ? Math.round((acertos / total) * 100) : 0;

      els.resultado.classList.remove("hidden");
      els.resultado.innerHTML = `
        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Resultado</div>
          <div class="sim-score">${perc}%</div>

          <p><strong>Acertos:</strong> ${acertos} de ${total}</p>
          <p><strong>Tempo:</strong> ${
            porTempo ? "Encerrado por tempo" : "Concluído"
          }</p>

          <div class="flex gap-2 mt-3">
            <button id="sim-refazer" class="btn-secondary">Novo simulado</button>
            <button id="sim-ir-dashboard" class="btn-primary">Ver desempenho</button>
          </div>
        </div>
      `;

      const resumo = {
        dataISO: new Date().toISOString(),
        banca: estado.banca,
        tema: estado.tema,
        qtd: total,
        acertos,
        perc,
      };
      salvarNoHistorico(resumo);

      document.getElementById("sim-refazer").onclick = () => location.reload();
      document.getElementById("sim-ir-dashboard").onclick = () => {
        if (window.homeDashboard) window.homeDashboard();
      };
    }

    // ------------------------------------------------------
    // NAVEGAÇÃO
    // ------------------------------------------------------
    els.btnVoltar.addEventListener("click", () => {
      if (estado.indiceAtual > 0) {
        estado.indiceAtual--;
        render();
      }
    });

    els.btnProxima.addEventListener("click", () => {
      if (estado.indiceAtual < estado.questoes.length - 1) {
        estado.indiceAtual++;
        render();
      } else {
        finalizarSimulado(false);
      }
    });

    // ------------------------------------------------------
    // INICIAR SIMULADO
    // ------------------------------------------------------
    els.modalIniciar.addEventListener("click", () => {
      estado.banca = els.selBanca.value;
      estado.qtd = Number(els.selQtd.value);
      estado.tempoProvaMin = Number(els.selTempo.value);
      estado.dificuldade = els.selDificuldade.value;
      estado.tema = els.inpTema.value.trim();

      fecharModal();

      estado.questoes = gerarQuestoesMock();
      estado.indiceAtual = 0;

      iniciarTimer();
      render();
    });

    console.log("🟢 Liora Simulados v13 inicializado com sucesso.");
  });
})();
