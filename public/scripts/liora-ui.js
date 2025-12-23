// ==========================================================
// 🎨 LIORA — MODAL CONTROLLER (FASE 1A · ESTÁVEL)
// ==========================================================
(function () {
  console.log("🔵 Liora Modal Controller — Fase 1A");

  if (window.lioraModal) return;

  const body = document.body;

  function open(id) {
    const modal = document.getElementById(id);
    if (!modal) {
      console.warn("⚠️ Modal não encontrado:", id);
      return;
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    body.style.overflow = "hidden";
    console.log("🟢 Modal aberto:", id);
  }

  function close(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    body.style.overflow = "";
    console.log("🔒 Modal fechado:", id);
  }

  // Fecha por botão [data-close]
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-close]");
    if (!btn) return;

    const modal = btn.closest(".liora-modal-backdrop");
    if (modal?.id) close(modal.id);
  });

  // Fecha clicando no backdrop
  document.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("liora-modal-backdrop") &&
      e.target === e.target
    ) {
      if (e.target.id) close(e.target.id);
    }
  });

  window.lioraModal = { open, close };
})();
