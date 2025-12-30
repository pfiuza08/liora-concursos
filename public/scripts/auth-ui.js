// =======================================================
// 🔐 LIORA AUTH UI — vFINAL-STABLE-LAZY-FLOW
// - Inicializa SOMENTE quando a UI liora-auth está ativa
// - NÃO força navegação (router decide)
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

    // registro é idempotente
    window.lioraUI?.register?.("liora-auth", authEl);

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

    if (!toggle || !input) return;

    toggle.addEventListener("click", () => {
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      toggle.textContent = hidden ? "🙈" : "👁️";
    });
  }

  // ------------------------------------------------------
  // Login (integração com auth.js / lioraActions)
  // ------------------------------------------------------
  function bindLoginForm() {
    const form = $("liora-auth-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = $("auth-email")?.value?.trim();
      const senha = $("auth-senha")?.value?.trim();

      if (!email || !senha) {
        alert("Informe e-mail e senha");
        return;
      }

      console.log("🔐 Login solicitado:", email);

      // 🔁 Delegação TOTAL para auth.js / state
      window.lioraActions?.loginRequest?.({
        email,
        senha
      });
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
  // Voltar para início (ação explícita do usuário)
  // ------------------------------------------------------
  function bindBackHome() {
    const btn = $("liora-auth-back");
    if (!btn) return;

    btn.addEventListener("click", () => {
      window.lioraUI?.show?.("liora-home");
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
