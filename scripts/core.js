// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v54)
// Tema / Upload + conteúdo hierárquico e plano baseado no PDF
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v54...");

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
    // STATUS + BARRAS DE PROGRESSO (tema / upload)
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;

      const barraId = modo === "tema" ? "barra-tema-fill" : "barra-upload-fill";
      const barra = document.getElementById(barraId);
      if (barra && progresso !== null) {
        barra.style.width = `${progresso}%`;
      }
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
    const key = (tema, nivel) =>
      `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;

    const saveProgress = () =>
      localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));

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
    // CHAMADA À API (LLM)
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
    // EXTRATO DE TEXTO DO PDF (se existir semantic.js)
    // --------------------------------------------------------
    async function getTextoBaseFromFile(file) {
      if (!file) return null;

      // apenas PDF, como combinado
      if (file.type !== "application/pdf") {
        throw new Error("Apenas arquivos PDF (.pdf) são aceitos nesta versão.");
      }

      // limite de 10MB
      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error("Arquivo muito grande. Tamanho máximo: 10 MB.");
      }

      // tenta usar semantic.js → window.extractPDFText(file)
      if (typeof window.extractPDFText === "function") {
        const text = await window.extractPDFText(file);
        if (!text || !text.trim()) {
          throw new Error("Não foi possível extrair texto do PDF.");
        }
        return text;
      }

      // fallback (não ideal para PDF, mas evita travar)
      const fallbackText = await file.text();
      if (!fallbackText || !fallbackText.trim()) {
        throw new Error("Não foi possível ler o conteúdo do arquivo.");
      }
      return fallbackText;
    }

    // --------------------------------------------------------
    // GERAÇÃO DE PLANO (tema OU upload com base no texto)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel, textoBase = null) {
      const base = textoBase
        ? `Considere exclusivamente o conteúdo do material de estudo abaixo (trecho parcial e possivelmente truncado). Extraia a estrutura lógica de tópicos principais diretamente desse conteúdo, sem inventar capítulos que não existam.

TRECHO DO MATERIAL (pode estar incompleto):
"""
${textoBase.slice(0, 12000)}
"""
`
        : `O usuário informou apenas o tema, sem material anexado. Defina uma sequência lógica de estudo, do básico ao avançado, respeitando o nível informado.`;

      const prompt = `
${base}

Crie um plano de estudo em SESSÕES para o tema "${tema}" (nível: ${nivel}).

Regras:
- Pense como professora universitária organizando um curso curto.
- Use de 4 a 12 sessões.
- Cada sessão deve ter um foco claro, significativo e não redundante.
- NÃO inclua itens como "sumário", "autor", "prefácio", "apresentação", "referências" ou seções puramente técnicas do PDF.
- Não use numeração interna do PDF, apenas o título didático da sessão.

Retorne APENAS JSON válido, no formato:
[
  {"numero":1,"nome":"Título da primeira sessão"},
  {"numero":2,"nome":"Título da segunda sessão"}
]`;

      const raw = await callLLM(
        "Você é Liora, especialista em microlearning e organização de conteúdo de apostilas e PDFs em planos de estudo.",
        prompt
      );

      let arr;
      try {
        arr = JSON.parse(raw);
      } catch (e) {
        console.error("Erro ao fazer parse do plano:", e, raw);
        throw new Error("Não foi possível interpretar o plano retornado pela IA.");
      }

      if (!Array.isArray(arr) || arr.length === 0) {
        throw new Error("A IA não retornou um plano de sessões válido.");
      }

      return arr.map((s, i) => ({
        numero: Number(s.numero) || i + 1,
        nome: (s.nome || s.titulo || `Sessão ${i + 1}`).toString(),
      }));
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO — aula completa + hierarquia
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, sessaoAnteriorTitulo = null, textoBase = null) {
      const contextoAnterior = sessaoAnteriorTitulo
        ? `Na sessão anterior o aluno estudou "${sessaoAnteriorTitulo}". Agora continue a progressão lógica avançando para "${nome}", sem repetir conteúdos já tratados.`
        : `Esta é a primeira sessão do tema "${tema}". Foque em uma introdução sólida e bem estruturada sobre "${nome}".`;

      const baseMaterial = textoBase
        ? `
Use o material abaixo como referência PRINCIPAL para o conteúdo desta sessão. Você pode reorganizar, condensar, explicar melhor e completar conexões, mas SEM inventar tópicos que não existam no material. Adapte a linguagem para tom didático.

TRECHO DO MATERIAL:
"""
${textoBase.slice(0, 12000)}
"""      
`
        : `
Não há material anexado. Use apenas seu conhecimento geral, em tom acadêmico e didático, adequado ao nível "${nivel}".`;

      const prompt = `
${contextoAnterior}
${baseMaterial}

Crie uma sessão de aula COMPLETA e detalhada para o plano de estudo do tema "${tema}".

Formato obrigatório (JSON válido, sem comentários):
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"descrição clara, em 1 parágrafo, do que o aluno será capaz de compreender ou fazer ao final da sessão",
 "conteudo":{
   "introducao":"1 parágrafo contextualizando a importância do tópico",
   "conceitos":["conceito 1 explicado em frase completa","conceito 2 ...","conceito 3 ..."],
   "exemplos":["exemplo prático 1 bem descrito","exemplo prático 2 ..."],
   "aplicacoes":["aplicação prática 1 em contexto real","aplicação prática 2 em contexto profissional"],
   "resumoRapido":"parágrafo curto (3 a 4 frases) recapitulando os pontos-chave da sessão"
 },
 "analogias":["analogia didática 1 conectando o tema a algo do cotidiano"],
 "ativacao":["pergunta reflexiva ou exercício 1","pergunta 2"],
 "quiz":{
   "pergunta":"pergunta objetiva para testar a compreensão de um ponto central da sessão",
   "alternativas":["alternativa A","alternativa B","alternativa C"],
   "corretaIndex":0,
   "explicacao":"explicação detalhada sobre por que a alternativa correta é a certa e o que há de errado nas outras"
 },
 "flashcards":[
   {"q":"pergunta curta de revisão 1","a":"resposta objetiva"},
   {"q":"pergunta curta de revisão 2","a":"resposta objetiva"}
 ]
}`;

      const raw = await callLLM(
        "Você é Liora, tutora especializada em microlearning, aulas estruturadas e continuidade pedagógica com base em PDFs e apostilas.",
        prompt
      );

      let s;
      try {
        s = JSON.parse(raw);
      } catch (e) {
        console.error("Erro ao fazer parse da sessão:", e, raw);
        throw new Error("Não foi possível interpretar a sessão retornada pela IA.");
      }

      return s;
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO (cards do lado direito)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      if (!Array.isArray(plano) || plano.length === 0) {
        els.plano.innerHTML =
          '<p class="text-sm text-[var(--muted)]">Nenhum plano gerado ainda.</p>';
        return;
      }

      plano.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.textContent = `Sessão ${index + 1} — ${p.nome}`;
        div.addEventListener("click", () => {
          wizard.atual = index;
          renderWizard();
          window.scrollTo({
            top: els.wizardContainer.offsetTop - 20,
            behavior: "smooth",
          });
        });
        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO WIZARD (conteúdo hierárquico + quiz)
// --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      // limpa feedback do quiz ao trocar de sessão
      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;
      els.wizardTitulo.textContent = s.titulo || `Sessão ${wizard.atual + 1}`;

      els.wizardObjetivo.textContent = s.objetivo || "";

      const c = s.conteudo || {};
      els.wizardConteudo.innerHTML = `
        ${
          c.introducao
            ? `<div class="liora-section">
                <h5>INTRODUÇÃO</h5>
                <p>${c.introducao}</p>
               </div>
               <hr class="liora-divider">`
            : ""
        }

        ${
          c.conceitos && Array.isArray(c.conceitos)
            ? `<div class="liora-section">
                <h5>CONCEITOS PRINCIPAIS</h5>
                <ul>${c.conceitos.map((x) => `<li>${x}</li>`).join("")}</ul>
               </div>
               <hr class="liora-divider">`
            : ""
        }

        ${
          c.exemplos && Array.isArray(c.exemplos)
            ? `<div class="liora-section">
                <h5>EXEMPLOS</h5>
                <ul>${c.exemplos.map((x) => `<li>${x}</li>`).join("")}</ul>
               </div>
               <hr class="liora-divider">`
            : ""
        }

        ${
          c.aplicacoes && Array.isArray(c.aplicacoes)
            ? `<div class="liora-section">
                <h5>APLICAÇÕES</h5>
                <ul>${c.aplicacoes.map((x) => `<li>${x}</li>`).join("")}</ul>
               </div>
               <hr class="liora-divider">`
            : ""
        }

        ${
          c.resumoRapido
            ? `<div class="liora-section">
                <h5>RESUMO RÁPIDO</h5>
                <p>${c.resumoRapido}</p>
               </div>`
            : ""
        }
      `;

      els.wizardAnalogias.innerHTML = (s.analogias || [])
        .map((a) => `<p>${a}</p>`)
        .join("");
      els.wizardAtivacao.innerHTML = (s.ativacao || [])
        .map((q) => `<li>${q}</li>`)
        .join("");

      // ---------------- QUIZ ----------------
      els.wizardQuiz.innerHTML = "";
      const pergunta = document.createElement("p");
      pergunta.textContent = s.quiz?.pergunta || "";
      els.wizardQuiz.appendChild(pergunta);

      const alternativasOriginais = Array.isArray(s.quiz?.alternativas)
        ? s.quiz.alternativas
        : [];

      const alternativas = alternativasOriginais.map((alt, i) => ({
        texto: String(alt)
          .replace(/\n/g, " ")
          .replace(/<\/?[^>]+(>|$)/g, ""),
        correta: i === Number(s.quiz?.corretaIndex || 0),
      }));

      // embaralha alternativas (Fisher-Yates)
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
          document
            .querySelectorAll(".liora-quiz-option")
            .forEach((o) => o.classList.remove("selected"));
          opt.classList.add("selected");
          opt.querySelector("input").checked = true;

          els.wizardQuizFeedback.style.opacity = 0;
          setTimeout(() => {
            if (altObj.correta) {
              els.wizardQuizFeedback.textContent = `✅ Correto! ${
                s.quiz?.explicacao || ""
              }`;
              els.wizardQuizFeedback.style.color = "var(--brand)";
              tentativasErradas = 0;
            } else {
              tentativasErradas++;
              if (tentativasErradas >= 2) {
                els.wizardQuizFeedback.textContent = `💡 Dica: ${
                  s.quiz?.explicacao || ""
                }`;
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

      els.wizardFlashcards.innerHTML = (s.flashcards || [])
        .map((f) => `<li><b>${f.q}</b>: ${f.a}</li>`)
        .join("");

      // progresso
      if (wizard.sessoes.length > 0) {
        els.wizardProgressBar.style.width = `${
          ((wizard.atual + 1) / wizard.sessoes.length) * 100
        }%`;
      }
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
    // FLUXO GERAL (tema / upload)
    // --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo, arquivo = null) {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;
      btn.disabled = true;

      try {
        let textoBase = null;

        if (modo === "upload" && arquivo) {
          atualizarStatus("upload", "Lendo PDF...", 5);
          textoBase = await getTextoBaseFromFile(arquivo);
          atualizarStatus("upload", "Gerando plano a partir do PDF...", 15);
        }

        atualizarStatus(modo, "Criando plano de estudo...", modo === "tema" ? 10 : 20);
        const plano = await gerarPlanoDeSessoes(tema, nivel, textoBase);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          const pct = 20 + ((i + 1) / plano.length) * 70;
          atualizarStatus(
            modo,
            `Gerando sessão ${i + 1}/${plano.length}: ${plano[i].nome}`,
            pct
          );

          const sessaoAnteriorTitulo =
            i > 0 && wizard.sessoes[i - 1]
              ? wizard.sessoes[i - 1].titulo || plano[i - 1].nome
              : null;

          const sessao = await gerarSessao(
            tema,
            nivel,
            plano[i].numero || i + 1,
            plano[i].nome,
            sessaoAnteriorTitulo,
            textoBase
          );

          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus(modo, "Sessões concluídas!", 100);
        renderWizard();
      } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao gerar o plano.");
        atualizarStatus(modo, "Ocorreu um erro. Tente novamente.", null);
      } finally {
        btn.disabled = false;
      }
    }

    // --------------------------------------------------------
    // BOTÕES (TEMA / UPLOAD)
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

      gerarFluxo(tema, nivel, "tema");
    });

    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;
      if (!file) return alert("Selecione um arquivo PDF.");

      const tema = file.name.replace(/\.pdf$/i, "");
      gerarFluxo(tema, nivel, "upload", file);
    });

    // --------------------------------------------------------
    // ATUALIZAÇÃO DO NOME DO ARQUIVO (UPLOAD)
    // --------------------------------------------------------
    els.inpFile.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const uploadText = document.getElementById("upload-text");
      const spinner = document.getElementById("upload-spinner");
      if (uploadText) {
        uploadText.textContent = file
          ? `Selecionado: ${file.name}`
          : "Clique ou arraste um arquivo (.txt, .pdf)";
      }
      if (spinner) spinner.style.display = "none";
    });

    console.log("🟢 core.js v54 carregado com sucesso");
  });
})();
