// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v53)
// Upload com extração REAL de PDF + topic mining
// Geração robusta de plano + sessões com JSON corrigido
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v53...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // MAPA DE ELEMENTOS
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

      themeBtn: document.getElementById("btn-theme")
    };

    // --------------------------------------------------------
    // 🌗 TEMA (LIGHT / DARK)
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
        const next = document.documentElement.classList.contains("light") ? "dark" : "light";
        apply(next);
      });
    })();

    // --------------------------------------------------------
    // STATUS + PROGRESSO
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;

      const barra = document.getElementById(modo === "tema" ? "barra-tema-fill" : "barra-upload-fill");
      if (barra && progresso !== null) barra.style.width = `${progresso}%`;
    }

    // --------------------------------------------------------
    // JSON FIXER — remove texto fora do JSON e corrige vírgulas
    // --------------------------------------------------------
    function fixJSON(raw) {
      try {
        // tenta direto
        return JSON.parse(raw);
      } catch { }

      try {
        // remove qualquer coisa fora das { } ou [ ]
        const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (match) return JSON.parse(match[0]);
      } catch { }

      console.warn("⚠️ JSON impossível de corrigir:", raw);
      return null;
    }

    // --------------------------------------------------------
    // EXTRAÇÃO REAL DE PDF (PDF.js)
    // --------------------------------------------------------
    async function extractPDFText(file) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let texto = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const strings = content.items.map(item => item.str).join(" ");

        texto += strings + "\n\n";

        // limite para evitar prompts gigantes
        if (texto.length > 50000) break;
      }

      console.log("📄 Texto extraído:", texto.substring(0, 400));
      return texto.trim();
    }

    // --------------------------------------------------------
    // CHAMADA À API
    // --------------------------------------------------------
    async function callLLM(system, user) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user })
      });

      const json = await res.json().catch(() => ({}));

      if (!json.output) throw new Error("Resposta inválida da IA");

      return json.output;
    }

    // --------------------------------------------------------
    // TOPIC MINING
    // --------------------------------------------------------
    async function extrairTopicos(texto) {
      const prompt = `
Você lerá o conteúdo abaixo (trechos extraídos de um PDF).

Extraia APENAS os tópicos principais (Máximo: 8).  
Regra:  
- Use apenas títulos realmente didáticos  
- Ignore autor, sumário, dedicatória, cabeçalho  
- Não repita capítulos  
- Não coloque páginas  
- Não escreva nada além do JSON

Retorne JSON EXCLUSIVO NO FORMATO:
[
  {"numero":1,"nome":"Título do tópico 1"},
  {"numero":2,"nome":"Título do tópico 2"}
]

Conteúdo:
${texto}
`;

      const raw = await callLLM("Você extrai tópicos didáticos.", prompt);
      const json = fixJSON(raw);

      if (json && Array.isArray(json) && json.length > 0) {
        return json;
      }

      console.warn("⚠️ Falha ao extrair tópicos. Tentando fallback...");

      return [
        { numero: 1, nome: "Introdução ao tema" },
        { numero: 2, nome: "Conceitos essenciais" },
        { numero: 3, nome: "Aplicações práticas" }
      ];
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO (estilo aula completa)
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, anterior = null) {
      const prompt = `
Crie uma sessão didática COMPLETA como uma aula para o tópico "${nome}".
Tema geral: ${tema} — nível ${nivel}.
${anterior ? `Reforce continuidade: a sessão anterior tratou de "${anterior}".` : ""}

Retorne JSON:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"objetivo claro e detalhado",
 "conteudo":{
    "introducao":"introdução detalhada e explicativa",
    "conceitos":["item 1","item 2","item 3","item 4"],
    "exemplos":["exemplo 1 completo","exemplo 2 completo"],
    "aplicacoes":["aplicação 1 detalhada","aplicação 2"],
    "resumo":"resumo final de 6 a 8 linhas"
 },
 "analogias":["comparação concreta 1","comparação 2"],
 "ativacao":["pergunta 1","pergunta 2"],
 "quiz":{"pergunta":"?","alternativas":["a","b","c"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}
`;

      const raw = await callLLM("Você cria aulas estruturadas e coerentes.", prompt);
      return fixJSON(raw);
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";

      plano.forEach((p, i) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.textContent = `Sessão ${i + 1} — ${p.nome}`;
        div.addEventListener("click", () => {
          wizard.atual = i;
          renderWizard();
          window.scrollTo({ top: els.wizardContainer.offsetTop - 20, behavior: "smooth" });
        });
        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO WIZARD
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;
      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;

      const c = s.conteudo;

      els.wizardConteudo.innerHTML = `
        <div class="liora-section"><h5>INTRODUÇÃO</h5><p>${c.introducao}</p></div>
        <hr class="liora-divider">

        <div class="liora-section"><h5>CONCEITOS PRINCIPAIS</h5><ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul></div>
        <hr class="liora-divider">

        <div class="liora-section"><h5>EXEMPLOS</h5><ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul></div>
        <hr class="liora-divider">

        <div class="liora-section"><h5>APLICAÇÕES</h5><ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul></div>
        <hr class="liora-divider">

        <div class="liora-section"><h5>RESUMO RÁPIDO</h5><p>${c.resumo}</p></div>
      `;

      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      // QUIZ
      els.wizardQuiz.innerHTML = "";
      const pergunta = document.createElement("p");
      pergunta.textContent = s.quiz.pergunta;
      els.wizardQuiz.appendChild(pergunta);

      let alternativas = s.quiz.alternativas.map((t, i) => ({
        texto: t,
        correta: i === Number(s.quiz.corretaIndex)
      }));

      // embaralhar
      alternativas = alternativas.sort(() => Math.random() - 0.5);

      let tentativas = 0;

      alternativas.forEach((alt) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `
          <input type="radio" name="quiz">
          <span>${alt.texto}</span>
        `;

        opt.addEventListener("click", () => {
          document.querySelectorAll(".liora-quiz-option").forEach(o => o.classList.remove("selected"));
          opt.classList.add("selected");
          opt.querySelector("input").checked = true;

          els.wizardQuizFeedback.style.opacity = 0;

          setTimeout(() => {
            if (alt.correta) {
              els.wizardQuizFeedback.textContent = `✅ Correto! ${s.quiz.explicacao}`;
              els.wizardQuizFeedback.style.color = "var(--brand)";
            } else {
              tentativas++;
              els.wizardQuizFeedback.textContent = tentativas >= 2
                ? `💡 Dica: ${s.quiz.explicacao}`
                : "❌ Tente novamente.";
              els.wizardQuizFeedback.style.color = tentativas >= 2 ? "var(--brand)" : "var(--muted)";
            }

            els.wizardQuizFeedback.style.opacity = 1;
          }, 100);
        });

        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = s.flashcards.map(f => `<li><b>${f.q}</b>: ${f.a}</li>`).join("");
      els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
    }

    // --------------------------------------------------------
    // GERAÇÃO DO FLUXO COMPLETO (tema ou upload)
    // --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo, textoUpload = null) {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;

      btn.disabled = true;
      atualizarStatus(modo, "🧠 Extraindo tópicos...", 0);

      let topicos;

      try {
        if (modo === "upload") {
          const texto = await extractPDFText(textoUpload);
          topicos = await extrairTopicos(texto);
        } else {
          const promptTema = `
Identifique os tópicos principais para um plano de estudo do tema: "${tema}".
Retorne JSON no formato:
[
 {"numero":1,"nome":"tópico 1"},
 {"numero":2,"nome":"tópico 2"}
]`;

          const raw = await callLLM("Você cria planos de estudo.", promptTema);
          topicos = fixJSON(raw);
        }
      } catch (err) {
        console.error("❌ Erro ao extrair tópicos:", err);
        alert("Erro ao gerar os tópicos.");
        btn.disabled = false;
        return;
      }

      if (!topicos || topicos.length === 0) {
        alert("Nenhum tópico encontrado.");
        btn.disabled = false;
        return;
      }

      wizard = { tema, nivel, plano: topicos, sessoes: [], atual: 0 };
      renderPlanoResumo(topicos);

      for (let i = 0; i < topicos.length; i++) {
        atualizarStatus(modo, `📘 Sessão ${i + 1}/${topicos.length}: ${topicos[i].nome}`, ((i + 1) / topicos.length) * 100);

        const sessao = await gerarSessao(
          tema,
          nivel,
          i + 1,
          topicos[i].nome,
          i > 0 ? topicos[i - 1].nome : null
        );

        wizard.sessoes.push(sessao);
      }

      atualizarStatus(modo, "🎉 Todas as sessões foram geradas!", 100);
      renderWizard();
      btn.disabled = false;
    }

    // --------------------------------------------------------
    // BOTÕES
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");
      gerarFluxo(tema, nivel, "tema");
    });

    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;

      if (!file) return alert("Selecione um arquivo PDF.");

      // limite 20MB
      if (file.size > 20 * 1024 * 1024) {
        return alert("Arquivo muito grande. Máximo permitido: 20MB.");
      }

      gerarFluxo(file.name.replace(".pdf", ""), nivel, "upload", file);
    });

    // Atualiza nome do arquivo
    els.inpFile.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const uploadText = document.getElementById("upload-text");
      uploadText.textContent = file ? `Selecionado: ${file.name}` : "Clique ou arraste um PDF";
    });

    console.log("🟢 core.js v53 carregado com sucesso");
  });
})();
