// ===============================================================
// 💎 LIORA PREMIUM — v6 (FLUXO COMPLETO LOGIN → PREMIUM → ATIVAÇÃO)
// ===============================================================

(function () {
  console.log("🔵 Liora Premium v6 carregado…");

  document.addEventListener("DOMContentLoaded", () => {
    const backdrop = document.getElementById("liora-premium-backdrop");
    const closeBtn = document.getElementById("liora-premium-close");

    const inpCodigo = document.getElementById("liora-upgrade-codigo");
    const btnAtivar = document.getElementById("liora-upgrade-ativar");
    const btnSouPremium = document.getElementById("liora-upgrade-sou-premium");
    const statusEl = document.getElementById("liora-upgrade-status");

    if (!backdrop) {
      console.error("❌ ERRO: Modal Premium não encontrado!");
      return;
    }

    // ---------------------------------------------------------
    // FUNÇÕES INTERNAS
    // ---------------------------------------------------------

    function getUser() {
      try {
        return JSON.parse(localStorage.getItem("liora_user"));
      } catch {
        return null;
      }
    }

    function saveUser(u) {
      localStorage.setItem("liora_user", JSON.stringify(u));
      window.dispatchEvent(new Event("liora:user-update"));
    }

    function openModalPremium() {
      console.log("💎 Exibindo modal Premium…");
      backdrop.classList.add("visible");
    }

    function closeModalPremium() {
      backdrop.classList.remove("visible");
    }

    function openUpgradeModal(origem = "unknown") {
      console.log("✨ Solicitado modal Premium… Origem:", origem);

      const user = getUser();

      if (!user) {
        console.log("🔐 Usuário não logado → abrir modal de login primeiro");
        window.lioraLogin?.openLoginModal();

        // Após login → abrir premium automaticamente
        window.addEventListener("liora:user-login", () => {
          setTimeout(() => openModalPremium(), 150);
        }, { once: true });

        return;
      }

      // Se for Premium → só exibe instrução
      if (user.premium) {
        alert("Você já é Premium! Obrigada 💛");
        return;
      }

      // Se está logado mas não premium → abre modal
      openModalPremium();
    }

    // Expor globalmente
    window.lioraPremium = {
      openUpgradeModal,
      closeUpgradeModal: closeModalPremium,
    };

    // ---------------------------------------------------------
    // ATIVAÇÃO DO CÓDIGO
    // ---------------------------------------------------------

    btnAtivar?.addEventListener("click", () => {
      const codigo = inpCodigo.value.trim();
      if (!codigo) {
        statusEl.textContent = "Digite um código válido.";
        statusEl.classList.remove("hidden");
        return;
      }

      // Simulação — depois integramos com API real
      if (codigo === "LIORA2025" || codigo === "MASTERKEY") {
        const user = getUser() || {};
        user.premium = true;
        saveUser(user);

        statusEl.textContent = "🎉 Premium ativado com sucesso!";
        statusEl.classList.remove("hidden");

        setTimeout(() => {
          closeModalPremium();
          window.location.reload();
        }, 900);
      } else {
        statusEl.textContent = "Código inválido.";
        statusEl.classList.remove("hidden");
      }
    });

    // Atribui premium local caso já seja assinante
    btnSouPremium?.addEventListener("click", () => {
      const user = getUser() || {};
      user.premium = true;
      saveUser(user);

      alert("Premium ativado neste dispositivo!");
      closeModalPremium();
      window.location.reload();
    });

    // Fechar modal
    closeBtn?.addEventListener("click", closeModalPremium);
    backdrop?.addEventListener("click", (ev) => {
      if (ev.target === backdrop) closeModalPremium();
    });

    console.log("🟢 Liora Premium v6 totalmente funcional!");
  });
})();
