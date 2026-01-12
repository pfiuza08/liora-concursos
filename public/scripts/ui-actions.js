// =======================================================
// 🎯 LIORA — UI ACTIONS (ORQUESTRADOR ÚNICO)
// Versão: v105-CANONICAL
// Data: 2026-01-12
//
// - Fonte única de decisões de ação
// - NÃO renderiza telas
// - NÃO controla auth modal diretamente
// - Binder canônico via data-action
// =======================================================

console.log("🔖 UI-ACTIONS v105-CANONICAL — carregado");

(function () {
  console.log("🎯 UI Actions inicializado");

  // ------------------------------------------------------
  // ESTADO GLOBAL DE AUTH (somente leitura aqui)
  // ------------------------------------------------------
  window.lioraAuth = window.lioraAuth || { user: null };

  // ------------------------------------------------------
  // AÇÕES CANÔNICAS
  // ------------------------------------------------------
  const actions = {
    // =============================
    // AUTH
    // =============================
    openAuth() {
      console.log("🎯 openAuth");
      document.dispatchEvent(new Event("liora:open-auth"));
    },

    logout() {
      console.log("🎯 logout");

      window.lioraAuth.user = null;
      localStorage.removeItem("liora:user");

      window.dispatchEvent(new Event("liora:render-auth-ui"));
      window.dispatchEvent(new Event("liora:go-home"));
    },

    // =============================
    // ESTUDO
    // =============================
    openTema() {
      console.log("🎯 openTema");
      window.dispatchEvent(new Event("liora:open-estudo-tema"));
    },

    openUpload() {
      console.log("🎯 openUpload");
      window.dispatchEvent(new Event("liora:open-estudo-upload"));
    },

    // =============================
    // SIMULADOS
    // =============================
    openSimulados() {
      console.log("🎯 openSimulados");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      // Evento único e canônico para abrir configuração
      window.dispatchEvent(new Event("liora:open-simulados"));
    },

    // ⚙ FAB de configuração é apenas um atalho
    // para o mesmo fluxo de abertura
    openSimConfig() {
      console.log("🎯 openSimConfig (alias de openSimulados)");
      this.openSimulados();
    },

    startSimulado() {
      console.log("🎯 startSimulado");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      // 🔔 DISPARO CANÔNICO DO SIMULADO
      document.dispatchEvent(
        new CustomEvent("liora:start-simulado", {
          detail: {
            origem: "ui-actions",
            timestamp: Date.now()
          }
        })
      );
    },

    // =============================
    // DASHBOARD
    // =============================
    openDashboard() {
      console.log("🎯 openDashboard");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      window.dispatchEvent(new Event("liora:open-dashboard"));
    },

    // =============================
    // PREMIUM
    // =============================
    openUpgrade() {
      console.log("🎯 openUpgrade");
      window.dispatchEvent(new Event("liora:open-premium"));
    }
  };

  // ------------------------------------------------------
  // EXPÕE AÇÕES (IMUTÁVEL)
  // ------------------------------------------------------
  Object.defineProperty(window, "lioraActions", {
    value: actions,
    writable: false,
    configurable: false
  });

  console.log("🔒 lioraActions protegido contra sobrescrita");

  // =======================================================
  // 🔗 BINDER CANÔNICO — DATA-ACTION
  // =======================================================
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;

    const action = el.dataset.action;
    if (!action) return;

    const fn = window.lioraActions[action];

    if (typeof fn !== "function") {
      console.warn("⚠️ Ação não registrada:", action);
      return;
    }

    console.log("🧭 Ação disparada:", action);
    fn.call(window.lioraActions, el);
  });

})();
