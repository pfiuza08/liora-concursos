// ==========================================================
// 🧠 LIORA — PLANOS & SESSÕES (RESTORE PIPELINE)
// Listener central: liora:gerar-plano → API → salvar → render
// Versão: v1.0-RESTORE
// ==========================================================

console.log("🧠 planos-sessoes v1.0-RESTORE carregado");

(function () {
  const qs = (id) => document.getElementById(id);

  // ----------------------------------------------------------
  // UI helpers (fallbacks gentis)
  // ----------------------------------------------------------
  function showLoading(msg = "Gerando…") {
    if (window.lioraLoading?.show) return window.lioraLoading.show(msg);

    let el = qs("liora-loading-fallback");
    if (!el) {
      el = document.createElement("div");
      el.id = "liora-loading-fallback";
      el.style.position = "fixed";
      el.style.inset = "0";
      el.style.background = "rgba(0,0,0,.35)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.zIndex = "9999";
      el.innerHTML = `
        <div style="background:#111;color:#fff;padding:14px 16px;border-radius:12px;font:600 14px/1.2 Inter,system-ui">
          <span id="liora-loading-text">${msg}</span>
        </div>`;
      document.body.appendChild(el);
    } else {
      qs("liora-loading-text").textContent = msg;
      el.style.display = "flex";
    }
  }

  function hideLoading() {
    if (window.lioraLoading?.hide) return window.lioraLoading.hide();
    const el = qs("liora-loading-fallback");
    if (el) el.style.display = "none";
  }

  function showError(msg) {
    if (window.lioraError?.show) return window.lioraError.show(msg);
    alert(msg);
  }

  // ----------------------------------------------------------
  // Store (window.lioraEstudos) — garante persistência mínima
  // ----------------------------------------------------------
  window.lioraEstudos = window.lioraEstudos || {
    plano: null,
    sessoes: [],
    origem: null,
    meta: {},

    salvar(plano, sessoes, origem, meta = {}) {
      this.plano = plano || null;
      this.sessoes = Array.isArray(sessoes) ? sessoes : [];
      this.origem = origem || null;
      this.meta = meta || {};

      localStorage.setItem("liora:plano", JSON.stringify(this.plano));
      localStorage.setItem("liora:sessoes", JSON.stringify(this.sessoes));
      localStorage.setItem("liora:origem", JSON.stringify(this.origem));
      localStorage.setItem("liora:meta", JSON.stringify(this.meta));
    },

    carregar() {
      try {
        this.plano = JSON.parse(localStorage.getItem("liora:plano") || "null");
        this.sessoes = JSON.parse(localStorage.getItem("liora:sessoes") || "[]");
        this.origem = JSON.parse(localStorage.getItem("liora:origem") || "null");
        this.meta = JSON.parse(localStorage.getItem("liora:meta") || "{}");
      } catch (_) {}
    }
  };

  window.lioraEstudos.carregar();

  // ----------------------------------------------------------
  // Render (fallback): injeta uma área de sessões no workspace
  // ----------------------------------------------------------
   function ensureSessoesArea() {
    const painelEstudo = document.getElementById("painel-estudo");
    if (!painelEstudo) return null;
  
    let area = document.getElementById("area-sessoes");
    if (!area) {
      area = document.createElement("div");
      area.id = "area-sessoes";
      area.className = "hidden space-y-4 max-w-3xl";
  
      area.innerHTML = `
        <h3 class="section-title">Sessões</h3>
  
        <div id="liora-plano-resumo"
             class="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        </div>
  
        <div id="liora-sessoes-lista"
             class="grid gap-3">
        </div>
      `;
  
      painelEstudo.appendChild(area);
    }
  
    return area;
  }


  function renderPlanoESessoes() {
    const area = ensureSessoesArea();
    if (!area) return;

    const resumo = qs("liora-plano-resumo");
    const lista = qs("liora-sessoes-lista");
    if (!resumo || !lista) return;

    const { plano, sessoes, origem, meta } = window.lioraEstudos;

    resumo.innerHTML = `
      <div class="text-sm text-[var(--muted)]">Origem: <b>${origem || "-"}</b></div>
      <div class="mt-2 text-base font-semibold">${(meta?.titulo || plano?.titulo || meta?.tema || "Plano gerado")}</div>
      <div class="text-sm text-[var(--muted)] mt-1">
        ${(meta?.nivel ? `Nível: <b>${meta.nivel}</b> · ` : "")}
        Sessões: <b>${Array.isArray(sessoes) ? sessoes.length : 0}</b>
      </div>
    `;

    lista.innerHTML = "";

    (sessoes || []).forEach((s, i) => {
     const status = window.lioraStudy.statusSessao(s, i);

      const card = document.createElement("button");
      card.type = "button";
      card.className = `
        text-left p-4 rounded-xl border
        border-[var(--border)]
        bg-[var(--card)]
        hover:opacity-95
        flex items-center justify-between gap-4
      `;
      
      const badge =
        status === "concluida"
          ? `<span class="text-xs px-2 py-1 rounded-full bg-green-600 text-white">Concluída</span>`
          : status === "em_andamento"
          ? `<span class="text-xs px-2 py-1 rounded-full bg-yellow-500 text-black">Em andamento</span>`
          : `<span class="text-xs px-2 py-1 rounded-full bg-gray-600 text-white">Pendente</span>`;
      
      const titulo = s?.titulo || s?.title || `Sessão ${i + 1}`;
      
      card.innerHTML = `
        <div>
          <div class="font-semibold">${titulo}</div>
          <div class="text-sm text-[var(--muted)] mt-1">${badge}</div>
        </div>
        <div class="text-xs text-[var(--muted)]">Abrir</div>
      `;

      // Evento canônico para “abrir sessão”
      card.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("liora:abrir-sessao", {
          detail: { index: i, sessao: s }
        }));
      });

      lista.appendChild(card);
    });

    // Mostra só a área de sessões dentro do painel estudo
    qs("painel-tema")?.classList.add("hidden");
    qs("painel-upload")?.classList.add("hidden");
    area.classList.remove("hidden");

    // Garante que estamos no workspace
    window.dispatchEvent(new Event("liora:open-workspace"));
  }

  // ----------------------------------------------------------
  // API calls (assumidas pelas tuas versões anteriores)
  // ----------------------------------------------------------
  async function callGerarPlanoTema({ tema, nivel }) {
    const res = await fetch("/api/gerarPlano.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tema, nivel })
    });

    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

    if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    return data;
  }

  async function callGerarPlanoPDF({ file }) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/liora", { // ajuste aqui se seu endpoint for outro
      method: "POST",
      body: fd
    });

    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

    if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    return data;
  }

  // Normaliza diferentes formatos de resposta
  function normalizeResponse(origem, payloadMeta, data) {
  const plano =
    data?.plano ||
    data?.plan ||
    data?.resultado?.plano ||
    data?.data?.plano ||
    data;

  let sessoes =
    data?.sessoes ||
    data?.sessions ||
    data?.resultado?.sessoes ||
    data?.data?.sessoes ||
    plano?.sessoes ||
    [];

  // --------------------------------------------------
  // 🛟 FALLBACK — cria sessões mínimas se vier vazio
  // --------------------------------------------------
  if (!Array.isArray(sessoes) || sessoes.length === 0) {
    console.warn("⚠️ Sessões ausentes. Gerando fallback mínimo.");

    const baseTitulo =
      plano?.titulo ||
      plano?.title ||
      payloadMeta?.tema ||
      "Sessão";

    const qtd = 5;

    sessoes = Array.from({ length: qtd }).map((_, i) => ({
      id: `auto-${i + 1}`,
      titulo: `${baseTitulo} — Parte ${i + 1}`,
      topicos: [],
      origem: "fallback"
    }));
  }

  const meta = {
    ...payloadMeta,
    titulo:
      plano?.titulo ||
      plano?.title ||
      payloadMeta?.tema ||
      "Plano"
  };

  return { plano, sessoes, meta };
}

  // ----------------------------------------------------------
  // Listener central: liora:gerar-plano
  // ----------------------------------------------------------
  window.addEventListener("liora:gerar-plano", async (e) => {
    const origem = e?.detail?.origem;
    const payload = e?.detail?.payload || {};

    console.log("🧠 Evento recebido: liora:gerar-plano", { origem, payload });

    // Regras básicas de acesso (se você quiser exigir login, ativa aqui)
    // if (!window.lioraAuth?.user) {
    //   window.dispatchEvent(new Event("liora:open-auth"));
    //   return;
    // }

    try {
      showLoading(origem === "pdf" ? "Lendo PDF e gerando sessões…" : "Gerando plano e sessões…");

      let data;
      if (origem === "tema") {
        data = await callGerarPlanoTema(payload);
      } else if (origem === "pdf") {
        data = await callGerarPlanoPDF(payload);
      } else {
        throw new Error("Origem inválida para geração.");
      }

      const metaBase = origem === "tema"
        ? { tema: payload.tema, nivel: payload.nivel }
        : { arquivo: payload?.file?.name };

      const { plano, sessoes, meta } = normalizeResponse(origem, metaBase, data);

      window.lioraEstudos.salvar(plano, sessoes, origem, meta);

      console.log("✅ Plano e sessões salvos", { plano, sessoesQtd: (sessoes || []).length });

      // Render imediato (fallback)
      renderPlanoESessoes();

      // Evento canônico para outros módulos (Study Manager, etc.)
      window.dispatchEvent(new CustomEvent("liora:plano-gerado", {
        detail: { origem, plano: window.lioraEstudos.plano, sessoes: window.lioraEstudos.sessoes, meta: window.lioraEstudos.meta }
      }));

    } catch (err) {
      console.error("❌ Erro ao gerar plano/sessões:", err);
      showError(err?.message || "Erro ao gerar plano/sessões.");
    } finally {
      hideLoading();
    }
  });

  // ----------------------------------------------------------
  // Open workspace handler (caso ainda não exista)
  // ----------------------------------------------------------
  window.addEventListener("liora:open-workspace", () => {
    // Se você já tiver roteador, ele pode ignorar isso.
    qs("liora-home")?.classList.remove("is-active");
    qs("liora-app")?.classList.add("is-active");

    qs("painel-estudo")?.classList.remove("hidden");
    qs("fab-home")?.classList.remove("hidden");
  });

  // ----------------------------------------------------------
// 📖 Render de Sessão (v1)
// ----------------------------------------------------------
function renderSessao(sessao, index) {
  const painelEstudo = document.getElementById("painel-estudo");
  if (!painelEstudo) return;

  let area = document.getElementById("area-sessao");
  if (!area) {
    area = document.createElement("div");
    area.id = "area-sessao";
    area.className = "space-y-6 max-w-3xl";
    painelEstudo.appendChild(area);
  }

  area.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="btn-voltar-sessoes"
              class="btn-secondary text-sm">
        ← Sessões
      </button>

      <span class="text-sm text-[var(--muted)]">
        Sessão ${index + 1}
      </span>
    </div>

    <h3 class="section-title">
      ${sessao.titulo || "Sessão"}
    </h3>

    <div class="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3">
      <p class="text-sm text-[var(--muted)]">
        Origem: <b>${sessao.origem || "IA"}</b>
      </p>

      <p class="text-base">
        Conteúdo da sessão ainda em construção.
        <br>
        Esta área será integrada ao <b>Study Manager</b>.
      </p>
    </div>
  `;

  // esconde lista de sessões
  document.getElementById("area-sessoes")?.classList.add("hidden");

  // mostra sessão
  area.classList.remove("hidden");

  // botão voltar
  document
    .getElementById("btn-voltar-sessoes")
    ?.addEventListener("click", () => {
      area.classList.add("hidden");
      document.getElementById("area-sessoes")?.classList.remove("hidden");
    });
}
// ----------------------------------------------------------
// 📌 Abrir Sessão + Study Manager
// ----------------------------------------------------------
window.addEventListener("liora:abrir-sessao", (e) => {
  const { sessao, index } = e.detail || {};
  if (!sessao) return;

  console.log("📖 Abrindo sessão (Study Manager)", index, sessao);

  // registra início da sessão
  window.lioraStudy.iniciarSessao(sessao, index);

  // renderiza a sessão
  renderSessao(sessao, index);
});


// ----------------------------------------------------------
// 📚 Study Manager v1 — estado e persistência
// ----------------------------------------------------------
window.lioraStudy = window.lioraStudy || {
  estado: {
    sessaoAtual: null,
    progresso: {} // { sessaoId: { status, startedAt, finishedAt } }
  },

  carregar() {
    try {
      const raw = JSON.parse(localStorage.getItem("liora:study") || "{}");
      this.estado = {
        sessaoAtual: raw.sessaoAtual || null,
        progresso: raw.progresso || {}
      };
    } catch (_) {}
  },

  salvar() {
    localStorage.setItem("liora:study", JSON.stringify(this.estado));
  },

  iniciarSessao(sessao, index) {
    const id = sessao.id || `sessao-${index}`;
    this.estado.sessaoAtual = id;

    if (!this.estado.progresso[id]) {
      this.estado.progresso[id] = {
        status: "em_andamento",
        startedAt: Date.now()
      };
    } else {
      this.estado.progresso[id].status = "em_andamento";
    }

    this.salvar();
  },

  concluirSessao(sessao, index) {
    const id = sessao.id || `sessao-${index}`;
    if (!this.estado.progresso[id]) return;

    this.estado.progresso[id].status = "concluida";
    this.estado.progresso[id].finishedAt = Date.now();
    this.estado.sessaoAtual = null;

    this.salvar();
  },

  statusSessao(sessao, index) {
    const id = sessao.id || `sessao-${index}`;
    return this.estado.progresso[id]?.status || "pendente";
  }
};

window.lioraStudy.carregar();




  
})();
