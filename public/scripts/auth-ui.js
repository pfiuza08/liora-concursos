// ==========================================================
// 🔐 LIORA — AUTH UI (FULLSCREEN | CANÔNICO)
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
    // ABRIR LOGIN (HEADER)
    // ------------------------------------------------------
    btnTop?.addEventListener("click", () => {
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
      window.lioraUI.show("liora-home");
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
    console.log("🔐 Auth UI (fullscreen) pronto");

  });
})();
