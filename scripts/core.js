// ===================================================================
// core.js v35 — Tema / Upload / Plano / Wizard
// ===================================================================

console.log("🔵 Inicializando Liora Core v35...");

import { processarArquivoUpload, generatePlanFromUploadAI } from "./semantic.js";

document.addEventListener("DOMContentLoaded", () => {

  // -------------------- MAPA DE ELEMENTOS --------------------
  const els = {
    modoTema: document.getElementById("modo-tema"),
    modoUpload: document.getElementById("modo-upload"),
    painelTema: document.getElementById("painel-tema"),
    painelUpload: document.getElementById("painel-upload"),

    inpTema: document.getElementById("inp-tema"),
    selNivel: document.getElementById("sel-nivel"),
    btnGerar: document.getElementById("btn-gerar"),
    status: document.getElementById("status"),

    uploadZone: document.getElementById("upload-zone"),
    inpFile: document.getElementById("inp-file"),
    btnGerarUpload: document.getElementById("btn-gerar-upload"),
    statusUpload: document.getElementById("status-upload"),
    uploadText: document.getElementById("upload-text"),

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
    wizardProxima: document.getElementById("liora-btn-proxima"),

    themeBtn: document.getElementById("btn-theme"),
  };

  // -------------------- TEMA DARK / LIGHT --------------------
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
    els.themeBtn.addEventListener("click", () =>
      apply(document.body.classList.contains("light") ? "dark" : "light")
    );
  })();

  // -------------------- ESTADO GLOBAL --------------------
  let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
  const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
  const saveProgress = () => localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
  const loadProgress = (tema, nivel) => JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");

  // -------------------- API CALL --------------------
  async function callLLM(system, user) {
    const res = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, user }),
    });
    const json = await res.json();
    return json.output;
  }

  // -------------------- GERA SESSÃO --------------------
  async function gerarSessao(tema, nivel, numero, nome) {
    const prompt = `
Gere a sessão ${numero} do tema "${tema}".
Saída em JSON puro:
{
 "titulo": "${nome}",
 "objetivo": "resultado esperado",
 "conteudo": ["tópico1","tópico2"],
 "analogias": ["exemplo1"],
 "ativacao": ["q1","q2"],
 "quiz": {"pergunta":"?","alternativas":["a","b","c"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}`;
    const raw = await callLLM("Você é Liora.", prompt);
    return JSON.parse(raw);
  }

  // -------------------- EXIBE PLANO --------------------
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

  // -------------------- EXIBE SESSÃO --------------------
  function renderWizard() {
    const s = wizard.sessoes[wizard.atual];
    els.wizardContainer.classList.remove("hidden");
    els.wizardTema.textContent = wizard.tema;

    els.wizardProgressLabel.textContent =
      `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`;
    els.wizardProgressBar.style.width =
      `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

    els.wizardTitulo.textContent = s.titulo;
    els.wizardObjetivo.textContent = s.objetivo;
    els.wizardConteudo.innerHTML = s.conteudo.map(p => `<p>${p}</p>`).join("");
    els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
    els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

    // QUIZ
    els.wizardQuiz.innerHTML = "";
    els.wizardQuizFeedback.innerHTML = "";

    s.quiz.alternativas.forEach((alt, i) => {
      const opt = document.createElement("label");
      opt.className = "liora-quiz-option";
      opt.innerHTML = `<input type="radio" name="quiz">${alt}`;

      opt.addEventListener("click", () => {
        els.wizardQuizFeedback.textContent =
          i == s.quiz.corretaIndex ? "Resposta correta!" : "Tente novamente.";
      });

      els.wizardQuiz.appendChild(opt);
    });

    els.wizardFlashcards.innerHTML =
      s.flashcards.map(f => `<li><strong>${f.q}</strong> — ${f.a}</li>`).join("");
  }

  // -------------------- BOTÕES WIZARD --------------------
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
    }
  });

  // -------------------- GERAR PLANO (TEMA) --------------------
  els.btnGerar.addEventListener("click", async () => {
    const tema = els.inpTema.value.trim();
    const nivel = els.selNivel.value;

    if (!tema) return alert("Digite um tema.");

    els.ctx.textContent = "Gerando plano...";
    els.btnGerar.disabled = true;

    const cached = loadProgress(tema, nivel);
    if (cached) {
      wizard = cached;
      renderPlanoResumo(wizard.plano);
      renderWizard();
      els.btnGerar.disabled = false;
      return;
    }

    const plano = await generatePlanFromUploadAI(nivel); // IA decide
    wizard = { tema, nivel, plano: plano.sessoes, sessoes: [], atual: 0 };
    renderPlanoResumo(plano.sessoes);

    for (let i = 0; i < plano.sessoes.length; i++) {
      els.ctx.textContent = `Gerando sessão ${i + 1}/${plano.sessoes.length}`;
      const s = await gerarSessao(tema, nivel, plano.sessoes[i].numero, plano.sessoes[i].nome);
      wizard.sessoes.push(s);
      saveProgress();
    }

    els.ctx.textContent = "";
    renderWizard();
    els.btnGerar.disabled = false;
  });

  // -------------------- GERAR PLANO (UPLOAD) --------------------
  els.inpFile.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) els.uploadText.textContent = `Selecionado: ${f.name}`;
  });

  els.btnGerarUpload.addEventListener("click", async () => {
    const nivel = els.selNivel.value;
    const file = els.inpFile.files?.[0];
    if (!file) return alert("Selecione um arquivo.");

    els.statusUpload.textContent = "Processando arquivo...";
    els.btnGerarUpload.disabled = true;

    await processarArquivoUpload(file);
    const out = await generatePlanFromUploadAI(nivel);

    wizard = { tema: file.name, nivel, plano: out.sessoes, sessoes: [], atual: 0 };
    renderPlanoResumo(out.sessoes);

    for (let i = 0; i < out.sessoes.length; i++) {
      els.statusUpload.textContent = `Gerando sessão ${i + 1}/${out.sessoes.length}`;
      const s = await gerarSessao(out.tema, nivel, out.sessoes[i].numero, out.sessoes[i].nome);
      wizard.sessoes.push(s);
      saveProgress();
    }

    els.statusUpload.textContent = "";
    renderWizard();
    els.btnGerarUpload.disabled = false;
  });

  console.log("🟢 core.js v35 carregado");
});
