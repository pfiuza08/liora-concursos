// =======================================================
// 🧭 LIORA UI ROUTER — vFINAL-CANONICAL
// - Router é a ÚNICA autoridade de telas
// - Tela inicial FIXA: liora-home
// - Dispara eventos ui:<id> ao ativar
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

    // reset de scroll
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 🔔 evento para lazy-init
    document.dispatchEvent(new Event(`ui:${id}`));

    console.log("🧭 UI →", id);
  }

  window.lioraUI = {
    show,
    get current() {
      return current;
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
     [
    "liora-home",
    "liora-app",
    "liora-premium"
    ].forEach(register);


    // 🔒 TELA INICIAL IMUTÁVEL
    show("liora-home");
  });
})();
