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
  // 🗂️ Flashcards — helpers
  // ----------------------------------------------------------
  function salvarFlashcardsSessao(sessao, index, cards) {
    const key = _getSessaoKey(sessao, index);
    const atual = window.lioraStudy.estado.conteudo[key] || {};
    window.lioraStudy.estado.conteudo[key] = {
      ...atual,
      flashcards: cards
    };
    window.lioraStudy.salvar();
  }
  
  function obterFlashcardsSessao(sessao, index) {
    const key = _getSessaoKey(sessao, index);
    return window.lioraStudy.estado.conteudo[key]?.flashcards || null;
  }

// ==========================================================
// Flashcard Engine v2 (spaced repetition leve)
// - Estado por flashcard: novo | aprendizado | revisao | consolidado
// - Métricas: ease, acertos, erros, tempos
// - Próxima revisão: nextReviewAt
// ==========================================================

const LIORA_DAY_MS = 24 * 60 * 60 * 1000;

function _clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function _uid(prefix = "fc") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function _avaliarResposta(acertou, tempoMs) {
  if (!acertou) return "erro";
  const t = Number(tempoMs) || 0;
  if (t > 8000) return "lento";
  if (t > 4000) return "medio";
  return "rapido";
}

function _calcularNextReview(estado, ease) {
  const now = Date.now();
  const e = Number(ease) || 2.5;

  if (estado === "novo") return now + 1 * LIORA_DAY_MS;
  if (estado === "aprendizado") return now + 3 * LIORA_DAY_MS;
  if (estado === "revisao") return now + Math.round(5 * e) * LIORA_DAY_MS;
  if (estado === "consolidado") return now + Math.round(14 * e) * LIORA_DAY_MS;

  return now + 1 * LIORA_DAY_MS;
}

function _atualizarEstado(card) {
  const acertos = Number(card.acertos) || 0;
  const erros = Number(card.erros) || 0;
  const ease = Number(card.ease) || 2.5;

  // queda rápida se errou muito
  if (erros >= 2) return "aprendizado";

  // progressão
  if (acertos >= 6 && ease >= 2.5) return "consolidado";
  if (acertos >= 3 && ease >= 2.2) return "revisao";

  // se já foi revisado pelo menos uma vez e ainda não atingiu limiar, aprendizado
  if (card.lastReviewedAt) return "aprendizado";

  return "novo";
}

function _atualizarEase(easeAtual, resultado) {
  const e = Number.isFinite(Number(easeAtual)) ? Number(easeAtual) : 2.5;

  if (resultado === "erro") return _clamp(e - 0.3, 1.3, 2.8);
  if (resultado === "lento") return _clamp(e - 0.15, 1.3, 2.8);
  if (resultado === "medio") return _clamp(e, 1.3, 2.8);
  if (resultado === "rapido") return _clamp(e + 0.1, 1.3, 2.8);

  return _clamp(e, 1.3, 2.8);
}

function _mediaAtualizada(media, novoValor) {
  const m = Number(media);
  const v = Number(novoValor);
  if (!Number.isFinite(v)) return Number.isFinite(m) ? m : null;
  if (!Number.isFinite(m)) return v;
  return Math.round(((m * 0.7) + (v * 0.3))); // média móvel simples
}

function _getSessaoIds(sessao, index) {
  const planoId = window.lioraEstudos?.meta?.planoId || "plano";
  const sessaoId = sessao?.id || `sessao-${index}`;
  return { planoId, sessaoId };
}

function _normalizarCards(cards, sessao, index) {
  const { planoId, sessaoId } = _getSessaoIds(sessao, index);
  const arr = Array.isArray(cards) ? cards : [];

  return arr.map((c) => {
    const id = c?.id || _uid("fc");
    const pergunta = String(c?.pergunta || "").trim();
    const resposta = String(c?.resposta || "").trim();

    return {
      id,
      planoId,
      sessaoId,
      pergunta,
      resposta,

      ease: Number.isFinite(Number(c?.ease)) ? Number(c.ease) : 2.5,
      acertos: Number(c?.acertos || 0),
      erros: Number(c?.erros || 0),

      lastReviewedAt: c?.lastReviewedAt || null,
      nextReviewAt: c?.nextReviewAt || Date.now(),

      avgResponseTime: c?.avgResponseTime ?? null,
      lastResponseTime: c?.lastResponseTime ?? null,

      estado: c?.estado || "novo"
    };
  }).filter(c => c.pergunta && c.resposta);
}

// ----------------------------------------------------------
// API do Engine
// ----------------------------------------------------------
window.lioraFlashcards = window.lioraFlashcards || {
  // cria flashcards iniciais v2 a partir de uma lista simples [{pergunta,resposta}]
  criarInicial(sessao, index, cardsSimples) {
    const norm = _normalizarCards(cardsSimples, sessao, index).map((c) => {
      c.estado = "novo";
      c.nextReviewAt = Date.now(); // disponíveis imediatamente
      return c;
    });
    return norm;
  },

  // retorna todos flashcards de uma sessão (v2)
  obterDaSessao(sessao, index) {
    const key = _getSessaoKey(sessao, index);
    const bloco = window.lioraStudy?.estado?.conteudo?.[key];
    const cards = bloco?.flashcards || null;
    return Array.isArray(cards) ? _normalizarCards(cards, sessao, index) : null;
  },

  // salva flashcards v2 na sessão
  salvarNaSessao(sessao, index, cardsV2) {
    const key = _getSessaoKey(sessao, index);
    const atual = window.lioraStudy.estado.conteudo[key] || {};
    window.lioraStudy.estado.conteudo[key] = {
      ...atual,
      flashcards: _normalizarCards(cardsV2, sessao, index)
    };
    window.lioraStudy.salvar();
  },

  // registra uma revisão (acerto/erro + tempo) e atualiza métricas
  registrarResposta(sessao, index, cardId, acertou, tempoMs) {
    const cards = this.obterDaSessao(sessao, index) || [];
    const i = cards.findIndex((c) => c.id === cardId);
    if (i < 0) return null;

    const card = cards[i];
    const resultado = _avaliarResposta(!!acertou, tempoMs);

    // contadores
    if (resultado === "erro") card.erros = (Number(card.erros) || 0) + 1;
    else card.acertos = (Number(card.acertos) || 0) + 1;

    // tempos
    card.lastResponseTime = Number(tempoMs) || 0;
    card.avgResponseTime = _mediaAtualizada(card.avgResponseTime, card.lastResponseTime);

    // ease
    card.ease = _atualizarEase(card.ease, resultado);

    // marca review
    card.lastReviewedAt = Date.now();

    // estado e nextReview
    card.estado = _atualizarEstado(card);
    card.nextReviewAt = _calcularNextReview(card.estado, card.ease);

    cards[i] = card;
    this.salvarNaSessao(sessao, index, cards);

    return card;
  },

  // lista cards vencidos por plano (para revisão diária / dashboard)
  listarVencidosDoPlano(planoId) {
    const pid = planoId || window.lioraEstudos?.meta?.planoId || "plano";
    const conteudos = window.lioraStudy?.estado?.conteudo || {};

    const out = [];
    const now = Date.now();

    Object.keys(conteudos).forEach((key) => {
      const bloco = conteudos[key];
      const cards = bloco?.flashcards;
      if (!Array.isArray(cards)) return;

      cards.forEach((c) => {
        if (c?.planoId !== pid) return;
        if ((c?.nextReviewAt || 0) <= now) out.push(c);
      });
    });

    // ordena por mais atrasado primeiro
    out.sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0));
    return out;
  }
};

// ==========================================================
// 📚 Revisão Diária de Flashcards (v1)
// ==========================================================

function abrirRevisaoFlashcards() {
  const painel = document.getElementById("painel-estudo");
  if (!painel) return;

  // cria container se não existir
  let area = document.getElementById("area-revisao");
  if (!area) {
    area = document.createElement("div");
    area.id = "area-revisao";
    area.className = "space-y-6 max-w-3xl";
    painel.appendChild(area);
  }

  // esconde outras áreas
  document.getElementById("area-sessoes")?.classList.add("hidden");
  document.getElementById("area-sessao")?.classList.add("hidden");

  area.classList.remove("hidden");

  const planoId = window.lioraEstudos?.meta?.planoId;
  let cards = window.lioraFlashcards.listarVencidosDoPlano(planoId);
  let index = 0;
  let inicioResposta = null;

  function renderAtual() {
    if (!cards.length) {
      area.innerHTML = `
        <h3 class="section-title">Revisão do dia</h3>
        <div class="p-5 rounded-xl border bg-[var(--card)]">
          <p class="text-sm text-[var(--muted)]">
            Nenhum flashcard pendente para hoje.
          </p>
        </div>
        <button class="btn-secondary" id="btn-voltar-revisao">
          Voltar
        </button>
      `;

      document.getElementById("btn-voltar-revisao").onclick = fecharRevisao;
      return;
    }

    const card = cards[index];
    inicioResposta = Date.now();

    area.innerHTML = `
      <div class="flex items-center justify-between">
        <h3 class="section-title">Revisão do dia</h3>
        <span class="text-xs text-[var(--muted)]">
          ${index + 1} / ${cards.length}
        </span>
      </div>

      <div class="p-5 rounded-xl border bg-[var(--card)] space-y-4">
        <div class="text-base font-medium">
          ${card.pergunta}
        </div>

        <button id="btn-mostrar-resposta"
                class="btn-secondary text-sm">
          Mostrar resposta
        </button>

        <div id="resp" class="hidden text-sm text-[var(--muted)]">
          ${card.resposta}
        </div>
      </div>

      <div class="flex gap-3 justify-end">
        <button id="btn-errei" class="btn-secondary">
          Errei
        </button>
        <button id="btn-acertei" class="btn-primary">
          Acertei
        </button>
      </div>
    `;

    document.getElementById("btn-mostrar-resposta").onclick = () => {
      document.getElementById("resp")?.classList.remove("hidden");
    };

    document.getElementById("btn-errei").onclick = () =>
      responder(false);

    document.getElementById("btn-acertei").onclick = () =>
      responder(true);
  }

  function responder(acertou) {
    const card = cards[index];
    const tempo = Date.now() - inicioResposta;

    window.lioraFlashcards.registrarResposta(
      { id: card.sessaoId },
      0,
      card.id,
      acertou,
      tempo
    );

    index++;

    if (index >= cards.length) {
      // recarrega vencidos (pode ter mudado)
      cards = window.lioraFlashcards.listarVencidosDoPlano(planoId);
      index = 0;
    }

    renderAtual();
  }

  function fecharRevisao() {
    area.classList.add("hidden");
    document.getElementById("area-sessoes")?.classList.remove("hidden");
    window.lioraDashboard?.atualizar?.();
  }

  renderAtual();
}




  
  // ----------------------------------------------------------
// 🔁 Revisão Inteligente v1 — heurística simples
// ----------------------------------------------------------
function sessaoPrecisaRevisao(sessao, index) {
  const key = _getSessaoKey(sessao, index);
  const prog = window.lioraStudy.estado.progresso[key];
  const conteudo = window.lioraStudy.estado.conteudo[key];

  if (!prog || prog.status !== "concluida") return false;

  // 1. pouco tempo (<5 min)
  if ((prog.totalTime || 0) < 5 * 60 * 1000) return true;

  // 2. reflexão fraca
  const ref = conteudo?.reflexao;
  if (!ref || (!ref.q1 && !ref.q2)) return true;

  // 3. sessão antiga (>7 dias)
  if (prog.finishedAt) {
    const dias =
      (Date.now() - prog.finishedAt) / (1000 * 60 * 60 * 24);
    if (dias >= 7) return true;
  }

  return false;
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
        · Streak: <b>${streak.atual} dias</b>
      </div>
    
      <div class="mt-3 h-2 rounded-full bg-black/30 overflow-hidden">
        <div class="h-2 rounded-full bg-[var(--brand)]" style="width:${prog.pct}%"></div>
      </div>
    `;


    lista.innerHTML = "";

    (sessoes || []).forEach((s, i) => {
      const status = window.lioraStudy.statusSessao(s, i);

      const precisaRevisao = sessaoPrecisaRevisao(s, i);

      const badge =
        status === "concluida"
          ? precisaRevisao
            ? `<span class="text-xs px-2 py-1 rounded-full bg-orange-500 text-black">Revisar</span>`
            : `<span class="text-xs px-2 py-1 rounded-full bg-green-600 text-white">Concluída</span>`
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
// 🧠 Geração de Flashcards da Sessão (v1)
// ----------------------------------------------------------
async function gerarFlashcardsSessao(sessao, meta) {
  const tema = meta?.tema || meta?.titulo || "Tema";

  return [
    {
      pergunta: `Qual é a ideia central estudada nesta sessão sobre ${tema}?`,
      resposta: `A ideia central envolve compreender os conceitos fundamentais de ${tema} e como eles se conectam.`
    },
    {
      pergunta: `Por que este conteúdo é importante dentro de ${tema}?`,
      resposta: `Porque ele serve como base para entender tópicos mais avançados e aplicações práticas.`
    },
    {
      pergunta: `Como este conceito pode aparecer na prática?`,
      resposta: `Ele pode aparecer na resolução de problemas, análises ou situações reais relacionadas a ${tema}.`
    }
  ];
}

function formatarTempo(ms = 0) {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}m ${seg.toString().padStart(2, "0")}s`;
}

// ----------------------------------------------------------
// 📖 Render de Sessão v2.4 — conteúdo + reflexão + flashcards + tempo
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

  // esconde lista
  document.getElementById("area-sessoes")?.classList.add("hidden");
  area.classList.remove("hidden");

  // inicia sessão (status + tempo)
  window.lioraStudy.iniciarSessao(sessao, index);
  const precisaRevisao = sessaoPrecisaRevisao(sessao, index);


  // -------------------------------
  // Conteúdo (cache first)
  // -------------------------------
  let conteudo = window.lioraStudy.obterConteudo(sessao, index);

  if (!conteudo) {
    area.innerHTML = `
      <p class="text-sm text-[var(--muted)]">
        Gerando conteúdo da sessão...
      </p>
    `;
    conteudo = await gerarConteudoSessao(sessao, window.lioraEstudos?.meta);
    window.lioraStudy.salvarConteudo(sessao, index, conteudo);
  }

  // -------------------------------
  // Reflexão
  // -------------------------------
  const reflexao = obterReflexaoSessao(sessao, index);

  // -------------------------------
  // Flashcards
  // -------------------------------
  let flashcards = obterFlashcardsSessao(sessao, index);

    if (!flashcards) {
      const simples = await gerarFlashcardsSessao(sessao, window.lioraEstudos?.meta);
      flashcards = window.lioraFlashcards.criarInicial(sessao, index, simples);
      salvarFlashcardsSessao(sessao, index, flashcards);
    }

  // -------------------------------
  // Render FINAL (único)
  // -------------------------------
  // const precisaRevisao = sessaoPrecisaRevisao(sessao, index);
  area.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="btn-voltar-sessoes"
              class="btn-secondary text-sm">
        ← Sessões
      </button>

      <span class="text-sm text-[var(--muted)]">
        Sessão ${index + 1}
      </span>

      <span id="tempo-sessao"
            class="ml-auto text-xs text-[var(--muted)]">
        Tempo: 0m 00s
      </span>
    </div>

    <h3 class="section-title">
      ${sessao.titulo || "Sessão"}
    </h3>
     ${precisaRevisao ? `
    <div class="p-3 rounded-lg bg-orange-100 text-orange-800 text-sm">
    Esta sessão é uma boa candidata para revisão.
    </div>
    ` : ""}
    <div class="p-5 rounded-xl border bg-[var(--card)] space-y-6">
      ${conteudo}

      <hr class="opacity-30">

      <section class="space-y-3">
        <h5 class="font-semibold">Reflexão</h5>

        <label class="text-sm">
          1. Explique com suas palavras
        </label>
        <textarea id="ref-q1" rows="3" class="w-full"></textarea>

        <label class="text-sm">
          2. O que ficou menos claro?
        </label>
        <textarea id="ref-q2" rows="3" class="w-full"></textarea>

        <label class="text-sm">
          Anotações
        </label>
        <textarea id="ref-notas" rows="4" class="w-full"></textarea>
      </section>

      <hr class="opacity-30">

      <section class="space-y-4">
        <h5 class="font-semibold">Flashcards</h5>

        ${flashcards.map((c, i) => `
          <div class="p-4 border rounded space-y-2">
            <div class="font-medium">
              ${i + 1}. ${c.pergunta}
            </div>

            <button class="btn-secondary text-xs"
                    data-flash="${i}">
              Mostrar resposta
            </button>

            <div class="flash-resp hidden text-sm text-[var(--muted)]">
              ${c.resposta}
            </div>
          </div>
        `).join("")}
      </section>
    </div>

    <div class="flex justify-end">
      <button id="btn-concluir-sessao"
              class="btn-primary">
        Concluir sessão
      </button>
    </div>
  `;

  // -------------------------------
  // ⏱️ Tempo visível da sessão
  // -------------------------------
  const tempoEl = document.getElementById("tempo-sessao");
  let timerId = null;

  if (tempoEl) {
    timerId = setInterval(() => {
      const ms = window.lioraStudy.tempoSessao(sessao, index);
      const total = Math.floor(ms / 1000);
      const min = Math.floor(total / 60);
      const seg = total % 60;
      tempoEl.textContent = `Tempo: ${min}m ${seg.toString().padStart(2, "0")}s`;
    }, 1000);
  }

  // -------------------------------
  // Reflexão — persistência
  // -------------------------------
  const q1 = qs("ref-q1");
  const q2 = qs("ref-q2");
  const notas = qs("ref-notas");

  q1.value = reflexao.q1 || "";
  q2.value = reflexao.q2 || "";
  notas.value = reflexao.notas || "";

  const salvar = () =>
    salvarReflexaoSessao(sessao, index, {
      q1: q1.value,
      q2: q2.value,
      notas: notas.value
    });

  q1.onblur = salvar;
  q2.onblur = salvar;
  notas.onblur = salvar;

  // -------------------------------
  // Flashcards interação
  // -------------------------------
  area.querySelectorAll("[data-flash]").forEach(btn => {
    btn.onclick = () => {
      const r = btn.nextElementSibling;
      r.classList.toggle("hidden");
      btn.textContent = r.classList.contains("hidden")
        ? "Mostrar resposta"
        : "Ocultar resposta";
    };
  });

  // -------------------------------
  // Navegação
  // -------------------------------
  qs("btn-voltar-sessoes").onclick = () => {
    if (timerId) clearInterval(timerId);
    area.classList.add("hidden");
    qs("area-sessoes").classList.remove("hidden");
  };

  qs("btn-concluir-sessao").onclick = () => {
    if (timerId) clearInterval(timerId);
    window.lioraStudy.concluirSessao(sessao, index);
    area.classList.add("hidden");
    qs("area-sessoes").classList.remove("hidden");
    window.renderPlanoESessoes?.();
    window.lioraDashboard?.atualizar?.();
  };
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
           Conceito central
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
           Desdobramento do conceito
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
           Exemplo introdutório
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
           Fechamento da sessão
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
