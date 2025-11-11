// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v31)
// IA decide número de sessões via upload (conteúdo real)
// Correção de duplicações "Sessão X — Sessão X — Nome"
// Quiz corrigido + barra de progresso + animação
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v31...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // MAPA DE ELEMENTOS
    // --------------------------------------------------------
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

    // --------------------------------------------------------
    // BARRA DE PROGRESSO (cria se não existir)
    // --------------------------------------------------------
    let progressWrapper = document.getElementById("liora-generating-progress");
    let progressBar = document.getElementById("liora-generating-progress-bar");

    if (!progressWrapper) {
      progressWrapper = document.createElement("div");
      progressWrapper.id = "liora-generating-progress";
      progressWrapper.innerHTML = `<div id="liora-generating-progress-bar"></div>`;
      progressWrapper.style.display = "none";
      els.ctx.parentElement.appendChild(progressWrapper);
      progressBar = progressWrapper.querySelector("#liora-generating-progress-bar");
    }

    function showProgress(percent = 0) {
      progressWrapper.style.display = "block";
      progressBar.style.width = `${percent}%`;
    }
    function hideProgress() {
      setTimeout(() => {
        progressWrapper.style.display = "none";
        progressBar.style.width = "0%";
      }, 600);
    }

    // --------------------------------------------------------
    // THEME (LIGHT/DARK)
    // --------------------------------------------------------
    (function themeSetup() {
      function apply(theme) {
        document.documentElement.classList.remove("light", "dark");
        document.body.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.body.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      }
      apply(localStorage.getItem("liora_theme") || "dark");
      els.themeBtn.addEventListener("click", () => {
        const newMode = document.documentElement.classList.contains("light") ? "dark" : "light";
        apply(newMode);
      });
    })();

    // --------------------------------------------------------
    // ESTADO GLOBAL (não reaproveitar sessões antigas)
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };

    // --------------------------------------------------------
    // SET MODE (Tema / Upload)
    // --------------------------------------------------------
    function setMode(mode) {
      const tema = mode === "tema";
      els.painelTema.classList.toggle("hidden", !tema);
      els.painelUpload.classList.toggle("hidden", tema);
      els.modoTema.classList.toggle("selected", tema);
      els.modoUpload.classList.toggle("selected", !tema);
    }
    els.modoTema?.addEventListener("click", () => setMode("tema"));
    els.modoUpload?.addEventListener("click", () => setMode("upload"));
    setMode("tema");

    // --------------------------------------------------------
    // HELPERS: IA + JSON Sanitizer
    // --------------------------------------------------------
    async function callLLM(system, user) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user }),
      });
      const json = await res.json().catch(() => ({}));
      if (!json.output) throw new Error("Resposta inválida da IA");
      return json.output;
    }

    function cleanJSON(raw) {
      if (!raw) return "";
      return raw.trim().replace(/^[^(\[{]*/, "").replace(/([^}\]]*)$/, "");
    }

    async function parseJSONorRetry(rawGen, retries = 2) {
      for (let i = 0; i <= retries; i++) {
        try {
          const raw = await rawGen(i);
          return JSON.parse(cleanJSON(raw));
        } catch (e) {
          console.warn("⚠️ JSON inválido, tentando novamente…");
        }
      }
      throw new Error("JSON não pôde ser interpretado.");
    }

    // --------------------------------------------------------
    // FUNÇÃO: normalizar título
    // --------------------------------------------------------
    function normalizarTituloSessao(numero, titulo, fallback) {
      let t = titulo || fallback || "";

      t = t.replace(/Sess[aã]o\s*\d+\s*[—-]\s*/gi, "");
      t = t.replace(/Sess[aã]o\s*\d+/gi, "").trim();
      t = t.replace(/^[—–-]+/, "").trim();

      return `Sessão ${numero} — ${t}`;
    }

    // --------------------------------------------------------
    // GERAÇÃO DO PLANO (TEMA)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      return await parseJSONorRetry(async () =>
        callLLM(
          "Você é LIORA, especialista em microlearning.",
          `Tema: "${tema}" — nível ${nivel}.
          Crie de 4 a 10 sessões. Retorne SOMENTE JSON:
          [
            {"nome":"Fundamentos"},
            {"nome":"Aplicações"}
          ]`
        )
      ).then(arr =>
        arr.map((s, i) => ({
          numero: i + 1,
          nome: s.nome?.replace(/Sess[aã]o\s*\d+\s*[—-]\s*/gi, "").trim(),
        }))
      );
    }

    // --------------------------------------------------------
    // GERAÇÃO DO PLANO (UPLOAD — IA decide)
    // --------------------------------------------------------
    async function gerarPlanoViaUpload(nivel, uploadOut) {
      const texto = (uploadOut?.texto || uploadOut?.text || "").slice(0, 1500);

      return await parseJSONorRetry(async () =>
        callLLM(
          "Você é LIORA, especialista em microlearning.",
          `Você receberá parte do material enviado pelo usuário.
           Analise o conteúdo e DIVIDA o aprendizado em sessões (4 a 12 sessões).
           Priorize lógica pedagógica (progressão do conhecimento).
           Retorne SOMENTE JSON: [{"nome":"..."}]
           
           Conteúdo:
           """${texto}"""`
        )
      ).then(arr =>
        arr.map((s, i) => ({
          numero: i + 1,
          nome: s.nome?.replace(/Sess[aã]o\s*\d+\s*[—-]\s*/gi, "").trim(),
        }))
      );
    }

    // --------------------------------------------------------
    // GERAR SESSÃO COMPLETA
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome) {
      return await parseJSONorRetry(
        async () =>
          callLLM(
            "Você é LIORA.",
            `Gere a sessão ${numero} do tema "${tema}".
             Formato obrigatório (SOMENTE JSON):
             {
               "titulo":"Sessão ${numero} — ${nome}",
               "objetivo":"...",
               "conteudo":["..."],
               "analogias":["..."],
               "ativacao":["..."],
               "quiz":{"pergunta":"?","alternativas":["a","b","c"],"corretaIndex":1,"explicacao":"..."},
               "flashcards":[{"q":"...","a":"..."}]
             }`
          ),
        2
      ).then(parsed => ({
        titulo: normalizarTituloSessao(numero, parsed.titulo, nome),
        objetivo: parsed.objetivo || "",
        conteudo: parsed.conteudo || [],
        analogias: parsed.analogias || [],
        ativacao: parsed.ativacao || [],
        quiz: parsed.quiz || {},
        flashcards: parsed.flashcards || [],
      }));
    }

    // --------------------------------------------------------
    // RENDER: Cards do plano (lado direito)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      plano.forEach((p) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.textContent = `Sessão ${p.numero} — ${p.nome}`;
        div.addEventListener("click", () => {
          wizard.atual = p.numero - 1;
          renderWizard();
        });
        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // RENDER WIZARD + QUIZ
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;
      els.wizardProgressLabel.textContent = `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`;
      els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;
      els.wizardConteudo.innerHTML = s.conteudo.map(p => `<p>${p}</p>`).join("");
      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");
      els.wizardFlashcards.innerHTML = s.flashcards.map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`).join("");

      // QUIZ
      els.wizardQuiz.innerHTML = "";
      els.wizardQuizFeedback.textContent = "";

      if (s.quiz?.alternativas?.length) {
        const pergunta = document.createElement("p");
        pergunta.className = "mb-2 font-semibold";
        pergunta.textContent = s.quiz.pergunta;
        els.wizardQuiz.appendChild(pergunta);

        s.quiz.alternativas.forEach((alt, i) => {
          const opt = document.createElement("div");
          opt.className = "liora-quiz-option";
          opt.innerHTML = `
            <input type="radio" name="quiz-${wizard.atual}" value="${i}" />
            <span class="liora-quiz-option-text">${alt}</span>
          `;
          opt.addEventListener("click", () => {
            els.wizardQuiz.querySelectorAll(".liora-quiz-option").forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");

            if (i === Number(s.quiz.corretaIndex)) {
              els.wizardQuizFeedback.textContent = s.quiz.explicacao;
              els.wizardQuizFeedback.className = "liora-quiz-feedback correct";
            } else {
              els.wizardQuizFeedback.textContent = "Resposta incorreta. Tente novamente.";
              els.wizardQuizFeedback.className = "liora-quiz-feedback error";
            }
          });
          els.wizardQuiz.appendChild(opt);
        });
      }

      // anima divider automática
      document.querySelectorAll(".liora-block").forEach(b => {
        b.classList.remove("animate-divider");
        setTimeout(() => b.classList.add("animate-divider"), 80);
      });
    }

    // --------------------------------------------------------
    // BOTÕES DO WIZARD
    // --------------------------------------------------------
    els.wizardVoltar?.addEventListener("click", () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
      }
    });
    els.wizardProxima?.addEventListener("click", () => {
      if (wizard.atual < wizard.sessoes.length - 1) {
        wizard.atual++;
        renderWizard();
      }
    });
    els.wizardSalvar?.addEventListener("click", () => {
      els.status.textContent = "Progresso salvo.";
      setTimeout(() => (els.status.textContent = ""), 1200);
    });

    // --------------------------------------------------------
    // GERAR — TEMA
    // --------------------------------------------------------
    els.btnGerar?.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      els.btnGerar.disabled = true;
      showProgress(0);

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          showProgress(((i + 1) / plano.length) * 100);
          const sessao = await gerarSessao(tema, nivel, plano[i].numero, plano[i].nome);
          wizard.sessoes.push(sessao);
        }

        renderWizard();
      } catch (err) {
        alert("Erro ao gerar plano via tema.");
      } finally {
        els.btnGerar.disabled = false;
        hideProgress();
      }
    });

    // --------------------------------------------------------
    // GERAR — UPLOAD (IA decide)
    // --------------------------------------------------------
    els.inpFile?.addEventListener("change", e => {
      const f = e.target.files?.[0];
      if (f) els.uploadText.textContent = `Selecionado: ${f.name}`;
    });

    els.btnGerarUpload?.addEventListener("click", async () => {
      const nivel = els.selNivel.value;
      const file = els.inpFile.files?.[0];
      if (!file) return alert("Selecione um arquivo.");

      if (!window.processarArquivoUpload) {
        return alert("semantic.js não carregou.");
      }

      els.btnGerarUpload.disabled = true;
      els.uploadSpinner.style.display = "inline-block";
      showProgress(0);

      try {
        const uploadOut = await window.processarArquivoUpload(file);
        let plano = await gerarPlanoViaUpload(nivel, uploadOut);

        wizard = { tema: file.name, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          showProgress(((i + 1) / plano.length) * 100);
          const sessao = await gerarSessao(wizard.tema, nivel, plano[i].numero, plano[i].nome);
          wizard.sessoes.push(sessao);
        }

        renderWizard();
      } catch (err) {
        console.error(err);
        alert("Erro ao gerar plano via upload.");
      } finally {
        hideProgress();
        els.uploadSpinner.style.display = "none";
        els.btnGerarUpload.disabled = false;
      }
    });

    console.log("🟢 core.js v31 carregado com sucesso");
  });
})();
