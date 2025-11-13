// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v55)
// PDF CLEAN + DETECÇÃO REAL DE CAPÍTULOS + CONTEÚDO COMPLETO
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v55...");

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
    // 🌗 TEMA
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
    // API HELPER
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
    // PDF CLEANER — LIMPA TEXTO BRUTO
    // --------------------------------------------------------
    function limparTextoPDF(texto) {
      return texto
        .replace(/\r/g, " ")
        .replace(/[^\S\r\n]{2,}/g, " ")              // múltiplos espaços
        .replace(/\n\s*\n\s*\n/g, "\n\n")             // quebra tripla -> dupla
        .replace(/\f/g, "\n")                         // form feed
        .replace(/^Página\s+\d+/gim, "")              // remove "Página X"
        .replace(/^\s*\d+\s*$/gm, "")                 // linhas contendo apenas número
        .replace(/ +/g, " ")
        .replace(/\s+$/g, "")
        .trim();
    }

    // --------------------------------------------------------
    // IA: DETECTAR CAPÍTULOS A PARTIR DO TEXTO LIMPO
    // --------------------------------------------------------
    async function detectarCapitulos(texto) {
      const prompt = `
Extraia os capítulos REAIS do conteúdo abaixo.
Ignore:
- autor
- dedicatória
- ficha catalográfica
- rodapés
- numeração de páginas
- sumário reciclado
- tópicos repetidos

Retorne SOMENTE JSON no formato:
[
  {"numero":1, "titulo":"...", "descricao":"uma frase resumindo o capítulo"},
  {"numero":2, "titulo":"...", "descricao":"..."}
]

Texto:
"""${texto}"""`;

      const raw = await callLLM("Você é especialista em análise de estrutura textual.", prompt);
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // IA: GERAR SESSÃO COMPLETA
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, descricaoAnterior = null) {
      const contexto = descricaoAnterior
        ? `A sessão anterior tratou de "${descricaoAnterior}". Avance o conteúdo mantendo continuidade e evitando repetição.`
        : `Esta é a primeira sessão do tema "${tema}".`;

      const prompt = `
${contexto}
Crie uma sessão detalhada em JSON, parecida com uma aula real:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"clareza total do foco da sessão",
 "conteudo":{
   "introducao":"explicação detalhada",
   "conceitos":["explicação completa 1","explicação completa 2","explicação completa 3"],
   "exemplos":["exemplo aplicado 1","exemplo aplicado 2"],
   "aplicacoes":["aplicação útil 1","aplicação útil 2"],
   "resumo":"resumo rápido em poucos pontos"
 },
 "analogias":["analogia clara e útil"],
 "ativacao":["pergunta reflexiva 1","pergunta 2"],
 "quiz":{"pergunta":"?","alternativas":["a","b","c"],"corretaIndex":1,"explicacao":"explicação clara"},
 "flashcards":[{"q":"pergunta 1","a":"resposta 1"}]
}`;

      const raw = await callLLM("Você é Liora, professora especializada.", prompt);
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // RENDER DO PLANO
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      plano.forEach((p, i) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.textContent = `Sessão ${i + 1} — ${p.titulo}`;
        div.addEventListener("click", () => {
          wizard.atual = i;
          renderWizard();
          window.scrollTo({ top: els.wizardContainer.offsetTop - 20, behavior: "smooth" });
        });
        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // RENDER DO WIZARD
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;
      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;

      const c = s.conteudo;

      els.wizardConteudo.innerHTML = `
        <div class="liora-section">
          <h5>Introdução</h5>
          <p>${c.introducao}</p>
        </div><hr class="liora-divider">

        <div class="liora-section">
          <h5>Conceitos Principais</h5>
          <ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul>
        </div><hr class="liora-divider">

        <div class="liora-section">
          <h5>Exemplos</h5>
          <ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul>
        </div><hr class="liora-divider">

        <div class="liora-section">
          <h5>Aplicações</h5>
          <ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul>
        </div><hr class="liora-divider">

        <div class="liora-section">
          <h5>Resumo Rápido</h5>
          <p>${c.resumo}</p>
        </div>
      `;

      // ANALOGIAS / ATIVAÇÃO
      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      // QUIZ
      els.wizardQuiz.innerHTML = "";
      const pEl = document.createElement("p");
      pEl.textContent = s.quiz.pergunta;
      els.wizardQuiz.appendChild(pEl);

      const alternativas = s.quiz.alternativas.map((alt, i) => ({
        texto: alt,
        correta: i === Number(s.quiz.corretaIndex),
      }));

      // embaralhar
      for (let i = alternativas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
      }

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
            } else {
              els.wizardQuizFeedback.textContent = "❌ Tente novamente.";
              els.wizardQuizFeedback.style.color = "var(--muted)";
            }
            els.wizardQuizFeedback.style.transition = "opacity .4s ease";
            els.wizardQuizFeedback.style.opacity = 1;
          }, 100);
        });
        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = s.flashcards
        .map(f => `<li><b>${f.q}</b>: ${f.a}</li>`)
        .join("");

      els.wizardProgressBar.style.width =
        `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
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
      }
    });

    // --------------------------------------------------------
    // FLUXO TEMA
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");
      gerarFluxo(tema, nivel, "tema");
    });

    // --------------------------------------------------------
    // FLUXO UPLOAD
    // --------------------------------------------------------
    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;
      if (!file) return alert("Selecione um arquivo.");

      // limita tamanho
      if (file.size > 15 * 1024 * 1024) return alert("Arquivo muito grande (máximo: 15MB).");

      const tema = file.name.split(".")[0];

      const pdfText = await file.text().catch(() => null);
      if (!pdfText) return alert("Erro lendo o PDF.");

      const textoLimpo = limparTextoPDF(pdfText).slice(0, 15000);

      const capitulos = await detectarCapitulos(textoLimpo).catch(() => null);
      if (!capitulos || !capitulos.length) {
        alert("A IA não conseguiu identificar capítulos.");
        return;
      }

      wizard = {
        tema,
        nivel,
        plano: capitulos,
        sessoes: [],
        atual: 0
      };

      renderPlanoResumo(capitulos);

      for (let i = 0; i < capitulos.length; i++) {
        atualizarStatus("upload", `⏳ Sessão ${i + 1}/${capitulos.length}`, ((i + 1) / capitulos.length) * 100);
        const anterior = i > 0 ? capitulos[i - 1].descricao : null;
        const sessao = await gerarSessao(tema, nivel, i + 1, capitulos[i].titulo, anterior);
        wizard.sessoes.push(sessao);
        saveProgress();
      }

      atualizarStatus("upload", "✅ Sessões concluídas!", 100);
      renderWizard();
    });

    // Atualiza nome do arquivo na UI
    els.inpFile.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const uploadText = document.getElementById("upload-text");
      uploadText.textContent = file ? `Selecionado: ${file.name}` : "Clique ou arraste um arquivo (.pdf)";
    });

    console.log("🟢 core.js v55 carregado com sucesso");
  });
})();
