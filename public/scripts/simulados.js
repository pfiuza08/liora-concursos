// =============================================================
// 🧠 LIORA — SIMULADOS v108-CLEAN
// Modal-only • Sem controle de layout • Fluxo único
// =============================================================

console.log("🔖 simulados.v108-clean carregado");

(function () {

  // -------------------------------------------------
  // STATE
  // -------------------------------------------------
  const STATE = {
    questoes: [],
    atual: 0,
    config: null
  };

  // -------------------------------------------------
  // HELPERS
  // -------------------------------------------------
  const qs = (id) => document.getElementById(id);

  const log = {
    info: (...a) => console.log("🧠 [Simulados]", ...a),
    warn: (...a) => console.warn("🟡 [Simulados]", ...a),
    error: (...a) => console.error("🔴 [Simulados]", ...a)
  };

  function ensure(ids) {
    const missing = ids.filter(id => !qs(id));
    if (missing.length) {
      window.lioraError?.show?.(
        "Simulado não pode iniciar. Estrutura incompleta."
      );
      log.error("IDs ausentes:", missing);
      return false;
    }
    return true;
  }

  // -------------------------------------------------
  // MODAL
  // -------------------------------------------------
  function openModal() {
    const modal = qs("sim-modal-backdrop");
    if (!modal) return;

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");

    window.lioraModal?.open?.("sim-modal-backdrop");

    bindStartButton();
  }

  function closeModal() {
    const modal = qs("sim-modal-backdrop");
    if (!modal) return;

    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");

    window.lioraModal?.close?.("sim-modal-backdrop");
    document.activeElement?.blur();
  }

  // -------------------------------------------------
  // START BUTTON (LOCAL)
  // -------------------------------------------------
  function bindStartButton() {
    const btn = qs("sim-modal-iniciar");
    if (!btn) {
      log.error("Botão iniciar não encontrado");
      return;
    }

    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);

    clone.type = "button";

    clone.addEventListener("click", () => {
      log.info("▶ Start simulado (modal)");
      window.dispatchEvent(
        new CustomEvent("liora:start-simulado", {
          detail: { origem: "modal" }
        })
      );
    });
  }

  // -------------------------------------------------
  // ABRIR CONFIG
  // -------------------------------------------------
  function abrirConfig() {
    log.info("Abrindo configuração");
    if (
      !ensure([
        "sim-modal-backdrop",
        "sim-modal-banca",
        "sim-modal-qtd",
        "sim-modal-tempo",
        "sim-modal-dificuldade",
        "sim-modal-tema"
      ])
    ) return;

    openModal();
  }

  // -------------------------------------------------
  // START SIMULADO
  // -------------------------------------------------
  async function iniciarSimulado() {
    log.info("Iniciando simulado");

    if (
      !ensure([
        "area-simulado",
        "sim-questao-container",
        "sim-nav",
        "sim-btn-proxima",
        "sim-btn-voltar",
        "sim-resultado"
      ])
    ) return;

    const els = {
      banca: qs("sim-modal-banca"),
      qtd: qs("sim-modal-qtd"),
      tempo: qs("sim-modal-tempo"),
      dif: qs("sim-modal-dificuldade"),
      tema: qs("sim-modal-tema"),
      area: qs("area-simulado")
    };

    STATE.config = {
      banca: els.banca.value,
      qtd: Number(els.qtd.value),
      tempo: Number(els.tempo.value),
      dificuldade: els.dif.value,
      tema: els.tema.value || ""
    };

    closeModal();

    els.area.classList.remove("hidden");

    window.lioraLoading?.show?.("Gerando simulado...");

    try {
      const raw = await gerarQuestoes(STATE.config);
      STATE.questoes = prepararQuestoes(raw);
      STATE.atual = 0;

      window.lioraLoading?.hide?.();
      renderQuestao();
    } catch (e) {
      window.lioraLoading?.hide?.();
      window.lioraError?.show?.("Erro ao gerar simulado.");
      log.error(e);
    }
  }

  // -------------------------------------------------
  // IA
  // -------------------------------------------------
  async function gerarQuestoes(config) {
    const res = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: `Gere ${config.qtd} questões sobre ${config.tema || "conhecimento geral"}`
      })
    });

    const json = await res.json();
    return Array.isArray(json.output) ? json.output : [];
  }

  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------
  function prepararQuestoes(lista) {
    return lista.map((q, i) => ({
      indice: i + 1,
      enunciado: q.enunciado,
      alternativas: q.alternativas,
      corretaIndex: q.corretaIndex,
      resp: null
    }));
  }

  function renderQuestao() {
    const q = STATE.questoes[STATE.atual];
    if (!q) return;

    const container = qs("sim-questao-container");

    container.innerHTML = `
      <div class="sim-questao-card">
        <p><strong>Questão ${q.indice}</strong></p>
        <p>${q.enunciado}</p>
        ${q.alternativas
          .map((a, i) => `<button class="sim-alt" data-i="${i}">${a}</button>`)
          .join("")}
      </div>
    `;

    container.querySelectorAll(".sim-alt").forEach(btn => {
      btn.onclick = () => {
        q.resp = Number(btn.dataset.i);
        STATE.atual++;
        STATE.atual < STATE.questoes.length
          ? renderQuestao()
          : finalizar();
      };
    });
  }

  function finalizar() {
    qs("sim-questao-container").innerHTML = "<h3>Simulado finalizado</h3>";
  }

  // -------------------------------------------------
  // EVENTOS
  // -------------------------------------------------
  window.addEventListener("liora:open-sim-config", abrirConfig);
  window.addEventListener("liora:start-simulado", iniciarSimulado);

})();
