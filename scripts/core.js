// ===================================================================
// core.js v36 — Tema / Upload / Plano / Wizard
// ===================================================================

import { processarArquivoUpload, generatePlanFromUploadAI } from "./semantic.js";

console.log("🔵 Inicializando Liora Core v36...");

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
    uploadText: document.getElementById("upload-text"),
    btnGerarUpload: document.getElementById("btn-gerar-upload"),
    statusUpload: document.getElementById("status-upload"),

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

  // ====== THEME ===================================================
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
      apply(document.documentElement.classList.contains("light") ? "dark" : "light")
    );
  })();


  let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
  const key = (tema, nivel) => `liora:${tema}:${nivel}`;
  const saveProgress = () => localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));


  // ====== PLANO RESUMO =======================
  function renderPlanoResumo(plano) {
    els.plano.innerHTML = "";

    plano.forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "liora-card-topico";
      div.textContent = `Sessão ${i + 1} — ${p.nome}`;
      div.addEventListener("click", () => {
        wizard.atual = i;
        renderWizard();
      });
      els.plano.appendChild(div);
    });
  }


  // ====== EXIBE SESSÃO =======================
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

    els.wizardQuiz.innerHTML = "";
    els.wizardQuizFeedback.textContent = "";

    s.quiz.alternativas.forEach((alt, i) => {
      const opt = document.createElement("label");
      opt.className = "liora-quiz-option";
      opt.innerHTML = `<input type="radio" name="quiz">${alt}`;
      opt.addEventListener("click", () => {
        els.wizardQuizFeedback.textContent =
          i == s.quiz.corretaIndex ? "Correto!" : "Tente novamente.";
      });
      els.wizardQuiz.appendChild(opt);
    });

    els.wizardFlashcards.innerHTML =
      s.flashcards.map(f => `<li><strong>${f.q}</strong> — ${f.a}</li>`).join("");
  }


  // ====== GERAR VIA TEMA ======================
  els.btnGerar.addEventListener("click", async () => {
    const tema = els.inpTema.value.trim();
    const nivel = els.selNivel.value;
    if (!tema) return alert("Digite um tema.");

    els.ctx.textContent = "Gerando plano...";
    els.btnGerar.disabled = true;

    const out = await generatePlanFromUploadAI(nivel);
    wizard = { tema, nivel, plano: out.sessoes, sessoes: [], atual: 0 };
    renderPlanoResumo(out.sessoes);

    for (let i = 0; i < out.sessoes.length; i++) {
      els.ctx.textContent = `Gerando sessão ${i + 1}/${out.sessoes.length}...`;
      const s = await callSessao(tema, nivel, out.sessoes[i].numero, out.sessoes[i].nome);
      wizard.sessoes.push(s);
      saveProgress();
    }

    els.ctx.textContent = "";
    renderWizard();
    els.btnGerar.disabled = false;
  });


  // ====== GERAR VIA UPLOAD ======================
  els.inpFile.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) els.uploadText.textContent = f.name;
  });

  els.btnGerarUpload.addEventListener("click", async () => {
    const nivel = els.selNivel.value;
    const file = els.inpFile.files?.[0];
    if (!file) return alert("Selecione um arquivo.");

    els.statusUpload.textContent = "Processando...";
    els.btnGerarUpload.disabled = true;

    await processarArquivoUpload(file);
    const out = await generatePlanFromUploadAI(nivel);

    wizard = { tema: file.name, nivel, plano: out.sessoes, sessoes: [], atual: 0 };
    renderPlanoResumo(out.sessoes);

    for (let i = 0; i < out.sessoes.length; i++) {
      els.statusUpload.textContent = `Gerando sessão ${i + 1}/${out.sessoes.length}...`;
      const s = await callSessao(file.name, nivel, out.sessoes[i].numero, out.sessoes[i].nome);
      wizard.sessoes.push(s);
    }

    els.statusUpload.textContent = "";
    renderWizard();
    els.btnGerarUpload.disabled = false;
  });


  async function callSessao(tema, nivel, numero, nome) {
    const prompt = `
Gere a sessão ${numero} do tema "${tema}" no nível ${nivel}.
Formato JSON exato:
{
 "titulo":"...",
 "objetivo":"...",
 "conteudo":["..."],
 "analogias":["..."],
 "ativacao":["..."],
 "quiz":{"pergunta":"...","alternativas":["..."],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}`;
    const res = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: "Você é Liora.", user: prompt })
    });

    return JSON.parse((await res.json()).output);
  }

  console.log("🟢 core.js v36 carregado");
});
