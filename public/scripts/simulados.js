// ==============================================================
// 🧠 LIORA — SIMULADOS v100 (LOGIN + FREE TRIAL + PREMIUM)
// ==============================================================

(function () {
  console.log("🔵 Liora Simulados v100 carregado...");

  const FREE_SIM_KEY = "liora:free-simulado-usado";

  document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------------------------------
    // ELEMENTOS
    // -------------------------------------------------------
    const els = {
      fabSim: document.getElementById("sim-fab"),
      modal: document.getElementById("sim-modal-backdrop"),
      modalClose: document.getElementById("sim-modal-close-btn"),
      btnIniciar: document.getElementById("sim-modal-iniciar"),

      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),
      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),

      selBanca: document.getElementById("sim-modal-banca"),
      selQtd: document.getElementById("sim-modal-qtd"),
      selTempo: document.getElementById("sim-modal-tempo"),
      selDif: document.getElementById("sim-modal-dificuldade"),
      inpTema: document.getElementById("sim-modal-tema"),
    };

    if (!els.fabSim || !els.modal) return;

    // -------------------------------------------------------
    // 🔐 CONTROLE DE ACESSO
    // -------------------------------------------------------
    function checkAccess() {
      if (!window.lioraAuth?.user) {
        window.dispatchEvent(new Event("liora:login-required"));
        return { ok: false };
      }

      const plan = window.lioraUserPlan || "free";

      if (plan === "premium") {
        return { ok: true, premium: true };
      }

      const used = localStorage.getItem(FREE_SIM_KEY);
      if (used) {
        window.dispatchEvent(new Event("liora:premium-bloqueado"));
        return { ok: false };
      }

      return { ok: true, free: true };
    }

    // -------------------------------------------------------
    // MODAL
    // -------------------------------------------------------
    function abrirModal() {
      els.modal.classList.remove("hidden");
      els.modal.classList.add("visible");
    }

    function fecharModal() {
      els.modal.classList.remove("visible");
      els.modal.classList.add("hidden");
    }

    els.modalClose.onclick = fecharModal;
    els.modal.onclick = (e) => {
      if (e.target === els.modal) fecharModal();
    };

    // -------------------------------------------------------
    // FAB SIMULADO
    // -------------------------------------------------------
    els.fabSim.onclick = () => {
      const access = checkAccess();
      if (!access.ok) return;

      if (access.free) {
        els.selQtd.value = "3";
        els.selQtd.disabled = true;
      } else {
        els.selQtd.disabled = false;
      }

      abrirModal();
    };

    // -------------------------------------------------------
    // ESTADO
    // -------------------------------------------------------
    const STATE = {
      questoes: [],
      atual: 0,
      tempoMin: 30,
      tempoRestante: 0,
      timerID: null
    };

    // -------------------------------------------------------
    // IA
    // -------------------------------------------------------
    async function gerarQuestoesIA(banca, qtd, tema, dificuldade) {
      const prompt = `
Gere ${qtd} questões inéditas da banca ${banca}.
Tema: ${tema || "geral"}.
Dificuldade: ${dificuldade}.
Formato JSON puro.
      `;

      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: prompt })
      });

      const json = await res.json().catch(() => null);
      if (!json?.output) return [];

      try {
        return JSON.parse(json.output);
      } catch {
        return [];
      }
    }

    // -------------------------------------------------------
    // RENDER
    // -------------------------------------------------------
    function renderQuestao() {
      const q = STATE.questoes[STATE.atual];
      if (!q) return;

      els.questaoContainer.innerHTML = `
        <div class="sim-questao-card">
          <p>${q.enunciado}</p>
          ${q.alternativas.map((a, i) => `
            <div class="sim-alt" data-i="${i}">${a}</div>
          `).join("")}
        </div>
      `;

      els.nav.classList.remove("hidden");
      els.btnVoltar.disabled = STATE.atual === 0;
      els.btnProxima.textContent =
        STATE.atual === STATE.questoes.length - 1 ? "Finalizar ▶" : "Próxima ▶";

      document.querySelectorAll(".sim-alt").forEach(el => {
        el.onclick = () => {
          q.resp = Number(el.dataset.i);
          renderQuestao();
        };
      });
    }

    // -------------------------------------------------------
    // TIMER
    // -------------------------------------------------------
    function startTimer() {
      STATE.tempoRestante = STATE.tempoMin * 60;
      els.timer.classList.remove("hidden");

      STATE.timerID = setInterval(() => {
        STATE.tempoRestante--;
        if (STATE.tempoRestante <= 0) {
          clearInterval(STATE.timerID);
          finalizarSimulado();
        }
      }, 1000);
    }

    function finalizarSimulado() {
      clearInterval(STATE.timerID);
      els.nav.classList.add("hidden");

      els.resultado.innerHTML = `
        <div class="sim-resultado-card">
          <h3>Simulado concluído 🎯</h3>
          <p>Continue evoluindo com simulados ilimitados.</p>
          <button class="btn-primary" onclick="window.dispatchEvent(new Event('liora:premium-bloqueado'))">
            Tornar-se Premium
          </button>
        </div>
      `;
      els.resultado.classList.remove("hidden");
    }

    // -------------------------------------------------------
    // BOTÃO INICIAR
    // -------------------------------------------------------
    els.btnIniciar.onclick = async () => {
      const access = checkAccess();
      if (!access.ok) return;

      const qtd = access.free ? 3 : Number(els.selQtd.value || 10);

      fecharModal();

      const questoes = await gerarQuestoesIA(
        els.selBanca.value,
        qtd,
        els.inpTema.value,
        els.selDif.value
      );

      if (!questoes.length) {
        alert("Não foi possível gerar o simulado.");
        return;
      }

      if (access.free) {
        localStorage.setItem(FREE_SIM_KEY, "true");
      }

      STATE.questoes = questoes;
      STATE.atual = 0;

      renderQuestao();
      startTimer();
    };

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
        finalizarSimulado();
      }
    };

    console.log("🟢 Liora Simulados v100 pronto.");
  });
})();

