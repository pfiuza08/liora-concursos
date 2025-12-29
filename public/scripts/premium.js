// ===============================================================
// 🟠 LIORA PREMIUM — v10 CANONICAL (SCREEN MODE)
// - NÃO usa modal
// - NÃO controla layout
// - APENAS dispara evento de navegação
// - A renderização é 100% responsabilidade do nav-home
// ===============================================================

(function () {
  console.log("🟠 Liora Premium v10 carregado (screen mode)");

  document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------------------------
    // API CANÔNICA
    // -----------------------------------------------------------
    function openUpgrade(origem = "unknown") {
      console.log("✨ Abrindo Liora Premium | origem:", origem);

      // 🔑 Evento único e canônico
      window.dispatchEvent(new Event("liora:open-premium"));
    }

    // -----------------------------------------------------------
    // EVENTOS GLOBAIS
    // -----------------------------------------------------------
    window.addEventListener("liora:premium-bloqueado", () => {
      openUpgrade("bloqueio");
    });

    window.addEventListener("liora:open-upgrade", () => {
      openUpgrade("manual");
    });

    // -----------------------------------------------------------
    // EXPOSIÇÃO GLOBAL (opcional / debug)
    // -----------------------------------------------------------
    window.lioraPremium = {
      openUpgrade,
    };

    console.log("🟢 Liora Premium v10 pronto");
  });
})();
