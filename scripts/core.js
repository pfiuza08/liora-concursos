// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v26 FINAL)
// Tema / Upload + Plano + Wizard com cards clicáveis + QUIZ animado
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v26...");

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
    // ✅ SISTEMA DE TEMA (LIGHT / DARK)
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
    // ESTADO GLOBAL DO WIZARD
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
    const saveProgress = () => localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    const loadProgress = (tema, nivel) => JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");

    // --------------------------------------------------------
    // ALTERNAR MODO (tema / upload)
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
    // CHAMADA À API DA LIORA
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
    // GERAÇÃO: PLANO DE SESSÕES
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Crie um plano de sessões para o tema "${tema}" (nível: ${nivel}).
Formato: JSON puro, ex:
[
 {"numero":1,"nome":"Fundamentos"},
 {"numero":2,"nome":"Aplicações"}
]`;

      const raw = await callLLM("Você é Liora, especialista em microlearning.", prompt);
      let arr = JSON.parse(raw);

      return arr.map((s, i) => ({
        numero: s.numero ?? i + 1,
        nome: s.nome ?? `Sessão ${i + 1}`,
      }));
    }

    // --------------------------------------------------------
    // GERAÇÃO: SESSÃO COMPLETA
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome) {
      const prompt = `
Gere a sessão ${numero} do tema "${tema}". Retorno JSON exato:
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
    // RENDER PAINEL RESUMO (cards do lado direito)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      if (!plano.length) return;

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
    // ✅ RENDER WIZARD + QUIZ COM ANIMAÇÃO + ÍCONES
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

      // Quiz
      els.wizardQuiz.innerHTML = "";

      const pergunta = document.createElement("p");
      pergunta.className = "mb-2";
      pergunta.textContent = s.quiz.pergunta;
      els.wizardQuiz.appendChild(pergunta);

      const icones = ["⭐", "⚡", "🚀"];

      s.quiz.alternativas.forEach((alt, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `
          <span class="liora-quiz-option-icon">${icones[i] || "?"}</span>
          <input type="radio" name="quiz" value="${i}">
          <span class="liora-quiz-option-text">${alt}</span>
        `;

        opt.addEventListener("click", () => {
          document.querySelectorAll(".liora-quiz-option").forEach(o => o.classList.remove("selected"));
          opt.classList.add("selected");
          opt.querySelector("input").checked = true;

          els.wizardQuizFeedback.textContent =
            i === Number(s.quiz.corretaIndex)
              ? `✅ Correto! ${s.quiz.explicacao}`
              : "❌ Tente novamente.";
        });

        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = s.flashcards
        .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`)
        .join("");
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO DO WIZARD
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
      els.status.textContent = "💾 Progresso salvo!";
      setTimeout(() => (els.status.textContent = ""), 1200);
    });

    els.wizardProxima.addEventListener("click", () => {
      if (wizard.atual >= wizard.sessoes.length - 1) {
        els.status.textContent = "🎉 Tema concluído!";
        return;
      }
      wizard.atual++;
      renderWizard();
      saveProgress();
    });

    // --------------------------------------------------------
    // BOTÃO GERAR — TEMA
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      const cached = loadProgress(tema, nivel);
      if (cached?.sessoes?.length) {
        wizard = cached;
        renderPlanoResumo(wizard.plano);
        renderWizard();
        return;
      }

      els.btnGerar.disabled = true;
      els.ctx.textContent = "🔧 Criando plano...";

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          els.ctx.textContent = `⏳ Sessão ${i + 1}/${plano.length}: ${plano[i].nome}`;
          const sessao = await gerarSessao(tema, nivel, plano[i].numero, plano[i].nome);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        els.ctx.textContent = "✅ Sessões prontas!";
        renderWizard();

      } catch (err) {
        alert("Erro ao gerar o plano.");
      } finally {
        els.btnGerar.disabled = false;
      }
    });

    // --------------------------------------------------------
    // UPLOAD (modo arquivos)
    // --------------------------------------------------------
    els.inpFile.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (f) els.uploadText.textContent = `Selecionado: ${f.name}`;
    });

    els.btnGerarUpload.addEventListener("click", async () => {
      const nivel = els.selNivel.value;
      const file = els.inpFile.files?.[0];
      if (!file) return alert("Selecione um arquivo.");

      if (!window.processarArquivoUpload || !window.generatePlanFromUploadAI) {
        return alert("semantic.js não carregou.");
      }

      els.btnGerarUpload.disabled = true;
      els.statusUpload.textContent = "⏳ Processando arquivo...";
      els.uploadSpinner.style.display = "inline-block";

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
          els.statusUpload.textContent = `⏳ Sessão ${i + 1}/${plano.length}: ${plano[i].nome}`;
          const sessao = await gerarSessao(wizard.tema, nivel, plano[i].numero, plano[i].nome);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        els.statusUpload.textContent = "✅ Sessões prontas!";
        renderWizard();

      } catch (err) {
        alert("Erro ao gerar via upload.");
      } finally {
        els.btnGerarUpload.disabled = false;
        els.uploadSpinner.style.display = "none";
      }
    });

    console.log("🟢 core.js v26 carregado com QUIZ animado + ícones");
  });
})();
