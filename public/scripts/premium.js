// ===============================================================
// 🟠 LIORA PREMIUM — v4 (FINAL)
// - Controle completo do modal Premium
// - Sem dependência de ".hidden" do Tailwind
// - 100% confiável com nav-home v92+
// ===============================================================

(function () {
  console.log("🔵 Liora Premium v4 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    const backdrop = document.getElementById("liora-premium-backdrop");
    const closeBtn = document.getElementById("liora-premium-close");

    if (!backdrop) {
      console.error("❌ ERRO: Modal Premium NÃO encontrado no DOM!");
      return;
    }

    // ---------------------------------------------------------
    // FUNÇÕES GLOBAIS
    // ---------------------------------------------------------
    function openUpgradeModal(origem = "unknown") {
      console.log("✨ Abrindo modal Premium… Origem:", origem);

      backdrop.classList.add("visible");
      backdrop.style.pointerEvents = "auto";
    }

    function closeUpgradeModal() {
      backdrop.classList.remove("visible");
      backdrop.style.pointerEvents = "none";
    }

    // ---------------------------------------------------------
    // EVENTOS
    // ---------------------------------------------------------
    if (closeBtn) {
      closeBtn.addEventListener("click", closeUpgradeModal);
    }

    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) closeUpgradeModal();
    });

    // ---------------------------------------------------------
    // Expor global
    // ---------------------------------------------------------
    window.lioraPremium = {
      openUpgradeModal,
      closeUpgradeModal,
    };

    console.log("🟢 Liora Premium v4 pronto!");
  });
})();
