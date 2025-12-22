// ==========================================================
// 🔐 LIORA — AUTH UI v11.1 (BLINDADO)
// ==========================================================

(function () {
  console.log("🔐 Auth UI v11.1 iniciado");

  if (!window.lioraAuth) {
    console.error("❌ lioraAuth não disponível");
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const els = {
      modal: document.getElementById("liora-auth-modal"),
      close: document.getElementById("liora-auth-close"),
      form: document.getElementById("liora-auth-form"),
      email: document.getElementById("auth-email"),
      senha: document.getElementById("auth-senha"),
      error: document.getElementById("liora-auth-error"),
      submit: document.getElementById("liora-auth-submit"),
      toggleMode: document.getElementById("liora-auth-toggle-mode"),
      title: document.getElementById("liora-auth-title"),
      btnAuth: document.querySelectorAll("#btn-auth-toggle"),
      btnLogout: document.getElementById("btn-logout"),
      userInfo: document.getElementById("liora-user-info"),
      userName: document.getElementById("liora-user-name"),
      userStatus: document.getElementById("liora-user-status"),
      premiumBadge: document.getElementById("liora-premium-badge"),
    };

    if (!els.form || !els.modal) return;

    let mode = "login";

    // -------------------------------------------------------
    // MODAL (OPEN / CLOSE)
    // -------------------------------------------------------
    function openModal() {
      window.lioraModal?.open("liora-auth-modal");
    }

    function closeModalHard() {
      window.lioraModal?.close("liora-auth-modal");

      // 🧹 LIMPEZA TOTAL (anti-overlay fantasma)
      document.body.classList.remove("modal-open", "liora-modal-open");
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "auto";

      document
        .querySelectorAll(".liora-modal-backdrop, .modal-backdrop")
        .forEach((el) => el.remove());
    }

    // -------------------------------------------------------
    // MODO LOGIN / CADASTRO
    // -------------------------------------------------------
    function applyMode() {
      if (mode === "login") {
        els.title.textContent = "Acesse sua conta";
        els.submit.querySelector(".liora-btn-text").textContent = "Entrar";
        els.toggleMode.textContent = "Criar conta";
      } else {
        els.title.textContent = "Criar conta";
        els.submit.querySelector(".liora-btn-text").textContent = "Criar conta";
        els.toggleMode.textContent = "Já tenho conta";
      }
    }

    els.toggleMode.onclick = () => {
      mode = mode === "login" ? "signup" : "login";
      applyMode();
    };

    // -------------------------------------------------------
    // SUBMIT (NÃO FECHA MODAL AQUI)
    // -------------------------------------------------------
    els.form.onsubmit = async (e) => {
      e.preventDefault();
      els.error.textContent = "";

      const payload = {
        email: els.email.value.trim(),
        password: els.senha.value.trim(),
      };

      if (!payload.email || !payload.password) {
        els.error.textContent = "Preencha e-mail e senha.";
        return;
      }

      try {
        if (mode === "login") {
          await window.lioraAuth.login(payload);
        } else {
          await window.lioraAuth.cadastro(payload);
        }

        // ⛔ NÃO FECHA MODAL AQUI
        // fechamento acontece via auth-changed
      } catch (err) {
        els.error.textContent =
          window.lioraAuth.error || "Erro ao autenticar.";
      }
    };

    // -------------------------------------------------------
    // BOTÕES "ENTRAR"
    // -------------------------------------------------------
    els.btnAuth.forEach((btn) => {
      btn.onclick = openModal;
    });

    // -------------------------------------------------------
    // LOGOUT
    // -------------------------------------------------------
    els.btnLogout?.addEventListener("click", async () => {
      await window.lioraAuth.logout();
    });

    // -------------------------------------------------------
    // FECHAMENTO MANUAL (X / BACKDROP)
    // -------------------------------------------------------
    els.close?.addEventListener("click", closeModalHard);

    els.modal.addEventListener("click", (e) => {
      if (e.target === els.modal) closeModalHard();
    });

    // -------------------------------------------------------
    // ATUALIZA UI
    // -------------------------------------------------------
    function updateAuthUI() {
      const user = window.lioraAuth.user;
      const logged = !!user;
      const plan = window.lioraUserPlan || "free";

      els.btnAuth.forEach(
        (btn) => (btn.textContent = logged ? "Conta" : "Entrar")
      );

      els.userInfo?.classList.toggle("hidden", !logged);
      els.btnLogout?.classList.toggle("hidden", !logged);

      if (logged && user) {
        els.userName.textContent = user.email.split("@")[0];
        els.userStatus.textContent =
          plan === "premium" ? "Liora+ ativo" : "Conta gratuita";
      }

      if (els.premiumBadge) {
        els.premiumBadge.textContent =
          plan === "premium" ? "Liora+ ativo" : "Versão gratuita";
      }
    }

    // -------------------------------------------------------
    // FECHAMENTO CANÔNICO APÓS LOGIN REAL
    // -------------------------------------------------------
    window.addEventListener("liora:auth-changed", () => {
      updateAuthUI();

      if (window.lioraAuth.user) {
        closeModalHard();
      }
    });

    // -------------------------------------------------------
    // INIT
    // -------------------------------------------------------
    applyMode();
    updateAuthUI();

    console.log("✅ Auth UI v11.1 pronto");
  });
})();
