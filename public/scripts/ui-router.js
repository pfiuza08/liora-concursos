// ==========================================================
// 🧭 LIORA UI ROUTER — CANÔNICO (SEM AUTH LOGIC)
// ==========================================================
(function () {

  const screens = ["liora-home", "liora-auth", "liora-app"];

  window.lioraUI = {
    show(id) {
      screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.toggle("hidden", s !== id);
      });

      window.scrollTo(0, 0);
      console.log("🧭 UI →", id);

      // 🔔 EVENTO DE CICLO DE VIDA (SEM LÓGICA DE AUTH)
      if (id === "liora-auth") {
        window.dispatchEvent(new Event("liora:show-auth"));
      }
    }
  };

})();
