// ==========================================================
// 🔐 LIORA — AUTH UI v11 (STABLE)
// - Login / Cadastro / Logout
// - Anti-loop de plano
// - Modal funcional
// - Compatível com auth.js v2+
// ==========================================================

(function () {
  console.log("🔐 Liora Auth UI v11 carregado...");

  // -------------------------------------------------------
  // DEBUG
  // -------------------------------------------------------
  window.lioraDebug = true;
  const dbg = (...args) => {
    if (window.lioraDebug) console.log("🐞[LioraDebug]", ...args);
  };

  document.addEventListener("DOMContentLoaded", () => {
    dbg("📦 DOM pronto — iniciando Auth UI");

    // -------------------------------------------------------
    // ELEMENTOS
    // -------------------------------------------------------
    const els = {
      modal: document.getElementById("liora-auth-modal"),
      close: document.getElementById("liora-auth-close"),

      title: document.getElementById("liora-auth-title"),
      subtitle: document.getElementById("liora-auth-subtitle"),
      form: document.getElementById("liora-auth-form"),
      email: document.getElementById("auth-email"),
      senha: document.getElementById("auth-senha"),
      error: document.getElementById("liora-auth-error"),
      submit: document.getElementById("liora-auth-submit"),
      toggleMode: document.getElementById("liora-auth-toggle-mode"),

      btnAuthToggles: document.querySelectorAll("#btn-auth-toggle"),
      btnLogout: document.getElementById("btn-logout"),

      userInfo: document.getElementById("liora-user-info"),
      userName: document.getElementById("liora-user-name"),
      userStatus: document.getElementById("liora-user-status"),

      premiumBadge: document.getElementById("liora-premium-badge")
    };

    if (!els.modal || !els.form) {
      console.warn("⚠️ Auth UI: elementos essenciais ausentes");
      return;
    }

    // -------------------------------------------------------
    // ESTADO
    // -------------------------------------------------------
    let mode = "login"; // login | signup

    function currentUser() {
      return window.lioraAuth?.user || null;
    }

    // -------------------------------------------------------
    // MODAL
    // -------------------------------------------------------
    function openModal() {
      els.modal.classList.remove("hidden");
      els.modal.classList.add("visible");
    }

    function closeModal() {
      els.modal.classList.remove("visible");
      els.modal.classList.add("hidden");
      els.error.textContent = "";
    }

    // -------------------------------------------------------
    // MODO LOGIN / CADASTRO
    // -------------------------------------------------------
    function applyMode() {
      dbg("🎭 Modo:", mode);

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
    // SUBMIT LOGIN / CADASTRO
    // -------------------------------------------------------
    els.form.onsubmit = async (e) => {
      e.preventDefault();
      els.error.textContent = "";

      const email = els.email.value.trim();
      const senha = els.senha.value.trim();

      if (!email || !senha) {
        els.error.textContent = "Preencha e-mail e senha.";
        return;
      }

      try {
        dbg("🔐 Enviando auth:", mode);

        if (mode === "login") {
          await window.lioraAuth.login(email, senha);
        } else {
          await window.lioraAuth.cadastro(email, senha);
        }

        closeModal();
      } catch (err) {
        console.error(err);
        els.error.textContent =
          err.message || "Erro ao autenticar. Tente novamente.";
      }
    };

    // -------------------------------------------------------
    // BOTÕES ENTRAR / CONTA
    // -------------------------------------------------------
    els.btnAuthToggles.forEach((btn) => {
      btn.onclick = () => {
        dbg("🟢 Clique Entrar/Conta");
        openModal();
      };
    });

    // -------------------------------------------------------
    // LOGOUT
    // -------------------------------------------------------
    if (els.btnLogout) {
      els.btnLogout.onclick = async () => {
        dbg("🔴 Logout solicitado");
        try {
          await window.lioraAuth.logout();
          window.lioraSetPlan("free");
        } catch (e) {
          console.error("Erro no logout:", e);
        }
      };
    }

    // -------------------------------------------------------
    // FECHAR MODAL
    // -------------------------------------------------------
    if (els.close) els.close.onclick = closeModal;
    els.modal.onclick = (e) => {
      if (e.target === els.modal) closeModal();
    };

    // -------------------------------------------------------
    // UI GLOBAL
    // -------------------------------------------------------
    function updateAuthUI(user) {
      dbg("🎨 updateAuthUI", user);

      const logged = !!user;
      const plan = window.lioraUserPlan || "free";

      els.btnAuthToggles.forEach(
        (btn) => (btn.textContent = logged ? "Conta" : "Entrar")
      );

      if (els.premiumBadge) {
        els.premiumBadge.textContent =
          plan === "premium"
            ? "Liora+ ativo"
            : "Versão gratuita";
      }

      if (logged) {
        els.userName.textContent = user.email.split("@")[0];
        els.userStatus.textContent =
          plan === "premium" ? "Liora+ ativo" : "Conta gratuita";
      }

      els.userInfo.classList.toggle("hidden", !logged);
      els.btnLogout?.classList.toggle("hidden", !logged);
    }

    // -------------------------------------------------------
    // ANTI-LOOP PLANO
    // -------------------------------------------------------
    window.lioraSetPlan = function (newPlan) {
      const prev = window.lioraUserPlan || "free";
      const next = newPlan || "free";
      if (prev === next) return;

      dbg("📝 SetPlan:", next);
      window.lioraUserPlan = next;

      window.dispatchEvent(
        new CustomEvent("liora:plan-changed", { detail: { plan: next } })
      );
    };

    // -------------------------------------------------------
    // EVENTOS GLOBAIS
    // -------------------------------------------------------
    window.addEventListener("liora:auth-changed", () => {
      const user = currentUser();
      dbg("🌀 auth-changed", user);
      updateAuthUI(user);
    });

    // -------------------------------------------------------
    // INIT
    // -------------------------------------------------------
    applyMode();
    updateAuthUI(currentUser());
    dbg("🚀 Auth UI pronto");
  });
})();
