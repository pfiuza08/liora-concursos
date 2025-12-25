// =======================================================
// 🧪 LIORA — INTERACTION AUDIT
// =======================================================

(function () {
  console.log("🧪 Interaction Audit ativo");

  document.addEventListener(
    "click",
    (e) => {
      const target = e.target.closest("button, a, [role='button']");
      if (!target) return;

      console.group("🖱️ CLICK DETECTADO");
      console.log("Texto:", target.innerText?.trim());
      console.log("ID:", target.id);
      console.log("Classes:", target.className);
      console.log("Disabled:", target.disabled);
      console.log(
        "pointer-events:",
        getComputedStyle(target).pointerEvents
      );
      console.log("opacity:", getComputedStyle(target).opacity);
      console.log("Elemento:", target);
      console.groupEnd();
    },
    true // captura antes de qualquer outro handler
  );
})();
