// =======================================================
// 🧭 LIORA UI ROUTER — vFINAL-STUDY-READY
// - Router é a ÚNICA autoridade de telas
// - Tela inicial FIXA: liora-home
// - Dispara eventos ui:<id> ao ativar
// - Compatível com Dashboard v8 + Study Manager
// =======================================================

(function () {
  const registry = {};
  let current = null;

  // ---------------------------------------------------
  // Registro de telas
  // ---------------------------------------------------
  function register(id) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn("⚠️ UI não encontrada:", id);
      return;
    }
    registry[id] = el;
    console.log("🧩 UI registrada:", id);
  }

  // ---------------------------------------------------
  // Exibir tela
  // ---------------------------------------------------
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

    // 🔔 evento canônico de ativação (lazy-init)
    document.dispatchEvent(new Event(`ui:${id}`));

    console.log("🧭 UI →", id);
  }

  // ---------------------------------------------------
  // API pública
  // ---------------------------------------------------
  window.lioraUI = {
    show,
    get current() {
      return current;
    }
  };

  // ---------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    [
      "liora-home",
      "liora-app",
      "liora-premium"
    ].forEach(register);

    // 🔒 TELA INICIAL IMUTÁVEL
    show("liora-home");
  });

  // ---------------------------------------------------
  // EVENTOS DE ALTO NÍVEL (canônicos)
  // ---------------------------------------------------

  // Dashboard
  window.addEventListener("liora:open-dashboard", () => {
    show("liora-app");
    window.lioraDashboard?.atualizar?.();
  });

  // Voltar para home
  window.addEventListener("liora:go-home", () => {
    show("liora-home");
  });

})();
