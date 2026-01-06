// ==========================================================
// 🧠 LIORA — UI | SEU ESTUDO (CANONICAL)
// - NUNCA usa style.display
// - Apenas .hidden
// ==========================================================

(function () {
  const bloco = document.getElementById("liora-seu-estudo");
  if (!bloco) return;

  const resumo = document.getElementById("home-resumo-estudo");

  function atualizar() {
    const logged = window.lioraAuth?.user != null;
    const planoAtivo =
      window.lioraEstudos?.getPlanoAtivo?.() || null;

    const deveMostrar = Boolean(logged && planoAtivo);

    bloco.classList.toggle("hidden", !deveMostrar);

   if (deveMostrar && resumo && planoAtivo) {
    const qtd = planoAtivo.sessoes?.length || 0;
  
    // Contexto estrutural do plano (sem repetir o tema)
    resumo.textContent = `${qtd} sessões`;
  }

  }

  // 🔔 eventos canônicos
  window.addEventListener("liora:auth-changed", atualizar);
  window.addEventListener("liora:plan-updated", atualizar);
  window.addEventListener("liora:state-changed", atualizar);

  atualizar();
})();
