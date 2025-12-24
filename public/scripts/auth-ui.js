// ==========================================================
// 🔐 LIORA — AUTH UI (FULLSCREEN | CANÔNICO FINAL)
// ==========================================================
(function () {

  // --------------------------------------------------------
  // ⏳ Aguarda APIs essenciais
  // --------------------------------------------------------
  function ready(fn) {
    const iv = setInterval(() => {
      if (window.lioraAuth && window.lioraUI) {
        clearInterval(iv);
        fn();
      }
    }, 20);
  }

  ready(() => {

    // ------------------------------------------------------
    // ELEMENTOS
    // ------------------------------------------------------
    const form = document.getElementById("liora-auth-form");
    const email = document.getElementById("auth-email");
    const senha = document.getElementById("auth-senha");
    const error = document.getElementById("liora-auth-error");

    const toggle = document.getElementById("liora-auth-toggle-mode");
    const submitText = document.getElementById("liora-auth-submit-text");
    const back = document.getElementById("liora-auth-back");
    const btnTop = document.getElementById("btn-auth-toggle");
    const forgotBtn = document.getElementById("liora-auth-forgot");
    const togglePwd = document.getElementById("toggle-password");

      togglePwd?.addEventListener("click", () => {
        senha.type = senha.type === "password" ? "text" : "password";
      });

    if (!form || !email || !senha) {
      console.error("❌ Auth UI: elementos não encontrados");
      return;
    }

    // ------------------------------------------------------
    // ESTADO
    // ------------------------------------------------------
    let mode = "login"; // login | signup

    function setMode(m) {
      mode = m;
      submitText.textContent = m === "login" ? "Entrar" : "Criar conta";
      toggle.textContent =
        m === "login" ? "Criar conta" : "Já tenho conta";
      error.textContent = "";
    }

    // ------------------------------------------------------
    // 🔥 LIMPEZA TOTAL DE MODAIS / BACKDROPS
    // ------------------------------------------------------
    function clearAnyModalState() {
      document
        .querySelectorAll(".liora-modal-backdrop.is-open")
        .forEach(el => el.classList.remove("is-open"));

      document
        .querySelectorAll(".liora-modal-backdrop")
        .forEach(el => el.setAttribute("aria-hidden", "true"));

      document.body.style.overflow = "";
      document.body.classList.remove("liora-modal-open");
    }

    // ------------------------------------------------------
    // ABRIR LOGIN (HEADER)
    // ------------------------------------------------------
    btnTop?.addEventListener("click", () => {
      clearAnyModalState();
      setMode("login");
      window.lioraUI.show("liora-auth");
    });

    // ------------------------------------------------------
    // TOGGLE LOGIN / CADASTRO
    // ------------------------------------------------------
    toggle.addEventListener("click", () => {
      setMode(mode === "login" ? "signup" : "login");
    });

    // ------------------------------------------------------
    // VOLTAR PARA HOME
    // ------------------------------------------------------
    back.addEventListener("click", () => {
      clearAnyModalState();
      window.lioraUI.show("liora-home");
    });
    
    // ------------------------------------------------------
    // ESQUECI A SENHA
    // ------------------------------------------------------
        forgotBtn?.addEventListener("click", async () => {
      const emailValue = email.value.trim();
    
      if (!emailValue) {
        error.textContent = "Digite seu e-mail para redefinir a senha.";
        return;
      }
    
      try {
        await window.lioraAuth.resetPassword(emailValue);
        error.textContent =
          "Enviamos um e-mail para redefinir sua senha. Verifique sua caixa de entrada.";
      } catch (err) {
        error.textContent =
          window.lioraAuth?.error ||
          err?.message ||
          "Erro ao enviar e-mail de redefinição.";
      }
    });

    // ------------------------------------------------------
    // SUBMIT (LOGIN / CADASTRO)
    // ------------------------------------------------------
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      error.textContent = "";

      const emailValue = email.value.trim();
      const senhaValue = senha.value.trim();

      if (!emailValue || !senhaValue) {
        error.textContent = "Preencha e-mail e senha.";
        return;
      }

      try {
        console.log("🔐 Auth submit:", { mode, emailValue });

        if (mode === "login") {
          await window.lioraAuth.login(emailValue, senhaValue);
        } else {
          await window.lioraAuth.cadastro(emailValue, senhaValue);
        }

        // sucesso → volta para home
        clearAnyModalState();
        window.lioraUI.show("liora-home");

      } catch (err) {
        console.error("❌ ERRO AUTH COMPLETO:", err);
        error.textContent =
          window.lioraAuth?.error ||
          err?.message ||
          "Erro ao autenticar.";
      }
    });

    // ------------------------------------------------------
    // INIT
    // ------------------------------------------------------
    setMode("login");
    console.log("🔐 Auth UI (fullscreen | canônico) pronto");

  });
})();
