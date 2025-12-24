// ==========================================================
// 🔐 LIORA — AUTH UI (FULLSCREEN | CANÔNICO FINAL v2)
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

    let bound = false; // evita múltiplos binds

    function bindAuthUI() {
      if (bound) return;

      const form = document.getElementById("liora-auth-form");
      const email = document.getElementById("auth-email");
      const senha = document.getElementById("auth-senha");
      const error = document.getElementById("liora-auth-error");

      const toggle = document.getElementById("liora-auth-toggle-mode");
      const submitText = document.getElementById("liora-auth-submit-text");
      const back = document.getElementById("liora-auth-back");
      const forgotBtn = document.getElementById("liora-auth-forgot");
      const togglePwd = document.getElementById("toggle-password");

      if (!form || !email || !senha) {
        console.warn("⏳ Auth UI ainda não disponível no DOM");
        return;
      }

      console.log("🔐 Auth UI conectado ao DOM");
      bound = true;

      form.setAttribute("novalidate", "true");

      togglePwd?.addEventListener("click", () => {
        senha.type = senha.type === "password" ? "text" : "password";
      });

      let mode = "login";

      function setMode(m) {
        mode = m;
        submitText.textContent = m === "login" ? "Entrar" : "Criar conta";
        toggle.textContent = m === "login" ? "Criar conta" : "Já tenho conta";
        error.textContent = "";
      }

      toggle.addEventListener("click", () => {
        setMode(mode === "login" ? "signup" : "login");
      });

      back.addEventListener("click", () => {
        window.lioraUI.show("liora-home");
      });

      forgotBtn?.addEventListener("click", async () => {
        const emailValue = email.value.trim();
        if (!emailValue) {
          error.textContent = "Digite seu e-mail para redefinir a senha.";
          return;
        }

        try {
          await window.lioraAuth.resetPassword(emailValue);
          error.textContent =
            "Enviamos um e-mail para redefinir sua senha.";
        } catch (err) {
          error.textContent =
            window.lioraAuth?.error ||
            err?.message ||
            "Erro ao enviar e-mail.";
        }
      });

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

          window.lioraUI.show("liora-home");

        } catch (err) {
          console.error("❌ ERRO AUTH:", err);
          error.textContent =
            window.lioraAuth?.error ||
            err?.message ||
            "Erro ao autenticar.";
        }
      });

      setMode("login");
    }

    // ------------------------------------------------------
    // QUANDO A TELA AUTH FOR EXIBIDA
    // ------------------------------------------------------
    window.addEventListener("liora:show-auth", () => {
      bindAuthUI();
    });

  });
})();
