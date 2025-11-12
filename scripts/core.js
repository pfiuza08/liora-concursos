// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v47)
// Estrutura hierárquica de conteúdo + continuidade entre sessões
// Mantém feedback com fade e ajuda inteligente do v46
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v47...");

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

      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      plano: document.getElementById("plano"),
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
      wizardVoltar: document.getElementById("liora-btn-voltar"),
      wizardProxima: document.getElementById("liora-btn-proxima"),
      wizardProgressBar: document.getElementById("liora-progress-bar"),

      themeBtn: document.getElementById("btn-theme"),
    };

    // --------------------------------------------------------
    // 🌗 TEMA (LIGHT / DARK)
    // --------------------------------------------------------
    (function themeSetup() {
      function apply(theme) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.body.classList.remove("light", "dark");
        document.body.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      }
      apply(localStorage.getItem("liora_theme") || "dark");
      els.themeBtn.addEventListener("click", () => {
        const newTheme = document.documentElement.classList.contains("light") ? "dark" : "light";
        apply(newTheme);
      });
    })();

    // --------------------------------------------------------
    // STATUS + PROGRESSO
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;
      const barra = document.getElementById(modo === "tema" ? "barra-tema-fill" : "barra-upload-fill");
      if (barra && progresso !== null) barra.style.width = `${progresso}%`;
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
    const saveProgress = () => localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    const loadProgress = (tema, nivel) => JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");

    // --------------------------------------------------------
    // MODO (TEMA / UPLOAD)
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
    // CHAMADA À API
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
    // GERAÇÃO DE PLANO
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
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO — ESTRUTURA HIERÁRQUICA + CONTEXTO
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, sessaoAnterior = null) {
      const contexto = sessaoAnterior
        ? `Na sessão anterior o aluno aprendeu sobre "${sessaoAnterior.nome}". Agora avance para "${nome}", mantendo coerência e evitando repetição.`
        : `Esta é a primeira sessão do tema "${tema}".`;

      const prompt = `
${contexto}
Crie uma sessão estruturada em JSON:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"clareza sobre o foco da sessão",
 "conteudo":{
   "introducao":"breve introdução ao tópico",
   "conceitos":["conceito 1","conceito 2","conceito 3"],
   "exemplos":["exemplo 1","exemplo 2"],
   "aplicacoes":["aplicação prática 1","aplicação prática 2"]
 },
 "analogias":["comparação didática com algo cotidiano"],
 "ativacao":["pergunta reflexiva 1","pergunta 2"],
 "quiz":{"pergunta":"?","alternativas":["a","b","c"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}`;
      const raw = await callLLM("Você é Liora, tutora especializada em microlearning com continuidade pedagógica.", prompt);
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO
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
// RENDERIZAÇÃO DO WIZARD (v47 — conteúdo hierárquico + separadores)
// --------------------------------------------------------
function renderWizard() {
  const s = wizard.sessoes[wizard.atual];
  if (!s) return;

  // 🔄 Limpa feedback e estado do quiz ao trocar de sessão
  els.wizardQuizFeedback.textContent = "";
  els.wizardQuizFeedback.style.opacity = 0;

  els.wizardContainer.classList.remove("hidden");
  els.wizardTema.textContent = wizard.tema;
  els.wizardTitulo.textContent = s.titulo;
  els.wizardObjetivo.textContent = s.objetivo;


  const c = s.conteudo || {};
  els.wizardConteudo.innerHTML = `
    ${c.introducao ? `<div class="liora-section">
      <h5>Introdução</h5>
      <p>${c.introducao}</p>
    </div><hr class="liora-divider">` : ""}

    ${c.conceitos ? `<div class="liora-section">
      <h5>Conceitos principais</h5>
      <ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul>
    </div><hr class="liora-divider">` : ""}

    ${c.exemplos ? `<div class="liora-section">
      <h5>Exemplos</h5>
      <ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul>
    </div><hr class="liora-divider">` : ""}

    ${c.aplicacoes ? `<div class="liora-section">
      <h5>Aplicações</h5>
      <ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul>
    </div>` : ""}
  `;

  els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
  els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

  // QUIZ
  els.wizardQuiz.innerHTML = "";
  const pergunta = document.createElement("p");
  pergunta.textContent = s.quiz.pergunta;
  els.wizardQuiz.appendChild(pergunta);

  const alternativas = s.quiz.alternativas.map((alt, i) => ({
    texto: String(alt).replace(/\n/g, " ").replace(/<\/?[^>]+(>|$)/g, ""),
    correta: i === Number(s.quiz.corretaIndex),
  }));

  // embaralhar
  for (let i = alternativas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
  }

  let tentativasErradas = 0;

  alternativas.forEach((altObj, i) => {
    const opt = document.createElement("label");
    opt.className = "liora-quiz-option";
    opt.innerHTML = `<input type="radio" name="quiz" value="${i}"><span>${altObj.texto}</span>`;
    opt.addEventListener("click", () => {
      document.querySelectorAll(".liora-quiz-option").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      opt.querySelector("input").checked = true;

      els.wizardQuizFeedback.style.opacity = 0;
      setTimeout(() => {
        if (altObj.correta) {
          els.wizardQuizFeedback.textContent = `✅ Correto! ${s.quiz.explicacao}`;
          els.wizardQuizFeedback.style.color = "var(--brand)";
          tentativasErradas = 0;
        } else {
          tentativasErradas++;
          if (tentativasErradas >= 2) {
            els.wizardQuizFeedback.textContent = `💡 Dica: ${s.quiz.explicacao}`;
            els.wizardQuizFeedback.style.color = "var(--brand)";
          } else {
            els.wizardQuizFeedback.textContent = "❌ Tente novamente.";
            els.wizardQuizFeedback.style.color = "var(--muted)";
          }
        }
        els.wizardQuizFeedback.style.transition = "opacity .4s ease";
        els.wizardQuizFeedback.style.opacity = 1;
      }, 100);
    });
    els.wizardQuiz.appendChild(opt);
  });

  els.wizardFlashcards.innerHTML = s.flashcards.map(f => `<li><b>${f.q}</b>: ${f.a}</li>`).join("");
  els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
}


    // --------------------------------------------------------
    // NAVEGAÇÃO
    // --------------------------------------------------------
    els.wizardVoltar.addEventListener("click", () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
        saveProgress();
      }
    });

    els.wizardProxima.addEventListener("click", () => {
      if (wizard.atual < wizard.sessoes.length - 1) {
        wizard.atual++;
        renderWizard();
        saveProgress();
      } else {
        atualizarStatus("tema", "🎉 Tema concluído!", 100);
      }
    });

    // --------------------------------------------------------
    // FLUXOS DE GERAÇÃO
    // --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo, textoArquivo = null) {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;
      btn.disabled = true;
      atualizarStatus(modo, "🧩 Criando plano...", 0);

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          const sessaoAnterior = i > 0 ? plano[i - 1] : null;
          atualizarStatus(modo, `⏳ Sessão ${i + 1}/${plano.length}: ${plano[i].nome}`, ((i + 1) / plano.length) * 100);
          const sessao = await gerarSessao(tema, nivel, i + 1, plano[i].nome, sessaoAnterior);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus(modo, "✅ Sessões concluídas!", 100);
        renderWizard();

      } catch {
        alert("Erro ao gerar plano.");
      } finally {
        btn.disabled = false;
      }
    }

    // BOTÕES
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");
      gerarFluxo(tema, nivel, "tema");
    });

    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;
      if (!file) return alert("Selecione um arquivo.");
      const tema = file.name.split(".")[0];
      gerarFluxo(tema, nivel, "upload", await file.text());
    });

    // Atualiza nome do arquivo
    els.inpFile.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const uploadText = document.getElementById("upload-text");
      const spinner = document.getElementById("upload-spinner");
      uploadText.textContent = file ? `Selecionado: ${file.name}` : "Clique ou arraste um arquivo (.txt, .pdf)";
      if (spinner) spinner.style.display = "none";
    });

    console.log("🟢 core.js v47 carregado com sucesso");
  });
})();
