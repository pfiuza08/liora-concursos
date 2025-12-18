// ===============================================================
// 🟢 LIORA LOGIN — v3 (CANONICAL MODAL)
// - Controle 100% via lioraModal
// - Sem manipulação direta de classes
// - Compatível com Auth + Premium + Simulados
// ===============================================================

(function () {
  console.log("🔵 Liora Login v3 carregado…");

  document.addEventListener("DOMContentLoaded", () => {
    const modalId = "liora-auth-modal";

    const inpEmail = document.getElementById("login-email");
    const inpSenha = document.getElementById("login-senha");
    const btnLogin = document.getElementById("login-btn");
    const linkCriar = document.getElementById("login-criar");

    if (!window.lioraModal) {
      console.error("❌ lioraModal não encontrado. login.js abortado.");
      return;
    }

    // ---------------------------------------------------------
    // VALIDAÇÃO
    // ---------------------------------------------------------
    function validarCampos() {
      if (!inpEmail?.value.trim()) return "Informe seu e-mail.";
      if (!inpSenha?.value.trim()) return "Digite sua senha.";
      return null;
    }

    // ---------------------------------------------------------
    // API PÚBLICA (opcional, para outros módulos)
    // ---------------------------------------------------------
    window.lioraLogin = {
      open() {
        window.lioraModal.open(modalId);
      },
      close() {
        window.lioraModal.close(modalId);
      },
    };

    // ---------------------------------------------------------
    // LOGIN
    // ---------------------------------------------------------
    btnLogin?.addEventListener("click", async () => {
      const erro = validarCampos();
      if (erro) {
        alert(erro);
        return;
      }

      btnLogin.disabled = true;
      btnLogin.textContent = "Entrando…";

      try {
        // 🔥 Aqui entra Firebase/Auth real
        await new Promise((res) => setTimeout(res, 800));

        const user = {
          email: inpEmail.value.trim(),
          premium: false,
          dataLogin: Date.now(),
        };

        localStorage.setItem("liora_user", JSON.stringify(user));

        console.log("🟢 Login concluído:", user.email);

        // 🔔 eventos canônicos
        window.dispatchEvent(new Event("liora:user-login"));
        window.dispatchEvent(new Event("liora:auth-changed"));

        window.lioraModal.close(modalId);
      } catch (e) {
        console.error(e);
        alert("Falha ao fazer login. Tente novamente.");
      } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = "Entrar";
      }
    });

    // ---------------------------------------------------------
    // CADASTRO (placeholder)
    // ---------------------------------------------------------
    linkCriar?.addEventListener("click", () => {
      alert("Cadastro será habilitado em breve.");
    });

    // ---------------------------------------------------------
    // EVENTO GLOBAL (abre login de qualquer lugar)
    // ---------------------------------------------------------
    window.addEventListener("liora:login-required", () => {
      window.lioraModal.open(modalId);
    });

    console.log("🟢 Liora Login v3 pronto!");
  });
})();
