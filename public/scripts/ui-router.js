// ==========================================================
// 🧭 LIORA UI ROUTER — FULLSCREEN (CANÔNICO)
// ==========================================================
(function () {

  const screens = [
    "liora-home",
    "liora-auth",
    "liora-app"
  ];

  function show(id) {
    screens.forEach(s => {
      const el = document.getElementById(s);
      if (el) el.classList.toggle("hidden", s !== id);
    });

    window.scrollTo(0, 0);
    console.log("🧭 UI →", id);
  }

  window.lioraUI = { show };

  // 🔐 REAÇÃO AO LOGIN / LOGOUT
  window.addEventListener("liora:auth-changed", () => {
    const user = window.lioraAuth?.user;

    if (user) {
      show("liora-home");
    } else {
      show("liora-auth");
    }
  });

})();
