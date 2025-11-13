// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v52)
// - Tema / Upload
// - Topic mining (até 12 tópicos reais a partir do upload)
// - Sessões profundas (Introdução, Conceitos, Exemplos, Aplicações, Resumo rápido)
// - Continuidade entre sessões
// - Quiz embaralhado com feedback e dica
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v52...");

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

      // painel direito (plano)
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
    // STATUS + PROGRESSO
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto || "";

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
    const key = (tema, nivel) => `liora:wizard:${(tema || "").toLowerCase()}::${(nivel || "").toLowerCase()}`;
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
    // 🔹 GERAÇÃO DE PLANO — MODO TEMA
    // --------------------------------------------------------
    async function gerarPlanoDeSessoesTema(tema, nivel) {
      const prompt = `
Você é LIORA, uma tutora de microlearning. Crie um plano de estudo progressivo para o tema "${tema}" (nível: ${nivel}).

Regras:
- Crie entre 6 e 10 sessões.
- Cada sessão deve ser um passo lógico na jornada do estudante.
- Evite repetições de título.
- Do mais básico ao mais avançado.
- Use apenas JSON puro, sem comentários.

Formato exato da resposta:
[
  { "numero": 1, "nome": "Visão geral do tema e objetivos de estudo" },
  { "numero": 2, "nome": "Conceitos fundamentais" }
]`;
      const raw = await callLLM(
        "Você é uma tutora experiente em microlearning, focada em progressão pedagógica clara.",
        prompt
      );
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // 🔹 GERAÇÃO DE PLANO — MODO UPLOAD (TOPIC MINING)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoesUpload(temaArquivo, nivel, textoArquivo) {
      const preview = textoArquivo.slice(0, 16000); // proteção simples

      const prompt = `
Você receberá um trecho representativo do conteúdo de um arquivo didático.
A partir DESSE CONTEÚDO, identifique os principais tópicos que podem virar sessões de estudo.

Regras:
- Use EXCLUSIVAMENTE o conteúdo fornecido (não invente capítulos que não aparecem).
- Agrupe subtópicos do mesmo assunto em UM único tópico maior.
- Ignore elementos como: autor, ficha catalográfica, dedicatória, sumário puro, bibliografia, índice remissivo.
- Crie entre 6 e 12 tópicos.
- Cada tópico deve representar uma parte relevante do material (como um capítulo ou seção importante).

Retorne APENAS JSON no formato:
[
  { "numero": 1, "nome": "Tópico 1", "descricaoBase": "Resumo conciso do que esse tópico aborda no material." },
  { "numero": 2, "nome": "Tópico 2", "descricaoBase": "..." }
]

Conteúdo (trecho representativo do PDF):
"""${preview}"""`;

      const raw = await callLLM(
        "Você é uma tutora que faz 'topic mining' em materiais extensos para criar um plano de estudo coerente.",
        prompt
      );
      const arr = JSON.parse(raw);

      return arr.map((s, i) => ({
        numero: s.numero ?? i + 1,
        nome: s.nome ?? `Sessão ${i + 1}`,
        descricaoBase: s.descricaoBase || ""
      }));
    }

    // --------------------------------------------------------
    // 🔹 GERAÇÃO DE SESSÃO — MODO TEMA
    // --------------------------------------------------------
    async function gerarSessaoTema(tema, nivel, numero, nome, sessaoAnterior = null) {
      const contextoAnterior = sessaoAnterior
        ? `Na sessão anterior, o aluno estudou: "${sessaoAnterior.titulo || sessaoAnterior.nome || ""}". Agora avance para "${nome}", garantindo continuidade, sem repetir conteúdo desnecessariamente.`
        : `Esta é a primeira sessão do tema "${tema}". Prepare o terreno para as próximas.`;

      const prompt = `
${contextoAnterior}

Crie uma sessão de estudo completa para o tema "${tema}" com foco em "${nome}".
Nível: ${nivel}.

Estruture o conteúdo em JSON com a seguinte forma EXATA:

{
  "titulo": "Sessão ${numero} — ${nome}",
  "objetivo": "Descrição clara do resultado esperado para o aluno ao final da sessão (2-3 frases).",
  "conteudo": {
    "introducao": "Texto com 3 a 5 parágrafos explicando o contexto do tópico, sua relevância e conexão com o tema geral.",
    "conceitos": [
      "Parágrafo explicando um conceito central, com exemplos breves.",
      "Outro parágrafo com conceito complementar ou variação importante.",
      "Mais um parágrafo se necessário, aprofundando a visão."
    ],
    "exemplos": [
      "Exemplo prático 1 com explicação detalhada, em 1-2 parágrafos.",
      "Exemplo prático 2 com explicação detalhada, em 1-2 parágrafos."
    ],
    "aplicacoes": [
      "Aplicação prática 1, mostrando onde isso aparece na vida real ou no mercado.",
      "Aplicação prática 2, conectando com problemas/projetos que o aluno poderia enfrentar."
    ],
    "resumoRapido": "Resumo em 3 a 5 frases que sintetizam os principais pontos da sessão, como um fechamento da aula."
  },
  "analogias": [
    "Analogia comparando o tema com algo cotidiano, para facilitar a compreensão.",
    "Outra analogia complementar, se fizer sentido."
  ],
  "ativacao": [
    "Pergunta reflexiva ou desafio que leve o aluno a recuperar o conteúdo dessa sessão.",
    "Outra pergunta ou mini-atividade que exija pensar ativamente."
  ],
  "quiz": {
    "pergunta": "Uma pergunta objetiva, de múltipla escolha, avaliando o entendimento do ponto central da sessão.",
    "alternativas": ["Alternativa A", "Alternativa B", "Alternativa C"],
    "corretaIndex": 0,
    "explicacao": "Explicação detalhada, mostrando por que a alternativa correta é a certa, e por que as outras não são."
  },
  "flashcards": [
    { "q": "Pergunta de revisão 1", "a": "Resposta clara e objetiva para a revisão." },
    { "q": "Pergunta de revisão 2", "a": "Resposta correspondente." }
  ]
}

IMPORTANTÍSSIMO:
- Use linguagem clara, fluida, em tom de aula.
- Evite listas soltas sem explicação; desenvolva parágrafos.
- Não invente conteúdo completamente desconectado do tema e do nível.
- Use APENAS JSON válido, sem comentários, sem texto fora do objeto.`;

      const raw = await callLLM(
        "Você é LIORA, uma tutora que escreve aulas completas e bem estruturadas.",
        prompt
      );
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // 🔹 GERAÇÃO DE SESSÃO — MODO UPLOAD (profundo, baseado no PDF)
    // --------------------------------------------------------
    async function gerarSessaoUpload(temaGlobal, nivel, numero, topicoPlano, textoArquivo, sessaoAnterior = null) {
      const preview = textoArquivo.slice(0, 20000); // trecho grande, mas protegido

      const contextoAnterior = sessaoAnterior
        ? `Na sessão anterior, o aluno estudou: "${sessaoAnterior.titulo || sessaoAnterior.nome || ""}". Agora, avance para "${topicoPlano.nome}", garantindo continuidade e evitando repetir explicações inteiras.`
        : `Esta é a primeira sessão baseada no material enviado, focada no tópico "${topicoPlano.nome}".`;

      const prompt = `
Você receberá um trecho de um material (apostila/livro em PDF) e o nome de um tópico extraído desse material.

TEMA GLOBAL DO ARQUIVO: "${temaGlobal}"
TÓPICO DA SESSÃO: "${topicoPlano.nome}"
DESCRIÇÃO BASE (resumo do trecho correspondente): "${topicoPlano.descricaoBase || ""}"

${contextoAnterior}

Use EXCLUSIVAMENTE o conteúdo do material fornecido como base.  
Você pode reescrever, reorganizar e explicar melhor, mas não invente teorias ou seções que não existam no arquivo.

Trecho representativo do material (pode conter mais coisas além deste tópico, use apenas o que for pertinente):
"""${preview}"""

Agora, produza UMA SESSÃO COMPLETA no formato JSON exato:

{
  "titulo": "Sessão ${numero} — ${topicoPlano.nome}",
  "objetivo": "Descrição clara do resultado esperado para o aluno ao final da sessão (2-3 frases).",
  "conteudo": {
    "introducao": "Texto com 3 a 5 parágrafos explicando o contexto do tópico dentro do material enviado, sua relevância e ligação com o restante do conteúdo.",
    "conceitos": [
      "Parágrafo explicando um conceito central presente no material para este tópico.",
      "Outro parágrafo com conceito complementar ou variação importante, baseado no texto.",
      "Mais um parágrafo se houver conteúdo suficiente."
    ],
    "exemplos": [
      "Exemplo prático 1 retirado ou inspirado diretamente no material, com explicação.",
      "Exemplo prático 2, quando houver base suficiente."
    ],
    "aplicacoes": [
      "Aplicação prática 1 indicando para que esse conteúdo serve na prática, conforme o material sugere ou permite inferir.",
      "Aplicação prática 2, se houver base no texto."
    ],
    "resumoRapido": "Resumo em 3 a 5 frases que sintetizam os principais pontos dessa sessão, como se fosse o 'fechamento' do capítulo."
  },
  "analogias": [
    "Analogia comparando o tema com algo cotidiano, desde que coerente com o conteúdo do material.",
    "Outra analogia possível."
  ],
  "ativacao": [
    "Pergunta ou mini-atividade que exija que o aluno recupere o conteúdo específico dessa sessão.",
    "Outra atividade ou pergunta similar."
  ],
  "quiz": {
    "pergunta": "Pergunta objetiva, de múltipla escolha, avaliando um ponto central deste tópico conforme o material.",
    "alternativas": ["Alternativa A", "Alternativa B", "Alternativa C"],
    "corretaIndex": 0,
    "explicacao": "Explicação fundamentada no material, mostrando por que a alternativa correta é a certa."
  },
  "flashcards": [
    { "q": "Pergunta de revisão 1 baseada no conteúdo dessa sessão", "a": "Resposta correspondente." },
    { "q": "Pergunta de revisão 2 baseada no conteúdo dessa sessão", "a": "Resposta correspondente." }
  ]
}

IMPORTANTE:
- Não invente tópicos que não existem no material.
- Se perceber que o material é raso sobre esse tópico, faça uma sessão mais enxuta e mencione implicitamente o foco no que está disponível.
- Responda APENAS com JSON válido.`;

      const raw = await callLLM(
        "Você é LIORA, uma tutora que monta aulas a partir de PDFs reais, respeitando o conteúdo original.",
        prompt
      );
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO (CARDS LADO DIREITO)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      if (!Array.isArray(plano) || !plano.length) {
        els.plano.innerHTML = "<p class='text-sm text-[var(--muted)]'>Nenhum plano gerado ainda.</p>";
        return;
      }

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
    // RENDERIZAÇÃO DO WIZARD (CONTEÚDO HIERÁRQUICO)
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      // 🔄 Reset de feedback do quiz ao trocar de sessão
      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema || "";
      els.wizardTitulo.textContent = s.titulo || "";

      els.wizardObjetivo.textContent = s.objetivo || "";

      const c = s.conteudo || {};

      // Conteúdo hierárquico
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

      if (c.resumoRapido) {
        htmlConteudo += `
          <div class="liora-section">
            <h5>RESUMO RÁPIDO</h5>
            <p>${c.resumoRapido}</p>
          </div>
        `;
      }

      els.wizardConteudo.innerHTML = htmlConteudo;

      // Analogias, Ativação, Flashcards
      els.wizardAnalogias.innerHTML = (s.analogias || [])
        .map(a => `<p>${a}</p>`).join("");

      els.wizardAtivacao.innerHTML = (s.ativacao || [])
        .map(q => `<li>${q}</li>`).join("");

      els.wizardFlashcards.innerHTML = (s.flashcards || [])
        .map(f => `<li><b>${f.q}</b>: ${f.a}</li>`).join("");

      // QUIZ
      els.wizardQuiz.innerHTML = "";
      if (s.quiz && s.quiz.pergunta && Array.isArray(s.quiz.alternativas)) {
        const pergunta = document.createElement("p");
        pergunta.textContent = s.quiz.pergunta;
        els.wizardQuiz.appendChild(pergunta);

        // normaliza e embaralha alternativas
        const alternativas = s.quiz.alternativas.map((alt, i) => ({
          texto: String(alt).replace(/\n/g, " ").replace(/<\/?[^>]+(>|$)/g, ""),
          correta: i === Number(s.quiz.corretaIndex),
        }));

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
                els.wizardQuizFeedback.textContent = `✅ Correto! ${s.quiz.explicacao || ""}`;
                els.wizardQuizFeedback.style.color = "var(--brand)";
                tentativasErradas = 0;
              } else {
                tentativasErradas++;
                if (tentativasErradas >= 2) {
                  els.wizardQuizFeedback.textContent = `💡 Dica: ${s.quiz.explicacao || ""}`;
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
      }

      // progresso visual
      if (wizard.sessoes.length > 0) {
        els.wizardProgressBar.style.width =
          `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
      } else {
        els.wizardProgressBar.style.width = "0%";
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
    // FLUXOS DE GERAÇÃO (TEMA / UPLOAD)
    // --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo, textoArquivo = null) {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;
      btn.disabled = true;
      atualizarStatus(modo, "Criando plano...", 0);

      try {
        let plano;
        if (modo === "upload" && textoArquivo) {
          plano = await gerarPlanoDeSessoesUpload(tema, nivel, textoArquivo);
        } else {
          plano = await gerarPlanoDeSessoesTema(tema, nivel);
        }

        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          const topicoPlano = plano[i];
          const progresso = ((i + 1) / plano.length) * 100;
          atualizarStatus(
            modo,
            `Gerando sessão ${i + 1}/${plano.length}: ${topicoPlano.nome}`,
            progresso
          );

          let sessao;
          const sessaoAnterior = wizard.sessoes[i - 1] || null;

          if (modo === "upload" && textoArquivo) {
            sessao = await gerarSessaoUpload(tema, nivel, i + 1, topicoPlano, textoArquivo, sessaoAnterior);
          } else {
            sessao = await gerarSessaoTema(tema, nivel, i + 1, topicoPlano.nome, sessaoAnterior);
          }

          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus(modo, "Sessões concluídas!", 100);
        renderWizard();

      } catch (err) {
        console.error(err);
        alert("Erro ao gerar o plano. Veja o console para detalhes.");
      } finally {
        btn.disabled = false;
      }
    }

    // --------------------------------------------------------
    // BOTÃO GERAR — TEMA
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", async () => {
      const tema = (els.inpTema.value || "").trim();
      const nivel = els.selNivel.value;

      if (!tema) {
        alert("Digite um tema.");
        return;
      }

      // Se já existir plano salvo para esse tema/nivel, reutiliza
      const cached = loadProgress(tema, nivel);
      if (cached && Array.isArray(cached.sessoes) && cached.sessoes.length) {
        wizard = cached;
        renderPlanoResumo(wizard.plano || []);
        renderWizard();
        atualizarStatus("tema", "Plano carregado do histórico.", 100);
        return;
      }

      gerarFluxo(tema, nivel, "tema");
    });

    // --------------------------------------------------------
    // BOTÃO GERAR — UPLOAD
    // --------------------------------------------------------
    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;

      if (!file) {
        alert("Selecione um arquivo PDF.");
        return;
      }

      // Apenas PDF nesta primeira versão
      if (!file.type.includes("pdf")) {
        alert("Por enquanto, a Liora aceita apenas arquivos PDF.");
        return;
      }

      // Limite de tamanho simples (ex.: 10 MB)
      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        alert("Arquivo muito grande. Envie um PDF com até 10 MB.");
        return;
      }

      const tema = file.name.replace(/\.pdf$/i, "") || "Material enviado";
      const textoArquivo = await file.text().catch(() => "");

      if (!textoArquivo) {
        alert("Não foi possível ler o conteúdo do PDF no navegador.");
        return;
      }

      gerarFluxo(tema, nivel, "upload", textoArquivo);
    });

    // --------------------------------------------------------
    // ATUALIZA NOME DO ARQUIVO NA UI
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

    console.log("🟢 core.js v52 carregado com sucesso");
  });
})();
