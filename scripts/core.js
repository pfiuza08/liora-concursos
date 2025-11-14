// ==========================================================
// 🧠 LIORA — CORE v60
// Capítulo → Sessão (fidelidade total ao PDF)
// Resumo fiel + enrich sem sair do capítulo
// Processamento capítulo por capítulo
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v60...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // ELEMENTOS
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
    // FUNÇÕES AUXILIARES
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;

      const barra = document.getElementById(modo === "tema" ? "barra-tema-fill" : "barra-upload-fill");
      if (barra && progresso !== null) barra.style.width = `${progresso}%`;
    }

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    // --------------------------------------------------------
    // LLM CALL
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
    // 1) DETECÇÃO DE CAPÍTULOS (robusta)
    // --------------------------------------------------------
    function extrairCapitulos(texto) {
      const linhas = texto.split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

      const capitulos = [];
      let atual = { titulo: null, conteudo: [] };

      const regexCap =
        /^(cap[ií]tulo\s+\d+[\s:.-]*.+|cap[ií]tulo\s+\d+|[a-zA-Z ]{3,50}\s+[\dIVX]+\b)/i;

      for (const linha of linhas) {
        if (regexCap.test(linha)) {
          if (atual.titulo) capitulos.push({ ...atual });
          atual = { titulo: linha, conteudo: [] };
        } else {
          atual.conteudo.push(linha);
        }
      }

      if (atual.titulo) capitulos.push(atual);

      return capitulos;
    }

    // --------------------------------------------------------
    // 2) GERAÇÃO DA SESSÃO (por capítulo)
    // --------------------------------------------------------
    async function gerarSessaoPorCapitulo(capitulo, numero, total) {
      const prompt = `
Você é Liora, especialista em educação.

Leia **exclusivamente** o capítulo abaixo e gere uma sessão fiel ao conteúdo:

TÍTULO DO CAPÍTULO:
${capitulo.titulo}

CONTEÚDO DO CAPÍTULO:
${capitulo.conteudo.join("\n")}

Produza JSON **puro**:

{
 "titulo": "Sessão ${numero} — ${capitulo.titulo}",
 "objetivo": "objetivo claro baseado só no capítulo",
 "conteudo": {
   "introducao": "...",
   "conceitos": ["...", "...", "..."],
   "exemplos": ["...", "..."],
   "aplicacoes": ["...", "..."],
   "resumoRapido": ["item", "item", "item"]
 },
 "analogias": ["..."],
 "ativacao": ["...", "..."],
 "quiz": {
   "pergunta": "...",
   "alternativas": ["a", "b", "c"],
   "corretaIndex": 1,
   "explicacao": "..."
 },
 "flashcards": [
   {"q": "...", "a": "..."}
 ]
}`;

      const raw = await callLLM("Responda somente JSON válido.", prompt);
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // 3) RENDERIZAÇÃO DA SESSÃO
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTitulo.textContent = s.titulo;
      els.wizardTema.textContent = wizard.tema;
      els.wizardObjetivo.textContent = s.objetivo;

      const c = s.conteudo;
      els.wizardConteudo.innerHTML = `
        <div class="liora-section">
          <h5>Introdução</h5>
          <p>${c.introducao}</p>
        </div>
        <hr class="liora-divider">

        <div class="liora-section">
          <h5>Conceitos Principais</h5>
          <ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul>
        </div>
        <hr class="liora-divider">

        <div class="liora-section">
          <h5>Exemplos</h5>
          <ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul>
        </div>
        <hr class="liora-divider">

        <div class="liora-section">
          <h5>Aplicações</h5>
          <ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul>
        </div>
        <hr class="liora-divider">

        <div class="liora-section">
          <h5>Resumo Rápido</h5>
          <ul>${c.resumoRapido.map(x => `<li>${x}</li>`).join("")}</ul>
        </div>
      `;

      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      // Quiz
      els.wizardQuiz.innerHTML = "";
      const alternativas = shuffle(
        s.quiz.alternativas.map((a, i) => ({
          texto: a,
          correta: i === Number(s.quiz.corretaIndex),
        }))
      );

      alternativas.forEach((altObj, idx) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz" value="${idx}">
                         <span>${altObj.texto}</span>`;

        opt.addEventListener("click", () => {
          document.querySelectorAll(".liora-quiz-option")
            .forEach(o => o.classList.remove("selected"));

          opt.classList.add("selected");
          opt.querySelector("input").checked = true;

          els.wizardQuizFeedback.style.opacity = 0;

          setTimeout(() => {
            if (altObj.correta) {
              els.wizardQuizFeedback.textContent =
                `✅ Correto! ${s.quiz.explicacao}`;
              els.wizardQuizFeedback.style.color = "var(--brand)";
            } else {
              els.wizardQuizFeedback.textContent =
                "❌ Tente novamente.";
              els.wizardQuizFeedback.style.color = "var(--muted)";
            }
            els.wizardQuizFeedback.style.opacity = 1;
          }, 150);
        });

        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML =
        s.flashcards.map(f => `<li><b>${f.q}</b>: ${f.a}</li>`).join("");

      els.wizardProgressBar.style.width =
        `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO DO WIZARD
    // --------------------------------------------------------
    els.wizardVoltar.addEventListener("click", () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
      }
    });

    els.wizardProxima.addEventListener("click", () => {
      if (wizard.atual < wizard.sessoes.length - 1) {
        wizard.atual++;
        renderWizard();
      }
    });

    // --------------------------------------------------------
    // BOTÃO GERAR — UPLOAD (PDF APENAS)
    // --------------------------------------------------------
    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;

      if (!file) return alert("Selecione um PDF.");
      if (file.type !== "application/pdf")
        return alert("Liora aceita apenas PDF no momento.");

      if (file.size > 12 * 1024 * 1024)
        return alert("Arquivo muito grande (máx 12 MB).");

      atualizarStatus("upload", "📄 Lendo PDF...", 5);

      const texto = await file.text();
      const tema = file.name.replace(".pdf", "");

      const capitulos = extrairCapitulos(texto);

      if (!capitulos.length)
        return alert("Não foi possível identificar capítulos.");

      atualizarStatus("upload", "🧩 Gerando sessões...", 10);

      wizard = { tema, nivel, plano: [], sessoes: [], atual: 0 };

      for (let i = 0; i < capitulos.length; i++) {
        const cap = capitulos[i];

        atualizarStatus("upload",
          `📘 Sessão ${i + 1}/${capitulos.length}: ${cap.titulo}`,
          ((i + 1) / capitulos.length) * 100
        );

        const sessao = await gerarSessaoPorCapitulo(cap, i + 1, capitulos.length);

        wizard.plano.push({ numero: i + 1, nome: cap.titulo });
        wizard.sessoes.push(sessao);
      }

      atualizarStatus("upload", "✅ Sessões concluídas!", 100);

      renderPlanoResumo(wizard.plano);
      renderWizard();
    });

    // --------------------------------------------------------
    // ATUALIZA NOME DO ARQUIVO
    // --------------------------------------------------------
    els.inpFile.addEventListener("change", e => {
      const file = e.target.files?.[0];
      const label = document.getElementById("upload-text");
      label.textContent = file ? `Selecionado: ${file.name}` : "Clique ou arraste um arquivo (.pdf)";
    });

    console.log("🟢 Liora Core v60 carregado");
  });

})();
