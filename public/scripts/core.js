// ==========================================================
// 🧠 LIORA — CORE v74-COMMERCIAL-PREMIUM-STUDY-MANAGER
// ----------------------------------------------------------
// Inclui:
// ✔ Tema: plano + sessões completas (via /api/gerarPlano)
// ✔ Upload: Modelo D (outline + sessões via /api/liora)
// ✔ Wizard Premium (fade, microinterações, quiz bonito)
// ✔ Loading global / Erro global
// ✔ Barras de progresso
// ✔ Estudo Inteligente (Study Manager)
// ✔ Prefill de simulado
// ✔ Continue Study Engine (jump autom.) — lioraIrParaSessao()
// ✔ Salvamento incremental das sessões
// ✔ Normalização das sessões geradas (id, ordem)
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v74...");

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

    // modo revisão controlado globalmente
    window.lioraModoRevisao = false;

    const key = (tema, nivel) =>
      `liora:wizard:${(tema || "").toLowerCase()}::${(nivel || "").toLowerCase()}`;

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
    // 🧠 MEMÓRIA DE ESTUDOS
    // --------------------------------------------------------
    (function setupEstudosMemory() {
      const api = window.lioraEstudos;
      if (!api) return;
      // integração principal acontece nas chamadas definirPlano / registrarProgresso etc.
    })();

    // --------------------------------------------------------
    // PREFILL DO SIMULADO
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

      // marca ativo
      const cards = els.plano.querySelectorAll(".liora-card-topico");
      cards.forEach((c) => c.classList.remove("active"));
      if (cards[wizard.atual]) cards[wizard.atual].classList.add("active");
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO WIZARD (COM QUIZ FIX)
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

      // fade-in
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

      // Conteúdo
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
            <ul>${c.conceitos.map((x) => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">` : ""}

          ${Array.isArray(c.exemplos) && c.exemplos.length ? `
          <div class="liora-section">
            <h5>EXEMPLOS</h5>
            <ul>${c.exemplos.map((x) => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">` : ""}

          ${Array.isArray(c.aplicacoes) && c.aplicacoes.length ? `
          <div class="liora-section">
            <h5>APLICAÇÕES</h5>
            <ul>${c.aplicacoes.map((x) => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">` : ""}

          ${Array.isArray(c.resumoRapido) && c.resumoRapido.length ? `
          <div class="liora-section">
            <h5>RESUMO RÁPIDO</h5>
            <ul>${c.resumoRapido.map((x) => `<li>${x}</li>`).join("")}</ul>
          </div>` : ""}
        `;
      }

      // Analogias
      if (els.wizardAnalogias) {
        els.wizardAnalogias.innerHTML = (s.analogias || [])
          .map((a) => `<p>${a}</p>`)
          .join("");
      }

      // Ativação
      if (els.wizardAtivacao) {
        els.wizardAtivacao.innerHTML = (s.ativacao || [])
          .map((q) => `<li>${q}</li>`)
          .join("");
      }

      // QUIZ (v74 FIX com <div>)
      if (els.wizardQuiz) {
        els.wizardQuiz.innerHTML = "";
        const q = s.quiz || {};

        if (q.pergunta) {
          const pergunta = document.createElement("p");
          pergunta.textContent = q.pergunta;
          els.wizardQuiz.appendChild(pergunta);
        }

        const brutas = Array.isArray(q.alternativas)
          ? q.alternativas.filter((a) => {
              if (a === null || a === undefined) return false;
              const asStr = typeof a === "string" ? a : a.texto || a.label || "";
              return String(asStr).trim().length > 0;
            })
          : [];

        let marcadas = brutas.map((alt, i) => {
          let texto = "";
          if (typeof alt === "string") texto = alt;
          else if (alt && typeof alt.texto === "string") texto = alt.texto;
          else if (alt && typeof alt.label === "string") texto = alt.label;
          else texto = JSON.stringify(alt);

          const byIndex = i === Number(q.corretaIndex);
          const byFlag = !!(alt && (alt.correta || alt.correto || alt.isCorrect));
          return {
            texto: String(texto)
              .replace(/\n/g, " ")
              .replace(/<\/?[^>]+(>|$)/g, ""),
            correta: byIndex || byFlag,
          };
        });

        if (marcadas.length && !marcadas.some((a) => a.correta)) {
          marcadas[0].correta = true;
        }

        const alternativas = shuffle(marcadas);

        alternativas.forEach((altObj, idx) => {
          const opt = document.createElement("div");
          opt.className = "liora-quiz-option";
          opt.dataset.index = idx;

          opt.innerHTML = `
            <input type="radio" name="quiz-${wizard.atual}" value="${idx}">
            <span class="liora-quiz-option-text">${altObj.texto}</span>
            <span class="liora-quiz-dot"></span>
          `;

          opt.addEventListener("click", () => {
            els.wizardQuiz
              .querySelectorAll(".liora-quiz-option")
              .forEach((o) => o.classList.remove("selected"));

            opt.classList.add("selected");
            const input = opt.querySelector("input");
            if (input) input.checked = true;

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
              els.wizardQuizFeedback.style.opacity = 1;
            }, 120);
          });

          els.wizardQuiz.appendChild(opt);
        });
      }

      // Flashcards
      if (els.wizardFlashcards) {
        els.wizardFlashcards.innerHTML = (s.flashcards || [])
          .map((f) => `<li><b>${f.q}</b>: ${f.a}</li>`)
          .join("");
      }

      // Mapa mental
      if (els.wizardMapa) {
        const mapa = construirMapaMental(s);
        els.wizardMapa.textContent =
          mapa || "Mapa mental gerado automaticamente.";
      }

      // SESSÃO EM ANDAMENTO → Study Manager (progresso “em estudo”)
      if (window.lioraEstudos?.updateSessionProgress && s?.id) {
        window.lioraEstudos.updateSessionProgress(s.id, 0.5);
      }

      // Atualiza cards laterais (active)
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

    // --------------------------------------------------------
    // 🔥 GERAÇÃO DO PLANO POR TEMA — /api/gerarPlano
    // --------------------------------------------------------
    els.btnGerar?.addEventListener("click", async () => {
      const tema = (els.inpTema?.value || "").trim();
      const nivel = els.selNivel?.value || "iniciante";

      if (!tema) {
        window.lioraError.show("Digite um tema para gerar o plano.");
        return;
      }

      try {
        window.lioraLoading.show("Gerando plano de estudo...");
        atualizarStatus("tema", "Chamando IA...", 15);

        const resp = await fetch("/api/gerarPlano", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tema, nivel }),
        });

        if (!resp.ok) {
          throw new Error("Falha ao chamar /api/gerarPlano");
        }

        const parsed = await resp.json();

        if (!parsed || !parsed.sessoes || !parsed.sessoes.length) {
          throw new Error("Plano retornou sem sessões.");
        }

        atualizarStatus("tema", "Construindo sessões...", 60);

        const sessoesNorm = parsed.sessoes.map((s, i) => ({
          id: `S${i + 1}`,
          ordem: i + 1,
          progresso: 0,
          ...s,
        }));

        wizard = {
          tema: parsed.tema || tema,
          nivel: parsed.nivel || nivel,
          origem: parsed.origem || "tema",
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
        if (els.ctx)
          els.ctx.textContent = `Tema: ${wizard.tema} (${sessoesNorm.length} sessões)`;
        saveProgress();

        if (window.lioraEstudos?.definirPlano) {
          window.lioraEstudos.definirPlano({
            tema: wizard.tema,
            origem: "tema",
            sessoes: wizard.sessoes,
          });
        }

        atualizarStatus("tema", "Plano gerado!", 100);
        window.lioraLoading.hide();
      } catch (e) {
        console.error(e);
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

        const outline = window.lioraOutlineGenerator.gerar(estrutura);
        if (!outline || !outline.topicos || !outline.topicos.length) {
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
          ${outline.topicos.join("\n")}

          Gere sessões coerentes e completas.
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

        wizard = {
          tema: parsed.tema || file.name.replace(".pdf", ""),
          nivel: "PDF",
          origem: "upload",
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
        if (els.ctx) els.ctx.textContent = `PDF: ${wizard.tema}`;
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

    // --------------------------------------------------------
    // ⭐ JUMP-TO-SESSION ÚNICO (Continue Study + cards + revisão)
    // --------------------------------------------------------
    window.lioraIrParaSessao = function (index, isReview = false) {
      try {
        if (!wizard?.sessoes?.length) return;

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
          cards[index].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
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

    // quando revisar, recarrega plano + wizard para refletir cores / progresso
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
    console.log("🟢 Liora Core v74 totalmente carregado.");
  });
})();
