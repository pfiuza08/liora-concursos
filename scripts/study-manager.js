// ==========================================================
// 📘 LIORA — STUDY MANAGER (estudos.js v3)
// ----------------------------------------------------------
// Gerencia:
// ✔ Memória completa de estudos
// ✔ Plano ativo (tema ou PDF)
// ✔ Progresso por sessão
// ✔ Última sessão estudada
// ✔ Lista de estudos recentes para a Home
// ✔ Integração total com nav-home.js / core.js
// ✔ Dados persistidos via localStorage
// ==========================================================

(function () {
  console.log("🔵 estudos.js v3 carregado…");

  const STORAGE_KEY = "liora:estudos:v3";

  // -------------------------------------------------------
  // 🔧 Utilidades
  // -------------------------------------------------------
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

  // -------------------------------------------------------
  // 📘 Study Manager API
  // -------------------------------------------------------
  const api = {
    // -----------------------------------------------------
    // Cria ou substitui o plano ativo
    // -----------------------------------------------------
    definirPlano({ tema, origem, sessoes }) {
      const data = load();

      const id = `plano_${Date.now()}`;

      const plano = {
        id,
        tema,
        origem,            // "tema" ou "upload"
        sessoes: sessoes.map((s, i) => ({
          id: s.id || `sessao_${i + 1}`,
          ordem: s.ordem || i + 1,
          titulo: s.titulo || "",
          progresso: Number(s.progresso || 0), // %
          conteudo: s.conteudo || {},
          analogias: s.analogias || [],
          ativacao: s.ativacao || [],
          quiz: s.quiz || {},
          flashcards: s.flashcards || [],
          mindmap: s.mindmap || ""
        })),
        criadoISO: new Date().toISOString(),
        atualizadoISO: new Date().toISOString()
      };

      data.planos.push(plano);
      data.ativoId = id;

      save(data);

      window.dispatchEvent(new Event("liora:plan-updated"));
      return plano;
    },

    // -----------------------------------------------------
    // Obtém o plano ativo atual
    // -----------------------------------------------------
    getPlanoAtivo() {
      const data = load();
      return data.planos.find(p => p.id === data.ativoId) || null;
    },

    // -----------------------------------------------------
    // Atualiza progresso de uma sessão
    // -----------------------------------------------------
    atualizarProgresso(sessaoId, porcentagem) {
      const data = load();
      const plano = data.planos.find(p => p.id === data.ativoId);
      if (!plano) return;

      const sessao = plano.sessoes.find(s => s.id === sessaoId);
      if (!sessao) return;

      sessao.progresso = Number(porcentagem);
      plano.atualizadoISO = new Date().toISOString();

      save(data);

      window.dispatchEvent(new Event("liora:plan-updated"));
    },

    // -----------------------------------------------------
    // Marca sessão como 100% concluída
    // -----------------------------------------------------
    concluirSessao(sessaoId) {
      api.atualizarProgresso(sessaoId, 100);
    },

    // -----------------------------------------------------
    // Retorna estudos recentes (ordenados por atualização)
    // -----------------------------------------------------
    listarRecentes(limit = 5) {
      const data = load();
      return data.planos
        .slice()
        .sort((a, b) => new Date(b.atualizadoISO) - new Date(a.atualizadoISO))
        .slice(0, limit);
    }
  };

  window.lioraEstudos = api;
})();
