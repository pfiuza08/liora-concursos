// =============================================================
// 🧠 LIORA — SIMULADOS v100-FREEMIUM-CLEAN
// =============================================================

(function () {
  console.log("🟣 Liora Simulados v100 carregado");

  document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------------------------
    // ELEMENTOS
    // -------------------------------------------------
    const els = {
      fab: document.getElementById("sim-fab"),
      modal: document.getElementById("sim-modal-backdrop"),
      close: document.getElementById("sim-modal-close-btn"),
      iniciar: document.getElementById("sim-modal-iniciar"),

      banca: document.getElementById("sim-modal-banca"),
      qtd: document.getElementById("sim-modal-qtd"),
      tempo: document.getElementById("sim-modal-tempo"),
      dif: document.getElementById("sim-modal-dificuldade"),
      tema: document.getElementById("sim-modal-tema"),

      container: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnProx: document.getElementById("sim-btn-proxima"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      resultado: document.getElementById("sim-resultado"),
      timer: document.getElementById("sim-timer"),
      progress: document.getElementById("sim-progress-bar")
    };

    if (!els.fab) return;

    // -------------------------------------------------
    // REGRAS DE ACESSO
    // -------------------------------------------------
    function getSimuladoAccess() {
      const user = window.lioraAuth?.user || null;
      const plan = window.lioraUserPlan || "free";

      if (!user) return { ok: false, reason: "login" };
      if (plan === "premium") return { ok: true, mode: "premium" };

      const used = localStorage.getItem("liora:free-simulado-usado");
      if (used) return { ok: false, reason: "upgrade" };

      return { ok: true, mode: "free", maxQuestoes: 3 };
    }

    // -------------------------------------------------
    // ESTADO
    // -------------------------------------------------
    const STATE = {
      questoes: [],
      atual: 0,
      tempoRestante: 0,
      timerID: null,
      config: {}
    };

    // -------------------------------------------------
    // MODAL
    // -------------------------------------------------
    function abrirModal() {
      els.modal.classList.remove("hidden");
      els.modal.classList.add("visible");
    }

    function fecharModal() {
      els.modal.classList.remove("visible");
      els.modal.classList.add("hidden");
    }

    els.fab.onclick = () => {
      const access = getSimuladoAccess();

      if (!access.ok) {
        if (access.reason === "login") {
          window.dispatchEvent(new Event("liora:login-required"));
        }
        if (access.reason === "upgrade") {
          window.dispatchEvent(new Event("liora:premium-bloqueado"));
        }
        return;
      }

      abrirModal();

      if (access.mode === "free") {
        els.qtd.value = 3;
        els.qtd.disabled = true;
      } else {
        els.qtd.disabled = false;
      }
    };

    els.close.onclick = fecharModal;
    els.modal.onclick = e => e.target === els.modal && fecharModal();

    // -------------------------------------------------
    // IA
    // -------------------------------------------------
    async function gerarQuestoes(config) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "Você é Liora, criadora de simulados premium.",
          user: `
Gere ${config.qtd} questões da banca ${config.banca}
Tema: ${config.tema || "geral"}
Dificuldade: ${config.dificuldade}
Formato JSON puro.
          `
        })
      });

      const json = await res.json();
      return JSON.parse(json.output);
    }

    // -------------------------------------------------
    // INICIAR
    // -------------------------------------------------
    els.iniciar.onclick = async () => {
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
        STATE.questoes = raw;
        STATE.atual = 0;

        if (access.mode === "free") {
          localStorage.setItem("liora:free-simulado-usado", "1");
        }

        window.lioraLoading?.hide();
        renderQuestao();
        startTimer();

      } catch (e) {
        window.lioraLoading?.hide();
        window.lioraError?.show("Erro ao gerar simulado.");
      }
    };

    // -------------------------------------------------
    // RENDER
    // -------------------------------------------------
    function renderQuestao() {
      const q = STATE.questoes[STATE.atual];
      if (!q) return;

      els.container.innerHTML = `
        <div class="sim-questao-card">
          <p>${q.enunciado}</p>
          ${q.alternativas.map((a, i) => `
            <div class="sim-alt" onclick="this.classList.toggle('selected')">
              ${a}
            </div>
          `).join("")}
        </div>
      `;

      els.nav.classList.remove("hidden");
      els.btnProx.textContent =
        STATE.atual === STATE.questoes.length - 1
          ? "Finalizar ▶"
          : "Próxima ▶";
    }

    els.btnProx.onclick = () => {
      if (STATE.atual < STATE.questoes.length - 1) {
        STATE.atual++;
        renderQuestao();
      } else {
        finalizar();
      }
    };

    // -------------------------------------------------
    // TIMER
    // -------------------------------------------------
    function startTimer() {
      STATE.tempoRestante = STATE.config.tempo * 60;
      els.timer.classList.remove("hidden");

      STATE.timerID = setInterval(() => {
        STATE.tempoRestante--;
        if (STATE.tempoRestante <= 0) finalizar();
      }, 1000);
    }

    function finalizar() {
      clearInterval(STATE.timerID);
      els.container.innerHTML = "";
      els.nav.classList.add("hidden");

      els.resultado.innerHTML = `
        <div class="sim-resultado-card">
          <h3>Simulado concluído</h3>
          <p>${STATE.questoes.length} questões respondidas</p>
          ${
            window.lioraUserPlan !== "premium"
              ? `<p class="text-brand">Quer simulados ilimitados? Ative o Liora+</p>`
              : ""
          }
        </div>
      `;
      els.resultado.classList.remove("hidden");
    }

    console.log("🟢 Simulados v100 pronto");
  });
})();
