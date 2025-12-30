// =======================================================
// 🔐 LIORA AUTH UI — vFINAL-STABLE-LAZY
// - Inicializa SOMENTE quando a UI liora-auth está ativa
// - Totalmente defensivo (zero null.addEventListener)
// - Compatível com UI Router + Auth Core
// =======================================================

(function () {
  let authEl = null;
  let ready = false;
  let bound = false;

  // ------------------------------------------------------
  // Utilitário seguro
  // ------------------------------------------------------
  function $(id) {
    return document.getElementById(id);
  }

  // ------------------------------------------------------
  // Bind da tela de auth
  // ------------------------------------------------------
  function bindAuthUI() {
    authEl = $("liora-auth");
    if (!authEl) {
      console.warn("🔐 Auth UI: container não encontrado");
      return false;
    }

    if (window.lioraUI?.register) {
      window.lioraUI.register("liora-auth", authEl);
    }

    ready = true;
    console.log("🔐 Auth UI pronta");
    return true;
  }

  // ------------------------------------------------------
  // Mostrar / esconder senha
  // ------------------------------------------------------
  function bindTogglePassword() {
    const toggle = $("toggle-password");
    const input = $("auth-senha");

    if (!toggle || !input) {
      console.warn("🔐 Auth UI: toggle-password indisponível");
      return;
    }

    toggle.addEventListener("click", () => {
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      toggle.textContent = hidden ? "🙈" : "👁️";
    });
  }

  // ------------------------------------------------------
  // Login (mock / integração com auth.js)
  // ------------------------------------------------------
  function bindLoginForm() {
    const form = $("liora-auth-form");
    if (!form) {
      console.warn("🔐 Auth UI: formulário não encontrado");
      return;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = $("auth-email")?.value?.trim();
      const senha = $("auth-senha")?.value?.trim();

      if (!email || !senha) {
        alert("Informe e-mail e senha");
        return;
      }

      console.log("🔐 Login solicitado:", email);

      // 🔁 Integração com auth.js / state
      if (window.lioraActions?.loginSuccess) {
        window.lioraActions.loginSuccess({
          email,
          loginAt: Date.now()
        });
      }

      if (window.lioraUI?.show) {
        window.lioraUI.show("liora-home");
      }
    });
  }

  // ------------------------------------------------------
  // Criar conta (placeholder)
  // ------------------------------------------------------
  function bindCreateAccount() {
    const btn = $("liora-auth-toggle-mode");
    if (!btn) return;

    btn.addEventListener("click", () => {
      alert("Criação de conta será liberada em breve 🙂");
    });
  }

  // ------------------------------------------------------
  // Voltar para início
  // ------------------------------------------------------
  function bindBackHome() {
    const btn = $("liora-auth-back");
    if (!btn) return;

    btn.addEventListener("click", () => {
      window.lioraUI?.show("liora-home");
    });
  }

  // ------------------------------------------------------
  // Recuperação de senha
  // ------------------------------------------------------
  function bindRecoverPassword() {
    const btn = $("liora-auth-forgot");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const email = prompt("Digite seu e-mail para recuperação:");
      if (!email) return;

      alert("Se o e-mail existir, você receberá instruções.");
    });
  }

  // ------------------------------------------------------
  // Inicialização segura (executa UMA vez)
  // ------------------------------------------------------
  function init() {
    if (bound) return;
    bound = true;

    if (!bindAuthUI()) return;

    bindTogglePassword();
    bindLoginForm();
    bindCreateAccount();
    bindBackHome();
    bindRecoverPassword();
  }

  // ------------------------------------------------------
  // Lazy init via UI Router
  // ------------------------------------------------------
  document.addEventListener("ui:liora-auth", init);

  // ------------------------------------------------------
  // API pública mínima
  // ------------------------------------------------------
  window.lioraAuthUI = {
    ready: () => ready
  };
})();
