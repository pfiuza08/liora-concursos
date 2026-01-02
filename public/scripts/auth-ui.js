// =======================================================
// 🔐 LIORA AUTH UI — vFINAL-CANONICAL-MODAL
// - Compatível com auth.js v3.2 (Firebase)
// - LOGIN É MODAL (fora do router)
// - HOME é sempre a base
// - Auth apenas abre / fecha camada
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
  // Controle do modal
  // ------------------------------------------------------
  function openAuth() {
    const auth = $("liora-auth");
    if (!auth) return;

    auth.classList.remove("hidden");
    auth.classList.add("is-open");

    document.body.classList.add("liora-modal-open");
    document.body.style.overflow = "hidden";

    const err = $("liora-auth-error");
    if (err) err.textContent = "";

    const senha = $("auth-senha");
    if (senha) senha.value = "";

    setTimeout(() => $("auth-email")?.focus(), 50);

    console.log("🔐 Auth aberto (modal)");
  }

  function closeAuth() {
    const auth = $("liora-auth");
    if (!auth) return;

    auth.classList.remove("is-open");
    auth.classList.add("hidden");

    document.body.classList.remove("liora-modal-open");
    document.body.style.overflow = "";

    console.log("🔐 Auth fechado (modal)");
  }

  // ------------------------------------------------------
  // Mostrar / esconder senha
  // ------------------------------------------------------
  function bindTogglePassword() {
    const toggle = $("toggle-password");
    const input = $("auth-senha");
    if (!toggle || !input) return;

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      toggle.textContent = hidden ? "👁️‍🗨️" : "👁️";
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
        window.dispatchEvent(new Event("liora:render-auth-ui"));
        // sucesso → fecha modal
        closeAuth();

      } catch {
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
  // Voltar (fecha modal)
  // ------------------------------------------------------
  function bindBackHome() {
    const btn = $("liora-auth-back");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      closeAuth();
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
  // Botão "Entrar" do header
  // ------------------------------------------------------
  function bindHeaderLogin() {
    const btn = $("btn-login");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuth();
    });
  }

  // ------------------------------------------------------
  // Init (uma vez)
  // ------------------------------------------------------
  function init() {
    if (bound) return;
    bound = true;

    bindTogglePassword();
    bindLoginForm();
    bindCreateAccount();
    bindBackHome();
    bindRecoverPassword();
    bindHeaderLogin();

    // estado inicial garantido
    closeAuth();

    console.log("🔐 Auth UI inicializado (modal canônico)");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
