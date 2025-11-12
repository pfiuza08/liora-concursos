// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v39)
// Padrão didático completo + Geração de sessões estruturadas
// ==========================================================
console.log("🔵 Inicializando Liora Core v39...");

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
    ctx: document.getElementById("ctx"),

    inpFile: document.getElementById("inp-file"),
    uploadText: document.getElementById("upload-text"),
    btnGerarUpload: document.getElementById("btn-gerar-upload"),
    statusUpload: document.getElementById("status-upload"),

    plano: document.getElementById("plano"),

    wizardContainer: document.getElementById("liora-sessoes"),
    wizardTema: document.getElementById("liora-tema-ativo"),
    wizardProgressBar: document.getElementById("liora-progress-bar"),
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

    themeBtn: document.getElementById("btn-theme"),
  };

  // ==========================================================
  // 🎨 TEMA (light/dark)
  // ==========================================================
  (function themeSetup() {
    function apply(theme) {
      document.documentElement.classList.remove("light", "dark");
      document.body.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
      document.body.classList.add(theme);
      els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      localStorage.setItem("liora_theme", theme);
    }

    apply(localStorage.getItem("liora_theme") || "dark");
    els.themeBtn.addEventListener("click", () => {
      const newMode = document.documentElement.classList.contains("light") ? "dark" : "light";
      apply(newMode);
    });
  })();

  // ==========================================================
  // 🧭 Alternar modo (Tema / Upload)
  // ==========================================================
  function setMode(mode) {
    const tema = mode === "tema";
    els.painelTema.classList.toggle("hidden", !tema);
    els.painelUpload.classList.toggle("hidden", tema);
    els.modoTema.classList.toggle("selected", tema);
    els.modoUpload.classList.toggle("selected", !tema);
  }
  els.modoTema.onclick = () => setMode("tema");
  els.modoUpload.onclick = () => setMode("upload");
  setMode("tema");

  // ==========================================================
  // 🔁 Estado global
  // ==========================================================
  let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };

  // ==========================================================
  // 🔧 Funções utilitárias
  // ==========================================================
  function renderPlanoResumo(plano) {
    els.plano.innerHTML = "";
    if (!plano?.length) return;

    plano.forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "liora-card-topico";
      div.textContent = `Sessão ${p.numero} — ${p.nome}`;
      div.addEventListener("click", () => {
        wizard.atual = i;
        renderWizard();
        window.scrollTo({ top: els.wizardContainer.offsetTop - 20, behavior: "smooth" });
      });
      els.plano.appendChild(div);
    });
  }

  function renderWizard() {
    const s = wizard.sessoes[wizard.atual];
    if (!s) return;

    els.wizardContainer.classList.remove("hidden");

    const pct = ((wizard.atual + 1) / wizard.sessoes.length) * 100;
    els.wizardProgressBar.style.width = `${pct}%`;
    els.wizardTema.textContent = wizard.tema;

    els.wizardTitulo.textContent = s.titulo || `Sessão ${wizard.atual + 1}`;
    els.wizardObjetivo.textContent = s.objetivo || "";

    els.wizardConteudo.innerHTML = (s.conteudo || [])
      .map((p) => `<p>${p}</p>`)
      .join("");

    els.wizardAnalogias.innerHTML = (s.analogias || [])
      .map((a) => `<p>${a}</p>`)
      .join("");

    els.wizardAtivacao.innerHTML = (s.ativacao || [])
      .map((q) => `<li>${q}</li>`)
      .join("");

    els.wizardQuiz.innerHTML = "";
    els.wizardQuizFeedback.textContent = "";

    if (s.quiz?.alternativas?.length) {
      s.quiz.alternativas.forEach((alt, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz" value="${i}"> <span>${alt}</span>`;
        opt.addEventListener("click", () => {
          els.wizardQuizFeedback.textContent =
            i === Number(s.quiz.corretaIndex)
              ? `✅ Correto! ${s.quiz.explicacao}`
              : "❌ Tente novamente.";
        });
        els.wizardQuiz.appendChild(opt);
      });
    }

    els.wizardFlashcards.innerHTML = (s.flashcards || [])
      .map((f) => `<li><strong>${f.q}</strong>: ${f.a}</li>`)
      .join("");
  }

  // ==========================================================
  // ⚙️ Geração de Sessão (com padrão fixo)
  // ==========================================================
  async function gerarSessaoLLM(tema, nivel, numero, nome) {
    const prompt = `
Você é Liora, especialista em microlearning. 
Crie a **Sessão ${numero}** do tema **"${tema}"** (nível: ${nivel}) seguindo ESTE FORMATO e PADRÕES DIDÁTICOS FIXOS:

{
 "titulo": "Sessão ${numero} — ${nome}",
 "objetivo": "1 frase em voz ativa, mensurável, começando com verbo no infinitivo (ex: 'Compreender...', 'Aplicar...')",
 "conteudo": [
   "Definição breve e técnica.",
   "Conceitos fundamentais e exemplos.",
   "Aplicações práticas.",
   "Erros comuns e como evitá-los."
 ],
 "analogias": [
   "Analogia criativa com algo cotidiano.",
   "Outra analogia reforçando o conceito."
 ],
 "ativacao": [
   "Pergunta reflexiva 1.",
   "Pergunta reflexiva 2."
 ],
 "quiz": {
   "pergunta": "Questão de múltipla escolha sobre ${nome}.",
   "alternativas": ["A", "B", "C"],
   "corretaIndex": 1,
   "explicacao": "Explique por que a alternativa correta está certa."
 },
 "flashcards": [
   {"q": "Pergunta direta sobre ${nome}.", "a": "Resposta objetiva e breve."},
   {"q": "Outra pergunta curta.", "a": "Resposta correspondente."}
 ]
}

⚠️ Retorne SOMENTE JSON puro, sem texto adicional.
⚠️ Não repita prefixos como “Sessão X — Sessão X —”.
⚠️ Use frases curtas e linguagem didática.
`;

    console.log(`🟠 Gerando Sessão ${numero}: ${nome}...`);
    const res = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: "Você é Liora.", user: prompt }),
    });

    const json = await res.json();
    try {
      const s = JSON.parse(json.output);
      s.titulo = `Sessão ${numero} — ${(s.titulo || nome).replace(/^Sessão\\s*\\d+\\s*[—-]\\s*/i, "")}`;
      return s;
    } catch (err) {
      console.error("Erro no parse da sessão:", err);
      return {
        titulo: `Sessão ${numero} — ${nome}`,
        objetivo: "Erro ao gerar esta sessão. Tente novamente.",
        conteudo: [],
        analogias: [],
        ativacao: [],
        quiz: { pergunta: "", alternativas: [], corretaIndex: 0, explicacao: "" },
        flashcards: [],
      };
    }
  }

  // ==========================================================
  // 📚 Geração via Tema
  // ==========================================================
  els.btnGerar.onclick = async () => {
    const tema = els.inpTema.value.trim();
    const nivel = els.selNivel.value;
    if (!tema) return alert("Digite um tema.");

    els.btnGerar.disabled = true;
    els.ctx.textContent = "🧩 Gerando plano...";
    console.log("🔸 Solicitando plano por tema...");

    try {
      const plan = await window.generatePlanFromTemaAI(tema, nivel);
      wizard = { tema: plan.tema || tema, nivel, plano: plan.sessoes, sessoes: [], atual: 0 };
      renderPlanoResumo(plan.sessoes);

      for (let i = 0; i < plan.sessoes.length; i++) {
        els.ctx.textContent = `⏳ Sessão ${i + 1}/${plan.sessoes.length}: ${plan.sessoes[i].nome}`;
        const sessao = await gerarSessaoLLM(wizard.tema, nivel, plan.sessoes[i].numero, plan.sessoes[i].nome);
        wizard.sessoes.push(sessao);
      }

      els.ctx.textContent = "✅ Sessões prontas!";
      renderWizard();
    } catch (err) {
      alert("Erro ao gerar plano por tema.");
      console.error(err);
    } finally {
      els.btnGerar.disabled = false;
    }
  };

  // ==========================================================
  // 📂 Geração via Upload
  // ==========================================================
  els.inpFile.onchange = (e) => {
    const f = e.target.files?.[0];
    els.uploadText.textContent = f ? `Selecionado: ${f.name}` : "Clique ou arraste um arquivo (.pdf, .txt)";
  };

  els.btnGerarUpload.onclick = async () => {
    const nivel = els.selNivel.value;
    const file = els.inpFile.files?.[0];
    if (!file) return alert("Selecione um arquivo.");

    els.btnGerarUpload.disabled = true;
    els.statusUpload.textContent = "📖 Lendo arquivo...";

    try {
      await window.processarArquivoUpload(file);
      els.statusUpload.textContent = "🧩 Criando plano...";
      const plan = await window.generatePlanFromUploadAI(nivel);

      wizard = { tema: plan.tema || file.name, nivel, plano: plan.sessoes, sessoes: [], atual: 0 };
      renderPlanoResumo(plan.sessoes);

      for (let i = 0; i < plan.sessoes.length; i++) {
        els.statusUpload.textContent = `⏳ Sessão ${i + 1}/${plan.sessoes.length}: ${plan.sessoes[i].nome}`;
        const sessao = await gerarSessaoLLM(wizard.tema, nivel, plan.sessoes[i].numero, plan.sessoes[i].nome);
        wizard.sessoes.push(sessao);
      }

      els.statusUpload.textContent = "✅ Sessões completas!";
      renderWizard();
    } catch (err) {
      alert("Erro ao gerar via upload.");
      console.error(err);
    } finally {
      els.btnGerarUpload.disabled = false;
    }
  };

  // ==========================================================
  // ⏩ Navegação Wizard
  // ==========================================================
  els.wizardVoltar.onclick = () => {
    if (wizard.atual > 0) {
      wizard.atual--;
      renderWizard();
    }
  };

  els.wizardProxima.onclick = () => {
    if (wizard.atual < wizard.sessoes.length - 1) {
      wizard.atual++;
      renderWizard();
    }
  };

  console.log("🟢 core.js v39 carregado com sucesso");
});
