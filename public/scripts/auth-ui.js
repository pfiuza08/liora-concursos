// ==========================================================
// 🧠 LIORA — AUTH UI v8 (Estável, sem erros, sincronização real)
// ==========================================================

(function () {
  console.log("🔐 Liora Auth UI v8 carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------------------------------
    // ELEMENTOS
    // -------------------------------------------------------
    const els = {
      authModal: document.getElementById("liora-auth-modal"),
      authClose: document.getElementById("liora-auth-close"),
      authTitle: document.getElementById("liora-auth-title"),
      authSubtitle: document.getElementById("liora-auth-subtitle"),
      authForm: document.getElementById("liora-auth-form"),
      authEmail: document.getElementById("auth-email"),
      authSenha: document.getElementById("auth-senha"),
      authError: document.getElementById("liora-auth-error"),
      authSubmit: document.getElementById("liora-auth-submit"),
      authToggleMode: document.getElementById("liora-auth-toggle-mode"),

      btnAuthToggles: document.querySelectorAll("#btn-auth-toggle"),
      btnLogout: document.getElementById("btn-logout"),

      userInfo: document.getElementById("liora-user-info"),
      userName: document.getElementById("liora-user-name"),
      userStatus: document.getElementById("liora-user-status"),

      homeSimulados: document.getElementById("home-simulados"),
      homeDashboard: document.getElementById("home-dashboard"),

      premiumBadge: document.getElementById("liora-premium-badge")
    };

    // Função de acesso global ao usuário
    function currentUser() {
      return window.lioraAuth?.user || null;
    }

    // -------------------------------------------------------
    // UI LOGIN / CADASTRO
    // -------------------------------------------------------
    let mode = "login";

    function applyMode() {
      if (mode === "login") {
        els.authTitle.textContent = "Acesse sua conta";
        els.authSubtitle.textContent = "Continue seus estudos em qualquer dispositivo.";
        els.authSubmit.querySelector(".liora-btn-text").textContent = "Entrar";
        els.authToggleMode.textContent = "Criar conta";
      } else {
        els.authTitle.textContent = "Criar conta";
        els.authSubtitle.textContent = "Leva segundos. Use seu melhor e-mail.";
        els.authSubmit.querySelector(".liora-btn-text").textContent = "Criar conta";
        els.authToggleMode.textContent = "Já tenho conta";
      }
    }

    function setMode(newMode) {
      mode = newMode === "signup" ? "signup" : "login";
      applyMode();
      clearError();
    }

    // -------------------------------------------------------
    // MODAL
    // -------------------------------------------------------
    function openAuthModal(initialMode = "login") {
      setMode(initialMode);
      els.authModal.classList.add("is-open");
      setTimeout(() => els.authEmail?.focus(), 120);
    }

    function closeAuthModal() {
      els.authModal.classList.remove("is-open");
      els.authForm?.reset();
      clearError();
      setLoading(false);
    }

    // -------------------------------------------------------
    // LOADING
    // -------------------------------------------------------
    function setLoading(active) {
      els.authSubmit.classList.toggle("is-loading", active);
      els.authSubmit.disabled = active;
      els.authEmail.disabled = active;
      els.authSenha.disabled = active;
    }

    // -------------------------------------------------------
    // ERROS
    // -------------------------------------------------------
    function showError(msg) {
      els.authError.textContent = msg;
    }
    function clearError() {
      els.authError.textContent = "";
    }

    // -------------------------------------------------------
    // UI GLOBAL LOGIN + PLANO
    // -------------------------------------------------------
    function updateAuthUI(user) {
      const logged = !!user;
      const plan = window.lioraUserPlan || "free";

      els.btnAuthToggles.forEach((btn) => {
        btn.textContent = logged ? "Conta" : "Entrar";
      });

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

      els.userInfo?.classList.toggle("hidden", !logged);
      els.btnLogout?.classList.toggle("hidden", !logged);
    }

    // -------------------------------------------------------
    // 🔄 SYNC PLANO
    // -------------------------------------------------------
    async function syncPlano(user) {
      if (!user) {
        window.lioraSetPlan("free");
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/plano", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const json = await res.json();
        window.lioraSetPlan(json.plano);
      } catch (err) {
        console.warn("⚠️ Erro ao consultar plano:", err);
        window.lioraSetPlan("free");
      }
    }

    // -------------------------------------------------------
    // SUBMIT LOGIN / CADASTRO
    // -------------------------------------------------------
    els.authForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();

      const email = els.authEmail.value.trim();
      const senha = els.authSenha.value;
      if (!email || !senha) return showError("Digite e-mail e senha.");

      setLoading(true);

      try {
        if (mode === "login") {
          await window.lioraAuth.login(email, senha);
        } else {
          await window.lioraAuth.cadastro(email, senha);
        }

        closeAuthModal();

      } catch (err) {
        showError(err?.message || "Erro ao autenticar.");
      } finally {
        setLoading(false);
      }
    });

    els.authToggleMode?.addEventListener("click", () => {
      setMode(mode === "login" ? "signup" : "login");
    });

    els.btnAuthToggles.forEach((btn) =>
      btn.addEventListener("click", () => openAuthModal("login"))
    );

    els.btnLogout?.addEventListener("click", async () => {
      await window.lioraAuth.logout();
    });

    els.authClose?.addEventListener("click", closeAuthModal);
    els.authModal?.addEventListener("click", (e) => {
      if (e.target === els.authModal) closeAuthModal();
    });

    // -------------------------------------------------------
    // PROTEGER RECURSOS PREMIUM
    // -------------------------------------------------------
    function proteger(btn) {
      if (!btn) return;
      btn.addEventListener(
        "click",
        (e) => {
          if (!currentUser()) {
            e.preventDefault();
            openAuthModal("signup");
          }
        },
        true
      );
    }

    proteger(els.homeSimulados);
    proteger(els.homeDashboard);

    // -------------------------------------------------------
    // 🔥 AUTH CHANGED
    // -------------------------------------------------------
    window.addEventListener("liora:auth-changed", (ev) => {
      const user = ev.detail;
      updateAuthUI(user);
      syncPlano(user);
    });

    updateAuthUI(currentUser());
    applyMode();
  });

  // --------------------------------------------------------
  // 🌟 FUNÇÃO GLOBAL DO PLANO (SEM getUser!)
  // --------------------------------------------------------
  window.lioraSetPlan = function (newPlan) {
    window.lioraUserPlan = newPlan || "free";
    window.dispatchEvent(new CustomEvent("liora:auth-changed", { detail: window.lioraAuth?.user || null }));
  };

})();
