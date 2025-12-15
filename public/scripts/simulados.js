// =============================================================
// 🧠 LIORA — SIMULADOS v103.3-FINAL-STABLE
// =============================================================
(function () {
  console.log("🟢 Liora Simulados v103.3 carregado");

  // -----------------------------
  // STATE GLOBAL
  // -----------------------------
  const STATE = {
    questoes: [],
    atual: 0,
    timerID: null,
    tempoRestante: 0,
    config: {},
    modalOpen: false
  };

  // -----------------------------
  // HELPERS
  // -----------------------------
  const qs = (id) => document.getElementById(id);

  function getEls() {
    return {
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
  function abrirModal(access) {
    const els = getEls();
    if (!els.modal || STATE.modalOpen) return;

    STATE.modalOpen = true;

    els.modal.classList.remove("hidden");
    els.modal.classList.add("visible");

    // prepara campos conforme plano
    if (access.mode === "free" && els.qtd) {
      els.qtd.value = 3;
      els.qtd.disabled = true;
    } else if (els.qtd) {
      els.qtd.disabled = false;
    }
  }

  function fecharModal() {
    const els = getEls();
    if (!els.modal) return;

    els.modal.classList.remove("visible");
    els.modal.classList.add("hidden");

    STATE.modalOpen = false;
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
    if (start === -1 || end === -1) throw new Error("IA inválida");

    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (!Array.isArray(parsed) || !parsed.length) throw new Error("Lista vazia");

    return parsed;
  }

  function limparQuestoes(lista) {
    return lista.map((q, idx) => ({
      indice: idx + 1,
      enunciado: String(q.enunciado),
      alternativas: q.alternativas.slice(0, 4),
      corretaIndex: Number.isInteger(q.corretaIndex) ? q.corretaIndex : 0,
      resp: null
    }));
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  function renderQuestao() {
    const els = getEls();
    const q = STATE.questoes[STATE.atual];
    if (!q) return;

    els.resultado?.classList.add("hidden");
    els.nav?.classList.remove("hidden");

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

    els.resultado.innerHTML = `
      <div class="sim-resultado-card">
        <h3>Simulado concluído</h3>
        <p>${STATE.questoes.length} questões respondidas</p>
        ${
          window.lioraUserPlan !== "premium"
            ? `<p class="text-brand">Ative o <strong>Liora+</strong> para simulados ilimitados.</p>`
            : `<p class="text-brand">✅ Liora+ ativo</p>`
        }
      </div>
    `;
    els.resultado.classList.remove("hidden");
  }

  // =============================================================
  // 🔔 EVENTO GLOBAL CANÔNICO
  // =============================================================
  window.addEventListener("liora:abrir-simulado", () => {
    console.log("🟢 Evento liora:abrir-simulado recebido");

    const access = getSimuladoAccess();
    if (!access.ok) {
      if (access.reason === "login") window.dispatchEvent(new Event("liora:login-required"));
      if (access.reason === "upgrade") window.dispatchEvent(new Event("liora:premium-bloqueado"));
      return;
    }

    abrirModal(access);
  });

  // =============================================================
  // EVENTOS INTERNOS
  // =============================================================
  document.addEventListener("click", async (e) => {
    const els = getEls();

    if (e.target.closest("#sim-modal-close-btn") || e.target === els.modal) {
      fecharModal();
      return;
    }

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
        STATE.questoes = limparQuestoes(raw);
        STATE.atual = 0;

        if (access.mode === "free") {
          localStorage.setItem("liora:free-simulado-usado", "1");
        }

        window.lioraLoading?.hide();
        renderQuestao();
      } catch {
        window.lioraLoading?.hide();
        window.lioraError?.show("Erro ao gerar simulado.");
      }
    }

    if (e.target.closest("#sim-btn-proxima")) {
      STATE.atual < STATE.questoes.length - 1 ? (STATE.atual++, renderQuestao()) : finalizar();
    }

    if (e.target.closest("#sim-btn-voltar") && STATE.atual > 0) {
      STATE.atual--;
      renderQuestao();
    }
  });

})();
