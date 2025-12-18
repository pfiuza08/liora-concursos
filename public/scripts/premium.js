// ===============================================================
// 🟠 LIORA PREMIUM — v9 CANONICAL
// - Controla APENAS quando abrir / fechar o modal premium
// - Toda a UI é responsabilidade do lioraModal
// - Nenhum CSS inline
// - Nenhum controle manual de outros modais
// ===============================================================

(function () {
  console.log("🟠 Liora Premium v9 carregado");

  document.addEventListener("DOMContentLoaded", () => {
    const MODAL_ID = "liora-premium-modal";

    // -----------------------------------------------------------
    // GUARDA DE SEGURANÇA
    // -----------------------------------------------------------
    if (!document.getElementById(MODAL_ID)) {
      console.warn("⚠️ Premium v9: modal não encontrado:", MODAL_ID);
      return;
    }

    // -----------------------------------------------------------
    // API PÚBLICA CANÔNICA
    // -----------------------------------------------------------
    function openUpgradeModal(origem = "unknown") {
      console.log("✨ Abrindo Premium | origem:", origem);
      window.lioraModal?.open(MODAL_ID);
    }

    function closeUpgradeModal() {
      console.log("⏹ Fechando Premium");
      window.lioraModal?.close(MODAL_ID);
    }

    // -----------------------------------------------------------
    // EVENTOS GLOBAIS
    // -----------------------------------------------------------
    window.addEventListener("liora:premium-bloqueado", () => {
      openUpgradeModal("bloqueio");
    });

    window.addEventListener("liora:open-premium", () => {
      openUpgradeModal("manual");
    });

    // -----------------------------------------------------------
    // EXPOSIÇÃO GLOBAL
    // -----------------------------------------------------------
    window.lioraPremium = {
      openUpgradeModal,
      closeUpgradeModal,
    };

    console.log("🟢 Liora Premium v9 pronto");
  });
})();
