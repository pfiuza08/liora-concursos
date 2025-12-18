// ==========================================================
// 🎨 LIORA UI HELPERS — LOADING + ERRO GLOBAL
// ==========================================================
(function () {
  console.log("🔵 Liora UI helpers carregados...");

  // ======================================
  // LIORA — MODAL CONTROLLER
  // ======================================
  window.lioraModal = {
    open(id) {
      const modal = document.getElementById(id);
      if (!modal) return;
  
      modal.classList.remove("hidden");
  
      // fecha ao clicar fora
      modal.onclick = (e) => {
        if (e.target === modal) {
          lioraModal.close(id);
        }
      };
  
      modal
        .querySelector(".liora-modal-close")
        ?.addEventListener("click", () => {
          lioraModal.close(id);
        });
    },
  
    close(id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.classList.add("hidden");
    }
  };

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
    const loading = {
      show(texto) {
        if (!loadingEl) return;
        if (loadingTextEl && texto) {
          loadingTextEl.textContent = texto;
        }
        loadingEl.classList.remove("hidden");
      },
      hide() {
        if (!loadingEl) return;
        loadingEl.classList.add("hidden");
      },
    };

    // ------------------------
    // ERRO GLOBAL
    // ------------------------
    const errorState = {
      retryFn: null,
      backFn: null,
    };

    const error = {
      show(msg, opts = {}) {
        if (!errorEl) {
          // fallback de segurança
          alert(msg || "Ocorreu um erro inesperado.");
          return;
        }

        if (errorMsgEl && msg) {
          errorMsgEl.textContent = msg;
        }

        errorState.retryFn =
          typeof opts.retryFn === "function" ? opts.retryFn : null;

        // por padrão, "Voltar" recarrega a página
        errorState.backFn =
          typeof opts.backFn === "function"
            ? opts.backFn
            : () => window.location.reload();

        errorEl.classList.remove("hidden");
      },
      hide() {
        if (!errorEl) return;
        errorEl.classList.add("hidden");
        errorState.retryFn = null;
        errorState.backFn = null;
      },
    };

    // Botões do overlay de erro
    if (errorRetryBtn) {
      errorRetryBtn.addEventListener("click", () => {
        const fn = errorState.retryFn;
        error.hide();
        if (fn) fn();
      });
    }

    if (errorBackBtn) {
      errorBackBtn.addEventListener("click", () => {
        const fn = errorState.backFn;
        error.hide();
        if (fn) fn();
      });
    }

    // Expor globais
    window.lioraLoading = loading;
    window.lioraError = error;

    console.log("🟢 Liora UI helpers prontos.");
  });
})();
