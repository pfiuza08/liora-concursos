// ==========================================================
// 🧠 LIORA — STUDY MANAGER (v1)
// - Gerencia plano de estudo (tema + sessões + progresso)
// - Persistência em localStorage
// - API global: window.lioraEstudos
// - Integração com Simulados via recomendarSimulado()
// ==========================================================

(function () {
  const STORAGE_KEY = "liora-estudos-v1";

  class StudyManager {
    constructor() {
      this.plan = null;
      console.log("🔵 StudyManager inicializando...");
      this._load();
    }

    // ------------------------------------------------------
    // PERSISTÊNCIA
    // ------------------------------------------------------
    _load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          console.log("ℹ️ StudyManager: nenhum plano encontrado no storage.");
          this.plan = null;
          return;
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
          console.warn("⚠️ StudyManager: storage inválido, limpando...");
          localStorage.removeItem(STORAGE_KEY);
          this.plan = null;
          return;
        }

        this.plan = parsed;
        console.log("🟢 StudyManager: plano carregado do storage.", this.plan);
      } catch (err) {
        console.error("❌ StudyManager: erro ao carregar do storage:", err);
        this.plan = null;
      }
    }

    _save() {
      try {
        if (!this.plan) {
          localStorage.removeItem(STORAGE_KEY);
          console.log("ℹ️ StudyManager: plano removido do storage.");
          return;
        }

        this.plan.atualizadoEm = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.plan));
        // Evento global para UI que quiser reagir
        window.dispatchEvent(
          new CustomEvent("liora:plan-updated", { detail: this.plan })
        );
      } catch (err) {
        console.error("❌ StudyManager: erro ao salvar no storage:", err);
      }
    }

    // ------------------------------------------------------
    // CRIAÇÃO / RESET DO PLANO
    // ------------------------------------------------------

    /**
     * Cria um novo plano de estudo do zero.
     * @param {Object} opts
     * @param {string} opts.tema
     * @param {string} [opts.nivel]
     * @param {string} [opts.origem] "tema" | "upload" | outro
     * @param {Array}  [opts.sessoes] lista inicial de sessões (opcional)
     */
    createPlan(opts) {
      const agora = Date.now();
      const tema = (opts && opts.tema) || "Tema sem título";
      const nivel = (opts && opts.nivel) || "iniciante";
      const origem = (opts && opts.origem) || "tema";
      const sessoes = Array.isArray(opts?.sessoes) ? opts.sessoes : [];

      this.plan = {
        tema,
        nivel,
        origem,
        criadoEm: agora,
        atualizadoEm: agora,
        progresso: 0,
        sessoes: sessoes.map((s, idx) => this._normalizeSession(s, idx)),
        historico: {
          ultimaSessao: null,
          ultimaAtividade: null,
        },
      };

      this._recalculateProgress();
      this._save();
      console.log("🟢 StudyManager: novo plano criado.", this.plan);
      return this.plan;
    }

    /**
     * Aplica um plano vindo da IA (tema + lista de sessões).
     * Pode ser usado tanto em Modo Tema quanto Upload.
     */
    applyIAPlan(iaPlan) {
      if (!iaPlan) return;

      const { tema, nivel, origem, sessoes } = iaPlan;

      return this.createPlan({
        tema: tema || iaPlan.assunto || "Plano de estudo",
        nivel: nivel || "iniciante",
        origem: origem || "ia",
        sessoes: sessoes || [],
      });
    }

    resetPlan() {
      this.plan = null;
      this._save();
      console.log("🧹 StudyManager: plano resetado.");
    }

    // ------------------------------------------------------
    // SESSÕES
    // ------------------------------------------------------

    /**
     * Normaliza o formato interno de uma sessão.
     */
    _normalizeSession(sessao, idx) {
      if (!sessao || typeof sessao !== "object") sessao = {};

      const baseId = sessao.id || `S${idx + 1}`;
      return {
        id: baseId,
        titulo: sessao.titulo || sessao.nome || `Sessão ${idx + 1}`,
        descricao: sessao.descricao || sessao.resumo || "",
        ordem: typeof sessao.ordem === "number" ? sessao.ordem : idx + 1,
        status: sessao.status || "aberta", // aberta | em_andamento | concluida
        completude:
          typeof sessao.completude === "number"
            ? Math.min(Math.max(sessao.completude, 0), 1)
            : 0,
        metaMinutos: sessao.metaMinutos || null,
        tag: sessao.tag || null, // exemplo: "fundamentos", "revisao"
      };
    }

    /**
     * Substitui TODAS as sessões do plano.
     */
    setSessions(listaSessoes) {
      if (!this.plan) {
        console.warn("⚠️ StudyManager.setSessions: nenhum plano ativo.");
        return;
      }
      const arr = Array.isArray(listaSessoes) ? listaSessoes : [];
      this.plan.sessoes = arr.map((s, idx) => this._normalizeSession(s, idx));
      this._recalculateProgress();
      this._save();
      console.log("🟢 StudyManager: sessões atualizadas.", this.plan.sessoes);
    }

    /**
     * Adiciona uma única sessão ao plano.
     */
    addSession(sessao) {
      if (!this.plan) {
        console.warn("⚠️ StudyManager.addSession: nenhum plano ativo.");
        return;
      }
      if (!this.plan.sessoes) this.plan.sessoes = [];

      const idx = this.plan.sessoes.length;
      const sNorm = this._normalizeSession(sessao, idx);
      this.plan.sessoes.push(sNorm);
      this._recalculateProgress();
      this._save();
      return sNorm;
    }

    /**
     * Atualiza completude de uma sessão (0 a 1).
     */
    updateSessionProgress(id, completude) {
      if (!this.plan || !Array.isArray(this.plan.sessoes)) return;

      const s = this.plan.sessoes.find((x) => x.id === id);
      if (!s) return;

      s.completude = Math.min(Math.max(completude, 0), 1);
      if (s.completude >= 1) s.status = "concluida";
      else if (s.completude > 0) s.status = "em_andamento";
      this.plan.historico = {
        ultimaSessao: s.id,
        ultimaAtividade: Date.now(),
      };

      this._recalculateProgress();
      this._save();
      return s;
    }

    /**
     * Marca sessão como concluída diretamente.
     */
    completeSession(id) {
      return this.updateSessionProgress(id, 1);
    }

    /**
     * Devolve a sessão pelo id.
     */
    getSessionById(id) {
      if (!this.plan || !Array.isArray(this.plan.sessoes)) return null;
      return this.plan.sessoes.find((s) => s.id === id) || null;
    }

    /**
     * Devolve a próxima sessão recomendada para estudo.
     * Lógica v1:
     * 1) Sessões em_andamento
     * 2) Sessões abertas
     * 3) Se tudo concluído, retorna null
     */
    getNextSession() {
      if (!this.plan || !Array.isArray(this.plan.sessoes)) return null;

      const abertas = this.plan.sessoes.filter(
        (s) => s.status === "aberta"
      );
      const emAndamento = this.plan.sessoes.filter(
        (s) => s.status === "em_andamento"
      );
      const concluidas = this.plan.sessoes.filter(
        (s) => s.status === "concluida"
      );

      if (emAndamento.length > 0) {
        // Prioriza a de menor ordem
        const sOrdenada = [...emAndamento].sort(
          (a, b) => (a.ordem || 0) - (b.ordem || 0)
        )[0];
        return sOrdenada;
      }

      if (abertas.length > 0) {
        const sOrdenada = [...abertas].sort(
          (a, b) => (a.ordem || 0) - (b.ordem || 0)
        )[0];
        return sOrdenada;
      }

      // Tudo concluído
      console.log(
        "✅ StudyManager.getNextSession: todas as sessões concluídas."
      );
      return null;
    }

    /**
     * Recalcula o progresso geral do plano.
     */
    _recalculateProgress() {
      if (!this.plan || !Array.isArray(this.plan.sessoes)) {
        if (this.plan) this.plan.progresso = 0;
        return 0;
      }
      const total = this.plan.sessoes.length;
      if (total === 0) {
        this.plan.progresso = 0;
        return 0;
      }
      const concluidas = this.plan.sessoes.filter(
        (s) => s.status === "concluida"
      ).length;
      const progresso = concluidas / total;
      this.plan.progresso = progresso;
      return progresso;
    }

    // ------------------------------------------------------
    // CONSULTAS / STATUS
    // ------------------------------------------------------

    hasPlan() {
      return !!this.plan;
    }

    getPlan() {
      return this.plan;
    }

    getProgress() {
      if (!this.plan) return 0;
      return this._recalculateProgress();
    }

    getProgressPercent() {
      return Math.round(this.getProgress() * 100);
    }

    getHistorico() {
      return this.plan?.historico || null;
    }

    // ------------------------------------------------------
    // RECOMENDAÇÃO PARA SIMULADOS
    // ------------------------------------------------------

    /**
     * Retorna recomendação para preencher o modal de simulado:
     * { tema, qtd, dificuldade, banca }
     */
    recomendarSimulado() {
      if (!this.plan || !Array.isArray(this.plan.sessoes) || this.plan.sessoes.length === 0) {
        console.warn("⚠️ StudyManager.recomendarSimulado: sem plano ativo.");
        return null;
      }

      const progresso = this.getProgress();
      const nivel = this.plan.nivel || "iniciante";

      // Escolhe sessão base: a próxima sessão sugerida
      const sessaoBase = this.getNextSession() || this.plan.sessoes[0];

      // Define quantidade de questões baseada no progresso
      let qtd;
      if (progresso < 0.25) qtd = 5;
      else if (progresso < 0.5) qtd = 10;
      else if (progresso < 0.75) qtd = 15;
      else qtd = 20;

      // Define dificuldade baseada no nível
      let dificuldade;
      switch (nivel) {
        case "iniciante":
          dificuldade = "Fácil";
          break;
        case "intermediario":
        case "intermediário":
          dificuldade = "Média";
          break;
        case "avancado":
        case "avançado":
          dificuldade = "Difícil";
          break;
        default:
          dificuldade = "Média";
      }

      const temaSimulado = sessaoBase?.titulo
        ? `${this.plan.tema} — ${sessaoBase.titulo}`
        : this.plan.tema;

      const recomendacao = {
        tema: temaSimulado,
        qtd,
        dificuldade,
        // futuramente podemos integrar com perfil de banca real
        banca: this.plan.banca || "Mista",
      };

      console.log(
        "🧩 StudyManager.recomendarSimulado:",
        recomendacao,
        "(sessão base:",
        sessaoBase,
        ")"
      );

      return recomendacao;
    }
  }

  // Exposição global
  window.StudyManager = StudyManager;

  // Instância única global da Liora
  if (!window.lioraEstudos) {
    window.lioraEstudos = new StudyManager();
  } else {
    console.warn(
      "⚠️ StudyManager: window.lioraEstudos já existia, não foi sobrescrito."
    );
  }
})();
