// =======================================================
// 🧭 LIORA UI ROUTER — vCANONICAL-SAFE
// - Registra telas automaticamente
// - Nunca bloqueia login por erro de timing
// =======================================================

(function () {
  const registry = {};
  let current = null;

  function autoRegister(id) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn("⚠️ UI não encontrada para registro:", id);
      return;
    }
    registry[id] = el;
    console.log("🧩 UI registrada:", id);
  }

  function show(id) {
    if (!registry[id]) {
      console.warn("🚫 Navegação bloqueada (UI não registrada):", id);
      return;
    }

    Object.values(registry).forEach(el => {
      el.classList.add("hidden");
    });

    registry[id].classList.remove("hidden");
    current = id;

    // 🔒 reset de scroll sempre
    window.scrollTo({ top: 0, behavior: "auto" });

    console.log("🧭 UI →", id);
  }

  window.lioraUI = {
    register: autoRegister,
    show,
    get current() {
      return current;
    }
  };

  // --------------------------------------------------
  // REGISTRO AUTOMÁTICO CANÔNICO
  // --------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    [
      "liora-home",
      "liora-app",
      "liora-auth",
      "liora-premium",
      "area-simulado",
      "area-dashboard",
      "liora-sim-config"
    ].forEach(autoRegister);
  });
})();
