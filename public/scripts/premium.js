// ===============================================================
// 🟠 LIORA PREMIUM — v7 SIMPLES (SEM LOGIN OBRIGATÓRIO)
// - Controla só o modal #liora-premium-backdrop
// - Ignora conflitos de CSS usando display inline
// - Compatível com index atual e nav-home v93
// ===============================================================

(function () {
  console.log("🔵 Liora Premium v7 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    const backdrop = document.getElementById("liora-premium-backdrop");
    const closeBtn = document.getElementById("liora-premium-close");

    if (!backdrop) {
      console.error("❌ ERRO: #liora-premium-backdrop NÃO encontrado no DOM!");
      return;
    }

    // Estado inicial: totalmente escondido
    backdrop.classList.remove("visible");
    backdrop.classList.add("hidden");
    backdrop.style.display = "none";
    backdrop.style.opacity = "0";
    backdrop.style.pointerEvents = "none";

    // ---------------------------------------------------------
    // FUNÇÕES
    // ---------------------------------------------------------
    function openUpgradeModal(origem = "unknown") {
      console.log("✨ Abrindo modal Premium v7… Origem:", origem);

      // Garante que NADA esconda o backdrop
      backdrop.classList.remove("hidden");
      backdrop.classList.add("visible");

      // Força exibição mesmo se houver CSS conflitante
      backdrop.style.display = "flex";
      backdrop.style.opacity = "1";
      backdrop.style.pointerEvents = "auto";
    }

    function closeUpgradeModal() {
      console.log("⏹ Fechando modal Premium v7");

      backdrop.classList.remove("visible");
      backdrop.classList.add("hidden");

      backdrop.style.opacity = "0";
      backdrop.style.pointerEvents = "none";
      backdrop.style.display = "none";
    }

    // ---------------------------------------------------------
    // EVENTOS LOCAIS
    // ---------------------------------------------------------
    if (closeBtn) {
      closeBtn.addEventListener("click", closeUpgradeModal);
    }

    // Fechar clicando fora do card
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) {
        closeUpgradeModal();
      }
    });

    // ---------------------------------------------------------
    // EXPOSTO GLOBALMENTE (usado pelo nav-home v93)
    // ---------------------------------------------------------
    window.lioraPremium = {
      openUpgradeModal,
      closeUpgradeModal,
    };

    console.log("🟢 Liora Premium v7 totalmente funcional.");
  });
})();
