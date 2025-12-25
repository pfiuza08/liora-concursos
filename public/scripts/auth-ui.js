// =======================================================
// 🔐 LIORA AUTH UI — vRESTORED-FINAL-BUTTON
// - Login funcional por CLICK (SPA-safe)
// - Campo de e-mail + senha
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
  // Abrir login
  // -----------------------------
  function open() {
    if (!ready) {
      console.warn("🚫 Auth UI não pronta");
      return;
    }
    window.lioraUI.show("liora-auth");
  }

  // -----------------------------
  // Login por CLICK (ENTRAR)
  // -----------------------------
  function bindLoginButton() {
    const btn = document.getElementById("liora-auth-submit");
    if (!btn) {
      console.warn("⚠️ Botão ENTRAR não encontrado");
      return;
    }

    btn.addEventListener("click", () => {
      const emailInput = document.getElementById("auth-email");
      const senhaInput = document.getElementById("auth-senha");

      const email = emailInput?.value?.trim();
      const senha = senhaInput?.value?.trim();

      if (!email || !senha) {
        alert("Informe e-mail e senha");
        return;
      }

      console.log("🔐 Login acionado:", email);

      // 🔹 LOGIN TEMPORÁRIO (mock)
      localStorage.setItem("liora:auth", "ok");

      // Volta para Home
      window.lioraUI.show("liora-home");
    });
  }

  // -----------------------------
  // Mostrar / ocultar senha
  // -----------------------------
  function bindTogglePassword() {
    const btn = document.getElementById("toggle-password");
    const input = document.getElementById("auth-senha");
    if (!btn || !input) return;

    btn.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.textContent = isPassword ? "🙈" : "👁️";
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
      bindLoginButton();
      bindTogglePassword();
      bindRecoverPassword();
    } else {
      setTimeout(() => {
        if (bindAuthUI()) {
          bindLoginButton();
          bindTogglePassword();
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
