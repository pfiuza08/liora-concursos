// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v21 FINAL)
// Tema / Upload + Sessões no modo WIZARD (sem lista)
// Com validações para evitar erros de elementos inexistentes
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core...");

  document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // MAPA DE ELEMENTOS (todos opcionais para evitar erro)
    // =========================================================
    const els = {
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      themeBtn: document.getElementById("btn-theme"),

      progressBar: document.getElementById("progress-bar"),
      progressFill: document.getElementById("progress-fill"),

      wizardContainer: document.getElementById("liora-sessoes"),
      wizardTema: document.getElementById("liora-tema-ativo"),
      wizardProgressBar: document.getElementById("liora-progress-bar"),
      wizardProgressLabel: document.getElementById("liora-progress-label"),
      wizardTitulo: document.getElementById("liora-sessao-titulo"),
      wizardObjetivo: document.getElementById("liora-sessao-objetivo"),
      wizardConteudo: document.getElementById("liora-sessao-conteudo"),
      wizardAnalogias: document.getElementById("liora-sessao-analogias"),
      wizardAtivacao: document.getElementById("liora-sessao-ativacao"),
      wizardQuiz: document.getElementById("liora-sessao-quiz"),
      wizardQuizFeedback: document.getElementById("liora-sessao-quiz-feedback"),
      wizardFlashcards: document.getElementById("liora-sessao-flashcards"),
      wizardVoltar: document.getElementById("liora-btn-voltar"),
      wizardSalvar: document.getElementById("liora-btn-salvar"),
      wizardProxima: document.getElementById("liora-btn-proxima"),
    };


    // =========================================================
    // ✅ Tema (com fallback)
    // =========================================================
    function aplicarTema(mode) {
      document.documentElement.classList.toggle("light", mode === "light");
      document.body.classList.toggle("light", mode === "light");
      localStorage.setItem("liora_theme", mode);
      els.themeBtn && (els.themeBtn.textContent = mode === "light" ? "☀️" : "🌙");
    }

    els.themeBtn?.addEventListener("click", () => {
      const atual = localStorage.getItem("liora_theme") || "dark";
      aplicarTema(atual === "light" ? "dark" : "light");
    });

    aplicarTema(localStorage.getItem("liora_theme") || "dark");


    // =========================================================
    // ✅ Progress bar
    // =========================================================
    function iniciarProgresso() {
      if (!els.progressBar || !els.progressFill) return null;
      els.progressFill.style.width = "0%";
      els.progressBar.classList.remove("hidden");
      let p = 0;
      return setInterval(() => {
        p += Math.random() * 12;
        if (p > 90) p = 90;
        els.progressFill.style.width = `${p}%`;
      }, 300);
    }

    function finalizarProgresso(ref) {
      if (!ref) return;
      clearInterval(ref);
      els.progressFill.style.width = "100%";
      setTimeout(() => els.progressBar.classList.add("hidden"), 500);
    }


    // =========================================================
    // ✅ Alternância Tema/Upload
    // =========================================================
    els.modoTema?.addEventListener("click", () => {
      els.painelTema?.classList.remove("hidden");
      els.painelUpload?.classList.add("hidden");
    });

    els.modoUpload?.addEventListener("click", () => {
      els.painelUpload?.classList.remove("hidden");
      els.painelTema?.classList.add("hidden");
    });


    // =========================================================
    // ✅ Estado do Wizard
    // =========================================================
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0
    };

    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
    const saveProgress = () => localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    const loadProgress = (t, n) => JSON.parse(localStorage.getItem(key(t, n)) || "null");


    // =========================================================
    // ✅ Força wizard aparecer sempre
    // =========================================================
    function ensureWizardVisible() {
      if (!els.wizardContainer) return;

      els.wizardContainer.style.display = "flex";
      els.wizardContainer.style.flexDirection = "column";
      els.wizardContainer.style.maxWidth = "900px";
      els.wizardContainer.style.margin = "0 auto";
    }


    // =========================================================
    // ✅ API Liora
    // =========================================================
    async function callLLM(system, user) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user })
      });

      const json = await res.json();
      return json.output;
    }


    // =========================================================
    // ✅ Geração do plano
    // =========================================================
    async function gerarPlanoDeSessoes(tema, nivel) {
      const raw = await callLLM(
        "Você é Liora, especialista em microlearning.",
        `Crie um plano de sessões para o tema "${tema}". JSON somente.`
      );
      return JSON.parse(raw);
    }


    // =========================================================
    // ✅ Geração de sessão
    // =========================================================
    async function gerarSessao(tema, nivel, numero, nome) {
      const raw = await callLLM(
        "Você é Liora.",
        `Gere a sessão ${numero}: ${nome}. Formato JSON EXATO.`
      );
      return JSON.parse(raw);
    }


    // =========================================================
    // ✅ Renderização do Wizard
    // =========================================================
  function renderWizard() {
  const s = wizard.sessoes[wizard.atual];
  if (!s) return;

  ensureWizardVisible();

  els.wizardTema?.textContent = wizard.tema || "";
  els.wizardProgressLabel?.textContent = `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`;
  els.wizardProgressBar && (els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`);

  els.wizardTitulo?.textContent = s.titulo || "";
  els.wizardObjetivo?.textContent = s.objetivo || "";

  els.wizardConteudo && (els.wizardConteudo.innerHTML = s.conteudo.map(p => `<p>${p}</p>`).join(""));
  els.wizardAnalogias && (els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join(""));
  els.wizardAtivacao && (els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join(""));

  // Quiz
  if (els.wizardQuiz) {
    els.wizardQuiz.innerHTML = "";
    const quizName = `quiz-${wizard.atual}`;
    s.quiz.alternativas.forEach((alt, i) => {
      const opt = document.createElement("label");
      opt.className = "liora-quiz-option";
      opt.innerHTML = `<input type="radio" name="${quizName}" value="${i}"> ${alt}`;
      opt.onclick = () => {
        els.wizardQuizFeedback.textContent =
          i == s.quiz.corretaIndex ? `✅ Correto! ${s.quiz.explicacao}` : "❌ Tente novamente.";
      };
      els.wizardQuiz.appendChild(opt);
    });
  }

  els.wizardFlashcards && (els.wizardFlashcards.innerHTML = s.flashcards
    .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`).join(""));

  els.wizardContainer?.scrollIntoView({ behavior: "smooth", block: "start" });
}


    // =========================================================
    // ✅ Navegação
    // =========================================================
    els.wizardVoltar?.addEventListener("click", () => {
      wizard.atual--;
      renderWizard();
      saveProgress();
    });

    els.wizardSalvar?.addEventListener("click", () => {
      saveProgress();
      els.status.textContent = "💾 Progresso salvo!";
    });

    els.wizardProxima?.addEventListener("click", () => {
      wizard.atual++;
      renderWizard();
      saveProgress();
    });


    // =========================================================
    // ✅ Botão GERAR
    // =========================================================
    els.btnGerar?.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;

      if (!tema) return alert("Digite um tema.");

      const cached = loadProgress(tema, nivel);
      if (cached) {
        wizard = cached;
        renderWizard();
        return;
      }

      const ref = iniciarProgresso();

      els.ctx.textContent = "🧭 Gerando plano...";

      const plano = await gerarPlanoDeSessoes(tema, nivel);

      wizard = { tema, nivel, plano, sessoes: [], atual: 0 };

      for (const p of plano) {
        els.status.textContent = `🧠 Sessão ${p.numero} — ${p.nome}`;
        const sessao = await gerarSessao(tema, nivel, p.numero, p.nome);
        wizard.sessoes.push(sessao);
        saveProgress();
      }

      finalizarProgresso(ref);
      els.status.textContent = "✅ Sessões prontas!";
      renderWizard();
    });

    console.log("🟢 core.js (v21 FINAL) carregado");
  });

})();
