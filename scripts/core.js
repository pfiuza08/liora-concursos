// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v49)
// Tema + Upload PDF (até 5MB, apenas PDF)
// - Hierarquia de conteúdo (Introdução, Conceitos, Exemplos, Aplicações, Resumo rápido)
// - Conexão entre sessões
// - Upload usando SOMENTE o conteúdo do PDF (títulos de 1º e 2º nível como sessões)
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v49...");

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
    const saveProgress = () => {
      if (!wizard.tema || !wizard.nivel) return;
      localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    };
    const loadProgress = (tema, nivel) =>
      JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");

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
    // 🧾 EXTRAÇÃO DE TEXTO DO PDF (apenas upload)
// --------------------------------------------------------
    async function extrairTextoPdf(file) {
      // se pdf.js não estiver disponível, cai no fallback
      if (typeof pdfjsLib === "undefined" || !pdfjsLib.getDocument) {
        console.warn("pdfjsLib não disponível; usando file.text() como fallback.");
        return await file.text();
      }

      const url = URL.createObjectURL(file);
      try {
        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        let texto = "";
        const maxPages = Math.min(pdf.numPages, 40); // limite de páginas para não explodir o prompt

        for (let p = 1; p <= maxPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => item.str);
          texto += "\n\n" + strings.join(" ");
        }
        return texto;
      } catch (e) {
        console.error("Erro ao extrair PDF:", e);
        // fallback se algo der errado
        return await file.text();
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    // --------------------------------------------------------
    // GERAÇÃO DE PLANO (TEMA ou UPLOAD)
//   - origem: "tema" | "upload"
//   - textoBase: usado apenas em upload (conteúdo do PDF)
// --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel, { origem = "tema", textoBase = "" } = {}) {
      if (origem === "upload") {
        const material = (textoBase || "").slice(0, 16000); // recorta para não ficar gigante
        const prompt = `
Você é uma tutora especialista em transformar apostilas em planos de estudo.

Use APENAS o material entre <<<MATERIAL>>> para montar o plano.
Não invente tópicos que não existam de forma direta ou indireta.
Considere apenas títulos e seções que pareçam de 1º ou 2º nível (ex.: "1. Introdução", "1.1 Conceitos Básicos", "CAPÍTULO 2 – ...", "UNIDADE 3", etc.).

<<<MATERIAL>>>
${material}
<<<FIM DO MATERIAL>>>

Monte um plano de estudo com poucas sessões bem estruturadas (de 4 a 12 sessões, se o material permitir), onde:

- Títulos de 1º e 2º nível viram sessões.
- Títulos de nível mais profundo (3 em diante) ficam dentro da sessão correspondente.
- Cada sessão deve avançar a complexidade de forma contínua.

Responda em JSON puro (sem comentários), como um array:
[
  {"numero":1,"nome":"Título da primeira sessão"},
  {"numero":2,"nome":"Título da segunda sessão"}
]`;
        const raw = await callLLM(
          "Você é Liora, especialista em microlearning a partir de apostilas em PDF.",
          prompt
        );
        return JSON.parse(raw);
      }

      // ===== modo TEMA (sem upload) — comportamento que já funcionava, com prompt mais denso =====
      const promptTema = `
Crie um plano de sessões para o tema "${tema}" (nível: ${nivel}).

Objetivo:
- Dividir o tema em uma sequência lógica de 4 a 10 sessões.
- Começar do mais introdutório e avançar progressivamente.
- Preparar o terreno para que cada sessão possa virar uma "mini aula" completa depois.

Responda em JSON puro (sem comentários), como um array:
[
  {"numero":1,"nome":"Fundamentos do tema"},
  {"numero":2,"nome":"Conceitos essenciais e terminologia"},
  {"numero":3,"nome":"Aplicações práticas iniciais"}
]`;
      const rawTema = await callLLM(
        "Você é Liora, especialista em microlearning e organização de planos de estudo.",
        promptTema
      );
      return JSON.parse(rawTema);
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO — HIERARQUIA + CONTEXTO
    //   origem: "tema" | "upload"
//   textoBase: opcional, para upload (conteúdo do PDF)
// --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, sessaoAnterior = null, { origem = "tema", textoBase = "" } = {}) {
      const resumoAnterior = sessaoAnterior
        ? `Na sessão anterior, o foco foi "${sessaoAnterior.nome}". Agora avance para "${nome}", evitando repetição e aprofundando o tema.`
        : `Esta é a primeira sessão do tema "${tema}". Comece de forma introdutória, situando o aluno.`;

      let contextoMaterial = "";
      if (origem === "upload" && textoBase) {
        const trecho = textoBase.slice(0, 16000);
        contextoMaterial = `
Use exclusivamente o seguinte material como base para o conteúdo desta sessão.
Não invente definições ou exemplos que não possam ser inferidos do material.

<<<MATERIAL>>>
${trecho}
<<<FIM DO MATERIAL>>>`;
      }

      const prompt = `
${resumoAnterior}
${contextoMaterial}

Crie o conteúdo COMPLETO de uma sessão de estudo, bem detalhada, estruturada em:

- Introdução (1 parágrafo que contextualiza o aluno)
- Conceitos principais (3 a 6 itens explicados com frases, não apenas termos soltos)
- Exemplos (2 a 4 exemplos práticos, próximos da realidade do aluno)
- Aplicações (2 a 4 aplicações práticas, mostrando onde aquilo é útil)
- Resumo rápido (1 parágrafo curto com os pontos-chave que o aluno precisa reter)

Formato de saída: JSON puro (sem comentários), exatamente neste formato:

{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"descrição clara do que o aluno será capaz de compreender ao final",
 "conteudo":{
   "introducao":"texto corrido com 1 parágrafo explicando o foco da sessão",
   "conceitos":[
     "conceito 1 explicado com frase completa",
     "conceito 2 explicado com frase completa"
   ],
   "exemplos":[
     "exemplo prático 1 explicado",
     "exemplo prático 2 explicado"
   ],
   "aplicacoes":[
     "aplicação prática 1 explicada",
     "aplicação prática 2 explicada"
   ],
   "resumoRapido":"parágrafo curto recapitulando o essencial da sessão"
 },
 "analogias":[
   "analogia 1 conectando o conceito com algo cotidiano",
   "analogia 2 se necessário"
 ],
 "ativacao":[
   "pergunta reflexiva 1",
   "pergunta de aplicação ou reflexão 2"
 ],
 "quiz":{
   "pergunta":"pergunta objetiva de verificação",
   "alternativas":[
     "alternativa A",
     "alternativa B",
     "alternativa C"
   ],
   "corretaIndex":0,
   "explicacao":"explique por que a alternativa correta é correta"
 },
 "flashcards":[
   {"q":"pergunta curta 1","a":"resposta objetiva 1"},
   {"q":"pergunta curta 2","a":"resposta objetiva 2"}
 ]
}`;
      const raw = await callLLM(
        "Você é Liora, tutora especializada em microlearning, que cria sessões densas e didáticas a partir de temas ou apostilas PDF.",
        prompt
      );
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
    // RENDERIZAÇÃO DO WIZARD (conteúdo hierárquico + separadores)
// --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      // limpa feedback do quiz ao trocar de sessão
      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;
      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;

      const c = s.conteudo || {};
      els.wizardConteudo.innerHTML = `
        ${c.introducao ? `<div class="liora-section">
          <h5>INTRODUÇÃO</h5>
          <p>${c.introducao}</p>
        </div><hr class="liora-divider">` : ""}

        ${c.conceitos ? `<div class="liora-section">
          <h5>CONCEITOS PRINCIPAIS</h5>
          <ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul>
        </div><hr class="liora-divider">` : ""}

        ${c.exemplos ? `<div class="liora-section">
          <h5>EXEMPLOS</h5>
          <ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul>
        </div><hr class="liora-divider">` : ""}

        ${c.aplicacoes ? `<div class="liora-section">
          <h5>APLICAÇÕES</h5>
          <ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul>
        </div><hr class="liora-divider">` : ""}

        ${c.resumoRapido ? `<div class="liora-section">
          <h5>RESUMO RÁPIDO</h5>
          <p>${c.resumoRapido}</p>
        </div>` : ""}
      `;

      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      // QUIZ (com embaralhamento, mantendo o que já funcionava)
      els.wizardQuiz.innerHTML = "";
      const pergunta = document.createElement("p");
      pergunta.textContent = s.quiz.pergunta;
      els.wizardQuiz.appendChild(pergunta);

      const alternativas = s.quiz.alternativas.map((alt, i) => ({
        texto: String(alt).replace(/\n/g, " ").replace(/<\/?[^>]+(>|$)/g, ""),
        correta: i === Number(s.quiz.corretaIndex),
      }));

      // Fisher–Yates shuffle
      for (let i = alternativas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
      }

      let tentativasErradas = 0;

      alternativas.forEach((altObj, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `
          <input type="radio" name="quiz" value="${i}">
          <span class="liora-quiz-option-text">${altObj.texto}</span>
        `;
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
      } else {
        atualizarStatus("tema", "Tema concluído!", 100);
      }
    });

    // --------------------------------------------------------
    // FLUXO ÚNICO DE GERAÇÃO (Tema e Upload)
//   - modo: "tema" | "upload"
//   - textoBase: usado em upload (conteúdo do PDF)
// --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo, textoBase = "") {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;
      btn.disabled = true;
      atualizarStatus(modo, "Criando plano...", 0);

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel, {
          origem: modo,
          textoBase,
        });

        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          const sessaoAnterior = i > 0 ? plano[i - 1] : null;
          atualizarStatus(
            modo,
            `Gerando sessão ${i + 1}/${plano.length}: ${plano[i].nome}`,
            ((i + 1) / plano.length) * 100
          );

          const sessao = await gerarSessao(
            tema,
            nivel,
            i + 1,
            plano[i].nome,
            sessaoAnterior,
            { origem: modo, textoBase }
          );
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus(modo, "Sessões concluídas!", 100);
        renderWizard();

      } catch (err) {
        console.error(err);
        alert("Erro ao gerar o plano.");
      } finally {
        btn.disabled = false;
      }
    }

    // --------------------------------------------------------
    // BOTÃO GERAR — TEMA
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      // tenta reaproveitar se já existir no localStorage
      const cached = loadProgress(tema, nivel);
      if (cached?.sessoes?.length) {
        wizard = cached;
        renderPlanoResumo(wizard.plano);
        renderWizard();
        return;
      }

      gerarFluxo(tema, nivel, "tema");
    });

    // --------------------------------------------------------
    // BOTÃO GERAR — UPLOAD (PDF APENAS, máx. 5MB)
// --------------------------------------------------------
    const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB

    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;

      if (!file) return alert("Selecione um arquivo PDF.");
      const name = file.name.toLowerCase();

      if (!name.endsWith(".pdf")) {
        return alert("Nesta versão, a Liora aceita apenas arquivos PDF (.pdf).");
      }

      if (file.size > MAX_PDF_SIZE) {
        return alert("Arquivo muito grande. Use um PDF de até 5MB.");
      }

      atualizarStatus("upload", "Lendo PDF...", 5);

      const textoBase = await extrairTextoPdf(file);
      if (!textoBase || textoBase.trim().length < 200) {
        return alert("Não foi possível ler conteúdo suficiente do PDF. Verifique o arquivo.");
      }

      const tema = file.name.replace(/\.pdf$/i, "");
      gerarFluxo(tema, nivel, "upload", textoBase);
    });

    // --------------------------------------------------------
    // Atualiza nome do arquivo no label
    // --------------------------------------------------------
    els.inpFile.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const uploadText = document.getElementById("upload-text");
      const spinner = document.getElementById("upload-spinner");
      if (uploadText) {
        uploadText.textContent = file
          ? `Selecionado: ${file.name}`
          : "Clique ou arraste um arquivo (.pdf)";
      }
      if (spinner) spinner.style.display = "none";
    });

    console.log("🟢 core.js v49 carregado com sucesso");
  });
})();
