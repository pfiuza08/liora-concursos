// =============================================================
// 🧠 LIORA — SIMULADOS v105-FINAL
// Marca-d’água: simulados.v105-final — 2026-01-12
// =============================================================

console.log(
  "🔖 simulados.v105-final — " + new Date().toISOString()
);

(function () {
  // -------------------------------------------------
  // STATE LOCAL
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
    info: (m, e) => console.log("🧠 [Simulados]", m, e || ""),
    warn: (m, e) => console.warn("🟡 [Simulados]", m, e || ""),
    error: (m, e) => console.error("🔴 [Simulados]", m, e || "")
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
      window.lioraError?.show?.(
        `Simulado não pode iniciar. Elementos ausentes: ${missing.join(", ")}`
      );
      return false;
    }
    return true;
  }

  // -------------------------------------------------
  // GLOBAIS
  // -------------------------------------------------
  function globalsReady() {
    return (
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
  // ACESSO
  // -------------------------------------------------
  function getSimuladoAccess() {
    const user = window.lioraAuth?.user;
    const plan = window.lioraState?.plan || "free";

    if (!user) return { ok: false, reason: "login" };

    const limits = window.lioraLimits?.[plan];
    if (!limits) return { ok: false, reason: "config" };

    if (!window.lioraUsage?.podeCriarSimulado(plan)) {
      return { ok: false, reason: "limit" };
    }

    return {
      ok: true,
      plan,
      maxQuestoes: limits.simulados.questoesPorSimulado
    };
  }

  // -------------------------------------------------
  // ABRIR CONFIG (MODAL)
  // -------------------------------------------------
  function abrirModal(access) {
    if (
      !ensure([
        "sim-modal-backdrop",
        "sim-modal-iniciar",
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

    window.lioraModal?.open?.("sim-modal-backdrop");
  }

  // -------------------------------------------------
  // START SIMULADO
  // -------------------------------------------------
  async function iniciarSimulado() {
    log.info("START solicitado");

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

    const ready = await waitForGlobals();
    if (!ready) {
      window.lioraError?.show?.("Sistema ainda inicializando.");
      return;
    }

    const access = getSimuladoAccess();
    if (!access.ok) {
      if (access.reason === "login") {
        window.dispatchEvent(new Event("liora:login-required"));
      }
      if (access.reason === "limit") {
        window.dispatchEvent(new Event("liora:premium-bloqueado"));
      }
      return;
    }

    const els = getEls();

    STATE.config = {
      banca: els.banca?.value || "geral",
      qtd: access.maxQuestoes,
      dificuldade: els.dif?.value || "média",
      tema: els.tema?.value || "",
      tempo: Number(els.tempo?.value || 0)
    };

    window.lioraModal?.close?.("sim-modal-backdrop");

    els.area.classList.remove("hidden");
    els.area.style.display = "block";
    els.area.scrollIntoView({ behavior: "smooth", block: "start" });
    qs("sim-hint")?.classList.add("hidden");

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
      if (!lista.length) throw new Error("Questões vazias.");

      STATE.questoes = lista;
      STATE.atual = 0;

      window.lioraUsage?.registrarSimulado?.();
      window.lioraLoading?.hide?.();

      renderQuestao();
      log.info("Simulado renderizado com sucesso");
    } catch (e) {
      log.error("Erro ao gerar simulado", e);
      window.lioraLoading?.hide?.();
      window.lioraError?.show?.("Erro ao gerar simulado.");
    }
  }

  // -------------------------------------------------
  // IA
  // -------------------------------------------------
  async function gerarQuestoes(config, signal) {
    log.info("Gerando questões via /api/liora", config);

    const res = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        system: "Você é Liora, criadora de simulados educacionais.",
        user: `
Retorne APENAS JSON válido.

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

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    let raw = (await res.json()).output;
    if (typeof raw === "string") {
      raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    if (typeof raw !== "string" || !raw.startsWith("[")) {
      throw new Error("IA retornou conteúdo inválido.");
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      throw new Error("IA retornou lista inválida.");
    }

    return parsed;
  }

  // -------------------------------------------------
  // PREPARAÇÃO
  // -------------------------------------------------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function prepararQuestoes(lista) {
    return lista.map((q, i) => {
      const correta = q.alternativas[q.corretaIndex];
      const alternativas = shuffle(q.alternativas);
      return {
        indice: i + 1,
        enunciado: q.enunciado,
        alternativas,
        corretaIndex: alternativas.indexOf(correta),
        resp: null
      };
    });
  }

  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------
  function renderQuestao() {
    const els = getEls();
    const q = STATE.questoes[STATE.atual];
    if (!q) return;

    els.resultado.classList.add("hidden");
    els.nav.classList.remove("hidden");

    els.container.innerHTML = `
      <div class="sim-questao-card">
        <div class="sim-status">
          Questão ${STATE.atual + 1} de ${STATE.questoes.length}
        </div>
        <p>${q.enunciado}</p>
        ${q.alternativas
          .map(
            (a, i) =>
              `<button class="sim-alt ${q.resp === i ? "selected" : ""}" data-i="${i}">${a}</button>`
          )
          .join("")}
      </div>
    `;

    els.container.querySelectorAll(".sim-alt").forEach((btn) => {
      btn.onclick = () => {
        q.resp = Number(btn.dataset.i);
        renderQuestao();
      };
    });

    els.btnProx.textContent =
      STATE.atual === STATE.questoes.length - 1 ? "Finalizar" : "Próxima";
    els.btnVoltar.disabled = STATE.atual === 0;
  }

  // -------------------------------------------------
  // FINAL
  // -------------------------------------------------
  function finalizar() {
    const els = getEls();
    const acertos = STATE.questoes.filter(
      (q) => q.resp === q.corretaIndex
    ).length;

    els.container.innerHTML = "";
    els.nav.classList.add("hidden");

    els.resultado.innerHTML = `
      <div class="sim-resultado-card">
        <h3>Resultado</h3>
        <p>${acertos} / ${STATE.questoes.length} acertos</p>
        <button id="sim-refazer" class="btn-secundario">Novo simulado</button>
      </div>
    `;
    els.resultado.classList.remove("hidden");

    qs("sim-refazer")?.addEventListener("click", () =>
      window.dispatchEvent(new Event("liora:open-simulados"))
    );
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

  // -------------------------------------------------
  // EVENTOS — ALINHADOS COM UI-ACTIONS
  // -------------------------------------------------
  window.addEventListener("liora:open-simulados", async () => {
    log.info("open-simulados recebido (WINDOW)");

    const ready = await waitForGlobals();
    if (!ready) return;

    const access = getSimuladoAccess();
    if (!access.ok) return;

    abrirModal(access);
  });

  document.addEventListener("liora:start-simulado", iniciarSimulado);

})();
