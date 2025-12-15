// =============================================================
// 🧠 LIORA — SIMULADOS v102-ANTI-BOTAO-MORTO (DEBUG)
// =============================================================
(function () {
  console.log("🟣 Liora Simulados v102 carregado");

  const DBG = true;
  const dlog = (...a) => DBG && console.log("🐞[SimuladosDBG]", ...a);

  function qs(id) { return document.getElementById(id); }

  function getSimuladoAccess() {
    const user = window.lioraAuth?.user || null;
    const plan = window.lioraUserPlan || "free";
    if (!user) return { ok: false, reason: "login" };
    if (plan === "premium") return { ok: true, mode: "premium" };

    const used = localStorage.getItem("liora:free-simulado-usado");
    if (used) return { ok: false, reason: "upgrade" };
    return { ok: true, mode: "free", maxQuestoes: 3 };
  }

  const STATE = {
    questoes: [],
    atual: 0,
    tempoRestante: 0,
    timerID: null,
    config: {}
  };

  function abrirModal(els) {
    if (!els.modal) return;
    els.modal.classList.remove("hidden");
    els.modal.classList.add("visible");
    dlog("Modal aberto.");
  }

  function fecharModal(els) {
    if (!els.modal) return;
    els.modal.classList.remove("visible");
    els.modal.classList.add("hidden");
    dlog("Modal fechado.");
  }

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
    if (start === -1 || end === -1) throw new Error("IA não retornou JSON válido");

    return JSON.parse(raw.slice(start, end + 1));
  }

  function limparQuestoes(lista) {
    return (lista || [])
      .filter(q => q && q.enunciado && Array.isArray(q.alternativas))
      .map((q, idx) => ({
        indice: idx + 1,
        enunciado: String(q.enunciado),
        alternativas: (q.alternativas || []).slice(0, 4).map(a => String(a)),
        corretaIndex: Number.isInteger(q.corretaIndex) ? q.corretaIndex : 0,
        resp: null
      }));
  }

  function renderQuestao(els) {
    const q = STATE.questoes[STATE.atual];
    if (!q || !els.container) return;

    els.resultado?.classList.add("hidden");
    els.nav?.classList.remove("hidden");

    if (els.progress) {
      els.progress.style.width = ((STATE.atual + 1) / STATE.questoes.length) * 100 + "%";
    }

    els.container.innerHTML = `
      <div class="sim-questao-card">
        <p>${q.enunciado}</p>
        ${q.alternativas.map((a, i) => `
          <button type="button" class="sim-alt ${q.resp===i ? "selected" : ""}" data-i="${i}">
            ${a}
          </button>
        `).join("")}
      </div>
    `;

    els.container.querySelectorAll(".sim-alt").forEach(btn => {
      btn.addEventListener("click", () => {
        q.resp = Number(btn.dataset.i);
        renderQuestao(els);
      });
    });

    if (els.btnProx) {
      els.btnProx.textContent =
        STATE.atual === STATE.questoes.length - 1 ? "Finalizar ▶" : "Próxima ▶";
    }
    if (els.btnVoltar) els.btnVoltar.disabled = STATE.atual === 0;
  }

  function startTimer(els) {
    clearInterval(STATE.timerID);
    STATE.tempoRestante = (STATE.config.tempo || 30) * 60;

    if (els.timer) els.timer.classList.remove("hidden");

    STATE.timerID = setInterval(() => {
      STATE.tempoRestante--;
      if (STATE.tempoRestante <= 0) finalizar(els);
    }, 1000);
  }

  function finalizar(els) {
    clearInterval(STATE.timerID);
    STATE.timerID = null;

    els.container && (els.container.innerHTML = "");
    els.nav?.classList.add("hidden");

    const plan = window.lioraUserPlan || "free";
    els.resultado && (els.resultado.innerHTML = `
      <div class="sim-resultado-card">
        <h3>Simulado concluído</h3>
        <p>${STATE.questoes.length} questões respondidas</p>
        ${
          plan !== "premium"
            ? `<p class="text-brand">Você desbloqueia simulados ilimitados, análise de erros e questões por banca com o Liora+.</p>`
            : `<p class="text-brand">✅ Liora+ ativo. Quer repetir com outro tema?</p>`
        }
      </div>
    `);
    els.resultado?.classList.remove("hidden");
  }

  // -------------------------------------------------
  // INIT + BIND BLINDADO
  // -------------------------------------------------
  function init() {
    const els = {
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

    dlog("Els:", {
      fab: !!els.fab, modal: !!els.modal, iniciar: !!els.iniciar,
      close: !!els.close, container: !!els.container
    });

    if (!els.fab || !els.modal || !els.iniciar) {
      console.error("❌ Simulados v102: IDs não encontrados. Verifique HTML:", {
        "sim-fab": !!els.fab,
        "sim-modal-backdrop": !!els.modal,
        "sim-modal-iniciar": !!els.iniciar
      });
      return;
    }

    // FAB
    els.fab.addEventListener("click", (e) => {
      dlog("Clique no FAB recebido.");
      const access = getSimuladoAccess();
      if (!access.ok) {
        if (access.reason === "login") window.dispatchEvent(new Event("liora:login-required"));
        if (access.reason === "upgrade") window.dispatchEvent(new Event("liora:premium-bloqueado"));
        return;
      }
      abrirModal(els);

      if (access.mode === "free") {
        if (els.qtd) { els.qtd.value = 3; els.qtd.disabled = true; }
      } else {
        if (els.qtd) els.qtd.disabled = false;
      }
    }, true);

    // Close
    els.close && els.close.addEventListener("click", () => fecharModal(els), true);
    els.modal.addEventListener("click", (ev) => {
      if (ev.target === els.modal) fecharModal(els);
    }, true);

    // Iniciar (captura + prevenção de submit)
    els.iniciar.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      dlog("✅ Clique no INICIAR chegou!");

      const access = getSimuladoAccess();
      if (!access.ok) {
        dlog("Acesso negado:", access.reason);
        if (access.reason === "login") window.dispatchEvent(new Event("liora:login-required"));
        if (access.reason === "upgrade") window.dispatchEvent(new Event("liora:premium-bloqueado"));
        return;
      }

      STATE.config = {
        banca: els.banca?.value || "FGV",
        qtd: access.mode === "free" ? 3 : Number(els.qtd?.value || 10),
        dificuldade: els.dif?.value || "misturado",
        tema: (els.tema?.value || "").trim(),
        tempo: Number(els.tempo?.value || 30)
      };

      fecharModal(els);
      window.lioraLoading?.show("Gerando simulado...");

      try {
        const raw = await gerarQuestoes(STATE.config);
        const limpas = limparQuestoes(raw);
        if (!limpas.length) throw new Error("Lista vazia");

        STATE.questoes = limpas;
        STATE.atual = 0;

        if (access.mode === "free") localStorage.setItem("liora:free-simulado-usado", "1");

        window.lioraLoading?.hide();
        renderQuestao(els);
        startTimer(els);
      } catch (err) {
        console.error("❌ ERRO AO GERAR SIMULADO:", err);
        window.lioraLoading?.hide();
        window.lioraError?.show("Erro ao gerar simulado.");
      }
    }, true);

    // Navegação
    els.btnVoltar && els.btnVoltar.addEventListener("click", () => {
      if (STATE.atual > 0) {
        STATE.atual--;
        renderQuestao(els);
      }
    });

    els.btnProx && els.btnProx.addEventListener("click", () => {
      if (STATE.atual < STATE.questoes.length - 1) {
        STATE.atual++;
        renderQuestao(els);
      } else {
        finalizar(els);
      }
    });

    dlog("🟢 Simulados v102 pronto.");
  }

  // Init agora e também depois (caso scripts carreguem fora de ordem)
  document.addEventListener("DOMContentLoaded", init);
  setTimeout(init, 400);
  setTimeout(init, 1200);

})();
