// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v17 FINAL)
// Tema / Upload + Sessões no modo WIZARD (sem lista)
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core...");

  document.addEventListener("DOMContentLoaded", () => {

    // 🔗 MAPA DE ELEMENTOS DA INTERFACE
    const els = {
      // Tema
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      // Upload
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      // UI (painéis)
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      themeBtn: document.getElementById("btn-theme"),

      // progress global
      progressBar: document.getElementById("progress-bar"),
      progressFill: document.getElementById("progress-fill"),

      // WIZARD (mini aulas)
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

    // =========================================================
    // 🌗 THEME
    // =========================================================
    function aplicarTema(mode) {
      document.documentElement.classList.toggle("light", mode === "light");
      document.body.classList.toggle("light", mode === "light");
      localStorage.setItem("liora_theme", mode);
      if (els.themeBtn) els.themeBtn.textContent = mode === "light" ? "☀️" : "🌙";
    }

    els.themeBtn?.addEventListener("click", () => {
      const atual = localStorage.getItem("liora_theme") || "dark";
      aplicarTema(atual === "light" ? "dark" : "light");
    });

    aplicarTema(localStorage.getItem("liora_theme") || "dark");

    // =========================================================
    // ⏳ PROGRESS BAR GLOBAL
    // =========================================================
    function iniciarProgresso() {
      if (!els.progressBar || !els.progressFill) return null;
      els.progressFill.style.width = "0%";
      els.progressBar.classList.remove("hidden");
      let p = 0;
      const timer = setInterval(() => {
        p += Math.random() * 10;
        if (p > 90) p = 90;
        els.progressFill.style.width = `${p}%`;
      }, 300);
      return timer;
    }

    function finalizarProgresso(ref) {
      if (!ref) return;
      clearInterval(ref);
      els.progressFill.style.width = "100%";
      setTimeout(() => els.progressBar.classList.add("hidden"), 500);
    }

    // =========================================================
    // 🔄 ALTERNÂNCIA ENTRE "TEMA" e "UPLOAD"
    // =========================================================
    els.modoTema?.addEventListener("click", () => {
      els.painelTema?.classList.remove("hidden");
      els.painelUpload?.classList.add("hidden");
    });

    els.modoUpload?.addEventListener("click", () => {
      els.painelUpload?.classList.remove("hidden");
      els.painelTema?.classList.add("hidden");
    });

    // =========================================================
    // 🟠 ESTADO DO WIZARD
    // =========================================================
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };

    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;

    function saveProgress() {
      localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    }

    function loadProgress(tema, nivel) {
      try {
        const raw = localStorage.getItem(key(tema, nivel));
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    // =========================================================
    // 🤖 IA — CHAMADA ÚNICA (usa window.LIORA.ask)
    // =========================================================
    async function callLLM(system, prompt) {
      if (window.LIORA && typeof window.LIORA.ask === "function") {
        const resp = await window.LIORA.ask({ system, user: prompt, stream: false });
        return typeof resp === "string"
          ? resp
          : resp?.text || resp?.output || resp?.choices?.[0]?.message?.content;
      }
      throw new Error("❌ Nenhum modelo da Liora configurado (window.LIORA.ask não encontrado).");
    }

    // =========================================================
    // 📘 GERAR PLANO DE SESSÕES (TEMA)
    // =========================================================
    async function gerarPlanoDeSessoes(tema, nivel) {

      if (typeof window.generatePlanByTheme === "function") {
        const out = await window.generatePlanByTheme(tema, nivel);
        const plano = out?.plano || out?.sessoes;
        if (Array.isArray(plano)) {
          return plano.map((s, i) => ({
            numero: s.numero ?? i + 1,
            nome: s.nome ?? s.titulo ?? `Sessão ${i + 1}`
          }));
        }
      }

      const system = "Você é a Liora, especialista em microlearning e método Oakley.";
      const prompt = `
Gere um plano de estudo para o tema "${tema}" (nível ${nivel}).
Formato JSON:
[
 {"numero":1,"nome":"Fundamentos"},
 {"numero":2,"nome":"Aplicações"}
]`;

      const raw = await callLLM(system, prompt);
      return JSON.parse(raw);
    }

    // =========================================================
    // 🎯 GERAR UMA SESSÃO COMPLETA (MINI-AULA)
    // =========================================================
    async function gerarSessao(tema, nivel, numero, nome) {
      const system = "Você é a Liora, especialista em microlearning e método Oakley.";
      const prompt = `
Gere sessão ${numero} do tema "${tema}" (nível ${nivel}), tópico "${nome}".
Formato JSON EXATO:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"resultado de aprendizagem claro",
 "conteudo":["p1","p2","p3"],
 "analogias":["a1","a2"],
 "ativacao":["perg1","perg2","perg3"],
 "quiz":{"pergunta":"?","alternativas":["a)","b)","c)"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"?","a":"..."}]
}`;
      return JSON.parse(await callLLM(system, prompt));
    }

    // =========================================================
    // 🖥️ RENDERIZAÇÃO DO WIZARD (SESSÃO ATUAL)
    // =========================================================
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardContainer.style.display = "block";

      els.wizardTema.textContent = wizard.tema;
      els.wizardProgressLabel.textContent = `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`;
      els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;
      els.wizardConteudo.innerHTML = s.conteudo.map(p => `<p>${p}</p>`).join("");
      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      els.wizardQuiz.innerHTML = "";
      const quizName = `liora-quiz-${wizard.atual}`;

      s.quiz.alternativas.forEach((alt, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="${quizName}" value="${i}"> ${alt}`;
        opt.onclick = () => {
          els.wizardQuizFeedback.textContent =
            i == s.quiz.corretaIndex ? `✅ Correto! ${s.quiz.explicacao}` : "❌ Tente novamente.";
        };
        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = s.flashcards.map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`).join("");

      els.wizardVoltar.disabled = wizard.atual === 0;
      els.wizardProxima.textContent =
        wizard.atual === wizard.sessoes.length - 1 ? "Concluir tema" : "Próxima sessão";
    }

    // =========================================================
    // 🧭 EVENTOS DO WIZARD
    // =========================================================
    els.wizardVoltar?.addEventListener("click", () => {
      wizard.atual--;
      renderWizard();
      saveProgress();
    });

    els.wizardSalvar?.addEventListener("click", () => {
      saveProgress();
      els.status.textContent = "💾 Progresso salvo";
      setTimeout(() => (els.status.textContent = ""), 1200);
    });

    els.wizardProxima?.addEventListener("click", () => {
      if (wizard.atual >= wizard.sessoes.length - 1) {
        els.status.textContent = "✨ Tema concluído!";
        return;
      }
      wizard.atual++;
      renderWizard();
      saveProgress();
    });

    // =========================================================
    // ✅ BOTÃO: GERAR (SESSÕES POR TEMA)
    // =========================================================
    els.btnGerar?.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Informe um tema.");

      const cached = loadProgress(tema, nivel);
      if (cached) {
        wizard = cached;
        renderWizard();
        return;
      }

      const ref = iniciarProgresso();
      els.ctx.textContent = "🧭 Gerando plano...";

      const plano = await gerarPlanoDeSessoes(tema, nivel);
      wizard = { tema, nivel, plano, sessoes: [], atual: 0 };

      els.ctx.textContent = "🧠 Criando sessões...";

      for (const item of plano) {
        const sess = await gerarSessao(tema, nivel, item.numero, item.nome);
        wizard.sessoes.push(sess);
        saveProgress();
      }

      finalizarProgresso(ref);
      els.ctx.textContent = "✅ Sessões prontas!";
      renderWizard();
    });

    // =========================================================
    // 📂 UPLOAD (preenchimento com preview)
    // =========================================================
    els.inpFile?.addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!window.processarArquivoUpload)
        return alert("❌ semantic.js não carregado.");

      els.statusUpload.textContent = "⏳ processando...";

      const result = await window.processarArquivoUpload(file);
      els.statusUpload.textContent = result.tipoMsg;
    });

    console.log("🟢 core.js com WIZARD carregado");
  });

})();
