// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v48)
// Conteúdo hierárquico + conexão automática entre sessões + resumo rápido
// Mantém estrutura estável do v47
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v48...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // MAPA DE ELEMENTOS (inalterado)
    // --------------------------------------------------------
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

      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

      wizardContainer: document.getElementById("liora-sessoes"),
      wizardTema: document.getElementById("liora-tema-ativo"),
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
      wizardProgressBar: document.getElementById("liora-progress-bar"),

      themeBtn: document.getElementById("btn-theme"),
    };

    // --------------------------------------------------------
    // 🌗 TEMA (mantido)
    // --------------------------------------------------------
    (function themeSetup() {
      function apply(theme) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.body.classList.remove("light", "dark");
        document.body.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      }
      apply(localStorage.getItem("liora_theme") || "dark");
      els.themeBtn.addEventListener("click", () => {
        const newTheme = document.documentElement.classList.contains("light") ? "dark" : "light";
        apply(newTheme);
      });
    })();

    // --------------------------------------------------------
    // STATUS + PROGRESSO (inalterado)
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;
      const barra = document.getElementById(modo === "tema" ? "barra-tema-fill" : "barra-upload-fill");
      if (barra && progresso !== null) barra.style.width = `${progresso}%`;
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
    const saveProgress = () => localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    const loadProgress = (tema, nivel) => JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");

    // --------------------------------------------------------
    // MODO (TEMA / UPLOAD)
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
    // CHAMADA À API
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
    // GERAÇÃO DE PLANO (mesmo formato)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Crie um plano de sessões interligadas para o tema "${tema}" (nível: ${nivel}).
Cada sessão deve representar uma progressão natural do aprendizado.
Retorne JSON puro, ex:
[
 {"numero":1,"nome":"Fundamentos"},
 {"numero":2,"nome":"Aplicações"}
]`;
      const raw = await callLLM("Você é Liora, especialista em microlearning estruturado e progressivo.", prompt);
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO (hierarquia + conexão + resumo)
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, sessaoAnterior = null, proximaSessao = null) {
      const contextoAnterior = sessaoAnterior ? `A sessão anterior abordou "${sessaoAnterior}".` : "";
      const contextoProximo = proximaSessao ? `A próxima sessão será "${proximaSessao}".` : "";

      const prompt = `
Gere a sessão ${numero} do tema "${tema}" (nível: ${nivel}).
${contextoAnterior}
${contextoProximo}
A estrutura deve seguir hierarquia didática e coerência entre sessões.
Retorne JSON puro:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"clareza sobre o foco e o resultado esperado da sessão",
 "conteudo":{
   "introducao":"breve contextualização que liga com a sessão anterior",
   "conceitos":["conceito 1","conceito 2","conceito 3"],
   "exemplos":["exemplo 1","exemplo 2"],
   "aplicacoes":["uso prático 1","uso prático 2"]
 },
 "analogias":["comparação didática com algo cotidiano"],
 "ativacao":["pergunta reflexiva 1","pergunta 2"],
 "quiz":{"pergunta":"?","alternativas":["a","b","c"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}],
 "resumo":["ponto 1","ponto 2","ponto 3"]
}`;
      const raw = await callLLM("Você é Liora, tutora especializada em microlearning progressivo e contextualizado.", prompt);
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO (inalterado)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
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
    // RENDERIZAÇÃO DO WIZARD — adiciona Resumo rápido
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      // limpa feedback anterior
      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;
      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;

      const c = s.conteudo || {};
      const h = (txt) => `<h5 style="text-transform:uppercase;color:var(--fg);font-weight:700;margin:0 0 6px 0;">${txt}</h5>`;
      const divider = `<hr class="liora-divider">`;

      let html = "";
      if (c.introducao) html += `<div class="liora-section">${h("Introdução")}<p>${c.introducao}</p></div>${divider}`;
      if (c.conceitos?.length) html += `<div class="liora-section">${h("Conceitos principais")}<ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul></div>${divider}`;
      if (c.exemplos?.length) html += `<div class="liora-section">${h("Exemplos")}<ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul></div>${divider}`;
      if (c.aplicacoes?.length) html += `<div class="liora-section">${h("Aplicações")}<ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul></div>`;

      // Resumo rápido
      if (Array.isArray(s.resumo) && s.resumo.length) {
        html += `
        <div class="liora-resumo">
          <h6 style="text-transform:uppercase;color:var(--brand);font-weight:700;font-size:0.85rem;margin-bottom:6px;">Resumo rápido</h6>
          <ul>${s.resumo.map(r => `<li>${r}</li>`).join("")}</ul>
        </div>`;
      }

      els.wizardConteudo.innerHTML = html;

      // demais blocos
      els.wizardAnalogias.innerHTML = (s.analogias || []).map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = (s.ativacao || []).map(q => `<li>${q}</li>`).join("");

      // Quiz
      els.wizardQuiz.innerHTML = "";
      const pergunta = document.createElement("p");
      pergunta.textContent = s.quiz.pergunta;
      els.wizardQuiz.appendChild(pergunta);

      const alternativas = s.quiz.alternativas.map((alt, i) => ({
        texto: String(alt).replace(/\n/g, " ").replace(/<\/?[^>]+(>|$)/g, ""),
        correta: i === Number(s.quiz.corretaIndex),
      }));
      for (let i = alternativas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
      }

      let tentativasErradas = 0;
      alternativas.forEach((altObj, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz" value="${i}"><span>${altObj.texto}</span>`;
        opt.addEventListener("click", () => {
          document.querySelectorAll(".liora-quiz-option").forEach(o => o.classList.remove("selected"));
          opt.classList.add("selected");
          opt.querySelector("input").checked = true;
          els.wizardQuizFeedback.style.opacity = 0;
          setTimeout(() => {
            if (altObj.correta) {
              els.wizardQuizFeedback.textContent = `✅ Correto! ${s.quiz.explicacao}`;
              els.wizardQuizFeedback.style.color = "var(--brand)";
              tentativasErradas = 0;
            } else {
              tentativasErradas++;
              if (tentativasErradas >= 2) {
                els.wizardQuizFeedback.textContent = `💡 Dica: ${s.quiz.explicacao}`;
                els.wizardQuizFeedback.style.color = "var(--brand)";
              } else {
                els.wizardQuizFeedback.textContent = "❌ Tente novamente.";
                els.wizardQuizFeedback.style.color = "var(--muted)";
              }
            }
            els.wizardQuizFeedback.style.transition = "opacity .4s ease";
            els.wizardQuizFeedback.style.opacity = 1;
          }, 100);
        });
        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = (s.flashcards || []).map(f => `<li><b>${f.q}</b>: ${f.a}</li>`).join("");
      els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO (inalterada)
    // --------------------------------------------------------
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
      } else {
        atualizarStatus("tema", "🎉 Tema concluído!", 100);
      }
    });

    // --------------------------------------------------------
    // FLUXO DE GERAÇÃO (ajustado para contexto entre sessões)
    // --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo, textoArquivo = null) {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;
      btn.disabled = true;
      atualizarStatus(modo, "🧩 Criando plano...", 0);

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          const anterior = i > 0 ? plano[i - 1].nome : null;
          const proxima = i < plano.length - 1 ? plano[i + 1].nome : null;
          atualizarStatus(modo, `⏳ Sessão ${i + 1}/${plano.length}: ${plano[i].nome}`, ((i + 1) / plano.length) * 100);
          const sessao = await gerarSessao(tema, nivel, i + 1, plano[i].nome, anterior, proxima);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus(modo, "✅ Sessões concluídas!", 100);
        renderWizard();

      } catch {
        alert("Erro ao gerar o plano.");
      } finally {
        btn.disabled = false;
      }
    }

    // --------------------------------------------------------
    // BOTÕES (inalterados)
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");
      gerarFluxo(tema, nivel, "tema");
    });
    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;
      if (!file) return alert("Selecione um arquivo.");
      const tema = file.name.split(".")[0];
      gerarFluxo(tema, nivel, "upload", await file.text());
    });

    els.inpFile.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const uploadText = document.getElementById("upload-text");
      const spinner = document.getElementById("upload-spinner");
      uploadText.textContent = file ? `Selecionado: ${file.name}` : "Clique ou arraste um arquivo (.txt, .pdf)";
      if (spinner) spinner.style.display = "none";
    });

    console.log("🟢 core.js v48 — conteúdo hierárquico + conexão + resumo carregado com sucesso");
  });
})();
