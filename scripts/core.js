// ==========================================================
// 🧠 LIORA — CORE v70-COMMERCIAL-PREMIUM-DIA2
// - Compatível com index.html comercial atual
// - Tema: plano + sessões completas (cache localStorage)
// - Upload: Modelo D (outline + sessões a partir do PDF)
// - Wizard Premium (fade, microinterações, quiz bonito)
// - Loading global (overlay) e Erro global (overlay)
// - Status + barras de progresso (tema / upload)
// - Integração total com nav-home.js / simulados / dashboard
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v70-COMMERCIAL-PREMIUM-DIA2...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // 🌟 UI GLOBAL: Loading & Erro (usando index.html)
    // --------------------------------------------------------
    (function setupGlobalUI() {
      const loadingEl = document.getElementById("liora-loading");
      const loadingText = document.getElementById("liora-loading-text");

      window.lioraLoading = {
        show(msg = "Processando...") {
          if (!loadingEl) {
            console.warn("⚠️ lioraLoading: elemento #liora-loading não encontrado.");
            return;
          }
          if (loadingText) loadingText.textContent = msg;
          loadingEl.classList.remove("hidden");
        },
        hide() {
          if (!loadingEl) return;
          loadingEl.classList.add("hidden");
        },
      };

      const errorEl = document.getElementById("liora-error");
      const errorMsgEl = document.getElementById("liora-error-message");
      const btnRetry = document.getElementById("liora-error-retry");
      const btnBack = document.getElementById("liora-error-back");

      window.lioraError = {
        show(msg = "Ocorreu um erro inesperado.") {
          if (!errorEl) {
            alert(msg);
            return;
          }
          if (errorMsgEl) errorMsgEl.textContent = msg;
          errorEl.classList.remove("hidden");
        },
        hide() {
          if (!errorEl) return;
          errorEl.classList.add("hidden");
        },
      };

      if (btnRetry) {
        btnRetry.addEventListener("click", () => {
          window.lioraError.hide();
        });
      }

      if (btnBack) {
        btnBack.addEventListener("click", () => {
          window.lioraError.hide();
          // usa a própria navegação da home
          const fabHome = document.getElementById("fab-home");
          if (fabHome) fabHome.click();
        });
      }
    })();

    // --------------------------------------------------------
    // ELEMENTOS
    // --------------------------------------------------------
    const els = {
      // tema
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      // upload
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      // progresso
      barraTemaFill: document.getElementById("barra-tema-fill"),
      barraUploadFill: document.getElementById("barra-upload-fill"),

      // plano
      areaPlano: document.getElementById("area-plano"),
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
      wizardMapa: document.getElementById("liora-sessao-mapa"),
      wizardVoltar: document.getElementById("liora-btn-voltar"),
      wizardProxima: document.getElementById("liora-btn-proxima"),

      // tema claro/escuro
      themeBtn: document.getElementById("btn-theme"),

      // upload UX
      uploadText: document.getElementById("upload-text"),
      uploadSpinner: document.getElementById("upload-spinner"),
    };

    if (els.plano) {
      els.plano.innerHTML =
        '<p class="text-sm text-[var(--muted)]">Gere um plano de estudo (por tema ou upload) para ver as sessões aqui.</p>';
    }

    if (els.wizardContainer) {
      els.wizardContainer.classList.add("hidden");
    }

    // --------------------------------------------------------
    // ESTADO
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

    const saveProgress = () => {
      if (!wizard.tema || !wizard.nivel) return;
      try {
        localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
      } catch (e) {
        console.warn("⚠️ Não foi possível salvar no localStorage", e);
      }
    };

    const loadProgress = (tema, nivel) => {
      try {
        return JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");
      } catch {
        return null;
      }
    };

    window.lioraWizardShouldShow = function () {
      return !!(wizard && wizard.sessoes && wizard.sessoes.length);
    };

    // --------------------------------------------------------
    // 🌗 THEME (LIGHT / DARK)
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
    // STATUS + BARRAS
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;

      const barra = modo === "tema" ? els.barraTemaFill : els.barraUploadFill;
      if (barra && progresso !== null) {
        barra.style.width = `${progresso}%`;
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

      const block =
        raw.match(/```json([\s\S]*?)```/i) ||
        raw.match(/```([\s\S]*?)```/i);
      if (block) {
        raw = block[1];
      }

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

    async function callLLM(system, user) {
      try {
        const res = await fetch("/api/liora", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ system, user }),
        });

        const json = await res.json().catch(() => ({}));
        if (!json.output) throw new Error("Resposta inválida da IA");
        return json.output;
      } catch (e) {
        console.error("❌ callLLM ERRO:", e);
        throw e;
      }
    }
    window.callLLM = callLLM;

    // --------------------------------------------------------
    // MAPA MENTAL
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
        blocos.forEach((bloco) => {
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

      const c = sessao.conteudo || {};

      linhas.push(titulo);
      linhas.push("├─ Objetivo: " + (sessao.objetivo || "—"));

      if (c.introducao) {
        linhas.push("├─ Introdução");
      }

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

      if (els.areaPlano) {
        els.areaPlano.classList.remove("hidden");
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
          if (els.wizardContainer) {
            window.scrollTo({
              top: els.wizardContainer.offsetTop - 20,
              behavior: "smooth",
            });
          }
        });

        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // WIZARD PREMIUM — fade-in + microinterações
    // --------------------------------------------------------
    function renderWizard() {
      if (!els.wizardContainer) return;

      if (!wizard.sessoes || !wizard.sessoes.length) {
        els.wizardContainer.classList.add("hidden");
        return;
      }

      const s = wizard.sessoes[wizard.atual];
      if (!s) {
        els.wizardContainer.classList.add("hidden");
        return;
      }

      els.wizardContainer.classList.remove("hidden");

      const card = els.wizardContainer.querySelector(".liora-wizard-card");
      if (card) {
        card.classList.remove("visible");
        setTimeout(() => card.classList.add("visible"), 20);
      }

      if (els.wizardQuizFeedback) {
        els.wizardQuizFeedback.textContent = "";
        els.wizardQuizFeedback.style.opacity = 0;
      }

      if (els.wizardTema) els.wizardTema.textContent = wizard.tema || "";
      if (els.wizardTitulo) els.wizardTitulo.textContent = s.titulo || "";
      if (els.wizardObjetivo) els.wizardObjetivo.textContent = s.objetivo || "";

      const c = s.conteudo || {};
      if (els.wizardConteudo) {
        els.wizardConteudo.innerHTML = `
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

      if (els.wizardAnalogias) {
        els.wizardAnalogias.innerHTML = (s.analogias || [])
          .map(a => `<p>${a}</p>`)
          .join("");
      }

      if (els.wizardAtivacao) {
        els.wizardAtivacao.innerHTML = (s.ativacao || [])
          .map(q => `<li>${q}</li>`)
          .join("");
      }

      if (els.wizardQuiz) {
        els.wizardQuiz.innerHTML = "";
        const q = s.quiz || {};
        if (q.pergunta) {
          const pergunta = document.createElement("p");
          pergunta.textContent = q.pergunta;
          els.wizardQuiz.appendChild(pergunta);
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

            if (!els.wizardQuizFeedback) return;
            els.wizardQuizFeedback.style.opacity = 0;

            setTimeout(() => {
              if (altObj.correta) {
                els.wizardQuizFeedback.textContent =
                  `✅ Correto! ${q.explicacao || ""}`;
                els.wizardQuizFeedback.style.color = "var(--brand)";
              } else {
                els.wizardQuizFeedback.textContent = "❌ Tente novamente.";
                els.wizardQuizFeedback.style.color = "var(--muted)";
              }
              els.wizardQuizFeedback.style.transition = "opacity .4s ease";
              els.wizardQuizFeedback.style.opacity = 1;
            }, 120);
          });

          els.wizardQuiz.appendChild(opt);
        });
      }

      if (els.wizardFlashcards) {
        els.wizardFlashcards.innerHTML = (s.flashcards || [])
          .map(f => `<li><b>${f.q}</b>: ${f.a}</li>`)
          .join("");
      }

      if (els.wizardMapa) {
        const mapa = construirMapaMental(s);
        els.wizardMapa.textContent =
          mapa || "Mapa mental gerado a partir desta sessão.";
      }
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO DO WIZARD
    // --------------------------------------------------------
    if (els.wizardVoltar) {
      els.wizardVoltar.addEventListener("click", () => {
        if (wizard.atual > 0) {
          wizard.atual--;
          renderWizard();
          saveProgress();
        }
      });
    }

    if (els.wizardProxima) {
      els.wizardProxima.addEventListener("click", () => {
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
    // TEMA: PLANO E SESSÕES (com loading/erro global)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoesPorTema(tema, nivel) {
      const prompt = `
Crie um plano de estudo em sessões para o tema "${tema}" (nível: ${nivel}).
Retorne JSON puro, por exemplo:
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

    async function gerarSessaoPorTema(tema, nivel, numero, nome, sessaoAnteriorResumo = null) {
      const contextoAnterior = sessaoAnteriorResumo
        ? `Na sessão anterior, o aluno estudou: ${sessaoAnteriorResumo}. Agora avance para "${nome}" sem repetir o que já foi visto.`
        : `Esta é a primeira sessão do tema "${tema}". Apresente o conteúdo de forma introdutória, mas consistente.`;

      const prompt = `
${contextoAnterior}

Crie uma sessão de estudo completa para o tema "${tema}", sessão ${numero}, com foco em "${nome}".

Use APENAS JSON puro, com a seguinte estrutura:

{
 "titulo": "Sessão ${numero} — ${nome}",
 "objetivo": "descrição clara do objetivo de aprendizagem da sessão",
 "conteudo": {
   "introducao": "2 a 3 parágrafos contextualizando o assunto desta sessão",
   "conceitos": [
     "conceito 1 explicado em 2 a 3 frases",
     "conceito 2 explicado em 2 a 3 frases",
     "conceito 3 explicado em 2 a 3 frases"
   ],
   "exemplos": [
     "exemplo aplicado ao contexto profissional ou acadêmico",
     "outro exemplo prático"
   ],
   "aplicacoes": [
     "como o aluno pode aplicar o conteúdo desta sessão na prática",
     "situação realista onde este conhecimento é essencial"
   ],
   "resumoRapido": [
     "ponto-chave 1",
     "ponto-chave 2",
     "ponto-chave 3"
   ]
 },
 "analogias": [
   "uma analogia com algo do cotidiano",
   "outra metáfora útil"
 ],
 "ativacao": [
   "pergunta reflexiva 1",
   "pergunta 2 mais aplicada"
 ],
 "quiz": {
   "pergunta": "pergunta de múltipla escolha importante",
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

    async function fluxoTema(tema, nivel) {
      if (!els.btnGerar) return;
      els.btnGerar.disabled = true;
      wizard.origem = "tema";

      atualizarStatus("tema", "🧩 Criando plano...", 0);
      window.lioraLoading && window.lioraLoading.show("Gerando plano por tema...");

      try {
        const cached = loadProgress(tema, nivel);
        if (cached && cached.sessoes && cached.sessoes.length) {
          wizard = cached;
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
        atualizarStatus("tema", "⚠️ Erro ao gerar plano.");
        window.lioraError && window.lioraError.show("Falha ao gerar o plano por tema. Tente novamente.");
      } finally {
        els.btnGerar.disabled = false;
        window.lioraLoading && window.lioraLoading.hide();
      }
    }

    // --------------------------------------------------------
    // UPLOAD (Modelo D) — com loading/erro global
    // --------------------------------------------------------
    async function fluxoUpload(file, nivel) {
      if (!els.btnGerarUpload) return;
      els.btnGerarUpload.disabled = true;
      wizard.origem = "upload";

      try {
        if (file.type !== "application/pdf") {
          window.lioraError && window.lioraError.show("Por enquanto a Liora lê apenas arquivos PDF.");
          return;
        }

        if (file.size > 12 * 1024 * 1024) {
          window.lioraError && window.lioraError.show("Arquivo muito grande (limite aproximado: 12 MB).");
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

        window.lioraLoading && window.lioraLoading.show("Lendo PDF...");
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
          window.lioraError && window.lioraError.show("Não foi possível identificar seções neste PDF.");
          return;
        }

        window.lioraLoading && window.lioraLoading.show("Gerando tópicos por seção...");
        atualizarStatus("upload", "🧠 Gerando tópicos por seção...", 50);
        const outlines = await window.LioraOutline.gerarOutlinesPorSecao(secoes);
        console.log("🧠 Outlines por seção:", outlines);

        window.lioraLoading && window.lioraLoading.show("Unificando tópicos...");
        atualizarStatus("upload", "📚 Unificando tópicos...", 70);
        const outlineUnificado = window.LioraOutline.unificarOutlines(outlines);
        console.log("🧠 Outline unificado:", outlineUnificado);

        window.lioraLoading && window.lioraLoading.show("Montando sessões completas...");
        atualizarStatus("upload", "✏️ Montando sessões completas...", 90);
        const planoFinal = await window.LioraOutline.gerarPlanoDeEstudo(outlineUnificado);
        console.log("📘 Plano final (upload):", planoFinal);

        if (!planoFinal || !Array.isArray(planoFinal.sessoes) || !planoFinal.sessoes.length) {
          atualizarStatus("upload", "⚠️ Não foi possível gerar sessões.", 100);
          window.lioraError && window.lioraError.show("A IA não conseguiu gerar sessões a partir deste PDF.");
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

        atualizarStatus("upload", "✅ Sessões concluídas!", 100);
        renderPlanoResumo(wizard.plano);
        renderWizard();
        saveProgress();
      } catch (err) {
        console.error("Erro no fluxoUpload:", err);
        atualizarStatus("upload", "⚠️ Erro ao gerar plano.");
        window.lioraError && window.lioraError.show("Erro ao gerar plano a partir do PDF.");
      } finally {
        els.btnGerarUpload.disabled = false;
        window.lioraLoading && window.lioraLoading.hide();
      }
    }

    // --------------------------------------------------------
    // BOTÕES
    // --------------------------------------------------------
    if (els.btnGerar) {
      els.btnGerar.addEventListener("click", () => {
        const tema = (els.inpTema && els.inpTema.value.trim()) || "";
        const nivel = els.selNivel ? els.selNivel.value : "iniciante";

        if (!tema) {
          window.lioraError && window.lioraError.show("Digite um tema para gerar o plano.");
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
          window.lioraError && window.lioraError.show("Selecione um arquivo PDF.");
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
            : "Clique ou arraste um arquivo PDF";
        }
        if (els.uploadSpinner) els.uploadSpinner.style.display = "none";
      });
    }

    console.log("🟢 Liora Core v70-COMMERCIAL-PREMIUM-DIA2 carregado com sucesso");
  });
})();
