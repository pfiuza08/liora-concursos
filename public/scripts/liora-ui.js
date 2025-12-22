// ==========================================================
// 🎨 LIORA UI HELPERS — MODAIS + LOADING + ERRO GLOBAL
// Versão CANÔNICA v2.3 (BLINDADA)
// ==========================================================
(function () {
  console.log("🔵 Liora UI helpers v2.3 carregando...");

 // ======================================================
// 🧠 MODAL CONTROLLER — COMPATÍVEL COM HTML ESTÁTICO
// ======================================================
if (!window.lioraModal) {
  const body = document.body;

  function getModal(id) {
    return document.getElementById(id);
  }

  function lockScroll() {
    body.style.overflow = "hidden";
    body.classList.add("liora-modal-open");
  }

  function unlockScroll() {
    body.style.overflow = "";
    body.classList.remove("liora-modal-open");
  }

  function open(id) {
    const modal = getModal(id);
    if (!modal) {
      console.warn("⚠️ Modal não encontrado:", id);
      return;
    }

    modal.classList.remove("hidden");
    modal.classList.add("visible");
    modal.setAttribute("aria-hidden", "false");

    lockScroll();
    console.log("🟢 Modal aberto:", id);
  }

  function close(id) {
    const modal = getModal(id);
    if (!modal) return;

    modal.classList.add("hidden");
    modal.classList.remove("visible");
    modal.setAttribute("aria-hidden", "true");

    unlockScroll();
    console.log("🔒 Modal fechado:", id);
  }

  window.lioraModal = { open, close };
  console.log("🧠 Liora Modal Controller v2.2 pronto");
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

    errorRetryBtn?.addEventListener("click", () => {
      const fn = errorState.retryFn;
      window.lioraError.hide();
      if (fn) fn();
    });

    errorBackBtn?.addEventListener("click", () => {
      const fn = errorState.backFn;
      window.lioraError.hide();
      if (fn) fn();
    });

    console.log("🟢 Liora UI helpers v2.3 prontos");
  });
})();
