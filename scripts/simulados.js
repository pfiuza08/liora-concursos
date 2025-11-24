// ==============================================================
// 🧠 LIORA — SIMULADOS IA v1.0 (Layout Comercial)
// - Gera simulados com IA real (questionário contextual)
// - Fallback automático para mock se IA falhar
// - Totalmente integrado com nav-home + dashboard + tema
// ==============================================================

(function () {
  console.log("🔵 Liora Simulados IA v1.0 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------
    // ELEMENTOS
    // ------------------------------------------------------
    const els = {
      area: document.getElementById("area-simulado"),

      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),
      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),

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
    // BOTÃO "Configurar simulado" (só aparece em SIMULADOS)
    // ------------------------------------------------------
    let btnConfig = document.getElementById("sim-open-config");
    if (!btnConfig) {
      btnConfig = document.createElement("button");
      btnConfig.id = "sim-open-config";
      btnConfig.className = "btn-secondary sim-config-btn";
      btnConfig.style.marginBottom = "0.75rem";
      btnConfig.style.display = "none"; // só aparece quando SIMULADOS ativo
      btnConfig.textContent = "Configurar simulado";
      els.area.insertBefore(btnConfig, els.area.firstChild);
    }

    // ------------------------------------------------------
    // MOSTRA/ESCONDE botão de configuração
    // ------------------------------------------------------
    window.showSimFab = () => {
      btnConfig.style.display = "flex";
    };
    window.hideSimFab = () => {
      btnConfig.style.display = "none";
    };

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
      usandoIA: true,
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

    function salvarHistorico(entry) {
      const h = carregarHistorico();
      h.push(entry);
      localStorage.setItem(HIST_KEY, JSON.stringify(h));
    }

    // ------------------------------------------------------
    // MODAL
    // ------------------------------------------------------
    btnConfig.addEventListener("click", () => {
      els.modalBackdrop.classList.add("visible");
    });

    els.modalClose.addEventListener("click", () => {
      els.modalBackdrop.classList.remove("visible");
    });

    els.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.modalBackdrop) {
        els.modalBackdrop.classList.remove("visible");
      }
    });

    // ------------------------------------------------------
    // IA — GERAR QUESTÕES DE VERDADE
    // ------------------------------------------------------
    async function gerarQuestoesIA() {
      const tema = estado.tema || "conhecimentos gerais";
      const banca = estado.banca;

      const prompt = `
Gere um conjunto de ${estado.qtd} questões do estilo da banca ${banca}.
Inclua:
- enunciado claro
- 4 alternativas (A, B, C, D)
- alternativa correta (0 a 3)
- nível: fácil, médio ou difícil
- expedição textual coerente com o estilo da banca
- SE possível: contextualizar ao tema "${tema}"

Retorne APENAS JSON, neste formato:

[
  {
    "nivel": "medio",
    "enunciado": "texto...",
    "alternativas": ["A...", "B...", "C...", "D..."],
    "corretaIndex": 2
  }
]`;

      try {
        const raw = await window.callLLM(
          "Você é um gerador de questões de concurso. Responda apenas JSON.",
          prompt
        );

        const questoes = JSON.parse(raw);

        if (!Array.isArray(questoes) || !questoes.length) {
          throw new Error("IA retornou vazio");
        }

        return questoes.map((q, i) => ({
          indice: i + 1,
          ...q,
          respostaAluno: null,
        }));
      } catch (err) {
        console.error("❌ IA falhou, usando mock", err);
        estado.usandoIA = false;
        return gerarQuestoesMock();
      }
    }

    // ------------------------------------------------------
    // MOCK DE BACKUP (caso IA falhe)
    // ------------------------------------------------------
    function gerarQuestoesMock() {
      const qs = [];
      for (let i = 1; i <= estado.qtd; i++) {
        qs.push({
          indice: i,
          nivel: "medio",
          enunciado: `Questão mock ${i}.`,
          alternativas: ["A", "B", "C", "D"],
          corretaIndex: Math.floor(Math.random() * 4),
          respostaAluno: null,
        });
      }
      return qs;
    }

    // ------------------------------------------------------
    // TIMER
    // ------------------------------------------------------
    function iniciarTimer() {
      estado.tempoRestanteSeg = estado.tempoProvaMin * 60;
      els.timer.classList.remove("hidden");

      estado.timerId = setInterval(() => {
        estado.tempoRestanteSeg--;
        els.timer.textContent = formatar(estado.tempoRestanteSeg);

        if (estado.tempoRestanteSeg <= 0) {
          clearInterval(estado.timerId);
          finalizarSimulado(true);
        }
      }, 1000);
    }

    function formatar(seg) {
      const m = String(Math.floor(seg / 60)).padStart(2, "0");
      const s = String(seg % 60).padStart(2, "0");
      return `${m}:${s}`;
    }

    // ------------------------------------------------------
    // RENDER QUESTÃO
    // ------------------------------------------------------
    function render() {
      const q = estado.questoes[estado.indiceAtual];
      const total = estado.questoes.length;

      els.questaoContainer.innerHTML = "";

      const header = document.createElement("div");
      header.className = "flex justify-between text-xs text-[var(--muted)]";
      header.innerHTML = `Questão ${q.indice} de ${total}`;
      els.questaoContainer.appendChild(header);

      const en = document.createElement("p");
      en.className = "sim-enunciado";
      en.textContent = q.enunciado;
      els.questaoContainer.appendChild(en);

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
      els.btnVoltar.disabled = estado.indiceAtual === 0;

      els.btnProxima.textContent =
        estado.indiceAtual === total - 1
          ? "Finalizar ▶"
          : "Próxima ▶";

      els.progressBar.style.width =
        ((estado.indiceAtual + 1) / total) * 100 + "%";
    }

    // ------------------------------------------------------
    // FINALIZAR SIMULADO
    // ------------------------------------------------------
    function finalizarSimulado(porTempo = false) {
      clearInterval(estado.timerId);
      els.nav.classList.add("hidden");
      els.questaoContainer.innerHTML = "";
      els.resultado.innerHTML = "";

      const total = estado.questoes.length;
      let acertos = 0;

      estado.questoes.forEach((q) => {
        if (q.respostaAluno === q.corretaIndex) acertos++;
      });

      const perc = Math.round((acertos / total) * 100);

      const card = document.createElement("div");
      card.className = "sim-resultado-card";
      card.innerHTML = `
        <div class="sim-resultado-titulo">Resultado do simulado</div>
        <div class="sim-score">${perc}%</div>
        <p class="sim-feedback">${
          porTempo ? "Encerrado por tempo ⏳" : "Simulado finalizado!"
        }</p>
        
        <div class="mt-4 flex gap-2">
          <button class="btn-secondary" id="sim-refazer">Refazer</button>
          <button class="btn-primary" id="sim-ir-dashboard">Ver desempenho</button>
        </div>
      `;
      els.resultado.appendChild(card);
      els.resultado.classList.remove("hidden");

      // salvar histórico
      salvarHistorico({
        banca: estado.banca,
        tema: estado.tema,
        qtd: total,
        perc,
        dataISO: new Date().toISOString(),
      });

      // BOTÕES DO RESULTADO
      document.getElementById("sim-refazer").onclick = () => {
        window.location.reload();
      };

      document.getElementById("sim-ir-dashboard").onclick = () => {
        if (window.homeDashboard) {
          window.homeDashboard();
        } else {
          window.location.reload();
        }
      };
    }

    // ------------------------------------------------------
    // NAVEGAÇÃO ENTRE QUESTÕES
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
    // INICIAR SIMULADO (IA)
    // ------------------------------------------------------
    els.modalIniciar.addEventListener("click", async () => {
      estado.banca = els.selBanca.value;
      estado.qtd = Number(els.selQtd.value);
      estado.tempoProvaMin = Number(els.selTempo.value);
      estado.dificuldade = els.selDificuldade.value;
      estado.tema = els.inpTema.value.trim();

      els.modalBackdrop.classList.remove("visible");

      // limpa
      els.resultado.classList.add("hidden");
      els.resultado.innerHTML = "";

      // IA
      estado.questoes = await gerarQuestoesIA();
      estado.indiceAtual = 0;

      iniciarTimer();
      render();
    });

    console.log("🟢 Liora Simulados IA inicializado");
  });
})();
