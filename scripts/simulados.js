// ==========================================================
// 🧠 LIORA — SIMULADOS v4 (modal estático + correções finais)
// - Usa SOMENTE o modal presente no index.html
// - Abre no primeiro clique
// - Botão "Iniciar simulado" funcionando
// - IDs alinhados com o HTML enviado
// ==========================================================

(function () {
  console.log("🔵 Liora Simulados v4 (modal estático) carregado...");

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

      // MODAL
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
    // MOSTRAR / OCULTAR MODAL
    // ------------------------------------------------------
    function abrirModal() {
      els.modalBackdrop.classList.remove("hidden");
      els.modalBackdrop.classList.add("visible");
    }

    function fecharModal() {
      els.modalBackdrop.classList.remove("visible");
      setTimeout(() => els.modalBackdrop.classList.add("hidden"), 150);
    }

    // ------------------------------------------------------
    // CLICAR EM "Simulados"
    // ------------------------------------------------------
    els.modoSimulados.addEventListener("click", () => {
      abrirModal();
    });

    // ------------------------------------------------------
    // FECHAR MODAL
    // ------------------------------------------------------
    els.modalClose.addEventListener("click", fecharModal);
    els.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.modalBackdrop) fecharModal();
    });

    // ------------------------------------------------------
    // MOSTRAR/OCULTAR DISTRIBUIÇÃO PERSONALIZADA
    // ------------------------------------------------------
    els.selModoDificuldade.addEventListener("change", () => {
      const modo = els.selModoDificuldade.value;
      if (modo === "personalizado") {
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

      els.timer.classList.remove("hidden");
      els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);

      estado.timerId = setInterval(() => {
        estado.tempoRestanteSeg--;
        els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);

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
    // GERA QUESTÕES MOCK
    // ------------------------------------------------------
    function gerarQuestoesMock() {
      const qs = [];
      const total = estado.qtd;

      // distribuição
      let dist = { ...estado.dificuldadeDist };

      // modo equilibrado
      if (estado.dificuldadeModo === "equilibrado") {
        dist = { facil: 33, medio: 33, dificil: 34 };
      }

      // padrão da banca → médio
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
      const tema = "seu tema de estudo";
      const bancaNome = els.selBanca.value.toUpperCase();

      const base = {
        facil: "Questão introdutória sobre " + tema,
        medio: "Questão intermediária sobre " + tema,
        dificil: "Questão avançada sobre " + tema,
      };

      const enunciado = `${base[nivel]} — Nível ${nivel.toUpperCase()} — Banca ${bancaNome}`;

      const alternativas = [
        "Alternativa A",
        "Alternativa B",
        "Alternativa C",
        "Alternativa D",
      ];

      const corretaIndex = Math.floor(Math.random() * 4);

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
    // MOSTRAR SIMULADO
    // ------------------------------------------------------
    function mostrarSimulado() {
      els.areaPlano.classList.add("hidden");
      els.areaSimulado.classList.remove("hidden");
    }

    // ------------------------------------------------------
    // RENDER QUESTÃO
    // ------------------------------------------------------
    function render() {
      const total = estado.questoes.length;
      const q = estado.questoes[estado.indiceAtual];

      els.questaoContainer.innerHTML = "";

      const header = document.createElement("div");
      header.className =
        "flex justify-between text-xs text-[var(--muted)] mb-3";
      header.innerHTML = `
        <span>Questão ${q.indice} de ${total}</span>
        <span>${q.banca} · ${q.nivel}</span>
      `;
      els.questaoContainer.appendChild(header);

      const p = document.createElement("p");
      p.className = "sim-enunciado mb-3";
      p.textContent = q.enunciado;
      els.questaoContainer.appendChild(p);

      q.alternativas.forEach((alt, idx) => {
        const div = document.createElement("div");
        div.className =
          "sim-alt" + (q.respostaAluno === idx ? " selected" : "");
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

      // botão próximo vira finalizar na última questão
      els.btnProxima.textContent =
        estado.indiceAtual === total - 1
          ? "Finalizar simulado ▶"
          : "Próxima ▶";
    }

    // ------------------------------------------------------
    // FINALIZAR
    // ------------------------------------------------------
    function finalizarSimulado() {
      pararTimer();
      els.questaoContainer.innerHTML = "";
      els.nav.classList.add("hidden");

      const card = document.createElement("div");
      card.className = "sim-resultado-card";

      card.innerHTML = `
        <h3 class="sim-resultado-titulo">Simulado finalizado!</h3>
        <p class="text-sm text-[var(--muted)] mt-2">
          Em produção, resultados reais serão exibidos aqui.
        </p>
      `;

      els.questaoContainer.appendChild(card);
    }

    // ------------------------------------------------------
    // EVENTOS DE NAVEGAÇÃO
    // ------------------------------------------------------
    els.btnVoltar.onclick = () => {
      if (estado.indiceAtual > 0) {
        estado.indiceAtual--;
        render();
      }
    };

    els.btnProxima.onclick = () => {
      if (estado.indiceAtual < estado.questoes.length - 1) {
        estado.indiceAtual++;
        render();
      } else {
        finalizarSimulado();
      }
    };

    // ------------------------------------------------------
    // CLICAR EM "Iniciar simulado"
    // ------------------------------------------------------
    els.modalIniciar.addEventListener("click", () => {
      // validar personalizada
      if (els.selModoDificuldade.value === "personalizado") {
        const soma =
          Number(els.difFacil.value) +
          Number(els.difMedio.value) +
          Number(els.difDificil.value);

        if (soma !== 100) {
          els.difErro.classList.remove("hidden");
          return;
        }

        estado.dificuldadeDist = {
          facil: Number(els.difFacil.value),
          medio: Number(els.difMedio.value),
          dificil: Number(els.difDificil.value),
        };
      }

      // aplicar config
      estado.banca = els.selBanca.value;
      estado.qtd = Number(els.inpQtd.value);
      estado.tempoProvaMin = Number(els.inpTempo.value);
      estado.dificuldadeModo = els.selModoDificuldade.value;

      fecharModal();
      mostrarSimulado();

      estado.questoes = gerarQuestoesMock();
      estado.indiceAtual = 0;

      iniciarTimer();
      render();
    });

    // ------------------------------------------------------
    // Início
    // ------------------------------------------------------
    console.log("🟢 Liora Simulados v4 inicializado.");
  });
})();
