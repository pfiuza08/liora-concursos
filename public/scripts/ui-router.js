// ==========================================================
// 🧭 LIORA UI ROUTER — CANÔNICO (SCREENS)
// Compatível com .liora-screen + .is-active
// ==========================================================
(function () {

  const screens = [
    "liora-home",
    "liora-auth",
    "liora-app"
  ];

  function hideAll() {
    screens.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove("is-active");
    });
  }

  window.lioraUI = {
    show(id) {
      hideAll();

      const target = document.getElementById(id);
      if (target) {
        target.classList.add("is-active");
      } else {
        console.warn("⚠️ Tela não encontrada:", id);
      }

      window.scrollTo({ top: 0, behavior: "instant" });
      console.log("🧭 UI →", id);
    }
  };

})();

