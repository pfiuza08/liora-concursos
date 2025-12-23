// ==========================================================
// 🔐 LIORA — AUTH UI (CANÔNICO · LIMPO)
// - Login / Cadastro
// - Um único botão de login
// - Um único modal
// - Sem duplicação de listeners
// ==========================================================
(function () {
  console.log("🔐 Auth UI (canônico) carregando...");

  // -------------------------------------------------------
  // 🔒 Dependências obrigatórias
  // -------------------------------------------------------
  if (!window.lioraAuth) {
    console.error("❌ lioraAuth não disponível");
    return;
  }

  if (!window.lioraModal) {
    console.error("❌ lioraModal não disponível");
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------------------------------
    // 🎯 ELEMENTOS (IDs ÚNICOS)
    // -------------------------------------------------------
    const btnEntrar = document.getElementById("btn-auth-toggle");
    const btnSair = document.getElementById("btn-logout");

    const modal = document.getElementById("liora-auth-modal");
    const form = document.getElementById("liora-auth-form");

    const inputEmail = document.getElementById("auth-email");
    const inputSenha = document.getElementById("auth-senha");

    const errorBox = document.getElementById("liora-auth-error");
    const title = document.getElementById("liora-auth-title");
    const toggleModeBtn = document.getElementById("liora-auth-toggle-mode");
    const submitText = document.querySelector(
      "#liora-auth-submit .liora-btn-text"
    );

    const userInfo = document.getElementById("liora-user-info");
    const userName = document.getElementById("liora-user-name");
    const userStatus = document.getElementById("liora-user-status");

    if (!btnEntrar || !modal || !form) {
      console.warn("⚠️ Auth UI: elementos essenciais ausentes");
      return;
    }

    // -------------------------------------------------------
    // 🧠 ESTADO LOCAL
    // -------------------------------------------------------
    let mode = "login"; // login | signup

    function setMode(nextMode) {
      mode = nextMode;

      if (mode === "login") {
        title.textContent = "Acessar Liora";
        submitText.textContent = "Entrar";
        toggleModeBtn.textContent = "Criar conta";
      } else {
        title.textContent = "Criar conta";
        submitText.textContent = "Criar conta";
        toggleModeBtn.textContent = "Já tenho conta";
      }

      errorBox.textContent = "";
    }

    // -------------------------------------------------------
    // 🔐 ABRIR / FECHAR MODAL
    // -------------------------------------------------------
    function openModal() {
      setMode("login");
      window.lioraModal.open("liora-auth-modal");
    }

    function closeModal() {
      window.lioraModal.close("liora-auth-modal");
    }

    // -------------------------------------------------------
    // 🖱 BOTÃO ENTRAR (HEADER)
    // -------------------------------------------------------
    btnEntrar.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });

    // -------------------------------------------------------
    // 🔁 TOGGLE LOGIN / CADASTRO
    // -------------------------------------------------------
    toggleModeBtn.addEventListener("click", () => {
      setMode(mode === "login" ? "signup" : "login");
    });

    // -------------------------------------------------------
    // 📤 SUBMIT LOGIN / CADASTRO
    // -------------------------------------------------------
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.textContent = "";

      const email = inputEmail.value.trim();
      const senha = inputSenha.value.trim();

      if (!email || !senha) {
        errorBox.textContent = "Preencha e-mail e senha.";
        return;
      }

      try {
        if (mode === "login") {
          await window.lioraAuth.login(email, senha);
        } else {
          await window.lioraAuth.cadastro(email, senha);
        }

        closeModal();
      } catch (err) {
        errorBox.textContent =
          window.lioraAuth.error || "Erro ao autenticar.";
      }
    });

    // -------------------------------------------------------
    // 🚪 LOGOUT
    // -------------------------------------------------------
    if (btnSair) {
      btnSair.addEventListener("click", async () => {
        try {
          await window.lioraAuth.logout();
        } catch (err) {
          console.error("Erro no logout:", err);
        }
      });
    }

    // -------------------------------------------------------
    // 🔄 ATUALIZA UI QUANDO AUTH MUDA
    // -------------------------------------------------------
    function updateAuthUI() {
      const user = window.lioraAuth.user;
      const logged = !!user;
      const plan = window.lioraUserPlan || "free";

      btnEntrar.classList.toggle("hidden", logged);
      btnSair?.classList.toggle("hidden", !logged);

      userInfo?.classList.toggle("hidden", !logged);

      if (logged && user) {
        userName.textContent = user.email.split("@")[0];
        userStatus.textContent =
          plan === "premium" ? "Liora+ ativo" : "Conta gratuita";
      }
    }

    window.addEventListener("liora:auth-changed", updateAuthUI);
    updateAuthUI();

    // -------------------------------------------------------
    // INIT
    // -------------------------------------------------------
    setMode("login");
    console.log("✅ Auth UI canônico pronto");
  });
})();
