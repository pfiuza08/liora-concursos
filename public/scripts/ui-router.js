// =======================================================
// 🧭 LIORA UI ROUTER — vCANONICAL-SAFE-FIXED
// - Registra telas automaticamente
// - NÃO interfere no layout estrutural
// - NÃO quebra scroll do app
// - Login nunca bloqueia
// =======================================================

(function () {
  const registry = {};
  let current = null;

  // --------------------------------------------------
  // REGISTRO SEGURO
  // --------------------------------------------------
  function autoRegister(id) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn("⚠️ UI não encontrada para registro:", id);
      return;
    }

    registry[id] = el;
    console.log("🧩 UI registrada:", id);
  }

  // --------------------------------------------------
  // SHOW CANÔNICO
  // --------------------------------------------------
  function show(id) {
    const target = registry[id];
    if (!target) {
      console.warn("🚫 Navegação bloqueada (UI não registrada):", id);
      return;
    }

    // 🔒 Esconde apenas telas registradas
    Object.values(registry).forEach(el => {
      el.classList.add("hidden");
    });

    target.classList.remove("hidden");
    current = id;

    // 🔒 reset físico absoluto (desktop + mobile)
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);

    console.log("🧭 UI →", id);
  }

  // --------------------------------------------------
  // API GLOBAL
  // --------------------------------------------------
  window.lioraUI = {
    register: autoRegister,
    show,
    get current() {
      return current;
    }
  };

  // --------------------------------------------------
  // REGISTRO AUTOMÁTICO (APENAS TELAS)
  // --------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    [
      "liora-home",
      "liora-auth",
      "liora-app",
      "liora-premium"
    ].forEach(autoRegister);
  });
})();
