(function () {
  console.log("🔵 Inicializando Liora Core v24 CORRIGIDO...");

  document.addEventListener("DOMContentLoaded", () => {

    // -------------------------
    // MAPA DE ELEMENTOS
    // -------------------------
    const els = {
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),

      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      uploadZone: document.getElementById("upload-zone"),
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),
      uploadText: document.getElementById("upload-text"),
      uploadSpinner: document.getElementById("upload-spinner"),

      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

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

      themeBtn: document.getElementById("btn-theme"),
    };

    // -------------------------
    // ⚡ TEMA LIGHT/DARK
    // -------------------------
    (function setupTheme() {
      const applyTheme = (theme) => {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.body.classList.remove("light", "dark");
        document.body.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      };

      const saved = localStorage.getItem("liora_theme");
      applyTheme(saved ?? "dark");

      els.themeBtn?.addEventListener("click", () => {
        const newTheme = document.documentElement.classList.contains("light")
          ? "dark" : "light";
        applyTheme(newTheme);
      });
    })();


    // -------------------------
    // ESTADO DO WIZARD
    // -------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };

    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
    const saveProgress = () =>
      wizard.tema && wizard.nivel &&
      localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));

    const loadProgress = (tema, nivel) =>
      JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");


    // -------------------------
    // ALTERNÂNCIA TEMA / UPLOAD
    // -------------------------
    function setMode(mode) {
      const isTema = mode === "tema";
      els.painelTema.classList.toggle("hidden", !isTema);
      els.painelUpload.classList.toggle("hidden", isTema);
      els.modoTema.classList.toggle("selected", isTema);
      els.modoUpload.classList.toggle("selected", !isTema);
    }
    els.modoTema.addEventListener("click", () => setMode("tema"));
    els.modoUpload.addEventListener("click", () => setMode("upload"));
    setMode("tema");


    // -------------------------
    // API / LLM
    // -------------------------
    async function callLLM(system, user) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user })
      });
      const json = await res.json();
      return json.output;
    }


    // -------------------------
    // GERAÇÃO DO PLANO (sessions list)
    // -------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const raw = await callLLM(
        "Você é Liora, especialista em microlearning.",
        `Crie um plano de estudo do tema "${tema}" (${nivel}). JSON puro, ex:
         [{"numero":1,"nome":"Fundamentos"}]`
      );
      return JSON.parse(raw);
    }

    async function gerarSessao(tema, nivel, numero, nome) {
      const raw = await callLLM(
        "Você é Liora.",
        `Gere a sessão ${numero} do tema "${tema}" (${nivel}) sobre "${nome}". JSON puro.`
      );
      return JSON.parse(raw);
    }


    // -------------------------
    // RESUMO DO PLANO (painel direito)
    // -------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      const ul = document.createElement("ul");
      ul.className = "liora-topico-lista";
      plano.forEach(p => {
        const li = document.createElement("li");
        li.className = "liora-topico-item";
        li.textContent = `Sessão ${p.numero} — ${p.nome}`;
        ul.appendChild(li);
      });
      els.plano.appendChild(ul);
    }


    // -------------------------
    // WIZARD
    // -------------------------
    function ensureWizardVisible() {
      els.wizardContainer.classList.remove("hidden");
      els.wizardContainer.style.display = "block";
    }

    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      ensureWizardVisible();
      els.wizardTema.textContent = wizard.tema;
      els.wizardProgressLabel.textContent = `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`;
      els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;
      els.wizardConteudo.innerHTML = s.conteudo.map(p => `<p>${p}</p>`).join("");
      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");
      els.wizardFlashcards.innerHTML = s.flashcards.map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`).join("");
    }


    // -------------------------
    // NAVIGATION WIZARD
    // -------------------------
    els.wizardVoltar.addEventListener("click", () => {
      wizard.atual--;
      renderWizard();
    });

    els.wizardProxima.addEventListener("click", () => {
      wizard.atual++;
      renderWizard();
    });


    // -------------------------
    // BOTÃO: GERAR (TEMA)
    // -------------------------
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      const cached = loadProgress(tema, nivel);
      if (cached) {
        wizard = cached;
        renderPlanoResumo(wizard.plano);
        renderWizard();
        return;
      }

      els.btnGerar.disabled = true;
      els.ctx.textContent = "🔧 Criando plano...";

      const plano = await gerarPlanoDeSessoes(tema, nivel);
      wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
      renderPlanoResumo(plano);

      let progresso = 0;
      for (const item of plano) {
        progresso++;
        els.ctx.textContent = `⏳ Sessão ${progresso}/${plano.length}: ${item.nome}`;
        const sessao = await gerarSessao(tema, nivel, item.numero, item.nome);
        wizard.sessoes.push(sessao);
        saveProgress();
      }

      els.ctx.textContent = "✅ Sessões prontas!";
      renderWizard();
      els.btnGerar.disabled = false;
    });


  });
})();
