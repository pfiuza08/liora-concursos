// ======================================================
// 🧹 LIORA — STATE RESET (FASE A)
// Remove estados globais legados e fantasmas
// ======================================================

(function () {
  console.log("🧹 [STATE RESET] Limpando estados globais legados");

  // Remove acesso legado (bug histórico)
  if ("lioraAccess" in window) {
    console.warn("⚠️ window.lioraAccess removido");
    delete window.lioraAccess;
  }

})();
