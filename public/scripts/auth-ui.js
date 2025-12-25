/// =======================================================
// 🔐 LIORA AUTH UI — vRESTORED-FINAL
// - Login funcional (submit interceptado)
// - Recuperação de senha isolada
// - Compatível com UI Router
// =======================================================

(function () {
  let authEl = null;
  let ready = false;

  // -----------------------------
  // Bind da tela de auth
  // -----------------------------
  function bindAuthUI() {
    authEl = document.getElementById("liora-auth");

    if (!authEl) {
      console.warn("⏳ Auth UI ainda não disponível no DOM");
      return false;
    }

    window.lioraUI.register("liora-auth", authEl);
    ready = true;

    document.dispatchEvent(new Event("liora:auth-ready"));
    console.log("🔐 Auth UI pronta");

    return true;
  }

  // -----------------------------
  // Abertura do login
  // -----------------------------
  function open() {
    if (!ready) {
      console.warn("🚫 Auth UI não pronta");
      return;
    }
    window.lioraUI.show("liora-auth");
  }

  // -----------------------------
  // Submit do formulário (ENTRAR)
  // -----------------------------
  function bindLoginForm() {
    const form = document.getElementById("liora-auth-form");
    if (!form) {
      console.warn("⚠️ Formulário de login não encontrado");
      return;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault(); // ⛔ impede reload

      const senhaInput = document.getElementById("auth-senha");
      const senha = senhaInput?.value?.trim();

      if (!senha) {
        alert("Digite sua senha");
        senhaInput?.focus();
        return;
      }

      console.log("🔐 Login acionado");

      // 🔹 LOGIN TEMPORÁRIO (para teste)
      localStorage.setItem("liora:auth", "ok");

      // Fecha auth e volta para home
      window.lioraUI.show("liora-home");
    });
  }

  // -----------------------------
  // Recuperação de senha
  // -----------------------------
  function bindRecoverPassword() {
    const btn = document.getElementById("liora-auth-forgot");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const email = prompt("Digite seu e-mail para recuperação:");
      if (!email) return;

      console.log("📩 Recuperação de senha solicitada:", email);
      alert("Se o e-mail existir, você receberá instruções.");
    });
  }

  // -----------------------------
  // Bootstrap
  // -----------------------------
  document.addEventListener("DOMContentLoaded", () => {
    if (bindAuthUI()) {
      bindLoginForm();
      bindRecoverPassword();
    } else {
      setTimeout(() => {
        if (bindAuthUI()) {
          bindLoginForm();
          bindRecoverPassword();
        }
      }, 300);
    }
  });

  // -----------------------------
  // API pública
  // -----------------------------
  window.lioraAuthUI = {
    open,
    ready: () => ready
  };
})();
