// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v58)
// Mantém tudo que já funciona + upload funcionando de novo
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v58...");

  document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------------
    // MAPA DE ELEMENTOS
    // --------------------------------------------------------
    const els = {
      // modos
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),

      // tema
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      // upload
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      // plano (lado direito)
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
      wizardVoltar: document.getElementById("liora-btn-voltar"),
      wizardProxima: document.getElementById("liora-btn-proxima"),
      wizardProgressBar: document.getElementById("liora-progress-bar"),

      // tema claro/escuro
      themeBtn: document.getElementById("btn-theme"),
    };

    // --------------------------------------------------------
    // 🌗 TEMA (LIGHT / DARK)
    // --------------------------------------------------------
    (function themeSetup() {
      if (!els.themeBtn) return;

      function apply(theme) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.body.classList.remove("light", "dark");
        document.body.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      }

      apply(localStorage.getItem("liora_theme") || "dark");

      els.themeBtn.addEventListener("click", () => {
        const newTheme = document.documentElement.classList.contains("light") ? "dark" : "light";
        apply(newTheme);
      });
    })();

    // --------------------------------------------------------
    // STATUS (texto) — sem depender de barras extras
    // --------------------------------------------------------
    function atualizarStatus(modo, texto) {
      if (modo === "tema") {
        if (els.status) els.status.textContent = texto || "";
      } else {
        if (els.statusUpload) els.statusUpload.textContent = texto || "";
      }
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };

    const key = (tema, nivel) =>
      `liora:wizard:${(tema || "").toLowerCase()}::${(nivel || "").toLowerCase()}`;

    const saveProgress = () => {
      if (!wizard.tema || !wizard.nivel) return;
      try {
        localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
      } catch (e) {
        console.warn("Não foi possível salvar progresso:", e);
      }
    };

    const loadProgress = (tema, nivel) => {
      try {
        const raw = localStorage.getItem(key(tema, nivel));
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    // --------------------------------------------------------
    // MODO (TEMA / UPLOAD)
    // --------------------------------------------------------
    function setMode(mode) {
      const temaAtivo = mode === "tema";
      if (els.painelTema) els.painelTema.classList.toggle("hidden", !temaAtivo);
      if (els.painelUpload) els.painelUpload.classList.toggle("hidden", temaAtivo);
      if (els.modoTema) els.modoTema.classList.toggle("selected", temaAtivo);
      if (els.modoUpload) els.modoUpload.classList.toggle("selected", !temaAtivo);
    }

    els.modoTema && els.modoTema.addEventListener("click", () => setMode("tema"));
    els.modoUpload && els.modoUpload.addEventListener("click", () => setMode("upload"));
    setMode("tema");

    // --------------------------------------------------------
    // CHAMADA À API + PARSE SEGURO DE JSON
    // --------------------------------------------------------
    async function callLLM(system, user) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user }),
      });

      const json = await res.json().catch(() => ({}));
      if (!json.output) throw new Error("Resposta inválida da IA (sem campo output)");
      return json.output;
    }

    function extractJsonArray(text) {
      if (!text) throw new Error("Texto vazio ao tentar extrair JSON");
      const first = text.indexOf("[");
      const last = text.lastIndexOf("]");
      if (first === -1 || last === -1 || last <= first) {
        // tenta parse direto
        return JSON.parse(text);
      }
      const slice = text.slice(first, last + 1);
      return JSON.parse(slice);
    }

    function extractJsonObject(text) {
      if (!text) throw new Error("Texto vazio ao tentar extrair JSON");
      const first = text.indexOf("{");
      const last = text.lastIndexOf("}");
      if (first === -1 || last === -1 || last <= first) {
        return JSON.parse(text);
      }
      const slice = text.slice(first, last + 1);
      return JSON.parse(slice);
    }

    // --------------------------------------------------------
    // GERAÇÃO DE PLANO
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Você é Liora, tutora especialista em microlearning.
Crie um plano de 5 a 10 sessões sobre o tema "${tema}" (nível: ${nivel}).
Retorne **apenas** JSON válido, no formato:

[
  {"numero":1,"nome":"Nome da sessão 1"},
  {"numero":2,"nome":"Nome da sessão 2"}
]

Sem texto explicativo antes ou depois, apenas o array JSON.
`;
      const raw = await callLLM(
        "Você é Liora, especialista em montar planos de estudo estruturados em sessões.",
        prompt
      );

      let arr = extractJsonArray(raw);

      // normaliza
      arr = (arr || []).map((s, i) => ({
        numero: s.numero != null ? s.numero : i + 1,
        nome: s.nome || `Sessão ${i + 1}`,
      }));

      if (!arr.length) throw new Error("Plano vazio retornado pela IA.");
      return arr;
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO (hierarquia de conteúdo)
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, sessaoAnteriorNome) {
      const contextoAnterior = sessaoAnteriorNome
        ? `Na sessão anterior o aluno estudou: "${sessaoAnteriorNome}". Agora avance para "${nome}", evitando repetição e garantindo progressão pedagógica.`
        : `Esta é a primeira sessão do tema "${tema}". Foque em fundamentos bem explicados, com exemplos claros.`;

      const prompt = `
${contextoAnterior}

Crie o conteúdo COMPLETO de uma aula em formato de microlearning para a sessão ${numero}, com o título "${nome}".
Nível: ${nivel}.
Produza a saída **apenas** em JSON, no formato EXATO abaixo:

{
  "titulo": "Sessão ${numero} — ${nome}",
  "objetivo": "frase única, clara e específica descrevendo o que o aluno será capaz de fazer ao final da sessão.",
  "conteudo": {
    "introducao": "1 a 2 parágrafos contextualizando o tema da sessão.",
    "conceitos": [
      "cada item deve explicar um conceito importante com 2 a 3 frases, de forma didática",
      "use linguagem clara e conectada à prática"
    ],
    "exemplos": [
      "exemplo aplicado com explicação do raciocínio",
      "outro exemplo com variação prática"
    ],
    "aplicacoes": [
      "descrição de uma situação real em que o conhecimento da sessão é utilizado",
      "outra aplicação prática em contexto profissional ou de prova"
    ],
    "resumoRapido": [
      "bullet com ideia-chave 1",
      "bullet com ideia-chave 2",
      "bullet com ideia-chave 3"
    ]
  },
  "analogias": [
    "analogia simples comparando o conceito principal a algo do dia a dia"
  ],
  "ativacao": [
    "pergunta reflexiva ou desafio curto para o aluno relacionar o conteúdo com sua realidade",
    "outra pergunta de ativação mental"
  ],
  "quiz": {
    "pergunta": "pergunta objetiva sobre o ponto central da sessão",
    "alternativas": [
      "alternativa A",
      "alternativa B",
      "alternativa C"
    ],
    "corretaIndex": 0,
    "explicacao": "explique por que a alternativa correta está certa e, se relevante, por que as outras não estão."
  },
  "flashcards": [
    {"q":"pergunta curta 1","a":"resposta direta 1"},
    {"q":"pergunta curta 2","a":"resposta direta 2"}
  ]
}

NÃO inclua comentários, texto fora do JSON ou explicações adicionais. Apenas o objeto JSON.
`;
      const raw = await callLLM(
        "Você é Liora, tutora de excelência focada em microlearning estruturado e progressivo.",
        prompt
      );

      const sessao = extractJsonObject(raw);

      // garante título consistente
      sessao.titulo = `Sessão ${numero} — ${
        (sessao.titulo || nome).replace(/^Sessão\s*\d+\s*[-—]\s*/i, "") || nome
      }`;

      return sessao;
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO (cards lado direito)
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
        div.textContent = `Sessão ${index + 1} — ${p.nome}`;
        div.addEventListener("click", () => {
          wizard.atual = index;
          renderWizard();
          window.scrollTo({
            top: els.wizardContainer ? els.wizardContainer.offsetTop - 20 : 0,
            behavior: "smooth",
          });
        });
        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO WIZARD (inclui limpeza de feedback do quiz)
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s || !els.wizardContainer) return;

      els.wizardContainer.classList.remove("hidden");

      if (els.wizardTema) els.wizardTema.textContent = wizard.tema || "";
      if (els.wizardTitulo) els.wizardTitulo.textContent = s.titulo || "";
      if (els.wizardObjetivo) els.wizardObjetivo.textContent = s.objetivo || "";

      // Conteúdo hierárquico
      const c = s.conteudo || {};
      if (els.wizardConteudo) {
        els.wizardConteudo.innerHTML = `
          ${
            c.introducao
              ? `<div class="liora-section">
                   <h5>INTRODUÇÃO</h5>
                   <p>${c.introducao}</p>
                 </div>
                 <hr class="liora-divider">`
              : ""
          }

          ${
            c.conceitos && Array.isArray(c.conceitos)
              ? `<div class="liora-section">
                   <h5>CONCEITOS PRINCIPAIS</h5>
                   <ul>${c.conceitos.map((x) => `<li>${x}</li>`).join("")}</ul>
                 </div>
                 <hr class="liora-divider">`
              : ""
          }

          ${
            c.exemplos && Array.isArray(c.exemplos)
              ? `<div class="liora-section">
                   <h5>EXEMPLOS</h5>
                   <ul>${c.exemplos.map((x) => `<li>${x}</li>`).join("")}</ul>
                 </div>
                 <hr class="liora-divider">`
              : ""
          }

          ${
            c.aplicacoes && Array.isArray(c.aplicacoes)
              ? `<div class="liora-section">
                   <h5>APLICAÇÕES</h5>
                   <ul>${c.aplicacoes.map((x) => `<li>${x}</li>`).join("")}</ul>
                 </div>
                 <hr class="liora-divider">`
              : ""
          }

          ${
            c.resumoRapido && Array.isArray(c.resumoRapido)
              ? `<div class="liora-section">
                   <h5>RESUMO RÁPIDO</h5>
                   <ul>${c.resumoRapido.map((x) => `<li>${x}</li>`).join("")}</ul>
                 </div>`
              : ""
          }
        `;
      }

      if (els.wizardAnalogias) {
        els.wizardAnalogias.innerHTML = (s.analogias || [])
          .map((a) => `<p>${a}</p>`)
          .join("");
      }

      if (els.wizardAtivacao) {
        els.wizardAtivacao.innerHTML = (s.ativacao || [])
          .map((q) => `<li>${q}</li>`)
          .join("");
      }

      // Quiz
      if (els.wizardQuiz) {
        els.wizardQuiz.innerHTML = "";
        const pergunta = document.createElement("p");
        pergunta.textContent = s.quiz?.pergunta || "";
        els.wizardQuiz.appendChild(pergunta);

        const alternativas = (s.quiz?.alternativas || []).map((alt, i) => ({
          texto: String(alt)
            .replace(/\n/g, " ")
            .replace(/<\/?[^>]+(>|$)/g, ""),
          correta: i === Number(s.quiz?.corretaIndex || 0),
        }));

        // fisher-yates
        for (let i = alternativas.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
        }

        let tentativasErradas = 0;

        alternativas.forEach((altObj, i) => {
          const opt = document.createElement("label");
          opt.className = "liora-quiz-option";
          opt.innerHTML = `
            <input type="radio" name="quiz" value="${i}">
            <span class="liora-quiz-option-text">${altObj.texto}</span>
          `;
          opt.addEventListener("click", () => {
            document
              .querySelectorAll(".liora-quiz-option")
              .forEach((o) => o.classList.remove("selected"));
            opt.classList.add("selected");
            const input = opt.querySelector("input");
            if (input) input.checked = true;

            if (els.wizardQuizFeedback) {
              els.wizardQuizFeedback.style.opacity = 0;
              setTimeout(() => {
                if (altObj.correta) {
                  els.wizardQuizFeedback.textContent = `✅ Correto! ${s.quiz?.explicacao || ""}`;
                  els.wizardQuizFeedback.style.color = "var(--brand)";
                  tentativasErradas = 0;
                } else {
                  tentativasErradas++;
                  if (tentativasErradas >= 2) {
                    els.wizardQuizFeedback.textContent = `💡 Dica: ${
                      s.quiz?.explicacao || ""
                    }`;
                    els.wizardQuizFeedback.style.color = "var(--brand)";
                  } else {
                    els.wizardQuizFeedback.textContent = "❌ Tente novamente.";
                    els.wizardQuizFeedback.style.color = "var(--muted)";
                  }
                }
                els.wizardQuizFeedback.style.transition = "opacity .4s ease";
                els.wizardQuizFeedback.style.opacity = 1;
              }, 100);
            }
          });
          els.wizardQuiz.appendChild(opt);
        });
      }

      // limpa feedback ao trocar de sessão
      if (els.wizardQuizFeedback) {
        els.wizardQuizFeedback.textContent = "";
        els.wizardQuizFeedback.style.opacity = 0;
      }

      if (els.wizardFlashcards) {
        els.wizardFlashcards.innerHTML = (s.flashcards || [])
          .map((f) => `<li><b>${f.q}</b>: ${f.a}</li>`)
          .join("");
      }

      if (els.wizardProgressBar && wizard.sessoes.length > 0) {
        els.wizardProgressBar.style.width = `${
          ((wizard.atual + 1) / wizard.sessoes.length) * 100
        }%`;
      }
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO DO WIZARD
    // --------------------------------------------------------
    els.wizardVoltar &&
      els.wizardVoltar.addEventListener("click", () => {
        if (wizard.atual > 0) {
          wizard.atual--;
          renderWizard();
          saveProgress();
        }
      });

    els.wizardProxima &&
      els.wizardProxima.addEventListener("click", () => {
        if (wizard.atual < wizard.sessoes.length - 1) {
          wizard.atual++;
          renderWizard();
          saveProgress();
        } else {
          atualizarStatus("tema", "Tema concluído!");
        }
      });

    // --------------------------------------------------------
    // FLUXO GENÉRICO (tema ou upload)
    // --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo) {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;
      if (!btn) return;

      btn.disabled = true;
      atualizarStatus(modo, "Criando plano...");

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          const sessaoAnteriorNome = i > 0 ? plano[i - 1].nome : null;
          atualizarStatus(
            modo,
            `Gerando sessão ${i + 1}/${plano.length}: ${plano[i].nome}`
          );
          const sessao = await gerarSessao(
            tema,
            nivel,
            i + 1,
            plano[i].nome,
            sessaoAnteriorNome
          );
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus(modo, "Sessões concluídas!");
        renderWizard();
      } catch (err) {
        console.error("Erro no fluxo de geração:", err);
        alert("Erro ao gerar o plano. Veja o console para mais detalhes.");
        atualizarStatus(modo, "Erro ao gerar o plano.");
      } finally {
        btn.disabled = false;
      }
    }

    // --------------------------------------------------------
    // BOTÃO GERAR — TEMA
    // --------------------------------------------------------
    els.btnGerar &&
      els.btnGerar.addEventListener("click", () => {
        const tema = (els.inpTema && els.inpTema.value.trim()) || "";
        const nivel = els.selNivel ? els.selNivel.value : "iniciante";
        if (!tema) {
          alert("Digite um tema.");
          return;
        }

        const cached = loadProgress(tema, nivel);
        if (cached && cached.sessoes && cached.sessoes.length) {
          wizard = cached;
          renderPlanoResumo(wizard.plano);
          renderWizard();
          atualizarStatus("tema", "Plano carregado do histórico.");
          return;
        }

        gerarFluxo(tema, nivel, "tema");
      });

    // --------------------------------------------------------
    // BOTÃO GERAR — UPLOAD
    // --------------------------------------------------------
    els.btnGerarUpload &&
      els.btnGerarUpload.addEventListener("click", async () => {
        if (!els.inpFile) return;
        const file = els.inpFile.files && els.inpFile.files[0];
        const nivel = els.selNivel ? els.selNivel.value : "iniciante";

        if (!file) {
          alert("Selecione um arquivo PDF.");
          return;
        }

        const tema = file.name.split(".")[0] || "Plano a partir do arquivo";
        gerarFluxo(tema, nivel, "upload");
      });

    // --------------------------------------------------------
    // NOME DO ARQUIVO NO UPLOAD
    // --------------------------------------------------------
    els.inpFile &&
      els.inpFile.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        const uploadText = document.getElementById("upload-text");
        const spinner = document.getElementById("upload-spinner");
        if (uploadText) {
          uploadText.textContent = file
            ? `Selecionado: ${file.name}`
            : "Clique ou arraste um arquivo (.txt, .pdf)";
        }
        if (spinner) spinner.style.display = "none";
      });

    console.log("🟢 core.js v58 carregado com sucesso");
  });
})();
