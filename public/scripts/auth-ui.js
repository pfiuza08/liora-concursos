// =======================================================
// 🔐 LIORA AUTH UI — vFINAL-MODAL-CANONICAL
// - Login é MODAL FULLSCREEN (sobre a Home), não é "tela" do router
// - Defensivo: nunca chama addEventListener em null
// - Intercepta data-action="openAuth" para NÃO cair no ui-actions/router
// - Integra com Firebase Auth (window.lioraAuth.login/cadastro/resetPassword/logout)
// - Fecha modal ao autenticar com sucesso (via liora:auth-changed)
// =======================================================

(function () {
  // ----------------------------
  // State interno
  // ----------------------------
  let ready = false;
  let bound = false;
  let mode = "login"; // "login" | "signup"

  // ----------------------------
  // Utilitários
  // ----------------------------
  const $ = (id) => document.getElementById(id);

  function setText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function setHTML(el, html) {
    if (!el) return;
    el.innerHTML = html;
  }

  function showEl(el) {
    if (!el) return;
    el.classList.remove("hidden");
  }

  function hideEl(el) {
    if (!el) return;
    el.classList.add("hidden");
  }

  function isOpen() {
    const auth = $("liora-auth");
    return !!auth && auth.classList.contains("is-open");
  }

  function openAuth() {
    const auth = $("liora-auth");
    if (!auth) return;

    // modal on
    auth.classList.add("is-open");
    document.body.classList.add("liora-modal-open");

    // limpa erro sempre que abrir
    setError("");

    // foco amigável
    setTimeout(() => {
      $("auth-email")?.focus?.();
    }, 50);

    console.log("🔐 Auth UI: aberto (modal)");
  }

  function closeAuth() {
    const auth = $("liora-auth");
    if (!auth) return;

    auth.classList.remove("is-open");
    document.body.classList.remove("liora-modal-open");
    setError("");

    console.log("🔐 Auth UI: fechado (modal)");
  }

  function setError(msg) {
    const box = $("liora-auth-error");
    if (!box) return;
    box.textContent = msg || "";
  }

  function setLoading(loading, msg) {
    try {
      if (loading) {
        window.lioraLoading?.show?.(msg || "Autenticando...");
      } else {
        window.lioraLoading?.hide?.();
      }
    } catch (_) {}
  }

  function normalizeEmail(value) {
    return (value || "").trim();
  }

  function normalizePass(value) {
    return (value || "").trim();
  }

  // ----------------------------
  // UI: alternar modo login/cadastro
  // ----------------------------
  function applyMode() {
    const title = $("liora-auth-title");
    const toggle = $("liora-auth-toggle-mode");
    const submitBtn = $("liora-auth-submit") || $("liora-auth-form")?.querySelector?.('button[type="submit"]');
    const forgot = $("liora-auth-forgot");

    if (mode === "signup") {
      setText(title, "Criar conta");
      if (submitBtn) setText(submitBtn, "Criar conta");
      if (toggle) setText(toggle, "Já tenho conta");
      // em cadastro, “esqueci” não faz sentido
      if (forgot) hideEl(forgot);
    } else {
      setText(title, "Acessar Liora");
      if (submitBtn) setText(submitBtn, "OK");
      if (toggle) setText(toggle, "Criar conta");
      if (forgot) showEl(forgot);
    }

    setError("");
  }

  // ----------------------------
  // Bindings
  // ----------------------------
  function bindInterceptOpenAuth() {
    // Intercepta TODOS os cliques que pedem openAuth (captura antes do ui-actions)
    document.addEventListener(
      "click",
      (e) => {
        const target = e.target?.closest?.('[data-action="openAuth"], #btn-login');
        if (!target) return;

        // Cancela ui-actions/router
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        openAuth();
      },
      true // CAPTURE: antes do bubble onde ui-actions costuma atuar
    );
  }

  function bindTogglePassword() {
    const toggle = $("toggle-password");
    const input = $("auth-senha");

    if (!toggle || !input) {
      console.warn("🔐 Auth UI: toggle-password indisponível");
      return;
    }

    toggle.addEventListener("click", (e) => {
      e.preventDefault();

      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      toggle.textContent = hidden ? "🙈" : "👁️";
    });
  }

  function bindBackButton() {
    const btn = $("liora-auth-back");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      closeAuth();
    });
  }

  function bindToggleMode() {
    const btn = $("liora-auth-toggle-mode");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      mode = mode === "login" ? "signup" : "login";
      applyMode();
    });
  }

  function bindForgotPassword() {
    const btn = $("liora-auth-forgot");
    if (!btn) return;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const email = normalizeEmail($("auth-email")?.value);
      const promptEmail = email || prompt("Digite seu e-mail para recuperação:");
      if (!promptEmail) return;

      if (!window.lioraAuth?.resetPassword) {
        alert("Recuperação indisponível no momento.");
        return;
      }

      try {
        setLoading(true, "Enviando e-mail de redefinição...");
        await window.lioraAuth.resetPassword(promptEmail);
        alert("Se o e-mail existir, você receberá instruções.");
      } catch (err) {
        const msg = window.lioraAuth?.error || "Não foi possível enviar agora.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    });
  }

  function bindCloseOnEsc() {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!isOpen()) return;
      closeAuth();
    });
  }

  function bindBackdropClick() {
    // Clicar fora do card fecha, se você estiver usando overlay fullscreen
    const auth = $("liora-auth");
    if (!auth) return;

    auth.addEventListener("click", (e) => {
      // fecha apenas se clicou "no fundo", não dentro do card
      const card = auth.querySelector(".liora-card, .liora-modal-card");
      if (!card) return;

      const clickedInside = card.contains(e.target);
      if (!clickedInside && isOpen()) closeAuth();
    });
  }

  function bindSubmit() {
    const form = $("liora-auth-form");
    if (!form) {
      console.warn("🔐 Auth UI: formulário não encontrado");
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setError("");

      const email = normalizeEmail($("auth-email")?.value);
      const senha = normalizePass($("auth-senha")?.value);

      if (!email || !senha) {
        setError("Informe e-mail e senha.");
        return;
      }

      // precisa do auth core
      if (!window.lioraAuth) {
        setError("Auth ainda não carregou. Recarregue a página.");
        return;
      }

      try {
        setLoading(true, mode === "signup" ? "Criando conta..." : "Entrando...");

        if (mode === "signup") {
          if (!window.lioraAuth.cadastro) {
            setError("Cadastro indisponível no momento.");
            return;
          }
          await window.lioraAuth.cadastro(email, senha);
        } else {
          if (!window.lioraAuth.login) {
            setError("Login indisponível no momento.");
            return;
          }
          await window.lioraAuth.login(email, senha);
        }

        // O fechamento real ocorre pelo listener liora:auth-changed,
        // mas fechamos já para UX instantânea (não prejudica).
        closeAuth();

        // Mantém a tela atual (Home/app/premium). Não força navegação.
        // Se você quiser forçar ir para o app, descomente:
        // window.lioraUI?.show?.("liora-app");

      } catch (err) {
        const msg = window.lioraAuth?.error || "Não foi possível autenticar.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    });
  }

  function bindAuthChanged() {
    // Fecha modal quando o user existir
    window.addEventListener("liora:auth-changed", () => {
      const user = window.lioraAuth?.user;

      // Atualiza header (se existir)
      const info = $("liora-user-info");
      const name = $("liora-user-name");
      const status = $("liora-user-status");
      const btnLogin = $("btn-login");
      const btnLogout = $("btn-logout");

      if (user?.email) {
        if (info) info.classList.remove("hidden");
        setText(name, user.email);
        setText(status, window.lioraAuth?.premium ? "Premium" : "Grátis");

        if (btnLogin) btnLogin.classList.add("hidden");
        if (btnLogout) btnLogout.classList.remove("hidden");

        // se modal estiver aberto, fecha
        if (isOpen()) closeAuth();
      } else {
        // deslogado
        if (info) info.classList.add("hidden");
        setText(name, "");
        setText(status, "");

        if (btnLogin) btnLogin.classList.remove("hidden");
        if (btnLogout) btnLogout.classList.add("hidden");
      }
    });
  }

  function bindLogout() {
    const btn = $("btn-logout");
    if (!btn) return;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        setLoading(true, "Saindo...");
        await window.lioraAuth?.logout?.();
      } catch (err) {
        setError("Não foi possível sair.");
      } finally {
        setLoading(false);
      }
    });
  }

  // ----------------------------
  // Init
  // ----------------------------
  function initOnce() {
    if (bound) return;
    bound = true;

    const auth = $("liora-auth");
    if (!auth) {
      console.warn("🔐 Auth UI: container #liora-auth não encontrado");
      return;
    }

    // Garante que começa fechado
    auth.classList.remove("is-open");
    document.body.classList.remove("liora-modal-open");

    // binds
    bindInterceptOpenAuth();
    bindTogglePassword();
    bindBackButton();
    bindToggleMode();
    bindForgotPassword();
    bindCloseOnEsc();
    bindBackdropClick();
    bindSubmit();
    bindAuthChanged();
    bindLogout();

    // estado inicial
    applyMode();

    // dispara atualização inicial do header se auth já carregou
    try {
      window.dispatchEvent(new Event("liora:auth-changed"));
    } catch (_) {}

    ready = true;
    console.log("🔐 Auth UI pronta (modal canonical)");
  }

  document.addEventListener("DOMContentLoaded", initOnce);

  // API mínima
  window.lioraAuthUI = {
    ready: () => ready,
    open: openAuth,
    close: closeAuth,
  };
})();
