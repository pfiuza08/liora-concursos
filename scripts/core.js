// -------------------------
// RENDER: RESUMO DO PLANO (painel direito)
// Agora: cards clicáveis
// -------------------------
function renderPlanoResumo(plano) {
  if (!els.plano) return;
  els.plano.innerHTML = "";

  if (!Array.isArray(plano) || !plano.length) {
    els.plano.innerHTML = `<p class="text-[var(--muted)]">Nenhum plano gerado ainda.</p>`;
    return;
  }

  plano.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "liora-card-topico";
    div.dataset.index = index;

    div.innerHTML = `
      <strong>${index + 1}.</strong> ${p.nome}
    `;

    // 🟠 Clique → abre wizard direto na sessão correspondente
    div.addEventListener("click", () => {
      wizard.atual = index;
      renderWizard();
      ensureWizardVisible();
      window.scrollTo({ top: els.wizardContainer.offsetTop - 20, behavior: "smooth" });
    });

    els.plano.appendChild(div);
  });
}
