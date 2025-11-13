// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v48)
// Aulas mais completas + hierarquia de conteúdo + continuidade
// Mantém tema, upload, progresso e quiz que já funcionam
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v48...");

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
      wizardResumo: document.getElementById("liora-sessao-resumo"),

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
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      }
      apply(localStorage.getItem("liora_theme") || "dark");
      els.themeBtn.addEventListener("click", () => {
        const newTheme = document.documentElement.classList.contains("light") ? "dark" : "light";
        apply(newTheme);
      });
    })();

    // --------------------------------------------------------
    // STATUS + PROGRESSO (tema / upload)
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
    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
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
    // GERAÇÃO DE PLANO (lista de sessões)
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
    // GERAÇÃO DE SESSÃO — AULA COMPLETA + CONTINUIDADE
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, sessaoAnteriorNome = null, proximaSessaoNome = null) {
      const contextoAnterior = sessaoAnteriorNome
        ? `A sessão anterior abordou "${sessaoAnteriorNome}". Conecte o conteúdo anterior a esta sessão, explicando como "${nome}" aprofunda ou amplia o que veio antes.`
        : `Esta é a primeira sessão do tema "${tema}". Contextualize o tema, explique por que é importante e prepare o aluno para a jornada de aprendizado.`;

      const contextoProximo = proximaSessaoNome
        ? `Ao final da sessão, faça uma transição suave, mencionando que a próxima sessão tratará de "${proximaSessaoNome}".`
        : `Esta é a última sessão do plano. Feche com uma visão de conjunto do que foi aprendido.`;

      const prompt = `
Gere a sessão ${numero} do tema "${tema}" (nível: ${nivel}).
${contextoAnterior}
${contextoProximo}

A sessão deve ter densidade de AULA COMPLETA, com explicações claras, exemplos ricos e foco em aplicação prática.

Retorne JSON puro:
{
 "titulo": "Sessão ${numero} — ${nome}",

 "objetivo": "Descreva com clareza o que o aluno será capaz de compreender ou fazer ao final da sessão, em 1 ou 2 frases.",

 "conteudo": {
   "introducao": "Escreva 2 a 3 parágrafos bem explicados, conectando com a sessão anterior (se houver) e contextualizando o assunto atual. Use linguagem acessível, mas profissional.",

   "conceitos": [
     "Liste de 4 a 7 conceitos principais. Para cada item, explique o conceito em 3 a 5 frases, indo além da definição superficial e, quando útil, traga mini-exemplos ou comparações.",
     "Cada item deve ser autoexplicativo, como um mini bloco de teoria."
   ],

   "exemplos": [
     "Crie pelo menos 3 exemplos detalhados, com situações reais ou cenários concretos que ajudem o aluno a visualizar o conceito aplicado.",
     "Use narrativas curtas (histórias simples) sempre que fizer sentido."
   ],

   "aplicacoes": [
     "Liste no mínimo 3 aplicações práticas no contexto profissional, acadêmico ou do dia a dia.",
     "Explique em 2 a 4 frases cada aplicação, destacando por que ela é relevante."
   ]
 },

 "analogias": [
   "Crie 1 ou 2 analogias mais profundas, comparando o tema da sessão com algo do cotidiano (ex.: esporte, trânsito, organização da casa, etc.), de forma que facilite a lembrança.",
   "As analogias devem ser fáceis de visualizar mentalmente."
 ],

 "ativacao": [
   "Crie 2 questões reflexivas que façam o aluno pensar em como o conteúdo se relaciona com sua realidade, decisões ou estudos.",
   "Evite perguntas de memorização direta; foque em compreensão."
 ],

 "quiz": {
   "pergunta": "Crie uma pergunta objetiva que cobre um ponto central da sessão.",
   "alternativas": [
     "Alternativa A clara, plausível, mas não correta.",
     "Alternativa B correta, com formulação precisa.",
     "Alternativa C plausível, mas incorreta por um detalhe conceitual."
   ],
   "corretaIndex": 1,
   "explicacao": "Explique por que a alternativa correta é a melhor escolha e por que as demais estão erradas. Use 3 a 5 frases."
 },

 "flashcards": [
   { "q": "Pergunta curta e direta sobre um conceito chave da sessão.", "a": "Resposta objetiva e clara." },
   { "q": "Outra pergunta sobre definição, diferença ou exemplo importante.", "a": "Resposta igualmente objetiva." }
 ],

 "resumo": [
   "Liste 5 a 7 bullets com os principais pontos da sessão, com frases curtas e diretas.",
   "Pense no resumo como algo que o aluno poderia revisar rapidamente no dia seguinte."
 ]
}
`;

      const raw = await callLLM(
        "Você é Liora, tutora especializada em microlearning aprofundado, aulas estruturadas e continuidade pedagógica.",
        prompt
      );

      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO (CARDS LADO DIREITO)
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
    // RENDERIZAÇÃO DO WIZARD (conteúdo hierárquico + quiz)
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      // limpa feedback de quiz ao trocar de sessão
      if (els.wizardQuizFeedback) {
        els.wizardQuizFeedback.textContent = "";
        els.wizardQuizFeedback.style.opacity = 0;
      }

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;
      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;

      const c = s.conteudo || {};

      els.wizardConteudo.innerHTML = `
        ${c.introducao ? `
          <div class="liora-section">
            <h5>INTRODUÇÃO</h5>
            <p>${c.introducao}</p>
          </div>
          <hr class="liora-divider">
        ` : ""}

        ${Array.isArray(c.conceitos) ? `
          <div class="liora-section">
            <h5>CONCEITOS PRINCIPAIS</h5>
            <ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">
        ` : ""}

        ${Array.isArray(c.exemplos) ? `
          <div class="liora-section">
            <h5>EXEMPLOS</h5>
            <ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">
        ` : ""}

        ${Array.isArray(c.aplicacoes) ? `
          <div class="liora-section">
            <h5>APLICAÇÕES</h5>
            <ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
        ` : ""}
      `;

      els.wizardAnalogias.innerHTML = Array.isArray(s.analogias)
        ? s.analogias.map(a => `<p>${a}</p>`).join("")
        : "";

      els.wizardAtivacao.innerHTML = Array.isArray(s.ativacao)
        ? s.ativacao.map(q => `<li>${q}</li>`).join("")
        : "";

      // QUIZ
      els.wizardQuiz.innerHTML = "";
      if (s.quiz) {
        const pergunta = document.createElement("p");
        pergunta.textContent = s.quiz.pergunta;
        els.wizardQuiz.appendChild(pergunta);

        const alternativas = (s.quiz.alternativas || []).map((alt, i) => ({
          texto: String(alt).replace(/\n/g, " ").replace(/<\/?[^>]+(>|$)/g, ""),
          correta: i === Number(s.quiz.corretaIndex),
        }));

        // embaralha
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

            if (!els.wizardQuizFeedback) return;

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
      }

      // FLASHCARDS
      els.wizardFlashcards.innerHTML = Array.isArray(s.flashcards)
        ? s.flashcards.map(f => `<li><b>${f.q}</b>: ${f.a}</li>`).join("")
        : "";

      // RESUMO RÁPIDO (se houver container)
      if (els.wizardResumo) {
        const lista = Array.isArray(s.resumo) ? s.resumo : [];
        els.wizardResumo.innerHTML = lista.map(item => `<li>${item}</li>`).join("");
      }

      // progresso geral (barra superior do wizard)
      if (els.wizardProgressBar && wizard.sessoes.length > 0) {
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
        atualizarStatus("tema", "🎉 Tema concluído!", 100);
      }
    });

    // --------------------------------------------------------
    // FLUXO COMUM (tema / upload) — reaproveitado
    // --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo) {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;
      btn.disabled = true;
      atualizarStatus(modo, "🧩 Criando plano...", 0);

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          const nomeAtual = plano[i].nome;
          const nomeAnterior = i > 0 ? plano[i - 1].nome : null;
          const nomeProximo = i < plano.length - 1 ? plano[i + 1].nome : null;

          atualizarStatus(
            modo,
            `⏳ Sessão ${i + 1}/${plano.length}: ${nomeAtual}`,
            ((i + 1) / plano.length) * 100
          );

          const sessao = await gerarSessao(
            tema,
            nivel,
            i + 1,
            nomeAtual,
            nomeAnterior,
            nomeProximo
          );

          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus(modo, "✅ Sessões concluídas!", 100);
        renderWizard();

      } catch (err) {
        console.error(err);
        alert("Erro ao gerar plano.");
      } finally {
        btn.disabled = false;
      }
    }

    // --------------------------------------------------------
    // BOTÕES PRINCIPAIS
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      // cache se já existir
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
      if (!file) return alert("Selecione um arquivo.");
      const tema = file.name.split(".")[0];

      // (no futuro podemos usar o texto do arquivo no prompt; por enquanto mantemos
      // o comportamento existente e usamos apenas o nome como tema)
      gerarFluxo(tema, nivel, "upload");
    });

    // --------------------------------------------------------
    // ATUALIZA NOME DO ARQUIVO (UPLOAD)
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

    console.log("🟢 core.js v48 carregado com sucesso");
  });
})();
