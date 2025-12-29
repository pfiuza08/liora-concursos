// ==========================================================
// 🧠 LIORA — UI | SEU ESTUDO (controle canônico e isolado)
// - Só renderiza quando HOME está ativa
// - Não interfere em outras telas (Premium, Simulados, Dashboard)
// ==========================================================

function isHomeActive() {
  const home = document.getElementById("liora-home");
  return !!(home && home.classList.contains("is-active"));
}

(function () {
  const bloco = document.getElementById("liora-seu-estudo");
  if (!bloco) return;

  const resumo = document.getElementById("home-resumo-estudo");

  function atualizar() {
    // 🔒 Blindagem total: fora da HOME não faz absolutamente nada
    if (!isHomeActive()) {
      bloco.style.display = "none";
      return;
    }

    const logged = window.lioraState?.logged === true;

    const planoAtivo =
      window.lioraEstudos?.getPlanoAtivo?.() || null;

    const deveMostrar = !!(logged && planoAtivo);

    bloco.style.display = deveMostrar ? "block" : "none";

    // Atualiza texto do resumo dinamicamente (se existir plano)
    if (deveMostrar && resumo && planoAtivo) {
      const tema = planoAtivo.tema || "Estudo ativo";
      const qtd = Array.isArray(planoAtivo.sessoes)
        ? planoAtivo.sessoes.length
        : 0;

      resumo.textContent = `Tema ativo: ${tema} — ${qtd} sessões`;
    }

    // Caso contrário, mantém texto neutro
    if (!deveMostrar && resumo) {
      resumo.textContent =
        "Gere um plano por Tema ou PDF para começar.";
    }
  }

  // 🔔 Escutas canônicas (todas protegidas pela HOME)
  window.addEventListener("liora:state-changed", atualizar);
  window.addEventListener("liora:plan-updated", atualizar);
  window.addEventListener("liora:auth-changed", atualizar);

  // Avaliação inicial segura
  atualizar();
})();
