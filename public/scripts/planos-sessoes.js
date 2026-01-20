// ==========================================================
// 🧠 LIORA — PLANOS & SESSÕES + STUDY MANAGER (FULL)
// Versão: v2.2-STUDY-TIME-CONTENT
// - liora:gerar-plano → API → salvar → render
// - Fallback de sessões se API não retornar
// - Study Manager: status + conteúdo + tempo
// - Progresso do plano (%)
// - Tempo total do plano
// ==========================================================

console.log("🧠 planos-sessoes v2.2-STUDY-TIME-CONTENT carregado");

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
      const t = qs("liora-loading-text");
      if (t) t.textContent = msg;
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
  // Store de estudo (plano/sessões)
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
  // 📚 Study Manager v2 — status, tempo e conteúdo
  // ----------------------------------------------------------
  function _getSessaoKey(sessao, index) {
  const planoId = window.lioraEstudos?.meta?.planoId || "plano";
  const sessaoId = sessao?.id || `sessao-${index}`;
  return `${planoId}::${sessaoId}`;
  }


  function _acumularTempo(id) {
    const p = window.lioraStudy.estado.progresso[id];
    if (!p) return;

    const now = Date.now();
    const startedAt = p.startedAt;

    if (typeof startedAt === "number" && startedAt > 0) {
      const delta = now - startedAt;
      if (delta > 0 && Number.isFinite(delta)) {
        p.totalTime = (p.totalTime || 0) + delta;
      }
    }

    p.startedAt = null;
  }

  window.lioraStudy = window.lioraStudy || {
    estado: {
      sessaoAtual: null,
      progresso: {}, // { id: { status, startedAt, finishedAt, totalTime } }
      conteudo: {}   // { id: "<html>" }
    },

    carregar() {
      try {
        const raw = JSON.parse(localStorage.getItem("liora:study") || "{}");
        this.estado = {
          sessaoAtual: raw.sessaoAtual || null,
          progresso: raw.progresso || {},
          conteudo: raw.conteudo || {}
        };
      } catch (_) {}
    },

    salvar() {
      localStorage.setItem("liora:study", JSON.stringify(this.estado));
    },

     iniciarSessao(sessao, index) {
        const key = _getSessaoKey(sessao, index);
        this.estado.sessaoAtual = key;
      
        if (!this.estado.progresso[key]) {
          this.estado.progresso[key] = {
            status: "em_andamento",
            startedAt: Date.now(),
            totalTime: 0
          };
        } else {
          const p = this.estado.progresso[key];
          p.status = "em_andamento";
          p.startedAt = Date.now();
          if (typeof p.totalTime !== "number") p.totalTime = 0;
        }
      
        this.salvar();
      }

     concluirSessao(sessao, index) {
        const key = _getSessaoKey(sessao, index);
      
        // garante registro mesmo se iniciarSessao não tiver sido chamado
        if (!this.estado.progresso[key]) {
          this.estado.progresso[key] = {
            status: "em_andamento",
            startedAt: Date.now(),
            totalTime: 0
          };
        }
      
        _acumularTempo(key);
      
        const p = this.estado.progresso[key];
        p.status = "concluida";
        p.finishedAt = Date.now();
      
        this.estado.sessaoAtual = null;
        this.salvar();
      }


    statusSessao(sessao, index) {
    const key = _getSessaoKey(sessao, index);
    return this.estado.progresso[key]?.status || "pendente";
   }

    tempoSessao(sessao, index) {
      const key = _getSessaoKey(sessao, index);
      const p = this.estado.progresso[key];
      return (p?.totalTime || 0);
    }

    salvarConteudo(sessao, index, texto) {
    const key = _getSessaoKey(sessao, index);
    this.estado.conteudo[key] = texto;
    this.salvar();
    },
  
    obterConteudo(sessao, index) {
    const key = _getSessaoKey(sessao, index);
    return this.estado.conteudo[key] || null;
    }

  };

  window.lioraStudy.carregar();

  // ----------------------------------------------------------
  // Render containers
  // ----------------------------------------------------------
  function ensureSessoesArea() {
    const painelEstudo = qs("painel-estudo");
    if (!painelEstudo) return null;

    let area = qs("area-sessoes");
    if (!area) {
      area = document.createElement("div");
      area.id = "area-sessoes";
      area.className = "hidden space-y-4 max-w-3xl";
      area.innerHTML = `
        <h3 class="section-title">Sessões</h3>
        <div id="liora-plano-resumo" class="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]"></div>
        <div id="liora-sessoes-lista" class="grid gap-3"></div>
      `;
      painelEstudo.appendChild(area);
    }

    return area;
  }

  // ----------------------------------------------------------
  // 📈 Progresso do Plano
  // ----------------------------------------------------------
  function calcProgressoPlano() {
    const sessoes = window.lioraEstudos?.sessoes || [];
    const total = sessoes.length || 0;

    let concluidas = 0;
    for (let i = 0; i < total; i++) {
      const s = sessoes[i];
      const st = window.lioraStudy?.statusSessao?.(s, i) || "pendente";
      if (st === "concluida") concluidas++;
    }

    const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    return { total, concluidas, pct };
  }

  // ----------------------------------------------------------
  // ⏱️ Tempo total do plano
  // ----------------------------------------------------------
  function tempoTotalPlano() {
    const sessoes = window.lioraEstudos?.sessoes || [];
    let total = 0;
    sessoes.forEach((s, i) => {
      total += window.lioraStudy.tempoSessao(s, i);
    });
    return total; // ms
  }

  // ----------------------------------------------------------
  // Render lista de sessões + resumo
  // ----------------------------------------------------------
  function renderPlanoESessoes() {
    const area = ensureSessoesArea();
    if (!area) return;

    const resumo = qs("liora-plano-resumo");
    const lista = qs("liora-sessoes-lista");
    if (!resumo || !lista) return;

    const { plano, sessoes, origem, meta } = window.lioraEstudos;

    const prog = calcProgressoPlano();
    const tempoMin = Math.round(tempoTotalPlano() / 60000);

    resumo.innerHTML = `
      <div class="text-sm text-[var(--muted)]">Origem: <b>${origem || "-"}</b></div>

      <div class="mt-2 text-base font-semibold">
        ${(meta?.titulo || plano?.titulo || meta?.tema || "Plano gerado")}
      </div>

      <div class="text-sm text-[var(--muted)] mt-1">
        ${(meta?.nivel ? `Nível: <b>${meta.nivel}</b> · ` : "")}
        Sessões: <b>${prog.total}</b>
        · Concluídas: <b>${prog.concluidas}</b>
        · Progresso: <b>${prog.pct}%</b>
        · Tempo estudado: <b>${tempoMin} min</b>
      </div>

      <div class="mt-3 h-2 rounded-full bg-black/30 overflow-hidden">
        <div class="h-2 rounded-full bg-[var(--brand)]" style="width:${prog.pct}%"></div>
      </div>
    `;

    lista.innerHTML = "";

    (sessoes || []).forEach((s, i) => {
      const status = window.lioraStudy.statusSessao(s, i);

      const badge =
        status === "concluida"
          ? `<span class="text-xs px-2 py-1 rounded-full bg-green-600 text-white">Concluída</span>`
          : status === "em_andamento"
          ? `<span class="text-xs px-2 py-1 rounded-full bg-yellow-500 text-black">Em andamento</span>`
          : `<span class="text-xs px-2 py-1 rounded-full bg-gray-600 text-white">Pendente</span>`;

      const titulo = s?.titulo || s?.title || `Sessão ${i + 1}`;

      const card = document.createElement("button");
      card.type = "button";
      card.className = `
        text-left p-4 rounded-xl border
        border-[var(--border)]
        bg-[var(--card)]
        hover:opacity-95
        flex items-center justify-between gap-4
      `;

      card.innerHTML = `
        <div>
          <div class="font-semibold">${titulo}</div>
          <div class="text-sm text-[var(--muted)] mt-1">${badge}</div>
        </div>
        <div class="text-xs text-[var(--muted)]">Abrir</div>
      `;

      card.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("liora:abrir-sessao", {
          detail: { index: i, sessao: s }
        }));
      });

      lista.appendChild(card);
    });

    // mostra apenas a área de sessões dentro do painel estudo
    qs("painel-tema")?.classList.add("hidden");
    qs("painel-upload")?.classList.add("hidden");
    area.classList.remove("hidden");

    // garante workspace
    window.dispatchEvent(new Event("liora:open-workspace"));
  }

  // ----------------------------------------------------------
  // 📖 Render de Sessão (Study + tempo + conteúdo)
  // ----------------------------------------------------------
  function renderSessao(sessao, index) {
    const painelEstudo = qs("painel-estudo");
    if (!painelEstudo) return;

    let area = qs("area-sessao");
    if (!area) {
      area = document.createElement("div");
      area.id = "area-sessao";
      area.className = "space-y-6 max-w-3xl";
      painelEstudo.appendChild(area);
    }

    const statusAtual = window.lioraStudy?.statusSessao(sessao, index) || "pendente";
    const tempoMin = Math.round((window.lioraStudy.tempoSessao(sessao, index) || 0) / 60000);

    area.innerHTML = `
      <div class="flex items-center gap-3">
        <button id="btn-voltar-sessoes" class="btn-secondary text-sm">← Sessões</button>

        <span class="text-sm text-[var(--muted)]">Sessão ${index + 1}</span>

        <span class="ml-2 text-xs px-2 py-1 rounded-full
          ${statusAtual === "concluida"
            ? "bg-green-600 text-white"
            : statusAtual === "em_andamento"
            ? "bg-yellow-500 text-black"
            : "bg-gray-600 text-white"}">
          ${statusAtual === "concluida"
            ? "Concluída"
            : statusAtual === "em_andamento"
            ? "Em andamento"
            : "Pendente"}
        </span>
      </div>

      <h3 class="section-title">${sessao.titulo || "Sessão"}</h3>

      <div class="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4">
        <p class="text-sm text-[var(--muted)]">
          Origem: <b>${sessao.origem || "IA"}</b>
          <span class="mx-2">·</span>
          Tempo estudado: <b>${tempoMin} min</b>
        </p>

        <div id="sessao-conteudo" class="text-base leading-relaxed text-[var(--text)]">
          <span class="text-sm text-[var(--muted)]">Carregando conteúdo…</span>
        </div>

        ${
          statusAtual !== "concluida"
            ? `<button id="btn-concluir-sessao" class="btn-primary w-full">Concluir sessão</button>`
            : `<p class="text-sm text-green-500 font-medium">✔ Sessão concluída</p>`
        }
      </div>
    `;

    // esconde lista de sessões
    qs("area-sessoes")?.classList.add("hidden");

    // mostra sessão
    area.classList.remove("hidden");

    // voltar
    qs("btn-voltar-sessoes")?.addEventListener("click", () => {
      area.classList.add("hidden");
      qs("area-sessoes")?.classList.remove("hidden");
      renderPlanoESessoes();
    });

    // concluir
    qs("btn-concluir-sessao")?.addEventListener("click", () => {
      window.lioraStudy.concluirSessao(sessao, index);

      area.classList.add("hidden");
      qs("area-sessoes")?.classList.remove("hidden");

      renderPlanoESessoes();
    });

    // conteúdo (cache → IA)
    const container = qs("sessao-conteudo");
    if (container) {
      const cached = window.lioraStudy.obterConteudo(sessao, index);
      if (cached) {
        container.innerHTML = cached;
      } else {
        container.innerHTML = `<span class="text-sm text-[var(--muted)]">Gerando conteúdo…</span>`;
        gerarConteudoSessaoIA(sessao, index)
          .then((html) => {
            container.innerHTML = html;
            window.lioraStudy.salvarConteudo(sessao, index, html);
          })
          .catch((err) => {
            console.error(err);
            container.innerHTML = `<p class="text-red-500">Erro ao gerar conteúdo da sessão.</p>`;
          });
      }
    }
  }

  // ----------------------------------------------------------
  // 🤖 IA — Conteúdo da Sessão (endpoint)
  // ----------------------------------------------------------
  async function gerarConteudoSessaoIA(sessao, index) {
    const plano = window.lioraEstudos?.plano;
    const meta = window.lioraEstudos?.meta || {};

    const payload = {
      planoTitulo: meta?.titulo || plano?.titulo || meta?.tema || "Plano de estudo",
      nivel: meta?.nivel || "iniciante",
      sessaoTitulo: sessao?.titulo || `Sessão ${index + 1}`,
      indice: index + 1
    };

    const res = await fetch("/api/gerarSessao.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

    if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);

    return data?.conteudo || data?.texto || data?.raw || "Conteúdo indisponível.";
  }

  // ----------------------------------------------------------
  // API calls (Tema/PDF)
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

    const res = await fetch("/api/liora", {
      method: "POST",
      body: fd
    });

    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

    if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    return data;
  }

  // ----------------------------------------------------------
  // Normaliza resposta (com fallback de sessões)
  // ----------------------------------------------------------
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

    if (!Array.isArray(sessoes) || sessoes.length === 0) {
      console.warn("⚠️ Sessões ausentes. Gerando fallback mínimo.");

      const baseTitulo =
        plano?.titulo ||
        plano?.title ||
        payloadMeta?.tema ||
        payloadMeta?.titulo ||
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
      titulo: plano?.titulo || plano?.title || payloadMeta?.tema || "Plano"
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

    try {
      showLoading(origem === "pdf" ? "Lendo PDF e gerando sessões..." : "Gerando plano e sessões...");

      let data;
      if (origem === "tema") data = await callGerarPlanoTema(payload);
      else if (origem === "pdf") data = await callGerarPlanoPDF(payload);
      else throw new Error("Origem inválida para geração.");

      const metaBase = origem === "tema"
        ? { tema: payload.tema, nivel: payload.nivel }
        : { arquivo: payload?.file?.name };

      const { plano, sessoes, meta } = normalizeResponse(origem, metaBase, data);

      // 🔑 ID único do plano (isola cache)
      const planoId = `plano-${Date.now()}`;
      
      window.lioraEstudos.salvar(plano, sessoes, origem, {
        ...meta,
        planoId
      });
      
      // 🧹 limpa conteúdo de sessões anteriores
      window.lioraStudy.estado.conteudo = {};
      window.lioraStudy.salvar();

      console.log("✅ Plano e sessões salvos", { sessoesQtd: (sessoes || []).length });

      renderPlanoESessoes();

      window.dispatchEvent(new CustomEvent("liora:plano-gerado", {
        detail: {
          origem,
          plano: window.lioraEstudos.plano,
          sessoes: window.lioraEstudos.sessoes,
          meta: window.lioraEstudos.meta
        }
      }));
    } catch (err) {
      console.error("❌ Erro ao gerar plano/sessões:", err);
      showError(err?.message || "Erro ao gerar plano/sessões.");
    } finally {
      hideLoading();
    }
  });

  // ----------------------------------------------------------
  // Abrir sessão (canônico) + Study Manager
  // ----------------------------------------------------------
  window.addEventListener("liora:abrir-sessao", (e) => {
    const { sessao, index } = e.detail || {};
    if (!sessao) return;

    console.log("📖 Abrindo sessão (Study Manager)", index, sessao);

    window.lioraStudy.iniciarSessao(sessao, index);
    renderSessao(sessao, index);
  });

  // ----------------------------------------------------------
  // Open workspace handler (caso não exista)
  // ----------------------------------------------------------
  window.addEventListener("liora:open-workspace", () => {
    qs("liora-home")?.classList.remove("is-active");
    qs("liora-app")?.classList.add("is-active");

    qs("painel-estudo")?.classList.remove("hidden");
    qs("fab-home")?.classList.remove("hidden");
  });

})();
