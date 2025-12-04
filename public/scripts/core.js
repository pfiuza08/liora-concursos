// ==========================================================
// 🧠 LIORA — CORE v74-FIXED-COMMERCIAL-PREMIUM-STUDY-MANAGER
// ----------------------------------------------------------
// Correções principais nesta versão:
// ✔ window.wizard agora é sempre a fonte da verdade (global!)
// ✔ Core e Nav-home usam o MESMO wizard (fim da inconsistência)
// ✔ lioraIrParaSessao opera sempre com window.wizard
// ✔ renderWizard usa window.wizard
// ✔ Continue Study funciona 100%
// ✔ Study Manager v2 sincroniza corretamente progresso e revisões
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v74-FIXED...");

  document.addEventListener("DOMContentLoaded", () => {

    // ======================================================
    // 🔥 FIX 1 — WIZARD GLOBAL (fonte única da verdade)
    // ======================================================
    window.wizard = window.wizard || {
      tema: null,
      nivel: null,
      origem: "tema",
      plano: [],
      sessoes: [],
      atual: 0,
    };

    // Alias interno para facilitar
    function W() {
      return window.wizard;
    }

    console.log("🌱 Wizard global inicial:", window.wizard);

    // ======================================================
    // ELEMENTOS DO DOM
    // ======================================================
    const els = {
      plano: document.getElementById("plano"),
      areaPlano: document.getElementById("area-plano"),
      ctx: document.getElementById("ctx"),

      wizardContainer: document.getElementById("liora-sessoes"),
      wizardTema: document.getElementById("liora-tema-ativo"),
      wizardTitulo: document.getElementById("liora-sessao-titulo"),
      wizardObjetivo: document.getElementById("liora-sessao-objetivo"),
      wizardConteudo: document.getElementById("liora-sessao-conteudo"),
      wizardAnalogias: document.getElementById("liora-sessao-analogias"),
      wizardAtivacao: document.getElementById("liora-sessao-ativacao"),
      wizardQuiz: document.getElementById("liora-sessao-quiz"),
      wizardQuizFeedback: document.getElementById("liora-sessao-quiz-feedback"),
      wizardFlashcards: document.getElementById("liora-sessao-flashcards"),
      wizardMapa: document.getElementById("liora-sessao-mapa"),
    };

    // ======================================================
    // RENDERIZAÇÃO DO PLANO (lista lateral)
    // ======================================================
    function renderPlanoResumo(plano) {
      if (!els.plano) return;

      els.plano.innerHTML = "";

      if (!plano || !plano.length) {
        els.plano.innerHTML =
          '<p class="text-sm text-[var(--muted)]">Nenhum plano gerado.</p>';
        return;
      }

      els.areaPlano.classList.remove("hidden");

      plano.forEach((p, index) => {
        const div = document.createElement("button");
        div.type = "button";
        div.className = "liora-card-topico";
        div.dataset.index = index;
        div.textContent = p.titulo || `Sessão ${index + 1}`;

        div.addEventListener("click", () => {
          window.lioraIrParaSessao(index, false);
        });

        els.plano.appendChild(div);
      });

      const cards = els.plano.querySelectorAll(".liora-card-topico");
      cards.forEach((c) => c.classList.remove("active"));
      if (cards[W().atual]) cards[W().atual].classList.add("active");
    }

    // ======================================================
    // CONTEÚDO (premium)
    // ======================================================
    function renderConteudoPremium(conteudo) {
      const el = els.wizardConteudo;
      if (!el) return;

      el.innerHTML = "";

      if (!conteudo) return;

      if (conteudo.introducao) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conteudo-titulo">Introdução</h6>
            <p>${conteudo.introducao}</p>
          </div>
        `;
      }

      if (Array.isArray(conteudo.conceitos)) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Conceitos</h6>
            <ul>${conteudo.conceitos.map((c) => `<li>• ${c}</li>`).join("")}</ul>
          </div>
        `;
      }

      if (Array.isArray(conteudo.exemplos)) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Exemplos</h6>
            <ul>${conteudo.exemplos.map((e) => `<li>• ${e}</li>`).join("")}</ul>
          </div>
        `;
      }

      if (Array.isArray(conteudo.aplicacoes)) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Aplicações</h6>
            <ul>${conteudo.aplicacoes
              .map((a) => `<li>• ${a}</li>`)
              .join("")}</ul>
          </div>
        `;
      }
    }

    // ======================================================
    // RENDERIZAÇÃO DO WIZARD (usando window.wizard sempre)
    // ======================================================
    function renderWizard() {
      const wiz = W();

      if (!wiz.sessoes || !wiz.sessoes.length) {
        els.wizardContainer.classList.add("hidden");
        return;
      }

      els.wizardContainer.classList.remove("hidden");

      const s = wiz.sessoes[wiz.atual];
      if (!s) return;

      els.wizardTema.textContent = wiz.tema;
      els.wizardTitulo.textContent = s.titulo || "";

      // Objetivo
      els.wizardObjetivo.textContent = s.objetivo || "";

      // Conteúdo
      renderConteudoPremium(s.conteudo || {});

      // Analogias
      els.wizardAnalogias.innerHTML = Array.isArray(s.analogias)
        ? s.analogias.map((a) => `<p>• ${a}</p>`).join("")
        : "<p class='liora-muted'>Nenhuma analogia.</p>";

      // Ativação
      els.wizardAtivacao.innerHTML = Array.isArray(s.ativacao)
        ? `<ul>${s.ativacao.map((q) => `<li>${q}</li>`).join("")}</ul>`
        : "<p class='liora-muted'>Nenhuma pergunta de ativação.</p>";

      // Flashcards
      els.wizardFlashcards.innerHTML = Array.isArray(s.flashcards)
        ? s.flashcards
            .map(
              (f, i) => `
        <article class="liora-flashcard">
          <div class="liora-flashcard-q">${f.q || f.pergunta}</div>
          <div class="liora-flashcard-a">${f.a || f.resposta}</div>
        </article>`
            )
            .join("")
        : "<p class='liora-muted'>Nenhum flashcard.</p>";

      // Mapa mental
      els.wizardMapa.textContent = s.mindmap || s.mapaMental || "";

      // Atualiza lista lateral
      renderPlanoResumo(wiz.plano);
    }

    window.lioraRenderWizard = renderWizard;

    // ======================================================
    // ⭐ FIX 2 — JUMP TO SESSION GLOBAL & CORRETO
    // ======================================================
    window.lioraIrParaSessao = function (index, isReview = false) {
      try {
        const wiz = W();

        if (!wiz.sessoes || !wiz.sessoes.length) return;

        const total = wiz.sessoes.length;
        index = Math.max(0, Math.min(index, total - 1));

        wiz.atual = index;
        window.lioraModoRevisao = isReview;

        const s = wiz.sessoes[index];

        // registra abertura no Study Manager
        if (window.lioraEstudos?.registrarAbertura && s?.id) {
          window.lioraEstudos.registrarAbertura(s.id);
        }

        renderWizard();

        // rola até o wizard
        const cont = document.getElementById("liora-sessoes");
        if (cont) {
          window.scrollTo({
            top: cont.offsetTop - 20,
            behavior: "smooth",
          });
        }

      } catch (e) {
        console.error("❌ Erro no jump de sessão:", e);
      }
    };

    console.log("🟢 Liora Core v74-FIXED carregado.");
  });
})();
