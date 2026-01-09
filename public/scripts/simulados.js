// =============================================================
// 🧠 LIORA — SIMULADOS v104.2-BLINDED
// - Blindado contra DOM ausente / ordem de carregamento
// - Free: experiência completa com limites
// - Premium: ilimitado + histórico
// - Shuffle real das alternativas
// - Resultado + explicações no final
// - Premium tratado como SCREEN (não modal)
// =============================================================

(function () {
  console.log("🟢 Liora Simulados v104.2 (BLINDED) carregado");

  // -------------------------------------------------
  // STATE LOCAL
  // -------------------------------------------------
  const STATE = {
    questoes: [],
    atual: 0,
    config: null
  };

  // -------------------------------------------------
  // CONFIG — BLINDAGEM
  // -------------------------------------------------
  const BLIND = {
    waitGlobalsMaxTries: 20,   // 20 * 250ms = 5s
    waitGlobalsDelay: 250,
    domReadyTimeoutMs: 8000
  };

  // -------------------------------------------------
  // HELPERS
  // -------------------------------------------------
  const qs = (id) => document.getElementById(id);

  function warn(msg, extra) {
    console.warn("🟡 [Simulados]", msg, extra || "");
  }

  function info(msg, extra) {
    console.log("🧠 [Simulados]", msg, extra || "");
  }

  function hardFail(msg) {
    console.error("🔴 [Simulados]", msg);
    window.lioraError?.show?.(msg);
  }

  function getEls() {
    return {
      modal: qs("sim-modal-backdrop"),
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
      resultado: qs("sim-resultado")
    };
  }

  function ensureDomEls(requiredIds) {
    const missing = requiredIds.filter((id) => !qs(id));
    if (missing.length) {
      hardFail(
        `Simulado não pode renderizar. IDs ausentes no DOM: ${missing.join(", ")}`
      );
      return false;
    }
    return true;
  }

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
      if (tries === 0) warn("Aguardando globais (lioraAuth/lioraLimits/lioraUsage)...");
      await new Promise((r) => setTimeout(r, BLIND.waitGlobalsDelay));
      tries++;
    }

    if (!globalsReady()) {
      warn("Globais não ficaram prontas a tempo.", {
        lioraAuth: !!window.lioraAuth,
        lioraState: !!window.lioraState,
        lioraLimits: !!window.lioraLimits,
        lioraUsage: !!window.lioraUsage
      });
      return false;
    }

    return true;
  }

  function whenDomReady(fn) {
    // Já pronto
    if (document.readyState !== "loading") {
      fn();
      return;
    }

    // Espera DOMContentLoaded
    let done = false;

    const onReady = () => {
      if (done) return;
      done = true;
      document.removeEventListener("DOMContentLoaded", onReady);
      fn();
    };

    document.addEventListener("DOMContentLoaded", onReady);

    // Failsafe (caso raro de listener não disparar)
    setTimeout(() => {
      if (!done) {
        warn("Timeout esperando DOMContentLoaded. Tentando registrar mesmo assim.");
        onReady();
      }
    }, BLIND.domReadyTimeoutMs);
  }

  // -------------------------------------------------
  // ACESSO CANÔNICO
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

    if (!window.lioraUsage.podeCriarSimulado(plan)) {
      return { ok: false, reason: "limit" };
    }

    const maxQuestoes = limits?.simulados?.questoesPorSimulado;
    if (!maxQuestoes) return { ok: false, reason: "limits-sim" };

    return { ok: true, plan, maxQuestoes };
  }

  // -------------------------------------------------
  // ABRIR MODAL DE CONFIGURAÇÃO
  // -------------------------------------------------
  function abrirModal(access) {
    // Requer IDs do modal/config
    const ok = ensureDomEls([
      "sim-modal-backdrop",
      "sim-modal-iniciar",
      "sim-modal-banca",
      "sim-modal-qtd",
      "sim-modal-tempo",
      "sim-modal-dificuldade",
      "sim-modal-tema"
    ]);
    if (!ok) return;

    const els = getEls();
    const isFree = access.plan === "free";

    if (els.qtd) {
      els.qtd.value = access.maxQuestoes;
      els.qtd.disabled = isFree;
    }

    window.lioraModal?.open?.("sim-modal-backdrop");
  }

  // -------------------------------------------------
  // START FLOW
  // -------------------------------------------------
  async function iniciarSimulado() {
    info("START solicitado");

    // 1) DOM de render precisa existir
    const okRender = ensureDomEls([
      "sim-questao-container",
      "sim-nav",
      "sim-btn-proxima",
      "sim-btn-voltar",
      "sim-resultado"
    ]);
    if (!okRender) return;

    // 2) Globais precisam existir
    const okGlobals = await waitForGlobals();
    if (!okGlobals) {
      hardFail("Sistema ainda não inicializou para gerar simulado.");
      return;
    }

    const els = getEls();
    const access = getSimuladoAccess();
    info("Access check:", access);

    if (!access.ok) {
      if (access.reason === "login") {
        window.dispatchEvent(new Event("liora:login-required"));
        return;
      }
      if (access.reason === "limit") {
        window.dispatchEvent(new Event("liora:premium-bloqueado"));
        return;
      }

      hardFail("Não foi possível verificar acesso ao simulado.");
      return;
    }

    // Config (qtd fixa no free via access.maxQuestoes)
    STATE.config = {
      banca: els.banca?.value || "geral",
      qtd: access.maxQuestoes,
      dificuldade: els.dif?.value || "média",
      tema: els.tema?.value || "",
      tempo: Number(els.tempo?.value || 0)
    };

    // Fecha modal + loading
    window.lioraModal?.close?.("sim-modal-backdrop");

      // 🔓 MOSTRA A ÁREA DO SIMULADO
      const area = document.getElementById("area-simulado");
      if (area) {
        area.classList.remove("hidden");
        area.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      // 🔕 Esconde dica inicial do simulado
      document.getElementById("sim-hint")?.classList.add("hidden");

      window.lioraLoading?.show?.("Gerando simulado...");

    try {
      const raw = await gerarQuestoes(STATE.config);
      const lista = prepararQuestoes(raw);

      if (!Array.isArray(lista) || lista.length === 0) {
        throw new Error("Lista de questões vazia/invalidada após prepararQuestoes.");
      }

      STATE.questoes = lista;
      STATE.atual = 0;

      window.lioraUsage?.registrarSimulado?.();
      window.lioraLoading?.hide?.();

      renderQuestao();
      info("Simulado renderizado com sucesso ✅");
    } catch (e) {
      console.error("🔴 Erro gerar simulado:", e);
      window.lioraLoading?.hide?.();
      window.lioraError?.show?.("Erro ao gerar simulado.");
    }
  }

  // -------------------------------------------------
  // IA
  // -------------------------------------------------
  async function gerarQuestoes(config) {
    info("Gerando questões via /api/liora", config);

    const res = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: "Você é Liora, criadora de simulados educacionais.",
        user: `
Gere ${config.qtd} questões da banca ${config.banca}.
Tema: ${config.tema || "geral"}.
Dificuldade: ${config.dificuldade}.

Retorne APENAS JSON válido no formato:
[
  {
    "enunciado": "...",
    "alternativas": ["A...", "B...", "C...", "D..."],
    "corretaIndex": 0,
    "explicacaoCorreta": "...",
    "explicacoesErradas": ["...", "...", "..."]
  }
]
`
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} em /api/liora`);
    }

    const json = await res.json();
    let raw = json.output;

    if (typeof raw === "string") {
      raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    let parsed;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      throw new Error("Resposta IA não é JSON válido.");
    }

    if (!Array.isArray(parsed)) {
      throw new Error("Resposta IA não retornou array de questões.");
    }

    return parsed;
  }

  // -------------------------------------------------
  // SHUFFLE + NORMALIZAÇÃO
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
    return (lista || []).map((q, idx) => {
      const alternativasOrig = Array.isArray(q.alternativas) ? q.alternativas : [];
      const corretaIndexOrig = Number.isFinite(q.corretaIndex) ? q.corretaIndex : 0;

      const corretaTexto = alternativasOrig[corretaIndexOrig];
      const alternativas = shuffle(alternativasOrig);
      const novaCorreta = alternativas.indexOf(corretaTexto);

      return {
        indice: idx + 1,
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
  // RENDER QUESTÃO
  // -------------------------------------------------
  function renderQuestao() {
    const els = getEls();

    // Blindagem: sem container, não renderiza
    if (!els.container) {
      hardFail("Container do simulado não encontrado (sim-questao-container).");
      return;
    }

    const q = STATE.questoes[STATE.atual];
    if (!q) {
      warn("Nenhuma questão para renderizar.");
      return;
    }

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
            return `<button class="sim-alt ${selected}" data-i="${i}">
              ${escapeHtml(a)}
            </button>`;
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
      els.btnProx.textContent =
        STATE.atual === STATE.questoes.length - 1 ? "Finalizar" : "Próxima";
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
  // FINALIZAR + RESULTADO
  // -------------------------------------------------
  function finalizar() {
    const els = getEls();

    if (!els.resultado || !els.container || !els.nav) {
      hardFail("Estrutura do resultado ausente no DOM.");
      return;
    }

    const plan = window.lioraState?.plan || "free";
    const isPremium = plan === "premium";

    let acertos = 0;
    STATE.questoes.forEach((q) => {
      if (q.resp === q.corretaIndex) acertos++;
    });

    const total = STATE.questoes.length || 1;
    const erros = total - acertos;
    const percentual = Math.round((acertos / total) * 100);

    els.container.innerHTML = "";
    els.nav.classList.add("hidden");

    els.resultado.innerHTML = `
      <div class="sim-resultado-card">
        <h3>Resultado do Simulado</h3>

        <div class="sim-resultado-metricas">
          <div><strong>${acertos}</strong><span>Acertos</span></div>
          <div><strong>${erros}</strong><span>Erros</span></div>
          <div><strong>${percentual}%</strong><span>Aproveitamento</span></div>
        </div>

        ${
          !isPremium
            ? `<p class="sim-msg-free">
                No Liora+ você vê explicações completas e histórico.
              </p>`
            : `<p class="sim-msg-premium">
                Histórico salvo com sucesso.
              </p>`
        }

        <div class="sim-resultado-acoes">
          ${
            isPremium
              ? `<button class="btn-secundario" id="sim-refazer">Novo simulado</button>`
              : `<button class="btn-primario" id="sim-upgrade">Conhecer o Liora+</button>`
          }
          <button class="btn-secundario" id="sim-voltar-home">Voltar</button>
        </div>
      </div>
    `;

    els.resultado.classList.remove("hidden");

    qs("sim-voltar-home")?.addEventListener("click", () => qs("fab-home")?.click());
    qs("sim-refazer")?.addEventListener("click", () => window.dispatchEvent(new Event("liora:open-simulados")));
    qs("sim-upgrade")?.addEventListener("click", () => window.dispatchEvent(new Event("liora:open-premium")));
  }

  // -------------------------------------------------
  // NAVEGAÇÃO
  // -------------------------------------------------
  function bindNav() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("#sim-btn-proxima")) {
        STATE.atual < STATE.questoes.length - 1 ? (STATE.atual++, renderQuestao()) : finalizar();
      }

      if (e.target.closest("#sim-btn-voltar") && STATE.atual > 0) {
        STATE.atual--;
        renderQuestao();
      }
    });
  }

  // -------------------------------------------------
  // BINDER: botão iniciar do modal -> evento start
  // -------------------------------------------------
  function bindStartButton() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("#sim-modal-iniciar")) {
        document.dispatchEvent(new Event("liora:start-simulado"));
      }
    });
  }

  // -------------------------------------------------
  // REGISTRO DE EVENTOS (DOM SAFE)
  // -------------------------------------------------
  function registerListeners() {
    info("Registrando listeners...");

    // Abrir config
    window.addEventListener("liora:open-simulados", async () => {
      info("Evento liora:open-simulados recebido");

      const okGlobals = await waitForGlobals();
      if (!okGlobals) {
        hardFail("Sistema ainda não inicializou para abrir simulados.");
        return;
      }

      const access = getSimuladoAccess();

      if (!access.ok && access.reason === "login") {
        window.dispatchEvent(new Event("liora:login-required"));
        return;
      }

      if (!access.ok && access.reason === "limit") {
        window.dispatchEvent(new Event("liora:premium-bloqueado"));
        return;
      }

      if (!access.ok) {
        window.lioraError?.show?.("Erro ao verificar acesso ao simulado.");
        return;
      }

      abrirModal(access);
    });

    // Start simulado (canônico)
    window.addEventListener("liora:start-simulado", () => {
      info("Evento liora:start-simulado recebido");
      iniciarSimulado();
    });

    // Binds locais
    bindStartButton();
    bindNav();

    info("Listeners OK ✅");
  }

  // -------------------------------------------------
  // BOOT
  // -------------------------------------------------
  whenDomReady(() => {
    try {
      registerListeners();
    } catch (e) {
      console.error("🔴 [Simulados] erro ao registrar listeners:", e);
      hardFail("Falha ao inicializar módulo de simulados.");
    }
  });

})();
