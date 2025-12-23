// ==========================================================
// 🔁 LIORA — AUTH STATE SYNC (FINAL · ESTÁVEL)
// ==========================================================
(function () {

  function updateUI() {
    const auth = window.lioraAuth;
    if (!auth) {
      console.warn("⚠️ Auth Sync: lioraAuth indisponível");
      return;
    }

    const user = auth.user;

    const btnEntrar = document.getElementById("btn-auth-toggle");
    const btnSair = document.getElementById("btn-logout");
    const userInfo = document.getElementById("liora-user-info");
    const userName = document.getElementById("liora-user-name");
    const userStatus = document.getElementById("liora-user-status");

    if (!btnEntrar || !btnSair) {
      console.warn("⚠️ Auth Sync: botões não encontrados");
      return;
    }

    if (user) {
      btnEntrar.classList.add("hidden");
      btnSair.classList.remove("hidden");

      if (userInfo) userInfo.classList.remove("hidden");
      if (userName) userName.textContent = user.email?.split("@")[0] || "Usuário";
      if (userStatus) userStatus.textContent = "Conta gratuita";

      console.log("👤 UI sincronizada → LOGADO:", user.email);
    } else {
      btnEntrar.classList.remove("hidden");
      btnSair.classList.add("hidden");

      if (userInfo) userInfo.classList.add("hidden");

      console.log("👤 UI sincronizada → DESLOGADO");
    }
  }

  function bindLogout() {
    const btnSair = document.getElementById("btn-logout");
    if (!btnSair || btnSair.dataset.bound === "1") return;

    btnSair.dataset.bound = "1";

    btnSair.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("🚪 Logout solicitado");

      try {
        await window.lioraAuth.logout();
      } catch (err) {
        console.error("❌ Erro no logout:", err);
      }
    });
  }

  // 🔔 Evento principal
  window.addEventListener("liora:auth-changed", () => {
    updateUI();
    bindLogout();
  });

  // 🧠 Bootstrap seguro: espera o auth existir
  document.addEventListener("DOMContentLoaded", () => {
    const iv = setInterval(() => {
      if (window.lioraAuth) {
        clearInterval(iv);
        updateUI();
        bindLogout();
      }
    }, 30);
  });

})();
