// ==========================================================
// 🧭 LIORA — NAV-HOME v83-COMMERCIAL-PREMIUM (FINAL)
// ----------------------------------------------------------
// Versão estável FINAL:
// ✔ Continue Study 100% funcional
// ✔ Reconstrução correta do wizard via Core
// ✔ Não sobrescreve wizard interno
// ✔ Home reflete plano ativo sempre
// ✔ FAB e botões totalmente operacionais
// ✔ Compatível com Core v74 + Estudos v2
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v83) carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS DA INTERFACE
    // ------------------------------------------------------
    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    const btnTema = document.getElementById("home-tema");
    const btnUpload = document.getElementById("home-upload");
    const btnSimulados = document.getElementById("home-simulados");
    const btnDashboard = document.getElementById("home-dashboard");

    const btnContinue = document.getElementById("home-continuar-estudo");
    const resumoEl = document.getElementById("home-resumo-estudo");

    const fabHome = document.getElementById("fab-home");

    // ------------------------------------------------------
    // UI HELPERS
    // ------------------------------------------------------
    function showApp() {
      home.classList.add("hidden");
      app.classList.remove("hidden");
    }

    function showHome() {
      app.classList.add("hidden");
      home.classList.remove("hidden");
    }

    // ------------------------------------------------------
    // ATUALIZAÇÃO DA HOME
    // ------------------------------------------------------
    function atualizarHome() {
      try {
        const sm = window.lioraEstudos;

        if (!sm) {
          console.log("A4: Estudos ainda não carregado.");
          btnContinue?.classList.add("hidden");
          resumoEl.textContent = "Gere um plano de estudo por Tema ou PDF para começar.";
          return;
        }

        const plano = sm.getPlanoAtivo();

        if (!plano) {
          console.log("A4: Nenhum plano ativo.");
          btnContinue?.classList.add("hidden");
          resumoEl.textContent = "Gere um plano de estudo por Tema ou PDF para começar.";
          return;
        }

        btnContinue?.classList.remove("hidden");
        resumoEl.textContent = `Tema ativo: ${plano.tema} — ${plano.sessoes.length} sessões`;

        console.log("A4: Plano ativo identificado:", plano);

      } catch (e) {
        console.warn("Erro ao atualizar home:", e);
      }
    }

    setTimeout(atualizarHome, 150);
    window.addEventListener("liora:plan-updated", atualizarHome);
    window.addEventListener("liora:review-updated", atualizarHome);

    // ======================================================
    // ⭐ CONTINUE STUDY — VERSÃO FINAL E CORRETA
    // ======================================================
    window.lioraContinueStudy = function () {
      try {
        const sm = window.lioraEstudos;

        console.log("🟦 CONTINUAR ESTUDO clicado. sm =", sm);

        if (!sm) {
          return alert("Aguarde o carregamento dos dados de estudo.");
        }

        const plano = sm.getPlanoAtivo();
        if (!plano) {
          return alert("Você ainda não tem um plano criado.");
        }

        console.log("▶ ContinueStudy: plano ativo encontrado:", plano.tema);

        // 1️⃣ Encontrar próxima sessão incompleta
        let idx = plano.sessoes.findIndex(s => (s.progresso || 0) < 100);
        if (idx < 0) idx = plano.sessoes.length - 1;

        console.log("➡ Próxima sessão selecionada:", idx + 1);

        // 2️⃣ Desativa revisão
        window.lioraModoRevisao = false;

        // 3️⃣ RECONSTRUIR WIZARD — ESSENCIAL
        if (typeof window.lioraSetWizardFromPlano === "function") {
          const ok = window.lioraSetWizardFromPlano(plano, idx);
          if (!ok) {
            console.error("❌ Falha ao reconstruir wizard");
            alert("Erro ao abrir sessão. Recarregue a página.");
            return;
          }
        } else {
          console.error("❌ lioraSetWizardFromPlano não existe! Core não carregou?");
          alert("Erro interno. Recarregue a página.");
          return;
        }

        // 4️⃣ Abre a área de estudo
        showApp();

        // 5️⃣ Agora sim: move para a sessão
        if (typeof window.lioraIrParaSessao === "function") {
          window.lioraIrParaSessao(idx, false);
        } else {
          console.error("❌ lioraIrParaSessao não existe!");
          alert("Erro ao abrir sessão. Recarregue a página.");
        }

      } catch (e) {
        console.error("❌ Erro no ContinueStudy:", e);
      }
    };

    // ======================================================
    // BOTÕES DE NAVEGAÇÃO
    // ======================================================
    btnTema?.addEventListener("click", () => {
      showApp();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-tema")?.classList.remove("hidden");
      document.getElementById("painel-upload")?.classList.add("hidden");
      document.getElementById("liora-sessoes")?.classList.add("hidden");
      document.getElementById("area-plano")?.classList.add("hidden");
    });

    btnUpload?.addEventListener("click", () => {
      showApp();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-tema")?.classList.add("hidden");
      document.getElementById("painel-upload")?.classList.remove("hidden");
      document.getElementById("liora-sessoes")?.classList.add("hidden");
      document.getElementById("area-plano")?.classList.add("hidden");
    });

    btnSimulados?.addEventListener("click", () => {
      showApp();
      document.getElementById("area-simulado")?.classList.remove("hidden");
      document.getElementById("area-dashboard")?.classList.add("hidden");
      document.getElementById("liora-sessoes")?.classList.add("hidden");
      document.getElementById("painel-estudo")?.classList.add("hidden");
      document.getElementById("area-plano")?.classList.add("hidden");

      if (window.lioraPreFillSimulado) window.lioraPreFillSimulado();
    });

    btnDashboard?.addEventListener("click", () => {
      showApp();
      document.getElementById("area-dashboard")?.classList.remove("hidden");
      document.getElementById("area-simulado")?.classList.add("hidden");
      document.getElementById("liora-sessoes")?.classList.add("hidden");
      document.getElementById("painel-estudo")?.classList.add("hidden");
      document.getElementById("area-plano")?.classList.add("hidden");
    });

    btnContinue?.addEventListener("click", () => {
      window.lioraContinueStudy();
    });

    // FAB HOME
    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    console.log("🟢 NAV-HOME v83 pronto!");
  });
})();
