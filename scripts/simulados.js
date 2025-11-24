// ==============================================================
// 🧠 LIORA — SIMULADOS v20 (IA REAL + fallback seguro)
// - IA gera questões reais baseadas em banca + tema + dificuldade
// - Fallback automático para mock caso a IA falhe
// - Timer, progresso, navegação, histórico, dashboard
// ==============================================================

(function () {
  console.log("🔵 Liora Simulados v20 (IA real) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------
    // ELEMENTOS
    // ------------------------------------------------------
    const els = {
      areaSimulado: document.getElementById("area-simulado"),

      // simulado
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
    };

    if (!els.areaSimulado) return;

    // ------------------------------------------------------
    // BOTÃO "CONFIGURAR" (aparece apenas dentro de Simulados)
    // ------------------------------------------------------
    let btnConfig = document.getElementById("sim-open-config");

    function ensureConfigButtonVisible() {
      if (!btnConfig) {
        btnConfig = document.createElement("button");
        btnConfig.id = "sim-open-config";
        btnConfig.className = "btn-secondary sim-config-btn";
        btnConfig.style.marginBottom = "0.75rem";
        btnConfig.textContent = "Configurar simulado";
        els.areaSimulado.insertBefore(btnConfig, els.areaSimulado.firstChild);
      }
      btnConfig.style.display = "none"; // NÃO aparece na carga inicial
    }
    ensureConfigButtonVisible();

    // controlado pelo nav-home → quando usuário clica "Simulados"
    window.showSimFab = () => {
      if (btnConfig) btnConfig.style.display = "inline-flex";
    };
    window.hideSimFab = () => {
      if (btnConfig) btnConfig.style.display = "none";
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
    };

    // ------------------------------------------------------
    // HISTÓRICO
    // ------------------------------------------------------
    function carregarHistorico() {
      try {
        const raw = localStorage.getItem(HIST_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    function salvarNoHistorico(resumo) {
      const hist = carregarHistorico();
      hist.push(resumo);
      localStorage.setItem(HIST_KEY, JSON.stringify(hist));
    }

    // ------------------------------------------------------
    // MODAL
    // ------------------------------------------------------
    function abrirModal() {
      els.modalBackdrop.classList.add("visible");
      els.modalBackdrop.style.display = "flex";
    }
    function fecharModal() {
      els.modalBackdrop.classList.remove("visible");
      els.modalBackdrop.style.display = "none";
    }

    if (btnConfig) btnConfig.onclick = abrirModal;
    if (els.modalClose) els.modalClose.onclick = fecharModal;
    els.modalBackdrop.onclick = (e) => {
      if (e.target === els.modalBackdrop) fecharModal();
    };

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
    // IA → gerar questões reais
    // ------------------------------------------------------
    async function gerarQuestoesIA() {
      const prompt = `
Gere ${estado.qtd} questões de ${estado.banca}, dificuldade ${estado.dificuldade},
tema: "${estado.tema || "geral"}".

Formato JSON puro:
[
  {
    "enunciado": "texto",
    "alternativas": ["A", "B", "C", "D"],
    "corretaIndex": 2,
    "nivel": "facil|medio|dificil"
  }
]
`;

      try {
        const res = await fetch("/api/liora", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system: "Você é Liora, geradora de questões de concurso.",
            user: prompt,
          }),
        });

        const json = await res.json();
        if (!json.output) throw new Error("IA sem output");

        const parsed = JSON.parse(
          json.output.match(/```json([\s\S]*?)```/)?.[1] ||
            json.output.match(/```([\s\S]*?)```/)?.[1] ||
            json.output
        );

        if (!Array.isArray(parsed) || parsed.length === 0)
          throw new Error("IA retornou inválido");

        return parsed;
      } catch (e) {
        console.warn("⚠️ IA falhou → fallback para mock", e);
        return null;
      }
    }

    // ------------------------------------------------------
    // MOCK (fallback)
    // ------------------------------------------------------
    function gerarMock() {
      const qs = [];
      for (let i = 0; i < estado.qtd; i++) {
        qs.push({
          enunciado: `Questão mock ${i + 1} sobre ${estado.tema}.`,
          alternativas: ["A", "B", "C", "D"],
          corretaIndex: Math.floor(Math.random() * 4),
          nivel: "medio",
        });
      }
      return qs;
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
        "flex justify-between items-center text-xs text-[var(--muted)] mb-3";
      header.innerHTML = `
        <span>Questão ${estado.indiceAtual + 1} de ${total}</span>
        <span>${estado.banca} · ${q.nivel || "—"}</span>
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

      els.btnVoltar.disabled = estado.indiceAtual === 0;
      els.progressBar.style.width =
        ((estado.indiceAtual + 1) / total) * 100 + "%";
    }

    // ------------------------------------------------------
    // FINALIZAR
    // ------------------------------------------------------
    function finalizarSimulado(porTempo = false) {
      pararTimer();

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

      els.questaoContainer.innerHTML = "";
      els.resultado.innerHTML = "";
      els.nav.classList.add("hidden");

      const card = document.createElement("div");
      card.className = "sim-resultado-card";

      card.innerHTML = `
        <div class="sim-resultado-titulo">Resultado do simulado</div>
        <div class="sim-score">${perc}%</div>

        <p>Acertos: ${acertos} de ${total}</p>
        <p>Respondidas: ${respondidas} de ${total}</p>
        <p>${
          porTempo ? "⚠️ Encerrado por tempo" : "Tempo finalizado"
        }</p>

        <div class="mt-4 flex gap-2">
          <button id="sim-refazer" class="btn-secondary">Fazer outro</button>
          <button id="sim-ir-dashboard" class="btn-primary">Dashboard</button>
        </div>
      `;

      els.resultado.appendChild(card);
      els.resultado.classList.remove("hidden");

      document.getElementById("sim-refazer").onclick = () => location.reload();
      document.getElementById("sim-ir-dashboard").onclick = () =>
        window.homeDashboard();

      salvarNoHistorico({
        dataISO: new Date().toISOString(),
        banca: estado.banca,
        tema: estado.tema,
        qtd: total,
        acertos,
        perc,
      });
    }

    // ------------------------------------------------------
    // NAVEGAÇÃO
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
        finalizarSimulado(false);
      }
    };

    // ------------------------------------------------------
    // INICIAR (IA + fallback)
    // ------------------------------------------------------
    els.modalIniciar.onclick = async () => {
      estado.banca = els.selBanca.value;
      estado.qtd = Number(els.selQtd.value);
      estado.tempoProvaMin = Number(els.selTempo.value);
      estado.dificuldade = els.selDificuldade.value;
      estado.tema = els.inpTema.value.trim();

      fecharModal();

      els.resultado.classList.add("hidden");
      els.resultado.innerHTML = "";

      // IA primeiro
      let qs = await gerarQuestoesIA();
      if (!qs) qs = gerarMock();

      estado.questoes = qs.map((q, i) => ({
        indice: i + 1,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        corretaIndex: q.corretaIndex,
        nivel: q.nivel || "medio",
        respostaAluno: null,
      }));

      estado.indiceAtual = 0;
      iniciarTimer();
      render();
    };
  });
})();
