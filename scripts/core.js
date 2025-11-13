// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v50)
// - Tema: igual v47, com conteúdo mais "aula"
// - Upload: sessões a partir de títulos (1º e 2º nível) do PDF
// - Cada sessão baseada no texto do tópico correspondente
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v50...");

  document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------------
    // CONFIGURAÇÕES
    // --------------------------------------------------------
    const MAX_PDF_MB = 12; // limite de tamanho para upload (ajustável)

    // --------------------------------------------------------
    // MAPA DE ELEMENTOS
    // --------------------------------------------------------
    const els = {
      // modo
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

      // plano (lado direito)
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

      // tema visual
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
    // STATUS + PROGRESSO
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto || "";

      const barraId = modo === "tema" ? "barra-tema-fill" : "barra-upload-fill";
      const barra = document.getElementById(barraId);
      if (barra && progresso !== null) {
        barra.style.width = `${progresso}%`;
      }
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0,
      unidadesUpload: null, // usado só no modo upload
    };

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
      // limpa status ao trocar
      atualizarStatus("tema", "");
      atualizarStatus("upload", "");
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
    // GERAÇÃO DE PLANO (MODO TEMA)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Você está ajudando um estudante a estudar o tema "${tema}" no nível "${nivel}".
Crie um PLANO DE ESTUDO com sessões coerentes e progressivas.

Responda em JSON PURO, SEM comentários, exatamente no formato:
[
  {"numero": 1, "nome": "Sessão 1 — ..."},
  {"numero": 2, "nome": "Sessão 2 — ..."}
]

Regras:
- Máximo de 8 sessões.
- Nomes claros e objetivos.
- Cada sessão deve avançar em relação à anterior.`;

      const raw = await callLLM(
        "Você é Liora, tutora especializada em microlearning.",
        prompt
      );
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO (MODO TEMA) — AULA COMPLETA
    // --------------------------------------------------------
    async function gerarSessaoTema(tema, nivel, numero, nome, sessaoAnteriorTitulo = null) {
      const continuidade = sessaoAnteriorTitulo
        ? `Na sessão anterior, o aluno estudou: "${sessaoAnteriorTitulo}". Agora avance para "${nome}", evitando repetição e aprofundando o tema.`
        : `Esta é a primeira sessão do tema "${tema}". Introduza o assunto de forma acolhedora e clara.`;

      const prompt = `
${continuidade}

Crie o conteúdo COMPLETO da sessão ${numero} do plano "${tema}" para um aluno de nível "${nivel}".

Responda em JSON PURO, sem comentários, no formato exato:
{
  "titulo": "Sessão ${numero} — ${nome}",
  "objetivo": "frase clara explicando o que o aluno será capaz de fazer ao final",
  "conteudo": {
    "introducao": "texto corrido explicando o contexto e importância do tópico (2–4 parágrafos curtos).",
    "conceitos": [
      "conceito 1 bem explicado, com definição e pequena explicação",
      "conceito 2 bem explicado",
      "conceito 3 bem explicado"
    ],
    "exemplos": [
      "exemplo aplicado 1, com situação concreta",
      "exemplo aplicado 2, com situação real ou simulada"
    ],
    "aplicacoes": [
      "aplicação prática 1, descrevendo como o aluno usaria isso na prática",
      "aplicação prática 2"
    ],
    "resumoRapido": [
      "frase curta 1 com ponto-chave da sessão",
      "frase curta 2 com outro ponto importante",
      "frase curta 3 de reforço ou alerta comum"
    ]
  },
  "analogias": [
    "analogia 1 comparando o conceito a algo do dia a dia",
    "analogia 2, se fizer sentido"
  ],
  "ativacao": [
    "pergunta de reflexão 1 para o aluno pensar e escrever",
    "pergunta de reflexão 2"
  ],
  "quiz": {
    "pergunta": "pergunta de múltipla escolha focada em ponto chave da sessão",
    "alternativas": [
      "alternativa A",
      "alternativa B",
      "alternativa C"
    ],
    "corretaIndex": 0,
    "explicacao": "explique com clareza por que a alternativa correta está certa e as demais não."
  },
  "flashcards": [
    {"q": "pergunta de revisão curta 1", "a": "resposta objetiva 1"},
    {"q": "pergunta de revisão curta 2", "a": "resposta objetiva 2"}
  ]
}

Regras importantes:
- Use linguagem didática e direta, em português do Brasil.
- Não invente siglas sem explicar.
- Evite listas vazias: sempre preencha com conteúdo útil.
`;

      const raw = await callLLM(
        "Você é Liora, tutora especializada em microlearning, escrita didática e detalhada.",
        prompt
      );
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // EXTRAÇÃO DE TÍTULOS DO PDF (1º e 2º NÍVEL)
    // --------------------------------------------------------
    function ehTitulo(line) {
      const texto = line.trim();
      if (!texto) return false;
      if (texto.length > 120) return false;

      // Padrões tipo "1 Introdução", "2. Conceitos", "3.1 Modelos"
      const padraoNumerado = /^\d+(\.\d+)?\s+.+/; // 1 e 1.1 (até 2º nível)
      if (padraoNumerado.test(texto)) return true;

      // Palavras-chave típicas de capítulos
      if (/^(CAP[ÍI]TULO|CAPITULO|UNIDADE|M[ÓO]DULO|MODULO|SE(C|Ç)ÃO|SECAO)\b/i.test(texto)) {
        return true;
      }

      // Título todo em maiúsculas, poucas palavras
      const soLetras = texto.replace(/[^A-Za-zÁ-Úá-ú]/g, "");
      if (soLetras && soLetras === soLetras.toUpperCase()) {
        const palavras = texto.split(/\s+/);
        if (palavras.length <= 8) return true;
      }

      return false;
    }

    async function extrairUnidadesDoPdf(file) {
      if (typeof pdfjsLib === "undefined") {
        throw new Error("pdfjsLib não carregado.");
      }

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

      const linhasGlobais = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const textoPagina = content.items.map(it => it.str).join("\n");
        const linhas = textoPagina.split(/\r?\n/);
        linhas.forEach(l => linhasGlobais.push(l));
      }

      const unidades = [];
      let atual = null;

      for (const rawLine of linhasGlobais) {
        const line = rawLine.trim();
        if (!line) continue;

        if (ehTitulo(line)) {
          // fecha unidade anterior
          if (atual && atual.texto.length > 0) {
            unidades.push({
              titulo: atual.titulo,
              texto: atual.texto.join(" ")
            });
          }
          // inicia nova
          atual = { titulo: line, texto: [] };
        } else if (atual) {
          atual.texto.push(line);
        }
      }

      // última unidade
      if (atual && atual.texto.length > 0) {
        unidades.push({
          titulo: atual.titulo,
          texto: atual.texto.join(" ")
        });
      }

      // segurança: limita para não explodir número de sessões
      const MAX_SESSOES = 16;
      return unidades.slice(0, MAX_SESSOES);
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO (MODO UPLOAD) — A PARTIR DO TÓPICO
    // --------------------------------------------------------
    async function gerarSessaoDeUpload(temaGlobal, nivel, numero, unidadeAtual, unidadeAnterior) {
      const tituloTopico = unidadeAtual.titulo || `Parte ${numero}`;
      const textoBase = (unidadeAtual.texto || "").slice(0, 8000); // corta para evitar excesso

      const contextoAnterior = unidadeAnterior
        ? `Antes deste tópico, o aluno estudou "${unidadeAnterior.titulo}". Agora aprofunde o tema para "${tituloTopico}", evitando repetição e mantendo coerência.`
        : `Este é o primeiro tópico do material carregado, com título "${tituloTopico}". Introduza o tema de forma clara e acolhedora.`;

      const prompt = `
Você recebeu um trecho de uma apostila em PDF sobre "${temaGlobal}".
Seu objetivo é transformar esse trecho em uma SESSÃO DE ESTUDO completa, clara e didática.

TÍTULO DO TÓPICO:
"${tituloTopico}"

TRECHO DO MATERIAL (não copie literalmente; resuma, reestruture e explique):
"""${textoBase}"""

${contextoAnterior}

Responda em JSON PURO, sem comentários, no formato exato:
{
  "titulo": "Sessão ${numero} — ${tituloTopico}",
  "objetivo": "frase clara explicando o foco da sessão",
  "conteudo": {
    "introducao": "texto corrido explicando o contexto e importância do tópico (2–4 parágrafos curtos).",
    "conceitos": [
      "conceito 1 bem explicado, derivado do trecho",
      "conceito 2 bem explicado",
      "conceito 3 bem explicado"
    ],
    "exemplos": [
      "exemplo aplicado 1, coerente com o trecho",
      "exemplo aplicado 2"
    ],
    "aplicacoes": [
      "aplicação prática 1, explicando como o aluno pode usar isso na prática",
      "aplicação prática 2"
    ],
    "resumoRapido": [
      "frase curta 1 com ponto-chave da sessão",
      "frase curta 2",
      "frase curta 3"
    ]
  },
  "analogias": [
    "analogia comparando a ideia a algo do dia a dia",
    "outra analogia, se útil"
  ],
  "ativacao": [
    "pergunta de reflexão 1 baseada no conteúdo deste tópico",
    "pergunta de reflexão 2"
  ],
  "quiz": {
    "pergunta": "pergunta de múltipla escolha baseada em ponto central do trecho",
    "alternativas": [
      "alternativa A",
      "alternativa B",
      "alternativa C"
    ],
    "corretaIndex": 0,
    "explicacao": "explique por que a alternativa correta está certa e as outras não."
  },
  "flashcards": [
    {"q": "pergunta de revisão 1", "a": "resposta objetiva 1"},
    {"q": "pergunta de revisão 2", "a": "resposta objetiva 2"}
  ]
}

Regras:
- Use apenas informações coerentes com o trecho fornecido.
- Não invente capítulos ou temas que não aparecem no trecho.
- Linguagem didática, em português do Brasil.
`;

      const raw = await callLLM(
        "Você é Liora, tutora que transforma apostilas em aulas estruturadas e completas.",
        prompt
      );
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO (CARDS LADO DIREITO)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      if (!plano || !plano.length) return;

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
    // RENDERIZAÇÃO DO WIZARD (CONTEÚDO HIERÁRQUICO)
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

      // CONTEÚDO HIERÁRQUICO + RESUMO RÁPIDO
      let htmlConteudo = "";

      if (c.introducao) {
        htmlConteudo += `
          <div class="liora-section">
            <h5>INTRODUÇÃO</h5>
            <p>${c.introducao}</p>
          </div>
          <hr class="liora-divider">
        `;
      }

      if (Array.isArray(c.conceitos) && c.conceitos.length) {
        htmlConteudo += `
          <div class="liora-section">
            <h5>CONCEITOS PRINCIPAIS</h5>
            <ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">
        `;
      }

      if (Array.isArray(c.exemplos) && c.exemplos.length) {
        htmlConteudo += `
          <div class="liora-section">
            <h5>EXEMPLOS</h5>
            <ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">
        `;
      }

      if (Array.isArray(c.aplicacoes) && c.aplicacoes.length) {
        htmlConteudo += `
          <div class="liora-section">
            <h5>APLICAÇÕES</h5>
            <ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">
        `;
      }

      if (Array.isArray(c.resumoRapido) && c.resumoRapido.length) {
        htmlConteudo += `
          <div class="liora-section">
            <h5>RESUMO RÁPIDO</h5>
            <ul>${c.resumoRapido.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
        `;
      }

      els.wizardConteudo.innerHTML = htmlConteudo;

      // Analogias / Ativação
      els.wizardAnalogias.innerHTML = (s.analogias || [])
        .map(a => `<p>${a}</p>`)
        .join("");
      els.wizardAtivacao.innerHTML = (s.ativacao || [])
        .map(q => `<li>${q}</li>`)
        .join("");

      // QUIZ
      const quiz = s.quiz || {};
      els.wizardQuiz.innerHTML = "";
      const pergunta = document.createElement("p");
      pergunta.textContent = quiz.pergunta || "";
      els.wizardQuiz.appendChild(pergunta);

      if (Array.isArray(quiz.alternativas)) {
        quiz.alternativas.forEach((alt, i) => {
          const opt = document.createElement("label");
          opt.className = "liora-quiz-option";
          opt.innerHTML = `
            <input type="radio" name="quiz" value="${i}">
            <span class="liora-quiz-option-text">${String(alt)}</span>
          `;

          opt.addEventListener("click", () => {
            document
              .querySelectorAll(".liora-quiz-option")
              .forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
            opt.querySelector("input").checked = true;

            els.wizardQuizFeedback.style.opacity = 0;
            setTimeout(() => {
              if (i === Number(quiz.corretaIndex)) {
                els.wizardQuizFeedback.textContent = `✅ Correto! ${quiz.explicacao || ""}`;
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
      }

      // Flashcards
      els.wizardFlashcards.innerHTML = (s.flashcards || [])
        .map(f => `<li><b>${f.q}</b>: ${f.a}</li>`)
        .join("");

      // progresso
      if (wizard.sessoes.length > 0) {
        els.wizardProgressBar.style.width =
          `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
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
    // FLUXO MODO TEMA
    // --------------------------------------------------------
    async function gerarFluxoTema(tema, nivel) {
      const cached = loadProgress(tema, nivel);
      if (cached?.sessoes?.length) {
        wizard = cached;
        renderPlanoResumo(wizard.plano);
        renderWizard();
        return;
      }

      els.btnGerar.disabled = true;
      atualizarStatus("tema", "Criando plano...", 0);

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0, unidadesUpload: null };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          const sessaoAnteriorTitulo = i > 0 ? plano[i - 1].nome : null;
          atualizarStatus(
            "tema",
            `Sessão ${i + 1}/${plano.length}: ${plano[i].nome}`,
            ((i + 1) / plano.length) * 100
          );
          const sessao = await gerarSessaoTema(
            tema,
            nivel,
            i + 1,
            plano[i].nome,
            sessaoAnteriorTitulo
          );
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus("tema", "Sessões concluídas!", 100);
        renderWizard();
      } catch (err) {
        console.error(err);
        alert("Erro ao gerar o plano.");
      } finally {
        els.btnGerar.disabled = false;
      }
    }

    els.btnGerar.addEventListener("click", () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");
      gerarFluxoTema(tema, nivel);
    });

    // --------------------------------------------------------
    // FLUXO MODO UPLOAD
    // --------------------------------------------------------
    async function gerarFluxoUpload(file, nivel) {
      // valida tipo
      if (file.type !== "application/pdf") {
        alert("Nesta versão, a Liora aceita apenas arquivos PDF.");
        return;
      }

      // valida tamanho
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_PDF_MB) {
        alert(`Arquivo muito grande (${sizeMB.toFixed(1)} MB). Tamanho máximo permitido: ${MAX_PDF_MB} MB.`);
        return;
      }

      els.btnGerarUpload.disabled = true;
      atualizarStatus("upload", "Lendo estrutura do PDF...", 0);

      try {
        const unidades = await extrairUnidadesDoPdf(file);

        if (!unidades.length) {
          atualizarStatus("upload", "Não encontrei capítulos ou seções bem definidos no PDF.");
          return;
        }

        const tema = file.name.split(".")[0] || "Material PDF";
        const plano = unidades.map((u, idx) => ({
          numero: idx + 1,
          nome: u.titulo,
        }));

        wizard = {
          tema,
          nivel,
          plano,
          sessoes: [],
          atual: 0,
          unidadesUpload: unidades,
        };

        renderPlanoResumo(plano);

        for (let i = 0; i < unidades.length; i++) {
          const unidadeAtual = unidades[i];
          const unidadeAnterior = i > 0 ? unidades[i - 1] : null;

          atualizarStatus(
            "upload",
            `Sessão ${i + 1}/${unidades.length}: ${unidadeAtual.titulo}`,
            ((i + 1) / unidades.length) * 100
          );

          const sessao = await gerarSessaoDeUpload(
            tema,
            nivel,
            i + 1,
            unidadeAtual,
            unidadeAnterior
          );
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus("upload", "Sessões concluídas!", 100);
        renderWizard();
      } catch (err) {
        console.error(err);
        alert("Erro ao processar o PDF ou gerar as sessões.");
      } finally {
        els.btnGerarUpload.disabled = false;
      }
    }

    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;
      if (!file) return alert("Selecione um arquivo PDF.");
      gerarFluxoUpload(file, nivel);
    });

    // Atualiza nome do arquivo no upload
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

    console.log("🟢 core.js v50 carregado com sucesso");
  });
})();
