// ==========================================================
// 🧠 LIORA — AUTH UI v4 (Commercial Ready + Plano Universal)
// ----------------------------------------------------------
// - Integra com window.lioraAuth (Firebase Auth)
// - Modal de login/cadastro (black glass)
// - Pós-login inteligente
// - Estado global premium/free sincronizado
// - Atualização automática da UI quando login muda (2.4)
// - Função universal de mudança de plano (2.3)
// - Proteção de simulados/dashboard para não logados
// ==========================================================

(function () {
  console.log("🔐 Liora Auth UI v4 carregado...");

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

    // Remove login antigo, se existir
    const legacyLogin = document.getElementById("liora-login-backdrop");
    if (legacyLogin) legacyLogin.classList.add("hidden");

    // -------------------------------------------------------
    // ESTADO
    // -------------------------------------------------------
    let mode = "login";
    function getUser() {
      return window.lioraAuth?.user || null;
    }

    // -------------------------------------------------------
    // MODO LOGIN / CADASTRO
    // -------------------------------------------------------
    function applyMode() {
      if (!els.authTitle) return;

      if (mode === "login") {
        els.authTitle.textContent = "Acesse sua conta";
        els.authSubtitle.textContent =
          "Entre para continuar seus planos de estudo em qualquer dispositivo.";
        els.authSubmit.querySelector(".liora-btn-text").textContent = "Entrar";
        els.authToggleMode.textContent = "Criar conta";
      } else {
        els.authTitle.textContent = "Criar conta";
        els.authSubtitle.textContent =
          "Leva segundos. Use seu melhor e-mail.";
        els.authSubmit.querySelector(".liora-btn-text").textContent =
          "Criar conta";
        els.authToggleMode.textContent = "Já tenho conta";
      }
    }

    function setMode(newMode) {
      mode = newMode === "signup" ? "signup" : "login";
      applyMode();
      clearError();
    }

    // -------------------------------------------------------
    // ABRIR / FECHAR MODAL
    // -------------------------------------------------------
    function openAuthModal(initialMode = "login") {
      setMode(initialMode);
      els.authModal.classList.add("is-open");
      els.authModal.setAttribute("aria-hidden", "false");

      setTimeout(() => els.authEmail?.focus(), 120);
    }

    function closeAuthModal() {
      els.authModal.classList.remove("is-open");
      els.authModal.setAttribute("aria-hidden", "true");
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

    function traduzErroFirebase(err) {
      if (!err?.code) return "Erro inesperado. Tente novamente.";

      const map = {
        "auth/invalid-email": "O e-mail informado não é válido.",
        "auth/user-not-found": "E-mail não encontrado.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/email-already-in-use": "E-mail já cadastrado.",
        "auth/weak-password": "A senha é muito fraca.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco."
      };
      return map[err.code] || "Erro de autenticação. Tente novamente.";
    }

    // -------------------------------------------------------
    // UI GLOBAL — login/logout + plano free/premium
    // -------------------------------------------------------
    function updateAuthUI(user) {
      const logged = !!user;
      const plan = window.lioraUserPlan || "free";

      // Botões Entrar
      els.btnAuthToggles.forEach((btn) => {
        btn.textContent = logged ? "Conta" : "Entrar";
      });

      // Badge de plano
      if (els.premiumBadge) {
        els.premiumBadge.textContent =
          plan === "premium"
            ? "Liora+ ativo — recursos liberados"
            : "Versão gratuita — recursos limitados";
      }

      // Avatar / nome
      if (logged && els.userName && els.userStatus) {
        els.userName.textContent = user.email.split("@")[0];
        els.userStatus.textContent =
          plan === "premium" ? "Liora+ ativo" : "Conta gratuita";
      }

      if (els.userInfo) els.userInfo.classList.toggle("hidden", !logged);
      if (els.btnLogout) els.btnLogout.classList.toggle("hidden", !logged);

      // Classe de plano no body (útil para estilos)
      document.body.classList.toggle("liora-premium-on", plan === "premium");
      document.body.classList.toggle("liora-premium-off", plan !== "premium");
    }

    // -------------------------------------------------------
    // PÓS LOGIN
    // -------------------------------------------------------
    function navegarPosLogin() {
      const sm = window.lioraEstudos;

      try {
        if (sm?.temPlanoAtivo?.()) {
          sm.abrirUltimoPlano?.();
          return;
        }
      } catch {}

      // Fallback para home
      try {
        window.homeInicio?.();
      } catch {}
    }

    // -------------------------------------------------------
    // SUBMIT LOGIN/CADASTRO
    // -------------------------------------------------------
    els.authForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();

      const email = els.authEmail.value.trim();
      const senha = els.authSenha.value;

      if (!email || !senha) {
        showError("Digite e-mail e senha.");
        return;
      }

      setLoading(true);
      try {
        if (mode === "login") {
          await window.lioraAuth.login(email, senha);
        } else {
          await window.lioraAuth.cadastro(email, senha);
        }
        closeAuthModal();
        navegarPosLogin();
      } catch (err) {
        showError(traduzErroFirebase(err));
      } finally {
        setLoading(false);
      }
    });

    // -------------------------------------------------------
    // TOGGLE LOGIN/CADASTRO
    // -------------------------------------------------------
    els.authToggleMode?.addEventListener("click", () => {
      setMode(mode === "login" ? "signup" : "login");
    });

    // -------------------------------------------------------
    // AÇÃO: BOTÕES "ENTRAR"
    // -------------------------------------------------------
    els.btnAuthToggles.forEach((btn) => {
      btn.addEventListener("click", () => {
        const user = getUser();
        openAuthModal(user ? "login" : "login");
      });
    });

    // -------------------------------------------------------
    // LOGOUT
    // -------------------------------------------------------
    els.btnLogout?.addEventListener("click", async () => {
      try {
        await window.lioraAuth.logout();
        navegarPosLogin();
      } catch (e) {
        console.warn("Erro ao sair:", e);
      }
    });

    // -------------------------------------------------------
    // FECHAR MODAL
    // -------------------------------------------------------
    els.authClose?.addEventListener("click", closeAuthModal);
    els.authModal?.addEventListener("click", (e) => {
      if (e.target === els.authModal) closeAuthModal();
    });

    // -------------------------------------------------------
    // BLOQUEAR recursos premium se não logado
    // -------------------------------------------------------
    function proteger(btn) {
      if (!btn) return;
      btn.addEventListener(
        "click",
        (e) => {
          if (!getUser()) {
            e.preventDefault();
            e.stopImmediatePropagation();
            openAuthModal("signup");
          }
        },
        true
      );
    }

    proteger(els.homeSimulados);
    proteger(els.homeDashboard);

    // -------------------------------------------------------
    // (2.4) LISTENER GLOBAL AUTH-CHANGED
    // -------------------------------------------------------
    window.addEventListener("liora:auth-changed", () => {
      updateAuthUI(getUser());
    });

    // Chamada inicial
    updateAuthUI(getUser());
    applyMode();
  });

  // --------------------------------------------------------
  // (2.3) FUNÇÃO UNIVERSAL DE MUDANÇA DE PLANO
  // --------------------------------------------------------
  window.lioraSetPlan = function (newPlan) {
    window.lioraUserPlan = newPlan || "free";
    window.dispatchEvent(new Event("liora:auth-changed"));
  };

})();
