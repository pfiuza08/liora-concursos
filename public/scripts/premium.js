// ==========================================================
// 💎 LIORA — PREMIUM v3 (compatível com seu HTML atual)
// - Busca o modal por #liora-premium-backdrop
// - Resistente: funciona mesmo se o modal carregar depois
// - Integra com nav-home (openUpgradeModal / closeUpgradeModal)
// ==========================================================

(function () {
  console.log("🔵 Liora Premium v3 carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // HELPERS: sempre obtêm elementos atuais do DOM
    // ------------------------------------------------------
    function getEls() {
      return {
        backdrop: document.getElementById("liora-premium-backdrop"),
        close: document.getElementById("liora-premium-close"),
        btnMensal: document.getElementById("premium-mensal"),
        btnTrimestral: document.getElementById("premium-trimestral"),
      };
    }

    // ------------------------------------------------------
    // ABRIR / FECHAR MODAL
    // ------------------------------------------------------
    function openUpgradeModal(origin) {
      const { backdrop } = getEls();

      if (!backdrop) {
        console.warn(
          "⚠️ Modal Premium não encontrado (ID esperado: #liora-premium-backdrop)"
        );
        return;
      }

      backdrop.classList.remove("hidden");
      backdrop.classList.add("liora-premium-open");
      backdrop.dataset.origin = origin || "unknown";

      document.body.classList.add("liora-premium-lock");

      console.log("✨ Modal Premium aberto. Origem:", origin || "desconhecida");
    }

    function closeUpgradeModal() {
      const { backdrop } = getEls();
      if (!backdrop) return;

      backdrop.classList.add("hidden");
      backdrop.classList.remove("liora-premium-open");

      document.body.classList.remove("liora-premium-lock");

      console.log("✨ Modal Premium fechado.");
    }

    // ------------------------------------------------------
    // INICIALIZAR LISTENERS DO MODAL (se existir)
    // ------------------------------------------------------
    (function init() {
      const els = getEls();

      if (!els.backdrop) {
        console.warn("⚠️ Modal Premium não encontrado ao iniciar.");
        return;
      }

      // Fechar ao clicar no X
      if (els.close) {
        els.close.addEventListener("click", closeUpgradeModal);
      }

      // Fechar ao clicar fora do card
      els.backdrop.addEventListener("click", (ev) => {
        if (ev.target === els.backdrop) closeUpgradeModal();
      });

      // Botão Mensal
      if (els.btnMensal) {
        els.btnMensal.addEventListener("click", () => {
          console.log("🛒 Clicou no plano Mensal");
          // window.location.href = "https://checkout.mensal.com";
        });
      }

      // Botão Trimestral
      if (els.btnTrimestral) {
        els.btnTrimestral.addEventListener("click", () => {
          console.log("🛒 Clicou no plano Trimestral");
          // window.location.href = "https://checkout.trimestral.com";
        });
      }

      console.log("🟢 Modal Premium pronto no DOM.");
    })();

    // ------------------------------------------------------
    // API GLOBAL
    // ------------------------------------------------------
    window.lioraPremium = {
      openUpgradeModal,
      closeUpgradeModal,
    };

    console.log("🟢 Liora Premium v3 totalmente funcional.");
  });
})();
