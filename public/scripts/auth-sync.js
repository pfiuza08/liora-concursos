// ==========================================================
// 🔁 LIORA — AUTH STATE SYNC (FINAL)
// ==========================================================
(function () {

  function updateUI() {
    const user = window.lioraAuth?.user;

    const btnEntrar = document.getElementById("btn-auth-toggle");
    const btnSair = document.getElementById("btn-logout");
    const userInfo = document.getElementById("liora-user-info");
    const userName = document.getElementById("liora-user-name");
    const userStatus = document.getElementById("liora-user-status");

    if (!btnEntrar || !btnSair) return;

    if (user) {
      // 🔐 LOGADO
      btnEntrar.classList.add("hidden");
      btnSair.classList.remove("hidden");

      if (userInfo) userInfo.classList.remove("hidden");
      if (userName) userName.textContent = user.email.split("@")[0];
      if (userStatus) userStatus.textContent = "Conta gratuita";

      console.log("👤 UI → logado:", user.email);

    } else {
      // 🔓 DESLOGADO
      btnEntrar.classList.remove("hidden");
      btnSair.classList.add("hidden");

      if (userInfo) userInfo.classList.add("hidden");

      console.log("👤 UI → deslogado");
    }
  }

  // -------------------------------
  // LOGOUT (CANÔNICO)
  // -------------------------------
  function bindLogout() {
    const btnSair = document.getElementById("btn-logout");
    if (!btnSair || btnSair.dataset.bound === "1") return;

    btnSair.dataset.bound = "1";

    btnSair.addEventListener("click", async (e) => {
      e.preventDefault();

      console.log("🚪 Logout solicitado");

      try {
        await window.lioraAuth.logout();
        // o onAuthStateChanged cuidará do resto
      } catch (err) {
        console.error("❌ Erro no logout:", err);
      }
    });
  }

  // -------------------------------
  // EVENTOS
  // -------------------------------
  window.addEventListener("liora:auth-changed", () => {
    updateUI();
    bindLogout();
  });

  // fallback inicial
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      updateUI();
      bindLogout();
    }, 0);
  });

})();
