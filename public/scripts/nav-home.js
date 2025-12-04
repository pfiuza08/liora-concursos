// ==========================================================
// 🧭 LIORA — NAV-HOME v81-COMMERCIAL-PREMIUM
// ----------------------------------------------------------
// Correções incluídas:
//
// ✔ Continue Study reconstruindo wizard no Core
// ✔ Sem tela preta após reload
// ✔ Wizard aparece corretamente
// ✔ Suporte total ao Study Manager v2
// ✔ Home atualizada automaticamente
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v81) carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS
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
    // UI helpers
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
    // A4 — Atualiza Home (exibe "Continuar Estudo" quando existe)
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
    // ⭐ PATCH v81 — Reconstrução do Wizard dentro do Core
    // ======================================================
    function reconstruirWizardNoCore(plano) {
      try {
        if (!plano || !plano.sessoes || !plano.sessoes.length) return false;

        // ⚡ Recria o estado usado pelo Core
        window.wizard = {
          tema: plano.tema,
          nivel: plano.nivel || "tema",
          origem: plano.origem || "tema",
          plano: plano.sessoes.map(s => ({
            id: s.id,
            ordem: s.ordem,
            titulo: s.titulo,
            objetivo: s.objetivo || s.objetivos?.[0] || ""
          })),
          sessoes: plano.sessoes,
          atual: plano.sessaoAtual || 0
        };

        console.log("🔄 Wizard reconstruído no CORE:", window.wizard);
        return true;

      } catch (e) {
        console.error("❌ Erro reconstruindo wizard:", e);
        return false;
      }
    }

    // ======================================================
    // ⭐ CONTINUE STUDY ENGINE — AGORA 100% FUNCIONAL
    // ======================================================
    window.lioraContinueStudy = function () {
      try {
        const sm = window.lioraEstudos;
        console.log("🟦 CONTINUAR ESTUDO clicado. sm =", sm);

        if (!sm) return alert("Aguarde o carregamento dos dados de estudo.");

        const plano = sm.getPlanoAtivo();
        if (!plano) return alert("Você ainda não tem um plano criado.");

        console.log("▶ ContinueStudy: plano ativo encontrado:", plano.tema);

        // 1️⃣ Encontrar próxima sessão incompleta
        let idx = plano.sessoes.findIndex(s => (s.progresso || 0) < 100);
        if (idx < 0) idx = plano.sessoes.length - 1;

        // 2️⃣ Reconstruir wizard dentro do Core
        const ok = reconstruirWizardNoCore(plano);
        if (!ok) {
          alert("Erro ao reconstruir sessão de estudo.");
          return;
        }

        console.log("➡ Indo para sessão:", idx + 1);

        window.lioraModoRevisao = false;

        // 3️⃣ Exibir área do APP
        showApp();

        // 4️⃣ Agora sim — chamar função do Core
        if (typeof window.lioraIrParaSessao === "function") {
          window.lioraIrParaSessao(idx, false);
        } else {
          console.error("❌ window.lioraIrParaSessao não existe! Core não carregou?");
        }

      } catch (e) {
        console.error("❌ Erro no ContinueStudy:", e);
      }
    };

    // ======================================================
    // BOTÕES DA HOME
    // ======================================================
    btnTema?.addEventListener("click", () => {
      showApp();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-tema")?.classList.remove("hidden");
      document.getElementById("painel-upload")?.classList.add("hidden");
      document.getElementById("liora-sessoes")?.classList.add("hidden");
    });

    btnUpload?.addEventListener("click", () => {
      showApp();
      document.getElementById("painel-estudo")?.classList.remove("hidden");
      document.getElementById("painel-tema")?.classList.add("hidden");
      document.getElementById("painel-upload")?.classList.remove("hidden");
      document.getElementById("liora-sessoes")?.classList.add("hidden");
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

    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    console.log("🟢 NAV-HOME v81 pronto!");
  });
})();
