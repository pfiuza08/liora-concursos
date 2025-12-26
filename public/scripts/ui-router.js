// =======================================================
// 🧭 LIORA UI ROUTER — vCANONICAL-SCREENS
// - Navegação segura entre telas (screens)
// - NÃO interfere em modais nem FABs
// - Usa .is-active (CSS-driven)
// =======================================================

(function () {
  const registry = {};
  let current = null;

  // -----------------------------
  // Registrar uma tela
  // -----------------------------
  function register(id, el) {
    if (!id || !el) return;

    registry[id] = el;
    el.classList.add("liora-screen");

    console.log("🧩 UI registrada:", id);
  }

  // -----------------------------
  // Mostrar uma tela
  // -----------------------------
  function show(id) {
    const target = registry[id];

    if (!target) {
      console.warn("🚫 Navegação bloqueada (UI não registrada):", id);
      return;
    }

    Object.entries(registry).forEach(([key, el]) => {
      if (key === id) {
        el.classList.add("is-active");
      } else {
        el.classList.remove("is-active");
      }
    });

    current = id;
    console.log("🧭 UI →", id);
  }

  // -----------------------------
  // API pública
  // -----------------------------
  window.lioraUI = {
    register,
    show,
    get current() {
      return current;
    }
  };
})();
