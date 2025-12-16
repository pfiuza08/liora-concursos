// ===============================================================
// 🟠 LIORA PREMIUM — v8 CANONICAL + SAFE
// - Controla SOMENTE o modal #liora-premium-modal
// - Abre apenas via eventos explícitos
// - Não interfere em Simulados, Login ou outros modais
// - Compatível com nav-home, simulados e core atuais
// ===============================================================

(function () {
  console.log("🔵 Liora Premium v8 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    const backdrop = document.getElementById("liora-premium-modal");
    const closeBtn = document.getElementById("liora-premium-close");

    if (!backdrop) {
      console.error("❌ Premium v8: #liora-premium-modal NÃO encontrado no DOM");
      return;
    }

    // ===========================================================
    // 🔒 FUNÇÕES INTERNAS
    // ===========================================================
    function forceHide(el) {
      if (!el) return;
      el.classList.remove("visible");
      el.classList.add("hidden");
      el.style.display = "none";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
    }

    function forceShow(el) {
      if (!el) return;
      el.classList.remove("hidden");
      el.classList.add("visible");
      el.style.display = "flex";
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
    }

    // ===========================================================
    // 🧹 FECHA OUTROS MODAIS (SEGURANÇA TOTAL)
    // ===========================================================
    function closeOtherModals() {
      document
        .querySelectorAll(".liora-modal-backdrop.visible")
        .forEach((el) => {
          if (el !== backdrop) {
            forceHide(el);
          }
        });
    }

    // ===========================================================
    // 🚀 API PÚBLICA
    // ===========================================================
    function openUpgradeModal(origem = "unknown") {
      console.log("✨ Abrindo Premium v8 | origem:", origem);

      closeOtherModals();
      forceShow(backdrop);
    }

    function closeUpgradeModal() {
      console.log("⏹ Fechando Premium v8");
      forceHide(backdrop);
    }

    // ===========================================================
    // 🔔 EVENTOS GLOBAIS (CANÔNICOS)
    // ===========================================================
    window.addEventListener("liora:premium-bloqueado", () => {
      console.log("🔐 Evento premium-bloqueado recebido");
      openUpgradeModal("bloqueio");
    });

    window.addEventListener("liora:open-premium", () => {
      openUpgradeModal("manual");
    });

    // ===========================================================
    // 🎯 EVENTOS LOCAIS
    // ===========================================================
    closeBtn?.addEventListener("click", closeUpgradeModal);

    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) {
        closeUpgradeModal();
      }
    });

    // ===========================================================
    // 🌍 EXPOSIÇÃO GLOBAL CONTROLADA
    // ===========================================================
    window.lioraPremium = {
      openUpgradeModal,
      closeUpgradeModal,
    };

    // Estado inicial garantido
    forceHide(backdrop);

    console.log("🟢 Liora Premium v8 pronto e blindado.");
  });
})();
