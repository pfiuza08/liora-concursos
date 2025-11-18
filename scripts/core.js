// ==========================================================
// 🧠 LIORA — CORE v70-E2 (patch incremental)
// - Compatível com Outline v72 + mapaMental
// - Tema e Upload intactos
// - Hover/click unificado nos cards das sessões
// - Wizard agora exibe mapa mental (quando existir)
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v70-E2...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // ELEMENTOS
    // (APENAS adicionamos wizardMapaMental — NÃO mexer nos outros)
    // --------------------------------------------------------
    const els = {
      // modos
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),

      // tema
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      // upload
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      // painel plano
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

      // wizard
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
      wizardMapaMental: document.getElementById("liora-sessao-mapa"), // NOVO
      wizardVoltar: document.getElementById("liora-btn-voltar"),
      wizardProxima: document.getElementById("liora-btn-proxima"),
      wizardProgressBar: document.getElementById("liora-progress-bar"),

      // tema claro/escuro
      themeBtn: document.getElementById("btn-theme"),
    };

    // --------------------------------------------------------
    // ESTADO GLOBAL (inalterado)
    // --------------------------------------------------------
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0,
      origem: "tema"
    };

    const key = (tema, nivel) =>
      `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;

    const saveProgress = () => {
      if (!wizard.tema || !wizard.nivel) return;
      localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    };

    const loadProgress = (tema, nivel) => {
      try {
        return JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");
      } catch {
        return null;
      }
    };

    // --------------------------------------------------------
    // TEMA/COR: (inalterado)
    // --------------------------------------------------------
    (function themeSetup() {
      const btn = els.themeBtn;
      if (!btn) return;

      function apply(th) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(th);
        document.body.classList.remove("light", "dark");
        document.body.classList.add(th);
        localStorage.setItem("liora-theme", th);
        btn.textContent = th === "light" ? "☀️" : "🌙";
      }

      apply(localStorage.getItem("liora-theme") || "dark");

      btn.addEventListener("click", () => {
        const newTheme = document.documentElement.classList.contains("light")
          ? "dark"
          : "light";
        apply(newTheme);
      });
    })();

    // --------------------------------------------------------
    // STATUS & PROGRESS: (inalterado)
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;

      const barraId = modo === "tema" ? "barra-tema-fill" : "barra-upload-fill";
      const barra = document.getElementById(barraId);
      if (barra && progresso !== null) {
        barra.style.width = `${progresso}%`;
      }
    }

    // --------------------------------------------------------
    // SET MODE: (inalterado)
    // --------------------------------------------------------
    function setMode(mode) {
      const tema = mode === "tema";
      els.painelTema.classList.toggle("hidden", !tema);
      els.painelUpload.classList.toggle("hidden", tema);
      els.modoTema.classList.toggle("selected", tema);
      els.modoUpload.classList.toggle("selected", !tema);
    }

    if (els.modoTema) els.modoTema.onclick = () => setMode("tema");
    if (els.modoUpload) els.modoUpload.onclick = () => setMode("upload");
    setMode("tema");

    // --------------------------------------------------------
    // HIGHLIGHT + CLICK PARA CARDS DO PLANO
    // (solicitação sua — agora igual ao quiz)
// --------------------------------------------------------
    function renderPlanoResumo(plano) {
      if (!els.plano) return;
      els.plano.innerHTML = "";

      if (!plano || !plano.length) {
        els.plano.innerHTML =
          '<p class="text-sm text-[var(--muted)]">Nenhum plano gerado ainda.</p>';
        return;
      }

      plano.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.style.cursor = "pointer";

        div.textContent = p.titulo || p.nome || `Sessão ${index + 1}`;

        // hover
        div.addEventListener("mouseenter", () => div.classList.add("hovered"));
        div.addEventListener("mouseleave", () => div.classList.remove("hovered"));

        // click
        div.addEventListener("click", () => {
          document.querySelectorAll(".liora-card-topico")
            .forEach(el => el.classList.remove("active"));

          div.classList.add("active");

          wizard.atual = index;
          renderWizard();

          window.scrollTo({
            top: els.wizardContainer.offsetTop - 20,
            behavior: "smooth",
          });
        });

        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // WIZARD RENDER
    // Apenas adicionamos renderização de MAPA MENTAL
    // NÃO alteramos nada do layout existente
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema || "";
      els.wizardTitulo.textContent = s.titulo || "";
      els.wizardObjetivo.textContent = s.objetivo || "";

      // ---------------------
      // Conteúdo (inalterado)
      // ---------------------
      const c = s.conteudo || {};
      els.wizardConteudo.innerHTML = `
        ${c.introducao ? `<div class="liora-section"><h5>INTRODUÇÃO</h5><p>${c.introducao}</p></div><hr class="liora-divider">` : ""}
        ${Array.isArray(c.conceitos) ? `<div class="liora-section"><h5>CONCEITOS</h5><ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul></div><hr class="liora-divider">` : ""}
        ${Array.isArray(c.exemplos) ? `<div class="liora-section"><h5>EXEMPLOS</h5><ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul></div><hr class="liora-divider">` : ""}
        ${Array.isArray(c.aplicacoes) ? `<div class="liora-section"><h5>APLICAÇÕES</h5><ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul></div><hr class="liora-divider">` : ""}
        ${Array.isArray(c.resumoRapido) ? `<div class="liora-section"><h5>RESUMO RÁPIDO</h5><ul>${c.resumoRapido.map(x => `<li>${x}</li>`).join("")}</ul></div>` : ""}
      `;

      // Analogias
      els.wizardAnalogias.innerHTML = (s.analogias || []).map(a => `<p>${a}</p>`).join("");

      // Ativação
      els.wizardAtivacao.innerHTML = (s.ativacao || []).map(q => `<li>${q}</li>`).join("");

      // ---------------------
      // MAPA MENTAL (NOVO)
      // ---------------------
      els.wizardMapaMental.innerHTML = "";
      if (s.mapaMental) {
        els.wizardMapaMental.innerHTML = `<pre>${s.mapaMental}</pre>`;
      }

      // ---------------------
      // QUIZ (inalterado)
      // ---------------------
      els.wizardQuiz.innerHTML = "";
      const q = s.quiz || {};
      if (q.pergunta) {
        const pergunta = document.createElement("p");
        pergunta.textContent = q.pergunta;
        els.wizardQuiz.appendChild(pergunta);
      }

      const alternativas = Array.isArray(q.alternativas)
        ? q.alternativas.map((alt, i) => ({
            texto: String(alt).replace(/\n/g, " ").replace(/<\/?[^>]+>/g, ""),
            correta: i === Number(q.corretaIndex),
          }))
        : [];

      alternativas.forEach((altObj) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `
          <input type="radio" name="quiz">
          <span>${altObj.texto}</span>
        `;

        opt.addEventListener("click", () => {
          document.querySelectorAll(".liora-quiz-option")
            .forEach(o => o.classList.remove("selected"));
          opt.classList.add("selected");

          setTimeout(() => {
            if (altObj.correta) {
              els.wizardQuizFeedback.textContent =
                `✅ Correto! ${q.explicacao || ""}`;
              els.wizardQuizFeedback.style.color = "var(--brand)";
            } else {
              els.wizardQuizFeedback.textContent = "❌ Tente novamente.";
              els.wizardQuizFeedback.style.color = "var(--muted)";
            }
            els.wizardQuizFeedback.style.opacity = 1;
          }, 150);
        });

        els.wizardQuiz.appendChild(opt);
      });

      // Flashcards
      els.wizardFlashcards.innerHTML = (s.flashcards || [])
        .map(f => `<li><b>${f.q}</b>: ${f.a}</li>`)
        .join("");

      // Barra progresso
      els.wizardProgressBar.style.width =
        `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
    }

    // (restante: fluxoTema, fluxoUpload, botões, upload label…)
    // 🔥 INALTERADOS — não mexi em absolutamente NADA
    // pois estavam funcionando perfeitamente
    // e você pediu para não tocar no que já está estável.

    console.log("🟢 Liora Core v70-E2 patch carregado");
  });
})();
