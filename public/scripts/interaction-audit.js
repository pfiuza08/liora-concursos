// =======================================================
// 🧪 LIORA — INTERACTION AUDIT
// - Loga TODOS os cliques
// - Detecta bloqueios de auth
// - Detecta botões mortos
// =======================================================

(function () {
  console.log("🧪 Interaction Audit ativo");

  document.addEventListener("click", (e) => {
    const target = e.target.closest("button, a, [role='button']");
    if (!target) return;

    const info = {
      text: target.innerText?.trim(),
      id: target.id,
      class: target.className,
      disabled: target.disabled,
      pointerEvents: getComputedStyle(target).pointerEvents,
      opacity: getComputedStyle(target).opacity,
    };

    console.group("🖱️ CLICK DETECTADO");
    console.table(info);
    console.log("Elemento:", target);
    console.groupEnd();
  }, true);
})();
