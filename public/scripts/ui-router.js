// =======================================================
// 🧭 LIORA UI ROUTER — vCANONICAL-ACTIVE
// - Controle exclusivo via is-active
// - Scroll reset garantido
// =======================================================

(function () {
  const registry = {};
  let current = null;

  function register(id) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn("⚠️ UI não encontrada:", id);
      return;
    }
    registry[id] = el;
    console.log("🧩 UI registrada:", id);
  }

  function show(id) {
    if (!registry[id]) {
      console.warn("🚫 UI não registrada:", id);
      return;
    }

    Object.values(registry).forEach(el =>
      el.classList.remove("is-active")
    );

    registry[id].classList.add("is-active");
    current = id;

    // reset físico de scroll (desktop + mobile)
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });

    console.log("🧭 UI →", id);
  }

  window.lioraUI = {
    register,
    show,
    get current() {
      return current;
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    [
      "liora-home",
      "liora-auth",
      "liora-app",
      "liora-premium"
    ].forEach(register);

    // tela inicial
    show("liora-home");
  });
})();
