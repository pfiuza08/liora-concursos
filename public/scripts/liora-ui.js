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
  
    // ✅ Compatibilidade com seus CSS antigos e novos
    modal.classList.remove("hidden");
    modal.classList.add("visible");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  
    // ✅ Força visual (resolve casos em que CSS deixa opacity 0 / pointer-events none)
    modal.style.display = "flex";
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
    modal.style.zIndex = "9999";
  
    lockScroll();
    console.log("🟢 Modal aberto:", id);
  }
  
  function close(id) {
    const modal = getModal(id);
    if (!modal) return;
  
    // ✅ Fecha em qualquer padrão
    modal.classList.add("hidden");
    modal.classList.remove("visible");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  
    // ✅ Limpa overrides
    modal.style.display = "";
    modal.style.opacity = "";
    modal.style.pointerEvents = "";
    modal.style.zIndex = "";
  
    unlockScroll();
    console.log("🔒 Modal fechado:", id);
  }

   
   // ------------------------------
    // FECHAR CLICANDO APENAS NO FUNDO (BACKDROP REAL)
    // ------------------------------
    document.addEventListener("click", (e) => {
      const backdrop = e.target;
    
      // ⚠️ só fecha se o clique foi EXATAMENTE no backdrop
      if (
        (backdrop.classList.contains("liora-modal-backdrop") ||
         backdrop.classList.contains("sim-modal-backdrop")) &&
        backdrop === e.target
      ) {
        if (backdrop.id) {
          close(backdrop.id);
        }
      }
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
