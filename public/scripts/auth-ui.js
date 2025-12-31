// =======================================================
// 🔐 LIORA AUTH UI — vFINAL-COMPAT-AUTH-v3.2
// - Compatível com auth.js v3.2 (Firebase)
// - NÃO força navegação automática
// - HOME é sempre a tela inicial
// - Login só navega após sucesso explícito
// =======================================================

(function () {
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
    const authEl = $("liora-auth");
    if (!authEl) return false;

    window.lioraUI?.register?.("liora-auth", authEl);
    console.log("🔐 Auth UI pronta");
    return true;
  }

  // ------------------------------------------------------
  // Mostrar / esconder senha
  // ------------------------------------------------------
  function bindTogglePassword() {
    const toggle = $("toggle-password");
    const input = $("auth-senha");
    if (!toggle || !input) return;

    toggle.addEventListener("click", () => {
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      toggle.textContent = hidden ? "🙈" : "👁️";
    });
  }

  // ------------------------------------------------------
  // Login REAL (Firebase)
  // ------------------------------------------------------
  function bindLoginForm() {
    const form = $("liora-auth-form");
    const errorBox = $("liora-auth-error");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (errorBox) errorBox.textContent = "";

      const email = $("auth-email")?.value?.trim();
      const senha = $("auth-senha")?.value?.trim();

      if (!email || !senha) {
        if (errorBox) errorBox.textContent = "Informe e-mail e senha.";
        return;
      }

      try {
        console.log("🔐 Login solicitado:", email);

        await window.lioraAuth.login(email, senha);

        // ✅ SOMENTE AQUI navegamos
        window.lioraUI.show("liora-app");

      } catch (err) {
        const msg =
          window.lioraAuth?.error ||
          "Não foi possível entrar. Verifique seus dados.";

        if (errorBox) errorBox.textContent = msg;
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
  // Voltar para HOME (ação explícita)
  // ------------------------------------------------------
  function bindBackHome() {
    const btn = $("liora-auth-back");
    if (!btn) return;

    btn.addEventListener("click", () => {
      window.lioraUI.show("liora-home");
    });
  }

  // ------------------------------------------------------
  // Recuperação de senha
  // ------------------------------------------------------
  function bindRecoverPassword() {
    const btn = $("liora-auth-forgot");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const email = prompt("Digite seu e-mail para recuperação:");
      if (!email) return;

      try {
        await window.lioraAuth.resetPassword(email);
        alert("E-mail de redefinição enviado.");
      } catch {
        alert("Não foi possível enviar o e-mail.");
      }
    });
  }

  // ------------------------------------------------------
  // Init (lazy, uma vez)
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
  // Lazy init via router
  // ------------------------------------------------------
  document.addEventListener("ui:liora-auth", init);
})();
