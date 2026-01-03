// =======================================================
// 🔐 LIORA AUTH UI — vFINAL-STABLE-MONKEY 🐵
// - Compatível com auth.js v3.2 (Firebase)
// - Login é MODAL (não screen)
// - Não interfere no router
// - Não mexe em aria-hidden
// - Toggle de senha simples (emoji)
// =======================================================

(function () {
  let bound = false;

  // ------------------------------------------------------
  // Utilitário
  // ------------------------------------------------------
  function $(id) {
    return document.getElementById(id);
  }

  // ------------------------------------------------------
  // Abrir / fechar modal de login
  // ------------------------------------------------------
  function openAuth() {
    const auth = $("liora-auth");
    if (!auth) return;

    auth.classList.remove("hidden");
    document.body.classList.add("liora-modal-open");

    $("liora-auth-error") && ($("liora-auth-error").textContent = "");
    $("auth-email")?.focus();

    console.log("🔐 Auth aberto");
  }

  function closeAuth() {
    const auth = $("liora-auth");
    if (!auth) return;

    auth.classList.add("hidden");
    document.body.classList.remove("liora-modal-open");

    console.log("🔐 Auth fechado");
  }

  // ------------------------------------------------------
  // Toggle simples de senha (🐵)
  // ------------------------------------------------------
  function bindTogglePassword() {
    const input  = $("auth-senha");
    const toggle = $("toggle-password");
    if (!input || !toggle) return;

    toggle.addEventListener("click", () => {
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      toggle.textContent = hidden ? "🙈" : "👁️";
    });
  }

  // ------------------------------------------------------
  // Login real (Firebase)
  // ------------------------------------------------------
  function bindLoginForm() {
    const form = $("liora-auth-form");
    const errorBox = $("liora-auth-error");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox && (errorBox.textContent = "");

      const email = $("auth-email")?.value?.trim();
      const senha = $("auth-senha")?.value?.trim();

      if (!email || !senha) {
        errorBox && (errorBox.textContent = "Informe e-mail e senha.");
        return;
      }

      try {
        console.log("🔐 Login solicitado:", email);
        await window.lioraAuth.login(email, senha);

         // 🔑 força re-render do header
        window.dispatchEvent(new Event("liora:render-auth-ui"));

        closeAuth();

      } catch (err) {
        const msg =
          window.lioraAuth?.error ||
          "Não foi possível entrar. Verifique seus dados.";

        errorBox && (errorBox.textContent = msg);
      }
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
  // Botões auxiliares
  // ------------------------------------------------------
  function bindBackButton() {
    const btn = $("liora-auth-back");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      closeAuth();
    });
  }

  function bindCreateAccount() {
    const btn = $("liora-auth-toggle-mode");
    if (!btn) return;

    btn.addEventListener("click", () => {
      alert("Criação de conta será liberada em breve 🙂");
    });
  }

  function bindHeaderLogin() {
    const btn = $("btn-login");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuth();
    });
  }

  // ------------------------------------------------------
  // Fecha modal quando auth muda
  // ------------------------------------------------------
  function bindAuthChanged() {
    window.addEventListener("liora:auth-changed", () => {
      if (window.lioraAuth?.user) {
        closeAuth();
      }
    });
  }

  // ------------------------------------------------------
  // Init
  // ------------------------------------------------------
  function init() {
    if (bound) return;
    bound = true;

    bindTogglePassword();
    bindLoginForm();
    bindRecoverPassword();
    bindBackButton();
    bindCreateAccount();
    bindHeaderLogin();
    bindAuthChanged();

    // garante estado inicial fechado
    closeAuth();

    console.log("🔐 Auth UI inicializado (estado estável 🐵)");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
