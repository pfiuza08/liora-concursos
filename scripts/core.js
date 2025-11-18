// ==========================================================
// 🧠 LIORA — CORE v70-D (corrigido)
// Tema + Upload (Modelo D v3) + Hover/Click Uniforme
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v70-D...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // ELEMENTOS
    // --------------------------------------------------------
    const els = {
      // modos
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),

      // tema
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      // upload
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      // painel plano
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

      // wizard
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

      // tema claro/escuro
      themeBtn: document.getElementById("btn-theme"),
    };

    // --------------------------------------------------------
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0,
      origem: "tema"
    };

    // --------------------------------------------------------
    // TEMA (LIGHT / DARK)
    // --------------------------------------------------------
    (function themeSetup() {
      const btn = els.themeBtn;
      if (!btn) return;

      function apply(th) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(th);
        localStorage.setItem("liora-theme", th);
        btn.textContent = th === "light" ? "☀️" : "🌙";
      }

      apply(localStorage.getItem("liora-theme") || "dark");

      btn.addEventListener("click", () => {
        const newTheme = document.documentElement.classList.contains("light")
          ? "dark"
          : "light";
        apply(newTheme);
      });
    })();

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;

      const barraId = modo === "tema" ? "barra-tema-fill" : "barra-upload-fill";
      const barra = document.getElementById(barraId);
      if (barra && progresso !== null) {
        barra.style.width = `${progresso}%`;
      }
    }

    // --------------------------------------------------------
    // MODO TEMA/UPLOAD
    // --------------------------------------------------------
    function setMode(mode) {
      const t = mode === "tema";
      els.painelTema.classList.toggle("hidden", !t);
      els.painelUpload.classList.toggle("hidden", t);
      els.modoTema.classList.toggle("selected", t);
      els.modoUpload.classList.toggle("selected", !t);
    }

    setMode("tema");
    els.modoTema.onclick = () => setMode("tema");
    els.modoUpload.onclick = () => setMode("upload");

    // --------------------------------------------------------
    // LLM
    // --------------------------------------------------------
    async function callLLM(system, user) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user }),
      });
      const js = await res.json();
      if (!js.output) throw new Error("Resposta inválida da IA");
      return js.output;
    }

    window.callLLM = callLLM;

    // --------------------------------------------------------
    // RENDER PLANO (tema + upload)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";

      plano.forEach((p, i) => {
        const div = document.createElement("div");

        div.className = "liora-card-topico";
        div.style.cursor = "pointer";

        // ❗ AQUI É A CORREÇÃO DO TÍTULO DUPLICADO
        div.textContent = p.titulo || p.nome || `Sessão ${i + 1}`;

        // efeito hover (tema e upload)
        div.onmouseenter = () => div.classList.add("hovered");
        div.onmouseleave = () => div.classList.remove("hovered");

        // clique → abre wizard
        div.onclick = () => {
          wizard.atual = i;
          renderWizard();
          window.scrollTo({
            top: els.wizardContainer.offsetTop - 20,
            behavior: "smooth",
          });
        };

        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // RENDER WIZARD
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardContainer.classList.remove("hidden");

      els.wizardTema.textContent = wizard.tema || "";
      els.wizardTitulo.textContent = s.titulo || "";
      els.wizardObjetivo.textContent = s.objetivo || "";

      const c = s.conteudo || {};
      els.wizardConteudo.innerHTML = `
        ${c.introducao ? `<div class="liora-section"><h5>INTRODUÇÃO</h5><p>${c.introducao}</p></div><hr>` : ""}
        ${Array.isArray(c.conceitos) ? `<div class="liora-section"><h5>CONCEITOS</h5><ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul></div><hr>` : ""}
        ${Array.isArray(c.exemplos) ? `<div class="liora-section"><h5>EXEMPLOS</h5><ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul></div><hr>` : ""}
        ${Array.isArray(c.aplicacoes) ? `<div class="liora-section"><h5>APLICAÇÕES</h5><ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul></div><hr>` : ""}
        ${Array.isArray(c.resumoRapido) ? `<div class="liora-section"><h5>RESUMO RÁPIDO</h5><ul>${c.resumoRapido.map(x => `<li>${x}</li>`).join("")}</ul></div>` : ""}
      `;

      els.wizardAnalogias.innerHTML = (s.analogias || []).map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = (s.ativacao || []).map(a => `<li>${a}</li>`).join("");

      // QUIZ
      els.wizardQuiz.innerHTML = "";
      const q = s.quiz || {};

      if (q.pergunta) {
        const p = document.createElement("p");
        p.textContent = q.pergunta;
        els.wizardQuiz.appendChild(p);
      }

      const alternativas = Array.isArray(q.alternativas)
        ? q.alternativas
        : [];

      alternativas.forEach((alt, idx) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz"><span>${alt}</span>`;
        opt.onclick = () => {
          els.wizardQuizFeedback.textContent =
            idx === q.corretaIndex ? "Correto!" : "Tente novamente.";
          els.wizardQuizFeedback.style.color =
            idx === q.corretaIndex ? "var(--brand)" : "var(--muted)";
        };
        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = (s.flashcards || [])
        .map(f => `<li><b>${f.q}</b>: ${f.a}</li>`)
        .join("");

      els.wizardProgressBar.style.width =
        `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
    }

    // --------------------------------------------------------
    // BOTÕES DO WIZARD
    // --------------------------------------------------------
    els.wizardVoltar.onclick = () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
      }
    };

    els.wizardProxima.onclick = () => {
      if (wizard.atual < wizard.sessoes.length - 1) {
        wizard.atual++;
        renderWizard();
      } else {
        atualizarStatus(wizard.origem, "🎉 Plano concluído!", 100);
      }
    };

    // --------------------------------------------------------
    // FLUXO TEMA (inalterado, apenas compatível)
    // --------------------------------------------------------
    async function fluxoTema(tema, nivel) {
      if (!tema) {
        alert("Digite um tema.");
        return;
      }

      els.btnGerar.disabled = true;
      wizard.origem = "tema";
      atualizarStatus("tema", "Gerando plano...");

      try {
        const outline = await window.LioraTheme.gerarPlanoPorTema(tema, nivel);
        wizard.tema = tema;
        wizard.sessoes = outline.sessoes;
        wizard.plano = outline.sessoes.map(s => ({ titulo: s.titulo }));

        renderPlanoResumo(wizard.plano);
        renderWizard();
        atualizarStatus("tema", "Plano gerado!", 100);

      } catch (err) {
        console.error(err);
        atualizarStatus("tema", "Erro ao gerar.");
      }

      els.btnGerar.disabled = false;
    }

    els.btnGerar.onclick = () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      fluxoTema(tema, nivel);
    };

    // --------------------------------------------------------
    // FLUXO UPLOAD (Modelo D v3)
    // --------------------------------------------------------
    async function fluxoUpload(file, nivel) {
      if (!file) {
        alert("Selecione um PDF.");
        return;
      }

      els.btnGerarUpload.disabled = true;
      wizard.origem = "upload";

      try {
        atualizarStatus("upload", "📄 Lendo arquivo...", 5);
        const blocos = await window.LioraPDFExtractor.extrairBlocosDoPDF(file);
        console.log("📄 Blocos extraídos:", blocos.length);

        atualizarStatus("upload", "🔍 Detectando seções...", 20);
        const secoes = window.LioraPDF.construirSecoesAPartirDosBlocos(blocos);
        console.log("🧱 Seções heurísticas:", secoes);

        atualizarStatus("upload", "🧠 Gerando tópicos...", 40);
        const outlines = await window.LioraOutline.gerarOutlinesPorSecao(secoes);

        atualizarStatus("upload", "📚 Unificando...", 60);
        const outlineUnificado = window.LioraOutline.unificarOutlines(outlines);

        atualizarStatus("upload", "✏️ Montando sessões...", 80);
        const plano = await window.LioraOutline.gerarPlanoDeEstudo(outlineUnificado);

        wizard.tema = file.name.replace(/\.pdf$/i, "");
        wizard.sessoes = plano.sessoes;
        wizard.plano = plano.sessoes.map(s => ({ titulo: s.titulo }));

        renderPlanoResumo(wizard.plano);
        renderWizard();

        atualizarStatus("upload", "✅ Plano gerado!", 100);

      } catch (err) {
        console.error("Erro no fluxoUpload:", err);
        atualizarStatus("upload", "Erro ao gerar.");
      }

      els.btnGerarUpload.disabled = false;
    }

    els.btnGerarUpload.onclick = () => {
      const file = els.inpFile.files[0];
      const nivel = els.selNivel.value;
      fluxoUpload(file, nivel);
    };

    // --------------------------------------------------------
    // ATUALIZA TEXTO DO NOME DO ARQUIVO
    // --------------------------------------------------------
    els.inpFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const label = document.getElementById("upload-text");
      if (label) label.textContent = file ? file.name : "Clique ou arraste um PDF";
    });

    console.log("🟢 Liora Core v70-D carregado com sucesso");
  });
})();
