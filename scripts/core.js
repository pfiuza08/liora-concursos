// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v16)
// Tema / Upload + Sessões no modo WIZARD (sem lista).
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core...");

  document.addEventListener("DOMContentLoaded", () => {

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

      // UI
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      themeBtn: document.getElementById("btn-theme"),

      // progress
      progressBar: document.getElementById("progress-bar"),
      progressFill: document.getElementById("progress-fill"),

      // WIZARD
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

    // =========================
    //   THEME
    // =========================
    function aplicarTema(mode) {
      document.documentElement.classList.toggle("light", mode === "light");
      document.body.classList.toggle("light", mode === "light");
      localStorage.setItem("liora_theme", mode);
      els.themeBtn.textContent = mode === "light" ? "☀️" : "🌙";
    }
    els.themeBtn?.addEventListener("click", () => {
      const atual = localStorage.getItem("liora_theme") || "dark";
      aplicarTema(atual === "light" ? "dark" : "light");
    });
    aplicarTema(localStorage.getItem("liora_theme") || "dark");

    // =========================
    //   PROGRESS BAR
    // =========================
    function iniciarProgresso() {
      els.progressFill.style.width = "0%";
      els.progressBar.classList.remove("hidden");
      let p = 0;
      const timer = setInterval(() => {
        p += Math.random() * 10;
        if (p > 90) p = 90;
        els.progressFill.style.width = `${p}%`;
      }, 350);
      return timer;
    }
    function finalizarProgresso(ref) {
      clearInterval(ref);
      els.progressFill.style.width = "100%";
      setTimeout(() => els.progressBar.classList.add("hidden"), 500);
    }

    // =========================
    //   ALTERNÂNCIA DE MODO
    // =========================
    els.modoTema.addEventListener("click", () => {
      els.painelTema.classList.remove("hidden");
      els.painelUpload.classList.add("hidden");
    });
    els.modoUpload.addEventListener("click", () => {
      els.painelUpload.classList.remove("hidden");
      els.painelTema.classList.add("hidden");
    });

    // =========================================================
    // 🟠 WIZARD — ESTADO
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
      try {
        return JSON.parse(localStorage.getItem(key(tema, nivel)));
      } catch {
        return null;
      }
    }

    // =======================
// IA — unifica chamadas
// =======================
async function callLLM(system, prompt) {

  // ✅ SE EXISTE window.LIORA.ask → usa ela (já configurada no projeto)
  if (window.LIORA && typeof window.LIORA.ask === "function") {
    return await window.LIORA.ask({
      system,
      user: prompt,
      stream: false
    });
  }

  // ❌ NÃO usar /api/liora/generate (não existe)
  throw new Error("⚠️ Nenhum modelo configurado. Liora.ask não encontrado.");
}

    async function gerarPlanoDeSessoes(tema, nivel) {
      const system = "Você é a Liora, especialista em microlearning e método Oakley.";
      const prompt = `
Gere um plano de sessões para o tema "${tema}" (nível: ${nivel}).
Retorne JSON assim:
[
  {"numero":1,"nome":"Fundamentos"},
  {"numero":2,"nome":"Aplicações"}
]
      `;
      let out = await callLLM(system, prompt);
      try { return JSON.parse(out); }
      catch { return [{ numero: 1, nome: "Introdução" }, { numero: 2, nome: "Prática" }]; }
    }

    async function gerarSessao(tema, nivel, numero, nome) {
      const system = "Você é a Liora.";
      const prompt = `
Sessão ${numero}: ${nome}
Tema: ${tema}
Formato JSON EXATO:
{
 "titulo":"Sessão X — Nome",
 "objetivo":"...",
 "conteudo":["...","..."],
 "analogias":["..."],
 "ativacao":["...","...","..."],
 "quiz":{"pergunta":"...","alternativas":["a)","b)","c)"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}
      `;
      const out = await callLLM(system, prompt);
      try { return JSON.parse(out); }
      catch {
        return {
          titulo: `Sessão ${numero} — ${nome}`,
          objetivo: `Entender ${nome}`,
          conteudo: [`${nome} no contexto de ${tema}`],
          analogias: [`Pense em ${nome} como...`],
          ativacao: [`Explique ${nome} com suas palavras.`],
          quiz: { pergunta: "Teste", alternativas: ["a", "b", "c"], corretaIndex: 1, explicacao: "" },
          flashcards: [{ q: nome, a: "Resumo" }]
        }
      }
    }

    // =========================================================
    // WIZARD — RENDERIZAÇÃO
    // =========================================================
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      els.wizardContainer.style.display = "block";
      els.plano.innerHTML = ""; // esconde lista antiga

      els.wizardTema.textContent = wizard.tema;
      els.wizardProgressLabel.textContent = `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`;
      els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;

      els.wizardConteudo.innerHTML = s.conteudo.map(p => `<p>${p}</p>`).join("");
      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      els.wizardQuiz.innerHTML = "";
      s.quiz.alternativas.forEach((alt, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz" value="${i}"> ${alt}`;
        opt.onclick = () => {
          els.wizardQuizFeedback.textContent =
            i === s.quiz.corretaIndex ? `✅ Correto! ${s.quiz.explicacao}` : "❌ Tente novamente.";
        };
        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = s.flashcards
        .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`).join("");
    }

    // =========================================================
    // EVENTOS DO WIZARD
    // =========================================================
    els.wizardVoltar.onclick = () => {
      wizard.atual--;
      renderWizard();
      saveProgress();
    };

    els.wizardSalvar.onclick = () => {
      saveProgress();
      els.status.textContent = "💾 progresso salvo";
    };

    els.wizardProxima.onclick = () => {
      wizard.atual++;
      if (wizard.atual >= wizard.sessoes.length) {
        els.status.textContent = "✨ Tema finalizado!";
        return;
      }
      renderWizard();
      saveProgress();
    };

    // =========================================================
    // BOTÃO GERAR → AGORA USA O WIZARD
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
      const plano = await gerarPlanoDeSessoes(tema, nivel);
      wizard = { tema, nivel, plano, sessoes: [], atual: 0 };

      for (const p of plano) {
        const sessao = await gerarSessao(tema, nivel, p.numero, p.nome);
        wizard.sessoes.push(sessao);
        saveProgress();
      }

      finalizarProgresso(ref);
      renderWizard();
    });

    console.log("🟢 core.js com WIZARD carregado");
  });

})();
