// ==========================================================
// 🔐 LIORA — AUTH UI v11 (STABLE)
// - Login OK
// - Criar conta OK
// - Anti-loop
// - Compatível com Core v78+
// ==========================================================

(function () {
  console.log("🔐 Liora Auth UI v11 carregado...");

  window.lioraDebug = true;
  const dbg = (...a) => window.lioraDebug && console.log("🐞[LioraAuthUI]", ...a);

  document.addEventListener("DOMContentLoaded", () => {
    dbg("📦 DOM pronto");

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
      submitText: document.querySelector("#liora-auth-submit .liora-btn-text"),

      toggleMode: document.getElementById("liora-auth-toggle-mode"),

      btnAuthToggles: document.querySelectorAll("#btn-auth-toggle"),
      btnLogout: document.getElementById("btn-logout"),

      userInfo: document.getElementById("liora-user-info"),
      userName: document.getElementById("liora-user-name"),
      userStatus: document.getElementById("liora-user-status"),

      premiumBadge: document.getElementById("liora-premium-badge")
    };

    if (!els.form) {
      console.warn("⚠️ Auth UI: elementos não encontrados");
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
    // MODO LOGIN / SIGNUP
    // -------------------------------------------------------
    function applyMode() {
      dbg("🎛️ applyMode:", mode);

      els.error.textContent = "";

      if (mode === "login") {
        els.title.textContent = "Acesse sua conta";
        els.subtitle.textContent = "Entre para continuar seus estudos";
        els.submitText.textContent = "Entrar";
        els.toggleMode.innerHTML = `Não tem conta? <strong>Criar conta</strong>`;
      } else {
        els.title.textContent = "Criar conta";
        els.subtitle.textContent = "Crie sua conta gratuita na Liora";
        els.submitText.textContent = "Criar conta";
        els.toggleMode.innerHTML = `Já tem conta? <strong>Entrar</strong>`;
      }
    }

    function setMode(m) {
      mode = m === "signup" ? "signup" : "login";
      applyMode();
    }

    els.toggleMode.onclick = () => {
      setMode(mode === "login" ? "signup" : "login");
    };

    // -------------------------------------------------------
    // SUBMIT (LOGIN / SIGNUP)
    // -------------------------------------------------------
    els.form.onsubmit = async (e) => {
      e.preventDefault();

      const email = els.email.value.trim();
      const senha = els.senha.value;

      if (!email || !senha) {
        els.error.textContent = "Informe email e senha.";
        return;
      }

      els.error.textContent = "";

      try {
        if (mode === "signup") {
          dbg("🆕 Criando conta...");
          await window.lioraAuth.signup(email, senha);
        } else {
          dbg("🔐 Fazendo login...");
          await window.lioraAuth.login(email, senha);
        }
      } catch (err) {
        console.error("❌ Auth erro:", err);
        els.error.textContent =
          err?.message?.replace("Firebase:", "").trim() ||
          "Erro ao autenticar.";
      }
    };

    // -------------------------------------------------------
    // UI GLOBAL
    // -------------------------------------------------------
    function updateAuthUI(user) {
      const logged = !!user;
      const plan = window.lioraUserPlan || "free";

      els.btnAuthToggles.forEach((b) => {
        if (b) b.textContent = logged ? "Conta" : "Entrar";
      });

      if (els.userInfo) els.userInfo.classList.toggle("hidden", !logged);
      if (els.btnLogout) els.btnLogout.classList.toggle("hidden", !logged);

      if (logged) {
        els.userName.textContent = user.email.split("@")[0];
        els.userStatus.textContent =
          plan === "premium" ? "Liora+ ativo" : "Conta gratuita";
      }

      if (els.premiumBadge) {
        els.premiumBadge.textContent =
          plan === "premium"
            ? "Liora+ ativo — recursos liberados"
            : "Versão gratuita";
      }
    }

    // -------------------------------------------------------
    // SYNC PLANO (SEM LOOP)
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
        window.lioraSetPlan(json?.plano || "free");
      } catch {
        window.lioraSetPlan("free");
      }
    }

    // -------------------------------------------------------
    // EVENTOS
    // -------------------------------------------------------
    window.addEventListener("liora:auth-changed", () => {
      const user = currentUser();
      dbg("🌀 auth-changed:", user);
      updateAuthUI(user);
      syncPlano(user);
    });

    // -------------------------------------------------------
    // PLANO GLOBAL (ANTI-LOOP)
    // -------------------------------------------------------
    window.lioraSetPlan = function (plan) {
      const prev = window.lioraUserPlan || "free";
      const next = plan || "free";
      if (prev === next) return;
      window.lioraUserPlan = next;
      window.dispatchEvent(
        new CustomEvent("liora:plan-changed", { detail: { plan: next } })
      );
    };

    // -------------------------------------------------------
    // INIT
    // -------------------------------------------------------
    applyMode();
    updateAuthUI(currentUser());
    dbg("🚀 Auth UI v11 pronto");
  });
})();
