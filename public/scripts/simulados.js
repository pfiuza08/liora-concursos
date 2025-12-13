// ==============================================================
// 🧠 LIORA — SIMULADOS v99-PREMIUM-COMMERCIAL
// - FIX CRÍTICO: Modal remove 'hidden' e adiciona 'visible' ao abrir
// - IA /api/liora para gerar questões reais
// - Seletor de IAs auxiliares (modo C3)
// - Badges de IA
// - Timer, navegação, resultado, histórico
// - Perfil de banca + dificuldade + modo tema opcional
// - Integrado com Study Manager v2 (recomendarSimulado + listarRecentes)
// - Compatível com nav-home v90 (homeDashboard + FAB Simulado)
// ==============================================================

(function () {
  console.log("🔵 Liora Simulados v99-PREMIUM-COMMERCIAL carregado...");

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
    // IA CONFIG — Modo C3
    // -------------------------------------------------------
    const IA_CONFIG = {
      banca: {
        id: "banca",
        label: "IA Banca",
        emoji: "🏛️",
        badgeClass: "sim-ia-badge--banca",
        prompt:
          "refine vocabulário, estilo e pegadinhas para refletir fielmente o padrão da banca."
      },
      explica: {
        id: "explica",
        label: "IA Explica",
        emoji: "💡",
        badgeClass: "sim-ia-badge--explica",
        prompt:
          "garanta gabarito robusto, consistente e explicações objetivas quando solicitado."
      },
      reforco: {
        id: "reforco",
        label: "IA Reforço",
        emoji: "📈",
        badgeClass: "sim-ia-badge--reforco",
        prompt:
          "aumente levemente a complexidade em tópicos chave, evitando trivialidades."
      }
    };

    const iaState = {
      selecionadas: new Set(["banca", "explica"])
    };

    function verificarAcessoSimulado() {
      const plan = window.lioraUserPlan || "free";
    
      if (plan === "premium") return { ok: true };
    
      const jaUsou = localStorage.getItem("liora:free-simulado-usado");
      if (jaUsou) {
        window.dispatchEvent(new Event("liora:premium-bloqueado"));
        return { ok: false };
      }
    
      return { ok: true, free: true };
    }
  
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
      loadingIntervalID: null
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
        console.warn("⚠️ Erro ao salvar histórico", e);
      }
    }
    // -------------------------------------------------------
    // 🔐 GATE PREMIUM
    // -------------------------------------------------------
    function exigirPremium() {
      if (window.lioraUserPlan !== "premium") {
        console.warn("🔒 Simulados bloqueado — plano:", window.lioraUserPlan);
        window.dispatchEvent(new Event("liora:premium-bloqueado"));
        return false;
      }
      return true;
    }
   
    // -------------------------------------------------------
    // IA SELECTOR
    // -------------------------------------------------------
    function setupIaSelector() {
      const modalBody = document.querySelector("#sim-modal-backdrop .sim-modal-body");
      if (!modalBody) return;
      if (modalBody.querySelector(".sim-ia-row")) return;

      const row = document.createElement("div");
      row.className = "sim-ia-row";

      const label = document.createElement("div");
      label.className = "sim-ia-label";
      label.textContent = "IAs auxiliares (C3)";

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
    // IA Badges
    // -------------------------------------------------------
    function renderIaBadges() {
      const selected = Array.from(iaState.selecionadas);
      if (!selected.length) return "";
      return `
        <span class="sim-ia-badges">
          ${selected
            .map((id) => {
              const cfg = IA_CONFIG[id];
              return `<span class="sim-ia-badge ${cfg.badgeClass}">${cfg.emoji} ${cfg.label}</span>`;
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
        "\nModos auxiliares ativados:\n" +
        selected
          .map((id) => IA_CONFIG[id])
          .filter(Boolean)
          .map((cfg) => `- ${cfg.label}: ${cfg.prompt}`)
          .join("\n")
      );
    }

    // -------------------------------------------------------
    // IA — chamada ao backend
    // -------------------------------------------------------
    async function gerarQuestoesIA(banca, qtd, tema, dificuldade) {
      const extra = getIaPromptFragment();

      const prompt = `
Gere ${qtd} questões inéditas da banca ${banca} sobre "${tema || "tema geral"}".
Dificuldade: ${dificuldade}.
Estrutura obrigatória:
[
  {
    "enunciado": "...",
    "alternativas": ["A...", "B...", "C...", "D..."],
    "corretaIndex": 0-3
  }
]
Regras:
- Sem markdown.
- Sem repetições.
${extra}
Retorne somente JSON válido.
`;

      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "Você é Liora, criadora de simulados premium.",
          user: prompt
        })
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
            const str = String(a).trim();
            const norm = str.toLowerCase().replace(/[.,;!?]/g, "").trim();
            if (!seen.has(norm)) {
              seen.add(norm);
              alt.push(str);
            }
          });

          while (alt.length < 4) alt.push("Alternativa extra");

          return {
            enunciado: q.enunciado.replace(/[_*~`]/g, ""),
            alternativas: alt,
            corretaIndex: Number(q.corretaIndex) || 0,
            indice: idx + 1,
            resp: null
          };
        });
    }

    // -------------------------------------------------------
    // MODAL — FIX v99
    // -------------------------------------------------------
    function abrirModal() {
      if (!els.modal) return;

      console.log("⚙ Abrindo modal de simulado... (v99)");

      // FIX: tirar hidden
      els.modal.classList.remove("hidden");

      // FIX: adicionar visible
      els.modal.classList.add("visible");

      // Prefill pelo Study Manager
      try {
        if (window.lioraPreFillSimulado) window.lioraPreFillSimulado();
      } catch (e) {
        console.warn("⚠️ Erro prefill:", e);
      }

      // Aviso
      try {
        const sm = window.lioraEstudos;
        const lista = sm?.listarRecentes?.(3) || [];
        els.avisoEstudos.style.display = lista.length ? "none" : "block";
      } catch {
        els.avisoEstudos.style.display = "block";
      }
    }

    function fecharModal() {
      if (!els.modal) return;
      els.modal.classList.remove("visible");
      els.modal.classList.add("hidden");
    }

    // Ligações
    els.fabSim.onclick = () => {
      const acesso = verificarAcessoSimulado();
      if (!acesso.ok) return;
    
      abrirModal();
    
      if (acesso.free) {
        console.warn("⚠️ Modo FREE: simulado limitado a 3 questões (uso único)");
      }
    };

      if (!exigirPremium()) return;
      abrirModal();
    };
   
    els.modalClose.onclick = fecharModal;
    els.modal.onclick = (e) => {
      if (e.target === els.modal) fecharModal();
    };

    // -------------------------------------------------------
    // LOADING IA
    // -------------------------------------------------------
    function setIaLoading(active) {
      STATE.loadingIA = active;

      if (active) {
        if (window.lioraLoading) {
          window.lioraLoading.show("Gerando questões...");
        }

        els.questaoContainer.innerHTML = `
          <div class="sim-questao-card">
            <p class="text-sm text-[var(--muted)]">Gerando questões com IA...</p>
            <div class="sim-progress w-full">
              <div id="sim-ia-loading-bar" class="sim-progress-fill" style="width:10%"></div>
            </div>
          </div>
        `;

        let pct = 10;
        STATE.loadingIntervalID = setInterval(() => {
          pct += Math.random() * 4;
          if (pct > 92) pct = 92;

          const bar = document.getElementById("sim-ia-loading-bar");
          if (bar) bar.style.width = pct + "%";
        }, 350);

        els.nav.classList.add("hidden");
        els.resultado.classList.add("hidden");
      } else {
        clearInterval(STATE.loadingIntervalID);
        STATE.loadingIntervalID = null;
        window.lioraLoading?.hide();
      }
    }

    // -------------------------------------------------------
    // TIMER
    // -------------------------------------------------------
    const fmt = (s) =>
      `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
        2,
        "0"
      )}`;

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

      els.progressBar.style.width = ((STATE.atual + 1) / total) * 100 + "%";

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

      const perc = total ? Math.round((acertos / total) * 100) : 0;
      const tempoUsado = STATE.tempoMin * 60 - STATE.tempoRestante;

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
            <button type="button" id="sim-refazer" class="btn-secondary">
              Fazer outro simulado
            </button>
            <button type="button" id="sim-dashboard" class="btn-primary">
              Ver meu desempenho
            </button>
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

      document.getElementById("sim-refazer").onclick = () => {
        STATE.questoes = [];
        STATE.atual = 0;
        els.resultado.classList.add("hidden");
        abrirModal();
      };

      document.getElementById("sim-dashboard").onclick = () => {
        if (window.homeDashboard) window.homeDashboard();
        else document.getElementById("area-dashboard")?.scrollIntoView();
      };
    }

    // -------------------------------------------------------
    // NAVEGAÇÃO ENTRE QUESTÕES
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
    // AUTO-PREENCHIMENTO VIA MEMÓRIA DE ESTUDOS
    // -------------------------------------------------------
    window.lioraPreFillSimulado = function () {
      const sm = window.lioraEstudos;
      if (!sm || !sm.recomendarSimulado) return;

      try {
        const rec = sm.recomendarSimulado();
        if (!rec) return;

        console.log("🎯 recomendação de simulado:", rec);

        els.inpTema.value = rec.tema;
        els.selQtd.value = rec.qtd;
        els.selDif.value = rec.dificuldade;
        els.selBanca.value = rec.banca;
      } catch (e) {
        console.warn("⚠️ Erro ao recomendar simulado:", e);
      }
    };

    // -------------------------------------------------------
    // BOTÃO INICIAR SIMULADO
    // -------------------------------------------------------
    els.btnIniciar.onclick = async () => {
    const acesso = verificarAcessoSimulado();
    if (!acesso.ok) return;
    
    // Se for free, força limite
    if (acesso.free) {
      STATE.qtd = 3;
      localStorage.setItem(FREE_SIM_KEY, "true");
    }
      
      if (!exigirPremium()) return;
    
      STATE.banca = els.selBanca.value || "FGV";
      STATE.qtd = Number(els.selQtd.value || "10");
      STATE.tempoMin = Number(els.selTempo.value || "30");
      STATE.dificuldade = els.selDif.value || "misturado";
      STATE.tema = els.inpTema.value.trim();
    
      fecharModal();
      setIaLoading(true);
    
      try {
        const raw = await gerarQuestoesIA(
          STATE.banca,
          STATE.qtd,
          STATE.tema,
          STATE.dificuldade
        );
    
        const limpas = limparQuestoes(raw);
        if (!limpas.length) {
          setIaLoading(false);
          window.lioraError?.show(
            "A IA não conseguiu gerar questões agora. Tente novamente."
          );
          return;
        }
    
        STATE.questoes = limpas;
        STATE.atual = 0;
    
        setIaLoading(false);
        renderQuestao();
        startTimer();
      } catch (e) {
        console.error("❌ Erro ao gerar questões IA:", e);
        setIaLoading(false);
        window.lioraError?.show(
          "Erro ao gerar simulado. Verifique a conexão."
        );
      }
    };


    console.log("🟢 Liora Simulados v99-PREMIUM-COMMERCIAL inicializado.");
  });
})();
