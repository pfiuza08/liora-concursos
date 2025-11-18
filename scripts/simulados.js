// ==========================================================
// 🧠 LIORA — SIMULADOS v3.1 (PRO MOCK + Modal FIX)
// ==========================================================

(function () {
  console.log("🔵 Liora Simulados v3.1 (mock) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------
    // ELEMENTOS BASE
    // ------------------------------------------------------
    const els = {
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      modoSimulados: document.getElementById("modo-simulados"),

      areaPlano: document.getElementById("area-plano"),
      areaSimulado: document.getElementById("area-simulado"),

      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),
      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),
    };

    // ------------------------------------------------------
    // ESTADO
    // ------------------------------------------------------
    const estado = {
      emAndamento: false,
      questoes: [],
      indiceAtual: 0,
      banca: "FGV",
      tema: "",
      qtd: 10,
      dificuldade: "misturado",
      tempoProvaMin: 60,
      tempoRestanteSeg: 0,
      timerId: null,
    };

    const HIST_KEY = "liora:simulados:historico";

    // ------------------------------------------------------
    // HISTÓRICO
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
      } catch (e) {}
    }

    // ------------------------------------------------------
    // UI: mostrar/ocultar áreas
    // ------------------------------------------------------
    function mostrarPlano() {
      els.areaPlano.classList.remove("hidden");
      els.areaSimulado.classList.add("hidden");
      limparSimulado();
    }

    function mostrarSimulado() {
      els.areaPlano.classList.add("hidden");
      els.areaSimulado.classList.remove("hidden");
      limparSimulado();
    }

    function limparSimulado() {
      pararTimer();
      estado.emAndamento = false;
      estado.questoes = [];
      estado.indiceAtual = 0;

      els.timer.classList.add("hidden");
      els.timer.textContent = "00:00";

      els.progressBar.style.width = "0%";
      els.questaoContainer.innerHTML = "";
      els.nav.classList.add("hidden");
      els.resultado.classList.add("hidden");
      els.resultado.innerHTML = "";
    }

    // ------------------------------------------------------
    // TIMER REGRESSIVO
    // ------------------------------------------------------
    function formatarTempo(seg) {
      const m = Math.floor(seg / 60);
      const s = seg % 60;
      return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
    }

    function iniciarTimerRegressivo() {
      pararTimer();
      estado.tempoRestanteSeg = estado.tempoProvaMin * 60;

      els.timer.classList.remove("hidden");
      els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);

      estado.timerId = setInterval(() => {
        estado.tempoRestanteSeg--;
        if (estado.tempoRestanteSeg <= 0) {
          pararTimer();
          finalizarSimulado(true);
          return;
        }
        els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);
      }, 1000);
    }

    function pararTimer() {
      if (estado.timerId) {
        clearInterval(estado.timerId);
        estado.timerId = null;
      }
    }

    // ------------------------------------------------------
    // PERFIL DAS BANCAS (mock)
    // ------------------------------------------------------
    const PERFIS_BANCA = {
      FGV: { nome: "FGV", estilo: "contextual" },
      CESPE: { nome: "CESPE / CEBRASPE", estilo: "certo_errado" },
      VUNESP: { nome: "VUNESP", estilo: "direto" },
      FCC: { nome: "FCC", estilo: "objetiva" },
      QUADRIX: { nome: "Quadrix", estilo: "objetiva" },
      IBFC: { nome: "IBFC", estilo: "objetiva" },
    };

    function getPerfilBanca(id) {
      return PERFIS_BANCA[id] || PERFIS_BANCA.FGV;
    }

    // ------------------------------------------------------
    // GERAÇÃO MOCK DE QUESTÕES
    // ------------------------------------------------------
    function gerarQuestoesMock() {
      const perfil = getPerfilBanca(estado.banca);
      const total = estado.qtd;
      const qs = [];

      if (estado.dificuldade === "misturado") {
        const terc = Math.floor(total / 3);
        const resto = total - terc * 2;

        for (let i = 0; i < terc; i++)
          qs.push(criarQuestaoMock(perfil, qs.length + 1, "facil"));

        for (let i = 0; i < terc; i++)
          qs.push(criarQuestaoMock(perfil, qs.length + 1, "medio"));

        for (let i = 0; i < resto; i++)
          qs.push(criarQuestaoMock(perfil, qs.length + 1, "dificil"));
      } else {
        for (let i = 0; i < total; i++)
          qs.push(
            criarQuestaoMock(perfil, qs.length + 1, estado.dificuldade)
          );
      }

      return qs;
    }

    function criarQuestaoMock(perfil, indice, nivel) {
      const temaUsado = estado.tema || "o tema escolhido";

      const enunciado =
        nivel === "facil"
          ? `Questão fácil sobre ${temaUsado}, segundo o estilo ${perfil.nome}.`
          : nivel === "medio"
          ? `Questão de nível médio sobre ${temaUsado}, no padrão ${perfil.nome}.`
          : `Questão difícil, com pegadinhas típicas da banca ${perfil.nome}.`;

      if (perfil.estilo === "certo_errado") {
        const correta = Math.random() > 0.5 ? 0 : 1;
        return {
          indice,
          tipo: "certo_errado",
          banca: perfil.nome,
          nivel,
          enunciado,
          alternativas: ["Certo", "Errado"],
          corretaIndex: correta,
          respostaAluno: null,
        };
      }

      const qtdAlt = 4;
      const idxCorreta = Math.floor(Math.random() * qtdAlt);
      const alternativas = [];

      for (let i = 0; i < qtdAlt; i++) {
        alternativas.push(
          i === idxCorreta
            ? `Alternativa correta para ${temaUsado}.`
            : `Alternativa incorreta típica da banca ${perfil.nome}.`
        );
      }

      return {
        indice,
        tipo: "objetiva",
        banca: perfil.nome,
        nivel,
        enunciado,
        alternativas,
        corretaIndex: idxCorreta,
        respostaAluno: null,
      };
    }

    // ------------------------------------------------------
    // MODAL DE CONFIGURAÇÃO (Fix + visible)
    // ------------------------------------------------------
    let modalBackdrop = null;

    function criarModalConfiguracao() {
      if (modalBackdrop) return;

      modalBackdrop = document.getElementById("sim-modal-backdrop");

      // Eventos
      document
        .getElementById("sim-modal-close")
        .addEventListener("click", fecharModalConfiguracao);

      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) fecharModalConfiguracao();
      });

      document
        .getElementById("sim-modal-iniciar")
        .addEventListener("click", aplicarConfiguracaoEIniciar);
    }

    function abrirModalConfiguracao() {
      criarModalConfiguracao();
      modalBackdrop.classList.add("visible");
      modalBackdrop.classList.remove("hidden");
    }

    function fecharModalConfiguracao() {
      modalBackdrop.classList.remove("visible");
      modalBackdrop.classList.add("hidden");
    }

    function aplicarConfiguracaoEIniciar() {
      const b = document.getElementById("sim-modal-banca");
      const d = document.getElementById("sim-modal-dificuldade");
      const q = document.getElementById("sim-modal-qtd");
      const t = document.getElementById("sim-modal-tempo");
      const tema = document.getElementById("sim-modal-tema");

      estado.banca = b.value;
      estado.dificuldade = d.value;
      estado.qtd = parseInt(q.value, 10);
      estado.tempoProvaMin = parseInt(t.value, 10);
      estado.tema = tema.value.trim();

      fecharModalConfiguracao();
      mostrarSimulado();
      iniciarSimuladoMock();
    }

    // ------------------------------------------------------
    // INICIAR SIMULADO MOCK
    // ------------------------------------------------------
    function iniciarSimuladoMock() {
      estado.questoes = gerarQuestoesMock();
      estado.indiceAtual = 0;
      estado.emAndamento = true;

      els.resultado.classList.add("hidden");
      els.resultado.innerHTML = "";
      els.nav.classList.remove("hidden");

      iniciarTimerRegressivo();
      renderizarQuestaoAtual();
    }

    // ------------------------------------------------------
    // RENDERIZAR QUESTÃO
    // ------------------------------------------------------
    function renderizarQuestaoAtual() {
      const q = estado.questoes[estado.indiceAtual];
      const total = estado.questoes.length;

      els.progressBar.style.width =
        ((estado.indiceAtual + 1) / total) * 100 + "%";

      els.questaoContainer.innerHTML = "";

      const card = document.createElement("div");
      card.className = "sim-questao-card space-y-4";

      card.innerHTML = `
        <div class="flex justify-between text-xs text-[var(--muted)]">
          <span>Questão ${estado.indiceAtual + 1} de ${total}</span>
          <span>${q.banca} · ${q.nivel}</span>
        </div>

        <p class="sim-enunciado">${q.enunciado}</p>
      `;

      const altContainer = document.createElement("div");
      altContainer.className = "space-y-2";

      q.alternativas.forEach((alt, i) => {
        const el = document.createElement("div");
        el.className =
          "sim-alt" + (q.respostaAluno === i ? " selected" : "");
        el.innerHTML = `
          <div class="sim-radio"></div>
          <div class="sim-alt-text">${alt}</div>
        `;
        el.addEventListener("click", () => {
          q.respostaAluno = i;
          renderizarQuestaoAtual();
        });
        altContainer.appendChild(el);
      });

      card.appendChild(altContainer);
      els.questaoContainer.appendChild(card);

      els.btnVoltar.disabled = estado.indiceAtual === 0;
      els.btnProxima.textContent =
        estado.indiceAtual === total - 1
          ? "Finalizar simulado ▶"
          : "Próxima ▶";
    }

    // ------------------------------------------------------
    // FINALIZAR PROVA
    // ------------------------------------------------------
    function finalizarSimulado(porTempo = false) {
      pararTimer();
      estado.emAndamento = false;

      const total = estado.questoes.length;
      let acertos = 0;
      let respondidas = 0;

      estado.questoes.forEach((q) => {
        if (q.respostaAluno != null) {
          respondidas++;
          if (q.respostaAluno === q.corretaIndex) acertos++;
        }
      });

      const perc = Math.round((acertos / total) * 100);

      els.resultado.classList.remove("hidden");
      els.resultado.innerHTML = `
        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Resultado do simulado</div>
          <div class="sim-score">${perc}%</div>

          <p><strong>Acertos:</strong> ${acertos} de ${total}</p>
          <p><strong>Banca:</strong> ${getPerfilBanca(estado.banca).nome}</p>
          <p><strong>Tema:</strong> ${estado.tema || "Não informado"}</p>
        </div>
      `;

      salvarNoHistorico({
        dataISO: new Date().toISOString(),
        banca: estado.banca,
        qtd: total,
        acertos,
        perc,
      });
    }

    // ------------------------------------------------------
    // NAVEGAÇÃO
    // ------------------------------------------------------
    els.btnVoltar.addEventListener("click", () => {
      if (estado.indiceAtual > 0) {
        estado.indiceAtual--;
        renderizarQuestaoAtual();
      }
    });

    els.btnProxima.addEventListener("click", () => {
      if (estado.indiceAtual < estado.questoes.length - 1) {
        estado.indiceAtual++;
        renderizarQuestaoAtual();
      } else {
        finalizarSimulado(false);
      }
    });

    // ------------------------------------------------------
    // EVENTO DO BOTÃO "SIMULADOS"
    // ------------------------------------------------------
    els.modoSimulados.addEventListener("click", abrirModalConfiguracao);

    // Voltar para TEMA/UPLOAD limpa tudo
    els.modoTema.addEventListener("click", mostrarPlano);
    els.modoUpload.addEventListener("click", mostrarPlano);

    // estado inicial
    mostrarPlano();

    console.log("🟢 Liora Simulados v3.1 inicializado.");
  });
})();
