// =======================================================
// 🎯 LIORA — UI ACTIONS (ORQUESTRADOR ÚNICO)
// Versão: v106-CANONICAL-CLEAN
// Data: 2026-01-14
//
// RESPONSABILIDADE:
// - Disparar eventos de intenção do usuário
// - NÃO renderiza telas
// - NÃO abre modais
// - NÃO controla layout
// =======================================================

console.log("🔖 UI-ACTIONS v106-CANONICAL-CLEAN — carregado");

(function () {
  console.log("🎯 UI Actions inicializado");

  // ------------------------------------------------------
  // AUTH STATE (somente leitura aqui)
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

      document.dispatchEvent(new Event("liora:render-auth-ui"));
      document.dispatchEvent(new Event("liora:go-home"));
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
    // SIMULADOS — OPÇÃO B
    // =============================

    // ➜ Entra na ÁREA de simulados (screen)
    openSimulados() {
      console.log("🎯 openSimulados → área de simulados");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      window.dispatchEvent(new Event("liora:open-simulados"));
    },

    // ➜ Abre MODAL de configuração (FAB ⚙)
    openSimConfig() {
      console.log("🎯 openSimConfig → modal de configuração");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      window.dispatchEvent(new Event("liora:open-sim-config"));
    },

    // ➜ Start oficial do simulado
    startSimulado() {
      console.log("🎯 startSimulado (ui-actions)");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      window.dispatchEvent(
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
  // EXPÕE AÇÕES
  // ------------------------------------------------------
  Object.defineProperty(window, "lioraActions", {
    value: actions,
    writable: false,
    configurable: false
  });

  console.log("🔒 lioraActions protegido");

  // =======================================================
  // 🔗 BINDER CANÔNICO — data-action
  // =======================================================
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;

    const action = el.dataset.action;
    const fn = window.lioraActions?.[action];

    if (typeof fn !== "function") {
      console.warn("⚠️ Ação não registrada:", action);
      return;
    }

    console.log("🧭 Ação disparada:", action);
    fn.call(window.lioraActions, el);
  });

  // =======================================================
  // ▶ START SIMULADO — BOTÃO FIXO (fora do modal)
  // =======================================================
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#btn-start-simulado");
    if (!btn) return;

    e.preventDefault();

    console.log("🚀 START SIMULADO (botão da área)");

    window.dispatchEvent(
      new CustomEvent("liora:start-simulado", {
        detail: { origem: "ui-actions", via: "area-btn" }
      })
    );
  });

})();
