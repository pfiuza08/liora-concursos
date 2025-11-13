// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v56)
// PDF com pdf.js + detecção real de capítulos + aulas completas
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v56...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // MAPA DE ELEMENTOS
    // --------------------------------------------------------
    const els = {
      // modos
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),

      // tema
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      // upload
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      // plano
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

      // wizard
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

      // tema UI
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
        if (els.themeBtn) {
          els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
        }
      }
      apply(localStorage.getItem("liora_theme") || "dark");
      if (els.themeBtn) {
        els.themeBtn.addEventListener("click", () => {
          const newTheme = document.documentElement.classList.contains("light") ? "dark" : "light";
          apply(newTheme);
        });
      }
    })();

    // --------------------------------------------------------
    // STATUS + BARRAS DE PROGRESSO
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;

      const barra = document.getElementById(
        modo === "tema" ? "barra-tema-fill" : "barra-upload-fill"
      );
      if (barra && progresso !== null) {
        barra.style.width = `${progresso}%`;
      }
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };

    const key = (tema, nivel) =>
      `liora:wizard:${(tema || "").toLowerCase()}::${(nivel || "").toLowerCase()}`;

    const saveProgress = () => {
      if (!wizard.tema || !wizard.nivel) return;
      localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    };

    const loadProgress = (tema, nivel) => {
      try {
        return JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");
      } catch {
        return null;
      }
    };

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
    // HELPERS — LLM
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

    function safeJSONParse(raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // tenta extrair apenas o primeiro array JSON
        const match = String(raw).match(/\[[\s\S]*\]/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch (e2) {
            console.warn("Falha ao parsear sub-array JSON:", e2);
          }
        }
        console.error("Falha ao parsear JSON bruto:", e);
        return null;
      }
    }

    // --------------------------------------------------------
    // GERAÇÃO DE PLANO — MODO TEMA
    // --------------------------------------------------------
    async function gerarPlanoPorTema(tema, nivel) {
      const prompt = `
Você deve criar um PLANO DE SESSÕES para o tema "${tema}" (nível: ${nivel}).
Cada sessão é um bloco de aula, não muito longa, cobrindo um subtema bem definido.

Retorne SOMENTE JSON, no formato exato:

[
  {"numero":1, "titulo":"título claro da sessão"},
  {"numero":2, "titulo":"..."},
  {"numero":3, "titulo":"..."}
]
`;
      const raw = await callLLM(
        "Você é Liora, especialista em microlearning e planejamento de estudo.",
        prompt
      );
      const arr = safeJSONParse(raw);
      if (!Array.isArray(arr) || !arr.length) {
        throw new Error("Plano de sessões inválido (tema).");
      }
      // normaliza
      return arr.map((s, i) => ({
        numero: s.numero ?? i + 1,
        titulo: s.titulo || s.nome || `Sessão ${i + 1}`,
        descricao: s.descricao || "",
      }));
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO — CONTEÚDO DE AULA COMPLETA
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, tituloSessao, resumoAnterior = null) {
      const contextoAnterior = resumoAnterior
        ? `Na sessão anterior, o aluno estudou: "${resumoAnterior}". Agora avance para o novo tópico sem repetir conteúdo.`
        : `Esta é a primeira sessão do tema "${tema}". Introduza o assunto de forma acessível e progressiva.`;

      const prompt = `
${contextoAnterior}

Crie uma sessão de aula completa em JSON (SEM comentários fora do JSON), no formato:

{
 "titulo":"Sessão ${numero} — ${tituloSessao}",
 "objetivo":"frase clara dizendo o que o aluno será capaz de compreender ou fazer ao final",
 "conteudo":{
   "introducao":"explicação detalhada do contexto e da importância do tópico",
   "conceitos":[
      "conceito 1 explicado de forma completa, com exemplos embutidos",
      "conceito 2 explicado",
      "conceito 3 explicado"
   ],
   "exemplos":[
      "exemplo prático bem descrito",
      "outro exemplo aplicado ao mundo real"
   ],
   "aplicacoes":[
      "aplicação útil 1, relacionando com estudo, profissão ou provas",
      "aplicação útil 2"
   ],
   "resumo":"parágrafo curto recapitulando os pontos-chave da sessão"
 },
 "analogias":[
    "analogia com algo do cotidiano para fixar a ideia principal"
 ],
 "ativacao":[
    "pergunta de reflexão para o aluno relacionar com sua realidade",
    "outra pergunta que estimule recuperação ativa"
 ],
 "quiz":{
    "pergunta":"pergunta objetiva para checar entendimento",
    "alternativas":[
      "alternativa A",
      "alternativa B (correta ou não)",
      "alternativa C"
    ],
    "corretaIndex":1,
    "explicacao":"explique por que a resposta correta é correta e, se possível, corrija os equívocos das outras"
 },
 "flashcards":[
    {"q":"pergunta curta de revisão 1","a":"resposta direta e clara 1"},
    {"q":"pergunta curta 2","a":"resposta 2"}
 ]
}
`;
      const raw = await callLLM(
        "Você é Liora, professora de alto nível, focada em explicações claras e estruturadas.",
        prompt
      );
      const obj = safeJSONParse(raw);
      if (!obj || !obj.conteudo) {
        throw new Error("Sessão inválida.");
      }
      return obj;
    }

    // --------------------------------------------------------
    // PDF HELPERS (UPLOAD)
    // --------------------------------------------------------
    function limparTextoPDF(texto) {
      return String(texto || "")
        .replace(/\r/g, " ")
        .replace(/\f/g, "\n")
        .replace(/[^\S\r\n]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^Página\s+\d+.*$/gim, "")
        .replace(/^\s*\d+\s*$/gm, "")
        .replace(/ +/g, " ")
        .trim();
    }

    async function extrairTextoDePDF(file) {
      if (!window.pdfjsLib) {
        throw new Error("pdfjsLib não está disponível.");
      }
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let texto = "";
      const maxPages = Math.min(pdf.numPages, 40); // segurança
      for (let p = 1; p <= maxPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const strings = content.items.map((it) => it.str).join(" ");
        texto += strings + "\n\n";
        if (texto.length > 20000) break; // corta se exagerar
      }
      return limparTextoPDF(texto).slice(0, 15000);
    }

    async function detectarCapitulos(texto) {
      const prompt = `
Você receberá o texto LIMPO de uma apostila em português.

TAREFA:
- Descobrir os capítulos ou grandes seções de estudo.
- NÃO inclua autor, dedicatória, ficha catalográfica, sumário, índices ou apêndices administrativos.
- Cada item deve representar um BLOCO DE ESTUDO coerente (capítulo ou grande seção).

Retorne SOMENTE JSON, no formato:

[
  {"numero":1, "titulo":"nome do capítulo 1", "descricao":"resumo curto do que é estudado nesse capítulo"},
  {"numero":2, "titulo":"nome do capítulo 2", "descricao":"..."}
]

Texto:
"""${texto}"""
`;
      const raw = await callLLM(
        "Você é especialista em organização de conteúdo didático.",
        prompt
      );
      const arr = safeJSONParse(raw);
      if (!Array.isArray(arr) || !arr.length) {
        throw new Error("Nenhum capítulo identificado.");
      }
      return arr.map((c, i) => ({
        numero: c.numero ?? i + 1,
        titulo: c.titulo || c.nome || `Capítulo ${i + 1}`,
        descricao: c.descricao || "",
      }));
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      if (!plano || !plano.length) {
        els.plano.innerHTML = `<p class="text-xs text-[var(--muted)]">Nenhum plano gerado ainda.</p>`;
        return;
      }

      plano.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.textContent = `Sessão ${index + 1} — ${p.titulo}`;
        div.addEventListener("click", () => {
          wizard.atual = index;
          renderWizard();
          window.scrollTo({ top: els.wizardContainer.offsetTop - 20, behavior: "smooth" });
        });
        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO WIZARD
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

      const c = s.conteudo || {
        introducao: "",
        conceitos: [],
        exemplos: [],
        aplicacoes: [],
        resumo: "",
      };

      els.wizardConteudo.innerHTML = `
        <div class="liora-section">
          <h5>Introdução</h5>
          <p>${c.introducao || ""}</p>
        </div>
        <hr class="liora-divider">

        <div class="liora-section">
          <h5>Conceitos Principais</h5>
          <ul>${(c.conceitos || [])
            .map((x) => `<li>${x}</li>`)
            .join("")}</ul>
        </div>
        <hr class="liora-divider">

        <div class="liora-section">
          <h5>Exemplos</h5>
          <ul>${(c.exemplos || [])
            .map((x) => `<li>${x}</li>`)
            .join("")}</ul>
        </div>
        <hr class="liora-divider">

        <div class="liora-section">
          <h5>Aplicações</h5>
          <ul>${(c.aplicacoes || [])
            .map((x) => `<li>${x}</li>`)
            .join("")}</ul>
        </div>
        <hr class="liora-divider">

        <div class="liora-section">
          <h5>Resumo Rápido</h5>
          <p>${c.resumo || ""}</p>
        </div>
      `;

      els.wizardAnalogias.innerHTML = (s.analogias || [])
        .map((a) => `<p>${a}</p>`)
        .join("");

      els.wizardAtivacao.innerHTML = (s.ativacao || [])
        .map((q) => `<li>${q}</li>`)
        .join("");

      // QUIZ
      els.wizardQuiz.innerHTML = "";
      const pergunta = document.createElement("p");
      pergunta.textContent = s.quiz?.pergunta || "";
      els.wizardQuiz.appendChild(pergunta);

      const alternativas = (s.quiz?.alternativas || []).map((alt, i) => ({
        texto: String(alt),
        correta: i === Number(s.quiz.corretaIndex || 0),
      }));

      // embaralha alternativas
      for (let i = alternativas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
      }

      alternativas.forEach((altObj, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `
          <input type="radio" name="quiz" value="${i}">
          <span>${altObj.texto}</span>
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

      els.wizardFlashcards.innerHTML = (s.flashcards || [])
        .map((f) => `<li><b>${f.q}</b>: ${f.a}</li>`)
        .join("");

      if (wizard.sessoes.length > 0) {
        els.wizardProgressBar.style.width =
          ((wizard.atual + 1) / wizard.sessoes.length) * 100 + "%";
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
    // FLUXO — MODO TEMA
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      const cached = loadProgress(tema, nivel);
      if (cached && cached.sessoes && cached.sessoes.length) {
        wizard = cached;
        renderPlanoResumo(wizard.plano);
        renderWizard();
        return;
      }

      els.btnGerar.disabled = true;
      atualizarStatus("tema", "Criando plano...", 0);

      try {
        const plano = await gerarPlanoPorTema(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          atualizarStatus(
            "tema",
            `Gerando sessão ${i + 1}/${plano.length}: ${plano[i].titulo}`,
            ((i + 1) / plano.length) * 100
          );
          const anterior = i > 0 ? plano[i - 1].descricao || plano[i - 1].titulo : null;
          const sessao = await gerarSessao(tema, nivel, i + 1, plano[i].titulo, anterior);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus("tema", "Sessões concluídas!", 100);
        renderWizard();
      } catch (e) {
        console.error(e);
        alert("Erro ao gerar plano pelo tema.");
      } finally {
        els.btnGerar.disabled = false;
      }
    });

    // --------------------------------------------------------
    // FLUXO — MODO UPLOAD (PDF)
    // --------------------------------------------------------
    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;
      if (!file) return alert("Selecione um arquivo.");

      // por enquanto, só PDF
      if (file.type !== "application/pdf") {
        return alert("Nesta versão, a Liora lê apenas arquivos PDF (.pdf).");
      }

      // limite de tamanho
      if (file.size > 15 * 1024 * 1024) {
        return alert("Arquivo muito grande. Tamanho máximo: 15MB.");
      }

      els.btnGerarUpload.disabled = true;
      atualizarStatus("upload", "Lendo PDF...", 5);

      try {
        const textoLimpo = await extrairTextoDePDF(file);
        atualizarStatus("upload", "Identificando capítulos da apostila...", 25);

        const capitulos = await detectarCapitulos(textoLimpo);
        if (!capitulos || !capitulos.length) {
          alert("A IA não conseguiu identificar capítulos.");
          atualizarStatus("upload", "Não foi possível identificar capítulos.", 0);
          return;
        }

        const tema = file.name.split(".")[0];
        wizard = { tema, nivel, plano: capitulos, sessoes: [], atual: 0 };
        renderPlanoResumo(capitulos);

        for (let i = 0; i < capitulos.length; i++) {
          atualizarStatus(
            "upload",
            `Gerando sessão ${i + 1}/${capitulos.length}: ${capitulos[i].titulo}`,
            25 + ((i + 1) / capitulos.length) * 70
          );
          const anterior = i > 0 ? capitulos[i - 1].descricao : null;
          const sessao = await gerarSessao(tema, nivel, i + 1, capitulos[i].titulo, anterior);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus("upload", "Sessões concluídas!", 100);
        renderWizard();
      } catch (e) {
        console.error(e);
        alert("Erro ao gerar plano via upload.");
        atualizarStatus("upload", "Erro ao gerar a partir do PDF.", 0);
      } finally {
        els.btnGerarUpload.disabled = false;
      }
    });

    // --------------------------------------------------------
    // NOME DO ARQUIVO NA UI
    // --------------------------------------------------------
    els.inpFile.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const uploadText = document.getElementById("upload-text");
      if (uploadText) {
        uploadText.textContent = file
          ? `Selecionado: ${file.name}`
          : "Clique ou arraste um arquivo (.pdf)";
      }
    });

    console.log("🟢 core.js v56 carregado com sucesso");
  });
})();
