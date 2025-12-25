// =======================================================
// 🔐 LIORA AUTH UI — vSTATEFUL
// - Login funcional por CLICK
// - Estado global de usuário
// - Compatível com nav-home gating
// =======================================================

(function () {
  let authEl = null;
  let ready = false;

  // estado global
  window.lioraAuth = window.lioraAuth || { user: null };

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

    console.log("🔐 Auth UI pronta");
    return true;
  }

  // -----------------------------
  // Abrir login
  // -----------------------------
  function open() {
    if (!ready) return;
    window.lioraUI.show("liora-auth");
  }

  // -----------------------------
  // Login (ENTRAR)
  // -----------------------------
  function bindLoginButton() {
    const btn = document.getElementById("liora-auth-submit");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const email = document.getElementById("auth-email")?.value?.trim();
      const senha = document.getElementById("auth-senha")?.value?.trim();

      if (!email || !senha) {
        alert("Informe e-mail e senha");
        return;
      }

      console.log("🔐 Login efetuado:", email);

      // 🔹 DEFINE ESTADO GLOBAL
      window.lioraAuth.user = {
        email,
        loginAt: Date.now()
      };

      localStorage.setItem("liora:user", JSON.stringify(window.lioraAuth.user));

      // dispara evento de sucesso
      window.dispatchEvent(new Event("liora:auth-success"));

      // volta para home
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
      alert("Se o e-mail existir, você receberá instruções.");
    });
  }

  // -----------------------------
  // Bootstrap
  // -----------------------------
  document.addEventListener("DOMContentLoaded", () => {
    if (bindAuthUI()) {
      bindLoginButton();
      bindRecoverPassword();
    } else {
      setTimeout(() => {
        if (bindAuthUI()) {
          bindLoginButton();
          bindRecoverPassword();
        }
      }, 300);
    }
  });

  window.lioraAuthUI = {
    open,
    ready: () => ready
  };
})();
