// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v21)
// Tema / Upload + Sessões no modo WIZARD (sem lista).
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core...");

  document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // MAPA DE ELEMENTOS
    // =========================================================
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

      // UI painéis
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      themeBtn: document.getElementById("btn-theme"),

      // Progress bar
      progressBar: document.getElementById("progress-bar"),
      progressFill: document.getElementById("progress-fill"),

      // Wizard
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
    // THEME
    // =========================================================
    function aplicarTema(mode) {
      document.documentElement.classList.toggle("light", mode === "light");
      document.body.classList.toggle("light", mode === "light");
      localStorage.setItem("liora_theme", mode);
      els.themeBtn.textContent = mode === "light" ? "☀️" : "🌙";
    }

    els.themeBtn.addEventListener("click", () => {
      const atual = localStorage.getItem("liora_theme") || "dark";
      aplicarTema(atual === "light" ? "dark" : "light");
    });

    aplicarTema(localStorage.getItem("liora_theme") || "dark");

    // =========================================================
    // PROGRESS BAR
    // =========================================================
    function iniciarProgresso() {
      els.progressFill.style.width = "0%";
      els.progressBar.classList.remove("hidden");
      let p = 0;
      const timer = setInterval(() => {
        p += Math.random() * 12;
        if (p > 90) p = 90;
        els.progressFill.style.width = `${p}%`;
      }, 350);
      return timer;
    }

    function finalizarProgresso(ref) {
      clearInterval(ref);
      els.progressFill.style.width = "100%";
      setTimeout(() => els.progressBar.classList.add("hidden"), 600);
    }

    // =========================================================
    // ALTERNÂNCIA TEMA ↔ UPLOAD
    // =========================================================
    els.modoTema.addEventListener("click", () => {
      els.painelTema.classList.remove("hidden");
      els.painelUpload.classList.add("hidden");
    });

    els.modoUpload.addEventListener("click", () => {
      els.painelUpload.classList.remove("hidden");
      els.painelTema.classList.add("hidden");
    });

    // =========================================================
    // ESTADO DO WIZARD
    // =========================================================
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0
    };

    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;

    function saveProgress() {
      localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    }

    function loadProgress(tema, nivel) {
      const raw = localStorage.getItem(key(tema, nivel));
      return raw ? JSON.parse(raw) : null;
    }

    // =========================================================
    // GARANTE QUE O WIZARD FIQUE VISÍVEL NO MAIN
    // =========================================================
    function ensureWizardVisible() {
      const wc = els.wizardContainer;
      if (!wc) return;

      wc.hidden = false;
      wc.classList.remove("hidden");
      wc.style.display = "block";
      wc.style.width = "100%";

      const main = document.querySelector("main");
      if (main && wc.parentElement !== main) {
        main.appendChild(wc);
      }
    }

    // =========================================================
    // CHAMADA À API `/api/liora`
    // =========================================================
    async function callLLM(system, prompt) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user: prompt })
      });

      const json = await res.json();
      if (!json.output) throw new Error("Resposta inválida da IA");

      return json.output;
    }

    // =========================================================
    // GERAÇÃO DE PLANO (LISTA DE SESSÕES)
    // =========================================================
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Gere um plano de sessões para o tema "${tema}" (nível: ${nivel}).
Retorne JSON:
[
  {"numero":1, "nome":"Fundamentos"},
  {"numero":2, "nome":"Aplicações"}
]`;

      const raw = await callLLM("Você é Liora, especialista em microlearning.", prompt);
      return JSON.parse(raw);
    }

    // =========================================================
    // GERAÇÃO DE UMA SESSÃO (CONTEÚDO COMPLETO)
    // =========================================================
    async function gerarSessao(tema, nivel, numero, nome) {
      const prompt = `
Sessão ${numero}: ${nome}
Tema: ${tema}
Formato JSON EXATO:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"...",
 "conteudo":["...","..."],
 "analogias":["..."],
 "ativacao":["...","...","..."],
 "quiz":{"pergunta":"...","alternativas":["a)","b)","c)"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}`;

      const raw = await callLLM("Você é Liora.", prompt);
      return JSON.parse(raw);
    }

    // =========================================================
    // RENDERIZAÇÃO DO WIZARD
    // =========================================================
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      ensureWizardVisible();

      if (els.plano) els.plano.innerHTML = "";

      els.wizardTema.textContent = wizard.tema;
      els.wizardProgressLabel.textContent = `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`;
      els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;
      els.wizardConteudo.innerHTML = s.conteudo.map(p => `<p>${p}</p>`).join("");
      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      // ✅ Quiz com pergunta + layout correto
      els.wizardQuiz.innerHTML = `<p class="liora-quiz-question">${s.quiz.pergunta}</p>`;
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
      els.wizardProxima.textContent = wizard.atual === wizard.sessoes.length - 1 ? "Concluir tema" : "Próxima sessão";
    }

    // =========================================================
    // BOTÕES DO WIZARD
    // =========================================================
    els.wizardVoltar.addEventListener("click", () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
        saveProgress();
      }
    });

    els.wizardSalvar.addEventListener("click", () => {
      saveProgress();
      els.status.textContent = "💾 Progresso salvo!";
      setTimeout(() => els.status.textContent = "", 1500);
    });

    els.wizardProxima.addEventListener("click", () => {
      if (wizard.atual >= wizard.sessoes.length - 1) {
        els.status.textContent = "🎉 Tema concluído!";
        return;
      }
      wizard.atual++;
      renderWizard();
      saveProgress();
    });

    // =========================================================
    // GERAR PLANO (BOTÃO)
    // =========================================================
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;

      if (!tema) return alert("Digite um tema.");

      const cached = loadProgress(tema, nivel);
      if (cached) {
        wizard = cached;
        renderWizard();
        return;
      }

      const ref = iniciarProgresso();

      try {
        els.ctx.textContent = "🧭 Gerando plano...";
        const plano = await gerarPlanoDeSessoes(tema, nivel);

        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };

        for (const item of plano) {
          els.status.textContent = `🧠 Sessão ${item.numero} — ${item.nome}`;
          const sessao = await gerarSessao(tema, nivel, item.numero, item.nome);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        els.status.textContent = "✅ Sessões prontas!";
        renderWizard();

      } catch (e) {
        console.error(e);
        alert("Erro ao gerar sessões.");
      } finally {
        finalizarProgresso(ref);
      }
    });

    console.log("🟢 core.js com WIZARD carregado");
  });
})();
