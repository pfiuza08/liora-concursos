// ============================================================================
// 🧠 LIORA — CORE PRINCIPAL (v32 FINAL)
// Tema / Upload + Plano + Wizard + Barra de progresso
// ============================================================================

(function () {
  console.log("🔵 Inicializando Liora Core v32...");

  document.addEventListener("DOMContentLoaded", () => {

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
      uploadText: document.getElementById("upload-text"),
      uploadSpinner: document.getElementById("upload-spinner"),

      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

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
    };

    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };

    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
    const saveProgress = () => localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    const loadProgress = (tema, nivel) => JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");

    function setMode(mode) {
      const tema = mode === "tema";
      els.painelTema.classList.toggle("hidden", !tema);
      els.painelUpload.classList.toggle("hidden", tema);
      els.modoTema.classList.toggle("selected", tema);
      els.modoUpload.classList.toggle("selected", !tema);
    }
    setMode("tema");

    // -------------------------------------------------------------------
    // LLM CALL
    // -------------------------------------------------------------------
    async function callLLM(system, user) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user }),
      });

      const json = await res.json().catch(() => ({}));
      return json.output;
    }

    // -------------------------------------------------------------------
    // GERAÇÃO: Sessão completa
    // -------------------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome) {
      const prompt = `
Gere a sessão número ${numero} do tema "${tema}".
Formato exato do retorno JSON:
{
 "titulo":"${nome}",
 "objetivo":"resultado claro",
 "conteudo":["item1","item2"],
 "analogias":["a1"],
 "ativacao":["q1","q2"],
 "quiz":{"pergunta":"?","alternativas":["a","b"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}`;

      const raw = await callLLM("Você é Liora.", prompt);
      const s = JSON.parse(raw);

      return {
        numero,
        titulo: `Sessão ${numero} — ${s.titulo || nome}`,
        objetivo: s.objetivo || "",
        conteudo: s.conteudo || [],
        analogias: s.analogias || [],
        ativacao: s.ativacao || [],
        quiz: s.quiz || { alternativas: [] },
        flashcards: s.flashcards || [],
      };
    }

    // -------------------------------------------------------------------
    // UI PLANOS
    // -------------------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      plano.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.textContent = `Sessão ${index + 1} — ${p.nome}`;
        div.addEventListener("click", () => {
          wizard.atual = index;
          renderWizard();
        });
        els.plano.appendChild(div);
      });
    }

    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;

      els.wizardProgressLabel.textContent = `Sessão ${wizard.atual + 1} / ${wizard.sessoes.length}`;
      els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;
      els.wizardConteudo.innerHTML = s.conteudo.map(p => `<p>${p}</p>`).join("");
      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      // QUIZ
      els.wizardQuiz.innerHTML = "";
      const pergunta = document.createElement("p");
      pergunta.textContent = s.quiz.pergunta || "—";
      els.wizardQuiz.appendChild(pergunta);

      s.quiz.alternativas.forEach((alt, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz" value="${i}"><span>${alt}</span>`;
        opt.addEventListener("change", () => {
          els.wizardQuizFeedback.textContent =
            i === Number(s.quiz.corretaIndex) ? "✅ Correto!" : "❌ Tente novamente.";
        });
        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = s.flashcards
        .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`)
        .join("");
    }

    // -------------------------------------------------------------------
    // GERAR PLANO — TEMA
    // -------------------------------------------------------------------
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      els.btnGerar.disabled = true;
      els.ctx.textContent = "Criando plano...";

      const prompt = `
Crie um plano de sessões para o tema "${tema}".
Retorno: JSON puro, ex:
[
  {"nome": "Fundamentos"},
  {"nome": "Aplicações"}
]`;

      const raw = await callLLM("Você é Liora, especialista em microlearning.", prompt);
      const arr = JSON.parse(raw);

      const plano = arr.map((s, i) => ({
        numero: i + 1,
        nome: s.nome || `Sessão ${i + 1}`
      }));

      wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
      renderPlanoResumo(plano);

      // BARRA DE PROGRESSO
      els.ctx.textContent = "Gerando sessões...";
      for (let i = 0; i < plano.length; i++) {
        els.ctx.textContent = `(${i + 1}/${plano.length}) Gerando: ${plano[i].nome}`;
        const sessao = await gerarSessao(tema, nivel, i + 1, plano[i].nome);
        wizard.sessoes.push(sessao);
      }

      els.ctx.textContent = "Plano concluído!";
      renderWizard();
      els.btnGerar.disabled = false;
    });

    // -------------------------------------------------------------------
    // GERAR PLANO — UPLOAD
    // -------------------------------------------------------------------
    els.btnGerarUpload.addEventListener("click", async () => {
      const nivel = els.selNivel.value;
      const file = els.inpFile.files?.[0];
      if (!file) return alert("Selecione um arquivo.");

      els.btnGerarUpload.disabled = true;
      els.statusUpload.textContent = "Processando...";

      await window.processarArquivoUpload(file);
      const out = await window.generatePlanFromUploadAI(nivel);

      const plano = out.sessoes.map((s, i) => ({
        numero: i + 1,
        nome: s.nome
      }));

      wizard = { tema: file.name, nivel, plano, sessoes: [], atual: 0 };
      renderPlanoResumo(plano);

      for (let i = 0; i < plano.length; i++) {
        els.statusUpload.textContent = `(${i + 1}/${plano.length}) Gerando: ${plano[i].nome}`;
        const sessao = await gerarSessao(file.name, nivel, i + 1, plano[i].nome);
        wizard.sessoes.push(sessao);
      }

      els.statusUpload.textContent = "Plano concluído!";
      renderWizard();
      els.btnGerarUpload.disabled = false;
    });

    console.log("🟢 core.js v32 carregado com sucesso");
  });
})();
