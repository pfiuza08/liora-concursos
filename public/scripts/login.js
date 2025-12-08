// ===============================================================
// 🟢 LIORA LOGIN — v2 (com validação, loading e status)
// ===============================================================

(function () {
  console.log("🔵 Liora Login v2 carregado…");

  document.addEventListener("DOMContentLoaded", () => {
    const backdrop = document.getElementById("liora-login-backdrop");
    const closeBtn = document.getElementById("liora-login-close");

    const inpEmail = document.getElementById("login-email");
    const inpSenha = document.getElementById("login-senha");
    const btnLogin = document.getElementById("login-btn");
    const linkCriar = document.getElementById("login-criar");

    if (!backdrop) {
      console.error("❌ ERRO: Login Modal não encontrado no DOM!");
      return;
    }

    // ---------------------------------------------------------
    // FUNÇÕES
    // ---------------------------------------------------------

    function openLoginModal() {
      console.log("🔐 Abrindo modal de login…");
      backdrop.classList.add("visible");
    }

    function closeLoginModal() {
      backdrop.classList.remove("visible");
    }

    // Expor globalmente
    window.lioraLogin = {
      openLoginModal,
      closeLoginModal,
    };

    // ---------------------------------------------------------
    // VALIDAÇÃO BÁSICA
    // ---------------------------------------------------------

    function validarCampos() {
      if (!inpEmail.value.trim()) return "Informe seu e-mail.";
      if (!inpSenha.value.trim()) return "Digite sua senha.";
      return null;
    }

    // ---------------------------------------------------------
    // LOGIN — (pode integrar Firebase depois)
    // ---------------------------------------------------------

    btnLogin.addEventListener("click", async () => {
      const erro = validarCampos();
      if (erro) {
        alert(erro);
        return;
      }

      btnLogin.disabled = true;
      btnLogin.textContent = "Entrando…";

      try {
        // 🔥 Aqui você pode plugar Firebase Auth ou API própria
        // Por enquanto, vamos simular sucesso:

        await new Promise((res) => setTimeout(res, 800));

        // Guarda no localStorage
        const user = {
          email: inpEmail.value.trim(),
          premium: false,
          dataLogin: Date.now(),
        };
        localStorage.setItem("liora_user", JSON.stringify(user));

        console.log("🟢 Login concluído:", user.email);

        closeLoginModal();

        // Evento global — premium.js ouvirá
        window.dispatchEvent(new Event("liora:user-login"));
      } catch (e) {
        alert("Falha ao fazer login. Tente novamente.");
      } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = "Entrar";
      }
    });

    // ---------------------------------------------------------
    // FECHAR
    // ---------------------------------------------------------

    closeBtn.addEventListener("click", closeLoginModal);
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) closeLoginModal();
    });

    linkCriar.addEventListener("click", () => {
      alert("Cadastro será habilitado na versão 2.0.");
    });

    console.log("🟢 Liora Login v2 pronto!");
  });
})();
