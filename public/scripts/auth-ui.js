// ==========================================================
// 🧠 LIORA — AUTH UI v10 (LOGIN FIXED + NO LOOP)
// ==========================================================

(function () {
  console.log("🔐 Liora Auth UI v10 carregado...");

  window.lioraDebug = true;
  const dbg = (...a) => window.lioraDebug && console.log("🐞[LioraDebug]", ...a);

  document.addEventListener("DOMContentLoaded", () => {
    dbg("📦 DOM pronto");

    const els = {
      authModal: document.getElementById("liora-auth-modal"),
      authClose: document.getElementById("liora-auth-close"),
      authForm: document.getElementById("liora-auth-form"),
      authEmail: document.getElementById("auth-email"),
      authSenha: document.getElementById("auth-senha"),
      authSubmit: document.getElementById("liora-auth-submit"),
      authToggleMode: document.getElementById("liora-auth-toggle-mode"),
      authError: document.getElementById("liora-auth-error"),

      btnAuthToggles: document.querySelectorAll("#btn-auth-toggle"),
      btnLogout: document.getElementById("btn-logout"),

      userInfo: document.getElementById("liora-user-info"),
      userName: document.getElementById("liora-user-name"),
      userStatus: document.getElementById("liora-user-status"),
      premiumBadge: document.getElementById("liora-premium-badge"),
    };

    let mode = "login";

    const currentUser = () => window.lioraAuth?.user || null;

    // -------------------------------------------------------
    // MODAL
    // -------------------------------------------------------
    function openModal() {
      els.authModal.classList.add("is-open");
      setTimeout(() => els.authEmail?.focus(), 100);
    }

    function closeModal() {
      els.authModal.classList.remove("is-open");
      els.authForm.reset();
      els.authError.textContent = "";
    }

    // -------------------------------------------------------
    // UI
    // -------------------------------------------------------
    function updateAuthUI(user) {
      dbg("🎨 updateAuthUI", user);

      const logged = !!user;
      const plan = window.lioraUserPlan || "free";

      els.btnAuthToggles.forEach(b => b.textContent = logged ? "Conta" : "Entrar");

      if (els.premiumBadge) {
        els.premiumBadge.textContent =
          plan === "premium"
            ? "Liora+ ativo — recursos liberados"
            : "Versão gratuita — recursos limitados";
      }

      if (logged) {
        els.userName.textContent = user.email.split("@")[0];
        els.userStatus.textContent = plan === "premium" ? "Liora+ ativo" : "Conta gratuita";
      }

      els.userInfo.classList.toggle("hidden", !logged);
      els.btnLogout.classList.toggle("hidden", !logged);
    }

    // -------------------------------------------------------
    // 🔄 PLANO (SEM LOOP)
    // -------------------------------------------------------
    async function syncPlano(user) {
      if (!user) return setPlan("free");

      try {
        const token = await user.getIdToken();
        const r = await fetch("/api/plano", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await r.json();
        setPlan(json.plano);
      } catch {
        setPlan("free");
      }
    }

    function setPlan(plan) {
      if (window.lioraUserPlan === plan) return;
      dbg("📝 SetPlan:", plan);
      window.lioraUserPlan = plan;
      updateAuthUI(currentUser());
    }

    // -------------------------------------------------------
    // ✅ SUBMIT FUNCIONAL (O QUE ESTAVA FALTANDO)
    // -------------------------------------------------------
    els.authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      els.authError.textContent = "";

      const email = els.authEmail.value.trim();
      const senha = els.authSenha.value;

      if (!email || !senha) {
        els.authError.textContent = "Digite e-mail e senha.";
        return;
      }

      els.authSubmit.disabled = true;

      try {
        if (mode === "login") {
          await window.lioraAuth.login(email, senha);
        } else {
          await window.lioraAuth.cadastro(email, senha);
        }
        closeModal();
      } catch (err) {
        els.authError.textContent = err.message || "Erro ao autenticar.";
      } finally {
        els.authSubmit.disabled = false;
      }
    });

    // -------------------------------------------------------
    // EVENTOS
    // -------------------------------------------------------
    els.btnAuthToggles.forEach(btn =>
      btn.addEventListener("click", openModal)
    );

    els.btnLogout?.addEventListener("click", () => window.lioraAuth.logout());
    els.authClose?.addEventListener("click", closeModal);

    els.authToggleMode?.addEventListener("click", () => {
      mode = mode === "login" ? "signup" : "login";
      dbg("Modo:", mode);
    });

    window.addEventListener("liora:auth-changed", () => {
      const user = currentUser();
      dbg("🌀 auth-changed", user);
      updateAuthUI(user);
      syncPlano(user);
    });

    // INIT
    updateAuthUI(currentUser());
    dbg("🚀 Init final");
  });
})();
