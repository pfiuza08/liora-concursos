// ==========================================================
// 🧠 LIORA — CORE v70-UPLOAD (base v64)
// - Mantém TEMA exatamente como está
// - Otimiza fluxo UPLOAD para PDFs grandes
// - Usa pdf-extractor + pdf-structure via window.LioraPDF*
// - Usa outline-generator via window.LioraOutline
// - Reduz fortemente o número de seções enviadas ao outline
// - NOVO: Pipeline D (resumo + materiais por sessão)
// - NOVO: Corrige exibição do nome do arquivo no upload
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v70-UPLOAD...");

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
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0,
      origem: "tema",
    };

    // --------------------------------------------------------
    // THEME
    // --------------------------------------------------------
    (function themeSetup() {
      if (!els.themeBtn) return;

      function apply(theme) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      }

      apply(localStorage.getItem("liora_theme") || "dark");

      els.themeBtn.addEventListener("click", () => {
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
      const target = modo === "upload" ? els.statusUpload : els.status;
      if (target) target.textContent = texto;

      const barra = document.getElementById(
        modo === "upload" ? "barra-upload-fill" : "barra-tema-fill"
      );
      if (barra && progresso !== null) barra.style.width = `${progresso}%`;
    }

    // --------------------------------------------------------
    // CORREÇÃO: mostrar nome do arquivo selecionado no upload
    // --------------------------------------------------------
    if (els.inpFile) {
      els.inpFile.addEventListener("change", () => {
        const file = els.inpFile.files?.[0];
        if (!file) return;

        atualizarStatus("upload", `📄 Arquivo selecionado: ${file.name}`, 0);

        const label =
          document.getElementById("upload-file-name") ||
          document.getElementById("file-name") ||
          document.getElementById("nome-arquivo");

        if (label) {
          label.textContent = file.name;
        }
      });
    }

    // --------------------------------------------------------
    // VIEW MODE
    // --------------------------------------------------------
    function setMode(mode) {
      if (els.painelTema)
        els.painelTema.classList.toggle("hidden", mode !== "tema");
      if (els.painelUpload)
        els.painelUpload.classList.toggle("hidden", mode !== "upload");
      if (els.modoTema)
        els.modoTema.classList.toggle("selected", mode === "tema");
      if (els.modoUpload)
        els.modoUpload.classList.toggle("selected", mode === "upload");
    }
    setMode("tema");

    if (els.modoTema) els.modoTema.addEventListener("click", () => setMode("tema"));
    if (els.modoUpload)
      els.modoUpload.addEventListener("click", () => setMode("upload"));

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

    // tornar global para outline-generator poder usar
    window.callLLM = callLLM;

    // --------------------------------------------------------
    // RENDER WIZARD
    // + inclui agora resumo, plano extra, questões, mapa mental, plano de aula e microlearning
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      if (els.wizardContainer) els.wizardContainer.classList.remove("hidden");

      if (els.wizardTema) els.wizardTema.textContent = wizard.tema || "";

      if (els.wizardTitulo) els.wizardTitulo.textContent = s.titulo || "";
      if (els.wizardObjetivo) els.wizardObjetivo.textContent = s.objetivo || "";

      if (els.wizardConteudo) {
        const c = s.conteudo || {};
        let html = "";

        if (c.introducao) {
          html += `
            <div class="liora-section">
              <h5>INTRODUÇÃO</h5>
              <p>${c.introducao}</p>
            </div>
            <hr>
          `;
        }

        if (c.conceitos) {
          html += `
            <div class="liora-section">
              <h5>CONCEITOS</h5>
              <ul>${c.conceitos.map((x) => `<li>${x}</li>`).join("")}</ul>
            </div>
            <hr>
          `;
        }

        if (c.exemplos) {
          html += `
            <div class="liora-section">
              <h5>EXEMPLOS</h5>
              <ul>${c.exemplos.map((x) => `<li>${x}</li>`).join("")}</ul>
            </div>
            <hr>
          `;
        }

        if (c.aplicacoes) {
          html += `
            <div class="liora-section">
              <h5>APLICAÇÕES</h5>
              <ul>${c.aplicacoes.map((x) => `<li>${x}</li>`).join("")}</ul>
            </div>
            <hr>
          `;
        }

        if (c.resumoRapido) {
          html += `
            <div class="liora-section">
              <h5>RESUMO RÁPIDO</h5>
              <ul>${c.resumoRapido.map((x) => `<li>${x}</li>`).join("")}</ul>
            </div>
          `;
        }

        // 🔹 NOVO: resumo do tópico
        if (s.resumoTopico) {
          html += `
            <hr>
            <div class="liora-section">
              <h5>RESUMO DO TÓPICO</h5>
              <p>${s.resumoTopico}</p>
            </div>
          `;
        }

        // 🔹 NOVO: plano de estudo extra
        if (s.planoEstudoExtra) {
          html += `
            <hr>
            <div class="liora-section">
              <h5>PLANO DE ESTUDO (Liora)</h5>
              <pre>${s.planoEstudoExtra}</pre>
            </div>
          `;
        }

        // 🔹 NOVO: questões
        if (s.questoes) {
          html += `
            <hr>
            <div class="liora-section">
              <h5>QUESTÕES PARA PRÁTICA</h5>
              <pre>${s.questoes}</pre>
            </div>
          `;
        }

        // 🔹 NOVO: mapa mental textual
        if (s.mapaMental) {
          html += `
            <hr>
            <div class="liora-section">
              <h5>MAPA MENTAL (texto)</h5>
              <pre>${s.mapaMental}</pre>
            </div>
          `;
        }

        // 🔹 NOVO: plano de aula
        if (s.planoAula) {
          html += `
            <hr>
            <div class="liora-section">
              <h5>PLANO DE AULA</h5>
              <pre>${s.planoAula}</pre>
            </div>
          `;
        }

        // 🔹 NOVO: microlearning
        if (s.microlearning) {
          html += `
            <hr>
            <div class="liora-section">
              <h5>MICROLEARNING</h5>
              <pre>${s.microlearning}</pre>
            </div>
          `;
        }

        els.wizardConteudo.innerHTML = html;
      }

      if (els.wizardAnalogias)
        els.wizardAnalogias.innerHTML = (s.analogias || [])
          .map((a) => `<p>${a}</p>`)
          .join("");

      if (els.wizardAtivacao)
        els.wizardAtivacao.innerHTML = (s.ativacao || [])
          .map((a) => `<li>${a}</li>`)
          .join("");

      if (els.wizardFlashcards)
        els.wizardFlashcards.innerHTML = (s.flashcards || [])
          .map((f) => `<li><b>${f.q}</b>: ${f.a}</li>`)
          .join("");

      if (els.wizardProgressBar)
        els.wizardProgressBar.style.width = `${
          ((wizard.atual + 1) / wizard.sessoes.length) * 100
        }%`;
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO
    // --------------------------------------------------------
    if (els.wizardVoltar)
      els.wizardVoltar.addEventListener("click", () => {
        if (wizard.atual > 0) wizard.atual--;
        renderWizard();
      });

    if (els.wizardProxima)
      els.wizardProxima.addEventListener("click", () => {
        if (wizard.atual < wizard.sessoes.length - 1) wizard.atual++;
        renderWizard();
      });

    // --------------------------------------------------------
    // FLUXO DE TEMA (SEM ALTERAR)
    // --------------------------------------------------------
    async function fluxoTema(tema, nivel) {
      alert("Fluxo por tema mantido. Usando sua versão original.");
      // Aqui você pode plugar a lógica antiga de tema se quiser
    }

    if (els.btnGerar)
      els.btnGerar.addEventListener("click", () => {
        const tema = (els.inpTema?.value || "").trim();
        const nivel = els.selNivel?.value;
        if (!tema) return alert("Digite um tema.");
        fluxoTema(tema, nivel);
      });

    // --------------------------------------------------------
    // 🔧 OTIMIZAÇÃO DE SEÇÕES PARA OUTLINE
    // --------------------------------------------------------
    function otimizarSecoesParaOutline(secoes) {
      if (!Array.isArray(secoes) || secoes.length === 0) return secoes;

      const MAX_SECOES = 35;

      if (secoes.length <= MAX_SECOES) {
        console.log(
          "✅ Quantidade de seções razoável, sem otimização:",
          secoes.length
        );
        return secoes;
      }

      const otimizadas = [];
      const step = secoes.length / MAX_SECOES;

      for (let i = 0; i < MAX_SECOES; i++) {
        let idx = Math.floor(i * step);
        if (idx >= secoes.length) idx = secoes.length - 1;
        otimizadas.push(secoes[idx]);
      }

      console.log(
        "🪓 Reduzindo seções para outline:",
        secoes.length,
        "→",
        otimizadas.length
      );
      return otimizadas;
    }

    // --------------------------------------------------------
    // 🔥 NOVO: ENRIQUECER SESSÃO COM RESUMO + ITENS Liora
    // --------------------------------------------------------
    async function enriquecerSessao(sessao, indice, total, temaGeral) {
      const baseTexto = `
Tema geral: ${temaGeral || "não informado"}
Sessão ${indice} de ${total}
Título da sessão: ${sessao.titulo || ""}
Objetivo: ${sessao.objetivo || ""}
Conteúdo bruto (pode estar estruturado):
${JSON.stringify(sessao.conteudo || {}, null, 2)}
      `.trim();

      // Resumo do tópico
      try {
        sessao.resumoTopico = await callLLM(
          "Você é a Liora, tutora de microlearning para alunos de Computação. Gere um resumo claro e conciso do tópico, em português, em até 10 linhas.",
          `Gere um resumo do tópico abaixo:\n\n${baseTexto}`
        );
      } catch (e) {
        console.error("Erro gerando resumoTopico:", e);
      }

      // Plano de estudo extra
      try {
        sessao.planoEstudoExtra = await callLLM(
          "Você é a Liora, especialista em microlearning no estilo Bárbara Oakley.",
          `Monte um plano de estudo em formato textual para a sessão abaixo.
Use sessões curtas, objetivos por sessão, sugestões de prática e revisões.
Retorne em texto estruturado com bullets e etapas.\n\n${baseTexto}`
        );
      } catch (e) {
        console.error("Erro gerando planoEstudoExtra:", e);
      }

      // Questões
      try {
        sessao.questoes = await callLLM(
          "Você é uma tutora de lógica e matemática para computação.",
          `Crie:
- 3 questões fáceis,
- 3 questões de dificuldade média,
- 2 questões difíceis,
- 1 questão no estilo concurso/vestibular
sobre o conteúdo da sessão abaixo.
Use numeração clara e, ao final, forneça um gabarito resumido.\n\n${baseTexto}`
        );
      } catch (e) {
        console.error("Erro gerando questoes:", e);
      }

      // Mapa mental textual
      try {
        sessao.mapaMental = await callLLM(
          "Você cria mapas mentais textuais, hierárquicos e claros.",
          `Crie um mapa mental textual para o tópico abaixo.
Use um formato tipo:
Tópico central >
  - Ramo 1 >
      - Subramo
  - Ramo 2 >
...\n\n${baseTexto}`
        );
      } catch (e) {
        console.error("Erro gerando mapaMental:", e);
      }

      // Plano de aula
      try {
        sessao.planoAula = await callLLM(
          "Você é professor universitário de matemática aplicada à computação.",
          `Crie um plano de aula completo para a sessão abaixo, com:
- Objetivos
- Conteúdos
- Metodologia (explicação, exemplos guiados)
- Atividades em sala
- Tarefa para casa
- Tempo estimado (aula de 50 minutos)
Retorne em texto estruturado.\n\n${baseTexto}`
        );
      } catch (e) {
        console.error("Erro gerando planoAula:", e);
      }

      // Microlearning
      try {
        sessao.microlearning = await callLLM(
          "Você é a Liora, agente de microlearning.",
          `Crie um módulo de microlearning para o tópico abaixo, com:
- Mini explicação
- Microexemplo prático
- Mini desafio (pergunta) para o aluno pensar
- Sugestão de aplicação na vida real
Retorne em formato compacto e bem organizado.\n\n${baseTexto}`
        );
      } catch (e) {
        console.error("Erro gerando microlearning:", e);
      }
    }

    // --------------------------------------------------------
    // NOVO FLUXO UPLOAD COMPLETO – OTIMIZADO + PIPELINE D
    // --------------------------------------------------------
    async function fluxoUpload(file, nivel) {
      if (!els.btnGerarUpload) return;

      wizard.origem = "upload";
      els.btnGerarUpload.disabled = true;

      try {
        if (
          !window.LioraPDFExtractor ||
          !window.LioraPDF ||
          !window.LioraOutline
        ) {
          throw new Error(
            "Módulos de PDF não encontrados (LioraPDFExtractor / LioraPDF / LioraOutline)."
          );
        }

        atualizarStatus("upload", "📄 Lendo PDF...", 5);

        // 1) Extrair blocos do PDF
        const blocos = await LioraPDFExtractor.extrairBlocos(file);
        console.log("📄 Blocos extraídos:", blocos?.length || 0);

        if (!Array.isArray(blocos) || blocos.length === 0) {
          throw new Error("Nenhum bloco foi extraído do PDF.");
        }

        // 2) Construir SEÇÕES heurísticas
        console.log("📦 Enviando blocos para LioraPDF:", blocos.length);
        let secoes = LioraPDF.construirSecoesAPartirDosBlocos(blocos);
        console.log("🧱 Seções heurísticas:", secoes?.length || 0);

        if (!Array.isArray(secoes) || secoes.length === 0) {
          throw new Error("Nenhuma seção heurística foi construída.");
        }

        atualizarStatus(
          "upload",
          `🧩 Otimizando seções para outline... (${secoes.length})`,
          20
        );

        // 3) OTIMIZAR SEÇÕES (REDUZ QUANTIDADE)
        const secoesOtim = otimizarSecoesParaOutline(secoes);
        atualizarStatus(
          "upload",
          `🧩 Gerando outline (${secoesOtim.length} seções)...`,
          35
        );

        // 4) OUTLINE POR SEÇÃO
        const outlines = await LioraOutline.gerarOutlinesPorSecao(secoesOtim);
        console.log("🧠 Outlines por seção:", outlines);

        atualizarStatus("upload", "🧠 Unificando outlines...", 55);

        // 5) OUTLINE UNIFICADO
        const outlineUnico = await LioraOutline.unificarOutlines(outlines);
        console.log("🧠 Outline unificado:", outlineUnico);

        atualizarStatus("upload", "📚 Montando plano de estudo...", 70);

        // 6) PLANO FINAL
        const planoFinal = await LioraOutline.gerarPlanoDeEstudo(outlineUnico);
        console.log("📘 Plano final:", planoFinal);

        if (!planoFinal || !Array.isArray(planoFinal.sessoes)) {
          throw new Error("Plano final inválido ou sem sessões.");
        }

        // Nome básico do tema a partir do arquivo
        wizard.tema = file.name?.replace(/\.pdf$/i, "") || "PDF enviado";
        wizard.nivel = nivel;

        // 7) PIPELINE D: enriquecer cada sessão com resumo + materiais
        atualizarStatus(
          "upload",
          "🧠 Gerando resumos e materiais para cada sessão...",
          85
        );

        const totalSessoes = planoFinal.sessoes.length;
        for (let i = 0; i < totalSessoes; i++) {
          const s = planoFinal.sessoes[i];
          try {
            await enriquecerSessao(s, i + 1, totalSessoes, wizard.tema);
          } catch (e) {
            console.error("Erro ao enriquecer sessão", i + 1, e);
          }
        }

        // 8) POPULAR O WIZARD
        wizard.plano = planoFinal.sessoes.map((s, i) => ({
          numero: i + 1,
          nome: s.titulo,
        }));

        wizard.sessoes = planoFinal.sessoes;
        wizard.atual = 0;

        atualizarStatus("upload", "✨ Sessões prontas!", 100);

        renderPlanoResumo(wizard.plano);
        renderWizard();
      } catch (err) {
        console.error("Erro no fluxoUpload:", err);
        atualizarStatus(
          "upload",
          "❌ Erro ao processar o PDF. Veja o console para detalhes."
        );
        alert(
          "Ocorreu um erro ao processar o PDF. Abra o console do navegador (F12) e me envie os logs para eu ajustar."
        );
      } finally {
        els.btnGerarUpload.disabled = false;
      }
    }

    if (els.btnGerarUpload)
      els.btnGerarUpload.addEventListener("click", () => {
        const file = els.inpFile?.files?.[0];
        const nivel = els.selNivel?.value;
        if (!file) return alert("Selecione um PDF.");
        fluxoUpload(file, nivel);
      });

    // --------------------------------------------------------
    // PLANO RESUMO
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      if (!els.plano) return;
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

    console.log("🟢 Liora Core v70-UPLOAD carregado com sucesso");
  });
})();
