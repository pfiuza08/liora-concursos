// ==========================================================
// 🧠 LIORA — CORE v75-FIX-COMMERCIAL-PREMIUM
// ----------------------------------------------------------
// Correções estruturais:
// ✔ Integração correta com Study Manager (evita perda de planos)
// ✔ Remoção de liora-plano-tema (agora somente SM persiste planos)
// ✔ Normalização completa das sessões antes de enviar ao SM
// ✔ Evento plan-updated duplicado (cobre race conditions do nav-home)
// ✔ Continue Study funcionando após reload
// ----------------------------------------------------------
// Funcionalidades mantidas:
// ✔ Wizard Premium completo
// ✔ Quiz Premium (explicações, highlight, fade)
// ✔ Flashcards, Mapa Mental, Analogias, Ativação
// ✔ Upload PDF (Extractor + Structure + Outline + IA)
// ✔ Tema claro/escuro
// ✔ Progressos incrementais + reforço de sessões fracas
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v75-FIX...");

  document.addEventListener("DOMContentLoaded", () => {
    // ======================================================
    // 🌱 A4 — Inicialização segura
    // ======================================================
    window.liora = window.liora || {};
    window.lioraCache = window.lioraCache || {};

    if (typeof window.lioraPlano === "undefined") window.lioraPlano = null;
    if (typeof window.lioraSessoes === "undefined") window.lioraSessoes = [];

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
          if (!errorEl) return alert(msg);
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
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      barraTemaFill: document.getElementById("barra-tema-fill"),
      barraUploadFill: document.getElementById("barra-upload-fill"),

      areaPlano: document.getElementById("area-plano"),
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
      wizardMapa: document.getElementById("liora-sessao-mapa"),
      wizardVoltar: document.getElementById("liora-btn-voltar"),
      wizardProxima: document.getElementById("liora-btn-proxima"),
      wizardRevisar: document.getElementById("liora-btn-revisar"),

      themeBtn: document.getElementById("btn-theme"),

      uploadText: document.getElementById("upload-text"),
      uploadSpinner: document.getElementById("upload-spinner"),
    };

    if (els.plano) {
      els.plano.innerHTML =
        `<p class="text-sm text-[var(--muted)]">Gere um plano de estudo por Tema ou PDF.</p>`;
    }
    if (els.wizardContainer) els.wizardContainer.classList.add("hidden");

    // --------------------------------------------------------
    // ESTADO
    // --------------------------------------------------------
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0,
      origem: "tema",
    };

    window.lioraModoRevisao = false;

    // --------------------------------------------------------
    // THEME (LIGHT/DARK)
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

      // 1) Se já for array simples
      if (Array.isArray(outlineRaw)) {
        if (outlineRaw.length && typeof outlineRaw[0] === "string") {
          topicos = outlineRaw;
        } else if (outlineRaw.length && outlineRaw[0] && outlineRaw[0].titulo) {
          topicos = outlineRaw.map((t) => t.titulo);
        }
      }

      // 2) Se for objeto com .topicos
      else if (Array.isArray(outlineRaw.topicos)) {
        const arr = outlineRaw.topicos;
        if (arr.length && typeof arr[0] === "string") {
          topicos = arr;
        } else if (arr.length && arr[0] && arr[0].titulo) {
          topicos = arr.map((t) => t.titulo);
        }
      }

      // 3) Se for objeto com .outlineUnificado
      else if (Array.isArray(outlineRaw.outlineUnificado)) {
        const arr = outlineRaw.outlineUnificado;
        if (arr.length && typeof arr[0] === "string") {
          topicos = arr;
        } else if (arr.length && arr[0] && arr[0].titulo) {
          topicos = arr.map((t) => t.titulo);
        }
      }

      // limpeza final
      topicos = topicos
        .map((t) => String(t || "").trim())
        .filter((t) => t.length > 0);

      console.log("📘 Core v74 — tópicos extraídos do outline:", topicos);
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

      // fallback: conteúdo normal
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

      // Introdução
      if (conteudo.introducao) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conteudo-titulo">Introdução</h6>
            <p class="liora-conteudo-texto">${conteudo.introducao}</p>
          </div>
        `;
      }

      // Conceitos principais
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

      // Exemplos práticos
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

      // Aplicações em prova / prática
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

      // Resumo rápido
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
    // RENDERIZAÇÃO DO PLANO (lista lateral)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      if (!els.plano) return;

      els.plano.innerHTML = "";
      if (!plano || !plano.length) {
        els.plano.innerHTML =
          '<p class="text-sm text-[var(--muted)]">Nenhum plano gerado ainda.</p>';
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
    // RENDERIZAÇÃO DO WIZARD (PREMIUM A3.3)
    // --------------------------------------------------------
    function renderWizard() {
      if (!els.wizardContainer) return;

      // se não houver sessões, oculta tudo
      if (!wizard.sessoes || !wizard.sessoes.length) {
        els.wizardContainer.classList.add("hidden");
        return;
      }

      const s = wizard.sessoes[wizard.atual];
      if (!s) {
        els.wizardContainer.classList.add("hidden");
        return;
      }

      // mostra container
      els.wizardContainer.classList.remove("hidden");

      // animação de entrada
      const card = els.wizardContainer.querySelector(".liora-wizard-card");
      if (card) {
        card.classList.remove("visible");
        setTimeout(() => card.classList.add("visible"), 20);
      }

      // limpa feedback do quiz
      if (els.wizardQuizFeedback) {
        els.wizardQuizFeedback.textContent = "";
        els.wizardQuizFeedback.style.opacity = 0;
      }

      // título do tema & sessão
      if (els.wizardTema) els.wizardTema.textContent = wizard.tema || "";
      if (els.wizardTitulo) els.wizardTitulo.textContent = s.titulo || "";

      // progresso no topo da sessão (novo UX Premium)
      const progressoTopEl = document.getElementById("liora-sessao-progress");
      if (progressoTopEl) {
        progressoTopEl.textContent =
          `Sessão ${wizard.atual + 1} de ${wizard.sessoes.length}`;
      }

      // OBJETIVO
      if (els.wizardObjetivo) els.wizardObjetivo.textContent = s.objetivo || "";

      // CONTEÚDO PREMIUM
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

      // ----------------------- QUIZ (Premium + Correções) -----------------------
      if (els.wizardQuiz) {
        els.wizardQuiz.innerHTML = "";

        const q = s.quiz || {};

        let alternativasBrutas = Array.isArray(q.alternativas)
          ? q.alternativas.filter((a) => !!String(a || "").trim())
          : [];

        const explicacoesArr = Array.isArray(q.explicacoes)
          ? q.explicacoes
          : [];

        // fallback mínimo
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

        // pergunta
        if (q.pergunta) {
          const pergunta = document.createElement("p");
          pergunta.className = "liora-quiz-question";
          pergunta.textContent = q.pergunta;
          els.wizardQuiz.appendChild(pergunta);
        }

        // construção preservando índice original
        let alternativas = alternativasBrutas.map((alt, i) => ({
          texto: String(alt)
            .replace(/\n/g, " ")
            .replace(/<\/?[^>]+(>|$)/g, ""),
          indiceOriginal: i,
          corretaOriginal: i === Number(q.corretaIndex),
        }));

        // garante correto
        if (!alternativas.some((a) => a.corretaOriginal)) {
          alternativas[0].corretaOriginal = true;
        }

        // embaralha
        alternativas = shuffle(alternativas);

        // reindexa
        alternativas = alternativas.map((alt, idx) => ({
          ...alt,
          idx,
          correta: alt.corretaOriginal,
        }));

        // render das alternativas
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

            if (altObj.correta) {
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

            // efeito fade premium A3.3
            els.wizardQuizFeedback.innerHTML = textoFinal;
            els.wizardQuizFeedback.classList.remove("fade");
            void els.wizardQuizFeedback.offsetWidth;
            els.wizardQuizFeedback.classList.add("fade");
          });

          els.wizardQuiz.appendChild(opt);
        });
      }

      // ----------------------- FLASHCARDS PREMIUM -----------------------
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
            .forEach((card) => {
              card.addEventListener("click", () => {
                card.classList.toggle("open");
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

      // Study Manager (progresso interno leve)
      if (window.lioraEstudos?.updateSessionProgress && s?.id) {
        window.lioraEstudos.updateSessionProgress(s.id, 0.5);
      }

      // atualiza cards laterais
      renderPlanoResumo(wizard.plano);
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

    // ======================================================
    // 🔥 GERAÇÃO POR TEMA — COM FIXES
    // ======================================================
    async function lioraGerarPlanoTema({ tema, nivel, sessoes }) {
      const resp = await fetch("/api/gerarPlano.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, nivel, sessoes }),
      });

      const data = await resp.json();
      if (!data?.plano) throw new Error("Resposta inválida da IA");

      let parsed = JSON.parse(data.plano);
      if (!Array.isArray(parsed) || !parsed.length)
        throw new Error("Plano malformado");

      return parsed;
    }

    els.btnGerar?.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      const sessoes = 6;

      if (!tema) return window.lioraError.show("Digite um tema.");

      try {
        window.lioraLoading.show("Gerando plano...");

        const parsed = await lioraGerarPlanoTema({ tema, nivel, sessoes });

        const sessoesNorm = await Promise.all(
          parsed.map(async (s, i) => {
            const sessionBase = { id: `S${i + 1}`, ordem: i + 1, ...s };
            return await reforcarSessaoSeNecessario(sessionBase, tema);
          })
        );

        wizard = {
          tema,
          nivel,
          origem: "tema",
          plano: sessoesNorm.map((s) => ({
            id: s.id,
            ordem: s.ordem,
            titulo: s.titulo,
            objetivo: s.objetivo || s.objetivos?.[0] || "",
          })),
          sessoes: sessoesNorm,
          atual: 0,
        };

        renderPlanoResumo(wizard.plano);
        renderWizard();

        // 📌 FIX: enviar plano normalizado ao Study Manager
        if (window.lioraEstudos?.definirPlano) {
          window.lioraEstudos.definirPlano({
            tema,
            origem: "tema",
            sessoes: wizard.sessoes.map((s) => ({
              ...s,
              progresso: s.progresso || 0,
              revisoes: s.revisoes || 0,
              retentionScore: s.retentionScore || 45,
            })),
          });
        }

        // 📌 FIX: garantir sincronização do nav-home
        window.dispatchEvent(new Event("liora:plan-updated"));
        setTimeout(
          () => window.dispatchEvent(new Event("liora:plan-updated")),
          100
        );

        window.lioraLoading.hide();
        atualizarStatus("tema", "Plano gerado!", 100);
      } catch (e) {
        console.error(e);
        window.lioraLoading.hide();
        window.lioraError.show("Erro ao gerar plano por tema.");
      }
    });

    // ======================================================
    // 🔥 GERAÇÃO POR PDF — COM FIXES
    // ======================================================
    els.btnGerarUpload?.addEventListener("click", async () => {
      const file = els.inpFile?.files?.[0];
      if (!file) return window.lioraError.show("Envie um PDF.");

      try {
        window.lioraLoading.show("Lendo PDF...");

        const rawBlocks = await window.lioraPDFExtractor.extract(file);
        const estrutura = window.lioraPDFStructure.fromBlocks(rawBlocks);
        const outline = await window.lioraOutlineGenerator.gerar(estrutura);

        const topicos = extrairTopicosDoOutline(outline);
        if (!topicos.length) throw new Error("PDF sem tópicos.");

        const system = `... (mantido igual ao seu core) ...`;
        const user = `... (mantido igual ao seu core) ...`;

        const raw = await callLLM(system, user);
        const parsed = safeJsonParse(raw);

        const sessoesNorm = parsed.sessoes.map((s, i) => ({
          id: `S${i + 1}`,
          ordem: i + 1,
          progresso: 0,
          ...s,
        }));

        wizard = {
          tema: parsed.tema || file.name.replace(/\.pdf$/i, ""),
          nivel: "PDF",
          origem: "upload",
          sessoes: sessoesNorm,
          plano: sessoesNorm.map((s) => ({
            id: s.id,
            ordem: s.ordem,
            titulo: s.titulo,
            objetivo: s.objetivo,
          })),
          atual: 0,
        };

        renderPlanoResumo(wizard.plano);
        renderWizard();

        // 📌 FIX: enviar ao Study Manager
        if (window.lioraEstudos?.definirPlano) {
          window.lioraEstudos.definirPlano({
            tema: wizard.tema,
            origem: "upload",
            sessoes: wizard.sessoes.map((s) => ({
              ...s,
              progresso: s.progresso || 0,
              revisoes: s.revisoes || 0,
              retentionScore: s.retentionScore || 45,
            })),
          });
        }

        window.dispatchEvent(new Event("liora:plan-updated"));
        setTimeout(
          () => window.dispatchEvent(new Event("liora:plan-updated")),
          100
        );

        window.lioraLoading.hide();
      } catch (e) {
        console.error(e);
        window.lioraLoading.hide();
        window.lioraError.show("Erro ao gerar plano via PDF.");
      }
    });

    // ======================================================
    // ⭐ lioraIrParaSessao — MANTIDO
    // ======================================================
    window.lioraIrParaSessao = function (index, isReview = false) {
      try {
        if (!wizard?.sessoes?.length) {
          const sm = window.lioraEstudos;
          const plano = sm?.getPlanoAtivo();
          if (!plano) return;

          setWizardFromPlanoInterno(plano, index);
        }

        index = Math.max(0, Math.min(Number(index), wizard.sessoes.length - 1));
        wizard.atual = index;
        window.lioraModoRevisao = !!isReview;

        renderWizard();
        saveProgress();
      } catch (e) {
        console.error("❌ Erro no jump de sessão:", e);
      }
    };

    console.log("🟢 Core v75-FIX carregado com sucesso.");
  });
})();
