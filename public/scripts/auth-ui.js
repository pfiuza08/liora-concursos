// ==========================================================
// 🔐 LIORA — AUTH UI (FULLSCREEN)
// ==========================================================
(function () {

  function ready(fn) {
    const iv = setInterval(() => {
      if (window.lioraAuth && window.lioraUI) {
        clearInterval(iv);
        fn();
      }
    }, 20);
  }

  ready(() => {

    const form = document.getElementById("liora-auth-form");
    const email = document.getElementById("auth-email");
    const senha = document.getElementById("auth-senha");
    const error = document.getElementById("liora-auth-error");

    const toggle = document.getElementById("liora-auth-toggle-mode");
    const submitText = document.getElementById("liora-auth-submit-text");
    const back = document.getElementById("liora-auth-back");

    let mode = "login";

    function setMode(m) {
      mode = m;
      submitText.textContent = m === "login" ? "Entrar" : "Criar conta";
      toggle.textContent =
        m === "login" ? "Criar conta" : "Já tenho conta";
      error.textContent = "";
    }

    document.getElementById("btn-auth-toggle")
      ?.addEventListener("click", () => {
        setMode("login");
        window.lioraUI.show("liora-auth");
      });

    toggle.addEventListener("click", () => {
      setMode(mode === "login" ? "signup" : "login");
    });

    back.addEventListener("click", () => {
      window.lioraUI.show("liora-home");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      error.textContent = "";

      try {
        if (mode === "login") {
          await window.lioraAuth.login(email.value, senha.value);
        } else {
          await window.lioraAuth.cadastro(email.value, senha.value);
        }

        window.lioraUI.show("liora-home");
    } catch (err) {
  console.error("❌ ERRO AUTH COMPLETO:", err);
  error.textContent =
    err?.message ||
    window.lioraAuth?.error ||
    "Erro ao autenticar.";
}

    });

  });
})();
