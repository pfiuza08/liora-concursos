// ==========================================================
// 💎 LIORA — PREMIUM v2
// - Controla o modal de upgrade da Liora
// - Tolerante: funciona mesmo se o modal for carregado depois
// - Integra com nav-home (window.lioraPremium.openUpgradeModal)
// ==========================================================

(function () {
  console.log("🔵 Liora Premium v2 carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // HELPERS PARA PEGAR ELEMENTOS SEMPRE ATUALIZADOS
    // ------------------------------------------------------
    function getEls() {
      return {
        backdrop: document.getElementById("liora-premium-modal"),
        close: document.getElementById("liora-premium-close"),
        btnMensal: document.getElementById("liora-premium-mensal"),
        btnTrimestral: document.getElementById("liora-premium-trimestral"),
      };
    }

    // ------------------------------------------------------
    // ABRIR / FECHAR MODAL
    // ------------------------------------------------------
    function openUpgradeModal(origin) {
      const els = getEls();
      const backdrop = els.backdrop;

      if (!backdrop) {
        console.warn(
          "⚠️ Modal Premium não encontrado no DOM (openUpgradeModal). ID esperado: #liora-premium-modal"
        );
        return;
      }

      backdrop.classList.remove("hidden");
      backdrop.classList.add("liora-premium-open");
      backdrop.dataset.origin = origin || "";
      document.body.classList.add("liora-premium-lock");
      console.log("✨ Modal Premium aberto. Origem:", origin || "desconhecida");
    }

    function closeUpgradeModal() {
      const els = getEls();
      const backdrop = els.backdrop;
      if (!backdrop) return;

      backdrop.classList.add("hidden");
      backdrop.classList.remove("liora-premium-open");
      document.body.classList.remove("liora-premium-lock");
      console.log("✨ Modal Premium fechado.");
    }

    // ------------------------------------------------------
    // WIRE DOS BOTÕES DO MODAL (SE EXISTIR)
    // ------------------------------------------------------
    (function initModalWiring() {
      const els = getEls();

      if (!els.backdrop) {
        console.warn(
          "⚠️ Modal Premium não encontrado no DOM (init). ID esperado: #liora-premium-modal"
        );
        // mesmo assim expomos a API global para funcionar quando o modal existir
      } else {
        // Fechar no X
        if (els.close) {
          els.close.addEventListener("click", closeUpgradeModal);
        }

        // Fechar ao clicar fora do card
        els.backdrop.addEventListener("click", (ev) => {
          if (ev.target === els.backdrop) {
            closeUpgradeModal();
          }
        });

        // CTAs (aqui você coloca o link real do checkout)
        if (els.btnMensal) {
          els.btnMensal.addEventListener("click", () => {
            console.log("🛒 Clique no plano Mensal.");
            // window.location.href = "https://seu-checkout-mensal.com";
          });
        }

        if (els.btnTrimestral) {
          els.btnTrimestral.addEventListener("click", () => {
            console.log("🛒 Clique no plano Trimestral.");
            // window.location.href = "https://seu-checkout-trimestral.com";
          });
        }
      }
    })();

    // ------------------------------------------------------
    // API GLOBAL
    // ------------------------------------------------------
    window.lioraPremium = {
      openUpgradeModal,
      closeUpgradeModal,
    };

    console.log("🟢 Liora Premium v2 pronto.");
  });
})();
