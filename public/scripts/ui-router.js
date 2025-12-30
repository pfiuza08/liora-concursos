// =======================================================
// 🧭 LIORA UI ROUTER — vCANONICAL-LAZY-EVENTED
// - Registro explícito de UIs
// - Controle via classe .is-active
// - Eventos ui:<id> disparados
// - Scroll reset garantido
// - Compatível com Auth / Dashboard / Core
// =======================================================

(function () {
  const registry = {};
  let current = null;
  let booted = false;

  // ---------------------------------------------------
  // Utilitário
  // ---------------------------------------------------
  function $(id) {
    return document.getElementById(id);
  }

  // ---------------------------------------------------
  // Registro de UI
  // ---------------------------------------------------
  function register(id, el = null) {
    const node = el || $(id);
    if (!node) {
      console.warn("⚠️ UI não encontrada:", id);
      return;
    }

    registry[id] = node;
    console.log("🧩 UI registrada:", id);
  }

  // ---------------------------------------------------
  // Mostrar UI
  // ---------------------------------------------------
  function show(id) {
    if (!registry[id]) {
      console.warn("🚫 UI não registrada:", id);
      return;
    }

    Object.values(registry).forEach((el) =>
      el.classList.remove("is-active")
    );

    registry[id].classList.add("is-active");
    current = id;

    // reset físico de scroll (desktop + mobile)
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });

    console.log("🧭 UI →", id);

    // 🔔 evento canônico de UI
    document.dispatchEvent(
      new CustomEvent(`ui:${id}`, {
        detail: { id }
      })
    );
  }

  // ---------------------------------------------------
  // Bootstrap seguro
  // ---------------------------------------------------
  function boot() {
    if (booted) return;
    booted = true;

    [
      "liora-home",
      "liora-auth",
      "liora-app",
      "liora-premium"
    ].forEach((id) => register(id));

    // fallback seguro
    show("liora-home");
  }

  // ---------------------------------------------------
  // API pública
  // ---------------------------------------------------
  window.lioraUI = {
    register,
    show,
    get current() {
      return current;
    }
  };

  // ---------------------------------------------------
  // Inicialização
  // ---------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
