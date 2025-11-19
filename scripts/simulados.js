// ==========================================================
// 🧠 LIORA — SIMULADOS v6 (FINAL)
// - Nunca quebra se algum elemento não existir
// - addEventListener só é registrado se o ID existe
// - Compatível 100% com o index enviado
// ==========================================================

(function () {
  console.log("🔵 Liora Simulados v6 carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS BASE (TODOS COM FALLBACK)
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

      modalBackdrop: document.getElementById("sim-modal-backdrop"),
      modalClose: document.getElementById("sim-modal-close"),
      modalIniciar: document.getElementById("sim-modal-iniciar"),

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

    // ------------------------------------------------------
    // Função SAFE de listener (nunca quebra)
    // ------------------------------------------------------
    function on(el, event, fn) {
      if (el) el.addEventListener(event, fn);
      else console.warn("⚠️ Elemento não encontrado para", event, fn);
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
      dificuldadeModo: "padrao",
      dificuldadeDist: { facil: 30, medio: 50, dificil: 20 },
      tempoProvaMin: 30,
      tempoRestanteSeg: 0,
      timerId: null,
    };

    // ------------------------------------------------------
    // MODAL
    // ------------------------------------------------------
    function abrirModal() {
      if (!els.modalBackdrop) return;
      els.modalBackdrop.classList.remove("hidden");
      els.modalBackdrop.classList.add("visible");
    }

    function fecharModal() {
      if (!els.modalBackdrop) return;
      els.modalBackdrop.classList.remove("visible");
      setTimeout(() => els.modalBackdrop.classList.add("hidden"), 150);
    }

    // Abrir modal com segurança
    on(els.modoSimulados, "click", abrirModal);

    // Fechar modal
    on(els.modalClose, "click", fecharModal);

    on(els.modalBackdrop, "click", (e) => {
      if (e.target === els.modalBackdrop) fecharModal();
    });

    // ------------------------------------------------------
    // DIFICULDADE PERSONALIZADA
    // ------------------------------------------------------
    on(els.selModoDificuldade, "change", () => {
      if (!els.selModoDificuldade || !els.difCustomContainer) return;

      if (els.selModoDificuldade.value === "personalizado") {
        els.difCustomContainer.classList.remove("hidden");
      } else {
        els.difCustomContainer.classList.add("hidden");
      }
    });

    // ------------------------------------------------------
    // TIMER
    // ------------------------------------------------------
    function formatarTempo(seg) {
      const m = Math.floor(seg / 60);
      const s = seg % 60;
      return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    function iniciarTimer() {
      estado.tempoRestanteSeg = estado.tempoProvaMin * 60;

      if (els.timer) {
        els.timer.classList.remove("hidden");
        els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);
      }

      estado.timerId = setInterval(() => {
        estado.tempoRestanteSeg--;
        if (els.timer) {
          els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);
        }
        if (estado.tempoRestanteSeg <= 0) {
          clearInterval(estado.timerId);
          finalizarSimulado(true);
        }
      }, 1000);
    }

    function pararTimer() {
      if (estado.timerId) clearInterval(estado.timerId);
      estado.timerId = null;
    }

    // ------------------------------------------------------
    // QUESTÕES MOCK
    // ------------------------------------------------------
    function gerarQuestoesMock() {
      const qs = [];
      const total = estado.qtd;

      let dist = { ...estado.dificuldadeDist };

      if (estado.dificuldadeModo === "equilibrado") {
        dist = { facil: 33, medio: 33, dificil: 34 };
      }

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
      const bancaNome = els.selBanca ? els.selBanca.value.toUpperCase() : "BANCA";

      return {
        indice,
        nivel,
        banca: bancaNome,
        enunciado: `Questão ${nivel.toUpperCase()} — Banca ${bancaNome}`,
        alternativas: ["A", "B", "C", "D"],
        corretaIndex: Math.floor(Math.random() * 4),
        respostaAluno: null,
      };
    }

    // ------------------------------------------------------
    // MOSTRAR SIMULADO
    // ------------------------------------------------------
    function mostrarSimulado() {
      if (els.areaPlano) els.areaPlano.classList.add("hidden");
      if (els.areaSimulado) els.areaSimulado.classList.remove("hidden");
    }

    // ------------------------------------------------------
    // RENDER QUESTÃO
    // ------------------------------------------------------
    function render() {
      if (!els.questaoContainer) return;

      const q = estado.questoes[estado.indiceAtual];
      const total = estado.questoes.length;

      els.questaoContainer.innerHTML = `
        <div class="flex justify-between text-xs text-[var(--muted)] mb-3">
          <span>Questão ${q.indice} de ${total}</span>
          <span>${q.banca} · ${q.nivel}</span>
        </div>
        <p class="sim-enunciado mb-3">${q.enunciado}</p>
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

      if (els.nav) els.nav.classList.remove("hidden");
      if (els.btnProxima) {
        els.btnProxima.textContent =
          estado.indiceAtual === total - 1
            ? "Finalizar simulado ▶"
            : "Próxima ▶";
      }
    }

    // ------------------------------------------------------
    // FINALIZAR
    // ------------------------------------------------------
    function finalizarSimulado() {
      pararTimer();
      if (!els.questaoContainer) return;

      els.questaoContainer.innerHTML = `
        <div class="sim-resultado-card">
          <h3 class="sim-resultado-titulo">Simulado finalizado!</h3>
          <p class="text-sm text-[var(--muted)] mt-2">
            Em produção, resultados reais serão exibidos aqui.
          </p>
        </div>
      `;

      if (els.nav) els.nav.classList.add("hidden");
    }

    // ------------------------------------------------------
    // NAVEGAÇÃO
    // ------------------------------------------------------
    on(els.btnVoltar, "click", () => {
      if (estado.indiceAtual > 0) {
        estado.indiceAtual--;
        render();
      }
    });

    on(els.btnProxima, "click", () => {
      if (estado.indiceAtual < estado.questoes.length - 1) {
        estado.indiceAtual++;
        render();
      } else {
        finalizarSimulado();
      }
    });

    // ------------------------------------------------------
    // INICIAR SIMULADO
    // ------------------------------------------------------
    on(els.modalIniciar, "click", () => {
      if (els.selModoDificuldade && els.selModoDificuldade.value === "personalizado") {
        const soma =
          Number(els.difFacil.value) +
          Number(els.difMedio.value) +
          Number(els.difDificil.value);

        if (soma !== 100) {
          if (els.difErro) els.difErro.classList.remove("hidden");
          return;
        }

        estado.dificuldadeDist = {
          facil: Number(els.difFacil.value),
          medio: Number(els.difMedio.value),
          dificil: Number(els.difDificil.value),
        };
      }

      estado.banca = els.selBanca ? els.selBanca.value : "fgv";
      estado.qtd = Number(els.inpQtd ? els.inpQtd.value : 20);
      estado.tempoProvaMin = Number(els.inpTempo ? els.inpTempo.value : 30);
      estado.dificuldadeModo = els.selModoDificuldade ? els.selModoDificuldade.value : "padrao";

      fecharModal();
      mostrarSimulado();

      estado.questoes = gerarQuestoesMock();
      estado.indiceAtual = 0;

      iniciarTimer();
      render();
    });

    console.log("🟢 Liora Simulados v6 inicializado com sucesso.");
  });
})();
