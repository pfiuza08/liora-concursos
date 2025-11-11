// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v28)
// Tema / Upload + Plano + Wizard + Divider animado
// Barra de progresso restaurada + Upload corrigido
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v28...");

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

    // ===============================================
    // Tema (dark/light)
    // ===============================================
    (function themeSetup() {
      const apply = theme => {
        document.documentElement.classList.remove("light", "dark");
        document.body.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.body.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      };
      apply(localStorage.getItem("liora_theme") || "dark");
      els.themeBtn.addEventListener("click", () =>
        apply(document.documentElement.classList.contains("light") ? "dark" : "light")
      );
    })();


    // ===============================================
    // Estado global (SEM cache local)
    // ===============================================
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };


    // ===============================================
    // Alternar modo
    // ===============================================
    const setMode = mode => {
      const tema = mode === "tema";
      els.painelTema.classList.toggle("hidden", !tema);
      els.painelUpload.classList.toggle("hidden", tema);
      els.modoTema.classList.toggle("selected", tema);
      els.modoUpload.classList.toggle("selected", !tema);
    };
    els.modoTema.addEventListener("click", () => setMode("tema"));
    els.modoUpload.addEventListener("click", () => setMode("upload"));
    setMode("tema");


    // ===============================================
    // Chamada à IA (API)
    // ===============================================
    async function callLLM(system, user) {
      const r = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user }),
      });
      const json = await r.json().catch(() => ({}));
      if (!json.output) throw new Error("Resposta inválida da IA");
      return json.output;
    }


    // ===============================================
    // Geração do plano
    // ===============================================
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Crie um plano de sessões para o tema "${tema}" (nível: ${nivel}).
JSON:
[
  {"numero":1,"nome":"Fundamentos"},
  {"numero":2,"nome":"Aplicações"}
]`;

      const raw = await callLLM("Você é Liora, especialista em microlearning.", prompt);
      return JSON.parse(raw);
    }


    // ===============================================
    // Geração de sessão
    // ===============================================
    async function gerarSessao(tema, nivel, numero, nome) {
      const raw = await callLLM("Você é Liora.", `
Gere a sessão ${numero} do tema "${tema}".
JSON:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"resultado esperado",
 "conteudo":["p1","p2"],
 "analogias":["a1"],
 "ativacao":["q1","q2"],
 "quiz":{"pergunta":"?","alternativas":["a","b"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}`);

      const s = JSON.parse(raw);
      s.titulo = `Sessão ${numero} — ${(s.titulo || nome).replace(/^Sessão.*—/i, "")}`;
      return s;
    }


    // ===============================================
    // Render painel com cards
    // ===============================================
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      plano.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.textContent = `Sessão ${index + 1} — ${p.nome}`;
        div.onclick = () => {
          wizard.atual = index;
          renderWizard();
          window.scrollTo({ top: els.wizardContainer.offsetTop - 20, behavior: "smooth" });
        };
        els.plano.appendChild(div);
      });
    }


    // ===============================================
    // Render Wizard (com animação do divider)
    // ===============================================
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      els.wizardContainer.classList.remove("hidden");

      els.wizardTema.textContent = wizard.tema;
      els.wizardProgressLabel.textContent = `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`;
      els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;
      els.wizardConteudo.innerHTML = s.conteudo.map(p => `<p>${p}</p>`).join("");
      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      els.wizardQuiz.innerHTML = s.quiz.alternativas
        .map((alt, i) => `<label class="liora-quiz-option">
          <input type="radio" name="quiz" value="${i}">
          <span>${alt}</span>
        </label>`)
        .join("");

      els.wizardFlashcards.innerHTML = s.flashcards
        .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`)
        .join("");

      // anima automaticamente os dividers
      document.querySelectorAll(".liora-block").forEach(block => {
        block.classList.remove("animate-divider");
        setTimeout(() => block.classList.add("animate-divider"), 80);
      });
    }


    // ===============================================
    // Navegação Wizard
    // ===============================================
    els.wizardVoltar.onclick = () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
      }
    };
    els.wizardProxima.onclick = () => {
      if (wizard.atual < wizard.sessoes.length - 1) {
        wizard.atual++;
        renderWizard();
      }
    };


    // ===============================================
    // BOTÃO GERAR (tema) — agora com barra de progresso
    // ===============================================
 // ===============================================
// BOTÃO GERAR (tema) — agora com progresso visual
// ===============================================
els.btnGerar.onclick = async () => {
  const tema = els.inpTema.value.trim();
  const nivel = els.selNivel.value;
  if (!tema) return alert("Digite um tema.");

  els.btnGerar.disabled = true;
  els.ctx.textContent = "Criando plano de estudo...";

  const progressWrapper = document.getElementById("liora-generating-progress");
  const progressBar = document.getElementById("liora-generating-progress-bar");

  progressWrapper.style.display = "block";
  progressBar.style.width = "0%";

  try {
    const plano = await gerarPlanoDeSessoes(tema, nivel);
    wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
    renderPlanoResumo(plano);

    for (let i = 0; i < plano.length; i++) {
      const perc = ((i + 1) / plano.length) * 100;
      progressBar.style.width = perc + "%";

      els.ctx.textContent = `Gerando sessão ${i + 1}/${plano.length}`;

      const sessao = await gerarSessao(tema, nivel, plano[i].numero, plano[i].nome);
      wizard.sessoes.push(sessao);
    }

    progressBar.style.width = "100%";
    els.ctx.textContent = "";

    // Só renderiza agora, quando tudo estiver completo
    renderWizard();

  } catch (err) {
    console.error(err);
    alert("Erro ao gerar o plano.");
  } finally {
    setTimeout(() => {
      progressWrapper.style.display = "none";
      progressBar.style.width = "0%";
    }, 500);

    els.btnGerar.disabled = false;
  }
};



    // ===============================================
    // UPLOAD (corrigido)
    // ===============================================
    els.inpFile.addEventListener("change", e => {
      const f = e.target.files?.[0];
      if (f) els.uploadText.textContent = `Selecionado: ${f.name}`;
    });

    els.btnGerarUpload.onclick = async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;
      if (!file) return alert("Selecione um arquivo.");

      els.statusUpload.textContent = "Processando arquivo...";
      els.uploadSpinner.style.display = "inline-block";

      try {
        await window.processarArquivoUpload(file);   // (vem do semantic.js)
        const out = await window.generatePlanFromUploadAI(nivel);

        const plano = (out.sessoes ?? out.plano).map((s, i) => ({
          numero: s.numero ?? i + 1,
          nome: s.nome ?? s.titulo,
        }));

        wizard = { tema: file.name, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          els.statusUpload.textContent = `Criando sessão ${i + 1}/${plano.length}`;
          wizard.sessoes.push(await gerarSessao(wizard.tema, nivel, plano[i].numero, plano[i].nome));
        }

        els.statusUpload.textContent = "";
        renderWizard();

      } catch (err) {
        alert("Erro no upload.");
      } finally {
        els.uploadSpinner.style.display = "none";
      }
    };

    console.log("🟢 core.js v28 carregado");
  });
})();
