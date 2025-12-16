// ======================================================
// 🧹 LIORA — STATE RESET (FASE A)
// Remove estados globais legados e bloqueia recriação
// ======================================================

(function () {
  console.log("🧹 [STATE RESET] Fase A iniciada");

  // -------------------------------------------
  // 4.1 — REMOÇÃO DE ESTADOS LEGADOS
  // -------------------------------------------
  if ("lioraAccess" in window) {
    console.warn("⚠️ Removendo window.lioraAccess (estado legado)");
    try {
      delete window.lioraAccess;
    } catch (e) {
      console.error("❌ Não foi possível remover lioraAccess:", e);
    }
  }

  // -------------------------------------------
  // 4.2 — BLOQUEIO DEFINITIVO DE RECRIAÇÃO
  // -------------------------------------------
  Object.defineProperty(window, "lioraAccess", {
    configurable: false,
    enumerable: false,
    get() {
      console.warn(
        "🚫 window.lioraAccess é proibido. Use getSimuladoAccess() ou lioraState."
      );
      return undefined;
    },
    set() {
      console.warn(
        "🚫 Tentativa de escrever window.lioraAccess bloqueada."
      );
    },
  });

  console.log("🧹 [STATE RESET] Concluído — estado protegido");
})();
