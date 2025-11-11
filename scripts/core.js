// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v28)
// SEM CACHE DE PLANO → sempre gerar novo
// Versão fixa na tela + barra de progresso + wizard
// ==========================================================
(function () {
  console.log("Liora Core v28 — inicializando...");

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

      progressWrapper: document.getElementById("progress-wrapper"),
      progressBar: document.getElementById("progress-bar"),

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
      buildInfo: document.getElementById("liora-build-info"),
    };


    // --------------------------------------------------------
    // EXIBE A VERSÃO (hash do commit do Vercel)
    // --------------------------------------------------------
    const commit = typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_COMMIT_SHA
      ? process.env.NEXT_PUBLIC_COMMIT_SHA
      : "%NEXT_PUBLIC_COMMIT_SHA%";

    const env = typeof process !== "undefined" && process.env && process.env.VERCEL_ENV
      ? process.env.VERCEL_ENV
      : "local";

    els.buildInfo.textContent = `versão ${String(commit).substring(0, 7)} — ${env}`;


    // --------------------------------------------------------
    // DARK / LIGHT THEME
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
    // ESTADO DO WIZARD
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
    const saveProgress = () => localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));



    // --------------------------------------------------------
    // MODO (Tema / Upload)
    // --------------------------------------------------------
    function setMode(mode) {
      const tema = mode === "tema";
      els.painelTema.classList.toggle("hidden", !tema);
      els.painelUpload.classList.toggle("hidden", tema);
      els.modoTema.classList.toggle("selected", tema);
      els.modoUpload.classList.toggle("selected", !tema);
    }
    els.modoTema.addEventListener("click", () => setMode("tema"));
    els.modoUpload.addEventListener("click", () => setMode("upload"));
    setMode("tema");



    // --------------------------------------------------------
    // API
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


    // --------------------------------------------------------
    // GERAR PLANO
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Crie um plano de sessões para o tema "${tema}" (nível: ${nivel}).
Formato JSON puro:
[
  {"numero":1,"nome":"Fundamentos"},
  {"numero":2,"nome":"Aplicações"}
]`;

      const raw = await callLLM("Você é Liora, especialista em microlearning.", prompt);
      return JSON.parse(raw).map((s, i) => ({
        numero: s.numero ?? i + 1,
        nome: s.nome ?? `Sessão ${i + 1}`,
      }));
    }


    // --------------------------------------------------------
    // GERAR SESSÃO
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome) {
      const prompt = `
Gere a sessão ${numero} do tema "${tema}". Retorno JSON:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"resultado claro",
 "conteudo":["p1","p2"],
 "analogias":["a1"],
 "ativacao":["q1","q2"],
 "quiz":{"pergunta":"?","alternativas":["a","b"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}`;
      const raw = await callLLM("Você é Liora.", prompt);
      const s = JSON.parse(raw);

      s.titulo = `Sessão ${numero} — ${(s.titulo || nome).replace(/^Sessão\s*\d+\s*[—-]\s*/i, "")}`;
      return s;
    }


    // --------------------------------------------------------
    // PAINEL RESUMO (cards)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      plano.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.textContent = `Sessão ${index + 1} — ${p.nome}`;
        div.addEventListener("click", () => {
          wizard.atual = index;
          renderWizard();
          window.scrollTo({ top: els.wizardContainer.offsetTop - 20, behavior: "smooth" });
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

      els.wizardQuiz.innerHTML = "";
      els.wizardQuizFeedback.textContent = "";

      s.quiz.alternativas.forEach((alt, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `
          <input type="radio" name="quiz" value="${i}">
          <span>${alt}</span>
        `;
        opt.addEventListener("change", () => {
          els.wizardQuizFeedback.textContent =
            i === Number(s.quiz.corretaIndex)
              ? `Correto. ${s.quiz.explicacao}`
              : "Tente novamente.";
        });
        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = s.flashcards
        .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`)
        .join("");
    }


    // --------------------------------------------------------
    // WIZARD → NAVEGAÇÃO
    // --------------------------------------------------------
    els.wizardVoltar.addEventListener("click", () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
        saveProgress();
      }
    });

    els.wizardSalvar.addEventListener("click", () => {
      saveProgress();
      els.status.textContent = "Progresso salvo.";
      setTimeout(() => (els.status.textContent = ""), 1200);
    });

    els.wizardProxima.addEventListener("click", () => {
      if (wizard.atual >= wizard.sessoes.length - 1) {
        els.status.textContent = "Tema concluído.";
        return;
      }
      wizard.atual++;
      renderWizard();
      saveProgress();
    });



    // --------------------------------------------------------
    // BOTÃO — GERAR (TEMA)
    // SEM CACHE DO LOCALSTORAGE
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      // 🚫 SEM CACHE: sempre gerar do zero
      localStorage.removeItem(key(tema, nivel));

      els.btnGerar.disabled = true;
      els.progressWrapper.classList.remove("hidden");

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          els.ctx.textContent = `Gerando sessão ${i + 1}/${plano.length}`;
          els.progressBar.style.width = `${((i + 1) / plano.length) * 100}%`;

          const sessao = await gerarSessao(tema, nivel, plano[i].numero, plano[i].nome);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        els.ctx.textContent = "Sessões prontas.";
        renderWizard();
      } catch (err) {
        alert("Erro ao gerar o plano.");
      } finally {
        els.btnGerar.disabled = false;
        setTimeout(() => {
          els.progressWrapper.classList.add("hidden");
          els.progressBar.style.width = "0%";
        }, 900);
      }
    });


    // --------------------------------------------------------
    // BOTÃO — GERAR (UPLOAD)
    // SEM CACHE
    // --------------------------------------------------------
    els.btnGerarUpload.addEventListener("click", async () => {
      const nivel = els.selNivel.value;
      const file = els.inpFile.files?.[0];
      if (!file) return alert("Selecione um arquivo.");

      els.btnGerarUpload.disabled = true;
      els.uploadSpinner.style.display = "inline-block";
      els.progressWrapper.classList.remove("hidden");

      // 🚫 SEM CACHE
      localStorage.removeItem(key(file.name, nivel));

      try {
        await window.processarArquivoUpload(file);
        const out = await window.generatePlanFromUploadAI(nivel);

        const plano = (out?.sessoes || out?.plano || []).map((s, i) => ({
          numero: s.numero ?? i + 1,
          nome: s.nome ?? s.titulo ?? `Sessão ${i + 1}`,
        }));

        wizard = { tema: file.name, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          els.statusUpload.textContent = `Gerando sessão ${i + 1}/${plano.length}`;
          els.progressBar.style.width = `${((i + 1) / plano.length) * 100}%`;

          const sessao = await gerarSessao(wizard.tema, nivel, plano[i].numero, plano[i].nome);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        els.statusUpload.textContent = "Sessões prontas.";
        renderWizard();
      } catch (err) {
        alert("Erro ao gerar via upload.");
      } finally {
        els.btnGerarUpload.disabled = false;
        els.uploadSpinner.style.display = "none";
        setTimeout(() => {
          els.progressWrapper.classList.add("hidden");
          els.progressBar.style.width = "0%";
        }, 900);
      }
    });


    console.log("✅ Liora Core v28 carregado (sem cache)");
  });
})();
