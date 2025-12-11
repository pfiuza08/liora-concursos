// ==========================================================
// 🧠 LIORA — AUTH UI v7 (Premium Real + Plano Universal)
// ----------------------------------------------------------
// - Integra com window.lioraAuth (Firebase Auth)
// - Modal de login/cadastro
// - Pós-login inteligente
// - Premium real via Firestore (/api/plano)
// - UI atualizada automaticamente
// - Proteção de recursos premium
// - Fluxo sem duplicações
// ==========================================================

(function () {
  console.log("🔐 Liora Auth UI v7 carregado...");

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

    // Remove overlay antigo
    document.getElementById("liora-login-backdrop")?.classList.add("hidden");

    // -------------------------------------------------------
    // ESTADO
    // -------------------------------------------------------
    let mode = "login";
    function getUser() {
      return window.lioraAuth?.user || null;
    }

    // -------------------------------------------------------
    // UI LOGIN / CADASTRO
    // -------------------------------------------------------
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
      if (!err?.code) return "Erro inesperado.";
      return {
        "auth/invalid-email": "E-mail inválido.",
        "auth/user-not-found": "E-mail não encontrado.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/email-already-in-use": "E-mail já cadastrado.",
        "auth/weak-password": "Senha muito fraca.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde.",
      }[err.code] || "Erro de autenticação.";
    }

    // -------------------------------------------------------
    // UI GLOBAL LOGIN + PLANO
    // -------------------------------------------------------
    function updateAuthUI(user) {
      const logged = !!user;
      const plan = window.lioraUserPlan || "free";

      // Botões Entrar
      els.btnAuthToggles.forEach((btn) => {
        btn.textContent = logged ? "Conta" : "Entrar";
      });

      // Badge topo
      if (els.premiumBadge) {
        els.premiumBadge.textContent =
          plan === "premium"
            ? "Liora+ ativo — recursos liberados"
            : "Versão gratuita — recursos limitados";
      }

      // Dados do usuário
      if (logged) {
        els.userName.textContent = user.email.split("@")[0];
        els.userStatus.textContent =
          plan === "premium" ? "Liora+ ativo" : "Conta gratuita";
      }

      els.userInfo?.classList.toggle("hidden", !logged);
      els.btnLogout?.classList.toggle("hidden", !logged);

      document.body.classList.toggle("liora-premium-on", plan === "premium");
      document.body.classList.toggle("liora-premium-off", plan !== "premium");
    }

    // -------------------------------------------------------
    // 🔄 SYNC PLANO (REAL FIRESTORE VIA /api/plano)
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

      } catch (e) {
        console.warn("⚠️ Erro ao consultar plano:", e);
        window.lioraSetPlan("free");
      }
    }

    // -------------------------------------------------------
    // PÓS LOGIN
    // -------------------------------------------------------
    function navegarPosLogin() {
      const sm = window.lioraEstudos;

      if (sm?.temPlanoAtivo?.()) {
        sm.abrirUltimoPlano?.();
        return;
      }

      window.homeInicio?.();
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
    // BOTÕES "ENTRAR"
    // -------------------------------------------------------
    els.btnAuthToggles.forEach((btn) => {
      btn.addEventListener("click", () => openAuthModal("login"));
    });

    // -------------------------------------------------------
    // LOGOUT
    // -------------------------------------------------------
    els.btnLogout?.addEventListener("click", async () => {
      await window.lioraAuth.logout();
      navegarPosLogin();
    });

    // -------------------------------------------------------
    // FECHAR MODAL
    // -------------------------------------------------------
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
    // 🔥 AUTH CHANGED → Atualiza UI + Sincroniza Plano
    // -------------------------------------------------------
    window.addEventListener("liora:auth-changed", (ev) => {
      const user = ev.detail || getUser();
      updateAuthUI(user);
      syncPlano(user);
    });

    // Primeira carga
    updateAuthUI(getUser());
    applyMode();
  });

  // --------------------------------------------------------
  // 🌟 FUNÇÃO GLOBAL DO PLANO
  // --------------------------------------------------------
  window.lioraSetPlan = function (newPlan) {
    window.lioraUserPlan = newPlan || "free";
    window.dispatchEvent(new CustomEvent("liora:auth-changed", { detail: getUser?.() }));
  };

})();
