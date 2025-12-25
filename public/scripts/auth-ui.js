// =======================================================
// 🔐 LIORA AUTH UI — vSUBMIT-CANONICAL
// - Login por SUBMIT (form)
// - Estado global centralizado
// - Integração com ui-actions
// - Sem navegação direta
// =======================================================

(function () {
  let authEl = null;
  let ready = false;

  // garante estado global
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

    // registra como SCREEN
    window.lioraUI.register("liora-auth", authEl);
    ready = true;

    console.log("🔐 Auth UI pronta");
    return true;
  }

  // -----------------------------
  // Abrir login (API pública)
  // -----------------------------
  function open() {
    if (!ready) return;
    window.lioraUI.show("liora-auth");
  }

  // -----------------------------
  // LOGIN — SUBMIT DO FORM
  // -----------------------------
  function bindLoginForm() {
    const form = document.getElementById("liora-auth-form");
    if (!form) {
      console.warn("⚠️ Formulário de login não encontrado");
      return;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault(); // ⛔ impede reload

      const email = document.getElementById("auth-email")?.value?.trim();
      const senha = document.getElementById("auth-senha")?.value?.trim();

      if (!email || !senha) {
        alert("Informe e-mail e senha");
        return;
      }

      console.log("🔐 Login efetuado:", email);

      // 🔹 define estado global
      const user = {
        email,
        loginAt: Date.now()
      };

      window.lioraAuth.user = user;
      localStorage.setItem("liora:user", JSON.stringify(user));

      // 🔹 delega decisão ao orquestrador
      if (window.lioraActions?.loginSuccess) {
        window.lioraActions.loginSuccess(user);
      } else {
        console.warn("⚠️ lioraActions.loginSuccess não disponível");
      }
    });
  }

  // -----------------------------
  // RECUPERAÇÃO DE SENHA
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
  // BOOTSTRAP
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
  // API pública mínima
  // -----------------------------
  window.lioraAuthUI = {
    open,
    ready: () => ready
  };
})();
