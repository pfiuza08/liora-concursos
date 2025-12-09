// ==========================================================
// 🧠 LIORA — CORE v77-FREEMIUM-A4-COMMERCIAL
// ----------------------------------------------------------
// Inclui:
// ✔ Tema: plano + sessões completas (via /api/gerarPlano.js)
// ✔ Upload: Modelo D (outline + sessões via /api/liora)
// ✔ Wizard Premium (fade, microinterações, quiz/flashcards bonitos)
// ✔ Loading global / Erro global
// ✔ Barras de progresso (tema/upload)
// ✔ Estudo Inteligente (Study Manager v2.1) — window.lioraEstudos
// ✔ Prefill de simulado — window.lioraPreFillSimulado()
// ✔ Continue Study Engine — window.lioraIrParaSessao()
// ✔ Salvamento incremental das sessões (wizard)
// ✔ Normalização das sessões geradas (id, ordem, mindmap)
// ✔ Integração com eventos cognitivos (quiz + flashcards → Estudos)
// ✔ NÃO reseta estudos salvos (memória preservada)
// ✔ Compatível com nav-home v93 + premium.js v6 + estudos v2.1
// ✔ NOVO: exibe nome do PDF (arquivo) no contexto lateral e no wizard
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v77...");

  // =====================================================
  // 🔒 BLOQUEIO PREMIUM (versão leve, não invasiva)
  // =====================================================
  (function registerPremiumGate() {
    function isPremium() {
      try {
        return JSON.parse(localStorage.getItem("liora_user"))?.premium === true;
      } catch {
        return false;
      }
    }

    window.lioraGate = {
      temaAvancado() {
        if (!isPremium()) {
          window.lioraPremium?.openUpgradeModal("tema-avancado");
          return false;
        }
        return true;
      },

      pdfCompleto() {
        if (!isPremium()) {
          window.lioraPremium?.openUpgradeModal("pdf-completo");
          return false;
        }
        return true;
      },

      simuladosPremium() {
        if (!isPremium()) {
          window.lioraPremium?.openUpgradeModal("simulados");
          return false;
        }
        return true;
      },
    };

    console.log("🔒 Premium Gate ativo (Core v77).");
  })();

  document.addEventListener("DOMContentLoaded", () => {
    // ======================================================
    // 🌱 Inicialização segura (NÃO destrói estudos salvos)
    // ======================================================
    console.log("🌱 Core v77: inicialização segura — sem reset automático de estudos.");

    window.liora = window.liora || {};
    window.lioraCache = window.lioraCache || {};

    if (typeof window.lioraPlano === "undefined") window.lioraPlano = null;
    if (typeof window.lioraSessoes === "undefined") window.lioraSessoes = [];
    // 🔥 NÃO TOCA em window.lioraEstudos — é responsabilidade de estudos.js

    // --------------------------------------------------------
    // 🌟 UI GLOBAL: Loading & Erro
    // --------------------------------------------------------
    (function setupGlobalUI() {
      const loadingEl = document.getElementById("liora-loading");
      const loadingText = document.getElementById("liora-loading-text");

      window.lioraLoading = {
        show(msg = "Processando...") {
          if (loadingEl) {
            if (loadingText) loadingText.textContent = msg;
            loadingEl.classList.remove("hidden");
          }
        },
        hide() {
          if (loadingEl) loadingEl.classList.add("hidden");
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
          if (errorEl) errorEl.classList.add("hidden");
        },
      };

      btnRetry?.addEventListener("click", () => window.lioraError.hide());
      btnBack?.addEventListener("click", () => {
        window.lioraError.hide();
        document.getElementById("fab-home")?.click();
      });
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

      // plano lateral
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
      wizardRevisar: document.getElementById("liora-btn-revisar"),

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
    // ESTADO (Wizard)
    // --------------------------------------------------------
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0,
      origem: "tema",
      pdfNome: null, // 👈 NOVO: nome real do arquivo PDF (quando origem = upload)
    };

    window.lioraModoRevisao = false;

    const key = (tema, nivel) =>
      `liora:wizard:${(tema || "").toLowerCase()}::${(nivel || "").toLowerCase()}`;

    const saveProgress = () => {
      if (!wizard.tema || !wizard.nivel) return;
      try {
        localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
      } catch (e) {
        console.warn("⚠️ Não foi possível salvar wizard no localStorage", e);
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
      return !!(wizard.sessoes && wizard.sessoes.length);
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
    // 🧠 MEMÓRIA DE ESTUDOS (Study Manager)
    // --------------------------------------------------------
    (function setupEstudosMemory() {
      const api = window.lioraEstudos;
      if (!api) {
        console.log("ℹ️ Estudos ainda não disponível no Core (carrega em estudos.js).");
        return;
      }
      // Integração principal acontece nas chamadas definirPlano / registrarProgresso etc.
    })();

    // --------------------------------------------------------
    // PREFILL DO SIMULADO (usa Study Manager v2.1)
    // --------------------------------------------------------
    window.lioraPreFillSimulado = function () {
      if (!window.lioraEstudos?.recomendarSimulado) return;

      const rec = window.lioraEstudos.recomendarSimulado();
      if (!rec) return;

      const temaEl = document.getElementById("sim-modal-tema");
      const qtdEl = document.getElementById("sim-modal-qtd");
      const difEl = document.getElementById("sim-modal-dificuldade");
      const bancaEl = document.getElementById("sim-modal-banca");

      if (temaEl) temaEl.value = rec.tema;
      if (qtdEl) qtdEl.value = rec.qtd;
      if (difEl) difEl.value = rec.dificuldade;
      if (bancaEl) bancaEl.value = rec.banca;
    };

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
    // EXTRAÇÃO DE TÓPICOS DO OUTLINE (robusta)
    // --------------------------------------------------------
    function extrairTopicosDoOutline(outlineRaw) {
      let topicos = [];

      if (!outlineRaw) return [];

      if (Array.isArray(outlineRaw)) {
        if (outlineRaw.length && typeof outlineRaw[0] === "string") {
          topicos = outlineRaw;
        } else if (outlineRaw.length && outlineRaw[0] && outlineRaw[0].titulo) {
          topicos = outlineRaw.map((t) => t.titulo);
        }
      } else if (Array.isArray(outlineRaw.topicos)) {
        const arr = outlineRaw.topicos;
        if (arr.length && typeof arr[0] === "string") {
          topicos = arr;
        } else if (arr.length && arr[0] && arr[0].titulo) {
          topicos = arr.map((t) => t.titulo);
        }
      } else if (Array.isArray(outlineRaw.outlineUnificado)) {
        const arr = outlineRaw.outlineUnificado;
        if (arr.length && typeof arr[0] === "string") {
          topicos = arr;
        } else if (arr.length && arr[0] && arr[0].titulo) {
          topicos = arr.map((t) => t.titulo);
        }
      }

      topicos = topicos
        .map((t) => String(t || "").trim())
        .filter((t) => t.length > 0);

      console.log("📘 Core v77 — tópicos extraídos do outline:", topicos);
      return topicos;
    }

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

        const blocos = mapaStr.split("|").map((b) => b.trim()).filter(Boolean);
        blocos.forEach((bloco) => {
          const parts = bloco.split(">").map((p) => p.trim()).filter(Boolean);
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

      if (c.introducao) linhas.push("├─ Introdução");

      if (Array.isArray(c.conceitos) && c.conceitos.length) {
        linhas.push("├─ Conceitos");
        c.conceitos.forEach((item, idx) =>
          linhas.push(`│   ├─ ${idx + 1}. ${item}`)
        );
      }

      if (Array.isArray(c.exemplos) && c.exemplos.length) {
        linhas.push("├─ Exemplos");
        c.exemplos.forEach((item, idx) =>
          linhas.push(`│   ├─ ${idx + 1}. ${item}`)
        );
      }

      if (Array.isArray(c.aplicacoes) && c.aplicacoes.length) {
        linhas.push("├─ Aplicações");
        c.aplicacoes.forEach((item, idx) =>
          linhas.push(`│   ├─ ${idx + 1}. ${item}`)
        );
      }

      if (Array.isArray(c.resumoRapido) && c.resumoRapido.length) {
        linhas.push("└─ Pontos-chave");
        c.resumoRapido.forEach((item, idx) =>
          linhas.push(`    ├─ ${idx + 1}. ${item}`)
        );
      }

      return linhas.join("\n");
    }

    // --------------------------------------------------------
    // CONTEÚDO PREMIUM (blocos, subtítulos laranja)
    // --------------------------------------------------------
    function renderConteudoPremium(conteudo) {
      const el = document.getElementById("liora-sessao-conteudo");
      if (!el) return;

      el.innerHTML = "";
      if (!conteudo) return;

      if (conteudo.introducao) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conteudo-titulo">Introdução</h6>
            <p class="liora-conteudo-texto">${conteudo.introducao}</p>
          </div>
        `;
      }

      if (Array.isArray(conteudo.conceitos) && conteudo.conceitos.length) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Conceitos principais</h6>
            <ul class="liora-lista">
              ${conteudo.conceitos.map((c) => `<li>• ${c}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      if (Array.isArray(conteudo.exemplos) && conteudo.exemplos.length) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Exemplos práticos</h6>
            <ul class="liora-lista">
              ${conteudo.exemplos.map((e) => `<li>• ${e}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      if (Array.isArray(conteudo.aplicacoes) && conteudo.aplicacoes.length) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Aplicações em prova / prática</h6>
            <ul class="liora-lista">
              ${conteudo.aplicacoes.map((a) => `<li>• ${a}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      if (Array.isArray(conteudo.resumoRapido) && conteudo.resumoRapido.length) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Resumo rápido</h6>
            <ul class="liora-lista">
              ${conteudo.resumoRapido.map((r) => `<li>• ${r}</li>`).join("")}
            </ul>
          </div>
        `;
      }
    }

    // --------------------------------------------------------
    // 🌟 CONTEXTO LATERAL (mostra tema ou nome do PDF)
    // --------------------------------------------------------
    function atualizarContextoLateral() {
      if (!els.ctx) return;

      if (wizard.origem === "upload" && wizard.pdfNome) {
        els.ctx.textContent = `PDF: ${wizard.pdfNome}`;
      } else if (wizard.tema) {
        els.ctx.textContent = wizard.tema;
      } else {
        els.ctx.textContent = "";
      }
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO (lista lateral)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      if (!els.plano) return;

      els.plano.innerHTML = "";
      if (!plano || !plano.length) {
        els.plano.innerHTML =
          '<p class="text-sm text-[var(--muted)]">Nenhum plano gerado ainda.</p>';
        atualizarContextoLateral();
        return;
      }

      els.areaPlano?.classList.remove("hidden");

      plano.forEach((p, index) => {
        const div = document.createElement("button");
        div.type = "button";
        div.className = "liora-card-topico";

        const sessao = wizard.sessoes[index];
        if (sessao?.forca === "forte") div.classList.add("forca-forte");
        else if (sessao?.forca === "media") div.classList.add("forca-media");
        else div.classList.add("forca-fraca");

        div.dataset.index = String(index);
        div.textContent = p.titulo || p.nome || `Sessão ${index + 1}`;

        div.addEventListener("click", () => {
          window.lioraIrParaSessao && window.lioraIrParaSessao(index, false);
        });

        els.plano.appendChild(div);
      });

      const cards = els.plano.querySelectorAll(".liora-card-topico");
      cards.forEach((c) => c.classList.remove("active"));
      if (cards[wizard.atual]) cards[wizard.atual].classList.add("active");

      atualizarContextoLateral();
    }

    // ==========================================================
    // 🧩 A3.1 — Reforço Inteligente de Sessões Fracas
    // ==========================================================
    async function reforcarSessaoSeNecessario(sessao, temaGeral) {
      function isVazio(x) {
        return !x || (Array.isArray(x) && x.length === 0);
      }

      const fraca =
        isVazio(sessao.conteudo?.conceitos) ||
        isVazio(sessao.conteudo?.exemplos) ||
        isVazio(sessao.conteudo?.aplicacoes) ||
        isVazio(sessao.ativacao) ||
        isVazio(sessao.analogias) ||
        isVazio(sessao.resumoRapido) ||
        !sessao.quiz?.pergunta ||
        isVazio(sessao.flashcards);

      if (!fraca) return sessao;

      const system = `
Você é a IA educacional da Liora.  
Você deve **APENAS enriquecer** a sessão abaixo, mantendo tudo o que
já existe e completando apenas partes fracas.

NUNCA reescreva tudo do zero.
NUNCA mude a estrutura da sessão existente.

Retorne APENAS JSON válido no formato da sessão.
`;

      const user = `
SESSÃO ATUAL:
${JSON.stringify(sessao, null, 2)}

TEMA GERAL: ${temaGeral}

Reforce conteúdo pobre, crie analogias úteis,
aumente exemplos e aplicações, melhore a ativação,
e sempre inclua de 3 a 6 flashcards.
`;

      try {
        const raw = await callLLM(system, user);
        const improved = safeJsonParse(raw);

        return {
          ...sessao,
          ...improved,
          conteudo: { ...sessao.conteudo, ...improved.conteudo },
        };
      } catch (e) {
        console.warn("A3.1: falha no reforço, usando versão original", e);
        return sessao;
      }
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO WIZARD (PREMIUM A3.3 + eventos de estudo)
    // --------------------------------------------------------
    function renderWizard() {
      if (!els.wizardContainer) return;

      if (!wizard.sessoes || !wizard.sessoes.length) {
        els.wizardContainer.classList.add("hidden");
        atualizarContextoLateral();
        return;
      }

      const s = wizard.sessoes[wizard.atual];
      if (!s) {
        els.wizardContainer.classList.add("hidden");
        atualizarContextoLateral();
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

      // Cabeçalho: tema ou nome do PDF
      if (els.wizardTema) {
        if (wizard.origem === "upload" && wizard.pdfNome) {
          els.wizardTema.textContent = `📄 ${wizard.pdfNome}`;
        } else {
          els.wizardTema.textContent = wizard.tema || "";
        }
      }

      const progressoTopEl = document.getElementById("liora-sessao-progress");
      if (progressoTopEl) {
        progressoTopEl.textContent =
          `Sessão ${wizard.atual + 1} de ${wizard.sessoes.length}`;
      }

      if (els.wizardTitulo) els.wizardTitulo.textContent = s.titulo || "";

      if (els.wizardObjetivo) els.wizardObjetivo.textContent = s.objetivo || "";

      renderConteudoPremium(s.conteudo || {});

      // ----------------------- ANALOGIAS -----------------------
      if (els.wizardAnalogias) {
        const list = Array.isArray(s.analogias) ? s.analogias : [];
        els.wizardAnalogias.innerHTML = list.length
          ? list.map((a) => `<p>• ${a}</p>`).join("")
          : "<p class='liora-muted'>Nenhuma analogia gerada para esta sessão.</p>";
      }

      // ----------------------- ATIVAÇÃO -----------------------
      if (els.wizardAtivacao) {
        const list = Array.isArray(s.ativacao) ? s.ativacao : [];
        els.wizardAtivacao.innerHTML = list.length
          ? `<ul>${list.map((q) => `<li>${q}</li>`).join("")}</ul>`
          : "<p class='liora-muted'>Nenhuma pergunta de ativação disponível.</p>";
      }

      // ----------------------- QUIZ (Premium + Estudos) -----------------------
      if (els.wizardQuiz) {
        els.wizardQuiz.innerHTML = "";

        const q = s.quiz || {};

        let alternativasBrutas = Array.isArray(q.alternativas)
          ? q.alternativas.filter((a) => !!String(a || "").trim())
          : [];

        const explicacoesArr = Array.isArray(q.explicacoes)
          ? q.explicacoes
          : [];

        if (!q.pergunta && alternativasBrutas.length) {
          q.pergunta = "Analise as alternativas e escolha a melhor resposta.";
        }

        if (alternativasBrutas.length < 2) {
          console.warn("A3.2: Quiz muito fraco → fallback ativado");
          q.pergunta = q.pergunta || "Qual das opções abaixo está mais correta?";
          alternativasBrutas = [
            alternativasBrutas[0] || "Resposta considerada correta.",
            "Não sei responder.",
          ];
          q.corretaIndex = 0;
        }

        if (q.pergunta) {
          const pergunta = document.createElement("p");
          pergunta.className = "liora-quiz-question";
          pergunta.textContent = q.pergunta;
          els.wizardQuiz.appendChild(pergunta);
        }

        let alternativas = alternativasBrutas.map((alt, i) => ({
          texto: String(alt)
            .replace(/\n/g, " ")
            .replace(/<\/?[^>]+(>|$)/g, ""),
          indiceOriginal: i,
          corretaOriginal: i === Number(q.corretaIndex),
        }));

        if (!alternativas.some((a) => a.corretaOriginal)) {
          alternativas[0].corretaOriginal = true;
        }

        alternativas = shuffle(alternativas);

        alternativas = alternativas.map((alt, idx) => ({
          ...alt,
          idx,
          correta: alt.corretaOriginal,
        }));

        alternativas.forEach((altObj) => {
          const opt = document.createElement("div");
          opt.className = "liora-quiz-option";
          opt.dataset.index = String(altObj.idx);

          opt.innerHTML = `
            <input type="radio" name="quiz-${wizard.atual}" value="${altObj.idx}">
            <span class="liora-quiz-option-text">${altObj.texto}</span>
            <span class="liora-quiz-dot"></span>
          `;

          opt.addEventListener("click", () => {
            els.wizardQuiz
              .querySelectorAll(".liora-quiz-option")
              .forEach((o) =>
                o.classList.remove("selected", "correct", "incorrect")
              );

            opt.classList.add("selected");

            const expEspecifica =
              explicacoesArr[altObj.indiceOriginal]
                ? String(explicacoesArr[altObj.indiceOriginal])
                : "";

            const baseFallback = q.explicacao || "";

            let textoFinal = "";
            const acertou = !!altObj.correta;

            if (acertou) {
              opt.classList.add("correct");
              textoFinal = expEspecifica || baseFallback || "";
              textoFinal = textoFinal
                ? `✅ Correto! ${textoFinal}`
                : "✅ Correto!";
              els.wizardQuizFeedback.style.color = "var(--brand)";
            } else {
              opt.classList.add("incorrect");
              textoFinal = expEspecifica || baseFallback || "";
              textoFinal = textoFinal
                ? `❌ Errado. ${textoFinal}`
                : "❌ Errado. Releia a pergunta e tente novamente.";
              els.wizardQuizFeedback.style.color = "var(--muted)";
            }

            // Registrar evento de quiz no Study Manager (A4)
            if (window.lioraEstudos?.registrarQuizResultado && s?.id) {
              window.lioraEstudos.registrarQuizResultado(s.id, {
                acertou,
                tentativas: 1,
              });
            }

            els.wizardQuizFeedback.innerHTML = textoFinal;
            els.wizardQuizFeedback.classList.remove("fade");
            void els.wizardQuizFeedback.offsetWidth;
            els.wizardQuizFeedback.classList.add("fade");
          });

          els.wizardQuiz.appendChild(opt);
        });
      }

      // ----------------------- FLASHCARDS PREMIUM + Estudos -------------------
      if (els.wizardFlashcards) {
        let cards = Array.isArray(s.flashcards) ? s.flashcards : [];

        cards = cards
          .map((fc) => {
            if (fc?.q && fc?.a) return fc;
            if (fc?.pergunta && fc?.resposta)
              return { q: fc.pergunta, a: fc.resposta };
            if (typeof fc === "string") {
              const partes = fc.split("|");
              if (partes.length >= 2) {
                return {
                  q: partes[0].replace(/Pergunta:?/i, "").trim(),
                  a: partes[1].replace(/Resposta:?/i, "").trim(),
                };
              }
            }
            return null;
          })
          .filter((x) => x && x.q && x.a);

        if (!cards.length) {
          els.wizardFlashcards.innerHTML =
            "<p class='liora-muted'>Nenhum flashcard gerado para esta sessão.</p>";
        } else {
          els.wizardFlashcards.innerHTML = cards
            .map(
              (f, i) => `
                <article class="liora-flashcard" data-index="${i}">
                  <div class="liora-flashcard-q">
                    <span class="liora-flashcard-icon">▸</span>
                    ${f.q}
                  </div>
                  <div class="liora-flashcard-a">${f.a}</div>
                </article>
              `
            )
            .join("");

          els.wizardFlashcards
            .querySelectorAll(".liora-flashcard")
            .forEach((cardEl) => {
              cardEl.addEventListener("click", () => {
                const abrindo = !cardEl.classList.contains("open");
                cardEl.classList.toggle("open");

                // registrar uso de flashcard no Study Manager
                if (
                  abrindo &&
                  window.lioraEstudos?.registrarFlashcardUso &&
                  s?.id
                ) {
                  window.lioraEstudos.registrarFlashcardUso(s.id, { qtd: 1 });
                }
              });
            });
        }
      }

      // ----------------------- MAPA MENTAL PREMIUM -----------------------
      if (els.wizardMapa) {
        const mapa = construirMapaMental(s);
        els.wizardMapa.innerHTML = `
          <pre class="liora-mindmap-block">${
            mapa || "Mapa mental gerado automaticamente não pôde ser exibido."
          }</pre>
        `;
      }

      // Study Manager — marca sessão como "vista" levemente
      if (window.lioraEstudos?.updateSessionProgress && s?.id) {
        window.lioraEstudos.updateSessionProgress(s.id, 0.5);
      }

      renderPlanoResumo(wizard.plano);
      atualizarContextoLateral();
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO DO WIZARD
    // --------------------------------------------------------
    els.wizardVoltar?.addEventListener("click", () => {
      if (wizard.atual > 0) {
        window.lioraIrParaSessao &&
          window.lioraIrParaSessao(wizard.atual - 1, false);
      }
    });

    els.wizardProxima?.addEventListener("click", () => {
      const sessao = wizard.sessoes[wizard.atual];

      if (sessao && window.lioraEstudos) {
        if (window.lioraModoRevisao) {
          if (window.lioraEstudos.marcarRevisada) {
            window.lioraEstudos.marcarRevisada(sessao.id);
          }
          if (window.lioraEstudos.agendarRevisao) {
            window.lioraEstudos.agendarRevisao(sessao.id);
          }
          window.dispatchEvent(new Event("liora:review-updated"));
        } else {
          if (window.lioraEstudos.registrarProgresso && sessao.id) {
            window.lioraEstudos.registrarProgresso(sessao.id);
          }
          window.dispatchEvent(new Event("liora:plan-updated"));
        }
      }

      if (wizard.atual < wizard.sessoes.length - 1) {
        window.lioraIrParaSessao &&
          window.lioraIrParaSessao(wizard.atual + 1, false);
      } else {
        atualizarStatus(
          wizard.origem === "upload" ? "upload" : "tema",
          "🎉 Tema concluído!",
          100
        );

        if (window.lioraEstudos?.finalizarPlano) {
          window.lioraEstudos.finalizarPlano(wizard.tema);
        }
      }
    });

    els.wizardRevisar?.addEventListener("click", () => {
      try {
        const s = wizard.sessoes[wizard.atual];
        if (!s?.id) return;

        if (window.lioraEstudos?.marcarRevisada) {
          window.lioraEstudos.marcarRevisada(s.id);
        }

        if (els.wizardQuizFeedback) {
          els.wizardQuizFeedback.textContent = "🔁 Revisada!";
          els.wizardQuizFeedback.style.color = "var(--brand)";
          els.wizardQuizFeedback.style.opacity = 1;
        }

        renderPlanoResumo(wizard.plano);
      } catch (e) {
        console.warn("⚠️ Erro ao revisar sessão:", e);
      }
    });

    // --------------------------------------------------------
    // 🔥 GERAÇÃO DO PLANO POR TEMA — /api/gerarPlano.js
    // --------------------------------------------------------
    async function lioraGerarPlanoTema({ tema, nivel, sessoes }) {
      try {
        const resp = await fetch("/api/gerarPlano.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tema, nivel, sessoes }),
        });

        const data = await resp.json();

        if (!data || !data.plano) {
          throw new Error("Resposta inválida da IA");
        }

        let parsed;
        try {
          parsed = JSON.parse(data.plano);
        } catch (e) {
          console.error("❌ Erro ao parsear JSON do plano:", e, data.plano);
          throw new Error("Falha ao interpretar o plano");
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Plano vazio ou malformado");
        }

        return parsed;
      } catch (err) {
        console.error("❌ Erro ao gerar plano:", err);
        throw err;
      }
    }

    function lioraSalvarEExibirPlano(sessoes) {
      try {
        localStorage.setItem("liora-plano-tema", JSON.stringify(sessoes));
      } catch (e) {
        console.warn("⚠️ Não foi possível salvar liora-plano-tema", e);
      }

      const painel = document.getElementById("painel-tema-result");
      if (!painel) return;

      painel.innerHTML = "";

      sessoes.forEach((sessao, idx) => {
        const div = document.createElement("div");
        div.className = "liora-sessao-card";

        div.innerHTML = `
          <h3>Sessão ${sessao.numero || idx + 1} — ${sessao.titulo || ""}</h3>
          ${
            sessao.duracao
              ? `<p><strong>Duração:</strong> ${sessao.duracao}</p>`
              : ""
          }
        `;

        painel.appendChild(div);
      });
    }

    els.btnGerar?.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      const sessoes = 6;

      if (!tema) {
        window.lioraError.show("Digite um tema.");
        return;
      }

      try {
        window.lioraLoading.show("Gerando plano...");
        atualizarStatus("tema", "Chamando IA...", 20);

        const parsed = await lioraGerarPlanoTema({ tema, nivel, sessoes });

        atualizarStatus("tema", "Construindo sessões...", 60);

        const sessoesNorm = await Promise.all(
          parsed.map(async (s, i) => {
            const sessaoBase = {
              id: `S${i + 1}`,
              ordem: i + 1,
              ...s,
            };
            return await reforcarSessaoSeNecessario(sessaoBase, tema);
          })
        );

        wizard = {
          tema,
          nivel,
          origem: "tema",
          pdfNome: null,
          plano: sessoesNorm.map((s) => ({
            id: s.id,
            ordem: s.ordem,
            titulo: s.titulo,
            objetivo: s.objetivos?.[0] || s.objetivo || "",
          })),
          sessoes: sessoesNorm,
          atual: 0,
        };

        lioraSalvarEExibirPlano(sessoesNorm);
        renderPlanoResumo(wizard.plano);
        renderWizard();
        saveProgress();

        if (window.lioraEstudos?.definirPlano) {
          window.lioraEstudos.definirPlano({
            tema: wizard.tema,
            origem: "tema",
            sessoes: wizard.sessoes,
          });
        }

        window.lioraLoading.hide();
        atualizarStatus("tema", "Plano gerado!", 100);
      } catch (err) {
        console.error(err);
        window.lioraLoading.hide();
        window.lioraError.show("Erro ao gerar plano por tema.");
      }
    });

    // --------------------------------------------------------
    // 🔥 GERAÇÃO DO PLANO POR UPLOAD DE PDF
    // --------------------------------------------------------
    els.btnGerarUpload?.addEventListener("click", async () => {
      const file = els.inpFile?.files?.[0];
      if (!file) {
        window.lioraError.show("Envie um PDF primeiro.");
        return;
      }

      try {
        window.lioraLoading.show("Lendo PDF...");
        atualizarStatus("upload", "Extraindo conteúdo...", 10);

        const rawBlocks = await window.lioraPDFExtractor.extract(file);
        if (!rawBlocks || !rawBlocks.length)
          throw new Error("PDF sem conteúdo.");

        atualizarStatus("upload", "Organizando conteúdo...", 30);

        const estrutura = window.lioraPDFStructure.fromBlocks(rawBlocks);

        let outlineRaw;
        try {
          outlineRaw = await window.lioraOutlineGenerator.gerar(estrutura);
        } catch (e) {
          console.error("❌ Erro ao gerar outline:", e);
          throw new Error("Erro ao gerar tópicos a partir do PDF.");
        }

        const topicos = extrairTopicosDoOutline(outlineRaw);

        if (!topicos.length) {
          console.error("Outline sem tópicos utilizáveis:", outlineRaw);
          throw new Error("Não foi possível identificar tópicos.");
        }

        atualizarStatus("upload", "Gerando sessões com IA...", 55);

        const system = `
Você é a IA da Liora e deve transformar tópicos em sessões de estudo.
Retorne APENAS JSON válido como:
{
  "tema": "",
  "sessoes": [
    {
      "titulo": "",
      "objetivo": "",
      "conteudo": {
        "introducao": "",
        "conceitos": [],
        "exemplos": [],
        "aplicacoes": [],
        "resumoRapido": []
      },
      "ativacao": [],
      "quiz": {
        "pergunta": "",
        "alternativas": [],
        "corretaIndex": 0,
        "explicacao": ""
      },
      "flashcards": [],
      "mindmap": ""
    }
  ]
}
`;

        const user = `
TÓPICOS EXTRAÍDOS DO PDF:
${topicos.join("\n")}

Gere sessões coerentes e completas, em português claro,
com boa didática, exemplos práticos e foco em aplicação real dos conceitos.
`;

        const rawOutput = await callLLM(system, user);
        const parsed = safeJsonParse(rawOutput);

        atualizarStatus("upload", "Finalizando...", 80);

        const sessoesNorm = (parsed.sessoes || []).map((s, i) => ({
          id: `S${i + 1}`,
          ordem: i + 1,
          progresso: 0,
          ...s,
        }));

        if (!sessoesNorm.length) {
          throw new Error("A IA não retornou sessões válidas a partir do PDF.");
        }

        const baseTema = parsed.tema || file.name.replace(/\.pdf$/i, "");

        wizard = {
          tema: baseTema,
          nivel: "PDF",
          origem: "upload",
          pdfNome: file.name, // 👈 guarda nome real do arquivo
          plano: sessoesNorm.map((s) => ({
            id: s.id,
            ordem: s.ordem,
            titulo: s.titulo,
            objetivo: s.objetivo,
          })),
          sessoes: sessoesNorm,
          atual: 0,
        };

        renderPlanoResumo(wizard.plano);
        renderWizard();
        // contexto lateral agora é tratado pelo atualizarContextoLateral()
        saveProgress();

        if (window.lioraEstudos?.definirPlano) {
          window.lioraEstudos.definirPlano({
            tema: wizard.tema,
            origem: "upload",
            sessoes: wizard.sessoes,
          });
        }

        atualizarStatus("upload", "Plano gerado!", 100);
        window.lioraLoading.hide();
      } catch (e) {
        console.error(e);
        window.lioraLoading.hide();
        window.lioraError.show("Erro ao gerar plano a partir do PDF.");
      }
    });

    // ======================================================
    // ⭐ RECONSTRUIR WIZARD A PARTIR DO PLANO ATIVO (Study Manager)
    // ======================================================
    function setWizardFromPlanoInterno(plano, startIndex) {
      try {
        if (!plano || !Array.isArray(plano.sessoes) || plano.sessoes.length === 0) {
          console.error("⚠️ setWizardFromPlanoInterno: plano inválido", plano);
          return false;
        }

        const idxSan = Math.max(
          0,
          Math.min(
            Number(startIndex) || 0,
            plano.sessoes.length - 1
          )
        );

        wizard = {
          tema: plano.tema || "Meu Estudo",
          nivel: plano.nivel || "tema",
          origem: plano.origem || "tema",
          pdfNome: null, // planos vindos do Study Manager ainda não carregam nome de arquivo
          sessoes: plano.sessoes.map((s, i) => ({
            id: s.id || `S${i + 1}`,
            ordem: s.ordem || i + 1,
            titulo: s.titulo || `Sessão ${i + 1}`,
            objetivo: s.objetivo || "",
            conteudo: s.conteudo || {},
            analogias: s.analogias || [],
            ativacao: s.ativacao || [],
            quiz: s.quiz || {},
            flashcards: s.flashcards || [],
            mindmap: s.mindmap || s.mapaMental || "",
            progresso: s.progresso || 0,
            forca: s.forca || "media",
          })),
          plano: plano.sessoes.map((s, i) => ({
            id: s.id || `S${i + 1}`,
            ordem: s.ordem || i + 1,
            titulo: s.titulo || `Sessão ${i + 1}`,
            objetivo: s.objetivo || "",
          })),
          atual: idxSan,
        };

        console.log("🔄 Wizard reconstruído a partir do plano ativo:", wizard);

        renderPlanoResumo(wizard.plano);
        renderWizard();
        saveProgress();

        return true;
      } catch (e) {
        console.error("❌ Erro em setWizardFromPlanoInterno:", e);
        return false;
      }
    }

    window.lioraSetWizardFromPlano = function (plano, startIndex) {
      return setWizardFromPlanoInterno(plano, startIndex);
    };

    // --------------------------------------------------------
    // ⭐ JUMP-TO-SESSION ÚNICO (Continue Study + cards + revisão)
    // --------------------------------------------------------
    window.lioraIrParaSessao = function (index, isReview = false) {
      try {
        if (!wizard?.sessoes || !wizard.sessoes.length) {
          if (window.lioraEstudos?.getPlanoAtivo) {
            const planoAtivo = window.lioraEstudos.getPlanoAtivo();
            if (!planoAtivo || !planoAtivo.sessoes?.length) {
              console.warn("⚠️ lioraIrParaSessao: sem plano ativo no Study Manager.");
              return;
            }
            setWizardFromPlanoInterno(planoAtivo, index);
          } else {
            console.warn("⚠️ lioraIrParaSessao: wizard vazio e Study Manager indisponível.");
            return;
          }
        }

        if (!wizard?.sessoes || !wizard.sessoes.length) {
          console.warn("⚠️ lioraIrParaSessao: wizard continua vazio após reconstrução.");
          return;
        }

        const total = wizard.sessoes.length;
        index = Math.max(0, Math.min(Number(index) || 0, total - 1));

        wizard.atual = index;
        window.lioraModoRevisao = !!isReview;

        const sessao = wizard.sessoes[wizard.atual];

        if (window.lioraEstudos && sessao?.id) {
          if (window.lioraModoRevisao && window.lioraEstudos.registrarRevisao) {
            window.lioraEstudos.registrarRevisao(sessao.id);
          } else if (window.lioraEstudos.registrarAbertura) {
            window.lioraEstudos.registrarAbertura(sessao.id);
          }
        }

        renderWizard();
        saveProgress();

        const cards = document.querySelectorAll(".liora-card-topico");
        cards.forEach((c) => c.classList.remove("active"));
        if (cards[index]) {
          cards[index].classList.add("active");
          setTimeout(() => {
            cards[index]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 80);
        }

        const cont = document.getElementById("liora-sessoes");
        if (cont) {
          window.scrollTo({
            top: cont.offsetTop - 20,
            behavior: "smooth",
          });
        }
      } catch (e) {
        console.error("❌ Erro no jump de sessão:", e);
      }
    };

    window.addEventListener("liora:review-updated", () => {
      try {
        renderPlanoResumo(wizard.plano);
        renderWizard();
      } catch (e) {
        console.warn("⚠️ Erro ao atualizar tela após revisão:", e);
      }
    });

    // --------------------------------------------------------
    // FIM DO CORE
    // --------------------------------------------------------
    console.log("🟢 Liora Core v77-FREEMIUM-A4 totalmente carregado.");
  });
})();
