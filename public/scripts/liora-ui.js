// ==========================================================
// 🎨 LIORA — MODAL CONTROLLER (CANÔNICO · ESTÁVEL)
// Compatível com UI Router + Fullscreen Screens
// ==========================================================
(function () {
  if (window.lioraModal) return;

  console.log("🔵 Liora Modal Controller — CANÔNICO");

  const body = document.body;
  let openCount = 0;

  function lockScroll() {
    body.style.overflow = "hidden";
  }

  function unlockScroll() {
    body.style.overflow = "";
  }

  function open(id) {
    const modal = document.getElementById(id);
    if (!modal) {
      console.warn("⚠️ Modal não encontrado:", id);
      return;
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    openCount++;
    lockScroll();

    console.log("🟢 Modal aberto:", id);
  }

  function close(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) {
      unlockScroll();
    }

    console.log("🔒 Modal fechado:", id);
  }

  // --------------------------------------------------
  // FECHAR POR BOTÃO [data-close]
  // --------------------------------------------------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-close]");
    if (!btn) return;

    const modal = btn.closest(".liora-modal-backdrop");
    if (modal?.id) close(modal.id);
  });

  // --------------------------------------------------
  // FECHAR CLICANDO NO BACKDROP
  // --------------------------------------------------
  document.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("liora-modal-backdrop")
    ) {
      close(e.target.id);
    }
  });

  // --------------------------------------------------
  // API GLOBAL
  // --------------------------------------------------
  window.lioraModal = { open, close };

})();
