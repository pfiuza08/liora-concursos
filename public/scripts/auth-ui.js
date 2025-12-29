// =======================================================
// 🔐 LIORA AUTH UI — vFINAL-STABLE
// =======================================================

(function () {
  let authEl = null;
  let ready = false;

  // ------------------------------------------------------
  // Bind da tela de auth
  // ------------------------------------------------------
  function bindAuthUI() {
    authEl = document.getElementById("liora-auth");
    if (!authEl) return false;

    window.lioraUI.register("liora-auth", authEl);
    ready = true;

    console.log("🔐 Auth UI pronta");
    return true;
  }

  // ------------------------------------------------------
  // Mostrar / esconder senha
  // ------------------------------------------------------
  function bindTogglePassword() {
   const toggle = document.getElementById("toggle-password");
    const input  = document.getElementById("password");
    
    toggle.addEventListener("click", () => {
      const isHidden = input.type === "password";
    
      input.type = isHidden ? "text" : "password";
      toggle.textContent = isHidden ? "👁️" : "👁️‍🗨️";
    });
  }

  // ------------------------------------------------------
  // Login
  // ------------------------------------------------------
  function bindLoginForm() {
    const form = document.getElementById("liora-auth-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("auth-email")?.value?.trim();
      const senha = document.getElementById("auth-senha")?.value?.trim();

      if (!email || !senha) {
        alert("Informe e-mail e senha");
        return;
      }

      console.log("🔐 Login efetuado:", email);

      window.lioraActions.loginSuccess({
        email,
        loginAt: Date.now()
      });
    });
  }

  // ------------------------------------------------------
  // Criar conta (placeholder)
  // ------------------------------------------------------
  function bindCreateAccount() {
    const btn = document.getElementById("liora-auth-toggle-mode");
    if (!btn) return;

    btn.addEventListener("click", () => {
      alert("Criação de conta será liberada em breve 🙂");
    });
  }

  // ------------------------------------------------------
  // Voltar para início
  // ------------------------------------------------------
  function bindBackHome() {
    const btn = document.getElementById("liora-auth-back");
    if (!btn) return;

    btn.addEventListener("click", () => {
      window.lioraUI.show("liora-home");
    });
  }

  // ------------------------------------------------------
  // Recuperação de senha
  // ------------------------------------------------------
  function bindRecoverPassword() {
    const btn = document.getElementById("liora-auth-forgot");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const email = prompt("Digite seu e-mail para recuperação:");
      if (!email) return;
      alert("Se o e-mail existir, você receberá instruções.");
    });
  }

  // ------------------------------------------------------
  // Bootstrap
  // ------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    if (!bindAuthUI()) {
      return setTimeout(() => document.dispatchEvent(new Event("DOMContentLoaded")), 200);
    }

    bindTogglePassword();
    bindLoginForm();
    bindCreateAccount();
    bindBackHome();
    bindRecoverPassword();
  });

  window.lioraAuthUI = {
    ready: () => ready
  };
})();
