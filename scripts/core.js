// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v27)
// Tema / Upload + Plano + Wizard com cards clicáveis
// Divider animado automático
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v27...");

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

    // ==========================================================
    // TEMA (LIGHT / DARK)
    // ==========================================================
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

    // ==========================================================
    // ESTADO GLOBAL (sem cache — sempre gerar novo)
    // ==========================================================
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };

    // remover cache
    const loadProgress = () => null;
    const saveProgress = () => {};

    // ==========================================================
    // ALTERNAR MODO (tema / upload)
    // ==========================================================
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

    // ==========================================================
    // CHAMADA À IA
    // ==========================================================
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

    // ==========================================================
    // GERAR PLANO (tema)
    // ==========================================================
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Crie um plano de sessões para o tema "${tema}" (nível: ${nivel}).
Formato JSON:
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

    // ==========================================================
    // GERAR SESSÃO
    // ==========================================================
    async function gerarSessao(tema, nivel, numero, nome) {
      const prompt = `
Gere a sessão ${numero} do tema "${tema}". JSON:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"resultado esperado",
 "conteudo":["p1","p2"],
 "analogias":["a1"],
 "ativacao":["q1","q2"],
 "quiz":{"pergunta":"?","alternativas":["a","b"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}`;

      const raw = await callLLM("Você é Liora.", prompt);
      const s = JSON.parse(raw);

      s.titulo = `Sessão ${numero} — ${(s.titulo || nome).replace(/^Sessão.*—/i, "")}`;
      return s;
    }

    // ==========================================================
    // RENDER PLANO (cards clicáveis)
    // ==========================================================
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

    // ==========================================================
    // RENDER WIZARD (com animação automática do divider)
    // ==========================================================
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

      // QUIZ
      els.wizardQuiz.innerHTML = "";
      s.quiz.alternativas.forEach((alt, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz" value="${i}"><span>${alt}</span>`;
        opt.addEventListener("click", () => {
          els.wizardQuizFeedback.textContent =
            i === Number(s.quiz.corretaIndex)
              ? "Correto"
              : "Tente novamente.";
        });
        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = s.flashcards
        .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`)
        .join("");

      // anima divider automaticamente
      document.querySelectorAll(".liora-block").forEach(block => {
        block.classList.remove("animate-divider");
        setTimeout(() => block.classList.add("animate-divider"), 60);
      });
    }

    // ==========================================================
    // NAVEGAÇÃO
    // ==========================================================
    els.wizardVoltar.addEventListener("click", () => {
      if (wizard.atual > 0) { wizard.atual--; renderWizard(); }
    });

    els.wizardProxima.addEventListener("click", () => {
      if (wizard.atual < wizard.sessoes.length - 1) {
        wizard.atual++;
        renderWizard();
      }
    });

    // ==========================================================
    // BOTÃO GERAR (tema)
    // ==========================================================
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      els.btnGerar.disabled = true;
      els.ctx.textContent = "Gerando plano...";

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          els.ctx.textContent = `Gerando sessão ${i + 1}/${plano.length}...`;
          wizard.sessoes.push(await gerarSessao(tema, nivel, plano[i].numero, plano[i].nome));
        }

        els.ctx.textContent = "";
        renderWizard();

      } catch (err) {
        alert("Erro ao gerar o plano.");
      } finally {
        els.btnGerar.disabled = false;
      }
    });

    // ==========================================================
    // UPLOAD
    // ==========================================================
    els.inpFile.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (f) els.uploadText.textContent = `Selecionado: ${f.name}`;
    });

    console.log("🟢 core.js v27 carregado com animação automática nos dividers");
  });
})();
