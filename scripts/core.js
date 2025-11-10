// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v25 FINAL)
// Tema / Upload + Plano + Wizard com cards clicáveis
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v25...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // MAPA DE ELEMENTOS
    // --------------------------------------------------------
    const els = {
      // menu inicial (tema x upload)
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),

      // inputs tema
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

      // painel direito (resumo do plano)
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

      // wizard (abaixo do grid)
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

      // tema UI
      themeBtn: document.getElementById("btn-theme"),
    };

    // --------------------------------------------------------
    // TEMA (LIGHT / DARK)
    // --------------------------------------------------------
    (function themeSetup() {
      const btn = els.themeBtn;
      function apply(theme) {
        document.documentElement.classList.remove("light", "dark");
        document.body.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.body.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        btn.textContent = theme === "light" ? "☀️" : "🌙";
      }
      const saved = localStorage.getItem("liora_theme");
      apply(saved || "dark");
      btn.addEventListener("click", () => {
        const newMode = document.documentElement.classList.contains("light") ? "dark" : "light";
        apply(newMode);
      });
    })();

    // --------------------------------------------------------
    // ESTADO DO WIZARD
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
    const saveProgress = () => localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    const loadProgress = (tema, nivel) =>
      JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");

    // --------------------------------------------------------
    // ALTERNAÇÃO (Tema / Upload)
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
    // CHAMADA À API DA LIORA
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
    // GERAÇÃO: Plano de sessões (tema)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Crie um plano de sessões para o tema "${tema}" (nível: ${nivel}).
Formato do retorno: JSON puro (array):
[
  {"numero":1,"nome":"Fundamentos"},
  {"numero":2,"nome":"Aplicações"}
]`;

      const raw = await callLLM("Você é Liora, especialista em microlearning.", prompt);
      let arr = JSON.parse(raw);

      return arr.map((s, i) => ({
        numero: s.numero ?? i + 1,
        nome: s.nome ?? `Sessão ${i + 1}`,
      }));
    }

    // --------------------------------------------------------
    // GERAÇÃO: Conteúdo da sessão
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome) {
      const prompt = `
Gere a sessão ${numero} do tema "${tema}".
JSON exato:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"resultado claro",
 "conteudo":["p1","p2","p3"],
 "analogias":["a1","a2"],
 "ativacao":["q1","q2","q3"],
 "quiz":{"pergunta":"?","alternativas":["a)","b)","c)"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}`;
      const raw = await callLLM("Você é Liora.", prompt);
      const s = JSON.parse(raw);

      // remove duplicação "Sessão X — Sessão X — Nome"
      s.titulo = (s.titulo || nome).replace(/^Sessão\s*\d+\s*[—-]\s*/i, "");
      s.titulo = `Sessão ${numero} — ${s.titulo}`;

      return s;
    }

    // --------------------------------------------------------
    // RENDER: Plano (painel direito) com cards clicáveis
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      if (!plano.length) {
        els.plano.innerHTML = `<p class="text-[var(--muted)]">Nenhum plano gerado ainda.</p>`;
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
    // WIZARD (abaixo do grid)
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
      els.wizardConteudo.innerHTML = s.conteudo.map(p => `<p>${p}</p>`).join("");
      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      // quiz
      els.wizardQuiz.innerHTML = "";
      const pergunta = document.createElement("p");
      pergunta.className = "mb-2";
      pergunta.textContent = s.quiz.pergunta;
      els.wizardQuiz.appendChild(pergunta);

      s.quiz.alternativas.forEach((alt, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz" value="${i}"><span>${alt}</span>`;
        opt.addEventListener("change", () => {
          els.wizardQuizFeedback.textContent =
            i === Number(s.quiz.corretaIndex)
              ? `✅ Correto! ${s.quiz.explicacao}`
              : "❌ Tente novamente.";
        });
        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = s.flashcards
        .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`)
        .join("");
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO NO WIZARD
    // --------------------------------------------------------
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
      setTimeout(() => (els.status.textContent = ""), 1300);
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

    // --------------------------------------------------------
    // BOTÃO GERAR — TEMA
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;

      if (!tema) return alert("Digite um tema.");

      const cached = loadProgress(tema, nivel);
      if (cached && cached.sessoes.length) {
        wizard = cached;
        renderPlanoResumo(wizard.plano);
        renderWizard();
        return;
      }

      els.btnGerar.disabled = true;
      els.ctx.textContent = "🔧 Criando plano...";

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          els.ctx.textContent = `⏳ Sessão ${i + 1}/${plano.length}: ${plano[i].nome}`;
          const sessao = await gerarSessao(tema, nivel, plano[i].numero, plano[i].nome);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        els.ctx.textContent = "✅ Sessões prontas!";
        renderWizard();

      } catch (err) {
        alert("Erro ao gerar o plano. Veja o console.");
      } finally {
        els.btnGerar.disabled = false;
      }
    });

    // --------------------------------------------------------
    // UPLOAD (modo arquivos)
    // --------------------------------------------------------
    els.inpFile.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (f) els.uploadText.textContent = `Selecionado: ${f.name}`;
    });

    els.btnGerarUpload.addEventListener("click", async () => {
      const nivel = els.selNivel.value;
      const file = els.inpFile.files?.[0];
      if (!file) return alert("Selecione um arquivo.");

      if (!window.processarArquivoUpload || !window.generatePlanFromUploadAI) {
        return alert("semantic.js não carregou.");
      }

      els.btnGerarUpload.disabled = true;
      els.statusUpload.textContent = "⏳ Processando arquivo...";
      els.uploadSpinner.style.display = "inline-block";

      try {
        const r = await window.processarArquivoUpload(file);
        const out = await window.generatePlanFromUploadAI(nivel);

        const plano = (out?.sessoes || out?.plano || []).map((s, i) => ({
          numero: s.numero ?? i + 1,
          nome: s.nome ?? s.titulo ?? `Sessão ${i + 1}`,
        }));

        wizard = { tema: file.name, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          els.statusUpload.textContent = `⏳ Sessão ${i + 1}/${plano.length}: ${plano[i].nome}`;
          const sessao = await gerarSessao(wizard.tema, nivel, plano[i].numero, plano[i].nome);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        els.statusUpload.textContent = "✅ Sessões prontas!";
        renderWizard();

      } catch (err) {
        console.error(err);
        alert("Erro ao gerar plano via upload.");
      } finally {
        els.btnGerarUpload.disabled = false;
        els.uploadSpinner.style.display = "none";
      }
    });

    console.log("🟢 core.js v25 carregado");
  });
})();
