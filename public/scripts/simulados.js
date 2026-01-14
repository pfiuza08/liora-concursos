// =============================================================
// 🧠 LIORA — SIMULADOS v107-STABLE
// Data: 2026-01-13
//
// Objetivos desta versão:
// ✅ NÃO depende de data-action no botão do modal (bind local robusto)
// ✅ NÃO re-dispara liora:open-simulados dentro do start (evita loop)
// ✅ Aceita start vindo de window OU document
// ✅ Contorna "layer-modal aria-hidden" (overlay/foco) no clique do start
// ✅ Parser robusto: extrai primeiro JSON array mesmo com texto extra
// ✅ Mantém sua UI de simulado (area + container + nav + resultado)
// =============================================================

console.log("🔖 simulados.v107-stable —", new Date().toISOString());

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
    iaTimeoutMs: 25000,
    bindStartMaxTries: 25,
    bindStartDelay: 80
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
      log.error("IDs ausentes no DOM:", missing);
      return false;
    }
    return true;
  }

  function callGlobal(name) {
    try {
      const fn = window[name] || globalThis[name];
      if (typeof fn === "function") fn();
    } catch (_) {}
  }

  function showFabSim() {
    try {
      // 1) variável global (nav-home costuma ter)
      if (typeof window.fabSim !== "undefined" && window.fabSim?.classList) {
        window.fabSim.classList.remove("hidden");
        return;
      }
      // 2) ids comuns
      const byId =
        qs("fab-sim") || qs("fabSim") || qs("fab-simulados") || qs("sim-fab");
      if (byId) byId.classList.remove("hidden");
      // 3) dataset comum
      const byData = document.querySelector('[data-fab="sim"],[data-fab="simulados"]');
      if (byData) byData.classList.remove("hidden");
    } catch (_) {}
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
    const plan = window.lioraState?.plan || "free";

    if (!user) return { ok: false, reason: "login" };

    const limits = window.lioraLimits?.[plan];
    if (!limits) return { ok: false, reason: "config" };

    const maxQuestoes = limits?.simulados?.questoesPorSimulado;
    if (!maxQuestoes) return { ok: false, reason: "limits-sim" };

    return { ok: true, plan, maxQuestoes };
  }

  // -------------------------------------------------
  // MODAL HELPERS
  // -------------------------------------------------
  function openModalSafe(id) {
    const modal = qs(id);
    if (!modal) {
      log.warn("Modal não encontrado:", id);
      return;
    }

    // 🔑 CRÍTICO: se tiver .hidden, ele ganha do .is-open (display:none !important)
    modal.classList.remove("hidden");

    window.lioraModal?.open?.(id);

    // fallback (se lioraModal não existir)
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModalSafe(id) {
    const modal = qs(id);
    if (!modal) return;

    window.lioraModal?.close?.(id);

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    // fechado volta a hidden (seu padrão)
    modal.classList.add("hidden");
  }

  function killLayerModal() {
    // ✅ evita foco/eventos presos em overlay global
    const layer = qs("layer-modal");
    if (layer) {
      layer.classList.add("hidden");
      layer.setAttribute("aria-hidden", "true");
      layer.style.pointerEvents = "none";
    }
    document.activeElement?.blur();
  }

  // -------------------------------------------------
  // BIND LOCAL DO BOTÃO START (ROBUSTO)
  // -------------------------------------------------
  async function bindStartButton() {
    let tries = 0;

    while (tries < BLIND.bindStartMaxTries) {
      const btn = qs("sim-modal-iniciar");
      if (btn) {
        // força comportamento previsível
        btn.type = "button";
        btn.onclick = null;

        // remove qualquer handler anterior (clona)
        const clone = btn.cloneNode(true);
        btn.parentNode?.replaceChild(clone, btn);

        // bind definitivo
        clone.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            e.stopPropagation();

            log.info("🔥 CLICK START (bind local) — disparando liora:start-simulado");

            // mata overlay global antes de disparar start
            killLayerModal();

            // dispara no WINDOW (e também no DOCUMENT por compat)
            const ev = new CustomEvent("liora:start-simulado", {
              detail: { origem: "ui-actions", timestamp: Date.now(), via: "modal-bind" }
            });

            window.dispatchEvent(ev);
            document.dispatchEvent(ev);
          },
          { passive: false }
        );

        return true;
      }

      await new Promise((r) => setTimeout(r, BLIND.bindStartDelay));
      tries++;
    }

    log.error("Não consegui bindar o botão #sim-modal-iniciar (não apareceu no DOM)");
    return false;
  }

  // -------------------------------------------------
  // ABRIR CONFIG
  // -------------------------------------------------
 async function abrirConfig() {
  log.info("open-config recebido (WINDOW)");

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
}

  // -------------------------------------------------
  // START SIMULADO
  // -------------------------------------------------
  async function iniciarSimulado(e) {
    log.info("START recebido", e?.detail);

    // 🛑 Blindagem: só aceita start do fluxo canônico
    if (!e || !e.detail || e.detail.origem !== "ui-actions") {
      log.warn("⛔ START ignorado — origem inválida", e?.detail);
      return;
    }

    if (
      !ensure([
        "area-simulado",
        "sim-questao-container",
        "sim-nav",
        "sim-btn-proxima",
        "sim-btn-voltar",
        "sim-resultado"
      ])
    ) {
      log.error("Elementos obrigatórios do simulado ausentes");
      return;
    }

    const ready = await waitForGlobals();
    if (!ready) {
      window.lioraError?.show?.("Sistema ainda inicializando.");
      return;
    }

    const access = getSimuladoAccess();
    if (!access.ok) {
      if (access.reason === "login") window.dispatchEvent(new Event("liora:login-required"));
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

    // fecha modal + mata overlay global
    closeModalSafe("sim-modal-backdrop");
    killLayerModal();

    // ativa UI do simulado sem depender do nav-home (evita conflito open-simulados)
    callGlobal("showApp");
    callGlobal("hideAllPanels");

    els.area.classList.remove("hidden");
    els.area.classList.add("is-active");
    els.area.scrollIntoView({ behavior: "smooth", block: "start" });

    showFabSim();
    qs("sim-hint")?.classList.add("hidden");

    window.lioraLoading?.show?.("Gerando simulado...");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), BLIND.iaTimeoutMs);

      const raw = await gerarQuestoes(STATE.config, controller.signal);
      clearTimeout(timeout);

      const lista = prepararQuestoes(raw);
      if (!lista.length) throw new Error("Lista de questões vazia");

      STATE.questoes = lista;
      STATE.atual = 0;

      window.lioraUsage?.registrarSimulado?.();
      window.lioraLoading?.hide?.();

      renderQuestao();
      log.info("Simulado renderizado com sucesso ✅");
    } catch (err) {
      window.lioraLoading?.hide?.();
      window.lioraError?.show?.("Erro ao gerar simulado. Tente novamente.");
      log.error("Erro no simulado:", err);
    }
  }

  // -------------------------------------------------
  // IA — GERAÇÃO (ROBUSTA)
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
Retorne APENAS JSON válido (um ARRAY).
NÃO use markdown.
NÃO escreva texto fora do JSON.

Formato:
[
  {
    "enunciado": "string",
    "alternativas": ["A", "B", "C", "D"],
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

    const json = await res.json();
    let raw = json.output;

    // Limpeza básica
    if (typeof raw === "string") {
      raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    // Blindagem: extrai o primeiro array JSON
    const extracted = extractJsonArray(raw);
    const parsed = safeJsonParse(extracted);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("IA retornou lista vazia/ inválida.");
    }

    return parsed;
  }

  function extractJsonArray(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw !== "string") throw new Error("IA retornou conteúdo não-string.");

    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start < 0 || end < 0 || end <= start) {
      throw new Error("Não encontrei um array JSON na resposta da IA.");
    }
    return raw.slice(start, end + 1);
  }

  function safeJsonParse(textOrObj) {
    if (Array.isArray(textOrObj) || (typeof textOrObj === "object" && textOrObj !== null)) {
      return textOrObj;
    }
    if (typeof textOrObj !== "string") throw new Error("Conteúdo inválido para parse.");

    try {
      return JSON.parse(textOrObj);
    } catch (e) {
      log.error("Falha ao parsear JSON:", textOrObj);
      throw new Error("Falha ao interpretar resposta da IA como JSON.");
    }
  }

  // -------------------------------------------------
  // PREPARAÇÃO
  // -------------------------------------------------
  function shuffle(arr) {
    const a = Array.isArray(arr) ? arr.slice() : [];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function prepararQuestoes(lista) {
    return (lista || []).map((q, i) => {
      const alternativasOrig = Array.isArray(q.alternativas) ? q.alternativas : [];
      const corretaIndexOrig = Number.isFinite(q.corretaIndex) ? q.corretaIndex : 0;

      const corretaTexto = alternativasOrig[corretaIndexOrig];
      const alternativas = shuffle(alternativasOrig);
      const novaCorreta = alternativas.indexOf(corretaTexto);

      return {
        indice: i + 1,
        enunciado: q.enunciado || "(enunciado ausente)",
        alternativas,
        corretaIndex: novaCorreta >= 0 ? novaCorreta : 0,
        explicacaoCorreta: q.explicacaoCorreta || "",
        explicacoesErradas: Array.isArray(q.explicacoesErradas) ? q.explicacoesErradas : [],
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
    if (!q || !els.container) return;

    els.resultado?.classList.add("hidden");
    els.nav?.classList.remove("hidden");

    els.container.innerHTML = `
      <div class="sim-questao-card">
        <div class="sim-status">
          Questão ${STATE.atual + 1} de ${STATE.questoes.length}
        </div>
        <p>${escapeHtml(q.enunciado)}</p>
        ${q.alternativas
          .map((a, i) => {
            const selected = q.resp === i ? "selected" : "";
            return `<button class="sim-alt ${selected}" data-i="${i}">${escapeHtml(a)}</button>`;
          })
          .join("")}
      </div>
    `;

    els.container.querySelectorAll(".sim-alt").forEach((btn) => {
      btn.onclick = () => {
        q.resp = Number(btn.dataset.i);
        renderQuestao();
      };
    });

    if (els.btnProx) {
      els.btnProx.textContent = STATE.atual === STATE.questoes.length - 1 ? "Finalizar" : "Próxima";
    }
    if (els.btnVoltar) {
      els.btnVoltar.disabled = STATE.atual === 0;
    }
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // -------------------------------------------------
  // FINAL
  // -------------------------------------------------
  function finalizar() {
    const els = getEls();
    if (!els.resultado || !els.container || !els.nav) return;

    const acertos = STATE.questoes.filter((q) => q.resp === q.corretaIndex).length;

    els.container.innerHTML = "";
    els.nav.classList.add("hidden");

    els.resultado.innerHTML = `
      <div class="sim-resultado-card">
        <h3>Resultado</h3>
        <p>${acertos} / ${STATE.questoes.length} acertos</p>
        <button id="sim-refazer" class="btn-secondary">Novo simulado</button>
      </div>
    `;
    els.resultado.classList.remove("hidden");

    qs("sim-refazer")?.addEventListener("click", () => {
      window.dispatchEvent(new Event("liora:open-simulados"));
    });
  }

  // -------------------------------------------------
  // NAVEGAÇÃO (delegação)
  // -------------------------------------------------
  document.addEventListener("click", (e) => {
    if (e.target.closest("#sim-btn-proxima")) {
      STATE.atual < STATE.questoes.length - 1 ? (STATE.atual++, renderQuestao()) : finalizar();
    }
    if (e.target.closest("#sim-btn-voltar") && STATE.atual > 0) {
      STATE.atual--;
      renderQuestao();
    }
  });

  // -------------------------------------------------
  // EVENTOS CANÔNICOS
  // -------------------------------------------------
  // Config abre via WINDOW (ui-actions atual)
  window.addEventListener("liora:open-simulados", abrirConfig);

  // Alias (caso você padronize depois)
  window.addEventListener("liora:open-sim-config", abrirConfig);

  // Start: aceita WINDOW e DOCUMENT (por compatibilidade)
  window.addEventListener("liora:start-simulado", (e) => iniciarSimulado(e));
  document.addEventListener("liora:start-simulado", (e) => iniciarSimulado(e));
})();
