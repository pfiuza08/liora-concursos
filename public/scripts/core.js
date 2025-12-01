// ==========================================================
// 🧠 LIORA — CORE v74-C8-PREMIUM-FULL
// ----------------------------------------------------------
// Inclui:
// ✔ Geração por Tema (/api/gerarPlano.js)
// ✔ Geração por PDF (Modelo D)
// ✔ Wizard Premium completo (fade, UX, quiz, flashcards)
// ✔ Tema Claro/Escuro
// ✔ Study Manager + Revisões
// ✔ Jump automático para sessão
// ✔ Normalização de sessões
// ✔ Renderização Premium do Conteúdo (C8)
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v74-C8...");

  document.addEventListener("DOMContentLoaded", () => {

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
        '<p class="text-sm text-[var(--muted)]">Gere um plano de estudo (por tema ou PDF) para ver as sessões aqui.</p>';
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
      origem: "tema",
    };

    window.lioraModoRevisao = false;

    const key = (tema, nivel) =>
      `liora:wizard:${(tema || "").toLowerCase()}::${(nivel || "").toLowerCase()}`;

    const saveProgress = () => {
      if (!wizard.tema || !wizard.nivel) return;
      try {
        localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
      } catch {}
    };

    function safeJsonParse(raw) {
      if (!raw || typeof raw !== "string") throw new Error("JSON inválido");

      const block =
        raw.match(/```json([\s\S]*?)```/i) ||
        raw.match(/```([\s\S]*?)```/i);

      if (block) raw = block[1];

      const first = raw.search(/[\{\[]/);
      const last =
        Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));

      raw = raw.slice(first, last + 1);

      return JSON.parse(raw);
    }

    async function callLLM(system, user) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user }),
      });

      const json = await res.json();
      if (!json.output) throw new Error("IA retornou vazio");
      return json.output;
    }

    // --------------------------------------------------------
    // 🌗 TEMA LIGHT / DARK
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
        const newTheme =
          document.documentElement.classList.contains("light")
            ? "dark"
            : "light";
        apply(newTheme);
      });
    })();

    // --------------------------------------------------------
    // 🔶 PREMIUM — renderConteudoPremium
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
            <p>${conteudo.introducao}</p>
          </div>
        `;
      }

      // Conceitos principais
      if (conteudo.conceitos?.length) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Conceitos principais</h6>
            <ul class="liora-lista">
              ${conteudo.conceitos.map(c => `<li>• ${c}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      // Exemplos
      if (conteudo.exemplos?.length) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Exemplos práticos</h6>
            <ul class="liora-lista">
              ${conteudo.exemplos.map(e => `<li>• ${e}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      // Aplicações
      if (conteudo.aplicacoes?.length) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Aplicações em prova / prática</h6>
            <ul class="liora-lista">
              ${conteudo.aplicacoes.map(a => `<li>• ${a}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      // Resumo rápido
      if (conteudo.resumoRapido?.length) {
        el.innerHTML += `
          <div class="liora-bloco">
            <h6 class="liora-conceito-subtitulo">Resumo rápido</h6>
            <ul class="liora-lista">
              ${conteudo.resumoRapido.map(r => `<li>• ${r}</li>`).join("")}
            </ul>
          </div>
        `;
      }
    }
    // --------------------------------------------------------
    // EXTRAÇÃO DE TÓPICOS
    // --------------------------------------------------------
    function extrairTopicosDoOutline(outlineRaw) {
      let topicos = [];

      if (!outlineRaw) return [];

      if (Array.isArray(outlineRaw)) {
        if (typeof outlineRaw[0] === "string") topicos = outlineRaw;
        else if (outlineRaw[0]?.titulo) topicos = outlineRaw.map(t => t.titulo);
      }

      if (Array.isArray(outlineRaw.topicos)) {
        const arr = outlineRaw.topicos;
        if (typeof arr[0] === "string") topicos = arr;
        else if (arr[0]?.titulo) topicos = arr.map(t => t.titulo);
      }

      if (Array.isArray(outlineRaw.outlineUnificado)) {
        const arr = outlineRaw.outlineUnificado;
        if (typeof arr[0] === "string") topicos = arr;
        else if (arr[0]?.titulo) topicos = arr.map(t => t.titulo);
      }

      return topicos
        .map(t => String(t).trim())
        .filter(Boolean);
    }

    // --------------------------------------------------------
    // MAPA MENTAL (melhorado)
    // --------------------------------------------------------
    function construirMapaMental(sessao) {
      if (!sessao) return "";
      const titulo = sessao.titulo || "Sessão";

      const mapa = sessao.mindmap || sessao.mapaMental;
      if (typeof mapa === "string" && mapa.trim()) {
        return mapa;
      }

      // fallback estruturado
      const c = sessao.conteudo || {};
      let out = `${titulo}\n`;

      if (c.introducao) out += `├─ Introdução\n`;
      if (c.conceitos?.length) {
        out += "├─ Conceitos\n";
        c.conceitos.forEach(x => out += `│   ├─ ${x}\n`);
      }
      if (c.exemplos?.length) {
        out += "├─ Exemplos\n";
        c.exemplos.forEach(x => out += `│   ├─ ${x}\n`);
      }
      if (c.aplicacoes?.length) {
        out += "├─ Aplicações\n";
        c.aplicacoes.forEach(x => out += `│   ├─ ${x}\n`);
      }
      if (c.resumoRapido?.length) {
        out += "└─ Resumo rápido\n";
        c.resumoRapido.forEach(x => out += `    ├─ ${x}\n`);
      }

      return out;
    }

    // --------------------------------------------------------
    // RESUMO DO PLANO (sidebar)
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
        div.dataset.index = index;

        div.textContent = p.titulo;

        div.addEventListener("click", () => {
          window.lioraIrParaSessao(index, false);
        });

        els.plano.appendChild(div);
      });

      const cards = els.plano.querySelectorAll(".liora-card-topico");
      cards.forEach(c => c.classList.remove("active"));
      if (cards[wizard.atual]) cards[wizard.atual].classList.add("active");
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO PRINCIPAL DO WIZARD PREMIUM (C8)
    // --------------------------------------------------------
    function renderWizard() {
      if (!els.wizardContainer) return;

      if (!wizard.sessoes?.length) {
        els.wizardContainer.classList.add("hidden");
        return;
      }

      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardContainer.classList.remove("hidden");

      els.wizardTema.textContent = wizard.tema || "";
      els.wizardTitulo.textContent = s.titulo || "";
      els.wizardObjetivo.textContent = s.objetivo || "";

      // CONTEÚDO PREMIUM
      renderConteudoPremium(s.conteudo);

      // ANALOGIAS
      els.wizardAnalogias.innerHTML =
        Array.isArray(s.analogias) && s.analogias.length
          ? s.analogias.map(a => `<p>• ${a}</p>`).join("")
          : "<p class='liora-muted'>Nenhuma analogia disponível.</p>";

      // ATIVAÇÃO
      els.wizardAtivacao.innerHTML =
        Array.isArray(s.ativacao) && s.ativacao.length
          ? s.ativacao.map(a => `<li>${a}</li>`).join("")
          : "<p class='liora-muted'>Nenhuma pergunta de ativação.</p>";

      // QUIZ
      renderQuizPremium(s.quiz);

      // FLASHCARDS
      renderFlashcardsPremium(s.flashcards);

      // MAPA MENTAL
      const mapa = construirMapaMental(s);
      els.wizardMapa.textContent = mapa;

      // Sidebar
      renderPlanoResumo(wizard.plano);
    }

    // --------------------------------------------------------
    // QUIZ PREMIUM
    // --------------------------------------------------------
    function renderQuizPremium(quiz) {
      els.wizardQuiz.innerHTML = "";
      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      if (!quiz?.pergunta) {
        els.wizardQuiz.innerHTML =
          "<p class='liora-muted'>Nenhum quiz disponível.</p>";
        return;
      }

      // pergunta
      const p = document.createElement("p");
      p.className = "liora-quiz-question";
      p.textContent = quiz.pergunta;
      els.wizardQuiz.appendChild(p);

      const alternativas = (quiz.alternativas || []).map((a, i) => ({
        texto: String(a).trim(),
        correta: i === Number(quiz.corretaIndex),
      }));

      if (!alternativas.some(a => a.correta) && alternativas.length) {
        alternativas[0].correta = true;
      }

      alternativas.forEach((alt, idx) => {
        const opt = document.createElement("div");
        opt.className = "liora-quiz-option";
        opt.dataset.index = idx;

        opt.innerHTML = `
          <input type="radio" name="quiz-${wizard.atual}" value="${idx}">
          <span class="liora-quiz-option-text">${alt.texto}</span>
          <span class="liora-quiz-dot"></span>
        `;

        opt.addEventListener("click", () => {
          els.wizardQuiz.querySelectorAll(".liora-quiz-option")
            .forEach(o => o.classList.remove("selected", "correct", "incorrect"));

          opt.classList.add("selected");

          const input = opt.querySelector("input");
          if (input) input.checked = true;

          setTimeout(() => {
            if (alt.correta) {
              opt.classList.add("correct");
              els.wizardQuizFeedback.textContent =
                `✅ Correto! ${quiz.explicacao || ""}`;
              els.wizardQuizFeedback.style.color = "var(--brand)";
            } else {
              opt.classList.add("incorrect");
              els.wizardQuizFeedback.textContent =
                "❌ Não é essa.";
              els.wizardQuizFeedback.style.color = "var(--muted)";
            }
            els.wizardQuizFeedback.style.opacity = 1;
          }, 150);
        });

        els.wizardQuiz.appendChild(opt);
      });
    }

    // --------------------------------------------------------
    // FLASHCARDS PREMIUM
    // --------------------------------------------------------
    function renderFlashcardsPremium(cards) {
      if (!Array.isArray(cards) || !cards.length) {
        els.wizardFlashcards.innerHTML =
          "<p class='liora-muted'>Nenhum flashcard gerado.</p>";
        return;
      }

      els.wizardFlashcards.innerHTML = `
        <div class="liora-flashcards-grid">
          ${cards
            .map(
              f => `
            <article class="liora-flashcard">
              <div class="liora-flashcard-front">
                <span class="liora-flashcard-label">PERGUNTA</span>
                <p>${f.q}</p>
              </div>
              <div class="liora-flashcard-back">
                <span class="liora-flashcard-label">RESPOSTA</span>
                <p>${f.a}</p>
              </div>
            </article>
          `
            )
            .join("")}
        </div>
      `;
    }

    // --------------------------------------------------------
    // BOTÕES DO WIZARD
    // --------------------------------------------------------
    els.wizardVoltar.addEventListener("click", () => {
      if (wizard.atual > 0) window.lioraIrParaSessao(wizard.atual - 1, false);
    });

    els.wizardProxima.addEventListener("click", () => {
      if (wizard.atual < wizard.sessoes.length - 1) {
        window.lioraIrParaSessao(wizard.atual + 1, false);
      } else {
        els.status.textContent = "🎉 Tema concluído!";
      }
    });

    els.wizardRevisar.addEventListener("click", () => {
      els.wizardQuizFeedback.textContent = "🔁 Revisada!";
      els.wizardQuizFeedback.style.color = "var(--brand)";
      els.wizardQuizFeedback.style.opacity = 1;
    });

    // --------------------------------------------------------
    // JUMP PARA SESSÃO
    // --------------------------------------------------------
    window.lioraIrParaSessao = function (index) {
      if (!wizard.sessoes?.length) return;

      index = Math.max(0, Math.min(index, wizard.sessoes.length - 1));
      wizard.atual = index;

      renderWizard();
      saveProgress();

      const cards = document.querySelectorAll(".liora-card-topico");
      cards.forEach(c => c.classList.remove("active"));
      if (cards[index]) cards[index].classList.add("active");
    };
    // --------------------------------------------------------
    // GERAÇÃO DO PLANO — TEMA
    // --------------------------------------------------------
    async function lioraGerarPlanoTema({ tema, nivel, sessoes }) {
      const resp = await fetch("/api/gerarPlano.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, nivel, sessoes })
      });

      const data = await resp.json();
      if (!data.plano) throw new Error("Plano inválido da IA");

      return JSON.parse(data.plano);
    }

    els.btnGerar.addEventListener("click", async () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      const sessoes = 6;

      if (!tema) {
        window.lioraError.show("Digite um tema.");
        return;
      }

      try {
        window.lioraLoading.show("Gerando plano...");
        els.status.textContent = "Chamando IA…";

        const parsed = await lioraGerarPlanoTema({ tema, nivel, sessoes });

        const sessoesNorm = parsed.map((s, i) => ({
          id: `S${i + 1}`,
          ordem: i + 1,
          ...s,
        }));

        wizard = {
          tema,
          nivel,
          origem: "tema",
          sessoes: sessoesNorm,
          plano: sessoesNorm.map(s => ({
            id: s.id,
            ordem: s.ordem,
            titulo: s.titulo
          })),
          atual: 0,
        };

        renderPlanoResumo(wizard.plano);
        renderWizard();
        saveProgress();

        els.status.textContent = "Plano gerado!";
        window.lioraLoading.hide();

      } catch (e) {
        console.error(e);
        window.lioraLoading.hide();
        window.lioraError.show("Erro ao gerar plano.");
      }
    });

    // --------------------------------------------------------
    // GERAÇÃO DO PLANO — PDF
    // --------------------------------------------------------
    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files[0];
      if (!file) {
        window.lioraError.show("Envie um PDF primeiro.");
        return;
      }

      try {
        window.lioraLoading.show("Lendo PDF…");
        els.statusUpload.textContent = "Extraindo…";

        const rawBlocks = await window.lioraPDFExtractor.extract(file);
        const estrutura = window.lioraPDFStructure.fromBlocks(rawBlocks);

        let outlineRaw = await window.lioraOutlineGenerator.gerar(estrutura);
        const topicos = extrairTopicosDoOutline(outlineRaw);

        els.statusUpload.textContent = "Gerando sessões…";

        const system = `
          Você é a IA da Liora e deve transformar tópicos em sessões de estudo.
          Retorne APENAS JSON válido no formato:
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
          TÓPICOS DO PDF:
          ${topicos.join("\n")}

          Gere sessões completas, claras, com didática e foco em aplicação prática.
        `;

        const raw = await callLLM(system, user);
        const parsed = safeJsonParse(raw);

        const sessoesNorm = parsed.sessoes.map((s, i) => ({
          id: `S${i + 1}`,
          ordem: i + 1,
          ...s,
        }));

        wizard = {
          tema: parsed.tema || file.name,
          nivel: "PDF",
          origem: "upload",
          sessoes: sessoesNorm,
          plano: sessoesNorm.map(s => ({
            id: s.id,
            ordem: s.ordem,
            titulo: s.titulo,
          })),
          atual: 0,
        };

        renderPlanoResumo(wizard.plano);
        renderWizard();
        saveProgress();

        els.statusUpload.textContent = "Plano gerado!";
        window.lioraLoading.hide();

      } catch (e) {
        console.error(e);
        window.lioraLoading.hide();
        window.lioraError.show("Erro ao gerar plano por PDF.");
      }
    });

    // --------------------------------------------------------
    // FINAL
    // --------------------------------------------------------
    console.log("🟢 Liora Core v74-C8 — Premium FULL carregado.");
  });
})();
