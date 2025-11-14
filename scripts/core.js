// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v57)
// Upload aperfeiçoado: capítulos → resumo → sessões coerentes
// Mantém tudo que já funcionava no v47–v56
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v57...");

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
    // STATUS + BARRAS DE PROGRESSO
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;
      const barra = document.getElementById(modo === "tema" ? "barra-tema-fill" : "barra-upload-fill");
      if (barra && progresso !== null) barra.style.width = `${progresso}%`;
    }

    // --------------------------------------------------------
    // CHAMADA À IA
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
    // 🔍 DETECÇÃO SIMPLES DE CAPÍTULOS
    // --------------------------------------------------------
    async function detectarCapitulos(textoBruto) {
      const prompt = `
Você lerá o texto de uma apostila e identificará capítulos REAIS.
Retorne apenas JSON, ex:
[
 {"numero":1, "titulo":"Teoria dos Conjuntos"},
 {"numero":2, "titulo":"Funções"},
 {"numero":3, "titulo":"Probabilidade"}
]

REGRAS:
- NÃO invente capítulos.
- NÃO use autoria, dedicatória, sumário ou apêndices.
- Títulos devem ser de assuntos do conteúdo, não formatação.

Texto:
"""${textoBruto.slice(0, 12000)}"""
`;
      const raw = await callLLM("Você é especialista em análise de textos acadêmicos.", prompt);
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // 📝 RESUMO POR CAPÍTULO (AQUI É O CORAÇÃO DO v57)
    // --------------------------------------------------------
    async function resumirCapitulo(titulo, textoCompleto) {
      const prompt = `
Resuma o capítulo "${titulo}" com base SOMENTE no texto fornecido.
Crie um resumo forte, objetivo e didático.
Tamanho ≈ 2000 caracteres.

Texto:
"""${textoCompleto.slice(0, 20000)}"""`;
      const raw = await callLLM("Você é um especialista acadêmico.", prompt);
      return raw;
    }

    // --------------------------------------------------------
    // 📘 GERAÇÃO DE SESSÃO COM BASE NO RESUMO DO CAPÍTULO
    // --------------------------------------------------------
    async function gerarSessaoAPartirDoResumo(tituloSessao, resumo, numero) {
      const prompt = `
Gere uma sessão de aula COMPLETA baseada APENAS no resumo abaixo.
NÃO use o nome do arquivo PDF.
NÃO use o tema geral. ENSINE APENAS O CONTEÚDO DESTE CAPÍTULO.

Retorne JSON:
{
 "titulo":"Sessão ${numero} — ${tituloSessao}",
 "objetivo":"clareza sobre o que o aluno aprenderá",
 "conteudo":{
   "introducao":"introdução didática",
   "conceitos":["conceito 1","conceito 2","conceito 3"],
   "exemplos":["exemplo 1","exemplo 2"],
   "aplicacoes":["aplicação 1","aplicação 2"],
   "resumoRapido":"síntese final"
 },
 "analogias":["analogia 1"],
 "ativacao":["pergunta 1","pergunta 2"],
 "quiz":{"pergunta":"?","alternativas":["a","b","c"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}

Resumo do capítulo:
"""${resumo}"""
`;

      const raw = await callLLM("Você é Liora, tutora especializada em conteúdo educativo profundo e coerente.", prompt);
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // 📋 RENDERIZAÇÃO DAS SESSÕES (mantido do v47)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
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
    // 🧭 RENDERIZAÇÃO DO WIZARD
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;
      els.wizardTitulo.textContent = s.titulo;

      const c = s.conteudo;

      els.wizardObjetivo.textContent = s.objetivo;

      els.wizardConteudo.innerHTML = `
        <div class="liora-section"><h5>Introdução</h5><p>${c.introducao}</p></div><hr>
        <div class="liora-section"><h5>Conceitos principais</h5><ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul></div><hr>
        <div class="liora-section"><h5>Exemplos</h5><ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul></div><hr>
        <div class="liora-section"><h5>Aplicações</h5><ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul></div><hr>
        <div class="liora-section"><h5>Resumo rápido</h5><p>${c.resumoRapido}</p></div>
      `;

      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      // quiz (igual ao v46–v47)
      els.wizardQuiz.innerHTML = "";
      const pergunta = document.createElement("p");
      pergunta.textContent = s.quiz.pergunta;
      els.wizardQuiz.appendChild(pergunta);

      const alternativas = s.quiz.alternativas.map((alt, i) => ({
        texto: String(alt),
        correta: i === Number(s.quiz.corretaIndex),
      }));

      // embaralha
      for (let i = alternativas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
      }

      let tentativas = 0;

      alternativas.forEach((altObj, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz"><span>${altObj.texto}</span>`;
        opt.addEventListener("click", () => {
          document.querySelectorAll(".liora-quiz-option").forEach(o => o.classList.remove("selected"));
          opt.classList.add("selected");

          els.wizardQuizFeedback.style.opacity = 0;
          setTimeout(() => {
            if (altObj.correta) {
              els.wizardQuizFeedback.textContent = `✅ Correto! ${s.quiz.explicacao}`;
              els.wizardQuizFeedback.style.color = "var(--brand)";
            } else {
              tentativas++;
              els.wizardQuizFeedback.textContent = tentativas >= 2
                ? `💡 Dica: ${s.quiz.explicacao}`
                : "❌ Tente novamente.";
              els.wizardQuizFeedback.style.color = tentativas >= 2 ? "var(--brand)" : "var(--muted)";
            }
            els.wizardQuizFeedback.style.opacity = 1;
          }, 120);
        });
        els.wizardQuiz.appendChild(opt);
      });

      // flashcards
      els.wizardFlashcards.innerHTML = s.flashcards.map(f => `<li><b>${f.q}</b>: ${f.a}</li>`).join("");

      // progresso
      els.wizardProgressBar.style.width =
        `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
    }

    // --------------------------------------------------------
    // 🧭 NAVEGAÇÃO ENTRE SESSÕES
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
        atualizarStatus("upload", "🎉 Arquivo concluído!", 100);
      }
    });

    // --------------------------------------------------------
    // 🧠 GERAR FLUXO COMPLETO — MODO UPLOAD
    // --------------------------------------------------------
    async function gerarFluxoUpload(file) {
      const nivel = els.selNivel.value;
      const tema = file.name.replace(/\.(pdf|txt)$/i, "");

      atualizarStatus("upload", "📚 Lendo arquivo...", 5);

      const text = await file.text();

      atualizarStatus("upload", "🔍 Identificando capítulos...", 15);
      const capitulos = await detectarCapitulos(text);

      if (!capitulos?.length) {
        alert("A IA não conseguiu identificar capítulos.");
        return;
      }

      atualizarStatus("upload", "📝 Resumindo capítulos...", 30);

      const resumos = [];
      for (let i = 0; i < capitulos.length; i++) {
        atualizarStatus("upload", `Resumindo capítulo ${i + 1}/${capitulos.length}...`, 30 + (i * 30 / capitulos.length));
        const resumo = await resumirCapitulo(capitulos[i].titulo, text);
        resumos.push(resumo);
      }

      atualizarStatus("upload", "🎓 Gerando sessões...", 70);

      const sessoes = [];
      for (let i = 0; i < capitulos.length; i++) {
        atualizarStatus("upload", `Sessão ${i + 1}/${capitulos.length}...`, 70 + (i * 30 / capitulos.length));
        const sessao = await gerarSessaoAPartirDoResumo(
          capitulos[i].titulo,
          resumos[i],
          i + 1
        );
        sessoes.push(sessao);
      }

      wizard = {
        tema,
        nivel,
        sessoes,
        plano: capitulos.map((c, i) => ({ titulo: c.titulo, numero: i + 1 })),
        atual: 0,
      };

      atualizarStatus("upload", "✅ Pronto!", 100);
      renderPlanoResumo(wizard.plano);
      renderWizard();
      saveProgress();
    }

    // --------------------------------------------------------
    // 🖱️ BOTÃO UPLOAD
    // --------------------------------------------------------
    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      if (!file) return alert("Selecione um arquivo .pdf");
      gerarFluxoUpload(file);
    });

    // --------------------------------------------------------
    // 🔤 MODO TEMA (mantido igual)
    // --------------------------------------------------------
    async function gerarFluxoTema(tema, nivel) {
      const promptPlano = `
Crie um plano de sessões detalhado para o tema "${tema}".
Formato:
[
 {"numero":1,"titulo":"..."},
 {"numero":2,"titulo":"..."}
]`;

      const raw = await callLLM("Você é Liora, tutora acadêmica.", promptPlano);
      const plano = JSON.parse(raw);

      wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
      renderPlanoResumo(plano);

      for (let i = 0; i < plano.length; i++) {
        atualizarStatus("tema", `Sessão ${i + 1}...`, ((i + 1) / plano.length) * 100);
        const resumoArtificial = `O aluno estudará o tópico "${plano[i].titulo}".`;
        const sessao = await gerarSessaoAPartirDoResumo(plano[i].titulo, resumoArtificial, i + 1);
        wizard.sessoes.push(sessao);
      }

      renderWizard();
      atualizarStatus("tema", "Concluído!", 100);
      saveProgress();
    }

    els.btnGerar.addEventListener("click", () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");
      gerarFluxoTema(tema, nivel);
    });

    console.log("🟢 core.js v57 carregado com sucesso");
  });
})();
