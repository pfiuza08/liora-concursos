// ==============================================================
// 🧠 LIORA — SIMULADOS v8 (Mock Avançado + Modal Estático)
// - IDs 100% alinhados ao modal enviado
// - Modal abre/fecha corretamente
// - Timer funcional
// - Perfis reais de banca (mock avançado)
// - Dificuldade: fácil / médio / difícil / misturado
// - Tema opcional
// - Iniciar simulado funciona
// - Navegação funciona
// ==============================================================

(function () {
  console.log("🔵 Liora Simulados v8 (mock avançado) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------
    // ELEMENTOS
    // ------------------------------------------------------
    const els = {
      modoSimulados: document.getElementById("modo-simulados"),

      areaPlano: document.getElementById("area-plano"),
      areaSimulado: document.getElementById("area-simulado"),

      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),

      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),

      // MODAL REAL
      modalBackdrop: document.getElementById("sim-modal-backdrop"),
      modalClose: document.getElementById("sim-modal-close-btn"),
      modalIniciar: document.getElementById("sim-modal-iniciar"),

      selBanca: document.getElementById("sim-modal-banca"),
      selQtd: document.getElementById("sim-modal-qtd"),
      selTempo: document.getElementById("sim-modal-tempo"),
      selDificuldade: document.getElementById("sim-modal-dificuldade"),
      inpTema: document.getElementById("sim-modal-tema"),
    };

    // ------------------------------------------------------
    // ESTADO
    // ------------------------------------------------------
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
    // FUNÇÕES DO MODAL
    // ------------------------------------------------------
    function abrirModal() {
      els.modalBackdrop.style.display = "flex";
      els.modalBackdrop.classList.add("visible");
    }

    function fecharModal() {
      els.modalBackdrop.classList.remove("visible");
      els.modalBackdrop.style.display = "none";
    }

    els.modoSimulados.addEventListener("click", abrirModal);
    els.modalClose.addEventListener("click", fecharModal);

    els.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.modalBackdrop) fecharModal();
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
    // PERFIS DE BANCA (mock avançado)
    // ------------------------------------------------------
    const PERFIS = {
      FGV: {
        estilo: "contextual",
        texto:
          "A FGV costuma explorar interpretação refinada e textos longos com pegadinhas.",
      },
      CESPE: {
        estilo: "certo_errado",
        texto:
          "A Cebraspe trabalha com itens binários e foco em literalidade técnica.",
      },
      VUNESP: {
        estilo: "objetiva",
        texto:
          "A Vunesp geralmente traz questões objetivas mais diretas.",
      },
      FCC: {
        estilo: "objetiva",
        texto:
          "A FCC combina objetividade com detalhes conceituais específicos.",
      },
      QUADRIX: {
        estilo: "objetiva",
        texto:
          "A Quadrix tende a misturar literalidade com cenários práticos.",
      },
      IBFC: {
        estilo: "objetiva",
        texto:
          "A IBFC costuma variar entre direto e contextual leve.",
      },
    };

    function getPerfil(banca) {
      return PERFIS[banca] || PERFIS["FGV"];
    }

    // ------------------------------------------------------
    // GERA QUESTÕES (mock avançado)
    // ------------------------------------------------------
    function gerarQuestoesMock() {
      const perfil = getPerfil(estado.banca);
      const qs = [];

      const total = estado.qtd;
      let qtdPorNivel = {
        facil: 0,
        medio: 0,
        dificil: 0,
      };

      if (estado.dificuldade === "misturado") {
        qtdPorNivel.facil = Math.floor(total * 0.3);
        qtdPorNivel.medio = Math.floor(total * 0.4);
        qtdPorNivel.dificil = total - qtdPorNivel.facil - qtdPorNivel.medio;
      } else {
        qtdPorNivel[estado.dificuldade] = total;
      }

      function add(n, nivel) {
        for (let i = 0; i < n; i++) {
          qs.push(criarQuestaoMock(qs.length + 1, nivel, perfil));
        }
      }

      add(qtdPorNivel.facil, "facil");
      add(qtdPorNivel.medio, "medio");
      add(qtdPorNivel.dificil, "dificil");

      return qs;
    }

    function criarQuestaoMock(indice, nivel, perfil) {
      const tema = estado.tema || "o tema escolhido";

      const dificuldadeLabel =
        nivel === "facil"
          ? "Fácil"
          : nivel === "medio"
          ? "Médio"
          : "Difícil";

      let enunciado = "";

      if (perfil.estilo === "certo_errado") {
        enunciado = `(${dificuldadeLabel} — C/E) ${perfil.texto}. Avalie a afirmação: “No contexto de ${tema}, considere que a banca adota interpretação técnica e objetiva.”`;
        return {
          indice,
          nivel,
          banca: estado.banca,
          enunciado,
          alternativas: ["Certo", "Errado"],
          corretaIndex: Math.random() > 0.5 ? 0 : 1,
          respostaAluno: null,
        };
      }

      // Estilo OBJETIVO / CONTEXTUAL
      enunciado = `${perfil.texto}  
Com base em ${tema}, assinale a alternativa correta.  
(Nível ${dificuldadeLabel})`;

      const alternativas = [
        `A) Alternativa correta de acordo com padrões da banca ${estado.banca}.`,
        `B) Alternativa com erro sutil de interpretação.`,
        `C) Alternativa com detalhe parcialmente incorreto.`,
        `D) Alternativa com generalização indevida ou absoluta.`,
      ];

      const correta = Math.floor(Math.random() * 4);

      return {
        indice,
        nivel,
        banca: estado.banca,
        enunciado,
        alternativas,
        corretaIndex: correta,
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
    // RENDERIZAR QUESTÃO
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
      p.className = "sim-enunciado mb-3 whitespace-pre-line";
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

      els.btnProxima.textContent =
        estado.indiceAtual === total - 1
          ? "Finalizar simulado ▶"
          : "Próxima ▶";

      els.progressBar.style.width =
        ((estado.indiceAtual + 1) / total) * 100 + "%";
    }

    // ------------------------------------------------------
    // FINALIZAR SIMULADO
    // ------------------------------------------------------
    function finalizarSimulado() {
      pararTimer();
      els.nav.classList.add("hidden");
      els.questaoContainer.innerHTML = "";

      const card = document.createElement("div");
      card.className = "sim-resultado-card";

      card.innerHTML = `
        <h3 class="sim-resultado-titulo">Simulado finalizado!</h3>
        <p class="text-sm text-[var(--muted)] mt-2">
          Resultados detalhados serão exibidos na versão completa.
        </p>
      `;

      els.questaoContainer.appendChild(card);
    }

    // ------------------------------------------------------
    // EVENTOS (voltar / próxima)
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
    // INICIAR SIMULADO
    // ------------------------------------------------------
    els.modalIniciar.addEventListener("click", () => {
      estado.banca = els.selBanca.value;
      estado.qtd = Number(els.selQtd.value);
      estado.tempoProvaMin = Number(els.selTempo.value);
      estado.dificuldade = els.selDificuldade.value;
      estado.tema = els.inpTema.value.trim();

      fecharModal();
      mostrarSimulado();

      estado.questoes = gerarQuestoesMock();
      estado.indiceAtual = 0;

      iniciarTimer();
      render();
    });

    // ------------------------------------------------------
    console.log("🟢 Liora Simulados v8 inicializado com sucesso.");
  });
})();
