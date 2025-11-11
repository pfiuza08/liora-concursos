// ============================================================================
// core.js v33 — ES MODULE + anti-cache + wizard fix + upload fix
// ============================================================================

import { processarArquivoUpload, gerarPlanoViaUploadAI } from "./semantic.js?v=" + Date.now();

console.log("🔵 Inicializando Liora Core v33...");

document.addEventListener("DOMContentLoaded", () => {

  const els = {
    modoUpload: document.getElementById("modo-upload"),
    modoTema: document.getElementById("modo-tema"),
    painelUpload: document.getElementById("painel-upload"),
    painelTema: document.getElementById("painel-tema"),

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
    wizardProxima: document.getElementById("liora-btn-proxima"),
    wizardVoltar: document.getElementById("liora-btn-voltar"),
  };

  let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };

  function setMode(mode) {
    els.painelTema.classList.toggle("hidden", mode !== "tema");
    els.painelUpload.classList.toggle("hidden", mode !== "upload");
    els.modoTema.classList.toggle("selected", mode === "tema");
    els.modoUpload.classList.toggle("selected", mode === "upload");
  }

  els.modoTema.addEventListener("click", () => setMode("tema"));
  els.modoUpload.addEventListener("click", () => setMode("upload"));
  setMode("tema");

  async function callLLM(system, user) {
    const r = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, user }),
    });
    return (await r.json()).output;
  }

  async function gerarSessao(tema, nivel, numero, nome) {
    const raw = await callLLM("Você é Liora.", `
Gere conteúdo da sessão ${numero}, JSON exato:
{"titulo":"${nome}","objetivo":"","conteudo":[""],"analogias":[""],"ativacao":[""],"quiz":{"pergunta":"?","alternativas":["a","b"],"corretaIndex":1,"explicacao":""},"flashcards":[{"q":"","a":""}]}`);

    const s = JSON.parse(raw);
    return {
      numero,
      titulo: `Sessão ${numero} — ${s.titulo}`,
      objetivo: s.objetivo,
      conteudo: s.conteudo,
      analogias: s.analogias,
      ativacao: s.ativacao,
      quiz: s.quiz,
      flashcards: s.flashcards,
    };
  }

  function renderWizard() {
    const s = wizard.sessoes[wizard.atual];
    els.wizardContainer.classList.remove("hidden");
    els.wizardTema.textContent = wizard.tema;
    els.wizardProgressLabel.textContent = `${wizard.atual + 1}/${wizard.sessoes.length}`;
    els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

    els.wizardTitulo.textContent = s.titulo;
    els.wizardObjetivo.textContent = s.objetivo;
    els.wizardConteudo.innerHTML = s.conteudo.map((p) => `<p>${p}</p>`).join("");
    els.wizardAnalogias.innerHTML = s.analogias.map((a) => `<p>${a}</p>`).join("");
    els.wizardAtivacao.innerHTML = s.ativacao.map((q) => `<li>${q}</li>`).join("");

    els.wizardQuiz.innerHTML = "";
    s.quiz.alternativas.forEach((alt, i) => {
      const opt = document.createElement("label");
      opt.className = "liora-quiz-option";
      opt.innerHTML = `<input type="radio" name="quiz" value="${i}"><span>${alt}</span>`;
      opt.addEventListener("change", () => {
        els.wizardQuizFeedback.textContent =
          i === s.quiz.corretaIndex ? "✅ Correto!" : "❌ Tente novamente.";
      });
      els.wizardQuiz.appendChild(opt);
    });

    els.wizardFlashcards.innerHTML = s.flashcards
      .map((f) => `<li><strong>${f.q}</strong>: ${f.a}</li>`)
      .join("");
  }

  // -------------------------------------------------------
  // BOTÃO PRÓXIMA SESSÃO (listener garantido)
  // -------------------------------------------------------
  els.wizardProxima.addEventListener("click", () => {
    if (wizard.atual < wizard.sessoes.length - 1) wizard.atual++;
    renderWizard();
  });

  els.wizardVoltar.addEventListener("click", () => {
    if (wizard.atual > 0) wizard.atual--;
    renderWizard();
  });

  // -------------------------------------------------------
  // UPLOAD — NOVO fluxo
  // -------------------------------------------------------
  async function gerarPlanoViaUpload() {
    const nivel = els.selNivel.value;
    const file = els.inpFile.files?.[0];
    if (!file) return alert("Selecione um arquivo.");

    els.btnGerarUpload.disabled = true;
    els.statusUpload.textContent = "Processando...";

    await processarArquivoUpload(file);
    const sessoes = await gerarPlanoViaUploadAI(nivel);

    wizard = {
      tema: file.name,
      nivel,
      plano: sessoes,
      sessoes: [],
      atual: 0
    };

    for (let i = 0; i < sessoes.length; i++) {
      els.statusUpload.textContent = `(${i + 1}/${sessoes.length}) Gerando ${sessoes[i].nome}`;
      const sessao = await gerarSessao(file.name, nivel, i + 1, sessoes[i].nome);
      wizard.sessoes.push(sessao);
    }

    els.statusUpload.textContent = "Plano concluído!";
    els.btnGerarUpload.disabled = false;
    renderWizard();
  }

  els.btnGerarUpload.addEventListener("click", gerarPlanoViaUpload);

  console.log("🟢 core.js v33 carregado");
});
