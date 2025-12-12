// ==========================================================
// 🧠 LIORA — AUTH UI v10 (ESTÁVEL + DEBUG + PREMIUM REAL)
// ==========================================================

(function () {
  console.log("🔐 Liora Auth UI v10 carregado...");

  // -------------------------------------------------------
  // 🐞 DEBUG
  // -------------------------------------------------------
  window.lioraDebug = true;
  function dbg(...args) {
    if (window.lioraDebug) {
      console.log("🐞[LioraDebug]", ...args);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    dbg("📦 DOM pronto");

    // -------------------------------------------------------
    // ELEMENTOS
    // -------------------------------------------------------
    const els = {
      authModal: document.getElementById("liora-auth-modal"),
      authTitle: document.getElementById("liora-auth-title"),
      authForm: document.getElementById("liora-auth-form"),
      authEmail: document.getElementById("auth-email"),
      authSenha: document.getElementById("auth-senha"),
      authSubmit: document.getElementById("liora-auth-submit"),

      btnAuthToggles: document.querySelectorAll("#btn-auth-toggle"),
      btnLogout: document.getElementById("btn-logout"),

      userInfo: document.getElementById("liora-user-info"),
      userName: document.getElementById("liora-user-name"),
      userStatus: document.getElementById("liora-user-status"),
      premiumBadge: document.getElementById("liora-premium-badge"),
    };

    function currentUser() {
      return window.lioraAuth?.user || null;
    }

    // -------------------------------------------------------
    // UI
    // -------------------------------------------------------
    function updateAuthUI(user) {
      const logged = !!user;
      const plan = window.lioraUserPlan || "free";

      dbg("🎨 updateAuthUI()", { logged, plan });

      els.btnAuthToggles.forEach(btn => {
        btn.textContent = logged ? "Conta" : "Entrar";
      });

      if (logged) {
        els.userName.textContent = user.email.split("@")[0];
        els.userStatus.textContent =
          plan === "premium" ? "Liora+ ativo" : "Conta gratuita";
      }

      if (els.premiumBadge) {
        els.premiumBadge.textContent =
          plan === "premium"
            ? "Liora+ ativo — recursos liberados"
            : "Versão gratuita — recursos limitados";
      }

      els.userInfo?.classList.toggle("hidden", !logged);
      els.btnLogout?.classList.toggle("hidden", !logged);

      document.body.classList.toggle("liora-premium-on", plan === "premium");
      document.body.classList.toggle("liora-premium-off", plan !== "premium");
    }

    // -------------------------------------------------------
    // 🔄 SYNC PLANO (SÓ BUSCA, NÃO EMITE EVENTOS)
    // -------------------------------------------------------
    async function syncPlano(user) {
      dbg("🔄 syncPlano()", user);

      if (!user) {
        dbg("➡️ Sem usuário → plano FREE");
        setPlan("free");
        return;
      }

      try {
        const token = await user.getIdToken();
        dbg("🔑 Token obtido");

        const res = await fetch("/api/plano", {
          headers: { Authorization: `Bearer ${token}` }
        });

        dbg("🌐 HTTP", res.status);

        if (!res.ok) {
          dbg("❌ HTTP inválido");
          setPlan("free");
          return;
        }

        const json = await res.json();
        dbg("📦 JSON plano", json);

        setPlan(json.plano);

      } catch (err) {
        dbg("❌ Erro syncPlano", err);
        setPlan("free");
      }
    }

    // -------------------------------------------------------
    // 🌟 PLANO — FONTE ÚNICA (ANTI LOOP)
    // -------------------------------------------------------
    function setPlan(newPlan) {
      const prev = window.lioraUserPlan || "free";
      const next = newPlan || "free";

      if (prev === next) {
        dbg("🛑 Plano inalterado:", next);
        return;
      }

      dbg("📝 Plano alterado:", prev, "→", next);
      window.lioraUserPlan = next;

      window.dispatchEvent(
        new CustomEvent("liora:plan-changed", {
          detail: { plan: next }
        })
      );
    }

    // -------------------------------------------------------
    // 🔥 AUTH CHANGED (SÓ AUTH)
    // -------------------------------------------------------
    window.addEventListener("liora:auth-changed", () => {
      const user = currentUser();
      dbg("🌀 auth-changed", user);

      updateAuthUI(user);
      syncPlano(user);
    });

    // -------------------------------------------------------
    // 🔔 PLAN CHANGED (SÓ UI)
    // -------------------------------------------------------
    window.addEventListener("liora:plan-changed", (e) => {
      dbg("🔔 plan-changed", e.detail);
      updateAuthUI(currentUser());
    });

    // -------------------------------------------------------
    // LOGOUT
    // -------------------------------------------------------
    els.btnLogout?.addEventListener("click", async () => {
      dbg("🚪 Logout");
      await window.lioraAuth.logout();
    });

    // -------------------------------------------------------
    // INIT
    // -------------------------------------------------------
    dbg("🚀 Init final");
    updateAuthUI(currentUser());
  });
})();
