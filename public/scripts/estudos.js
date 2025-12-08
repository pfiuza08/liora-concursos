// ========================================================================
// 📘 LIORA — STUDY MANAGER v2.1-FREEMIUM-A4 (COMERCIAL)
// ------------------------------------------------------------------------
// Responsável por:
// - Armazenar planos de estudo (tema / upload)
// - Controlar progresso das sessões
// - Controlar revisões (SRS adaptativo)
// - Medir retenção (retentionScore 0–100)
// - Diferenciar planos FREE vs PREMIUM (freemium real)
// - Ajustar força (fraca/media/forte) com penalização cognitiva para planos resumidos
// - Fornecer dados para Home, Continue Study, Dashboard e Simulados
//
// API pública:
//   definirPlano({ tema, origem, sessoes })
//   ativarPlano(planoId)
//   getPlanoAtivo()
//   listarRecentes(limit)
//   recomendarSimulado()
//   registrarAbertura(sessaoId)
//   registrarProgresso(sessaoId, delta)
//   marcarRevisada(sessaoId)
//   agendarRevisao(sessaoId)
//   listarRevisoesPendentes()
//   registrarQuizResultado(sessaoId, { acertou, tentativas })
//   registrarFlashcardUso(sessaoId, { qtd })
//   registrarAbandono(sessaoId)
//
// Compatibilidade:
//   updateSessionProgress(id, frac)
//   concluirSessao(id)
//   completeSession(id)
// ========================================================================

(function () {
  console.log("🔵 Liora Estudos v2.1-FREEMIUM-A4 carregado...");

  const STORAGE_KEY = "liora:estudos:v2";

  // --------------------------------------------------------
  // Helpers de data
  // --------------------------------------------------------
  const hojeISO = () => new Date().toISOString().slice(0, 10);

  function addDaysISO(dateISO, days) {
    const d = dateISO ? new Date(dateISO) : new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function diffDaysISO(fromISO, toISO) {
    if (!fromISO || !toISO) return Infinity;
    const a = new Date(fromISO);
    const b = new Date(toISO);
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
  }

  // Modelo SRS base
  function calcIntervaloDiasBase(n) {
    if (n <= 0) return 2;
    if (n === 1) return 3;
    if (n === 2) return 5;
    if (n === 3) return 7;
    return 10;
  }

  // --------------------------------------------------------
  // Defaults de sessão
  // --------------------------------------------------------
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function ensureSessaoDefaults(s) {
    if (typeof s.progresso !== "number") s.progresso = 0;
    if (typeof s.revisoes !== "number") s.revisoes = 0;
    if (!s.lastAccess) s.lastAccess = null;
    if (!s.ultimaRevisao) s.ultimaRevisao = null;
    if (!s.proximaRevisao) s.proximaRevisao = null;

    if (typeof s.retentionScore !== "number") {
      s.retentionScore = s.progresso >= 100 ? 65 : 45;
    }

    if (typeof s.acertosQuiz !== "number") s.acertosQuiz = 0;
    if (typeof s.errosQuiz !== "number") s.errosQuiz = 0;
    if (typeof s.flashcardsVistos !== "number") s.flashcardsVistos = 0;

    return s;
  }

  // --------------------------------------------------------
  // Força da sessão (A4 — freemium-aware)
  // --------------------------------------------------------
  function calcForcaSessao(sessao, tipoPlano, resumido) {
    sessao = ensureSessaoDefaults(sessao);
    const hoje = hojeISO();

    const ultimaBase = sessao.ultimaRevisao || sessao.lastAccess;
    const diasDesde = ultimaBase ? diffDaysISO(ultimaBase, hoje) : Infinity;

    // Penalidade para planos resumidos (free)
    const penalidade = resumido ? -10 : 0;

    const score = sessao.retentionScore + penalidade;

    if (!ultimaBase && sessao.progresso < 50) return "fraca";

    if (score >= 75 && diasDesde <= 5) return "forte";
    if (score >= 50 && diasDesde <= 7) return "media";
    return "fraca";
  }

  // --------------------------------------------------------
  // Próxima Revisão Inteligente
  // --------------------------------------------------------
  function calcularProximaRevisao(sessao) {
    sessao = ensureSessaoDefaults(sessao);
    const hoje = hojeISO();

    const base = calcIntervaloDiasBase(sessao.revisoes || 0);
    let ajuste = 0;

    if (sessao.retentionScore >= 75) ajuste += 2;
    else if (sessao.retentionScore < 40) ajuste -= 1;

    const dias = clamp(base + ajuste, 1, 14);
    return addDaysISO(hoje, dias);
  }

  // --------------------------------------------------------
  // Persistência
  // --------------------------------------------------------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { planos: [], ativoId: null };
      return JSON.parse(raw);
    } catch {
      return { planos: [], ativoId: null };
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  const clone = (o) => JSON.parse(JSON.stringify(o));

  function genPlanoId(tema) {
    return (
      (tema || "plano")
        .toLowerCase()
        .replace(/\s+/g, "-") +
      "-" +
      Date.now().toString(36)
    );
  }

  // --------------------------------------------------------
  // Normalização A4 — plano free vs premium
  // --------------------------------------------------------
  function normalizarPlano(input) {
    const tema = (input.tema || "").trim() || "Plano de Estudo";
    const origem = input.origem || "tema";
    const sessoesIn = Array.isArray(input.sessoes) ? input.sessoes : [];

    // Detecta se usuário é premium
    let isPremium = false;
    try {
      isPremium =
        JSON.parse(localStorage.getItem("liora_user") || "{}").premium === true;
    } catch {}

    const resumido = !isPremium && sessoesIn.length <= 3;
    const tipoPlano = isPremium ? "premium" : "free";

    const id = genPlanoId(tema);
    const hoje = hojeISO();

    const sessoes = sessoesIn.map((s, i) => {
      const base = ensureSessaoDefaults({
        id: s.id || `S${i + 1}`,
        ordem: s.ordem || i + 1,
        titulo: s.titulo || `Sessão ${i + 1}`,
        objetivo: s.objetivo || "",
        conteudo: s.conteudo || {},
        analogias: s.analogias || [],
        ativacao: s.ativacao || [],
        quiz: s.quiz || {},
        flashcards: s.flashcards || [],
        mindmap: s.mindmap || s.mapaMental || "",
        progresso: Number(s.progresso || 0),
        revisoes: Number(s.revisoes || 0),
        ultimaRevisao: s.ultimaRevisao || null,
        proximaRevisao: s.proximaRevisao || null,
        lastAccess: s.lastAccess || null,
        retentionScore:
          typeof s.retentionScore === "number"
            ? s.retentionScore
            : Number(s.progresso || 0) >= 100
            ? 65
            : 45,
      });

      // Ajuste da força A4
      base.forca = calcForcaSessao(base, tipoPlano, resumido);

      return base;
    });

    return {
      id,
      tema,
      origem,
      tipoPlano,
      resumido,
      sessoes,
      criadoEm: hoje,
      atualizadoEm: hoje,
      concluidoEm: null,
    };
  }

  function getPlanoAtivoInterno(state) {
    if (state.ativoId) {
      const p = state.planos.find((x) => x.id === state.ativoId);
      if (p) return p;
    }
    if (!state.planos.length) return null;

    return state.planos
      .slice()
      .sort((a, b) => (b.atualizadoEm || "").localeCompare(a.atualizadoEm || ""))[0];
  }

  function salvarPlanoAtualizado(state, plano) {
    plano.atualizadoEm = hojeISO();
    const idx = state.planos.findIndex((p) => p.id === plano.id);
    if (idx >= 0) state.planos[idx] = plano;
    else state.planos.push(plano);
    state.ativoId = plano.id;
    saveState(state);
  }

  // --------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------
  const api = {
    definirPlano({ tema, origem, sessoes }) {
      const state = loadState();
      const plano = normalizarPlano({ tema, origem, sessoes });
      salvarPlanoAtualizado(state, plano);
      console.log("💾 Plano definido:", plano);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    ativarPlano(planoId) {
      const state = loadState();
      const plano = state.planos.find((p) => p.id === planoId);
      if (!plano) return;
      salvarPlanoAtualizado(state, plano);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    getPlanoAtivo() {
      const plano = getPlanoAtivoInterno(loadState());
      return plano ? clone(plano) : null;
    },

    listarRecentes(limit = 5) {
      const planos = loadState().planos;
      return planos
        .slice()
        .sort((a, b) => (b.atualizadoEm || "").localeCompare(a.atualizadoEm))
        .slice(0, limit)
        .map(clone);
    },

    // ====================================================================
    // 🎯 Recomendar Simulado (Freemium-aware)
    // ====================================================================
    recomendarSimulado() {
      const plano = api.getPlanoAtivo();
      if (!plano || !plano.sessoes?.length) return null;

      const total = plano.sessoes.length;
      let qtd;

      if (plano.tipoPlano === "free") {
        qtd = total <= 2 ? 5 : 8;
      } else {
        qtd = total >= 6 ? 20 : total >= 3 ? 15 : 10;
      }

      let soma = 0;
      plano.sessoes.forEach((s) => {
        if (s.forca === "forte") soma += 2;
        else if (s.forca === "media") soma += 1;
      });
      const media = soma / (2 * total || 1);

      let dificuldade;
      if (plano.tipoPlano === "free") dificuldade = "facil";
      else if (media <= 0.5) dificuldade = "facil";
      else if (media < 0.9) dificuldade = "medio";
      else dificuldade = "dificil";

      return {
        tema: plano.tema,
        banca: plano.tipoPlano === "free" ? "FGV" : "CESPE",
        qtd,
        dificuldade,
      };
    },

    // ====================================================================
    // 📊 Eventos Cognitivos
    // ====================================================================
    registrarAbertura(sessaoId) {
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find((x) => x.id === sessaoId);
      if (!s) return;

      s.lastAccess = hojeISO();
      s.forca = calcForcaSessao(s, plano.tipoPlano, plano.resumido);

      salvarPlanoAtualizado(state, plano);
    },

    registrarProgresso(sessaoId, delta = 40) {
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find((x) => x.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      const antes = s.progresso;
      s.progresso = Math.min(100, antes + delta);

      if (s.progresso > antes) s.retentionScore += 4;

      if (antes < 100 && s.progresso >= 100) {
        s.ultimaRevisao = hojeISO();
        s.revisoes = (s.revisoes || 0) + 1;
        s.retentionScore += 10;
        s.proximaRevisao = calcularProximaRevisao(s);
      }

      s.forca = calcForcaSessao(s, plano.tipoPlano, plano.resumido);

      salvarPlanoAtualizado(state, plano);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    marcarRevisada(sessaoId) {
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find((x) => x.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      s.ultimaRevisao = hojeISO();
      s.revisoes = (s.revisoes || 0) + 1;
      s.retentionScore += 12;

      s.proximaRevisao = calcularProximaRevisao(s);
      s.forca = calcForcaSessao(s, plano.tipoPlano, plano.resumido);

      salvarPlanoAtualizado(state, plano);
      window.dispatchEvent(new Event("liora:review-updated"));
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    agendarRevisao(sessaoId) {
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find((x) => x.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      s.proximaRevisao = addDaysISO(hojeISO(), calcIntervaloDiasBase(s.revisoes));
      s.forca = calcForcaSessao(s, plano.tipoPlano, plano.resumido);

      salvarPlanoAtualizado(state, plano);
      window.dispatchEvent(new Event("liora:review-updated"));
    },

    listarRevisoesPendentes(limit = 10) {
      const plano = api.getPlanoAtivo();
      if (!plano) return [];

      const hoje = hojeISO();

      return plano.sessoes
        .map((s) => ensureSessaoDefaults(s))
        .filter((s) => s.proximaRevisao && s.proximaRevisao <= hoje)
        .sort((a, b) => a.retentionScore - b.retentionScore)
        .slice(0, limit)
        .map(clone);
    },

    registrarQuizResultado(sessaoId, { acertou, tentativas = 1 } = {}) {
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find((x) => x.id === sessaoId);
      if (!s) return;
      ensureSessaoDefaults(s);

      if (acertou) {
        s.acertosQuiz++;
        s.retentionScore += tentativas <= 1 ? 10 : 6;
      } else {
        s.errosQuiz++;
        s.retentionScore -= 10;
        s.proximaRevisao = addDaysISO(hojeISO(), 1);
      }

      s.forca = calcForcaSessao(s, plano.tipoPlano, plano.resumido);

      salvarPlanoAtualizado(state, plano);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    registrarFlashcardUso(sessaoId, { qtd = 1 } = {}) {
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find((x) => x.id === sessaoId);
      if (!s) return;
      ensureSessaoDefaults(s);

      const inc = clamp(qtd, 1, 5);
      s.flashcardsVistos += inc;
      s.retentionScore += 3 + inc;

      s.forca = calcForcaSessao(s, plano.tipoPlano, plano.resumido);

      salvarPlanoAtualizado(state, plano);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    registrarAbandono(sessaoId, { tempoSegundos = 0 } = {}) {
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find((x) => x.id === sessaoId);
      if (!s) return;
      ensureSessaoDefaults(s);

      if (tempoSegundos < 60 && s.progresso < 50) {
        s.retentionScore -= 15;
        s.proximaRevisao = addDaysISO(hojeISO(), 1);
      } else {
        s.retentionScore -= 5;
      }

      s.forca = calcForcaSessao(s, plano.tipoPlano, plano.resumido);

      salvarPlanoAtualizado(state, plano);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    // Compatibilidade
    updateSessionProgress(sessaoId, frac) {
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find((x) => x.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      const alvo = Math.max(s.progresso, Math.floor((frac || 0) * 100));
      s.progresso = Math.min(100, alvo);
      s.retentionScore += 3;

      s.forca = calcForcaSessao(s, plano.tipoPlano, plano.resumido);

      salvarPlanoAtualizado(state, plano);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    concluirSessao(id) {
      api.registrarProgresso(id, 100);
    },

    completeSession(id) {
      api.concluirSessao(id);
    },
  };

  window.lioraEstudos = api;
})();
