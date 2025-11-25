// ==========================================================
// 🧠 LIORA — CORE v70-COMMERCIAL-PREMIUM-DIA1
// - Adiciona:
//   ✔ Loading global (lioraLoading)
//   ✔ Erro global (lioraError)
//   ✔ Wizard Premium (fade e microinterações)
//   ✔ Tratamento padronizado de erros
//   ✔ Integração total com index.html + nav-home.js
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v70-COMMERCIAL-PREMIUM-DIA1...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // 🌟 UI PREMIUM: Loading Global
    // --------------------------------------------------------
    window.lioraLoading = {
      el: null,
      text: null,

      init() {
        if (this.el) return;

        const div = document.createElement("div");
        div.className = "liora-loading hidden";
        div.innerHTML = `
          <div class="liora-loading-card">
            <div class="liora-spinner"></div>
            <p id="liora-loading-text">Processando...</p>
          </div>
        `;
        document.body.appendChild(div);

        this.el = div;
        this.text = div.querySelector("#liora-loading-text");
      },

      show(msg = "Processando...") {
        this.init();
        if (this.text) this.text.textContent = msg;
        this.el.classList.remove("hidden");
      },

      hide() {
        if (this.el) this.el.classList.add("hidden");
      },
    };

    // --------------------------------------------------------
    // 🌟 UI PREMIUM: Erro Global
    // --------------------------------------------------------
    window.lioraError = {
      el: null,
      msgEl: null,

      init() {
        if (this.el) return;

        const div = document.createElement("div");
        div.className = "liora-error hidden";
        div.innerHTML = `
          <div class="liora-error-card">
            <div class="liora-error-icon">⚠️</div>
            <h3 class="liora-error-title">Ocorreu um erro</h3>
            <p class="liora-error-message" id="liora-error-msg">
              Algo inesperado aconteceu.
            </p>
            <div class="liora-error-actions">
              <button class="btn-primary" id="liora-error-ok">OK</button>
            </div>
          </div>
        `;
        document.body.appendChild(div);

        this.el = div;
        this.msgEl = div.querySelector("#liora-error-msg");

        div.querySelector("#liora-error-ok").onclick = () => {
          this.hide();
        };
      },

      show(msg = "Erro desconhecido") {
        this.init();
        this.msgEl.textContent = msg;
        this.el.classList.remove("hidden");
      },

      hide() {
        if (this.el) this.el.classList.add("hidden");
      },
    };
    // ==========================================================
    // ELEMENTOS DO CORE
    // ==========================================================
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
    };

    // mostra mensagem no plano
    if (els.plano) {
      els.plano.innerHTML =
        '<p class="text-sm text-[var(--muted)]">Gere um plano de estudo para ver as sessões.</p>';
    }

    // wizard começa oculto
    if (els.wizardContainer) els.wizardContainer.classList.add("hidden");


    // ==========================================================
    // ESTADO
    // ==========================================================
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0,
      origem: "tema",
    };

    const key = (tema, nivel) =>
      `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;

    const saveProgress = () => {
      if (!wizard.tema || !wizard.nivel) return;
      try {
        localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
      } catch (e) {
        console.warn("⚠️ Falha ao salvar progresso:", e);
      }
    };

    const loadProgress = (tema, nivel) => {
      try {
        return JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");
      } catch {
        return null;
      }
    };

    window.lioraWizardShouldShow = () =>
      wizard.sessoes && wizard.sessoes.length > 0;


    // ==========================================================
    // 🌗 TEMA (Dark / Light)
    // ==========================================================
    (function setupTheme() {
      const btn = document.getElementById("btn-theme");
      if (!btn) return;

      function applyTheme(th) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(th);
        document.body.classList.remove("light", "dark");
        document.body.classList.add(th);

        localStorage.setItem("liora-theme", th);
        btn.textContent = th === "light" ? "☀️" : "🌙";
      }

      applyTheme(localStorage.getItem("liora-theme") || "dark");

      btn.addEventListener("click", () => {
        const next = document.documentElement.classList.contains("light")
          ? "dark"
          : "light";
        applyTheme(next);
      });
    })();


    // ==========================================================
    // UTILS
    // ==========================================================
    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function safeJsonParse(raw) {
      if (!raw) throw new Error("JSON vazio");

      const block =
        raw.match(/```json([\s\S]*?)```/i) ||
        raw.match(/```([\s\S]*?)```/i);

      if (block) raw = block[1];

      const first = raw.search(/[\{\[]/);
      const last = Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));

      if (first !== -1 && last !== -1) {
        raw = raw.slice(first, last + 1);
      }

      return JSON.parse(raw);
    }

    async function callLLM(system, user) {
      try {
        const res = await fetch("/api/liora", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ system, user }),
        });

        const json = await res.json();
        if (!json.output) throw new Error("Resposta inesperada da IA");

        return json.output;
      } catch (e) {
        console.error("❌ callLLM ERRO:", e);
        throw e;
      }
    }


    // ==========================================================
    // RENDERIZAÇÃO PLANO + WIZARD PREMIUM
    // ==========================================================
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
        div.dataset.index = index;
        div.textContent = p.titulo;

        div.onclick = () => {
          document
            .querySelectorAll(".liora-card-topico")
            .forEach(x => x.classList.remove("active"));

          div.classList.add("active");
          wizard.atual = index;
          renderWizard();

          window.scrollTo({
            top: els.wizardContainer.offsetTop - 20,
            behavior: "smooth",
          });
        };

        els.plano.appendChild(div);
      });
    }


    // --------------------------------------------------------------
    // WIZARD PREMIUM — fade-in + microinterações
    // --------------------------------------------------------------
    function renderWizard() {
      if (!wizard.sessoes.length) {
        els.wizardContainer.classList.add("hidden");
        return;
      }

      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      els.wizardContainer.classList.remove("hidden");

      // fade premium
      const card = els.wizardContainer.querySelector(".liora-wizard-card");
      if (card) {
        card.classList.remove("visible");
        setTimeout(() => card.classList.add("visible"), 20);
      }

      els.wizardTema.textContent = wizard.tema;
      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;

      // conteúdo
      const c = s.conteudo || {};
      els.wizardConteudo.innerHTML = `
        ${c.introducao ? `<p>${c.introducao}</p>` : ""}
        ${Array.isArray(c.conceitos)
          ? `<h5>Conceitos</h5><ul>${c.conceitos
              .map(x => `<li>${x}</li>`)
              .join("")}</ul>`
          : ""}
      `;

      els.wizardAnalogias.innerHTML = (s.analogias || [])
        .map(a => `<p>${a}</p>`)
        .join("");

      els.wizardAtivacao.innerHTML = (s.ativacao || [])
        .map(q => `<li>${q}</li>`)
        .join("");

      // Quiz
      els.wizardQuizFeedback.style.opacity = 0;
      els.wizardQuiz.innerHTML = "";

      const q = s.quiz || {};
      if (q.pergunta) {
        const pergunta = document.createElement("p");
        pergunta.textContent = q.pergunta;
        els.wizardQuiz.appendChild(pergunta);
      }

      if (Array.isArray(q.alternativas)) {
        const alternativas = shuffle(
          q.alternativas.map((alt, i) => ({
            texto: alt,
            correta: i === q.corretaIndex,
          }))
        );

        alternativas.forEach((alt, i) => {
          const opt = document.createElement("label");
          opt.className = "liora-quiz-option";
          opt.innerHTML = `
            <input type="radio" name="quiz" value="${i}">
            <span class="liora-quiz-option-text">${alt.texto}</span>
          `;

          opt.onclick = () => {
            document
              .querySelectorAll(".liora-quiz-option")
              .forEach(x => x.classList.remove("selected"));
            opt.classList.add("selected");

            setTimeout(() => {
              els.wizardQuizFeedback.textContent = alt.correta
                ? `✅ Correto! ${q.explicacao || ""}`
                : "❌ Tente novamente.";

              els.wizardQuizFeedback.style.opacity = 1;
            }, 120);
          };

          els.wizardQuiz.appendChild(opt);
        });
      }

      // Flashcards
      els.wizardFlashcards.innerHTML = (s.flashcards || [])
        .map(fc => `<li><b>${fc.q}</b>: ${fc.a}</li>`)
        .join("");

      // Mapa mental
      els.wizardMapa.textContent =
        typeof s.mapaMental === "string"
          ? s.mapaMental
          : "Mapa mental gerado automaticamente.";

    }


    // ==========================================================
    // NAVEGAÇÃO DO WIZARD
    // ==========================================================
    els.wizardVoltar.onclick = () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
        saveProgress();
      }
    };

    els.wizardProxima.onclick = () => {
      if (wizard.atual < wizard.sessoes.length - 1) {
        wizard.atual++;
        renderWizard();
        saveProgress();
      } else {
        alert("🎉 Você concluiu este tema!");
      }
    };


    // ==========================================================
    // FLUXO POR TEMA (COM LOADING E ERRO GLOBAL)
    // ==========================================================
    async function fluxoTema(tema, nivel) {
      try {
        lioraLoading.show("Gerando plano por tema...");

        const cached = loadProgress(tema, nivel);
        if (cached) {
          wizard = cached;
          renderPlanoResumo(wizard.plano);
          renderWizard();
          lioraLoading.hide();
          return;
        }

        const plano = await callLLM(
          "Você é Liora, especialista em microlearning.",
          `Crie um plano de estudo em sessões para "${tema}" (nível ${nivel}).`
        );

        const lista = safeJsonParse(plano);

        wizard = {
          tema,
          nivel,
          atual: 0,
          origem: "tema",
          plano: lista.map((p, i) => ({
            titulo: p.nome || `Sessão ${i + 1}`,
          })),
          sessoes: [],
        };

        renderPlanoResumo(wizard.plano);

        // gerar sessões
        for (let i = 0; i < lista.length; i++) {
          const p = lista[i];

          const sRaw = await callLLM(
            "Você é Liora, gere apenas JSON válido.",
            `Crie a sessão ${p.numero} — ${p.nome} do tema "${tema}".`
          );

          const s = safeJsonParse(sRaw);
          wizard.sessoes.push(s);
          saveProgress();
        }

        renderWizard();
        lioraLoading.hide();

      } catch (err) {
        console.error(err);
        lioraLoading.hide();
        lioraError.show("Falha ao gerar o plano por tema.");
      }
    }


    // ==========================================================
    // FLUXO POR UPLOAD (COM LOADING E ERRO GLOBAL)
    // ==========================================================
    async function fluxoUpload(file, nivel) {
      try {
        lioraLoading.show("Lendo PDF...");

        const extrairFn =
          window.LioraPDFExtractor?.extrairBlocos ||
          window.LioraPDFExtractor?.extrairBlocosDoPDF;

        if (!extrairFn) throw new Error("Extractor não encontrado");

        const blocos = await extrairFn(file);
        const secoes = window.LioraPDF.construirSecoesAPartirDosBlocos(blocos);

        if (!secoes?.length) {
          throw new Error("Não foi possível identificar seções no PDF.");
        }

        lioraLoading.show("Gerando tópicos...");
        const outlines = await window.LioraOutline.gerarOutlinesPorSecao(secoes);
        const outlineUnificado = window.LioraOutline.unificarOutlines(outlines);

        lioraLoading.show("Gerando sessões...");
        const plano = await window.LioraOutline.gerarPlanoDeEstudo(outlineUnificado);

        wizard = {
          tema: file.name.replace(/\.pdf$/i, ""),
          nivel,
          atual: 0,
          origem: "upload",
          plano: plano.sessoes.map(s => ({ titulo: s.titulo })),
          sessoes: plano.sessoes,
        };

        renderPlanoResumo(wizard.plano);
        renderWizard();
        saveProgress();
        lioraLoading.hide();

      } catch (err) {
        console.error(err);
        lioraLoading.hide();
        lioraError.show("Erro ao gerar plano a partir do PDF.");
      }
    }


    // ==========================================================
    // BOTÕES
    // ==========================================================
    els.btnGerar.onclick = () => {
      const tema = els.inpTema.value.trim();
      if (!tema) return lioraError.show("Digite um tema para continuar.");
      fluxoTema(tema, els.selNivel.value);
    };

    els.btnGerarUpload.onclick = () => {
      const file = els.inpFile.files[0];
      if (!file) return lioraError.show("Selecione um arquivo PDF.");
      fluxoUpload(file, els.selNivel.value);
    };


    console.log("🟢 Liora Core Premium carregado.");
  });
})();
