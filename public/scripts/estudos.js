// ==========================================================
// 📘 LIORA — STUDY MANAGER v2-PREMIUM-A3.4
// ----------------------------------------------------------
// Responsável por:
// - Armazenar planos de estudo (tema / upload)
// - Controlar progresso das sessões
// - Controlar revisões (SRS Lite adaptativo)
// - Medir retenção (retentionScore 0–100)
// - Expor dados para:
//   • Home Inteligente
//   • Continue Study Engine
//   • Simulados (prefill)
//   • Dashboard
//
// API pública (compatível + expandida):
// - definirPlano({ tema, origem, sessoes })
// - getPlanoAtivo()
// - listarRecentes(limit)
// - recomendarSimulado()
// - registrarAbertura(sessaoId)
// - registrarProgresso(sessaoId, delta?)
// - marcarRevisada(sessaoId)
// - agendarRevisao(sessaoId)
// - listarRevisoesPendentes(limit)
// - getRevisoesPendentes(limit)   (alias)
// - registrarQuizResultado(sessaoId, { acertou, tentativas })
// - registrarFlashcardUso(sessaoId, { qtd })
// - registrarAbandono(sessaoId, { tempoSegundos })
//
// Compatibilidade com versões antigas:
// - updateSessionProgress(id, frac)
// - concluirSessao(id)
// - completeSession(id)
// ==========================================================

console.log(">>> estudos.js INICIOU <<<");

(function () {
  console.log("🔵 Liora Estudos v2-PREMIUM-A3.4 carregado...");

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

  // Modelo base — intervalos de revisão progressivos
  function calcIntervaloDiasBase(numRevisoes) {
    if (numRevisoes <= 0) return 2;
    if (numRevisoes === 1) return 3;
    if (numRevisoes === 2) return 5;
    if (numRevisoes === 3) return 7;
    return 10; // estabiliza
  }

  // --------------------------------------------------------
  // Retenção e força da sessão
  // --------------------------------------------------------
  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function ensureSessaoDefaults(sessao) {
    // Garante campos para sessões antigas ou novos planos
    if (typeof sessao.progresso !== "number") sessao.progresso = 0;
    if (typeof sessao.revisoes !== "number") sessao.revisoes = 0;
    if (!sessao.lastAccess) sessao.lastAccess = null;
    if (!sessao.ultimaRevisao) sessao.ultimaRevisao = null;
    if (!sessao.proximaRevisao) sessao.proximaRevisao = null;

    if (typeof sessao.retentionScore !== "number") {
      // baseline: se já estava concluída, assume retenção um pouco maior
      sessao.retentionScore = sessao.progresso >= 100 ? 65 : 45;
    }

    if (typeof sessao.acertosQuiz !== "number") sessao.acertosQuiz = 0;
    if (typeof sessao.errosQuiz !== "number") sessao.errosQuiz = 0;
    if (typeof sessao.flashcardsVistos !== "number")
      sessao.flashcardsVistos = 0;

    return sessao;
  }

  function ajustarRetention(sessao, delta) {
    sessao = ensureSessaoDefaults(sessao);
    sessao.retentionScore = clamp(
      Math.round(sessao.retentionScore + delta),
      0,
      100
    );
  }

  function calcForcaSessao(sessao) {
    sessao = ensureSessaoDefaults(sessao);
    const hoje = hojeISO();

    const ultimaBase = sessao.ultimaRevisao || sessao.lastAccess;
    const diasDesde = ultimaBase ? diffDaysISO(ultimaBase, hoje) : Infinity;
    const r = sessao.retentionScore;

    // Se nunca foi vista direito
    if (!ultimaBase && sessao.progresso < 50) {
      return "fraca";
    }

    // Combinação de retenção e tempo desde última revisão/acesso
    if (r >= 75 && diasDesde <= 5) return "forte";
    if (r >= 50 && diasDesde <= 7) return "media";
    return "fraca";
  }

  function calcularProximaRevisaoInteligente(sessao) {
    sessao = ensureSessaoDefaults(sessao);
    const hoje = hojeISO();

    const baseIntervalo = calcIntervaloDiasBase(sessao.revisoes || 0);
    let ajuste = 0;

    // Se retenção está alta, alonga um pouco
    if (sessao.retentionScore >= 75) ajuste += 2;
    else if (sessao.retentionScore < 40) ajuste -= 1;

    // Limites mínimos e máximos
    let dias = clamp(baseIntervalo + ajuste, 1, 14);
    return addDaysISO(hoje, dias);
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
        retentionScore:
          typeof s.retentionScore === "number"
            ? s.retentionScore
            : progresso >= 100
            ? 65
            : 45,
        acertosQuiz: s.acertosQuiz || 0,
        errosQuiz: s.errosQuiz || 0,
        flashcardsVistos: s.flashcardsVistos || 0,
      };

      // se terminou a sessão e não tinha proximaRevisao, agenda primeira
      if (!sessaoNorm.proximaRevisao && sessaoNorm.progresso >= 100) {
        sessaoNorm.revisoes = sessaoNorm.revisoes || 1;
        sessaoNorm.ultimaRevisao = sessaoNorm.ultimaRevisao || hoje;
        sessaoNorm.proximaRevisao = calcularProximaRevisaoInteligente(
          sessaoNorm
        );
      }

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
      state.planos.find((p) => p.id === idOrTema) ||
      state.planos.find((p) => (p.tema || "").toLowerCase() === lower) ||
      null
    );
  }

  function getPlanoAtivoInterno(state) {
    // hack para _forcarAtivo (usado pelo nav-home)
    if (window.lioraEstudos && window.lioraEstudos._forcarAtivo) {
      const forced = state.planos.find(
        (p) => p.id === window.lioraEstudos._forcarAtivo
      );
      if (forced) return forced;
    }

    if (state.ativoId) {
      const p = state.planos.find((p) => p.id === state.ativoId);
      if (p) return p;
    }

    if (!state.planos.length) return null;

    // fallback: último atualizado
    const ordenados = state.planos.slice().sort((a, b) => {
      const da = a.atualizadoEm || a.criadoEm || "";
      const db = b.atualizadoEm || b.criadoEm || "";
      return db.localeCompare(da);
    });
    return ordenados[0];
  }

  function salvarPlanoAtualizado(state, plano) {
    plano.atualizadoEm = hojeISO();
    const idx = state.planos.findIndex((p) => p.id === plano.id);
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
      plano.sessoes.forEach((s) => {
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

      const s = plano.sessoes.find((s) => s.id === sessaoId);
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

      const s = plano.sessoes.find((s) => s.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      const novo = Math.min(100, Number(s.progresso || 0) + delta);
      const antes = s.progresso;
      s.progresso = novo;

      // Ajusta retenção levemente para cada progresso
      if (novo > antes) {
        ajustarRetention(s, 4); // estudou mais → sobe um pouco
      }

      // se terminou a sessão, agenda revisão inicial inteligente
      if (antes < 100 && novo >= 100) {
        const hoje = hojeISO();
        s.ultimaRevisao = s.ultimaRevisao || hoje;
        s.revisoes = Number(s.revisoes || 0) + 1;
        ajustarRetention(s, 10); // conclusão dá boost
        s.proximaRevisao = calcularProximaRevisaoInteligente(s);
      }

      s.forca = calcForcaSessao(s);
      salvarPlanoAtualizado(state, plano);
      console.log("📈 Progresso registrado para", sessaoId, "=>", s.progresso);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    // Marca sessão como revisada (modo revisão)
    marcarRevisada(sessaoId) {
      if (!sessaoId) return;
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find((s) => s.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      const hoje = hojeISO();
      s.ultimaRevisao = hoje;
      s.revisoes = Number(s.revisoes || 0) + 1;

      // Revisão bem sucedida melhora bastante retenção
      ajustarRetention(s, 12);

      s.proximaRevisao = calcularProximaRevisaoInteligente(s);
      s.forca = calcForcaSessao(s);

      salvarPlanoAtualizado(state, plano);
      console.log("🔁 Revisão registrada para", sessaoId);
      window.dispatchEvent(new Event("liora:review-updated"));
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    // Agendar revisão sem marcar como feita (ex.: antecipar)
    agendarRevisao(sessaoId) {
      if (!sessaoId) return;
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;

      const s = plano.sessoes.find((s) => s.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      const hoje = hojeISO();
      const baseIntervalo = calcIntervaloDiasBase(Number(s.revisoes || 0));
      s.proximaRevisao = addDaysISO(hoje, baseIntervalo);
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
      const pendentes = plano.sessoes
        .map((s) => ensureSessaoDefaults(s))
        .filter((s) => s.proximaRevisao && s.proximaRevisao <= hoje);

      // Ordena priorizando:
      // 1) menor retentionScore
      // 2) data de proximaRevisao mais antiga
      pendentes.sort((a, b) => {
        if (a.retentionScore !== b.retentionScore) {
          return a.retentionScore - b.retentionScore;
        }
        const da = a.proximaRevisao || "";
        const db = b.proximaRevisao || "";
        return da.localeCompare(db);
      });

      return pendentes.slice(0, limit).map(clonar);
    },

    // Alias para compatibilidade com nav-home v79
    getRevisoesPendentes(limit = 10) {
      return api.listarRevisoesPendentes(limit);
    },

    // Marca conclusão total do plano (usado quando termina todas sessões)
    finalizarPlano(idOuTema) {
      const state = loadState();
      const plano =
        findPlanoByIdOrTema(state, idOuTema) || getPlanoAtivoInterno(state);
      if (!plano) return;

      plano.concluidoEm = hojeISO();
      salvarPlanoAtualizado(state, plano);
      console.log("🏁 Plano concluído:", plano.tema);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    // ------------------------------------------------------
    // Eventos de aprendizado (A3.4) — para uso futuro
    // ------------------------------------------------------
    registrarQuizResultado(sessaoId, { acertou, tentativas = 1 } = {}) {
      if (!sessaoId) return;
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;
      const s = plano.sessoes.find((s) => s.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      if (acertou) {
        s.acertosQuiz = (s.acertosQuiz || 0) + 1;
        if (tentativas <= 1) ajustarRetention(s, 10);
        else ajustarRetention(s, 6);
      } else {
        s.errosQuiz = (s.errosQuiz || 0) + 1;
        ajustarRetention(s, -10);
        // se errou muito, traz revisão mais cedo
        s.proximaRevisao = addDaysISO(hojeISO(), 1);
      }

      s.forca = calcForcaSessao(s);
      salvarPlanoAtualizado(state, plano);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    registrarFlashcardUso(sessaoId, { qtd = 1 } = {}) {
      if (!sessaoId) return;
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;
      const s = plano.sessoes.find((s) => s.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      const incremento = clamp(qtd, 1, 5);
      s.flashcardsVistos = (s.flashcardsVistos || 0) + incremento;
      ajustarRetention(s, 3 + incremento); // estudar flashcards ajuda bem

      s.forca = calcForcaSessao(s);
      salvarPlanoAtualizado(state, plano);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    registrarAbandono(sessaoId, { tempoSegundos = 0 } = {}) {
      if (!sessaoId) return;
      const state = loadState();
      const plano = getPlanoAtivoInterno(state);
      if (!plano) return;
      const s = plano.sessoes.find((s) => s.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      if (tempoSegundos < 60 && s.progresso < 50) {
        // abandono precoce
        ajustarRetention(s, -15);
        s.proximaRevisao = addDaysISO(hojeISO(), 1);
      } else {
        ajustarRetention(s, -5);
      }

      s.forca = calcForcaSessao(s);
      salvarPlanoAtualizado(state, plano);
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

      const s = plano.sessoes.find((s) => s.id === sessaoId);
      if (!s) return;

      ensureSessaoDefaults(s);

      const alvo = Math.max(
        Number(s.progresso || 0),
        Math.floor((frac || 0) * 100)
      );
      s.progresso = Math.min(100, alvo);

      ajustarRetention(s, 3); // abrir sessão e navegar já conta um pouco
      s.forca = calcForcaSessao(s);

      salvarPlanoAtualizado(state, plano);
      console.log("📊 updateSessionProgress", sessaoId, "=>", s.progresso);
      window.dispatchEvent(new Event("liora:plan-updated"));
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
