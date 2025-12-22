// ==========================================================
// 🎨 LIORA UI HELPERS — MODAIS + LOADING + ERRO GLOBAL
// Versão CANÔNICA v2.3 (BLINDADA)
// ==========================================================
(function () {
  console.log("🔵 Liora UI helpers v2.3 carregando...");

  // ======================================================
  // 🧠 MODAL CONTROLLER — FONTE ÚNICA DA VERDADE
  // ======================================================
  if (!window.lioraModal) {
    const body = document.body;
    let activeModal = null;
    let backdropEl = null;

    function getModal(id) {
      return document.getElementById(id);
    }

    function createBackdrop(id) {
      removeBackdrop();

      backdropEl = document.createElement("div");
      backdropEl.className = "liora-modal-backdrop";
      backdropEl.dataset.modal = id;
      backdropEl.style.zIndex = "9998";

      backdropEl.addEventListener("click", () => {
        close(id);
      });

      document.body.appendChild(backdropEl);
    }

    function removeBackdrop() {
      if (backdropEl) {
        backdropEl.remove();
        backdropEl = null;
      }
    }

    function lockScroll() {
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
      body.style.pointerEvents = "auto";
      body.classList.add("liora-modal-open");
    }

    function unlockScroll() {
      body.style.overflow = "";
      body.style.touchAction = "";
      body.style.pointerEvents = "auto";
      body.classList.remove("liora-modal-open");
    }

    function open(id) {
      const modal = getModal(id);
      if (!modal) {
        console.warn("⚠️ Modal não encontrado:", id);
        return;
      }

      if (activeModal === id) return;

      activeModal = id;

      modal.classList.remove("hidden");
      modal.classList.add("visible", "is-open");
      modal.setAttribute("aria-hidden", "false");

      modal.style.display = "flex";
      modal.style.opacity = "1";
      modal.style.pointerEvents = "auto";
      modal.style.zIndex = "9999";

      createBackdrop(id);
      lockScroll();

      console.log("🟢 Modal aberto:", id);
    }

    function close(id) {
      const modal = getModal(id);
      if (!modal) return;

      if (activeModal !== id) return;

      modal.classList.add("hidden");
      modal.classList.remove("visible", "is-open");
      modal.setAttribute("aria-hidden", "true");

      removeBackdrop();
      unlockScroll();

      activeModal = null;

      console.log("🔒 Modal fechado:", id);
    }

    function closeAll() {
      if (activeModal) {
        close(activeModal);
      }
    }

    window.lioraModal = { open, close, closeAll };
    console.log("🧠 Liora Modal Controller v2.3 pronto");
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
