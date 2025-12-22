// ==========================================================
// 🔐 LIORA — AUTH UI v11 (FINAL)
// ==========================================================

(function () {
  console.log("🔐 Auth UI v11 iniciado");

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

    function openModal() {
      window.lioraModal?.open("liora-auth-modal");
    }

    function closeModal() {
      window.lioraModal?.close("liora-auth-modal");
    }

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

        closeModal();
      } catch (err) {
        els.error.textContent =
          window.lioraAuth.error || "Erro ao autenticar.";
      }
    };

    els.btnAuth.forEach((btn) => {
      btn.onclick = openModal;
    });

    els.btnLogout?.addEventListener("click", async () => {
      await window.lioraAuth.logout();
    });

    els.close?.addEventListener("click", closeModal);
    els.modal.addEventListener("click", (e) => {
      if (e.target === els.modal) closeModal();
    });

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

    window.addEventListener("liora:auth-changed", updateAuthUI);

    applyMode();
    updateAuthUI();

    console.log("✅ Auth UI pronto");
  });
})();
