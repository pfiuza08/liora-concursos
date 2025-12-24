// =======================================================
// 🔐 LIORA AUTH UI — vRESTORED-OK
// - Login funcional
// - Recuperação de senha isolada
// =======================================================

(function () {
  let authEl = null;
  let ready = false;

  function bind() {
    authEl = document.getElementById("liora-auth");
    if (!authEl) {
      console.warn("⏳ Auth UI ainda não disponível no DOM");
      return false;
    }

    ready = true;
    window.lioraUI.register("liora-auth", authEl);
    document.dispatchEvent(new Event("liora:auth-ready"));

    console.log("🔐 Auth UI pronta");
    return true;
  }

  function open() {
    if (!ready) {
      console.warn("🚫 Auth UI não pronta");
      return;
    }
    window.lioraUI.show("liora-auth");
  }

  // -----------------------------
  // Recuperação de senha
  // -----------------------------
  function recoverPassword(email) {
    console.log("📩 Recuperação de senha solicitada:", email);

    // aqui entra backend real depois
    alert("Se o e-mail existir, você receberá instruções.");
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind() || setTimeout(bind, 300);
  });

  window.lioraAuthUI = {
    open,
    recoverPassword,
    ready: () => ready
  };
})();
