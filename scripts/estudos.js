// ==========================================================
// 📘 LIORA — STUDY MANAGER v2
// ----------------------------------------------------------
// Responsável por:
// - Armazenar planos de estudo (tema / upload)
// - Controlar progresso das sessões
// - Controlar revisões (Modelo A — estilo Duolingo)
// - Expor dados para:
//   • Home Inteligente
//   • Continue Study Engine
//   • Simulados (prefill)
//   • Dashboard
//
// API pública (usada atualmente):
// - definirPlano({ tema, origem, sessoes })
// - getPlanoAtivo()
// - listarRecentes(limit)
// - recomendarSimulado()
// - registrarAbertura(sessaoId)
// - registrarProgresso(sessaoId)
// - marcarRevisada(sessaoId)
// - agendarRevisao(sessaoId)
// - listarRevisoesPendentes(limit)
//
// Compatibilidade com versões antigas:
// - updateSessionProgress(id, frac)
// - concluirSessao(id)
// - completeSession(id)
// ==========================================================

(function () {
  console.log("🔵 Liora Estudos v2 carregado...");

  const STORAGE_KEY = "liora:estudos:v2";

  // --------------------------------------------------------
  // Helpers de data
  // --------------------------------------------------------
  function hojeISO() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function addDaysISO(dateISO, days) {
    const d = dateISO ? new Date(dateISO) : new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function diffDaysISO(fromISO, toISO) {
    if (!fromISO || !toISO) return Infinity;
    const a = new Date(fromISO);
    const b = new Date(toISO);
    const diffMs = b - a;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Modelo A — intervalos de revisão progressivos
  function calcIntervaloDias(numRevisoes) {
    if (numRevisoes <= 0) return 2;
    if (numRevisoes === 1) return 3;
    if (numRevisoes === 2) return 5;
    if (numRevisoes === 3) return 7;
    return 10; // estabiliza
  }

  function calcForcaSessao(sessao) {
    const hoje = hojeISO();
    if (!sessao.ultimaRevisao) {
      // se nunca revisou: baseia na proximidade da primeira revisão
      if (!sessao.proximaRevisao) return "fraca";
      const diff = diffDaysISO(hoje, sessao.proximaRevisao);
      if (diff >= 4) return "forte";
      if (diff >= 2) return "media";
      return "fraca";
    }

    const diasDesdeUltima = diffDaysISO(sessao.ultimaRevisao, hoje);
    if (diasDesdeUltima <= 2) return "forte";
    if (diasDesdeUltima <= 5) return "media";
    return "fraca";
  }

  // --------------------------------------------------------
  // Persistência
  // --------------------------------------------------------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          planos: [],
          ativoId: null,
        };
      }
      const parsed = JSON.parse(raw);
      if (!parsed.planos) parsed.planos = [];
      return parsed;
    } catch (e) {
      console.warn("⚠️ Não foi possível carregar memória de estudos", e);
      return { planos: [], ativoId: null };
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("⚠️ Não foi possível salvar memória de estudos", e);
    }
  }

  function genPlanoId(tema) {
    const slug = (tema || "plano").toLowerCase().replace(/\s+/g, "-");
    return `${slug}-${Date.now().toString(36)}`;
  }

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // --------------------------------------------------------
  // Normalização de plano e sessões
  // --------------------------------------------------------
  function normalizarPlano(input) {
    const tema = (input.tema || "").trim() || "Plano de Estudo";
    const origem = input.origem || "tema";
    const sessoesIn = Array.isArray(input.sessoes) ? input.sessoes : [];

    const planoId = genPlanoId(tema);
    const hoje = hojeISO();

    const sessoes = sessoesIn.map((s, i) => {
      const id = s.id || `S${i + 1}`;
      const ordem = s.ordem || i + 1;
      const progresso = Number(s.progresso || 0);

      const revisoes = Number(s.revisoes || 0);
      const ultimaRevisao = s.ultimaRevisao || null;
      let proximaRevisao = s.proximaRevisao || null;

      if (!proximaRevisao && progresso >= 100) {
        // se terminou a sessão, agenda primeira revisão
        const dias = calcIntervaloDias(revisoes);
        proximaRevisao = addDaysISO(hoje, dias);
      }

      const sessaoNorm = {
        id,
        ordem,
        titulo: s.titulo || `Sessão ${ordem}`,
        objetivo: s.objetivo || "",
        conteudo: s.conteudo || {},
        analogias: s.analogias || [],
        ativacao: s.ativacao || [],
        quiz: s.quiz || {},
        flashcards: s.flashcards || [],
        mindmap: s.mindmap || s.mapaMental || "",
        progresso,
        revisoes,
        ultimaRevisao,
        proximaRevisao,
        forca: "media",
        lastAccess: s.lastAccess || null,
      };

      sessaoNorm.forca = calcForcaSessao(sessaoNorm);
      return sessaoNorm;
    });

    return {
      id: planoId,
      tema,
      origem,
      sessoes,
      criadoEm: hoje,
      atualizadoEm: hoje,
      concluidoEm: null,
    };
  }

  function findPlanoByIdOrTema(state, idOrTema) {
    if (!idOrTema) return null;
    const lower = String(idOrTema).toLowerCase();
    return (
      state.planos.find(p => p.id === idOrTema) ||
      state.planos.find(p => (p.tema || "").toLowerCase() === lower) ||
      null
    );
  }

  function getPlanoAtivoInterno(state) {
    // hack para _forcarAtivo (usado pelo nav-home)
    if (window.lioraEstudos && window.lioraEstudos._forcarAtivo) {
      const forced = state.planos.find(p => p.id === window.lioraEstudos._forcarAtivo);
      if (forced) return forced;
    }

    if (state.ativoId) {
      const p = state.planos.find(p => p.id === state.ativoId);
      if (p) return p;
    }

    if (!state.planos.length) return null;

    // fallback: último criado
    const ordenados = state.planos.slice().sort((a, b) => {
      const da = a.atualizadoEm || a.criadoEm || "";
      const db = b.atualizadoEm || b.criadoEm || "";
      return db.localeCompare(da);
    });
    return ordenados[0];
  }

  function salvarPlanoAtualizado(state, plano) {
    const idx = state.planos.findIndex(p => p.id === plano.id);
    plano.atualizadoEm = hojeISO();
    if (idx >= 0) {
      state.planos[idx] = plano;
    } else {
      state.planos.push(plano);
    }
    state.ativoId = plano.id;
    saveState(state);
  }

  // --------------------------------------------------------
  // API pública
  // --------------------------------------------------------
  const api = {
    // Define / substitui o plano ativo
    definirPlano({ tema, origem, sessoes }) {
      const state = loadState();
      const plano = normalizarPlano({ tema, origem, sessoes });
      salvarPlanoAtualizado(state, plano);
      console.log("💾 Plano definido:", plano);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    // Retorna o plano ativo (ou null)
    getPlanoAtivo() {
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      return plano ? clonar(plano) : null;
    },

    // Lista planos recentes (para Estudos Recentes)
    listarRecentes(limit = 5) {
      const state = loadState();
      const ordenados = state.planos.slice().sort((a, b) => {
        const da = a.atualizadoEm || a.criadoEm || "";
        const db = b.atualizadoEm || b.criadoEm || "";
        return db.localeCompare(da);
      });
      return ordenados.slice(0, limit).map(clonar);
    },

    // Sugestão de simulado com base no plano ativo
    recomendarSimulado() {
      const plano = api.getPlanoAtivo();
      if (!plano || !plano.sessoes?.length) return null;

      const total = plano.sessoes.length;
      let qtd = 10;
      if (total >= 6) qtd = 20;
      else if (total >= 3) qtd = 15;

      // dificuldade aproximada pela média da força
      let score = 0;
      plano.sessoes.forEach(s => {
        if (s.forca === "forte") score += 2;
        else if (s.forca === "media") score += 1;
      });
      const media = score / (2 * total || 1);

      let dificuldade = "misturado";
      if (media <= 0.5) dificuldade = "facil";
      else if (media < 0.9) dificuldade = "medio";
      else dificuldade = "dificil";

      const sugestao = {
        tema: plano.tema,
        banca: "FGV",
        qtd,
        dificuldade,
      };
      console.log("🎯 recomendação de simulado:", sugestao);
      return sugestao;
    },

    // Marca abertura de sessão (último acesso)
    registrarAbertura(sessaoId) {
      if (!sessaoId) return;
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find(s => s.id === sessaoId);
      if (!s) return;

      s.lastAccess = hojeISO();
      s.forca = calcForcaSessao(s);

      salvarPlanoAtualizado(state, plano);
      console.log("📖 Abertura registrada para", sessaoId);
    },

    // Progresso da sessão (estudo normal, não revisão)
    registrarProgresso(sessaoId, delta = 40) {
      if (!sessaoId) return;
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find(s => s.id === sessaoId);
      if (!s) return;

      const novo = Math.min(100, Number(s.progresso || 0) + delta);
      s.progresso = novo;

      // se terminou a sessão, já agenda primeira revisão
      if (novo >= 100) {
        const hoje = hojeISO();
        s.ultimaRevisao = s.ultimaRevisao || hoje;
        s.revisoes = Number(s.revisoes || 0) + 1;
        const dias = calcIntervaloDias(s.revisoes);
        s.proximaRevisao = addDaysISO(hoje, dias);
      }

      s.forca = calcForcaSessao(s);
      salvarPlanoAtualizado(state, plano);
      console.log("📈 Progresso registrado para", sessaoId, "=>", s.progresso);
    },

    // Marca sessão como revisada (modo revisão)
    marcarRevisada(sessaoId) {
      if (!sessaoId) return;
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find(s => s.id === sessaoId);
      if (!s) return;

      const hoje = hojeISO();
      s.ultimaRevisao = hoje;
      s.revisoes = Number(s.revisoes || 0) + 1;
      const dias = calcIntervaloDias(s.revisoes);
      s.proximaRevisao = addDaysISO(hoje, dias);
      s.forca = calcForcaSessao(s);

      salvarPlanoAtualizado(state, plano);
      console.log("🔁 Revisão registrada para", sessaoId);
      window.dispatchEvent(new Event("liora:review-updated"));
    },

    // Mantemos separado caso queira usar manualmente
    agendarRevisao(sessaoId) {
      if (!sessaoId) return;
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find(s => s.id === sessaoId);
      if (!s) return;

      const hoje = hojeISO();
      const dias = calcIntervaloDias(Number(s.revisoes || 0));
      s.proximaRevisao = addDaysISO(hoje, dias);
      s.forca = calcForcaSessao(s);

      salvarPlanoAtualizado(state, plano);
      console.log("📅 Revisão agendada para", sessaoId, "em", s.proximaRevisao);
      window.dispatchEvent(new Event("liora:review-updated"));
    },

    // Lista sessões com revisão vencida (proximaRevisao <= hoje)
    listarRevisoesPendentes(limit = 10) {
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return [];

      const hoje = hojeISO();
      const pendentes = plano.sessoes.filter(s => {
        if (!s.proximaRevisao) return false;
        return s.proximaRevisao <= hoje;
      });

      pendentes.sort((a, b) => {
        const da = a.proximaRevisao || "";
        const db = b.proximaRevisao || "";
        return da.localeCompare(db);
      });

      return pendentes.slice(0, limit).map(clonar);
    },

    // Marca conclusão total do plano (usado quando termina todas sessões)
    finalizarPlano(idOuTema) {
      const state = loadState();
      const plano = findPlanoByIdOrTema(state, idOuTema) || getPlanoAtivoInterno(state);
      if (!plano) return;

      plano.concluidoEm = hojeISO();
      salvarPlanoAtualizado(state, plano);
      console.log("🏁 Plano concluído:", plano.tema);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    // ------------------------------------------------------
    // Métodos de compatibilidade (versões anteriores)
    // ------------------------------------------------------

    // Usado em renderWizard() e clique no card lateral
    updateSessionProgress(sessaoId, frac) {
      if (!sessaoId) return;
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find(s => s.id === sessaoId);
      if (!s) return;

      const alvo = Math.max(Number(s.progresso || 0), Math.floor((frac || 0) * 100));
      s.progresso = Math.min(100, alvo);
      s.forca = calcForcaSessao(s);

      salvarPlanoAtualizado(state, plano);
      console.log("📊 updateSessionProgress", sessaoId, "=>", s.progresso);
    },

    // versão antiga — tratar como conclusão da sessão
    concluirSessao(sessaoId) {
      api.registrarProgresso(sessaoId, 100);
    },

    // alias para compatibilidade
    completeSession(sessaoId) {
      api.concluirSessao(sessaoId);
    },
  };

  window.lioraEstudos = api;
})();
