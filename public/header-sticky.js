// ==========================================================
// 📌 LIORA — Sticky Header v1
// Compacta ao rolar para baixo
// Expande ao rolar para cima
// ==========================================================

(function () {
  const header = document.querySelector("header");
  if (!header) return;

  let lastScrollY = window.scrollY;

  window.addEventListener(
    "scroll",
    () => {
      const currentScroll = window.scrollY;

      if (currentScroll > lastScrollY && currentScroll > 80) {
        // Rolando para baixo
        header.classList.add("header--compact");
      } else {
        // Rolando para cima
        header.classList.remove("header--compact");
      }

      lastScrollY = currentScroll;
    },
    { passive: true }
  );
})();
