// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v30)
// IA decide nº de sessões com base no conteúdo do upload
// Geração robusta + Quiz corrigido + Progresso visível
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v30...");

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
      uploadZone: document.getElementById("upload-zone"),
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),
      uploadText: document.getElementById("upload-text"),
      uploadSpinner: document.getElementById("upload-spinner"),

      // painel direito
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

      // wizard
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

    // --------------------------------------------------------
    // GARANTE BARRA DE PROGRESSO (se não existir no HTML)
    // --------------------------------------------------------
    let progressWrapper = document.getElementById("liora-generating-progress");
    let progressBar = document.getElementById("liora-generating-progress-bar");
    if (!progressWrapper) {
      progressWrapper = document.createElement("div");
      progressWrapper.id = "liora-generating-progress";
      progressWrapper.style.display = "none";
      progressWrapper.innerHTML = `<div id="liora-generating-progress-bar"></div>`;
      // insere logo abaixo do #ctx (painel direito)
      if (els.ctx && els.ctx.parentElement) {
        els.ctx.parentElement.appendChild(progressWrapper);
      }
      progressBar = progressWrapper.querySelector("#liora-generating-progress-bar");
    }

    function showProgress(p = 0) {
      progressWrapper.style.display = "block";
      progressBar.style.width = `${Math.max(0, Math.min(100, p))}%`;
    }
    function hideProgress() {
      setTimeout(() => {
        progressWrapper.style.display = "none";
        progressBar.style.width = "0%";
      }, 500);
    }

    // --------------------------------------------------------
    // THEME (LIGHT/DARK)
    // --------------------------------------------------------
    (function themeSetup() {
      function apply(theme) {
        document.documentElement.classList.remove("light", "dark");
        document.body.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.body.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      }
      apply(localStorage.getItem("liora_theme") || "dark");
      els.themeBtn.addEventListener("click", () => {
        const newMode = document.documentElement.classList.contains("light") ? "dark" : "light";
        apply(newMode);
      });
    })();

    // --------------------------------------------------------
    // ESTADO GLOBAL (sem reaproveitar planos antigos)
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };

    // --------------------------------------------------------
    // MODO (Tema / Upload)
    // --------------------------------------------------------
    function setMode(mode) {
      const tema = mode === "tema";
      els.painelTema.classList.toggle("hidden", !tema);
      els.painelUpload.classList.toggle("hidden", tema);
      els.modoTema.classList.toggle("selected", tema);
      els.modoUpload.classList.toggle("selected", !tema);
    }
    els.modoTema?.addEventListener("click", () => setMode("tema"));
    els.modoUpload?.addEventListener("click", () => setMode("upload"));
    setMode("tema");

    // --------------------------------------------------------
    // HELPERS: chamada IA + sanitização de JSON
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

    function cleanToJSON(raw) {
      if (!raw || typeof raw !== "string") return "";
      return raw.trim().replace(/^[\s\S]*?(\[|\{)/, "$1").replace(/(\]|\})[\s\S]*$/, "$1");
    }

    async function parseJSONorRetry(rawGenerator, maxRetries = 1) {
      for (let t = 0; t <= maxRetries; t++) {
        let raw = await rawGenerator(t);
        const cleaned = cleanToJSON(raw);
        try {
          return JSON.parse(cleaned);
        } catch (e) {
          if (t === maxRetries) throw e;
          console.warn("JSON inválido. Tentando novamente…");
        }
      }
    }

    // --------------------------------------------------------
    // TEMA: IA monta o PLANO (quantidade de sessões por contexto do tema)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const system = `Você é LIORA, especialista em microlearning. Responda SOMENTE com JSON válido.`;
      const user = `
Crie um plano de estudo dividido em sessões para o tema "${tema}".
Nível: ${nivel.toUpperCase()}.
Retorne SOMENTE JSON no formato:
[
  {"numero":1,"nome":"Fundamentos"},
  {"numero":2,"nome":"Aplicações"}
]
Use bom senso para a quantidade de sessões (4 a 10), conforme a abrangência do tema.
`;
      const parsed = await parseJSONorRetry(async () => callLLM(system, user), 1);
      return parsed.map((s, i) => ({
        numero: s.numero ?? i + 1,
        nome: s.nome ?? `Sessão ${i + 1}`,
      }));
    }

    // --------------------------------------------------------
    // UPLOAD: IA decide a quantidade de sessões com base no CONTEÚDO
    // --------------------------------------------------------
    async function gerarPlanoDeSessoesViaUpload(nivel, uploadOut) {
      // uploadOut pode conter texto/estatísticas; usamos o que existir
      const texto = (uploadOut?.texto || uploadOut?.text || "").toString();
      const palavras = uploadOut?.palavras || uploadOut?.words ||
                       (texto ? texto.trim().split(/\s+/).length : 0);
      const paginas = uploadOut?.paginas || uploadOut?.pages || null;

      // recorte de contexto (evitar prompt muito longo)
      const amostra = texto.slice(0, 2000); // ~ primeira janela de conteúdo

      const system = `Você é LIORA, especialista em microlearning. Responda SOMENTE com JSON válido.`;
      const user = `
Você receberá uma amostra de um material didático (upload do usuário).
Com base no CONTEÚDO (tópicos, densidade e progressão pedagógica), defina uma quantidade apropriada de sessões (mín 4, máx 12), e NOMEIE cada sessão.
Nível do aluno: ${nivel.toUpperCase()}.

Amostra do material (parcial):
"""
${amostra}
"""

Estatísticas aproximadas:
- palavras: ${palavras || "indisponível"}
- páginas: ${paginas || "indisponível"}

RETORNE SOMENTE JSON no formato de array:
[
  {"numero":1,"nome":"Sessão introdutória X"},
  {"numero":2,"nome":"Tópico importante Y"},
  {"numero":3,"nome":"Prática / exercícios"},
  ...
]
Não escreva comentários fora do JSON.
`;
      const parsed = await parseJSONorRetry(async () => callLLM(system, user), 2);
      // normaliza
      return parsed.slice(0, 12).map((s, i) => ({
        numero: s.numero ?? i + 1,
        nome: s.nome ?? `Sessão ${i + 1}`,
      }));
    }

    // --------------------------------------------------------
    // GERAR UMA SESSÃO COMPLETA (robusto)
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome) {
      const system = `Você é LIORA. Retorne SOMENTE JSON válido.`;
      const user = `
Gere o conteúdo da sessão ${numero} do tema "${tema}".
Nível: ${nivel.toUpperCase()}.
Formato obrigatório (somente JSON):
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"resultado claro e específico",
 "conteudo":["p1","p2","p3"],
 "analogias":["a1","a2"],
 "ativacao":["q1","q2"],
 "quiz":{"pergunta":"?","alternativas":["a","b","c"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}
Não escreva nada fora do JSON.
`;
      const parsed = await parseJSONorRetry(async () => callLLM(system, user), 2);

      return {
        titulo: `Sessão ${numero} — ${String(parsed.titulo || nome).replace(/^Sessão\s*\d+\s*[—-]\s*/i, "")}`,
        objetivo: parsed.objetivo ?? "",
        conteudo: Array.isArray(parsed.conteudo) ? parsed.conteudo : [],
        analogias: Array.isArray(parsed.analogias) ? parsed.analogias : [],
        ativacao: Array.isArray(parsed.ativacao) ? parsed.ativacao : [],
        quiz: parsed.quiz && parsed.quiz.alternativas
          ? parsed.quiz
          : { pergunta: "", alternativas: [], corretaIndex: 0, explicacao: "" },
        flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
      };
    }

    // --------------------------------------------------------
    // RENDER: Cards do plano (lado direito)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      if (!plano?.length) {
        els.plano.innerHTML = `<p class="text-[var(--muted)]">Nenhum plano gerado.</p>`;
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
    // RENDER: Wizard + Quiz corrigido + Divider animado
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardContainer.classList.remove("hidden");

      els.wizardTema.textContent = wizard.tema;
      els.wizardProgressLabel.textContent = `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`;
      els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;
      els.wizardConteudo.innerHTML = (s.conteudo || []).map(p => `<p>${p}</p>`).join("");
      els.wizardAnalogias.innerHTML = (s.analogias || []).map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = (s.ativacao || []).map(q => `<li>${q}</li>`).join("");

      // QUIZ — montagem e correção
      els.wizardQuiz.innerHTML = "";
      els.wizardQuizFeedback.textContent = "";
      if (s.quiz?.pergunta && Array.isArray(s.quiz.alternativas)) {
        const pergunta = document.createElement("p");
        pergunta.className = "mb-2 font-semibold";
        pergunta.textContent = s.quiz.pergunta;
        els.wizardQuiz.appendChild(pergunta);

        s.quiz.alternativas.forEach((alt, i) => {
          const opt = document.createElement("div");
          opt.className = "liora-quiz-option";
          opt.innerHTML = `
            <input type="radio" name="quiz-${wizard.atual}" value="${i}" />
            <span class="liora-quiz-option-text">${alt}</span>
          `;
          opt.addEventListener("click", () => {
            els.wizardQuiz.querySelectorAll(".liora-quiz-option").forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
            const correta = Number(s.quiz.corretaIndex);
            if (i === correta) {
              els.wizardQuizFeedback.textContent = s.quiz.explicacao || "Correto.";
              els.wizardQuizFeedback.className = "liora-quiz-feedback correct";
            } else {
              els.wizardQuizFeedback.textContent = "Resposta incorreta. Tente novamente.";
              els.wizardQuizFeedback.className = "liora-quiz-feedback error";
            }
          });
          els.wizardQuiz.appendChild(opt);
        });
      }

      els.wizardFlashcards.innerHTML = (s.flashcards || [])
        .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`)
        .join("");

      // Divider animado automaticamente
      document.querySelectorAll(".liora-block").forEach(block => {
        block.classList.remove("animate-divider");
        setTimeout(() => block.classList.add("animate-divider"), 60);
      });
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO WIZARD
    // --------------------------------------------------------
    els.wizardVoltar?.addEventListener("click", () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
      }
    });
    els.wizardProxima?.addEventListener("click", () => {
      if (wizard.atual < wizard.sessoes.length - 1) {
        wizard.atual++;
        renderWizard();
      }
    });
    els.wizardSalvar?.addEventListener("click", () => {
      els.status.textContent = "Progresso salvo.";
      setTimeout(() => (els.status.textContent = ""), 1200);
    });

    // --------------------------------------------------------
    // GERAR (TEMA) — com progresso
    // --------------------------------------------------------
    els.btnGerar?.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      els.btnGerar.disabled = true;
      els.ctx.textContent = "Criando plano...";
      showProgress(0);

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          els.ctx.textContent = `Gerando sessão ${i + 1}/${plano.length}`;
          showProgress(((i) / plano.length) * 100);
          const sessao = await gerarSessao(tema, nivel, plano[i].numero, plano[i].nome);
          wizard.sessoes.push(sessao);
        }

        showProgress(100);
        els.ctx.textContent = "";
        renderWizard();
      } catch (err) {
        console.error(err);
        alert("Erro ao gerar o plano (tema).");
      } finally {
        hideProgress();
        els.btnGerar.disabled = false;
      }
    });

    // --------------------------------------------------------
    // UPLOAD — IA decide nº de sessões pelo CONTEÚDO
    // --------------------------------------------------------
    els.inpFile?.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (f) els.uploadText.textContent = `Selecionado: ${f.name}`;
    });

    els.btnGerarUpload?.addEventListener("click", async () => {
      const nivel = els.selNivel.value;
      const file = els.inpFile.files?.[0];
      if (!file) return alert("Selecione um arquivo.");

      if (!window.processarArquivoUpload || !window.generatePlanFromUploadAI) {
        return alert("semantic.js não carregou.");
      }

      els.btnGerarUpload.disabled = true;
      els.statusUpload.textContent = "Processando arquivo...";
      els.uploadSpinner.style.display = "inline-block";
      showProgress(0);

      try {
        // 1) Extrai/normaliza upload
        const uploadOut = await window.processarArquivoUpload(file); // deve extrair texto/estatísticas
        // 2) IA decide o plano (qtd + nomes) com base no CONTEÚDO
        let plano = await gerarPlanoDeSessoesViaUpload(nivel, uploadOut);

        // fallback: se semantic.js já sugerir um plano, pode mesclar
        const out = await window.generatePlanFromUploadAI(nivel).catch(() => null);
        if (out?.sessoes?.length || out?.plano?.length) {
          const sugerido = (out.sessoes || out.plano).map((s, i) => ({
            numero: s.numero ?? i + 1,
            nome: s.nome ?? s.titulo ?? `Sessão ${i + 1}`,
          }));
          // mescla (prioriza IA-conteúdo, mas se vier muito curto, complementa com sugerido)
          if (plano.length < sugerido.length) {
            const nomesExtra = sugerido.slice(plano.length).map((s, idx) => ({
              numero: plano.length + idx + 1,
              nome: s.nome
            }));
            plano = [...plano, ...nomesExtra].slice(0, 12);
          }
        }

        wizard = { tema: file.name, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        // 3) Gera sessões completas
        for (let i = 0; i < plano.length; i++) {
          els.statusUpload.textContent = `Gerando sessão ${i + 1}/${plano.length}`;
          showProgress(((i) / plano.length) * 100);
          const sessao = await gerarSessao(wizard.tema, nivel, plano[i].numero, plano[i].nome);
          wizard.sessoes.push(sessao);
        }

        showProgress(100);
        els.statusUpload.textContent = "Concluído.";
        renderWizard();

      } catch (err) {
        console.error(err);
        alert("Erro ao gerar plano via upload.");
      } finally {
        els.btnGerarUpload.disabled = false;
        els.uploadSpinner.style.display = "none";
        hideProgress();
      }
    });

    console.log("🟢 core.js v30 carregado");
  });
})();
