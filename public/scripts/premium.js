// ===============================================================
// 🟠 LIORA PREMIUM — v5 (FINAL)
// - Mantém 100% da funcionalidade do v4
// - Adiciona: verificação de login via Firebase Auth
// - Se o usuário não estiver logado → abre modal de login
// - Integrado com nav-home v92+ e auth.js
// ===============================================================

(function () {
  console.log("🔵 Liora Premium v5 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    const backdrop = document.getElementById("liora-premium-backdrop");
    const closeBtn = document.getElementById("liora-premium-close");

    if (!backdrop) {
      console.error("❌ ERRO: Modal Premium NÃO encontrado no DOM!");
      return;
    }

    // ---------------------------------------------------------
    // FUNÇÃO PARA ABRIR O MODAL PREMIUM
    // ---------------------------------------------------------
    function openUpgradeModal(origem = "unknown") {
      console.log("✨ Solicitado modal Premium… Origem:", origem);

      // 🔐 Se o usuário NÃO estiver logado → abrir login
      if (!window.lioraAuth?.user) {
        console.log("🔐 Usuário não logado → abrir modal de login primeiro");
        window.dispatchEvent(new Event("liora:open-login"));
        return;
      }

      // Caso esteja logado → abrir modal normalmente
      console.log("🟢 Usuário autenticado → abrindo Premium");
      backdrop.classList.add("visible");
      backdrop.style.pointerEvents = "auto";
    }

    // ---------------------------------------------------------
    // FECHAR MODAL
    // ---------------------------------------------------------
    function closeUpgradeModal() {
      backdrop.classList.remove("visible");
      backdrop.style.pointerEvents = "none";
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeUpgradeModal);
    }

    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) closeUpgradeModal();
    });

    // ---------------------------------------------------------
    // EXPOR GLOBALMENTE
    // ---------------------------------------------------------
    window.lioraPremium = {
      openUpgradeModal,
      closeUpgradeModal,
    };

    console.log("🟢 Liora Premium v5 totalmente funcional.");
  });
})();
