// =============================================================
// 🧠 LIORA — SIMULADOS v105-FIXED
// Marca-d’água: simulados.v105-fixed — 2026-01-12
//
// Fixes principais:
// ✅ 1 listener canônico p/ abrir config (WINDOW)
// ✅ start canônico (DOCUMENT)
// ✅ remove "hidden" do backdrop ao abrir (senão .hidden vence com !important)
// ✅ parser robusto: extrai o primeiro JSON array mesmo com texto extra
// ✅ sem bootstrap duplicado / sem testes / sem alerts
// =============================================================

console.log("🔖 simulados.v105-fixed — 2026-01-12T" + new Date().toISOString());

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
      log.error("IDs ausentes no DOM:", missing);
      return false;
    }
    return true;
  }

  // -------------------------------------------------
  // GLOBAIS
  // -------------------------------------------------
  function globalsReady() {
    return !!(window.lioraAuth && window.lioraState && window.lioraLimits && window.lioraUsage);
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

    if (typeof window.lioraUsage?.podeCriarSimulado !== "function") {
      return { ok: false, reason: "usage" };
    }

   // if (!window.lioraUsage.podeCriarSimulado(plan)) {
   //   return { ok: false, reason: "limit" };
   // }

    const maxQuestoes = limits?.simulados?.questoesPorSimulado;
    if (!maxQuestoes) return { ok: false, reason: "limits-sim" };

    return { ok: true, plan, maxQuestoes };
  }

  // -------------------------------------------------
  // MODAL HELPERS (remove hidden / adiciona hidden)
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

    // fallback (se lioraModal não existir por algum motivo)
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModalSafe(id) {
    const modal = qs(id);
    if (!modal) return;

    window.lioraModal?.close?.(id);

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    // Mantém seu padrão: fechado volta a hidden
    modal.classList.add("hidden");
  }

  // -------------------------------------------------
  // ABRIR CONFIG
  // -------------------------------------------------
  function abrirModal(access) {
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

    // Free: qtd fixa
    els.qtd.value = access.maxQuestoes;
    els.qtd.disabled = access.plan === "free";

    log.info("Abrindo modal de config", { plan: access.plan, max: access.maxQuestoes });
    // 🔓 Garante que nenhum modal anterior deixou o body travado
    document.body.style.overflow = "";
    document.body.classList.remove("liora-modal-open");
    
    openModalSafe("sim-modal-backdrop");

  }

  // -------------------------------------------------
  // START SIMULADO (CANÔNICO + BLINDADO)
  // -------------------------------------------------
  async function iniciarSimulado(e) {
  log.info("START solicitado");

  // 🛑 BLINDAGEM ABSOLUTA
  // Só inicia se vier do botão explícito (ui-actions)
  if (!e || !e.detail || e.detail.origem !== "ui-actions") {
    log.warn("⛔ iniciarSimulado ignorado — origem inválida", e?.detail);
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
    log.warn("Globais não prontas");
    return;
  }

  const access = getSimuladoAccess();
  console.log("🧪 ACCESS (start-simulado):", JSON.stringify(access));

  if (!access.ok) {
    // 🔐 Login ainda bloqueia start
    if (access.reason === "login") {
      window.dispatchEvent(new Event("liora:login-required"));
      return;
    }

    // ⚠️ Limite temporariamente ignorado (debug)
    log.warn("Simulado com limite atingido — start liberado temporariamente");
  }

  const els = getEls();

  STATE.config = {
    banca: els.banca?.value || "geral",
    qtd: access.maxQuestoes,
    dificuldade: els.dif?.value || "média",
    tema: els.tema?.value || "",
    tempo: Number(els.tempo?.value || 0)
  };

  // -------------------------------------------------
  // 🔒 FECHA MODAL + REMOVE OVERLAY FANTASMA
  // -------------------------------------------------
  closeModalSafe("sim-modal-backdrop");

  const layer = document.getElementById("layer-modal");
  if (layer) {
    layer.classList.add("hidden");
    layer.setAttribute("aria-hidden", "true");
  }

  // Libera foco preso no modal
  document.activeElement?.blur();

  // -------------------------------------------------
  // 🔓 ATIVA ÁREA DO SIMULADO (ALINHADO AO LAYOUT LIORA)
  // -------------------------------------------------
  showApp?.();
  hideAllPanels?.();

  els.area.classList.remove("hidden");
  els.area.classList.add("is-active");

  els.area.scrollIntoView({ behavior: "smooth", block: "start" });
  qs("sim-hint")?.classList.add("hidden");

  // -------------------------------------------------
  // 🔄 GERAÇÃO DO SIMULADO
  // -------------------------------------------------
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
      throw new Error("Questões vazias após preparação.");
    }

    STATE.questoes = lista;
    STATE.atual = 0;

    window.lioraUsage?.registrarSimulado?.();
    window.lioraLoading?.hide?.();

    renderQuestao();
    log.info("Simulado renderizado com sucesso ✅");

  } catch (err) {
    log.error("Erro ao gerar simulado", err);
    window.lioraLoading?.hide?.();
    window.lioraError?.show?.("Erro ao gerar simulado. Tente novamente.");
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

    // Blindagem: extrai o primeiro array JSON, mesmo se vier texto antes/depois
    const extracted = extractJsonArray(raw);
    const parsed = safeJsonParse(extracted);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("IA retornou lista vazia/ inválida.");
    }

    return parsed;
  }

  function extractJsonArray(raw) {
    if (Array.isArray(raw)) return raw; // já veio parseado
    if (typeof raw !== "string") throw new Error("IA retornou conteúdo não-string.");

    // tenta achar o primeiro "[" e o último "]"
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

    if (typeof textOrObj !== "string") {
      throw new Error("Conteúdo inválido para parse.");
    }

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
  // FINAL (simples, sem mexer no seu fluxo premium ainda)
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

  // ✅ ABRIR CONFIG: vem do ui-actions via WINDOW
    async function onOpenSimulados() {
      log.info("open-simulados recebido (WINDOW)");
    
      try {
        const ready = await waitForGlobals();
        log.info("Globals ready:", ready);
    
        if (!ready) {
          window.lioraError?.show?.("Sistema ainda inicializando.");
          return;
        }
    
        const access = getSimuladoAccess();
        log.info("Access check:", access);
    
        if (!access.ok) {
          if (access.reason === "login") {
            window.dispatchEvent(new Event("liora:login-required"));
          } else if (access.reason === "limit") {
            window.dispatchEvent(new Event("liora:premium-bloqueado"));
          } else {
            window.lioraError?.show?.("Não foi possível verificar acesso ao simulado.");
          }
          return;
        }
    
        abrirModal(access);
    
      } catch (err) {
        console.error("❌ ERRO EM onOpenSimulados:", err);
        window.lioraError?.show?.("Erro interno ao abrir simulados.");
      }
    }


  window.addEventListener("liora:open-simulados", onOpenSimulados);

  // Opcional: se você quiser manter open-sim-config como alias
  window.addEventListener("liora:open-sim-config", onOpenSimulados);

  window.addEventListener("liora:start-simulado", (e) => iniciarSimulado(e));

})();
