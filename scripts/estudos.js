// ==========================================================
// 🧠 LIORA — ESTUDOS v1
// Memória de Estudos da Liora (localStorage)
// ----------------------------------------------------------
// - Lê todos os planos salvos pelo core (liora:wizard:*)
// - Cria um "inventário de estudos" em memória
// - Fornece helpers globais em window.lioraEstudos:
//      • scan()
//      • getAll()
//      • getRecentes(limit)
//      • getByTemaNivel(tema, nivel)
//      • recomendarSimulado()
//      • limparTudo()
//      • apagar(tema, nivel)
//      • syncFromWizard(wizard)   (opcional, para o core usar)
// ==========================================================

(function () {
  console.log("🔵 lioraEstudos.js carregado...");

  // --------------------------------------------------------
  // CONSTANTES
  // --------------------------------------------------------
  const PREFIX = "liora:wizard:";

  /**
   * Normaliza tema/nivel para chave estável
   */
  function makeKey(tema, nivel) {
    const t = (tema || "").toString().trim().toLowerCase();
    const n = (nivel || "").toString().trim().toLowerCase();
    return `${t}::${n}`;
  }

  /**
   * Converte qualquer valor em Date (ou null)
   */
  function toDate(value) {
    if (!value) return null;
    try {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  // --------------------------------------------------------
  // REGISTRY INTERNO
  // --------------------------------------------------------
  const registry = {
    // [key: string]: StudyRecord
    items: {},
  };

  /**
   * Cria um StudyRecord a partir do objeto wizard salvo no localStorage
   */
  function buildRecordFromWizard(lsKey, wizardObj) {
    if (!wizardObj || typeof wizardObj !== "object") return null;

    const tema = wizardObj.tema || "Tema sem nome";
    const nivel = wizardObj.nivel || "iniciante";
    const key = makeKey(tema, nivel);

    const sessoes = Array.isArray(wizardObj.sessoes) ? wizardObj.sessoes : [];
    const sessoesTotal = sessoes.length || 0;

    let sessoesConcluidas = 0;
    if (typeof wizardObj.atual === "number" && sessoesTotal > 0) {
      // aqui poderíamos ser mais sofisticados, mas por enquanto:
      sessoesConcluidas = Math.min(
        Math.max(wizardObj.atual, 0),
        sessoesTotal
      );
    }

    // timestamp salvo pelo core (se existir)
    let atualizadoEm = toDate(wizardObj.atualizadoEm);

    // Se não existir, gera agora e já devolve pro localStorage
    if (!atualizadoEm) {
      atualizadoEm = new Date();
      try {
        wizardObj.atualizadoEm = atualizadoEm.toISOString();
        localStorage.setItem(lsKey, JSON.stringify(wizardObj));
      } catch (e) {
        console.warn("⚠️ Não foi possível backfill de atualizadoEm:", e);
      }
    }

    return {
      tema,
      nivel,
      origem: wizardObj.origem || "tema",
      sessoesTotal,
      sessoesConcluidas,
      atualizadoEm,
      keyStorage: lsKey,
      key, // chave normalizada (tema::nivel)
    };
  }

  /**
   * Faz o scan geral do localStorage e recria o registry
   */
  function scan() {
    registry.items = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const lsKey = localStorage.key(i);
        if (!lsKey || !lsKey.startsWith(PREFIX)) continue;

        const raw = localStorage.getItem(lsKey);
        if (!raw) continue;

        let wizardObj;
        try {
          wizardObj = JSON.parse(raw);
        } catch (e) {
          console.warn("⚠️ lioraEstudos: JSON inválido em", lsKey, e);
          continue;
        }

        const rec = buildRecordFromWizard(lsKey, wizardObj);
        if (!rec) continue;

        registry.items[rec.key] = rec;
      }

      console.log("🧠 lioraEstudos scan OK:", Object.keys(registry.items).length, "registros.");
    } catch (e) {
      console.error("❌ lioraEstudos.scan ERRO:", e);
    }

    return registry.items;
  }

  // --------------------------------------------------------
  // HELPERS PÚBLICOS
  // --------------------------------------------------------
  function getAll() {
    const arr = Object.values(registry.items);
    return arr
      .slice()
      .sort((a, b) => b.atualizadoEm - a.atualizadoEm); // mais recente primeiro
  }

  function getRecentes(limit = 5) {
    return getAll().slice(0, limit);
  }

  function getByTemaNivel(tema, nivel) {
    const key = makeKey(tema, nivel);
    return registry.items[key] || null;
  }

  /**
   * Usa o registry para sugerir um simulado.
   * Regra inicial (pode sofisticar depois):
   * - Pega o estudo mais recente
   * - Tema = nome do tema
   * - Dificuldade aproximada pelo nível
   * - Banca default: FGV
   * - Qtd: baseada no tamanho do plano
   */
  function recomendarSimulado() {
    const todos = getAll();
    if (!todos.length) {
      return null; // nada a recomendar ainda
    }

    const estudo = todos[0]; // mais recente

    let dificuldade = "misturado";
    const nivelNorm = (estudo.nivel || "").toLowerCase();
    if (nivelNorm.includes("iniciante")) dificuldade = "facil";
    else if (nivelNorm.includes("inter")) dificuldade = "medio";
    else if (nivelNorm.includes("avanc")) dificuldade = "dificil";

    let qtd = 10;
    if (estudo.sessoesTotal >= 8) qtd = 20;
    if (estudo.sessoesTotal >= 15) qtd = 30;

    return {
      tema: estudo.tema,
      banca: "FGV", // pode ser ajustado depois com base no histórico
      qtd,
      dificuldade,
      nivel: estudo.nivel,
      origem: estudo.origem,
    };
  }

  /**
   * Remove TODOS os estudos da memória (só os wizards)
   */
  function limparTudo() {
    const keysToDelete = [];

    for (let i = 0; i < localStorage.length; i++) {
      const lsKey = localStorage.key(i);
      if (lsKey && lsKey.startsWith(PREFIX)) {
        keysToDelete.push(lsKey);
      }
    }

    keysToDelete.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {
        console.warn("⚠️ Não foi possível remover", k, e);
      }
    });

    registry.items = {};
    console.log("🗑️ lioraEstudos: todos os estudos foram removidos.");
  }

  /**
   * Remove apenas 1 estudo (tema + nível)
   */
  function apagar(tema, nivel) {
    const key = makeKey(tema, nivel);
    const rec = registry.items[key];
    if (!rec) return;

    try {
      localStorage.removeItem(rec.keyStorage);
    } catch (e) {
      console.warn("⚠️ Não foi possível remover do localStorage:", rec.keyStorage, e);
    }

    delete registry.items[key];
    console.log(`🗑️ lioraEstudos: estudo removido (${tema} / ${nivel}).`);
  }

  /**
   * Sincroniza o registry com um objeto wizard que acabou de ser salvo pelo core.
   * Opcional, mas útil se você quiser atualizar em tempo real sem precisar dar scan().
   */
  function syncFromWizard(wizardObj) {
    if (!wizardObj || !wizardObj.tema) return;

    const tema = wizardObj.tema;
    const nivel = wizardObj.nivel || "iniciante";
    const key = makeKey(tema, nivel);

    // Encontrar a key real do localStorage
    let lsKey = null;
    const expectedPrefix = PREFIX + tema.toLowerCase() + "::" + (nivel || "").toLowerCase();

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.toLowerCase() === expectedPrefix) {
        lsKey = k;
        break;
      }
    }

    // Se não encontrar, não sincroniza
    if (!lsKey) return;

    const rec = buildRecordFromWizard(lsKey, wizardObj);
    if (!rec) return;

    registry.items[rec.key] = rec;
  }

  // --------------------------------------------------------
  // EXPOE GLOBAL
  // --------------------------------------------------------
  window.lioraEstudos = {
    scan,
    getAll,
    getRecentes,
    getByTemaNivel,
    recomendarSimulado,
    limparTudo,
    apagar,
    syncFromWizard,
  };

  // Faz um primeiro scan ao carregar
  scan();

  console.log("🟢 lioraEstudos inicializado.");
})();
