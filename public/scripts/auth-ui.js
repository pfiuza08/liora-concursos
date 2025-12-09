// ============================================================
// LIORA — AUTH UI v1 (Login + Cadastro + Premium Modals)
// - Abre/fecha modal de login
// - Alterna login/cadastro
// - Mostra erros e loading
// - Atualiza botão topo (Entrar / Minha Conta)
// - Abre modal premium quando recurso for bloqueado
// ============================================================
(function () {
  console.log("🧩 Liora Auth UI v1 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    const btnAuthToggle = document.getElementById("btn-auth-toggle");

    const authModal = document.getElementById("liora-auth-modal");
    const authClose = document.getElementById("liora-auth-close");
    const authForm = document.getElementById("liora-auth-form");
    const authEmail = document.getElementById("auth-email");
    const authSenha = document.getElementById("auth-senha");
    const authError = document.getElementById("liora-auth-error");
    const authSubmit = document.getElementById("liora-auth-submit");
    const authSubmitText = authSubmit?.querySelector(".liora-btn-text");
    const authToggleMode = document.getElementById("liora-auth-toggle-mode");
    const authTitle = document.getElementById("liora-auth-title");
    const authSubtitle = document.getElementById("liora-auth-subtitle");

    const premiumModal = document.getElementById("liora-premium-modal");
    const premiumClose = document.getElementById("liora-premium-close");
    const premiumCta = document.getElementById("liora-premium-cta");

    if (!window.lioraAuth) {
      console.warn("⚠️ lioraAuth não encontrado. Certifique-se de carregar auth.js antes de auth-ui.js");
      return;
    }

    let modo = "login"; // "login" ou "cadastro"

    // --------------------------------------------------------
    // Helpers
    // --------------------------------------------------------
    function abrirModal(modal) {
      if (!modal) return;
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function fecharModal(modal) {
      if (!modal) return;
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
    }
    
       function setModo(novoModo) {
      modo = novoModo;
    
      if (modo === "login") {
        authTitle.textContent = "Acessar sua conta";
        authSubtitle.textContent = "Acompanhe seus planos e seu progresso em qualquer dispositivo.";
        authSubmitText.textContent = "Entrar";
        authToggleMode.textContent = "Ainda não tenho conta. Criar conta.";
        authSenha.setAttribute("autocomplete", "current-password");
      } else {
        authTitle.textContent = "Criar sua conta";
        authSubtitle.textContent = "Comece a organizar seus estudos em minutos.";
        authSubmitText.textContent = "Criar conta";
        authToggleMode.textContent = "Já tenho conta. Entrar.";
        authSenha.setAttribute("autocomplete", "new-password");
      }
    
      authError.textContent = "";
    }


    function atualizarBotaoTopo() {
      const { user, premium } = window.lioraAuth;

      if (!btnAuthToggle) return;

      if (!user) {
        btnAuthToggle.innerHTML = "Entrar";
        return;
      }

      const nome = user.displayName || (user.email ? user.email.split("@")[0] : "Minha conta");

      btnAuthToggle.innerHTML = `
        <span class="liora-auth-btn-avatar"></span>
        <span>${nome}</span>
        ${premium ? "<span class='liora-pill' style='margin-left:4px;'>Liora+</span>" : ""}
      `;
    }

    function syncLoadingState() {
      if (!authSubmit) return;
      if (window.lioraAuth.loading) {
        authSubmit.classList.add("is-loading");
        authSubmit.disabled = true;
      } else {
        authSubmit.classList.remove("is-loading");
        authSubmit.disabled = false;
      }

      if (authError && window.lioraAuth.error) {
        authError.textContent = window.lioraAuth.error;
      } else if (authError && !window.lioraAuth.error) {
        authError.textContent = "";
      }
    }

    // --------------------------------------------------------
    // Abertura/Fechamento de modais
    // --------------------------------------------------------
    function abrirLogin(prefModo = "login") {
      setModo(prefModo);
      authEmail.value = "";
      authSenha.value = "";
      authError.textContent = "";
      abrirModal(authModal);
      authEmail.focus();
    }

    function abrirPremium() {
      abrirModal(premiumModal);
    }

    // Expor globalmente para outros módulos se precisarem
    window.abrirLogin = abrirLogin;
    window.abrirPremium = abrirPremium;

    // Botão topo
    btnAuthToggle?.addEventListener("click", () => {
      const { user } = window.lioraAuth;
      if (!user) {
        abrirLogin("login");
      } else {
        // Poderíamos abrir um dropdown de perfil.
        // Por enquanto, abre modal premium se ainda não for premium.
        if (!window.lioraAuth.premium) {
          abrirPremium();
        }
      }
    });

    // Botões fechar
    authClose?.addEventListener("click", () => fecharModal(authModal));
    premiumClose?.addEventListener("click", () => fecharModal(premiumModal));

    // Clique no backdrop fecha modal
    authModal?.addEventListener("click", (e) => {
      if (e.target === authModal) fecharModal(authModal);
    });
    premiumModal?.addEventListener("click", (e) => {
      if (e.target === premiumModal) fecharModal(premiumModal);
    });

    // ESC fecha modais
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        fecharModal(authModal);
        fecharModal(premiumModal);
      }
    });

    // Alternar entre login/cadastro
    authToggleMode?.addEventListener("click", () => {
      setModo(modo === "login" ? "cadastro" : "login");
    });

    // Submit do formulário
    authForm?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = authEmail.value.trim();
      const senha = authSenha.value.trim();

      if (!email || !senha) {
        authError.textContent = "Preencha e-mail e senha.";
        return;
      }

      try {
        window.lioraAuth.error = null;
        window.lioraAuth.loading = true;
        syncLoadingState();

        if (modo === "login") {
          await window.lioraAuth.login(email, senha);
        } else {
          await window.lioraAuth.cadastro(email, senha);
        }

        // Sucesso → fecha modal
        fecharModal(authModal);
      } catch (err) {
        // Erro já tratado em lioraAuth.error
        console.warn("Erro ao autenticar:", err);
      } finally {
        window.lioraAuth.loading = false;
        syncLoadingState();
        atualizarBotaoTopo();
      }
    });

    // CTA Premium → aqui você aponta para Hotmart/Pagamento
    premiumCta?.addEventListener("click", () => {
      // TODO: ajustar URL de pagamento/Hotmart
      window.open("https://sualandinglidoliora.com/pagamento", "_blank");
    });

    // --------------------------------------------------------
    // Eventos globais vindos de auth.js
    // --------------------------------------------------------
    window.addEventListener("liora:auth-changed", () => {
      atualizarBotaoTopo();
    });

    window.addEventListener("liora:auth-ui-update", () => {
      syncLoadingState();
    });

    // Quando exigirPremium detectar login ausente
    window.addEventListener("liora:login-required", () => {
      abrirLogin("login");
    });

    // Quando exigirPremium detectar usuário FREE
    window.addEventListener("liora:premium-bloqueado", () => {
      abrirPremium();
    });

    // Inicializa estado
    atualizarBotaoTopo();
    syncLoadingState();
  });
})();
