// ==========================================================
// 🧠 LIORA — CORE v70-COMMERCIAL
// Compatível com o index atual:
// - Tema: plano + sessões completas (cache localStorage)
// - Upload: Modelo D (outline + sessões a partir do PDF)
// - Wizard em <section id="liora-sessoes">
// - NÃO mexe em Simulados / Dashboard (nav-home cuida disso)
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v70-COMMERCIAL...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // ELEMENTOS
    // --------------------------------------------------------
    const els = {
      // tema
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      statusTema: document.getElementById("status"),
      barraTemaFill: document.getElementById("barra-tema-fill"),

      // upload
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),
      barraUploadFill: document.getElementById("barra-upload-fill"),
      uploadText: document.getElementById("upload-text"),
      uploadSpinner: document.getElementById("upload-spinner"),

      // área de plano
      areaPlano: document.getElementById("area-plano"),
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

      // wizard (sessões)
      wizard: document.getElementById("liora-sessoes"),
      wTema: document.getElementById("liora-tema-ativo"),
      wTitulo: document.getElementById("liora-sessao-titulo"),
      wObjetivo: document.getElementById("liora-sessao-objetivo"),
      wConteudo: document.getElementById("liora-sessao-conteudo"),
      wAnalogias: document.getElementById("liora-sessao-analogias"),
      wAtivacao: document.getElementById("liora-sessao-ativacao"),
      wQuiz: document.getElementById("liora-sessao-quiz"),
      wQuizFeedback: document.getElementById("liora-sessao-quiz-feedback"),
      wFlashcards: document.getElementById("liora-sessao-flashcards"),
      wMapa: document.getElementById("liora-sessao-mapa"),
      wVoltar: document.getElementById("liora-btn-voltar"),
      wProxima: document.getElementById("liora-btn-proxima"),
      wBar: document.getElementById("liora-progress-bar"),

      // tema claro/escuro
      themeBtn: document.getElementById("btn-theme"),
    };

    // placeholder inicial na área de plano
    if (els.plano) {
      els.plano.innerHTML =
        '<p class="text-sm text-[var(--muted)]">Gere um plano de estudo (por tema ou upload) para ver as sessões aqui.</p>';
    }

    // garantir wizard escondido ao iniciar
    if (els.wizard) {
      els.wizard.classList.add("hidden");
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL DO WIZARD
    // --------------------------------------------------------
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0,
      origem: "tema", // "tema" ou "upload"
    };

    const key = (tema, nivel) =>
      `liora:wizard:${tema.toLowerCase()}::${(nivel || "").toLowerCase()}`;

    function saveProgress() {
      if (!wizard.tema || !wizard.nivel) return;
      try {
        localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
      } catch (e) {
        console.warn("⚠️ Não foi possível salvar no localStorage", e);
      }
    }

    function loadProgress(tema, nivel) {
      try {
        const raw = localStorage.getItem(key(tema, nivel));
        if (!raw) return null;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }

    // --------------------------------------------------------
    // 🌗 TEMA (LIGHT / DARK)
    // --------------------------------------------------------
    (function themeSetup() {
      const btn = els.themeBtn;
      if (!btn) return;

      function apply(th) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(th);
        document.body.classList.remove("light", "dark");
        document.body.classList.add(th);
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
    // STATUS + BARRAS DE PROGRESSO
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.statusTema : els.statusUpload;
      if (statusEl) statusEl.textContent = texto || "";

      const barraEl = modo === "tema" ? els.barraTemaFill : els.barraUploadFill;
      if (barraEl && progresso !== null) {
        barraEl.style.width = `${progresso}%`;
      }
    }

    // --------------------------------------------------------
    // UTILS
    // --------------------------------------------------------
    function shuffle(array) {
      const arr = array.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function safeJsonParse(raw) {
      if (!raw || typeof raw !== "string") {
        throw new Error("JSON vazio ou inválido");
      }

      // tentar extrair bloco ```json ... ```
      const block =
        raw.match(/```json([\s\S]*?)```/i) ||
        raw.match(/```([\s\S]*?)```/i);
      if (block) raw = block[1];

      const first = raw.search(/[\{\[]/);
      const lastBrace = raw.lastIndexOf("}");
      const lastBracket = raw.lastIndexOf("]");
      const last = Math.max(lastBrace, lastBracket);
      if (first !== -1 && last !== -1 && last > first) {
        raw = raw.slice(first, last + 1);
      }

      raw = raw.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, " ");
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // LLM CALL (exposto global)
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
    // GERAÇÃO DO PLANO POR TEMA (lista de sessões)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoesPorTema(tema, nivel) {
      const prompt = `
Crie um plano de estudo em sessões para o tema "${tema}" (nível: ${nivel}).
Retorne JSON puro (sem texto antes ou depois), por exemplo:

[
  {"numero":1, "nome":"Fundamentos do tema"},
  {"numero":2, "nome":"Conceitos intermediários"},
  {"numero":3, "nome":"Aplicações práticas"}
]`;

      const raw = await callLLM(
        "Você é Liora, especialista em microlearning e design instrucional.",
        prompt
      );
      return safeJsonParse(raw);
    }

    // --------------------------------------------------------
    // GERAÇÃO DE UMA SESSÃO COMPLETA
    // --------------------------------------------------------
    async function gerarSessaoPorTema(tema, nivel, numero, nome, sessaoAnteriorResumo = null) {
      const contextoAnterior = sessaoAnteriorResumo
        ? `Na sessão anterior, o aluno estudou: ${sessaoAnteriorResumo}. Agora avance para "${nome}" de forma coerente, sem repetir o que já foi visto.`
        : `Esta é a primeira sessão do tema "${tema}". Apresente o conteúdo de forma introdutória, mas consistente.`;

      const prompt = `
${contextoAnterior}

Crie uma sessão de estudo completa e bem detalhada para o tema "${tema}", sessão ${numero}, com foco em "${nome}".

Use APENAS JSON puro, com a seguinte estrutura:

{
 "titulo": "Sessão ${numero} — ${nome}",
 "objetivo": "descrição clara do objetivo de aprendizagem da sessão",
 "conteudo": {
   "introducao": "texto corrido, 2 a 3 parágrafos, contextualizando o assunto desta sessão",
   "conceitos": [
     "conceito 1 explicado em 2 a 3 frases, com profundidade",
     "conceito 2 explicado em 2 a 3 frases",
     "conceito 3 explicado em 2 a 3 frases"
   ],
   "exemplos": [
     "exemplo aplicado ao contexto profissional ou acadêmico",
     "outro exemplo prático que ajude a fixar o conteúdo"
   ],
   "aplicacoes": [
     "como o aluno pode aplicar o conteúdo desta sessão na prática",
     "uma situação realista onde o conhecimento desta sessão é essencial"
   ],
   "resumoRapido": [
     "ponto-chave 1 da sessão",
     "ponto-chave 2",
     "ponto-chave 3"
   ]
 },
 "analogias": [
   "uma analogia com algo do cotidiano para facilitar a compreensão",
   "outra analogia ou metáfora útil"
 ],
 "ativacao": [
   "pergunta reflexiva 1 que estimule o aluno a pensar no que acabou de ler",
   "pergunta 2, mais aplicada ao dia a dia"
 ],
 "quiz": {
   "pergunta": "pergunta de múltipla escolha relacionada a um ponto importante desta sessão",
   "alternativas": [
     "alternativa A",
     "alternativa B",
     "alternativa C"
   ],
   "corretaIndex": 1,
   "explicacao": "explique por que a alternativa correta está certa e as demais não estão"
 },
 "flashcards": [
   {"q": "pergunta objetiva sobre um conceito importante", "a": "resposta direta"},
   {"q": "outra pergunta de revisão rápida", "a": "resposta direta"}
 ]
}`;

      const raw = await callLLM(
        "Você é Liora, tutora especializada em microlearning. Responda apenas JSON válido.",
        prompt
      );
      return safeJsonParse(raw);
    }

    // --------------------------------------------------------
    // MAPA MENTAL BÁSICO
    // --------------------------------------------------------
    function construirMapaMental(sessao) {
      if (!sessao) return "";
      const titulo = sessao.titulo || "Sessão";
      const linhas = [];

      let mapaStr = null;
      if (typeof sessao.mapaMental === "string" && sessao.mapaMental.trim()) {
        mapaStr = sessao.mapaMental.trim();
      } else if (typeof sessao.mindmap === "string" && sessao.mindmap.trim()) {
        mapaStr = sessao.mindmap.trim();
      }

      if (mapaStr) {
        linhas.push(titulo);
        const blocos = mapaStr.split("|").map(b => b.trim()).filter(Boolean);
        blocos.forEach(bloco => {
          const parts = bloco.split(">").map(p => p.trim()).filter(Boolean);
          if (!parts.length) return;

          linhas.push("├─ " + parts[0]);
          for (let i = 1; i < parts.length; i++) {
            const isLast = i === parts.length - 1;
            const prefix = isLast ? "│   └─" : "│   ├─";
            linhas.push(`${prefix} ${parts[i]}`);
          }
        });

        return linhas.join("\n");
      }

      // fallback baseado no conteúdo
      const c = sessao.conteudo || {};

      linhas.push(titulo);
      linhas.push("├─ Objetivo: " + (sessao.objetivo || "—"));

      if (c.introducao) linhas.push("├─ Introdução");

      if (Array.isArray(c.conceitos) && c.conceitos.length) {
        linhas.push("├─ Conceitos");
        c.conceitos.forEach((item, idx) => {
          linhas.push(`│   ├─ ${idx + 1}. ${item}`);
        });
      }

      if (Array.isArray(c.exemplos) && c.exemplos.length) {
        linhas.push("├─ Exemplos");
        c.exemplos.forEach((item, idx) => {
          linhas.push(`│   ├─ ${idx + 1}. ${item}`);
        });
      }

      if (Array.isArray(c.aplicacoes) && c.aplicacoes.length) {
        linhas.push("├─ Aplicações");
        c.aplicacoes.forEach((item, idx) => {
          linhas.push(`│   ├─ ${idx + 1}. ${item}`);
        });
      }

      if (Array.isArray(c.resumoRapido) && c.resumoRapido.length) {
        linhas.push("└─ Pontos-chave");
        c.resumoRapido.forEach((item, idx) => {
          linhas.push(`    ├─ ${idx + 1}. ${item}`);
        });
      }

      return linhas.join("\n");
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO (lista de sessões)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      if (!els.plano) return;
      els.plano.innerHTML = "";

      if (!plano || !plano.length) {
        els.plano.innerHTML =
          '<p class="text-sm text-[var(--muted)]">Nenhum plano gerado ainda.</p>';
        return;
      }

      plano.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.style.cursor = "pointer";
        div.dataset.index = index;
        div.textContent = p.titulo || p.nome || `Sessão ${index + 1}`;

        div.addEventListener("mouseenter", () => div.classList.add("hovered"));
        div.addEventListener("mouseleave", () => div.classList.remove("hovered"));

        div.addEventListener("click", () => {
          document
            .querySelectorAll(".liora-card-topico")
            .forEach(el => el.classList.remove("active"));

          div.classList.add("active");

          wizard.atual = index;
          renderWizard();

          if (els.wizard) {
            window.scrollTo({
              top: els.wizard.offsetTop - 20,
              behavior: "smooth",
            });
          }
        });

        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO WIZARD
    // --------------------------------------------------------
    function renderWizard() {
      if (!els.wizard) return;

      if (!wizard.sessoes || !wizard.sessoes.length) {
        els.wizard.classList.add("hidden");
        return;
      }

      const s = wizard.sessoes[wizard.atual];
      if (!s) {
        els.wizard.classList.add("hidden");
        return;
      }

      // agora sim: exibe o wizard
      els.wizard.classList.remove("hidden");

      if (els.wTema) els.wTema.textContent = wizard.tema || "";
      if (els.wTitulo) els.wTitulo.textContent = s.titulo || "";
      if (els.wObjetivo) els.wObjetivo.textContent = s.objetivo || "";

      const c = s.conteudo || {};
      if (els.wConteudo) {
        els.wConteudo.innerHTML = `
          ${c.introducao ? `
          <div class="liora-section">
            <h5>INTRODUÇÃO</h5>
            <p>${c.introducao}</p>
          </div>
          <hr class="liora-divider">` : ""}

          ${Array.isArray(c.conceitos) && c.conceitos.length ? `
          <div class="liora-section">
            <h5>CONCEITOS PRINCIPAIS</h5>
            <ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">` : ""}

          ${Array.isArray(c.exemplos) && c.exemplos.length ? `
          <div class="liora-section">
            <h5>EXEMPLOS</h5>
            <ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">` : ""}

          ${Array.isArray(c.aplicacoes) && c.aplicacoes.length ? `
          <div class="liora-section">
            <h5>APLICAÇÕES</h5>
            <ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">` : ""}

          ${Array.isArray(c.resumoRapido) && c.resumoRapido.length ? `
          <div class="liora-section">
            <h5>RESUMO RÁPIDO</h5>
            <ul>${c.resumoRapido.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>` : ""}
        `;
      }

      if (els.wAnalogias) {
        els.wAnalogias.innerHTML = (s.analogias || [])
          .map(a => `<p>${a}</p>`)
          .join("");
      }

      if (els.wAtivacao) {
        els.wAtivacao.innerHTML = (s.ativacao || [])
          .map(q => `<li>${q}</li>`)
          .join("");
      }

      // Quiz
      if (els.wQuiz) {
        els.wQuiz.innerHTML = "";
        const q = s.quiz || {};
        if (q.pergunta) {
          const pergunta = document.createElement("p");
          pergunta.textContent = q.pergunta;
          els.wQuiz.appendChild(pergunta);
        }

        const alternativas = Array.isArray(q.alternativas)
          ? shuffle(
              q.alternativas.map((alt, i) => ({
                texto: String(alt)
                  .replace(/\n/g, " ")
                  .replace(/<\/?[^>]+(>|$)/g, ""),
                correta: i === Number(q.corretaIndex),
              }))
            )
          : [];

        if (els.wQuizFeedback) {
          els.wQuizFeedback.textContent = "";
          els.wQuizFeedback.style.opacity = 0;
        }

        alternativas.forEach((altObj, idx) => {
          const opt = document.createElement("label");
          opt.className = "liora-quiz-option";
          opt.innerHTML = `
            <input type="radio" name="quiz" value="${idx}">
            <span class="liora-quiz-option-text">${altObj.texto}</span>
          `;

          opt.addEventListener("click", () => {
            document
              .querySelectorAll(".liora-quiz-option")
              .forEach(o => o.classList.remove("selected"));

            opt.classList.add("selected");
            opt.querySelector("input").checked = true;

            if (!els.wQuizFeedback) return;
            els.wQuizFeedback.style.opacity = 0;

            setTimeout(() => {
              if (altObj.correta) {
                els.wQuizFeedback.textContent =
                  `✅ Correto! ${q.explicacao || ""}`;
                els.wQuizFeedback.style.color = "var(--brand)";
              } else {
                els.wQuizFeedback.textContent = "❌ Tente novamente.";
                els.wQuizFeedback.style.color = "var(--muted)";
              }
              els.wQuizFeedback.style.transition = "opacity .4s ease";
              els.wQuizFeedback.style.opacity = 1;
            }, 120);
          });

          els.wQuiz.appendChild(opt);
        });
      }

      if (els.wFlashcards) {
        els.wFlashcards.innerHTML = (s.flashcards || [])
          .map(f => `<li><b>${f.q}</b>: ${f.a}</li>`)
          .join("");
      }

      if (els.wMapa) {
        const mapa = construirMapaMental(s);
        els.wMapa.textContent = mapa || "Mapa mental gerado a partir desta sessão.";
      }

      if (els.wBar && wizard.sessoes.length) {
        els.wBar.style.width =
          `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
      }
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO DO WIZARD
    // --------------------------------------------------------
    if (els.wVoltar) {
      els.wVoltar.addEventListener("click", () => {
        if (wizard.atual > 0) {
          wizard.atual--;
          renderWizard();
          saveProgress();
        }
      });
    }

    if (els.wProxima) {
      els.wProxima.addEventListener("click", () => {
        if (wizard.atual < wizard.sessoes.length - 1) {
          wizard.atual++;
          renderWizard();
          saveProgress();
        } else {
          atualizarStatus(
            wizard.origem === "upload" ? "upload" : "tema",
            "🎉 Tema concluído!",
            100
          );
        }
      });
    }

    // --------------------------------------------------------
    // FLUXO: GERAR POR TEMA
    // --------------------------------------------------------
    async function fluxoTema(tema, nivel) {
      if (!els.btnGerar) return;
      els.btnGerar.disabled = true;
      wizard.origem = "tema";

      atualizarStatus("tema", "🧩 Criando plano...", 0);

      try {
        const cached = loadProgress(tema, nivel);
        if (cached && cached.sessoes && cached.sessoes.length) {
          wizard = cached;
          if (els.ctx) els.ctx.textContent = `Tema: ${tema} (${nivel})`;
          renderPlanoResumo(wizard.plano);
          renderWizard();
          atualizarStatus("tema", "✅ Plano carregado do histórico.", 100);
          return;
        }

        const plano = await gerarPlanoDeSessoesPorTema(tema, nivel);

        wizard = { tema, nivel, plano: [], sessoes: [], atual: 0, origem: "tema" };

        const planoNorm = plano.map((p, i) => ({
          numero: p.numero ?? i + 1,
          nome: p.nome ?? `Sessão ${i + 1}`,
        }));
        wizard.plano = planoNorm.map(p => ({
          titulo: `Sessão ${p.numero} — ${p.nome}`,
        }));

        if (els.ctx) els.ctx.textContent = `Tema: ${tema} (${nivel})`;
        renderPlanoResumo(wizard.plano);

        let resumoAnterior = null;

        for (let i = 0; i < planoNorm.length; i++) {
          const p = planoNorm[i];
          atualizarStatus(
            "tema",
            `⏳ Sessão ${i + 1}/${planoNorm.length}: ${p.nome}`,
            ((i + 1) / planoNorm.length) * 100
          );

          const sessao = await gerarSessaoPorTema(
            tema,
            nivel,
            p.numero,
            p.nome,
            resumoAnterior
          );

          wizard.sessoes.push(sessao);

          const c = sessao.conteudo || {};
          const resumoRapido = Array.isArray(c.resumoRapido)
            ? c.resumoRapido.join("; ")
            : "";
          resumoAnterior =
            (sessao.objetivo || "") +
            ". " +
            (c.introducao || "") +
            (resumoRapido ? " Pontos-chave: " + resumoRapido : "");

          saveProgress();
        }

        atualizarStatus("tema", "✅ Sessões concluídas!", 100);
        renderWizard();
      } catch (err) {
        console.error("Erro no fluxoTema:", err);
        alert("Erro ao gerar plano por tema.");
        atualizarStatus("tema", "⚠️ Erro ao gerar plano.");
      } finally {
        els.btnGerar.disabled = false;
      }
    }

    // --------------------------------------------------------
    // FLUXO: GERAR POR UPLOAD (Modelo D)
    // --------------------------------------------------------
    async function fluxoUpload(file, nivel) {
      if (!els.btnGerarUpload) return;
      els.btnGerarUpload.disabled = true;
      wizard.origem = "upload";

      try {
        if (file.type !== "application/pdf") {
          alert("Por enquanto a Liora lê apenas PDFs.");
          return;
        }

        if (file.size > 12 * 1024 * 1024) {
          alert("Arquivo muito grande (limite: 12 MB).");
          return;
        }

        if (!window.LioraPDFExtractor) {
          throw new Error("LioraPDFExtractor não encontrado.");
        }
        if (!window.LioraPDF) {
          throw new Error("LioraPDF não encontrado.");
        }
        if (!window.LioraOutline) {
          throw new Error("LioraOutline não encontrado.");
        }

        atualizarStatus("upload", "📄 Lendo PDF...", 10);

        const extrairFn =
          window.LioraPDFExtractor.extrairBlocos ||
          window.LioraPDFExtractor.extrairBlocosDoPDF;
        if (typeof extrairFn !== "function") {
          throw new Error("Nenhuma função de extração válida em LioraPDFExtractor.");
        }

        const blocos = await extrairFn(file);
        console.log("📄 Blocos extraídos:", blocos);
        atualizarStatus("upload", "🧱 Montando seções...", 30);

        const secoes = window.LioraPDF.construirSecoesAPartirDosBlocos(blocos);
        console.log("🧱 Seções heurísticas:", secoes);

        if (!secoes || !secoes.length) {
          atualizarStatus("upload", "⚠️ Não foi possível identificar seções.", 100);
          alert("Não foi possível identificar seções neste PDF.");
          return;
        }

        atualizarStatus("upload", "🧠 Gerando tópicos por seção...", 50);
        const outlines = await window.LioraOutline.gerarOutlinesPorSecao(secoes);
        console.log("🧠 Outlines por seção:", outlines);

        atualizarStatus("upload", "📚 Unificando tópicos...", 70);
        const outlineUnificado = window.LioraOutline.unificarOutlines(outlines);
        console.log("🧠 Outline unificado:", outlineUnificado);

        atualizarStatus("upload", "✏️ Montando sessões completas...", 90);
        const planoFinal = await window.LioraOutline.gerarPlanoDeEstudo(outlineUnificado);
        console.log("📘 Plano final (upload):", planoFinal);

        if (!planoFinal || !Array.isArray(planoFinal.sessoes) || !planoFinal.sessoes.length) {
          atualizarStatus("upload", "⚠️ Não foi possível gerar sessões.", 100);
          alert("A IA não conseguiu gerar sessões a partir deste PDF.");
          return;
        }

        wizard = {
          tema: file.name.replace(/\.pdf$/i, ""),
          nivel,
          plano: planoFinal.sessoes.map(s => ({ titulo: s.titulo || "" })),
          sessoes: planoFinal.sessoes,
          atual: 0,
          origem: "upload",
        };

        if (els.ctx) els.ctx.textContent = `PDF: ${wizard.tema}`;
        atualizarStatus("upload", "✅ Sessões concluídas!", 100);
        renderPlanoResumo(wizard.plano);
        renderWizard();
      } catch (err) {
        console.error("Erro no fluxoUpload:", err);
        alert("Erro ao gerar plano a partir do PDF.");
        atualizarStatus("upload", "⚠️ Erro ao gerar plano.");
      } finally {
        els.btnGerarUpload.disabled = false;
      }
    }

    // --------------------------------------------------------
    // BOTÕES: GERAR (TEMA) E GERAR (UPLOAD)
    // --------------------------------------------------------
    if (els.btnGerar) {
      els.btnGerar.addEventListener("click", () => {
        const tema = (els.inpTema && els.inpTema.value.trim()) || "";
        const nivel = els.selNivel ? els.selNivel.value : "iniciante";

        if (!tema) {
          alert("Digite um tema para gerar o plano.");
          return;
        }

        fluxoTema(tema, nivel);
      });
    }

    if (els.btnGerarUpload) {
      els.btnGerarUpload.addEventListener("click", () => {
        const file = els.inpFile && els.inpFile.files && els.inpFile.files[0];
        const nivel = els.selNivel ? els.selNivel.value : "iniciante";

        if (!file) {
          alert("Selecione um arquivo PDF.");
          return;
        }

        fluxoUpload(file, nivel);
      });
    }

    // --------------------------------------------------------
    // ATUALIZA NOME DO ARQUIVO NO UPLOAD
    // --------------------------------------------------------
    if (els.inpFile) {
      els.inpFile.addEventListener("change", e => {
        const file = e.target.files && e.target.files[0];
        if (els.uploadText) {
          els.uploadText.textContent = file
            ? `Selecionado: ${file.name}`
            : "Clique ou arraste um PDF";
        }
        if (els.uploadSpinner) els.uploadSpinner.style.display = "none";
      });
    }

    console.log("🟢 Liora Core v70-COMMERCIAL carregado com sucesso");
  });
})();
