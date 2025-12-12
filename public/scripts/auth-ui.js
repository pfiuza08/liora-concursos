// ==========================================================
// 🧠 LIORA — AUTH UI v9 (DEBUG EDITION)
// ==========================================================

(function () {
  console.log("🔐 Liora Auth UI v9 DEBUG carregado...");

  // Função debug global
  window.lioraDebug = true;
  function dbg(...args) {
    if (window.lioraDebug) console.log("🐞[LioraDebug]", ...args);
  }

  document.addEventListener("DOMContentLoaded", () => {
    dbg("📦 DOM pronto, iniciando AUTH UI...");

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

    function currentUser() {
      return window.lioraAuth?.user || null;
    }

    // -------------------------------------------------------
    // MODO LOGIN/CADASTRO
    // -------------------------------------------------------
    let mode = "login";

    function applyMode() {
      dbg("Aplicando modo:", mode);

      if (mode === "login") {
        els.authTitle.textContent = "Acesse sua conta";
        els.authSubmit.querySelector(".liora-btn-text").textContent = "Entrar";
      } else {
        els.authTitle.textContent = "Criar conta";
        els.authSubmit.querySelector(".liora-btn-text").textContent = "Criar conta";
      }
    }

    function setMode(m) {
      mode = m === "signup" ? "signup" : "login";
      dbg("Modo alterado para:", mode);
      applyMode();
    }

    // -------------------------------------------------------
    // UI GLOBAL LOGIN + PLANO
    // -------------------------------------------------------
    function updateAuthUI(user) {
      dbg("Atualizando UI. User =", user);
      dbg("Plano atual =", window.lioraUserPlan);

      const logged = !!user;
      const plan = window.lioraUserPlan || "free";

      els.btnAuthToggles.forEach((btn) => btn.textContent = logged ? "Conta" : "Entrar");

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
    // 🔄 SYNC PLANO (debug total)
    // -------------------------------------------------------
    async function syncPlano(user) {
      dbg("🔄 syncPlano() iniciou. User =", user);

      if (!user) {
        dbg("Nenhum usuário → plano FREE");
        window.lioraSetPlan("free");
        return;
      }

      try {
        const token = await user.getIdToken();
        dbg("Token JWT:", token.substring(0, 15) + "...");

        const res = await fetch("/api/plano", {
          headers: { Authorization: `Bearer ${token}` }
        });

        dbg("HTTP status:", res.status);

        const raw = await res.text();
        dbg("Raw response:", raw);

        let json;
        try {
          json = JSON.parse(raw);
        } catch (e) {
          dbg("❌ JSON.parse falhou:", e);
          return window.lioraSetPlan("free");
        }

        dbg("JSON final:", json);

        window.lioraSetPlan(json.plano);

      } catch (err) {
        dbg("❌ Erro dentro de syncPlano:", err);
        window.lioraSetPlan("free");
      }
    }

    // -------------------------------------------------------
    // LISTENER AUTH
    // -------------------------------------------------------
      window.addEventListener("liora:auth-changed", () => {
      const user = currentUser();
      dbg("🌀 Evento auth-changed recebido. User =", user);
      updateAuthUI(user);
      syncPlano(user);
    });

    // -------------------------------------------------------
    // Função global do plano (sem loops!)
    // -------------------------------------------------------
       window.lioraSetPlan = function (newPlan) {
      const prev = window.lioraUserPlan || "free";
      const next = newPlan || "free";
    
      if (prev === next) return; // 🛑 trava anti-loop
    
      window.lioraUserPlan = next;
    
      window.dispatchEvent(
        new CustomEvent("liora:plan-changed", {
          detail: { plan: next }
        })
      );
    };

    // Inicialização
    dbg("Inicialização final → aplicando UI e modo inicial");
    updateAuthUI(currentUser());
    applyMode();
  });
})();
