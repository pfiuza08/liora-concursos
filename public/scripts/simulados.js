// =============================================================
// 🧠 LIORA — SIMULADOS v103.1-FREEMIUM-STABLE
// =============================================================
(function () {
  console.log("🟢 Liora Simulados v103.1 carregado");

  // -----------------------------
  // STATE GLOBAL
  // -----------------------------
  const STATE = {
    questoes: [],
    atual: 0,
    timerID: null,
    tempoRestante: 0,
    config: {}
  };

  // -----------------------------
  // HELPERS
  // -----------------------------
  const qs = (id) => document.getElementById(id);

  function getEls() {
    return {
      fab: qs("sim-fab"),
      modal: qs("sim-modal-backdrop"),
      close: qs("sim-modal-close-btn"),
      iniciar: qs("sim-modal-iniciar"),

      banca: qs("sim-modal-banca"),
      qtd: qs("sim-modal-qtd"),
      tempo: qs("sim-modal-tempo"),
      dif: qs("sim-modal-dificuldade"),
      tema: qs("sim-modal-tema"),

      container: qs("sim-questao-container"),
      nav: qs("sim-nav"),
      btnProx: qs("sim-btn-proxima"),
      btnVoltar: qs("sim-btn-voltar"),
      resultado: qs("sim-resultado"),
      timer: qs("sim-timer"),
      progress: qs("sim-progress-bar")
    };
  }

  // -----------------------------
  // ACESSO (LOGIN + PLANO)
  // -----------------------------
  function getSimuladoAccess() {
    const user = window.lioraAuth?.user || null;
    const plan = window.lioraUserPlan || "free";

    if (!user) return { ok: false, reason: "login" };
    if (plan === "premium") return { ok: true, mode: "premium" };

    const used = localStorage.getItem("liora:free-simulado-usado");
    if (used) return { ok: false, reason: "upgrade" };

    return { ok: true, mode: "free", maxQuestoes: 3 };
  }

  // -----------------------------
  // MODAL
  // -----------------------------
  function abrirModal() {
    const { modal } = getEls();
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("visible");
  }

  function fecharModal() {
    const { modal } = getEls();
    if (!modal) return;
    modal.classList.remove("visible");
    modal.classList.add("hidden");
  }

  // -----------------------------
  // IA
  // -----------------------------
  async function gerarQuestoes(config) {
    const res = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: "Você é Liora, criadora de simulados premium.",
        user: `
Gere ${config.qtd} questões da banca ${config.banca}.
Tema: ${config.tema || "geral"}.
Dificuldade: ${config.dificuldade}.

Retorne APENAS JSON válido no formato:
[
  {
    "enunciado": "...",
    "alternativas": ["A...", "B...", "C...", "D..."],
    "corretaIndex": 0
  }
]
`
      })
    });

    const json = await res.json();
    let raw = json.output;

    if (typeof raw === "string") {
      raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1) {
      throw new Error("IA não retornou JSON válido");
    }

    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (!Array.isArray(parsed) || !parsed.length) {
      throw new Error("Lista de questões vazia");
    }

    return parsed;
  }

  function limparQuestoes(lista) {
    return (lista || [])
      .filter(q => q && q.enunciado && Array.isArray(q.alternativas))
      .map((q, idx) => ({
        indice: idx + 1,
        enunciado: String(q.enunciado).trim(),
        alternativas: q.alternativas.slice(0, 4).map(a => String(a)),
        corretaIndex:
          Number.isInteger(q.corretaIndex) &&
          q.corretaIndex >= 0 &&
          q.corretaIndex < q.alternativas.length
            ? q.corretaIndex
            : 0,
        resp: null
      }));
  }

  // -----------------------------
  // TIMER
  // -----------------------------
  function startTimer() {
    const { timer } = getEls();
    clearInterval(STATE.timerID);

    STATE.tempoRestante = (STATE.config.tempo || 30) * 60;
    timer?.classList.remove("hidden");

    STATE.timerID = setInterval(() => {
      STATE.tempoRestante--;
      if (STATE.tempoRestante <= 0) finalizar();
    }, 1000);
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  function renderQuestao() {
    const els = getEls();
    const q = STATE.questoes[STATE.atual];
    if (!q || !els.container) return;

    els.resultado?.classList.add("hidden");
    els.nav?.classList.remove("hidden");

    if (els.progress) {
      els.progress.style.width =
        ((STATE.atual + 1) / STATE.questoes.length) * 100 + "%";
    }

    els.container.innerHTML = `
      <div class="sim-questao-card">
        <p>${q.enunciado}</p>
        ${q.alternativas.map(
          (a, i) =>
            `<button class="sim-alt ${q.resp === i ? "selected" : ""}" data-i="${i}">
              ${a}
            </button>`
        ).join("")}
      </div>
    `;

    els.container.querySelectorAll(".sim-alt").forEach(btn => {
      btn.onclick = () => {
        q.resp = Number(btn.dataset.i);
        renderQuestao();
      };
    });

    els.btnProx.textContent =
      STATE.atual === STATE.questoes.length - 1 ? "Finalizar ▶" : "Próxima ▶";
    els.btnVoltar.disabled = STATE.atual === 0;
  }

  function finalizar() {
    const els = getEls();
    clearInterval(STATE.timerID);

    els.container.innerHTML = "";
    els.nav.classList.add("hidden");

    const plan = window.lioraUserPlan || "free";

    els.resultado.innerHTML = `
      <div class="sim-resultado-card">
        <h3>Simulado concluído</h3>
        <p>${STATE.questoes.length} questões respondidas</p>
        ${
          plan !== "premium"
            ? `<p class="text-brand">
                Quer simulados ilimitados, análise inteligente e foco por banca?
                Ative o <strong>Liora+</strong>.
              </p>`
            : `<p class="text-brand">✅ Liora+ ativo. Continue avançando.</p>`
        }
      </div>
    `;
    els.resultado.classList.remove("hidden");
  }

  // =============================================================
  // 🔘 EVENT DELEGATION ÚNICA (ANTI-BOTÃO-MORTO)
  // =============================================================
  document.addEventListener("click", async (e) => {
    const els = getEls();

    // FAB
    if (e.target.closest("#sim-fab")) {
      const access = getSimuladoAccess();

      if (!access.ok) {
        if (access.reason === "login") window.dispatchEvent(new Event("liora:login-required"));
        if (access.reason === "upgrade") window.dispatchEvent(new Event("liora:premium-bloqueado"));
        return;
      }

      abrirModal();

      if (access.mode === "free" && els.qtd) {
        els.qtd.value = 3;
        els.qtd.disabled = true;
      } else if (els.qtd) {
        els.qtd.disabled = false;
      }
      return;
    }

    // FECHAR MODAL
    if (e.target.closest("#sim-modal-close-btn") || e.target === els.modal) {
      fecharModal();
      return;
    }

    // INICIAR
    if (e.target.closest("#sim-modal-iniciar")) {
      const access = getSimuladoAccess();
      if (!access.ok) return;

      STATE.config = {
        banca: els.banca.value,
        qtd: access.mode === "free" ? 3 : Number(els.qtd.value),
        dificuldade: els.dif.value,
        tema: els.tema.value,
        tempo: Number(els.tempo.value)
      };

      fecharModal();
      window.lioraLoading?.show("Gerando simulado...");

      try {
        const raw = await gerarQuestoes(STATE.config);
        const limpas = limparQuestoes(raw);

        if (!limpas.length) throw new Error("Questões inválidas");

        STATE.questoes = limpas;
        STATE.atual = 0;

        if (access.mode === "free") {
          localStorage.setItem("liora:free-simulado-usado", "1");
        }

        window.lioraLoading?.hide();
        renderQuestao();
        startTimer();
      } catch (err) {
        console.error(err);
        window.lioraLoading?.hide();
        window.lioraError?.show("Erro ao gerar simulado.");
      }
    }

    // NAVEGAÇÃO
    if (e.target.closest("#sim-btn-proxima")) {
      if (STATE.atual < STATE.questoes.length - 1) {
        STATE.atual++;
        renderQuestao();
      } else {
        finalizar();
      }
    }

    if (e.target.closest("#sim-btn-voltar")) {
      if (STATE.atual > 0) {
        STATE.atual--;
        renderQuestao();
      }
    }
  });

})();
