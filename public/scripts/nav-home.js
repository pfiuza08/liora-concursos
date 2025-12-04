// ==========================================================
// 🧭 LIORA — NAV-HOME v80-COMMERCIAL-PREMIUM
// ----------------------------------------------------------
// Funções incluídas:
//
// ✔ Render inicial da HOME
// ✔ Continue Study Engine com fallback inteligente
// ✔ Integração total com Study Manager (lioraEstudos v2)
// ✔ Exibe botão "Continuar Estudo" automaticamente
// ✔ Mostra resumo do plano ativo
// ✔ Atualiza home ao receber eventos de update
// ==========================================================

(function () {
  console.log("🔵 nav-home.js (v80) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    const btnTema = document.getElementById("home-tema");
    const btnUpload = document.getElementById("home-upload");
    const btnSimulados = document.getElementById("home-simulados");
    const btnDashboard = document.getElementById("home-dashboard");

    const btnContinue = document.getElementById("home-continuar-estudo");
    const resumoEl = document.getElementById("home-resumo-estudo");

    const fabHome = document.getElementById("fab-home");

    // ======================================================
    // UTIL
    // ======================================================
    function showApp() {
      home.classList.add("hidden");
      app.classList.remove("hidden");
    }

    function showHome() {
      app.classList.add("hidden");
      home.classList.remove("hidden");
    }

    // ======================================================
    // A4 — Inicialização da HOME
    // ======================================================
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

        // há plano ativo
        btnContinue?.classList.remove("hidden");
        resumoEl.textContent = `Tema ativo: ${plano.tema} — ${plano.sessoes.length} sessões`;

        console.log("A4: Plano ativo identificado:", plano);
      } catch (e) {
        console.warn("Erro ao atualizar home:", e);
      }
    }

    // Atualiza quando a página carrega
    setTimeout(atualizarHome, 150);

    // Atualiza quando o plano muda
    window.addEventListener("liora:plan-updated", atualizarHome);
    window.addEventListener("liora:review-updated", atualizarHome);

    // ======================================================
    // ⭐ CONTINUE STUDY ENGINE — ATIVADO
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
          return alert("Você ainda não tem um plano criado neste dispositivo.");
        }

        console.log("▶ ContinueStudy: plano ativo encontrado:", plano.tema);

        // calcula próxima sessão incompleta
        let idx = plano.sessoes.findIndex(s => (s.progresso || 0) < 100);
        if (idx < 0) idx = plano.sessoes.length - 1; // tudo completo → última sessão

        console.log("➡ Indo para sessão:", idx + 1);

        window.lioraModoRevisao = false;
        showApp();
        window.lioraIrParaSessao(idx, false);
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

      // Prefill do simulado (Study Manager → IA)
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

    // CONTINUAR ESTUDO
    if (btnContinue) {
      btnContinue.addEventListener("click", () => {
        window.lioraContinueStudy();
      });
    }

    // FAB HOME
    fabHome?.addEventListener("click", () => {
      showHome();
      setTimeout(atualizarHome, 200);
    });

    console.log("🟢 NAV-HOME v80 pronto!");
  });
})();
