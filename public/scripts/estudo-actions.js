// ==========================================================
// 📘 LIORA — ESTUDO ACTIONS (DOM → INTENÇÃO)
// ==========================================================

console.log("📘 estudo-actions carregado");

(function () {

  const qs = (id) => document.getElementById(id);

  // -----------------------------
  // GERAR PLANO — TEMA
  // -----------------------------
  qs("btn-gerar-tema")?.addEventListener("click", () => {
    const tema = qs("inp-tema")?.value?.trim();
    const nivel = qs("sel-nivel")?.value || "iniciante";

    if (!tema) {
      window.lioraError?.show?.("Informe um tema.");
      return;
    }

    console.log("📘 UI → gerarPlanoTema", { tema, nivel });

    window.dispatchEvent(new CustomEvent("liora:gerar-plano", {
      detail: {
        origem: "tema",
        payload: { tema, nivel }
      }
    }));
  });

  // -----------------------------
  // GERAR PLANO — PDF
  // -----------------------------
  qs("btn-gerar-pdf")?.addEventListener("click", () => {
    const file = qs("inp-file")?.files?.[0];

    if (!file) {
      window.lioraError?.show?.("Selecione um PDF.");
      return;
    }

    console.log("📄 UI → gerarPlanoPDF", file.name);

    window.dispatchEvent(new CustomEvent("liora:gerar-plano", {
      detail: {
        origem: "pdf",
        payload: { file }
      }
    }));
  });

})();
