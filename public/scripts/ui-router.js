// =======================================================
// 🧭 LIORA UI ROUTER — vRESTORED-OK
// - Navegação segura
// - Só ativa UIs registradas
// =======================================================

(function () {
  const registry = {};
  let current = null;

  function register(id, el) {
    registry[id] = el;
    console.log("🧩 UI registrada:", id);
  }

  function show(id) {
    if (!registry[id]) {
      console.warn("🚫 Navegação bloqueada (UI não registrada):", id);
      return;
    }

    Object.values(registry).forEach(el => el.style.display = "none");
    registry[id].style.display = "block";
    current = id;

    console.log("🧭 UI →", id);
  }

  window.lioraUI = {
    register,
    show,
    get current() {
      return current;
    }
  };
})();
