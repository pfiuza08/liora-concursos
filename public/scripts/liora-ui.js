// ==========================================================
// 🎨 LIORA UI HELPERS — MODAIS + LOADING + ERRO GLOBAL
// Versão CANÔNICA v2.1 (limpa e estável)
// ==========================================================
(function () {
  console.log("🔵 Liora UI helpers v2.1 carregando...");

  // ======================================================
  // 🧠 MODAL CONTROLLER — FONTE ÚNICA
  // ======================================================
  if (!window.lioraModal) {
    const body = document.body;

    function getModal(id) {
      return document.getElementById(id);
    }

    function lockScroll() {
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
    }

    function unlockScroll() {
      body.style.overflow = "";
      body.style.touchAction = "";
    }

  function open(id) {
    const modal = getModal(id);
    if (!modal) {
      console.warn("⚠️ Modal não encontrado:", id);
      return;
    }
  
    // 🔴 fecha TODOS os backdrops primeiro
    document
      .querySelectorAll(".liora-modal-backdrop, .sim-modal-backdrop")
      .forEach((bd) => {
        bd.classList.remove("is-open");
        bd.classList.add("hidden");
      });
  
    // 🔵 identifica o backdrop correto
    const backdrop = modal.closest(
      ".liora-modal-backdrop, .sim-modal-backdrop"
    );
  
    if (!backdrop) {
      console.warn("⚠️ Backdrop não encontrado para modal:", id);
      return;
    }
  
    backdrop.classList.remove("hidden");
    backdrop.classList.add("is-open");
  
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  
    lockScroll();
    console.log("🟢 Modal aberto:", id);
  }
  
  function close(id) {
    const modal = getModal(id);
    if (!modal) return;
  
    const backdrop = modal.closest(
      ".liora-modal-backdrop, .sim-modal-backdrop"
    );
  
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  
    if (backdrop) {
      backdrop.classList.remove("is-open");
      backdrop.classList.add("hidden");
    }
  
    unlockScroll();
    console.log("🔒 Modal fechado:", id);
  }

    // ------------------------------
    // FECHAR POR BOTÃO [data-close]
    // ------------------------------
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-close]");
      if (!btn) return;

      const modal = btn.closest(
        ".liora-modal, .liora-modal-backdrop, .sim-modal-backdrop"
      );

      if (modal?.id) close(modal.id);
    });

    // ------------------------------
    // FECHAR CLICANDO NO BACKDROP
    // ------------------------------
    document.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("liora-modal-backdrop") ||
        e.target.classList.contains("sim-modal-backdrop")
      ) {
        if (e.target.id) close(e.target.id);
      }
    });

    window.lioraModal = { open, close };
    console.log("🧠 Liora Modal Controller v2.1 pronto");
  }

  // ======================================================
  // ⏳ LOADING + ❌ ERRO GLOBAL
  // ======================================================
  document.addEventListener("DOMContentLoaded", () => {
    const loadingEl = document.getElementById("liora-loading");
    const loadingTextEl = document.getElementById("liora-loading-text");

    const errorEl = document.getElementById("liora-error");
    const errorMsgEl = document.getElementById("liora-error-message");
    const errorRetryBtn = document.getElementById("liora-error-retry");
    const errorBackBtn = document.getElementById("liora-error-back");

    // ------------------------
    // LOADING GLOBAL
    // ------------------------
    window.lioraLoading = {
      show(texto) {
        if (!loadingEl) return;
        if (loadingTextEl && texto) {
          loadingTextEl.textContent = texto;
        }
        loadingEl.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      },
      hide() {
        if (!loadingEl) return;
        loadingEl.classList.add("hidden");
        document.body.style.overflow = "";
      },
    };

    // ------------------------
    // ERRO GLOBAL
    // ------------------------
    const errorState = {
      retryFn: null,
      backFn: null,
    };

    window.lioraError = {
      show(msg, opts = {}) {
        if (!errorEl) {
          alert(msg || "Ocorreu um erro inesperado.");
          return;
        }

        if (errorMsgEl && msg) {
          errorMsgEl.textContent = msg;
        }

        errorState.retryFn =
          typeof opts.retryFn === "function" ? opts.retryFn : null;

        errorState.backFn =
          typeof opts.backFn === "function"
            ? opts.backFn
            : () => window.location.reload();

        errorEl.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      },

      hide() {
        if (!errorEl) return;
        errorEl.classList.add("hidden");
        errorState.retryFn = null;
        errorState.backFn = null;
        document.body.style.overflow = "";
      },
    };

    if (errorRetryBtn) {
      errorRetryBtn.addEventListener("click", () => {
        const fn = errorState.retryFn;
        window.lioraError.hide();
        if (fn) fn();
      });
    }

    if (errorBackBtn) {
      errorBackBtn.addEventListener("click", () => {
        const fn = errorState.backFn;
        window.lioraError.hide();
        if (fn) fn();
      });
    }

    console.log("🟢 Liora UI helpers v2.1 prontos");
  });
})();
