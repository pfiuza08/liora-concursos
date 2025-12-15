// =============================================================
// 🧠 LIORA — SIMULADOS v103-FREEMIUM-STABLE
// =============================================================
(function () {
  console.log("🟢 Liora Simulados v103 carregado");

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

    return JSON.parse(raw.slice(start, end + 1));
  }

  function limparQuestoes(lista) {
    return (lista || []).map((q, idx) => ({
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
    if (!q || !els.container) return;

    els.container.innerHTML = `
      <div class="sim-questao-card">
        <p>${q.enunciado}</p>
        ${q.alternativas.map(
          (a, i) =>
            `<button class="sim-alt ${q.resp === i ? "selected" : ""}" data-i="${i}">${a}</button>`
        ).join("")}
      </div>
    `;

    els.container.querySelectorAll(".sim-alt").forEach(btn => {
      btn.onclick = () => {
        q.resp = Number(btn.dataset.i);
        renderQuestao();
      };
    });

    els.nav?.classList.remove("hidden");
    els.btnProx.textContent =
      STATE.atual === STATE.questoes.length - 1 ? "Finalizar ▶" : "Próxima ▶";
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
            ? `<p class="text-brand">Desbloqueie simulados ilimitados, análise inteligente e questões por banca com o Liora+.</p>`
            : `<p class="text-brand">✅ Liora+ ativo. Continue evoluindo.</p>`
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
    if (
      e.target.closest("#sim-modal-close-btn") ||
      e.target === els.modal
    ) {
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

        STATE.questoes = limpas;
        STATE.atual = 0;

        if (access.mode === "free") {
          localStorage.setItem("liora:free-simulado-usado", "1");
        }

        window.lioraLoading?.hide();
        renderQuestao();
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
