// =============================================================
// 🧠 LIORA — SIMULADOS (PRODUCT MODE)
// Versão: v1.0-PRODUCT
//
// - Baseado em SCREEN ativa
// - Modal apenas para configuração
// - Um único fluxo de start
// - Zero dependência de nav-home
// =============================================================

console.log("🔖 Simulados — Product Mode carregado");

(function () {

  // -------------------------------------------------
  // ESTADO
  // -------------------------------------------------
  let screenActive = false;

  const STATE = {
    config: null,
    questoes: [],
    atual: 0
  };

  // -------------------------------------------------
  // HELPERS
  // -------------------------------------------------
  const qs = (id) => document.getElementById(id);

  const log = (...args) =>
    console.log("🧠 [Simulados]", ...args);

  function ensure(ids) {
    const missing = ids.filter(id => !qs(id));
    if (missing.length) {
      window.lioraError?.show?.(
        `Simulado não pode iniciar. Elementos ausentes: ${missing.join(", ")}`
      );
      return false;
    }
    return true;
  }

  // -------------------------------------------------
  // SCREEN LIFECYCLE
  // -------------------------------------------------
  window.addEventListener("screen:simulados:entered", () => {
    screenActive = true;
    log("Screen ativada");
  });

  // -------------------------------------------------
  // ABRIR CONFIGURAÇÃO
  // -------------------------------------------------
  window.addEventListener("simulados:config", () => {
    if (!screenActive) return;

    if (!ensure([
      "sim-modal-backdrop",
      "sim-modal-banca",
      "sim-modal-qtd",
      "sim-modal-tempo",
      "sim-modal-dificuldade",
      "sim-modal-tema"
    ])) return;

    window.lioraModal?.open?.("sim-modal-backdrop");
  });

  // -------------------------------------------------
  // START SIMULADO (ÚNICO)
  // -------------------------------------------------
  window.addEventListener("simulados:start", async () => {
    if (!screenActive) return;

    log("START recebido");

    if (!ensure([
      "screen-simulados",
      "simulados-runtime",
      "sim-questao-container",
      "sim-nav",
      "sim-btn-proxima",
      "sim-btn-voltar",
      "sim-resultado"
    ])) return;

    // coleta config do modal
    STATE.config = {
      banca: qs("sim-modal-banca")?.value || "geral",
      qtd: Number(qs("sim-modal-qtd")?.value || 5),
      dificuldade: qs("sim-modal-dificuldade")?.value || "misturado",
      tema: qs("sim-modal-tema")?.value || "",
      tempo: Number(qs("sim-modal-tempo")?.value || 0)
    };

    window.lioraModal?.close?.("sim-modal-backdrop");

    // ativa runtime
    qs("simulados-runtime")?.classList.remove("hidden");
    qs("sim-resultado")?.classList.add("hidden");

    window.lioraLoading?.show?.("Gerando simulado...");

    try {
      const raw = await gerarQuestoes(STATE.config);
      STATE.questoes = prepararQuestoes(raw);
      STATE.atual = 0;

      window.lioraLoading?.hide?.();
      renderQuestao();

      log("Simulado iniciado com sucesso");
    } catch (err) {
      window.lioraLoading?.hide?.();
      window.lioraError?.show?.("Erro ao gerar simulado.");
      console.error(err);
    }
  });

  // -------------------------------------------------
  // IA
  // -------------------------------------------------
  async function gerarQuestoes(config) {
    const res = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: "Você é Liora, criadora de simulados educacionais.",
        user: `
Retorne APENAS um array JSON válido.

Formato:
[
  {
    "enunciado": "string",
    "alternativas": ["A","B","C","D"],
    "corretaIndex": 0,
    "explicacaoCorreta": "string",
    "explicacoesErradas": ["x","y","z"]
  }
]

Gere ${config.qtd} questões.
Banca: ${config.banca}.
Tema: ${config.tema || "geral"}.
Dificuldade: ${config.dificuldade}.
`
      })
    });

    const json = await res.json();
    return Array.isArray(json.output) ? json.output : JSON.parse(json.output);
  }

  // -------------------------------------------------
  // PREPARAÇÃO
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

  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------
  function renderQuestao() {
    const q = STATE.questoes[STATE.atual];
    const box = qs("sim-questao-container");

    if (!q || !box) return;

    box.innerHTML = `
      <div class="sim-questao-card">
        <div class="sim-status">
          Questão ${STATE.atual + 1} de ${STATE.questoes.length}
        </div>
        <p>${q.enunciado}</p>
        ${q.alternativas.map((a, i) =>
          `<button class="sim-alt ${q.resp === i ? "selected" : ""}" data-i="${i}">${a}</button>`
        ).join("")}
      </div>
    `;

    box.querySelectorAll(".sim-alt").forEach(btn => {
      btn.onclick = () => {
        q.resp = Number(btn.dataset.i);
        renderQuestao();
      };
    });

    qs("sim-nav")?.classList.remove("hidden");
  }

  // -------------------------------------------------
  // NAVEGAÇÃO
  // -------------------------------------------------
  document.addEventListener("click", (e) => {
    if (e.target.closest("#sim-btn-proxima")) {
      STATE.atual < STATE.questoes.length - 1
        ? (STATE.atual++, renderQuestao())
        : finalizar();
    }

    if (e.target.closest("#sim-btn-voltar") && STATE.atual > 0) {
      STATE.atual--;
      renderQuestao();
    }
  });

  function finalizar() {
    const acertos = STATE.questoes.filter(q => q.resp === q.corretaIndex).length;

    qs("sim-questao-container").innerHTML = "";
    qs("sim-nav")?.classList.add("hidden");

    qs("sim-resultado").innerHTML = `
      <div class="sim-resultado-card">
        <h3>Resultado</h3>
        <p>${acertos} / ${STATE.questoes.length} acertos</p>
        <button class="btn-secondary" data-action="simulados:config">
          Novo simulado
        </button>
      </div>
    `;

    qs("sim-resultado")?.classList.remove("hidden");
  }

})();
