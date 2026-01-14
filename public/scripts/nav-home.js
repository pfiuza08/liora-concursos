// =======================================================
// 🧭 LIORA — NAV HOME v101-CLEAN
// Controle exclusivo de layout / screens
// =======================================================

console.log("🔖 nav-home v101-CLEAN carregado");

(function () {

  document.addEventListener("DOMContentLoaded", () => {

    const home = document.getElementById("liora-home");
    const app  = document.getElementById("liora-app");

    const fabHome = document.getElementById("fab-home");
    const fabSim  = document.getElementById("sim-fab");

    // --------------------------------------------------
    // HELPERS
    // --------------------------------------------------
    function hideAllPanels() {
      app?.querySelectorAll(
        "#painel-estudo, #painel-tema, #painel-upload, #area-plano, #liora-sessoes, #area-simulado, #area-dashboard"
      ).forEach(el => el.classList.add("hidden"));
    }

    function showHome() {
      document.querySelectorAll(".liora-screen").forEach(el =>
        el.classList.remove("is-active")
      );
      home?.classList.add("is-active");

      fabHome?.classList.add("hidden");
      fabSim?.classList.add("hidden");
    }

    function showApp() {
      document.querySelectorAll(".liora-screen").forEach(el =>
        el.classList.remove("is-active")
      );
      app?.classList.add("is-active");

      fabHome?.classList.remove("hidden");
    }

    // --------------------------------------------------
    // EVENTOS
    // --------------------------------------------------
    window.addEventListener("liora:go-home", showHome);

    window.addEventListener("liora:open-estudo-tema", () => {
      showApp();
      hideAllPanels();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-tema")?.classList.remove("hidden");
      fabSim?.classList.add("hidden");
    });

    window.addEventListener("liora:open-estudo-upload", () => {
      showApp();
      hideAllPanels();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-upload")?.classList.remove("hidden");
      fabSim?.classList.add("hidden");
    });

    window.addEventListener("liora:open-simulados", () => {
      console.log("🧭 NAV → área de simulados");

      showApp();
      hideAllPanels();

      document.getElementById("area-simulado")?.classList.remove("hidden");
      fabSim?.classList.remove("hidden");
    });

    window.addEventListener("liora:open-dashboard", () => {
      showApp();
      hideAllPanels();
      document.getElementById("area-dashboard")?.classList.remove("hidden");
      fabSim?.classList.add("hidden");
    });

    window.addEventListener("liora:open-premium", () => {
      document.querySelectorAll(".liora-screen").forEach(el =>
        el.classList.remove("is-active")
      );
      document.getElementById("liora-premium")?.classList.add("is-active");
      fabHome?.classList.remove("hidden");
      fabSim?.classList.add("hidden");
    });

    // --------------------------------------------------
    // ESTADO INICIAL
    // --------------------------------------------------
    showHome();
  });

})();
