console.log("🔵 Inicializando Liora Core v37...");

document.addEventListener("DOMContentLoaded", () => {

  const els = {
    modoTema: document.getElementById("modo-tema"),
    modoUpload: document.getElementById("modo-upload"),
    painelTema: document.getElementById("painel-tema"),
    painelUpload: document.getElementById("painel-upload"),

    inpTema: document.getElementById("inp-tema"),
    selNivel: document.getElementById("sel-nivel"),
    btnGerar: document.getElementById("btn-gerar"),
    status: document.getElementById("status"),

    inpFile: document.getElementById("inp-file"),
    uploadText: document.getElementById("upload-text"),
    btnGerarUpload: document.getElementById("btn-gerar-upload"),
    statusUpload: document.getElementById("status-upload"),

    plano: document.getElementById("plano"),
    ctx: document.getElementById("ctx"),

    wizardContainer: document.getElementById("liora-sessoes"),
    wizardTema: document.getElementById("liora-tema-ativo"),
    wizardProgressBar: document.getElementById("liora-progress-bar"),
    wizardTitulo: document.getElementById("liora-sessao-titulo"),
    wizardObjetivo: document.getElementById("liora-sessao-objetivo"),
    wizardConteudo: document.getElementById("liora-sessao-conteudo"),
    wizardAnalogias: document.getElementById("liora-sessao-analogias"),
    wizardAtivacao: document.getElementById("liora-sessao-ativacao"),
    wizardQuiz: document.getElementById("liora-sessao-quiz"),
    wizardQuizFeedback: document.getElementById("liora-sessao-quiz-feedback"),
    wizardFlashcards: document.getElementById("liora-sessao-flashcards"),

    wizardVoltar: document.getElementById("liora-btn-voltar"),
    wizardProxima: document.getElementById("liora-btn-proxima"),
    themeBtn: document.getElementById("btn-theme"),
  };


  // ----------------- THEME -----------------------------
  const theme = localStorage.getItem("liora_theme") || "dark";
  setTheme(theme);

  els.themeBtn.addEventListener("click", () => {
    setTheme(document.documentElement.classList.contains("light") ? "dark" : "light");
  });

  function setTheme(t) {
    document.documentElement.className = t;
    document.body.className = t;
    els.themeBtn.textContent = t === "light" ? "☀️" : "🌙";
    localStorage.setItem("liora_theme", t);
  }


  // ----------------- MODO ------------------------------
  function setMode(mode) {
    els.painelTema.classList.toggle("hidden", mode !== "tema");
    els.painelUpload.classList.toggle("hidden", mode !== "upload");

    els.modoTema.classList.toggle("selected", mode === "tema");
    els.modoUpload.classList.toggle("selected", mode === "upload");
  }
  els.modoTema.addEventListener("click", () => setMode("tema"));
  els.modoUpload.addEventListener("click", () => setMode("upload"));
  setMode("tema");


  // ============================================================
  //  GERAÇÃO VIA TEMA
  // ============================================================
  els.btnGerar.addEventListener("click", async () => {
    const tema = els.inpTema.value.trim();
    const nivel = els.selNivel.value;
    if (!tema) return alert("Digite um tema.");

    els.ctx.textContent = "Gerando plano...";
    els.btnGerar.disabled = true;

    const out = await window.generatePlanFromUploadAI(nivel);
    renderPlano(out);
    els.btnGerar.disabled = false;
  });


  // ============================================================
  //  GERAÇÃO VIA UPLOAD
  // ============================================================
  els.inpFile.addEventListener("change", e => {
    const f = e.target.files?.[0];
    els.uploadText.textContent = f ? f.name : "Clique ou arraste um arquivo";
  });

  els.btnGerarUpload.addEventListener("click", async () => {
    const nivel = els.selNivel.value;
    const file = els.inpFile.files?.[0];
    if (!file) return alert("Selecione um arquivo.");

    els.statusUpload.textContent = "Processando arquivo...";
    els.btnGerarUpload.disabled = true;

    await window.processarArquivoUpload(file);
    const out = await window.generatePlanFromUploadAI(nivel);

    renderPlano(out);
    els.btnGerarUpload.disabled = false;
  });


  // ============================================================
  //  MONTAGEM DO PLANO (cards clicáveis)
  // ============================================================
  function renderPlano(out) {
    wizard = { tema: out.tema, sessoes: [], atual: 0 };

    els.plano.innerHTML = "";
    els.wizardContainer.classList.add("hidden");

    out.sessoes.forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "liora-card-topico";
      div.textContent = `Sessão ${p.numero} — ${p.nome}`;
      div.addEventListener("click", () => showSession(i));
      els.plano.appendChild(div);

      wizard.sessoes.push(p);
    });

    els.ctx.textContent = "";
  }


  // ============================================================
  //  EXIBE SESSÃO
  // ============================================================
  function showSession(i) {
    wizard.atual = i;
    const s = wizard.sessoes[i];

    els.wizardContainer.classList.remove("hidden");

    els.wizardTema.textContent = wizard.tema;
    els.wizardProgressBar.style.width = `${((i + 1) / wizard.sessoes.length) * 100}%`;

    els.wizardTitulo.textContent = s.nome;
    els.wizardObjetivo.textContent = s.objetivo;
    els.wizardConteudo.innerHTML = s.conteudo.map(c => `<p>${c}</p>`).join("");
    els.wizardAnalogias.innerHTML = s.analogias.map(c => `<p>${c}</p>`).join("");
    els.wizardAtivacao.innerHTML = s.ativacao.map(c => `<li>${c}</li>`).join("");

    els.wizardQuiz.innerHTML = "";
    s.quiz.alternativas.forEach((alt, idx) => {
      const opt = document.createElement("div");
      opt.className = "liora-quiz-option";
      opt.textContent = alt;
      opt.onclick = () => {
        els.wizardQuizFeedback.textContent = idx === s.quiz.corretaIndex
          ? "✅ Correto!"
          : "❌ Tente novamente.";
      };
      els.wizardQuiz.appendChild(opt);
    });

    els.wizardFlashcards.innerHTML =
      s.flashcards.map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`).join("");
  }

});
