// ==========================================================
// 🧠 LIORA — CORE v74-COMMERCIAL-PREMIUM-DIA3-STUDY-MANAGER
// ----------------------------------------------------------
// Inclui:
// ✔ Tema: plano + sessões completas (JSON único, sem títulos repetidos)
// ✔ Upload: Modelo D (outline + sessões)
// ✔ Wizard Premium (fade, microinterações, quiz bonito)
// ✔ Loading global / Erro global
// ✔ Barras de progresso
// ✔ Estudo Inteligente (Study Manager)
// ✔ Prefill de simulado
// ✔ Continue Study Engine (jump automático) — via window.lioraIrParaSessao()
// ✔ Salvamento incremental das sessões (localStorage por tema+nivel)
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

    // --------------------------------------------------------
    // ⭐ MODO REVISÃO + NAVEGAÇÃO CENTRALIZADA
    // --------------------------------------------------------
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

    // função central de navegação
    function irParaSessao(index, isReview = false) {
      try {
        if (!wizard || !wizard.sessoes || !wizard.sessoes.length) return;

        const maxIndex = wizard.sessoes.length - 1;
        index = Math.max(0, Math.min(maxIndex, Number(index) || 0));

        wizard.atual = index;
        window.lioraModoRevisao = !!isReview;

        const sessao = wizard.sessoes[wizard.atual];

        // Registro no Study Manager
        try {
          const sm = window.lioraEstudos;
          if (sm && sessao?.id) {
            if (window.lioraModoRevisao && sm.registrarRevisao) {
              sm.registrarRevisao(sessao.id);
            }
            if (sm.registrarAbertura) {
              sm.registrarAbertura(sessao.id);
            }
            if (sm.updateSessionProgress) {
              // sessão em andamento
              sm.updateSessionProgress(sessao.id, 0.5);
            }
          }
        } catch (err) {
          console.warn("⚠️ Erro ao integrar com Study Manager:", err);
        }

        renderWizard();
        renderPlanoResumo(wizard.plano, wizard.atual);
        saveProgress();

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
    }

    window.lioraIrParaSessao = irParaSessao;

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
      // (nenhuma alteração adicional aqui — já está integrada)
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

      // fallback: conteúdo normal
      const c = sessao.conteudo || {};

      linhas.push(titulo);
      linhas.push("├─ Objetivo: " + (sessao.objetivo || "—"));

      if (c.introducao) linhas.push("├─ Introdução");

      if (Array.isArray(c.conceitos) && c.conceitos.length) {
        linhas.push("├─ Conceitos");
        c.conceitos.forEach((item, idx) => linhas.push(`│   ├─ ${idx + 1}. ${item}`));
      }

      if (Array.isArray(c.exemplos) && c.exemplos.length) {
        linhas.push("├─ Exemplos");
        c.exemplos.forEach((item, idx) => linhas.push(`│   ├─ ${idx + 1}. ${item}`));
      }

      if (Array.isArray(c.aplicacoes) && c.aplicacoes.length) {
        linhas.push("├─ Aplicações");
        c.aplicacoes.forEach((item, idx) => linhas.push(`│   ├─ ${idx + 1}. ${item}`));
      }

      if (Array.isArray(c.resumoRapido) && c.resumoRapido.length) {
        linhas.push("└─ Pontos-chave");
        c.resumoRapido.forEach((item, idx) => linhas.push(`    ├─ ${idx + 1}. ${item}`));
      }

      return linhas.join("\n");
    }


    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO (lista lateral)
    // --------------------------------------------------------
    function renderPlanoResumo(plano, activeIndex = wizard.atual) {
      if (!els.plano) return;

      els.plano.innerHTML = "";
      if (!plano || !plano.length) {
        els.plano.innerHTML =
          '<p class="text-sm text-[var(--muted)]">Nenhum plano gerado ainda.</p>';
        return;
      }

      els.areaPlano?.classList.remove("hidden");

      plano.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";

        const sessao = wizard.sessoes[index];
        if (sessao?.forca === "forte") div.classList.add("forca-forte");
        else if (sessao?.forca === "media") div.classList.add("forca-media");
        else div.classList.add("forca-fraca");

        div.dataset.index = index;
        div.textContent = p.titulo || p.nome || `Sessão ${index + 1}`;

        if (index === activeIndex) {
          div.classList.add("active");
        }

        div.addEventListener("mouseenter", () => div.classList.add("hovered"));
        div.addEventListener("mouseleave", () => div.classList.remove("hovered"));

        div.addEventListener("click", () => {
          // delega navegação para a função central
          irParaSessao(index, false);
        });

        els.plano.appendChild(div);
      });
    }


    // --------------------------------------------------------
    // RENDERIZAÇÃO DO WIZARD
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

      // Analogias
      if (els.wizardAnalogias) {
        els.wizardAnalogias.innerHTML = (s.analogias || [])
          .map(a => `<p>${a}</p>`)
          .join("");
      }

      // Ativação
      if (els.wizardAtivacao) {
        els.wizardAtivacao.innerHTML = (s.ativacao || [])
          .map(q => `<li>${q}</li>`)
          .join("");
      }

      // Quiz
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

      // Flashcards
      if (els.wizardFlashcards) {
        els.wizardFlashcards.innerHTML = (s.flashcards || [])
          .map(f => `<li><b>${f.q}</b>: ${f.a}</li>`)
          .join("");
      }

      // Mapa mental
      if (els.wizardMapa) {
        const mapa = construirMapaMental(s);
        els.wizardMapa.textContent = mapa || "Mapa mental gerado automaticamente.";
      }
    }


    // --------------------------------------------------------
    // NAVEGAÇÃO DO WIZARD (VOLTA / PRÓXIMA / REVISAR)
    // --------------------------------------------------------
    els.wizardVoltar?.addEventListener("click", () => {
      if (wizard.atual > 0) {
        irParaSessao(wizard.atual - 1, false);
      }
    });

    els.wizardProxima?.addEventListener("click", () => {
      const sessao = wizard.sessoes[wizard.atual];

      if (sessao && window.lioraEstudos) {
        try {
          if (window.lioraModoRevisao) {
            // revisão
            window.lioraEstudos.marcarRevisada?.(sessao.id);
            window.lioraEstudos.agendarRevisao?.(sessao.id);
            window.dispatchEvent(new Event("liora:review-updated"));
          } else {
            // progresso normal
            window.lioraEstudos.registrarProgresso?.(sessao.id);
            window.dispatchEvent(new Event("liora:plan-updated"));
          }
        } catch (e) {
          console.warn("⚠️ Erro ao registrar progresso:", e);
        }
      }

      // navegação
      if (wizard.atual < wizard.sessoes.length - 1) {
        irParaSessao(wizard.atual + 1, false);
      } else {
        atualizarStatus(
          wizard.origem === "upload" ? "upload" : "tema",
          "🎉 Tema concluído!",
          100
        );

        // marcar conclusão total
        try {
          window.lioraEstudos?.finalizarPlano?.(wizard.tema);
        } catch (e) {
          console.warn("⚠️ Erro ao finalizar plano:", e);
        }
      }
    });

    els.wizardRevisar?.addEventListener("click", () => {
      try {
        const s = wizard.sessoes[wizard.atual];
        if (!s?.id) return;

        if (window.lioraEstudos?.marcarRevisada) {
          window.lioraEstudos.marcarRevisada(s.id);
          window.dispatchEvent(new Event("liora:review-updated"));
        }

        // feedback rápido
        if (els.wizardQuizFeedback) {
          els.wizardQuizFeedback.textContent = "🔁 Revisada!";
          els.wizardQuizFeedback.style.color = "var(--brand)";
          els.wizardQuizFeedback.style.opacity = 1;
        }

        // atualizar plano lateral (cor)
        renderPlanoResumo(wizard.plano, wizard.atual);

      } catch (e) {
        console.warn("⚠️ Erro ao revisar sessão:", e);
      }
    });


    // --------------------------------------------------------
    // 🔥 GERAÇÃO DO PLANO POR TEMA (OPÇÃO B ADAPTATIVA)
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
        atualizarStatus("tema", "Aguarde...", 10);

        const system = `
Você é a IA da Liora, especialista em criar planos de estudo para concursos, ENEM, certificações de TI, OAB e provas em geral.

Seu trabalho é criar um PLANO DE ESTUDO COMPLETO para o tema informado, organizado em SESSÕES PROGRESSIVAS.

REGRAS DE ESTRUTURA:
- Sempre gere PELO MENOS 6 sessões.
- Se o tema for amplo ou complexo, divida em mais sessões (até 10–12 no máximo).
- Cada sessão deve ter FOCO CLARO e DIFERENTE das demais.
- Os TÍTULOS DAS SESSÕES DEVEM SER ÚNICOS — não repita títulos nem use títulos quase idênticos.
- Comece com fundamentos e contexto → vá para aprofundamento → aplicações / resolução de questões → revisão.

FORMATO DE RESPOSTA (JSON VÁLIDO, SEM TEXTO FORA DO JSON):
{
  "tema": "repita aqui o tema final",
  "nivel": "iniciante | intermediario | avancado | misto",
  "sessoes": [
    {
      "titulo": "título curto e específico da sessão",
      "objetivo": "frase explicando o que o aluno será capaz de fazer ao final da sessão",
      "conteudo": {
        "introducao": "visão geral do assunto da sessão",
        "conceitos": ["conceito 1", "conceito 2", "..."],
        "exemplos": ["exemplo aplicado 1", "exemplo aplicado 2"],
        "aplicacoes": ["como isso cai em prova / prática 1", "aplicação 2"],
        "resumoRapido": ["bullet 1 com ideia-chave", "bullet 2", "bullet 3"]
      },
      "ativacao": [
        "pergunta de reflexão ou exercício rápido 1",
        "pergunta de reflexão ou exercício rápido 2"
      ],
      "quiz": {
        "pergunta": "uma questão objetiva sobre o núcleo da sessão",
        "alternativas": [
          "alternativa A",
          "alternativa B",
          "alternativa C",
          "alternativa D"
        ],
        "corretaIndex": 0,
        "explicacao": "explique por que a alternativa correta está certa e as demais erradas"
      },
      "flashcards": [
        { "q": "pergunta curta 1", "a": "resposta 1" },
        { "q": "pergunta curta 2", "a": "resposta 2" }
      ],
      "mindmap": "representação em texto usando o padrão: NÓ RAIZ > ramo 1 > subramo 1 | ramo 2 > subramo 2"
    }
  ]
}

DETALHES IMPORTANTES:
- Adapte a profundidade ao nível informado (iniciante, intermediário, avançado).
- Use linguagem clara, objetiva e adequada a estudantes de provas.
- Não inclua NENHUM comentário fora do JSON.
        `.trim();

        const user = `
Tema do estudo: "${tema}"
Nível do estudante: "${nivel}"

Crie um plano ADAPTATIVO:
- mínimo de 6 sessões
- aumente o número de sessões se o tema for amplo
- garanta que cada sessão tenha um papel diferente no aprendizado.
        `.trim();

        const rawOutput = await callLLM(system, user);
        atualizarStatus("tema", "Processando IA...", 40);

        const parsed = safeJsonParse(rawOutput);

        if (!parsed || !parsed.sessoes?.length) {
          throw new Error("JSON inválido ou sem sessões.");
        }

        // normaliza e garante ids/ordem
        atualizarStatus("tema", "Construindo sessões...", 70);

        wizard = {
          tema: parsed.tema || tema,
          nivel: parsed.nivel || nivel,
          origem: "tema",
          plano: parsed.sessoes.map((s, i) => ({
            id: `S${i + 1}`,
            ordem: i + 1,
            ...s,
          })),
          sessoes: parsed.sessoes.map((s, i) => ({
            id: `S${i + 1}`,
            ordem: i + 1,
            progresso: 0,
            ...s,
          })),
          atual: 0,
        };

        els.ctx.textContent = `Tema: ${wizard.tema}`;
        renderPlanoResumo(wizard.plano, 0);
        renderWizard();
        saveProgress();

        // 🔥 registra plano no Study Manager
        try {
          window.lioraEstudos?.definirPlano?.({
            tema: wizard.tema,
            origem: "tema",
            sessoes: wizard.sessoes,
          });
          window.dispatchEvent(new Event("liora:plan-updated"));
        } catch (e) {
          console.warn("⚠️ Erro ao registrar plano no Study Manager:", e);
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
    // (mantida, ainda usando /api/liora genérica)
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
        if (!rawBlocks || !rawBlocks.length) throw new Error("PDF sem conteúdo.");

        atualizarStatus("upload", "Organizando conteúdo...", 30);

        const estrutura = window.lioraPDFStructure.fromBlocks(rawBlocks);

        const outline = window.lioraOutlineGenerator.gerar(estrutura);
        if (!outline || !outline.topicos || !outline.topicos.length) {
          throw new Error("Não foi possível identificar tópicos.");
        }

        atualizarStatus("upload", "Gerando sessões com IA...", 55);

        const system = `
Você é a IA da Liora e deve transformar TÓPICOS de um PDF em sessões de estudo.

Siga as MESMAS REGRAS de estrutura usadas no modo por tema:
- mínimo de 6 sessões (aumente se o PDF for amplo)
- sessões progressivas (fundamentos → aprofundamento → questões → revisão)
- títulos de sessão ÚNICOS, sem repetições.

FORMATO EXATO (JSON VÁLIDO, SEM TEXTO FORA DO JSON):
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
        `.trim();

        const user = `
TÓPICOS EXTRAÍDOS DO PDF (em ordem):
${outline.topicos.join("\n")}

Use esses tópicos para definir as sessões do plano. Não invente matéria completamente fora do PDF.
        `.trim();

        const rawOutput = await callLLM(system, user);
        const parsed = safeJsonParse(rawOutput);

        atualizarStatus("upload", "Finalizando...", 80);

        wizard = {
          tema: parsed.tema || file.name.replace(".pdf", ""),
          nivel: "PDF",
          origem: "upload",
          plano: parsed.sessoes.map((s, i) => ({
            id: `S${i + 1}`,
            ordem: i + 1,
            ...s,
          })),
          sessoes: parsed.sessoes.map((s, i) => ({
            id: `S${i + 1}`,
            ordem: i + 1,
            progresso: 0,
            ...s,
          })),
          atual: 0,
        };

        els.ctx.textContent = `PDF: ${wizard.tema}`;
        renderPlanoResumo(wizard.plano, 0);
        renderWizard();
        saveProgress();

        // registra no Study Manager
        try {
          window.lioraEstudos?.definirPlano?.({
            tema: wizard.tema,
            origem: "upload",
            sessoes: wizard.sessoes,
          });
          window.dispatchEvent(new Event("liora:plan-updated"));
        } catch (e) {
          console.warn("⚠️ Erro ao registrar plano (upload):", e);
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
    // EVENTOS DE REVISÃO
    // --------------------------------------------------------
    window.addEventListener("liora:review-updated", () => {
      try {
        renderPlanoResumo(wizard.plano, wizard.atual);
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
