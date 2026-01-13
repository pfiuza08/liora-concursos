// =============================================================
// 🧠 LIORA — SIMULADOS v106-CONSOLIDATED
// Data: 2026-01-13
//
// Arquitetura:
// ✔ Config abre via evento canônico (WINDOW)
// ✔ Start ocorre via evento canônico (WINDOW)
// ✔ Modal usa bind LOCAL (correto p/ UI controlada)
// ✔ Nenhum binder global
// ✔ Nenhum código duplicado
// =============================================================

console.log("🔖 simulados.v106-consolidated —", new Date().toISOString());

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
  // CONFIG
  // -------------------------------------------------
  const BLIND = {
    waitGlobalsMaxTries: 20,
    waitGlobalsDelay: 250,
    iaTimeoutMs: 25000
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

  function getEls() {
    return {
      modal: qs("sim-modal-backdrop"),

      banca: qs("sim-modal-banca"),
      qtd: qs("sim-modal-qtd"),
      tempo: qs("sim-modal-tempo"),
      dif: qs("sim-modal-dificuldade"),
      tema: qs("sim-modal-tema"),

      area: qs("area-simulado"),
      container: qs("sim-questao-container"),
      nav: qs("sim-nav"),
      btnProx: qs("sim-btn-proxima"),
      btnVoltar: qs("sim-btn-voltar"),
      resultado: qs("sim-resultado")
    };
  }

  function ensure(ids) {
    const missing = ids.filter((id) => !qs(id));
    if (missing.length) {
      log.error("IDs ausentes:", missing);
      window.lioraError?.show?.(
        "Simulado não pode iniciar. Estrutura incompleta."
      );
      return false;
    }
    return true;
  }

  // -------------------------------------------------
  // GLOBAIS
  // -------------------------------------------------
  function globalsReady() {
    return !!(
      window.lioraAuth &&
      window.lioraState &&
      window.lioraLimits &&
      window.lioraUsage
    );
  }

  async function waitForGlobals() {
    let tries = 0;
    while (!globalsReady() && tries < BLIND.waitGlobalsMaxTries) {
      await new Promise((r) => setTimeout(r, BLIND.waitGlobalsDelay));
      tries++;
    }
    return globalsReady();
  }

  // -------------------------------------------------
  // ACESSO (limite temporariamente desligado)
  // -------------------------------------------------
  function getSimuladoAccess() {
    const user = window.lioraAuth?.user;
    if (!user) return { ok: false, reason: "login" };

    const plan = window.lioraState?.plan || "free";
    const limits = window.lioraLimits?.[plan];
    const max = limits?.simulados?.questoesPorSimulado || 5;

    return { ok: true, plan, maxQuestoes: max };
  }

  // -------------------------------------------------
  // MODAL
  // -------------------------------------------------
  function openModalSafe(id) {
    const modal = qs(id);
    if (!modal) return;

    modal.classList.remove("hidden");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    window.lioraModal?.open?.(id);
  }

  function closeModalSafe(id) {
    const modal = qs(id);
    if (!modal) return;

    window.lioraModal?.close?.(id);
    modal.classList.remove("is-open");
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  // -------------------------------------------------
  // ABRIR CONFIG (EVENTO CANÔNICO)
  // -------------------------------------------------
  async function abrirConfig() {
    log.info("Evento open-simulados recebido");

    if (!(await waitForGlobals())) {
      window.lioraError?.show?.("Sistema ainda inicializando.");
      return;
    }

    const access = getSimuladoAccess();
    if (!access.ok) {
      window.dispatchEvent(new Event("liora:login-required"));
      return;
    }

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

    const els = getEls();

    els.qtd.value = access.maxQuestoes;
    els.qtd.disabled = access.plan === "free";

    openModalSafe("sim-modal-backdrop");

    // -------------------------------------------------
    // BIND LOCAL DO BOTÃO START (CORRETO P/ MODAL)
    // -------------------------------------------------
    const btn = qs("sim-modal-iniciar");
    if (!btn) {
      log.error("Botão iniciar não encontrado");
      return;
    }

    btn.type = "button";
    btn.onclick = null;

    btn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        log.info("Start solicitado (bind local)");

        window.dispatchEvent(
          new CustomEvent("liora:start-simulado", {
            detail: { origem: "modal" }
          })
        );
      },
      { once: true }
    );
  }

  // -------------------------------------------------
  // START SIMULADO
  // -------------------------------------------------
  async function iniciarSimulado(e) {
  log.info("START recebido", e?.detail);

  // 🛑 Blindagem de origem (só aceita do fluxo oficial)
  if (!e || !e.detail || e.detail.origem !== "ui-actions") {
    log.warn("⛔ START ignorado — origem inválida", e?.detail);
    return;
  }

  // ⏳ Aguarda globais
  if (!(await waitForGlobals())) {
    window.lioraError?.show?.("Sistema ainda inicializando.");
    return;
  }

  const access = getSimuladoAccess();
  if (!access.ok) {
    if (access.reason === "login") {
      window.dispatchEvent(new Event("liora:login-required"));
    }
    return;
  }

  const els = getEls();

  // 📦 Config final do simulado
  STATE.config = {
    banca: els.banca?.value || "geral",
    qtd: access.maxQuestoes,
    dificuldade: els.dif?.value || "média",
    tema: els.tema?.value || "",
    tempo: Number(els.tempo?.value || 0)
  };

  // 🔒 Fecha modal de config com segurança
  closeModalSafe("sim-modal-backdrop");
  document.activeElement?.blur();

  // 🔑 ATIVA A TELA DE SIMULADO PELO ROUTER (CANÔNICO)
  window.dispatchEvent(new Event("liora:open-simulados"));

  // 🔓 Blindagem visual local (caso router falhe)
  els.area?.classList.remove("hidden");
  els.area?.classList.add("is-active");
  els.area?.scrollIntoView({ behavior: "smooth", block: "start" });

  // 🔧 Garante FAB de simulado visível
  if (typeof fabSim !== "undefined") {
    fabSim.classList.remove("hidden");
  }

  // ⏳ Loading
  window.lioraLoading?.show?.("Gerando simulado...");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      BLIND.iaTimeoutMs
    );

    const raw = await gerarQuestoes(STATE.config, controller.signal);
    clearTimeout(timeout);

    const lista = prepararQuestoes(raw);
    if (!lista.length) {
      throw new Error("Lista de questões vazia");
    }

    STATE.questoes = lista;
    STATE.atual = 0;

    window.lioraLoading?.hide?.();
    renderQuestao();

    log.info("Simulado iniciado com sucesso ✅");

  } catch (err) {
    window.lioraLoading?.hide?.();
    window.lioraError?.show?.("Erro ao gerar simulado.");
    log.error("Erro no simulado:", err);
  }
}

  // -------------------------------------------------
  // IA
  // -------------------------------------------------
  async function gerarQuestoes(config, signal) {
    const res = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        user: `Gere ${config.qtd} questões de ${config.tema || "conhecimento geral"}`
      })
    });

    const json = await res.json();
    return Array.isArray(json.output) ? json.output : [];
  }

  // -------------------------------------------------
  // PREPARAÇÃO + RENDER
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
    const els = getEls();
    const q = STATE.questoes[STATE.atual];
    if (!q) return;

    els.container.innerHTML = `
      <div class="sim-questao-card">
        <p><b>Questão ${q.indice}</b></p>
        <p>${q.enunciado}</p>
        ${q.alternativas
          .map(
            (a, i) =>
              `<button class="sim-alt" data-i="${i}">${a}</button>`
          )
          .join("")}
      </div>
    `;

    els.container.querySelectorAll(".sim-alt").forEach((btn) => {
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
    const els = getEls();
    els.container.innerHTML = "<h3>Simulado finalizado</h3>";
  }

  // -------------------------------------------------
  // EVENTOS CANÔNICOS
  // -------------------------------------------------
  window.addEventListener("liora:open-simulados", abrirConfig);
  window.addEventListener("liora:start-simulado", iniciarSimulado);

})();
