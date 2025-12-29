// ==========================================================
// 🧠 LIORA — UI | SEU ESTUDO (controle canônico)
// ==========================================================
function isHomeActive() {
  const home = document.getElementById("liora-home");
  return home && home.classList.contains("is-active");
}

(function () {
  const bloco = document.getElementById("liora-seu-estudo");
  if (!bloco) return;

  const resumo = document.getElementById("home-resumo-estudo");

  function atualizar() {
    const logged = window.lioraState?.logged === true;

    const planoAtivo =
      window.lioraEstudos?.getPlanoAtivo?.() || null;

    const deveMostrar = !!(logged && planoAtivo);

    bloco.style.display = deveMostrar ? "block" : "none";

    // Atualiza texto do resumo dinamicamente (se existir plano)
    if (deveMostrar && resumo && planoAtivo) {
      const tema = planoAtivo.tema || "Estudo ativo";
      const qtd = planoAtivo.sessoes?.length || 0;

      resumo.textContent = `Tema ativo: ${tema} — ${qtd} sessões`;
    }
  }

  // 🔔 Escutas canônicas
  window.addEventListener("liora:state-changed", atualizar);
  window.addEventListener("liora:plan-updated", atualizar);
  window.addEventListener("liora:auth-changed", atualizar);

  // Avaliação inicial
  atualizar();
})();
