// ==========================================================
// 🎨 LIORA — MODAL CONTROLLER (FINAL E SIMPLES)
// ==========================================================
(function () {
  console.log("🔵 Liora Modal Controller FINAL carregado");

  const body = document.body;

  function open(id) {
    const modal = document.getElementById(id);
    if (!modal) {
      console.warn("⚠️ Modal não encontrado:", id);
      return;
    }

    // 🔑 ISSO É O QUE FALTAVA
    modal.classList.remove("hidden");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    body.style.overflow = "hidden";
    console.log("🟢 Modal aberto:", id);
  }

  function close(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.add("hidden");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    body.style.overflow = "";
    console.log("🔒 Modal fechado:", id);
  }

  // Botão fechar
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-close]");
    if (!btn) return;

    const modal = btn.closest(".liora-modal-backdrop");
    if (modal?.id) close(modal.id);
  });

  // Clique no backdrop
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
