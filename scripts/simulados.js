// ==============================================================
// 🧠 LIORA — SIMULADOS v97-IA-PREMIUM-DIA2
// - IA /api/liora para gerar questões reais
// - Seletor de IAs auxiliares (C)
// - Badges de IA (D)
// - Loading global + progress interno
// - Timer + navegação
// - Resultado + salvamento histórico
// - 🔥 Memória de estudos (auto-preenchimento)
// - 🔥 Mensagem amigável quando não houver estudos
// - 🔥 Compatível com FAB + nav-home v72
// ==============================================================

(function () {
  console.log("🔵 Liora Simulados v97-IA-PREMIUM-DIA2 carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------------------------------
    // ELEMENTOS
    // -------------------------------------------------------
    const els = {
      areaSim: document.getElementById("area-simulado"),
      fabSim: document.getElementById("sim-fab"),

      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),
      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),

      modal: document.getElementById("sim-modal-backdrop"),
      modalClose: document.getElementById("sim-modal-close-btn"),
      btnIniciar: document.getElementById("sim-modal-iniciar"),

      selBanca: document.getElementById("sim-modal-banca"),
      selQtd: document.getElementById("sim-modal-qtd"),
      selTempo: document.getElementById("sim-modal-tempo"),
      selDif: document.getElementById("sim-modal-dificuldade"),
      inpTema: document.getElementById("sim-modal-tema"),

      avisoEstudos: document.getElementById("sim-modal-aviso-estudos")
    };

    if (!els.areaSim || !els.fabSim) {
      console.error("❌ Simulados: elementos essenciais não encontrados.");
      return;
    }


    // -------------------------------------------------------
    // IA CONFIG
    // -------------------------------------------------------
    const IA_CONFIG = {
      banca: {
        id: "banca",
        label: "IA Banca",
        emoji: "🏛️",
        badgeClass: "sim-ia-badge--banca",
        prompt:
          "ajuste vocabulário, pegadinhas e estrutura para refletir fielmente a banca."
      },
      explica: {
        id: "explica",
        label: "IA Explica",
        emoji: "💡",
        badgeClass: "sim-ia-badge--explica",
        prompt:
          "garanta gabarito consistente e explicações claras, se solicitadas."
      },
      reforco: {
        id: "reforco",
        label: "IA Reforço",
        emoji: "📈",
        badgeClass: "sim-ia-badge--reforco",
        prompt:
          "reforce conceitos centrais e armadilhas frequentes."
      },
      historico: {
        id: "historico",
        label: "IA Histórico",
        emoji: "🧠",
        badgeClass: "sim-ia-badge--historico",
        prompt:
          "adapte levemente a dificuldade com base no histórico."
      },
    };

    const iaState = {
      selecionadas: new Set(["banca", "explica"])
    };


    // -------------------------------------------------------
    // ESTADO GERAL
    // -------------------------------------------------------
    const HIST_KEY = "liora:simulados:historico";

    const STATE = {
      questoes: [],
      atual: 0,
      banca: "FGV",
      qtd: 10,
      dificuldade: "misturado",
      tema: "",
      tempoMin: 30,
      tempoRestante: 0,
      timerID: null,
      loadingIA: false,
      loadingIntervalID: null,
    };


    function loadHistorico() {
      try {
        const raw = localStorage.getItem(HIST_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function salvarNoHistorico(resumo) {
      try {
        const hist = loadHistorico();
        hist.push(resumo);
        localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      } catch (e) {
        console.warn("⚠️ Erro ao salvar histórico de simulados", e);
      }
    }


    // -------------------------------------------------------
    // IA SELECTOR (chips)
    // -------------------------------------------------------
    function setupIaSelector() {
      const modalBody = document.querySelector("#sim-modal-backdrop .sim-modal-body");
      if (!modalBody) return;
      if (modalBody.querySelector(".sim-ia-row")) return;

      const row = document.createElement("div");
      row.className = "sim-ia-row";

      const label = document.createElement("div");
      label.className = "sim-ia-label";
      label.textContent = "IAs auxiliares (beta)";

      const options = document.createElement("div");
      options.className = "sim-ia-options";

      Object.values(IA_CONFIG).forEach((cfg) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "sim-ia-option";
        if (iaState.selecionadas.has(cfg.id)) chip.classList.add("active");
        chip.dataset.iaId = cfg.id;

        chip.innerHTML = `
          <span class="emoji">${cfg.emoji}</span>
          <span>${cfg.label}</span>
        `;

        chip.onclick = () => {
          if (iaState.selecionadas.has(cfg.id)) {
            if (iaState.selecionadas.size === 1) return;
            iaState.selecionadas.delete(cfg.id);
            chip.classList.remove("active");
          } else {
            iaState.selecionadas.add(cfg.id);
            chip.classList.add("active");
          }
        };

        options.appendChild(chip);
      });

      row.appendChild(label);
      row.appendChild(options);
      modalBody.appendChild(row);
    }

    setupIaSelector();


    // -------------------------------------------------------
    // Badges IA
    // -------------------------------------------------------
    function renderIaBadges() {
      const selected = Array.from(iaState.selecionadas);
      if (!selected.length) return "";

      return `
        <span class="sim-ia-badges">
          ${selected
            .map((id) => {
              const cfg = IA_CONFIG[id];
              return cfg
                ? `<span class="sim-ia-badge ${cfg.badgeClass}">${cfg.emoji} ${cfg.label}</span>`
                : "";
            })
            .join("")}
        </span>
      `;
    }


    // -------------------------------------------------------
    // IA PROMPT
    // -------------------------------------------------------
    function getIaPromptFragment() {
      const selected = Array.from(iaState.selecionadas);
      if (!selected.length) return "";

      return (
        "\nAlém das regras acima, considere os modos ativados:\n" +
        selected
          .map((id) => IA_CONFIG[id])
          .filter(Boolean)
          .map((cfg) => `- "${cfg.label}": ${cfg.prompt}`)
          .join("\n")
      );
    }


    // -------------------------------------------------------
    // CHAMADA IA (OpenAI)
    // -------------------------------------------------------
    async function gerarQuestoesIA(banca, qtd, tema, dificuldade) {
      const extra = getIaPromptFragment();

      const prompt = `
Gere ${qtd} questões originais da banca ${banca} sobre "${tema || "tema geral do edital"}".
Nível solicitado: ${dificuldade}.

Estrutura obrigatória:
{
  "enunciado": "...",
  "alternativas": ["A...", "B...", "C...", "D..."],
  "corretaIndex": 0-3,
  "nivel": "facil|medio|dificil"
}

Regras:
- Não use markdown.
- Sem alternativas duplicadas.
- Enunciado autossuficiente.
- Pode usar <u> e <mark>.
${extra}

Retorne somente JSON.
`;

      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "Você é Liora, criadora de simulados premium.",
          user: prompt,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!json || !json.output) return [];

      try {
        let raw = json.output;
        const block =
          raw.match(/```json([\s\S]*?)```/i) ||
          raw.match(/```([\s\S]*?)```/i);
        if (block) raw = block[1];

        const first = raw.search(/[\[\{]/);
        const last = Math.max(raw.lastIndexOf("]"), raw.lastIndexOf("}"));
        raw = raw.slice(first, last + 1);

        return JSON.parse(raw);
      } catch {
        try {
          return JSON.parse(json.output);
        } catch {
          return [];
        }
      }
    }


    // -------------------------------------------------------
    // LIMPEZA DE QUESTÕES
    // -------------------------------------------------------
    function limparQuestoes(lista) {
      return (lista || [])
        .filter((q) => q && q.enunciado && Array.isArray(q.alternativas))
        .map((q, idx) => {
          const seen = new Set();
          const alt = [];

          q.alternativas.forEach((a) => {
            const o = String(a).trim();
            const n = o.toLowerCase().replace(/[.,;:!?]/g, "").replace(/\s+/g, " ");
            if (!seen.has(n)) {
              seen.add(n);
              alt.push(o);
            }
          });

          while (alt.length < 4) alt.push("Alternativa extra");

          let ci = Number(q.corretaIndex);
          if (Number.isNaN(ci) || ci < 0 || ci >= alt.length) ci = 0;

          const enun = String(q.enunciado || "").replace(/[_*~`]/g, "");

          return {
            enunciado: enun,
            alternativas: alt,
            corretaIndex: ci,
            nivel: q.nivel || "medio",
            indice: idx + 1,
            resp: null
          };
        });
    }


    // -------------------------------------------------------
    // MODAL (abrir/fechar)
    // -------------------------------------------------------
    function abrirModal() {
      els.modal.classList.add("visible");

      // Pré-preenchimento inteligente
      if (window.lioraPreFillSimulado) window.lioraPreFillSimulado();

      // Aviso quando não houver estudos
      if (els.avisoEstudos) {
        if (!window.lioraEstudos || window.lioraEstudos.lista().length === 0) {
          els.avisoEstudos.style.display = "block";
          els.avisoEstudos.textContent =
            "💡 Dica: Gere um plano de estudos (Tema ou PDF) para que a Liora sugira simulados ideais.";
        } else {
          els.avisoEstudos.style.display = "none";
        }
      }
    }

    function fecharModal() {
      els.modal.classList.remove("visible");
    }

    els.fabSim.onclick = abrirModal;
    els.modalClose.onclick = fecharModal;
    els.modal.onclick = (e) => {
      if (e.target === els.modal) fecharModal();
    };


    // -------------------------------------------------------
    // LOADING IA + overlay global
    // -------------------------------------------------------
    function setIaLoading(active) {
      STATE.loadingIA = active;

      if (active) {
        if (window.lioraLoading) {
          const msg = `Gerando questões${
            STATE.tema ? ` para "${STATE.tema}"` : ""
          }...`;
          window.lioraLoading.show(msg);
        }

        if (els.questaoContainer) {
          els.questaoContainer.innerHTML = `
            <div class="sim-questao-card">
              <p class="text-sm text-[var(--muted)] mb-2">
                Gerando questões com IA${STATE.tema ? ` para <b>${STATE.tema}</b>` : ""}...
              </p>
              <div class="sim-progress w-full mb-1">
                <div id="sim-ia-loading-bar" class="sim-progress-fill" style="width: 8%;"></div>
              </div>
            </div>
          `;
        }

        let pct = 8;
        STATE.loadingIntervalID = setInterval(() => {
          pct += Math.random() * 5;
          if (pct > 92) pct = 92;
          const bar = document.getElementById("sim-ia-loading-bar");
          if (bar) bar.style.width = pct + "%";
        }, 400);

        els.nav.classList.add("hidden");
        els.resultado?.classList.add("hidden");
      } else {
        clearInterval(STATE.loadingIntervalID);
        STATE.loadingIntervalID = null;

        if (window.lioraLoading) window.lioraLoading.hide();
      }
    }


    // -------------------------------------------------------
    // TIMER
    // -------------------------------------------------------
    const fmt = (s) =>
      `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    function startTimer() {
      STATE.tempoRestante = STATE.tempoMin * 60;
      els.timer.textContent = fmt(STATE.tempoRestante);
      els.timer.classList.remove("hidden");

      STATE.timerID = setInterval(() => {
        STATE.tempoRestante--;
        els.timer.textContent = fmt(Math.max(STATE.tempoRestante, 0));
        if (STATE.tempoRestante <= 0) {
          clearInterval(STATE.timerID);
          finalizarSimulado(true);
        }
      }, 1000);
    }

    function stopTimer() {
      clearInterval(STATE.timerID);
      STATE.timerID = null;
    }


    // -------------------------------------------------------
    // RENDER QUESTÃO
    // -------------------------------------------------------
    function renderQuestao() {
      const total = STATE.questoes.length;
      if (!total) return;

      const q = STATE.questoes[STATE.atual];

      els.questaoContainer.innerHTML = "";
      els.progressBar.style.width =
        ((STATE.atual + 1) / total) * 100 + "%";

      const header = document.createElement("div");
      header.className =
        "flex justify-between items-center text-xs text-[var(--muted)] mb-2";
      header.innerHTML = `
        <span>Questão ${STATE.atual + 1} / ${total}</span>
        ${renderIaBadges()}
      `;
      els.questaoContainer.appendChild(header);

      const card = document.createElement("div");
      card.className = "sim-questao-card";

      const p = document.createElement("p");
      p.className = "sim-enunciado mb-2 whitespace-pre-line";
      p.innerHTML = q.enunciado;
      card.appendChild(p);

      q.alternativas.forEach((alt, i) => {
        const div = document.createElement("div");
        div.className = "sim-alt";
        if (q.resp === i) div.classList.add("selected");

        div.innerHTML = `
          <div class="sim-radio"></div>
          <div class="sim-alt-text">${alt}</div>
        `;
        div.onclick = () => {
          q.resp = i;
          renderQuestao();
        };
        card.appendChild(div);
      });

      els.questaoContainer.appendChild(card);

      els.nav.classList.remove("hidden");
      els.btnProxima.textContent =
        STATE.atual === total - 1 ? "Finalizar ▶" : "Próxima ▶";
      els.btnVoltar.disabled = STATE.atual === 0;
    }


    // -------------------------------------------------------
    // FINALIZAR SIMULADO
    // -------------------------------------------------------
    function finalizarSimulado(porTempo = false) {
      stopTimer();

      const total = STATE.questoes.length;
      const acertos = STATE.questoes.filter(
        (q) => q.resp === q.corretaIndex
      ).length;

      const perc = Math.round((acertos / total) * 100);

      const tempoUsado =
        STATE.tempoMin * 60 - STATE.tempoRestante;

      els.questaoContainer.innerHTML = "";
      els.nav.classList.add("hidden");

      els.resultado.innerHTML = `
        <div class="sim-resultado-card">
          <div class="flex justify-between items-start gap-3">
            <div>
              <div class="sim-resultado-titulo">Resultado do simulado</div>
              <p class="text-xs text-[var(--muted)] mb-1">
                ${STATE.banca} · ${STATE.tema || "Tema não informado"}
              </p>
              <div>${renderIaBadges()}</div>
            </div>
            <div class="text-right">
              <div class="sim-score">${perc}%</div>
              <p class="text-[0.7rem] text-[var(--muted)]">
                ${acertos} / ${total} questões
              </p>
            </div>
          </div>

          <p class="sim-feedback">
            Tempo: ${fmt(tempoUsado)}${porTempo ? " · Encerrado por tempo." : ""}
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" id="sim-refazer" class="btn-secondary">Fazer outro simulado</button>
            <button type="button" id="sim-dashboard" class="btn-primary">Ver meu desempenho</button>
          </div>
        </div>
      `;
      els.resultado.classList.remove("hidden");

      salvarNoHistorico({
        dataISO: new Date().toISOString(),
        banca: STATE.banca,
        tema: STATE.tema,
        qtd: total,
        acertos,
        perc,
        tempoSeg: tempoUsado,
        ia: Array.from(iaState.selecionadas)
      });

      document.getElementById("sim-refazer").onclick = () =>
        window.location.reload();
      document.getElementById("sim-dashboard").onclick = () =>
        window.homeDashboard ? window.homeDashboard() : window.location.reload();
    }


    // -------------------------------------------------------
    // NAVEGAÇÃO
    // -------------------------------------------------------
    els.btnVoltar.onclick = () => {
      if (STATE.atual > 0) {
        STATE.atual--;
        renderQuestao();
      }
    };

    els.btnProxima.onclick = () => {
      if (STATE.atual < STATE.questoes.length - 1) {
        STATE.atual++;
        renderQuestao();
      } else {
        finalizarSimulado(false);
      }
    };


    // -------------------------------------------------------
    // AUTO-PREENCHIMENTO VIA MEMÓRIA (exposto global)
    // -------------------------------------------------------
    window.lioraPreFillSimulado = function () {
      if (!window.lioraEstudos) return;

      const rec = window.lioraEstudos.recomendarSimulado();
      if (!rec) return;

      if (els.inpTema) els.inpTema.value = rec.tema;
      if (els.selQtd) els.selQtd.value = rec.qtd;
      if (els.selDif) els.selDif.value = rec.dificuldade;
      if (els.selBanca) els.selBanca.value = rec.banca;
    };


    // -------------------------------------------------------
    // BTN INICIAR
    // -------------------------------------------------------
    els.btnIniciar.onclick = async () => {
      STATE.banca = els.selBanca.value || "FGV";
      STATE.qtd = Number(els.selQtd.value || "10");
      STATE.tempoMin = Number(els.selTempo.value || "30");
      STATE.dificuldade = els.selDif.value || "misturado";
      STATE.tema = els.inpTema.value.trim();

      fecharModal();
      setIaLoading(true);

      try {
        let raw = await gerarQuestoesIA(
          STATE.banca,
          STATE.qtd,
          STATE.tema,
          STATE.dificuldade
        );

        const limpas = limparQuestoes(raw);
        if (!limpas.length) {
          els.questaoContainer.innerHTML =
            `<p class="text-sm text-[var(--muted)]">A IA não conseguiu gerar questões agora. Tente novamente.</p>`;
          setIaLoading(false);
          window.lioraError?.show("Não foi possível gerar questões. Tente novamente em instantes.");
          return;
        }

        STATE.questoes = limpas;
        STATE.atual = 0;

        setIaLoading(false);
        renderQuestao();
        startTimer();
      } catch (e) {
        console.error("❌ Erro ao gerar questões IA", e);
        setIaLoading(false);
        window.lioraError?.show("Erro ao gerar simulado com IA. Tente novamente.");
      }
    };

    console.log("🟢 Liora Simulados v97 inicializado.");
  });
})();
