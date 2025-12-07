// ==========================================================
// 💎 LIORA — PREMIUM LAYER v1 (LOCALSTORAGE)
// - Controle simples de "é premium ou não" no navegador
// - Sem backend, sem login, ideal para MVP comercial
// - Exposto como window.lioraPremium
// ==========================================================

(function () {
  console.log("🔵 Liora Premium Layer v1 carregado...");

  const STORAGE_KEY = "liora:premium:v1";
  const SECRET_CODE = "LIORA-2025-PREMIUM"; 
  // ⬆️ Troque esse código antes de divulgar comercialmente

  // ------------------------------------------------------
  // STATE + STORAGE
  // ------------------------------------------------------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { isPremium: false };
      const parsed = JSON.parse(raw);
      return {
        isPremium: !!parsed.isPremium,
        activatedAt: parsed.activatedAt || null,
        plan: parsed.plan || "full",
        source: parsed.source || "manual",
      };
    } catch {
      return { isPremium: false };
    }
  }

  let state = loadState();

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("⚠️ Não foi possível salvar estado premium:", e);
    }
  }

  function emitChange() {
    try {
      window.dispatchEvent(
        new CustomEvent("liora:premium-changed", { detail: { ...state } })
      );
    } catch {}
  }

  // ------------------------------------------------------
  // API PÚBLICA
  // ------------------------------------------------------
  function isPremium() {
    return !!state.isPremium;
  }

  function getInfo() {
    return { ...state };
  }

  function setPremium(opts = {}) {
    state.isPremium = true;
    state.activatedAt = new Date().toISOString();
    state.plan = opts.plan || "full";
    state.source = opts.source || "manual";
    saveState();
    emitChange();
    console.log("💎 Liora Premium ativado:", state);
  }

  function clearPremium() {
    state = { isPremium: false };
    saveState();
    emitChange();
    console.log("🔓 Liora Premium desativado neste navegador.");
  }

  // Helper genérico para futuras limitações:
  // featureId é uma string tipo: "planos:diario", "simulados:qtd"
  function canUse(featureId, context = {}) {
    if (state.isPremium) return true;
    // No MVP v1, não bloqueamos nada por padrão;
    // usaremos só para mostrar o modal de upgrade.
    console.log("ℹ️ canUse() (FREE):", featureId, context);
    return true;
  }

  // ------------------------------------------------------
  // MODAL DE UPGRADE (HTML já está no index)
  // ------------------------------------------------------
  function getModalElements() {
    const backdrop = document.getElementById("liora-upgrade-modal");
    if (!backdrop) return {};
    return {
      backdrop,
      box: backdrop.querySelector(".liora-upgrade-box"),
      closeBtn: backdrop.querySelector("#liora-upgrade-close"),
      btnSouPremium: backdrop.querySelector("#liora-upgrade-sou-premium"),
      btnAtivar: backdrop.querySelector("#liora-upgrade-ativar"),
      inputCodigo: backdrop.querySelector("#liora-upgrade-codigo"),
      status: backdrop.querySelector("#liora-upgrade-status"),
    };
  }

  function openUpgradeModal(section) {
    const els = getModalElements();
    if (!els.backdrop) {
      console.warn("⚠️ Modal de upgrade não encontrado no HTML.");
      return;
    }

    els.backdrop.classList.remove("hidden");
    els.backdrop.classList.add("flex");
    if (els.status) {
      els.status.textContent = "";
      els.status.classList.add("hidden");
    }

    if (els.inputCodigo) {
      els.inputCodigo.value = "";
      els.inputCodigo.focus();
    }

    // Podemos guardar a "origem" do clique (sessão, simulado, PDF, etc)
    if (section) {
      els.backdrop.dataset.section = section;
    } else {
      delete els.backdrop.dataset.section;
    }
  }

  function closeUpgradeModal() {
    const els = getModalElements();
    if (!els.backdrop) return;
    els.backdrop.classList.add("hidden");
    els.backdrop.classList.remove("flex");
  }

  // ------------------------------------------------------
  // WIRE-UP DO MODAL (depois do DOM pronto)
  // ------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const els = getModalElements();
    if (!els.backdrop) {
      console.warn("⚠️ Modal de upgrade ainda não está no DOM.");
      return;
    }

    // Fechar no X
    els.closeBtn?.addEventListener("click", closeUpgradeModal);

    // Fechar clicando fora da caixa
    els.backdrop.addEventListener("click", (ev) => {
      if (ev.target === els.backdrop) {
        closeUpgradeModal();
      }
    });

    // Botão "Já sou aluna/premium" → ativa direto (para MVP / testes)
    els.btnSouPremium?.addEventListener("click", () => {
      setPremium({ source: "sou-premium-botao" });
      closeUpgradeModal();
    });

    // Botão "Ativar com código"
    els.btnAtivar?.addEventListener("click", () => {
      if (!els.inputCodigo || !els.status) return;
      const code = (els.inputCodigo.value || "").trim();

      if (!code) {
        els.status.textContent = "Digite o código de acesso.";
        els.status.classList.remove("hidden");
        return;
      }

      if (code === SECRET_CODE) {
        setPremium({ source: "codigo" });
        els.status.textContent = "Liora Premium ativado neste navegador. ✅";
        els.status.classList.remove("hidden");
        setTimeout(closeUpgradeModal, 800);
      } else {
        els.status.textContent = "Código inválido. Verifique e tente novamente.";
        els.status.classList.remove("hidden");
      }
    });

    // Badge de estado na home (opcional)
    const badge = document.getElementById("liora-premium-badge");
    if (badge) {
      const apply = () => {
        if (isPremium()) {
          badge.textContent = "Liora Premium ativo 💎";
          badge.classList.remove("bg-slate-800");
          badge.classList.add("bg-amber-500/10", "text-amber-300");
        } else {
          badge.textContent = "Versão gratuita — recursos limitados";
          badge.classList.add("bg-slate-800");
          badge.classList.remove("bg-amber-500/10", "text-amber-300");
        }
      };
      apply();
      window.addEventListener("liora:premium-changed", apply);
    }

    console.log("🟢 Premium Layer inicializado. Estado:", state);
  });

  // ------------------------------------------------------
  // EXPOSTO GLOBAL
  // ------------------------------------------------------
  window.lioraPremium = {
    isPremium,
    getInfo,
    setPremium,
    clearPremium,
    canUse,
    openUpgradeModal,
    closeUpgradeModal,
  };
})();
