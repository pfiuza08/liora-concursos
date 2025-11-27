// ==========================================================
// 📘 LIMB — LIORA INTELLIGENT MEMORY BRAIN (estudos.js v4)
// ----------------------------------------------------------
// Funções principais:
// ✔ Armazena planos e sessões
// ✔ Regras de revisão (SRI)
// ✔ Cálculo de retenção (curva de esquecimento)
// ✔ Agendamento adaptativo (Leitner expandido)
// ✔ Registro automático de abertura e revisão
// ✔ Retorna revisões pendentes
// ✔ Integrado com nav-home e core.js
// ==========================================================

(function () {
  console.log("🔵 estudos.js v4 carregado…");

  const STORAGE_KEY = "liora:estudos:v4";

  // ---------------------------------------------------------
  // 🔧 Utilidades base
  // ---------------------------------------------------------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { planos: [], ativoId: null };
      const parsed = JSON.parse(raw);
      if (!parsed.planos) parsed.planos = [];
      return parsed;
    } catch {
      return { planos: [], ativoId: null };
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("⚠️ Não foi possível salvar estudos:", e);
    }
  }

  function hojeISO() {
    return new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  }

  function diasEntre(aISO, bISO) {
    const a = new Date(aISO);
    const b = new Date(bISO);
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
  }

  // ---------------------------------------------------------
  // 🎛️ Cálculo da retenção (modelo Ebbinghaus)
  // ---------------------------------------------------------
  function calcularRetencao(sessao) {
    if (!sessao.lastViewedISO) return 0;

    const dias = diasEntre(sessao.lastViewedISO, hojeISO());
    const fator = 1.5; // constante de esquecimento da Liora

    const ret = Math.exp(-dias / fator) * 100;
    return Math.max(0, Math.min(100, ret));
  }

  // ---------------------------------------------------------
  // 🗂️ Agendamento de revisões (modelo Leitner adaptado)
  // ---------------------------------------------------------
  function calcularProximaRevisao(sessao) {
    const revisoes = sessao.revisoes || 0;

    let dias = 1; // primeira revisão

    if (revisoes === 1) dias = 3;
    else if (revisoes === 2) dias = 7;
    else if (revisoes === 3) dias = 14;
    else if (revisoes >= 4) dias = 30;

    const prox = new Date();
    prox.setDate(prox.getDate() + dias);
    return prox.toISOString().slice(0, 10);
  }

  // ---------------------------------------------------------
  // 📘 Study Manager (API pública)
  // ---------------------------------------------------------
  const api = {
    // -----------------------------------------------------
    // Criar plano
    // -----------------------------------------------------
    definirPlano({ tema, origem, sessoes }) {
      const data = load();
      const id = `plano_${Date.now()}`;

      const plano = {
        id,
        tema,
        origem,
        sessoes: sessoes.map((s, i) => ({
          id: s.id || `sessao_${i + 1}`,
          ordem: s.ordem || i + 1,
          titulo: s.titulo || "",
          progresso: Number(s.progresso || 0),

          // Dia 4 — novos campos
          firstViewedISO: null,
          lastViewedISO: null,
          revisoes: 0,
          nextReviewISO: null,
          retencao: 0,

          conteudo: s.conteudo || {},
          analogias: s.analogias || [],
          ativacao: s.ativacao || [],
          quiz: s.quiz || {},
          flashcards: s.flashcards || [],
          mindmap: s.mindmap || ""
        })),

        criadoISO: hojeISO(),
        atualizadoISO: hojeISO()
      };

      data.planos.push(plano);
      data.ativoId = id;

      save(data);

      window.dispatchEvent(new Event("liora:plan-updated"));
      return plano;
    },

    // -----------------------------------------------------
    // Obter plano ativo
    // -----------------------------------------------------
    getPlanoAtivo() {
      const data = load();
      return data.planos.find(p => p.id === data.ativoId) || null;
    },

    // -----------------------------------------------------
    // Atualizar progresso (Dia 3)
    // -----------------------------------------------------
    atualizarProgresso(sessaoId, pct) {
      const data = load();
      const plano = data.planos.find(p => p.id === data.ativoId);
      if (!plano) return;

      const s = plano.sessoes.find(x => x.id === sessaoId);
      if (!s) return;

      s.progresso = pct;
      plano.atualizadoISO = hojeISO();

      save(data);
      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    // -----------------------------------------------------
    // Registrar abertura de sessão (Dia 4)
    // -----------------------------------------------------
    registrarAbertura(sessaoId) {
      const data = load();
      const plano = data.planos.find(p => p.id === data.ativoId);
      if (!plano) return;

      const s = plano.sessoes.find(x => x.id === sessaoId);
      if (!s) return;

      const hoje = hojeISO();
      if (!s.firstViewedISO) s.firstViewedISO = hoje;
      s.lastViewedISO = hoje;

      // recalculamos retenção
      s.retencao = calcularRetencao(s);

      plano.atualizadoISO = hoje;
      save(data);
    },

    // -----------------------------------------------------
    // Registrar revisão (Dia 4)
    // -----------------------------------------------------
    registrarRevisao(sessaoId) {
      const data = load();
      const plano = data.planos.find(p => p.id === data.ativoId);
      if (!plano) return;

      const s = plano.sessoes.find(x => x.id === sessaoId);
      if (!s) return;

      s.revisoes = (s.revisoes || 0) + 1;
      s.lastViewedISO = hojeISO();
      s.retencao = 100;

      // Agendar próxima revisão
      s.nextReviewISO = calcularProximaRevisao(s);

      plano.atualizadoISO = hojeISO();
      save(data);

      window.dispatchEvent(new Event("liora:review-updated"));
    },

    // -----------------------------------------------------
    // Retornar revisões pendentes (Dia 4)
    // -----------------------------------------------------
    getRevisoesPendentes() {
      const data = load();
      const plano = data.planos.find(p => p.id === data.ativoId);
      if (!plano) return [];

      const hoje = hojeISO();

      return plano.sessoes.filter(s => {
        const ret = calcularRetencao(s);
        const vencida =
          (s.nextReviewISO && s.nextReviewISO <= hoje) ||
          ret < 40; // urgência

        if (vencida) {
          s.retencao = ret;
        }

        return vencida;
      });
    },

    // -----------------------------------------------------
    // Listar estudos recentes (Dia 3)
    // -----------------------------------------------------
    listarRecentes(limit = 5) {
      const data = load();
      return data.planos
        .slice()
        .sort(
          (a, b) =>
            new Date(b.atualizadoISO) - new Date(a.atualizadoISO)
        )
        .slice(0, limit);
    }
  };

  window.lioraEstudos = api;
})();
