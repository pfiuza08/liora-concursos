// ==========================================================
// 🧠 LIORA — USAGE v1 (CANONICAL)
// Controla uso diário por usuário
// ==========================================================

(function () {
  console.log("📊 Liora Usage v1 carregado");

  const STORAGE_KEY = "liora-usage-v1";

  function hoje() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function ensureToday(data) {
    const today = hoje();
    if (data.date !== today) {
      return {
        date: today,
        simulados: 0,
        planosPorTema: {}
      };
    }
    return data;
  }

  window.lioraUsage = {
    // -----------------------------
    // SIMULADOS
    // -----------------------------
    podeCriarSimulado(plano) {
      const limits = window.lioraLimits?.[plano]?.simulados;
      if (!limits) return false;

      let data = ensureToday(load());
      return data.simulados < limits.porDia;
    },

    registrarSimulado() {
      let data = ensureToday(load());
      data.simulados += 1;
      save(data);
    },

    // -----------------------------
    // PLANOS DE ESTUDO
    // -----------------------------
    podeCriarPlanoTema(plano, tema) {
      const limits = window.lioraLimits?.[plano]?.estudo;
      if (!limits) return false;

      let data = ensureToday(load());
      const key = String(tema || "").toLowerCase();

      const usados = data.planosPorTema[key] || 0;
      return usados < limits.planosPorTemaDia;
    },

    registrarPlanoTema(tema) {
      let data = ensureToday(load());
      const key = String(tema || "").toLowerCase();

      data.planosPorTema[key] = (data.planosPorTema[key] || 0) + 1;
      save(data);
    }
  };
})();
