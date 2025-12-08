// ===============================================================
// 🟢 LIORA LOGIN — CONTROLADOR DO MODAL DE LOGIN v1
// ===============================================================
(function () {
  console.log("🔵 Liora Login carregado…");

  document.addEventListener("DOMContentLoaded", () => {

    const backdrop = document.getElementById("liora-login-backdrop");
    const btnClose = document.getElementById("liora-login-close");

    if (!backdrop) {
      console.error("❌ Modal de login não encontrado no DOM!");
      return;
    }

    function openLoginModal() {
      console.log("🔐 Abrindo modal de login…");
      backdrop.classList.add("visible");
      backdrop.style.pointerEvents = "auto";
    }

    function closeLoginModal() {
      backdrop.classList.remove("visible");
      backdrop.style.pointerEvents = "none";
    }

    // Fechar ao clicar fora
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) closeLoginModal();
    });

    // Fechar pelo botão
    btnClose?.addEventListener("click", closeLoginModal);

    // Expor globalmente
    window.lioraLogin = {
      open: openLoginModal,
      close: closeLoginModal
    };

    console.log("🟢 Liora Login v1 pronto!");
  });
})();
