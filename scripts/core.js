// ==========================================================
// 🧠 LIORA — CORE v71-UPLOAD
// - Fluxo TEMA ainda preservado (stub)
// - Fluxo UPLOAD integrado com:
//    • pdf-extractor v??
//    • pdf-structure v71
//    • outline-generator v70
//    • semantic v70.1 (LioraSemantic)
// - Prompts neutros (dominío agnóstico)
// - Sessões enriquecidas com base no PDF
// - Nome do arquivo exibido corretamente
// - Plano base aparece antes do enriquecimento
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v71-UPLOAD...");

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

      // Exibição do nome do arquivo
      nomeArquivo:
        document.getElementById("file-name") ||
        document.getElementById("upload-file-name") ||
        document.getElementById("nome-arquivo"),

      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

      wizardContainer: document.getElementById("liora-sessoes"),
      wizardTema: document.getElementById("liora-tema-ativo"),
      wizardTitulo: document.getElementById("liora-sessao-titulo"),
      wizardObjetivo: document.getElementById("liora-sessao-objetivo"),
      wizardConteudo: document.getElementById("liora-sessao-conteudo"),
      wizardAnalogias: document.getElementById("liora-sessao-analogias"),
      wizardAtivacao: document.getElementById("liora-sessao-ativacao"),
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
    // THEME (claro/escuro)
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
    // STATUS (texto + barra)
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
    // Nome do arquivo ao selecionar
    // --------------------------------------------------------
    if (els.inpFile) {
      els.inpFile.addEventListener("change", () => {
        const file = els.inpFile.files?.[0];
        if (!file) return;
        if (els.nomeArquivo) {
          els.nomeArquivo.textContent = file.name;
        }
        atualizarStatus("upload", `📄 Arquivo selecionado: ${file.name}`, 0);
      });
    }

    // --------------------------------------------------------
    // MODOS (tema / upload)
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
    // LLM CALL (backend /api/liora)
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
    window.callLLM = callLLM;

    // --------------------------------------------------------
    // RENDER DO WIZARD (mostra sessão atual)
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

        const sec = (label, content) =>
          content
            ? `<div class="liora-section"><h5>${label}</h5>${content}</div><hr>`
            : "";

        html += sec(
          "INTRODUÇÃO",
          c.introducao ? `<p>${c.introducao}</p>` : ""
        );

        html += sec(
          "CONCEITOS",
          c.conceitos
            ? `<ul>${c.conceitos.map((x) => `<li>${x}</li>`).join("")}</ul>`
            : ""
        );

        html += sec(
          "EXEMPLOS",
          c.exemplos
            ? `<ul>${c.exemplos.map((x) => `<li>${x}</li>`).join("")}</ul>`
            : ""
        );

        html += sec(
          "APLICAÇÕES",
          c.aplicacoes
            ? `<ul>${c.aplicacoes.map((x) => `<li>${x}</li>`).join("")}</ul>`
            : ""
        );

        html += sec(
          "RESUMO RÁPIDO",
          c.resumoRapido
            ? `<ul>${c.resumoRapido.map((x) => `<li>${x}</li>`).join("")}</ul>`
            : ""
        );

        // Conteúdos extra do pipeline D (se já existirem)
        if (s.resumoTopico)
          html += `<div class="liora-section"><h5>RESUMO DO TÓPICO</h5><p>${s.resumoTopico}</p></div><hr>`;

        if (s.planoEstudoExtra)
          html += `<div class="liora-section"><h5>PLANO DE ESTUDO</h5><pre>${s.planoEstudoExtra}</pre></div><hr>`;

        if (s.questoes)
          html += `<div class="liora-section"><h5>QUESTÕES</h5><pre>${s.questoes}</pre></div><hr>`;

        if (s.mapaMental)
          html += `<div class="liora-section"><h5>MAPA MENTAL</h5><pre>${s.mapaMental}</pre></div><hr>`;

        if (s.planoAula)
          html += `<div class="liora-section"><h5>PLANO DE AULA</h5><pre>${s.planoAula}</pre></div><hr>`;

        if (s.microlearning)
          html += `<div class="liora-section"><h5>MICROLEARNING</h5><pre>${s.microlearning}</pre></div>`;

        els.wizardConteudo.innerHTML = html;
      }

      if (els.wizardAnalogias)
        els.wizardAnalogias.innerHTML = (s.analogias || [])
          .map((x) => `<p>${x}</p>`)
          .join("");

      if (els.wizardAtivacao)
        els.wizardAtivacao.innerHTML = (s.ativacao || [])
          .map((x) => `<li>${x}</li>`)
          .join("");

      if (els.wizardFlashcards)
        els.wizardFlashcards.innerHTML = (s.flashcards || [])
          .map((f) => `<li><b>${f.q}</b>: ${f.a}</li>`)
          .join("");

      if (els.wizardProgressBar && wizard.sessoes.length > 0)
        els.wizardProgressBar.style.width = `${
          ((wizard.atual + 1) / wizard.sessoes.length) * 100
        }%`;
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO DO WIZARD
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
    // FLUXO TEMA (stub, deixamos quieto por enquanto)
    // --------------------------------------------------------
    async function fluxoTema(tema, nivel) {
      alert("Fluxo por tema ainda não implementado. Estamos focando no upload.");
    }

    if (els.btnGerar)
      els.btnGerar.addEventListener("click", () => {
        const tema = (els.inpTema?.value || "").trim();
        const nivel = els.selNivel?.value;
        if (!tema) return alert("Digite um tema.");
        fluxoTema(tema, nivel);
      });

    // --------------------------------------------------------
    // OTIMIZAÇÃO DAS SEÇÕES (hj, seções v71 já vêm reduzidas)
    // --------------------------------------------------------
    function otimizarSecoesParaOutline(secoes) {
      if (!Array.isArray(secoes) || secoes.length === 0) return secoes;
      const MAX = 35;
      if (secoes.length <= MAX) return secoes;
      const step = secoes.length / MAX;
      const out = [];
      for (let i = 0; i < MAX; i++) {
        out.push(secoes[Math.floor(i * step)]);
      }
      return out;
    }

    // --------------------------------------------------------
    // PIPELINE D — usando LioraSemantic quando disponível
    // --------------------------------------------------------
    async function enriquecerSessao(sessao, indice, total, temaGeral) {
      const conteudoBase =
        (sessao.conteudo && sessao.conteudo.introducao) ||
        sessao.conteudo ||
        sessao.texto ||
        "";

      const titulo = sessao.titulo || `Sessão ${indice}`;

      // Se LioraSemantic existir, usamos ela; senão, fallback para callLLM direto
      const Semantic = window.LioraSemantic || null;

      // RESUMO DO TÓPICO
      try {
        if (Semantic && Semantic.gerarResumoTopico) {
          sessao.resumoTopico = await Semantic.gerarResumoTopico(
            titulo,
            conteudoBase
          );
        } else {
          sessao.resumoTopico = await callLLM(
            "Você é um agente pedagógico neutro. Não assuma domínio prévio.",
            `Resuma de forma clara e fiel o texto abaixo:\n\n${conteudoBase}`
          );
        }
      } catch (e) {
        console.error("Erro gerando resumoTopico:", e);
      }

      // PLANO DE ESTUDO
      try {
        if (Semantic && Semantic.gerarPlanoDeEstudo) {
          sessao.planoEstudoExtra = await Semantic.gerarPlanoDeEstudo(
            titulo,
            conteudoBase
          );
        } else {
          sessao.planoEstudoExtra = await callLLM(
            "Você organiza conteúdo em passos curtos.",
            `Crie um plano de estudo curto para o texto abaixo:\n\n${conteudoBase}`
          );
        }
      } catch (e) {
        console.error("Erro gerando planoEstudoExtra:", e);
      }

      // QUESTÕES
      try {
        if (Semantic && Semantic.gerarQuestoes) {
          sessao.questoes = await Semantic.gerarQuestoes(
            titulo,
            conteudoBase
          );
        } else {
          sessao.questoes = await callLLM(
            "Você cria questões somente com base no texto dado.",
            `Crie questões sobre o texto abaixo:\n\n${conteudoBase}`
          );
        }
      } catch (e) {
        console.error("Erro gerando questoes:", e);
      }

      // MAPA MENTAL
      try {
        if (Semantic && Semantic.gerarMapaMental) {
          sessao.mapaMental = await Semantic.gerarMapaMental(
            titulo,
            conteudoBase
          );
        } else {
          sessao.mapaMental = await callLLM(
            "Você organiza conteúdo em mapa mental textual.",
            `Crie um mapa mental textual para o texto abaixo:\n\n${conteudoBase}`
          );
        }
      } catch (e) {
        console.error("Erro gerando mapaMental:", e);
      }

      // PLANO DE AULA
      try {
        if (Semantic && Semantic.gerarPlanoDeAula) {
          sessao.planoAula = await Semantic.gerarPlanoDeAula(
            titulo,
            conteudoBase
          );
        } else {
          sessao.planoAula = await callLLM(
            "Você cria planos de aula neutros.",
            `Transforme o conteúdo abaixo em um plano de aula:\n\n${conteudoBase}`
          );
        }
      } catch (e) {
        console.error("Erro gerando planoAula:", e);
      }

      // MICROLEARNING
      try {
        if (Semantic && Semantic.gerarMicrolearning) {
          sessao.microlearning = await Semantic.gerarMicrolearning(
            titulo,
            conteudoBase
          );
        } else {
          sessao.microlearning = await callLLM(
            "Você cria microlearning baseado apenas no texto.",
            `Crie um microlearning com mini explicação, exemplo e desafio para o texto abaixo:\n\n${conteudoBase}`
          );
        }
      } catch (e) {
        console.error("Erro gerando microlearning:", e);
      }
    }

    // --------------------------------------------------------
    // FLUXO UPLOAD COMPLETO + PIPELINE D
    // --------------------------------------------------------
    async function fluxoUpload(file, nivel) {
      if (!els.btnGerarUpload) return;

      els.btnGerarUpload.disabled = true;
      wizard.origem = "upload";

      try {
        if (
          !window.LioraPDFExtractor ||
          !window.LioraPDF ||
          !window.LioraOutline
        ) {
          throw new Error("Módulos PDF necessários não encontrados.");
        }

        atualizarStatus("upload", "📄 Lendo PDF...", 5);

        // 1 — EXTRAÇÃO DE BLOCOS
        const blocos = await LioraPDFExtractor.extrairBlocos(file);
        console.log("📄 Blocos extraídos:", blocos?.length || 0);
        if (!blocos || blocos.length === 0)
          throw new Error("Nenhum bloco extraído do PDF.");

        atualizarStatus("upload", "🔎 Construindo seções reais...", 15);

        // 2 — SEÇÕES (v71 já retorna 5–15 tópicos reais)
        let secoes = LioraPDF.construirSecoesAPartirDosBlocos(blocos);
        console.log("📚 Seções reais (v71):", secoes?.length || 0);

        // 3 — OTIMIZAÇÃO (aqui provavelmente não faz nada, mas mantemos)
        const secoesOtim = otimizarSecoesParaOutline(secoes);
        atualizarStatus("upload", "🧠 Gerando outline...", 30);

        // 4 — OUTLINE POR SEÇÃO
        const outlines = await LioraOutline.gerarOutlinesPorSecao(secoesOtim);

        atualizarStatus("upload", "🔗 Unificando tópicos...", 45);

        // 5 — OUTLINE UNIFICADO
        const outlineUnico = await LioraOutline.unificarOutlines(outlines);

        atualizarStatus("upload", "📚 Criando plano de estudo base...", 60);

        // 6 — PLANO DE ESTUDO BASE
        const plano = await LioraOutline.gerarPlanoDeEstudo(outlineUnico);
        if (!plano || !Array.isArray(plano.sessoes))
          throw new Error("Plano de estudo inválido (sem sessões).");

        // Normalizar sessões (garantir conteudo.introducao)
        const sessoesNorm = plano.sessoes.map((s, i) => ({
          titulo: s.titulo || s.nome || `Sessão ${i + 1}`,
          objetivo:
            s.objetivo ||
            `Compreender o tópico: ${s.titulo || s.nome || `Sessão ${i + 1}`}`,
          conteudo: s.conteudo || { introducao: s.texto || "" },
        }));

        wizard.tema = file.name.replace(/\.pdf$/i, "") || "PDF enviado";
        wizard.nivel = nivel;
        wizard.sessoes = sessoesNorm;
        wizard.plano = sessoesNorm.map((s, i) => ({
          numero: i + 1,
          nome: s.titulo,
        }));
        wizard.atual = 0;

        // 👉 Já mostra o plano e o wizard ANTES do enriquecimento
        atualizarStatus(
          "upload",
          "✨ Plano base pronto! Gerando materiais adicionais...",
          70
        );
        renderPlanoResumo(wizard.plano);
        renderWizard();

        // 7 — PIPELINE D (enriquecimento por sessão)
        const total = wizard.sessoes.length;
        for (let i = 0; i < total; i++) {
          atualizarStatus(
            "upload",
            `🧠 Gerando materiais da sessão ${i + 1} de ${total}...`,
            70 + Math.round(((i + 1) / total) * 30)
          );
          await enriquecerSessao(
            wizard.sessoes[i],
            i + 1,
            total,
            wizard.tema
          );
        }

        atualizarStatus("upload", "🌟 Sessões e materiais prontos!", 100);
        // Re-render para mostrar conteúdo enriquecido da sessão atual
        renderWizard();
      } catch (err) {
        console.error("Erro no fluxoUpload:", err);
        atualizarStatus("upload", "❌ Erro ao processar PDF.");
        alert("Ocorreu um erro no processamento do PDF. Veja o console (F12).");
      }

      els.btnGerarUpload.disabled = false;
    }

    if (els.btnGerarUpload)
      els.btnGerarUpload.addEventListener("click", () => {
        const file = els.inpFile.files?.[0];
        const nivel = els.selNivel?.value;
        if (!file) return alert("Selecione um PDF.");
        fluxoUpload(file, nivel);
      });

    // --------------------------------------------------------
    // CARDS DE SESSÃO (lista de tópicos / sessões à esquerda)
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

    console.log("🟢 Liora Core v71-UPLOAD carregado com sucesso");
  });
})();
