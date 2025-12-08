// ===============================================================
// 🟠 LIORA PREMIUM — v6 SIMPLES (SEM LOGIN OBRIGATÓRIO)
// - Controla só o modal #liora-premium-backdrop
// - Compatível com index atual e nav-home v93
// ===============================================================

(function () {
  console.log("🔵 Liora Premium v6 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    const backdrop = document.getElementById("liora-premium-backdrop");
    const closeBtn = document.getElementById("liora-premium-close");

    if (!backdrop) {
      console.error("❌ ERRO: #liora-premium-backdrop NÃO encontrado no DOM!");
      return;
    }

    // ---------------------------------------------------------
    // FUNÇÕES
    // ---------------------------------------------------------
    function openUpgradeModal(origem = "unknown") {
      console.log("✨ Abrindo modal Premium… Origem:", origem);

      // garante que aparece
      backdrop.classList.remove("hidden");
      backdrop.classList.add("visible");
    }

    function closeUpgradeModal() {
      backdrop.classList.remove("visible");
      backdrop.classList.add("hidden");
    }

    // ---------------------------------------------------------
    // EVENTOS LOCAIS
    // ---------------------------------------------------------
    if (closeBtn) {
      closeBtn.addEventListener("click", closeUpgradeModal);
    }

    // fechar clicando fora do card
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) {
        closeUpgradeModal();
      }
    });

    // ---------------------------------------------------------
    // EXPOSTO GLOBALMENTE (usado pelo nav-home)
    // ---------------------------------------------------------
    window.lioraPremium = {
      openUpgradeModal,
      closeUpgradeModal,
    };

    console.log("🟢 Liora Premium v6 totalmente funcional.");
  });
})();
