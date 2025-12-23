// ==========================================================
// 🔁 LIORA — AUTH STATE SYNC (CANÔNICO)
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

      console.log("👤 UI atualizada → logado:", user.email);

    } else {
      // 🔓 DESLOGADO
      btnEntrar.classList.remove("hidden");
      btnSair.classList.add("hidden");

      if (userInfo) userInfo.classList.add("hidden");

      console.log("👤 UI atualizada → deslogado");
    }
  }

  // escuta evento canônico
  window.addEventListener("liora:auth-changed", updateUI);

  // fallback defensivo (caso auth já tenha resolvido)
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(updateUI, 0);
  });

})();
