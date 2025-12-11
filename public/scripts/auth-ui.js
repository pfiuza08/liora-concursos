// ==========================================================
// 🧠 LIORA — AUTH UI v3 (Commercial Ready)
// - Integra com window.lioraAuth (Firebase)
// - Modal de login/cadastro (black glass)
// - Pós-login inteligente: vai para estudo ativo se existir
// - Mostra nome do usuário no topo + botão Sair
// - Bloqueia Simulados e Dashboard para não logados
// - Não quebra módulos existentes (nav-home, core, premium…)
// ==========================================================

(function () {
  console.log("🔐 Liora Auth UI v3 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------
    // ELEMENTOS
    // -------------------------------------------------------
    const els = {
      // Modal black-glass de login/cadastro
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

      // Botões "Entrar" (pode haver mais de um com o mesmo ID)
      btnAuthToggles: document.querySelectorAll("#btn-auth-toggle"),

      // Botão Sair (header)
      btnLogout: document.getElementById("btn-logout"),

      // Info do usuário no topo
      userInfo: document.getElementById("liora-user-info"),
      userName: document.getElementById("liora-user-name"),
      userStatus: document.getElementById("liora-user-status"),

      // Ações da home que queremos proteger
      homeSimulados: document.getElementById("home-simulados"),
      homeDashboard: document.getElementById("home-dashboard")
    };

    // Pode existir o login antigo: mantemos escondido
    const legacyLogin = document.getElementById("liora-login-backdrop");
    if (legacyLogin) {
      legacyLogin.classList.add("hidden");
    }

    // -------------------------------------------------------
    // ESTADO
    // -------------------------------------------------------
    let mode = "login"; // "login" | "signup"

    function getUser() {
      return (window.lioraAuth && window.lioraAuth.user) || null;
    }

    // -------------------------------------------------------
    // UI DO MODAL — MODO LOGIN / CADASTRO
    // -------------------------------------------------------
    function applyMode() {
      if (!els.authTitle || !els.authSubtitle || !els.authSubmit || !els.authToggleMode) return;

      if (mode === "login") {
        els.authTitle.textContent = "Acesse sua conta";
        els.authSubtitle.textContent =
          "Use seu e-mail para acessar seus planos de estudo e simulados.";
        els.authSubmit.querySelector(".liora-btn-text").textContent = "Entrar";
        els.authToggleMode.textContent = "Ainda não tenho conta. Criar conta.";
      } else {
        els.authTitle.textContent = "Criar conta Liora";
        els.authSubtitle.textContent =
          "Leva poucos segundos: informe seu e-mail e defina uma senha segura.";
        els.authSubmit.querySelector(".liora-btn-text").textContent = "Criar conta";
        els.authToggleMode.textContent = "Já tenho conta. Fazer login.";
      }
    }

    function setMode(newMode) {
      mode = newMode === "signup" ? "signup" : "login";
      applyMode();
      clearError();
    }

    // -------------------------------------------------------
    // ABRIR / FECHAR MODAL
    // -------------------------------------------------------
    function openAuthModal(initialMode) {
      if (!els.authModal) return;

      if (initialMode) {
        setMode(initialMode);
      } else {
        setMode("login");
      }

      els.authModal.classList.add("is-open");
      els.authModal.setAttribute("aria-hidden", "false");

      // Ajuste de acessibilidade: foco no e-mail
      setTimeout(() => {
        els.authEmail && els.authEmail.focus();
      }, 50);
    }

    function closeAuthModal() {
      if (!els.authModal) return;

      els.authModal.classList.remove("is-open");
      els.authModal.setAttribute("aria-hidden", "true");

      if (els.authForm) {
        els.authForm.reset();
      }
      clearError();
      setLoading(false);
    }

    // -------------------------------------------------------
    // LOADING
    // -------------------------------------------------------
    function setLoading(isLoading) {
      if (!els.authSubmit) return;

      if (isLoading) {
        els.authSubmit.classList.add("is-loading");
        els.authSubmit.disabled = true;
        if (els.authEmail) els.authEmail.disabled = true;
        if (els.authSenha) els.authSenha.disabled = true;
      } else {
        els.authSubmit.classList.remove("is-loading");
        els.authSubmit.disabled = false;
        if (els.authEmail) els.authEmail.disabled = false;
        if (els.authSenha) els.authSenha.disabled = false;
      }
    }

    // -------------------------------------------------------
    // ERROS
    // -------------------------------------------------------
    function showError(msg) {
      if (!els.authError) return;
      els.authError.textContent = msg || "";
    }

    function clearError() {
      if (!els.authError) return;
      els.authError.textContent = "";
    }

    function traduzErroFirebase(err) {
      if (!err || !err.code) return "Não foi possível concluir a operação. Tente novamente.";

      switch (err.code) {
        case "auth/invalid-email":
          return "O e-mail informado não é válido.";
        case "auth/user-not-found":
        case "auth/wrong-password":
          return "E-mail ou senha incorretos.";
        case "auth/weak-password":
          return "A senha é muito fraca. Use pelo menos 6 caracteres.";
        case "auth/email-already-in-use":
          return "Este e-mail já está em uso. Tente fazer login.";
        case "auth/too-many-requests":
          return "Muitas tentativas. Aguarde um pouco e tente novamente.";
        default:
          return "Algo deu errado com a autenticação. Tente novamente.";
      }
    }

    // -------------------------------------------------------
    // UI DO HEADER / HOME QUANDO LOGA / DESLOGA
    // -------------------------------------------------------
    function updateAuthUI(user) {
      const isLogged = !!user;

      // Atualiza botões "Entrar"
      els.btnAuthToggles.forEach((btn) => {
        if (!btn) return;
        if (isLogged) {
          btn.textContent = "Conta";
        } else {
          btn.textContent = "Entrar";
        }
      });

      // Botão Sair + info do usuário no topo
      if (els.btnLogout) {
        els.btnLogout.classList.toggle("hidden", !isLogged);
      }
      if (els.userInfo) {
        els.userInfo.classList.toggle("hidden", !isLogged);
      }

      if (isLogged && els.userName && els.userStatus) {
        const nome = user.displayName || user.email || "Usuário";
        els.userName.textContent = nome;

      // Leitura do status real vinda do backend/fake backend
        const plan = window.lioraUserPlan || "free";
        
        const labels = {
          free: "Conta gratuita",
          premium: "Liora+ ativo",
          plus: "Liora Plus — acesso total"
        };

els.userStatus.textContent = labels[plan] || "Conta gratuita";

      }
    }

    // -------------------------------------------------------
    // PÓS-LOGIN INTELIGENTE (OPÇÃO 3)
    // → Se tiver estudo ativo: vai para o estudo
    // → Caso contrário: volta para a Home
    // -------------------------------------------------------
    function navegarPosLogin() {
      const estudos = window.lioraEstudos || null;
      let temPlanoAtivo = false;

      try {
        if (estudos) {
          if (typeof estudos.temPlanoAtivo === "function") {
            temPlanoAtivo = !!estudos.temPlanoAtivo();
          } else if (typeof estudos.listarRecentes === "function") {
            const rec = estudos.listarRecentes(1);
            temPlanoAtivo = Array.isArray(rec) && rec.length > 0;
          }
        }
      } catch (e) {
        console.warn("⚠️ Erro checando plano ativo:", e);
      }

      if (temPlanoAtivo) {
        try {
          if (estudos && typeof estudos.abrirUltimoPlano === "function") {
            estudos.abrirUltimoPlano();
            return;
          }
          if (window.homeEstudoAtual) {
            window.homeEstudoAtual();
            return;
          }
        } catch (e) {
          console.warn("⚠️ Erro ao abrir estudo ativo:", e);
        }
      }

      // Fallback: vai para home
      try {
        if (window.homeInicio) {
          window.homeInicio();
        } else {
          const home = document.getElementById("liora-home");
          if (home) home.scrollIntoView({ behavior: "smooth" });
        }
      } catch (e) {
        console.warn("⚠️ Erro ao navegar para home:", e);
      }
    }

    // -------------------------------------------------------
    // SUBMIT DO FORM (LOGIN / CADASTRO)
    // -------------------------------------------------------
    if (els.authForm) {
      els.authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();

        const email = els.authEmail ? els.authEmail.value.trim() : "";
        const senha = els.authSenha ? els.authSenha.value : "";

        if (!email || !senha) {
          showError("Preencha e-mail e senha.");
          return;
        }

        if (!window.lioraAuth) {
          showError("Sistema de autenticação não disponível.");
          return;
        }

        setLoading(true);

        try {
          let userCred;

          if (mode === "login") {
            userCred = await window.lioraAuth.login(email, senha);
          } else {
            userCred = await window.lioraAuth.cadastro(email, senha);
          }

          const user = userCred || getUser();

          closeAuthModal();
          navegarPosLogin();

          // O onAuthStateChanged em auth.js vai disparar o updateAuthUI
          console.log("✅ Auth OK:", user && user.email);
        } catch (err) {
          console.error("❌ Erro auth:", err);
          showError(traduzErroFirebase(err));
        } finally {
          setLoading(false);
        }
      });
    }

    // -------------------------------------------------------
    // TOGGLE LOGIN / CADASTRO
    // -------------------------------------------------------
    if (els.authToggleMode) {
      els.authToggleMode.addEventListener("click", () => {
        setMode(mode === "login" ? "signup" : "login");
      });
    }

    // -------------------------------------------------------
    // ABERTURA DO MODAL PELOS BOTÕES "ENTRAR"
    // -------------------------------------------------------
    els.btnAuthToggles.forEach((btn) => {
      if (!btn) return;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const user = getUser();
        if (user) {
          // Já logado: poderíamos abrir um "gerenciar conta" no futuro.
          // Por enquanto, apenas mostra o modal em modo login.
          openAuthModal("login");
        } else {
          openAuthModal("login");
        }
      });
    });

    // -------------------------------------------------------
    // BOTÃO SAIR (LOGOUT)
    // -------------------------------------------------------
    if (els.btnLogout) {
      els.btnLogout.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!window.lioraAuth || !window.lioraAuth.logout) return;

        try {
          await window.lioraAuth.logout();
          console.log("👋 Usuário desconectado.");
          navegarPosLogin();
        } catch (err) {
          console.error("❌ Erro ao sair:", err);
        }
      });
    }

    // -------------------------------------------------------
    // FECHAR MODAL (X + clique fora)
    // -------------------------------------------------------
    if (els.authClose) {
      els.authClose.addEventListener("click", (e) => {
        e.preventDefault();
        closeAuthModal();
      });
    }

    if (els.authModal) {
      els.authModal.addEventListener("click", (e) => {
        if (e.target === els.authModal) {
          closeAuthModal();
        }
      });
    }

    // -------------------------------------------------------
    // BLOQUEIO DE RECURSOS PREMIUM QUANDO NÃO LOGADO
    // - Simulados
    // - Dashboard
    // Usamos captura para interceptar antes do nav-home.js
    // -------------------------------------------------------
    function protegerBotaoPremium(btn) {
      if (!btn) return;
      btn.addEventListener(
        "click",
        (e) => {
          const user = getUser();
          if (!user) {
            e.preventDefault();
            e.stopImmediatePropagation();
            openAuthModal("signup");
          }
        },
        true // captura
      );
    }

    protegerBotaoPremium(els.homeSimulados);
    protegerBotaoPremium(els.homeDashboard);

    // -------------------------------------------------------
    // REAÇÃO AO onAuthStateChanged (auth.js)
    // -------------------------------------------------------
    window.addEventListener("liora:auth-changed", () => {
      const user = getUser();
      updateAuthUI(user);
    });

    // Chamada inicial (caso o Firebase já tenha restaurado a sessão)
    updateAuthUI(getUser());
    applyMode();

    console.log("🟢 Liora Auth UI v3 inicializado.");
  });
  // --------------------------------------------------------
  // 🔥 Função Universal: Atualizar plano do usuário (free/premium/etc.)
  // --------------------------------------------------------
  window.lioraSetPlan = function (newPlan) {
    window.lioraUserPlan = newPlan || "free";
  
    // Dispara evento global para atualizar UI automaticamente
    const evt = new Event("liora:auth-changed");
    window.dispatchEvent(evt);
  };
 
})();
