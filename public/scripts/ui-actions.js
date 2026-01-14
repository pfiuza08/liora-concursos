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
      console.log("🎯 openSimulados (abrir configuração)");

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      // ✅ SEMPRE abre a configuração
      window.dispatchEvent(new Event("liora:open-simulados"));
    },

    // ⚙ FAB de configuração
    openSimConfig() {
      console.log("🎯 openSimConfig (abrir configuração)");
      this.openSimulados();
    },

    startSimulado() {
      console.log("🎯 startSimulado");

      // 🔓 Fecha o modal GLOBAL antes de qualquer coisa
      const layer = document.getElementById("layer-modal");
      if (layer) {
        layer.classList.add("hidden");
        layer.removeAttribute("aria-hidden");
      }

      document.activeElement?.blur();

      if (!window.lioraAuth?.user) {
        this.openAuth();
        return;
      }

      // 🔔 ÚNICO ponto que inicia simulado (via UI-ACTIONS)
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

  // =======================================================
  // 🚀 START SIMULADO — BOTÃO FIXO (FORA DO MODAL)
  // =======================================================
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#btn-start-simulado");
    if (!btn) return;

    e.preventDefault();

    console.log("🚀 START SIMULADO (fora do modal)");

    window.dispatchEvent(
      new CustomEvent("liora:start-simulado", {
        detail: { origem: "ui-actions" }
      })
    );
  });

})();
