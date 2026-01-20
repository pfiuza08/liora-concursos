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
  // ✍️ Reflexão da Sessão — helpers
  // ----------------------------------------------------------
  function salvarReflexaoSessao(sessao, index, dados) {
    const key = _getSessaoKey(sessao, index);
    const atual = window.lioraStudy.estado.conteudo[key] || {};
    window.lioraStudy.estado.conteudo[key] = {
      ...atual,
      reflexao: dados
    };
    window.lioraStudy.salvar();
  }
  
  function obterReflexaoSessao(sessao, index) {
    const key = _getSessaoKey(sessao, index);
    return window.lioraStudy.estado.conteudo[key]?.reflexao || {
      q1: "",
      q2: "",
      notas: ""
    };
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
  
  function _acumularTempo(key) {
    const p = window.lioraStudy.estado.progresso[key];
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
      progresso: {},
      conteudo: {},
      streak: {
        atual: 0,
        recorde: 0,
        ultimaData: null
      }
    },

   carregar() {
      try {
        const raw = JSON.parse(localStorage.getItem("liora:study") || "{}");
        this.estado = {
          sessaoAtual: raw.sessaoAtual || null,
          progresso: raw.progresso || {},
          conteudo: raw.conteudo || {},
          streak: raw.streak || { atual: 0, recorde: 0, ultimaData: null }
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
    },
  
    concluirSessao(sessao, index) {
      const key = _getSessaoKey(sessao, index);
  
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
      this.atualizarStreakHoje();
      this.salvar();
    },
  
    statusSessao(sessao, index) {
      const key = _getSessaoKey(sessao, index);
      return this.estado.progresso[key]?.status || "pendente";
    },
  
    tempoSessao(sessao, index) {
      const key = _getSessaoKey(sessao, index);
      return this.estado.progresso[key]?.totalTime || 0;
    },
  
    salvarConteudo(sessao, index, texto) {
      const key = _getSessaoKey(sessao, index);
      this.estado.conteudo[key] = texto;
      this.salvar();
    },
  
    obterConteudo(sessao, index) {
      const key = _getSessaoKey(sessao, index);
      return this.estado.conteudo[key] || null;
    },

    atualizarStreakHoje() {
    const hoje = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const s = this.estado.streak;
  
    if (s.ultimaData === hoje) {
      return; // já contou hoje
    }
  
    if (s.ultimaData) {
      const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  
      if (s.ultimaData === ontem) {
        s.atual += 1;
      } else {
        s.atual = 1;
      }
    } else {
      s.atual = 1;
    }
  
    if (s.atual > s.recorde) {
      s.recorde = s.atual;
    }
  
    s.ultimaData = hoje;
    this.salvar();
  },
  
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

    const streak = window.lioraStudy.estado.streak;

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
        · 🔥 Streak: <b>${streak.atual} dias</b>
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
    // 📖 Render de Sessão v2 — conteúdo + reflexão + dashboard
    // ----------------------------------------------------------
    async function renderSessao(sessao, index) {
      const painelEstudo = document.getElementById("painel-estudo");
      if (!painelEstudo) return;
    
      let area = document.getElementById("area-sessao");
      if (!area) {
        area = document.createElement("div");
        area.id = "area-sessao";
        area.className = "space-y-6 max-w-3xl";
        painelEstudo.appendChild(area);
      }
    
      // esconde lista de sessões imediatamente
      document.getElementById("area-sessoes")?.classList.add("hidden");
      area.classList.remove("hidden");
    
      // marca início da sessão (tempo + status)
      window.lioraStudy?.iniciarSessao?.(sessao, index);
    
      // --------------------------------------------------
      // Conteúdo da sessão (cache first)
      // --------------------------------------------------
      let conteudo = window.lioraStudy.obterConteudo(sessao, index);
    
      if (!conteudo) {
        area.innerHTML = `
          <p class="text-sm text-[var(--muted)]">
            Gerando conteúdo da sessão...
          </p>
        `;
    
        conteudo = await gerarConteudoSessao(
          sessao,
          window.lioraEstudos?.meta
        );
    
        window.lioraStudy.salvarConteudo(sessao, index, conteudo);
      }
    
      // --------------------------------------------------
      // Reflexão — carregar estado salvo
      // --------------------------------------------------
      const reflexao = obterReflexaoSessao(sessao, index);
    
      // --------------------------------------------------
      // Render FINAL (único)
      // --------------------------------------------------
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
    
        <div class="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-6">
    
          ${conteudo}
    
          <hr class="opacity-30">
    
          <section class="space-y-3">
            <h5 class="font-semibold">Reflexão</h5>
    
            <label class="block text-sm">
              1. Como você explicaria este conteúdo com suas próprias palavras?
            </label>
            <textarea id="ref-q1"
                      rows="3"
                      class="w-full"
                      placeholder="Escreva livremente..."></textarea>
    
            <label class="block text-sm">
              2. Qual parte ficou menos clara ou merece revisão?
            </label>
            <textarea id="ref-q2"
                      rows="3"
                      class="w-full"
                      placeholder="Identifique pontos de dúvida..."></textarea>
    
            <label class="block text-sm">
              Anotações pessoais
            </label>
            <textarea id="ref-notas"
                      rows="4"
                      class="w-full"
                      placeholder="Use este espaço como quiser..."></textarea>
    
            <div class="text-xs text-[var(--muted)]">
              Suas reflexões ficam salvas nesta sessão.
            </div>
          </section>
    
        </div>
    
        <div class="flex justify-end gap-3">
          <button id="btn-concluir-sessao"
                  class="btn-primary">
            Concluir sessão
          </button>
        </div>
      `;

  // --------------------------------------------------
  // Reflexão — preencher e persistir
  // --------------------------------------------------
  const q1 = document.getElementById("ref-q1");
  const q2 = document.getElementById("ref-q2");
  const notas = document.getElementById("ref-notas");

  if (q1 && q2 && notas) {
    q1.value = reflexao.q1 || "";
    q2.value = reflexao.q2 || "";
    notas.value = reflexao.notas || "";

    const salvar = () => {
      salvarReflexaoSessao(sessao, index, {
        q1: q1.value,
        q2: q2.value,
        notas: notas.value
      });
    };

    q1.addEventListener("blur", salvar);
    q2.addEventListener("blur", salvar);
    notas.addEventListener("blur", salvar);
  }

  // --------------------------------------------------
  // Voltar
  // --------------------------------------------------
  document
    .getElementById("btn-voltar-sessoes")
    ?.addEventListener("click", () => {
      area.classList.add("hidden");
      document.getElementById("area-sessoes")?.classList.remove("hidden");
    });

  // --------------------------------------------------
  // Concluir sessão
  // --------------------------------------------------
  document
    .getElementById("btn-concluir-sessao")
    ?.addEventListener("click", () => {
      window.lioraStudy?.concluirSessao?.(sessao, index);
      area.classList.add("hidden");
      document.getElementById("area-sessoes")?.classList.remove("hidden");

      // atualiza plano e dashboard
      window.renderPlanoESessoes?.();
      window.lioraDashboard?.atualizar?.();
    });
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
  // 🧠 Geração de Conteúdo da Sessão (v2 — estruturado)
  // ----------------------------------------------------------
  async function gerarConteudoSessao(sessao, meta) {
    const tituloSessao = sessao.titulo || "Sessão de Estudo";
    const tema = meta?.tema || meta?.titulo || "Tema";
  
    return `
      <section class="space-y-4">
  
        <h4 class="text-lg font-semibold">
          ${tituloSessao}
        </h4>
  
        <p>
          Nesta sessão, você irá estudar um dos blocos fundamentais de
          <b>${tema}</b>. O objetivo aqui é construir uma compreensão
          clara dos conceitos, sem pressa, antes de avançar para aplicações
          mais complexas.
        </p>
  
        <hr class="opacity-30">
  
        <h5 class="font-semibold">
          📌 Conceito central
        </h5>
  
        <p>
          Todo estudo começa pela compreensão do conceito central.
          Em <b>${tema}</b>, isso significa entender <i>o que é</i>,
          <i>para que serve</i> e <i>em que contexto</i> esse conteúdo é aplicado.
        </p>
  
        <p>
          Não tente memorizar definições neste momento.
          Foque em compreender a ideia geral e como ela se conecta
          com o que você já sabe.
        </p>
  
        <hr class="opacity-30">
  
        <h5 class="font-semibold">
          🧩 Desdobramento do conceito
        </h5>
  
        <ul class="list-disc list-inside space-y-1">
          <li>Quais problemas esse conceito ajuda a resolver</li>
          <li>Quais são seus elementos principais</li>
          <li>Como ele aparece na prática</li>
        </ul>
  
        <p>
          Esses pontos formam a base para estudos mais aprofundados
          nas próximas sessões.
        </p>
  
        <hr class="opacity-30">
  
        <h5 class="font-semibold">
          ✏️ Exemplo introdutório
        </h5>
  
        <p>
          Pense em um exemplo simples relacionado a <b>${tema}</b>.
          Mesmo que você ainda não saiba resolver completamente,
          tente identificar onde o conceito estudado aparece.
        </p>
  
        <p>
          Esse exercício mental ajuda o cérebro a criar conexões,
          facilitando a aprendizagem nas próximas etapas.
        </p>
  
        <hr class="opacity-30">
  
        <h5 class="font-semibold">
          ✅ Fechamento da sessão
        </h5>
  
        <p>
          Ao final desta sessão, você deve ser capaz de:
        </p>
  
        <ul class="list-disc list-inside space-y-1">
          <li>Explicar o conceito central com suas próprias palavras</li>
          <li>Reconhecer situações onde ele é aplicado</li>
          <li>Sentir-se preparado para avançar para a próxima sessão</li>
        </ul>
  
      </section>
    `;
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
