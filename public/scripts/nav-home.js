// ==========================================================
// 🧭 LIORA — NAV-HOME v78-COMMERCIAL-SYNC-IA-PREMIUM-ESTUDOS
// ----------------------------------------------------------
// Correções principais v78:
// ✔ Home Inteligente revalida várias vezes (desktop + mobile)
// ✔ Botão "Continuar Estudo" força display:block quando há plano
// ✔ Função robusta mesmo se lioraEstudos carregar depois
// ✔ Logs claros no console para debug (sm/plano/btn)
// ✔ Mantida integração com revisões + estudos recentes
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try {
      if (window.lioraNavHome && window.lioraNavHome.registrarEventos) {
        window.lioraNavHome.registrarEventos();
        console.log("NAV-HOME: Eventos registrados após DOMContentLoaded");
      } else {
        console.warn("NAV-HOME: registrarEventos não encontrado");
      }
    } catch (err) {
      console.error("NAV-HOME ERROR:", err);
    }
  }, 120);
});

(function () {
  console.log("🔵 nav-home.js (v78) carregado...");

   document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------------------
    // ELEMENTOS
    // ------------------------------------------------------
    const home = document.getElementById("liora-home");
    const app = document.getElementById("liora-app");

    const painelEstudo = document.getElementById("painel-estudo");
    const painelTema = document.getElementById("painel-tema");
    const painelUpload = document.getElementById("painel-upload");

    const areaSimulado = document.getElementById("area-simulado");
    const areaDashboard = document.getElementById("area-dashboard");

    const fabHome = document.getElementById("fab-home");
    const fabSim = document.getElementById("sim-fab");

    const btnHomeTema = document.getElementById("home-tema");
    const btnHomeUpload = document.getElementById("home-upload");
    const btnHomeSimulados = document.getElementById("home-simulados");
    const btnHomeDashboard = document.getElementById("home-dashboard");

    const viewTitle = document.getElementById("liora-view-title");
    const viewSubtitle = document.getElementById("liora-view-subtitle");

    const btnContinue = document.getElementById("home-continuar-estudo");
    const resumoEstudoEl = document.getElementById("home-resumo-estudo");

    // ------------------------------------------------------
    // FAB helpers
    // ------------------------------------------------------
    window.showSimFab = () => fabSim && (fabSim.style.display = "flex");
    window.hideSimFab = () => fabSim && (fabSim.style.display = "none");
    window.showFabHome = () => fabHome && (fabHome.style.display = "flex");
    window.hideFabHome = () => fabHome && (fabHome.style.display = "none");

    // ------------------------------------------------------
    // VISIBILIDADE
    // ------------------------------------------------------
    function showApp() {
      home?.classList.add("hidden");
      app?.classList.remove("hidden");
      window.showFabHome();
    }

    function showHome() {
      home?.classList.remove("hidden");
      app?.classList.add("hidden");

      if (viewTitle) viewTitle.textContent = "";
      if (viewSubtitle) viewSubtitle.textContent = "";

      window.showFabHome();
    }

    function hideAllPanels() {
      painelEstudo?.classList.add("hidden");
      painelTema?.classList.add("hidden");
      painelUpload?.classList.add("hidden");
      areaSimulado?.classList.add("hidden");
      areaDashboard?.classList.add("hidden");
    }

    function setView(title, subtitle) {
      if (viewTitle) viewTitle.textContent = title || "";
      if (viewSubtitle) viewSubtitle.textContent = subtitle || "";
    }

    // ------------------------------------------------------
    // 🔥 RESET TOTAL
    // ------------------------------------------------------
    window.lioraHardReset = function () {
      console.log("🧹✨ Reset completo iniciado...");

      hideAllPanels();
      showHome();
      window.hideSimFab();

      // LIMPA PLANO
      const plano = document.getElementById("plano");
      if (plano) plano.innerHTML = "";

      // STATUS
      const status = document.getElementById("status");
      if (status) status.textContent = "";

      const statusUpload = document.getElementById("status-upload");
      if (statusUpload) statusUpload.textContent = "";

      // BARRAS
      const barraTema = document.getElementById("barra-tema-fill");
      if (barraTema) barraTema.style.width = "0%";

      const barraUpload = document.getElementById("barra-upload-fill");
      if (barraUpload) barraUpload.style.width = "0%";

      // WIZARD
      const wiz = document.getElementById("liora-sessoes");
      if (wiz) wiz.classList.add("hidden");

      // SIMULADOS
      const simQuestao = document.getElementById("sim-questao-container");
      if (simQuestao) simQuestao.innerHTML = "";

      const simResultado = document.getElementById("sim-resultado");
      if (simResultado) {
        simResultado.innerHTML = "";
        simResultado.classList.add("hidden");
      }

      const simNav = document.getElementById("sim-nav");
      if (simNav) simNav.classList.add("hidden");

      const simProgress = document.getElementById("sim-progress-bar");
      if (simProgress) simProgress.style.width = "0%";

      const simTimer = document.getElementById("sim-timer");
      if (simTimer) {
        simTimer.textContent = "00:00";
        simTimer.classList.add("hidden");
      }

      // fecha modal
      const modal = document.getElementById("sim-modal-backdrop");
      if (modal) modal.classList.remove("visible");

      // fecha overlays
      if (window.lioraLoading?.hide) window.lioraLoading.hide();
      if (window.lioraError?.hide) window.lioraError.hide();

      // Atualiza home inteligente + revisões + recentes
      atualizarHomeEstudo("reset");
      preencherRevisoesPendentes();
      preencherEstudosRecentes();

      window.showFabHome();

      console.log("🧹✨ Reset completo FINALIZADO!");
    };

    fabHome?.addEventListener("click", () => window.lioraHardReset());

    // ------------------------------------------------------
    // ⭐ CONTINUE STUDY ENGINE — fluxo inteligente
    // ------------------------------------------------------
    window.lioraContinueStudy = function () {
      try {
        const sm = window.lioraEstudos;
        console.log("▶ lioraContinueStudy(): sm =", !!sm);

        if (!sm?.getPlanoAtivo) return;

        const plano = sm.getPlanoAtivo();
        console.log("▶ lioraContinueStudy(): plano ativo =", plano);

        if (!plano || !plano.sessoes?.length) return;

        const sessoes = plano.sessoes;

        // pega 1ª sessão não concluída
        let alvo = sessoes.find(s => Number(s.progresso || 0) < 100);
        if (!alvo) alvo = sessoes[sessoes.length - 1];

        const index = Number(alvo.ordem || 1) - 1;

        // abre painel correto
        plano.origem === "tema"
          ? btnHomeTema?.click()
          : btnHomeUpload?.click();

        // jump após UI renderizar
        setTimeout(() => {
          window.lioraIrParaSessao && window.lioraIrParaSessao(index);
        }, 350);

      } catch (e) {
        console.error("❌ Erro no ContinueStudy:", e);
      }
    };

     // ------------------------------------------------------
    // CONTINUE ESTUDO — COM FALLBACK INTELIGENTE
    // ------------------------------------------------------
    if (btnContinue) {
      btnContinue.addEventListener("click", () => {
        try {
          const sm = window.lioraEstudos;
    
          console.log("🟦 [Continuar Estudo] Clique detectado. sm =", sm);
    
          // Caso extremo: Study Manager ainda não carregou
          if (!sm) {
            alert(
              "⚠️ O sistema ainda está carregando seus dados de estudo.\n\n" +
              "Aguarde alguns segundos e tente novamente."
            );
            return;
          }
    
          if (!sm.getPlanoAtivo) {
            alert(
              "⚠️ Não foi possível localizar seu plano de estudo.\n\n" +
              "Recarregue a página e tente novamente."
            );
            return;
          }
    
          const plano = sm.getPlanoAtivo();
    
          // Nenhum plano salvo → fallback premium
          if (!plano) {
            alert(
              "📘 Você ainda não criou um plano de estudo neste dispositivo.\n\n" +
              "Use as opções 'Tema' ou 'PDF' para criar seu primeiro plano."
            );
            return;
          }
    
          // Tudo OK → segue fluxo normal
          console.log("🟩 [Continuar Estudo] Plano encontrado → executando fluxo");
          window.lioraContinueStudy();
    
        } catch (e) {
          console.error("❌ Erro no clique de Continuar Estudo:", e);
          alert(
            "⚠️ Ocorreu um erro ao tentar continuar seu estudo.\n" +
            "Tente novamente em instantes."
          );
        }
      });
    }


    // ------------------------------------------------------
    // HOME INTELIGENTE — APARECER / SUMIR
    // ------------------------------------------------------
    function atualizarHomeEstudo(origemLog) {
      try {
        const sm = window.lioraEstudos;
        const hasSm = !!sm;
        const hasGet = !!sm?.getPlanoAtivo;
        const plano = hasGet ? sm.getPlanoAtivo() : null;

        console.log(
          `🏠 atualizarHomeEstudo(${origemLog || "manual"}) -> sm:`,
          hasSm,
          "getPlanoAtivo:",
          hasGet,
          "plano:",
          !!plano,
          "btnContinue:",
          !!btnContinue
        );

        if (!btnContinue || !resumoEstudoEl) {
          console.warn("⚠️ Home Inteligente: botão ou resumo não encontrado no DOM.");
          return;
        }

        if (!hasGet || !plano) {
          // Não há plano ativo → esconde botão
          btnContinue.classList.add("hidden");
          btnContinue.style.display = "none";
          resumoEstudoEl.textContent =
            "Crie um plano de estudo por Tema ou PDF para começar.";
          return;
        }

        // Há plano → exibe botão de forma FORÇADA (funciona em mobile)
        btnContinue.classList.remove("hidden");
        btnContinue.style.display = "block";

        resumoEstudoEl.textContent =
          `Você está estudando: ${plano.tema} (${plano.sessoes.length} sessões)`;

      } catch (e) {
        console.error("Erro ao atualizar Home Inteligente:", e);
      }
    }

    // ------------------------------------------------------
    // REVISÕES PENDENTES
    // ------------------------------------------------------
    function preencherRevisoesPendentes() {
      const box = document.getElementById("liora-revisoes-box");
      const list = document.getElementById("liora-revisoes-list");
      if (!box || !list) return;

      const sm = window.lioraEstudos;
      if (!sm?.getRevisoesPendentes) return;

      const revs = sm.getRevisoesPendentes();

      if (!revs.length) {
        box.classList.add("hidden");
        return;
      }

      box.classList.remove("hidden");
      list.innerHTML = "";

      revs.forEach(s => {
        const pct = Math.round(s.retencao || 0);
        const next = s.nextReviewISO || "Hoje";

        const fillColor =
          pct >= 70 ? "var(--brand)" :
          pct >= 40 ? "orange" :
                      "red";

        const urgente = pct < 40
          ? `<span class="text-red-500 text-xs font-bold ml-2">URGENTE</span>`
          : "";

        const card = document.createElement("div");
        card.className = "liora-rev-card";

        card.innerHTML = `
          <div class="flex justify-between items-start">
            <div>
              <div class="font-semibold text-[var(--fg)]">${s.titulo}</div>
              <div class="text-xs text-[var(--muted)] mt-1">
                Próxima revisão: ${next} ${urgente}
              </div>
              <div class="liora-ret-bar mt-2">
                <div class="liora-ret-bar-fill"
                     style="width:${pct}%; background:${fillColor}"></div>
              </div>
              <div class="text-xs text-[var(--muted)] mt-1">${pct}% de retenção</div>
            </div>

            <button class="liora-rev-btn">Revisar agora</button>
          </div>
        `;

        // botão revisão
        card.querySelector(".liora-rev-btn")
          .addEventListener("click", e => {
            e.stopPropagation();
            abrirSessaoParaRevisao(s.id);
          });

        card.addEventListener("click", () => abrirSessaoParaRevisao(s.id));

        list.appendChild(card);
      });
    }

    function abrirSessaoParaRevisao(sessaoId) {
      const sm = window.lioraEstudos;
      const plano = sm?.getPlanoAtivo();
      if (!plano) return;

      plano.origem === "tema"
        ? btnHomeTema?.click()
        : btnHomeUpload?.click();

      const index = plano.sessoes.findIndex(s => s.id === sessaoId);
      if (index < 0) return;

      setTimeout(() => {
        window.lioraIrParaSessao &&
          window.lioraIrParaSessao(index, true);
      }, 350);
    }

    // ------------------------------------------------------
    // ESTUDOS RECENTES
    // ------------------------------------------------------
    function preencherEstudosRecentes() {
      const container = document.getElementById("liora-estudos-recentes");
      const list = document.getElementById("liora-estudos-list");
      if (!container || !list) return;

      const sm = window.lioraEstudos;
      if (!sm?.listarRecentes) return;

      const recentes = sm.listarRecentes(5);

      if (!recentes.length) {
        container.classList.add("hidden");
        return;
      }

      container.classList.remove("hidden");
      list.innerHTML = "";

      recentes.forEach(plano => {
        const progressoMedio =
          plano.sessoes.reduce((acc, s) => acc + (s.progresso || 0), 0) /
          plano.sessoes.length;

        const div = document.createElement("button");
        div.className =
          "liora-card-recent hover:bg-[var(--bg2)] transition p-3 rounded-xl text-left border border-[var(--border)]";
        div.innerHTML = `
          <div class="font-semibold text-[var(--fg)]">${plano.tema}</div>
          <div class="text-sm text-[var(--muted)]">
            ${plano.sessoes.length} sessões • ${progressoMedio.toFixed(0)}% concluído
          </div>
        `;

        div.addEventListener("click", () => {
          window.lioraEstudos && (window.lioraEstudos._forcarAtivo = plano.id);
          window.lioraContinueStudy && window.lioraContinueStudy();
        });

        list.appendChild(div);
      });
    }

    // ------------------------------------------------------
    // LISTENERS PARA ATUALIZAÇÕES
    // ------------------------------------------------------
    window.addEventListener("liora:plan-updated", () => atualizarHomeEstudo("evt-plan"));
    window.addEventListener("liora:plan-updated", preencherRevisoesPendentes);
    window.addEventListener("liora:review-updated", preencherRevisoesPendentes);
    window.addEventListener("liora:plan-updated", preencherEstudosRecentes);

    // ------------------------------------------------------
    // HOME → TEMA
    // ------------------------------------------------------
    btnHomeTema?.addEventListener("click", () => {
      showApp();
      hideAllPanels();

      painelEstudo?.classList.remove("hidden");
      painelTema?.classList.remove("hidden");

      setView(
        "Plano por tema",
        "Defina um tema e deixe a Liora quebrar o estudo em sessões."
      );

      window.hideSimFab();
      window.showFabHome();
    });

    // ------------------------------------------------------
    // HOME → UPLOAD
    // ------------------------------------------------------
    btnHomeUpload?.addEventListener("click", () => {
      showApp();
      hideAllPanels();

      painelEstudo?.classList.remove("hidden");
      painelUpload?.classList.remove("hidden");

      setView(
        "Plano a partir do PDF",
        "Envie seu material e a Liora monta um plano completo."
      );

      window.hideSimFab();
      window.showFabHome();
    });

    // ------------------------------------------------------
    // HOME → SIMULADOS
    // ------------------------------------------------------
    function goSimulados() {
      showApp();
      hideAllPanels();

      areaSimulado?.classList.remove("hidden");

      setView(
        "Simulados inteligentes",
        "Monte simulados com IA por banca, tema e dificuldade."
      );

      window.showSimFab();
      window.showFabHome();

      setTimeout(() => {
        window.lioraPreFillSimulado && window.lioraPreFillSimulado();
      }, 150);
    }
    btnHomeSimulados?.addEventListener("click", goSimulados);

    // ------------------------------------------------------
    // HOME → DASHBOARD
    // ------------------------------------------------------
    function goDashboard() {
      showApp();
      hideAllPanels();

      areaDashboard?.classList.remove("hidden");

      setView("Meu desempenho", "Veja o resumo dos seus simulados.");

      window.hideSimFab();
      window.showFabHome();

      window.lioraDashboard?.atualizar &&
        window.lioraDashboard.atualizar();
    }
    btnHomeDashboard?.addEventListener("click", goDashboard);
    window.homeDashboard = goDashboard;

    // ------------------------------------------------------
    // ESTADO INICIAL
    // ------------------------------------------------------
    window.lioraHardReset();

    // Revalida rapidamente após reset (caso lioraEstudos já esteja pronto)
    setTimeout(() => atualizarHomeEstudo("post-reset-150ms"), 150);

    console.log("🟢 nav-home.js v78 OK (DOM pronto)");
  });

  // ------------------------------------------------------
  // 🚀 FINAL LOAD — GARANTE MOBILE FUNCIONANDO
  // ------------------------------------------------------
  window.addEventListener("load", () => {
    console.log("🌐 window.load disparado — reforçando Home Inteligente...");

    // retries espaçados para pegar qualquer atraso do estudos.js
    setTimeout(() => {
      atualizarHomeEstudoSafe("load+300ms");
    }, 300);

    setTimeout(() => {
      atualizarHomeEstudoSafe("load+1000ms");
    }, 1000);

    setTimeout(() => {
      atualizarHomeEstudoSafe("load+2500ms");
    }, 2500);
  });

  // helper global para chamar atualizarHomeEstudo fora do escopo
  function atualizarHomeEstudoSafe(origem) {
    try {
      if (window.lioraHardReset) {
        // não reseta, só tenta atualizar a home
      }
      if (window.lioraEstudos) {
        // truque: dispara evento que já está ligado ao atualizarHomeEstudo
        const evt = new Event("liora:plan-updated");
        window.dispatchEvent(evt);
      } else {
        console.log("ℹ️ atualizarHomeEstudoSafe:", origem, "→ lioraEstudos ainda não disponível.");
      }
    } catch (e) {
      console.warn("Erro em atualizarHomeEstudoSafe:", e);
    }
  }

})();
