// ==========================================================
// 🎨 LIORA UI — MODAL CONTROLLER CANÔNICO v3.0
// - Autossuficiente
// - Sem dependência de CSS implícito
// - Seguro para App Shell
// ==========================================================
(function () {
  console.log("🔵 Liora UI v3.0 inicializando...");

  if (window.lioraModal) {
    console.warn("⚠️ lioraModal já existe. Abortando redefinição.");
    return;
  }

  const body = document.body;

  // ------------------------------------------------------
  // 🔧 HELPERS INTERNOS (ESCOPO LOCAL)
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // 🧠 OPEN / CLOSE — CANÔNICOS
  // ------------------------------------------------------
  function open(id) {
    const modal = getModal(id);
    if (!modal) {
      console.warn("⚠️ Modal não encontrado:", id);
      return;
    }

    // BACKDROP
    modal.classList.remove("hidden");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    // CARD
    const card = modal.querySelector(".liora-modal-card");
    if (card) {
      card.style.opacity = "1";
      card.style.transform = "none";
      card.style.pointerEvents = "auto";
    }

    lockScroll();
    console.log("🟢 Modal aberto:", id);
  }

  function close(id) {
    const modal = getModal(id);
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");

    const card = modal.querySelector(".liora-modal-card");
    if (card) {
      card.style.opacity = "";
      card.style.transform = "";
      card.style.pointerEvents = "";
    }

    unlockScroll();
    console.log("🔒 Modal fechado:", id);
  }

  // ------------------------------------------------------
  // 🖱️ FECHAR AO CLICAR NO BACKDROP OU [data-close]
  // ------------------------------------------------------
  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("[data-close]");
    if (closeBtn) {
      const modal = closeBtn.closest(".liora-modal-backdrop");
      if (modal?.id) close(modal.id);
      return;
    }

    const backdrop = e.target;
    if (
      backdrop.classList.contains("liora-modal-backdrop") &&
      backdrop === e.target &&
      backdrop.id
    ) {
      close(backdrop.id);
    }
  });

  // ------------------------------------------------------
  // 🌍 API GLOBAL
  // ------------------------------------------------------
  window.lioraModal = { open, close };

  console.log("🧠 Liora Modal Controller v3.0 pronto");
})();
