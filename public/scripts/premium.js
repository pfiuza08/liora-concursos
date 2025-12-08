// ==========================================================
// 💎 LIORA — PREMIUM v1
// - Controla o modal de upgrade
// - Exposto como window.lioraPremium.openUpgradeModal(from)
// - Integra com botões data-liora-plano
// ==========================================================

(function () {
  console.log("🔵 Liora Premium v1 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    const backdrop = document.getElementById("liora-upgrade-modal-backdrop");
    const closeBtn = document.getElementById("liora-upgrade-close");
    const planButtons = document.querySelectorAll("[data-liora-plano]");

    if (!backdrop) {
      console.warn("⚠️ Modal Premium não encontrado no DOM.");
      return;
    }

    function openUpgradeModal(from) {
      console.log("💎 Abrindo modal premium. Origem:", from || "desconhecida");
      backdrop.classList.remove("hidden");
      backdrop.classList.add("visible");

      // Se você quiser rastrear eventos:
      if (window.lioraTrack && typeof window.lioraTrack === "function") {
        window.lioraTrack("upgrade_open", { from: from || "unknown" });
      }
    }

    function closeUpgradeModal() {
      backdrop.classList.remove("visible");
      backdrop.classList.add("hidden");
    }

    // Fechar por clique no X
    if (closeBtn) {
      closeBtn.addEventListener("click", closeUpgradeModal);
    }

    // Fechar clicando fora do modal
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) {
        closeUpgradeModal();
      }
    });

    // Fechar com ESC
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        closeUpgradeModal();
      }
    });

    // Ações nos botões de plano
    planButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const plano = btn.dataset.lioraPlano || "desconhecido";
        console.log("💳 Clique em plano premium:", plano);

        // TODO: aqui você coloca o link real do pagamento
        // Exemplo (trocar pelas URLs reais de checkout):
        if (plano === "mensal") {
          // window.location.href = "https://seu-link-de-checkout-mensal.com";
        } else if (plano === "trimestral") {
          // window.location.href = "https://seu-link-de-checkout-trimestral.com";
        }

        if (window.lioraTrack && typeof window.lioraTrack === "function") {
          window.lioraTrack("upgrade_click_plan", { plano });
        }
      });
    });

    // Expor globalmente para nav-home e limites free
    window.lioraPremium = {
      openUpgradeModal,
      closeUpgradeModal,
    };

    console.log("🟢 Liora Premium v1 inicializado.");
  });
})();
