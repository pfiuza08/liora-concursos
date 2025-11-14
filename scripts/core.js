// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v59)
// Tema digitado + Upload PDF com sessões que resumem capítulos reais
// - Tema: mantém fluxo anterior (plano + sessões geradas pela IA)
// - Upload: lê o PDF via pdf.js, envia o TEXTO real para a IA
//           IA identifica capítulos e gera sessões-resumo por capítulo
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v59...");

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
      wizardResumo: document.getElementById("liora-sessao-resumo"),
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
      function apply(theme) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.body.classList.remove("light", "dark");
        document.body.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        if (els.themeBtn) {
          els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
        }
      }

      apply(localStorage.getItem("liora_theme") || "dark");

      if (els.themeBtn) {
        els.themeBtn.addEventListener("click", () => {
          const newTheme = document.documentElement.classList.contains("light") ? "dark" : "light";
          apply(newTheme);
        });
      }
    })();

    // --------------------------------------------------------
    // STATUS + PROGRESSO (barra lateral esquerda)
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;

      const barra = document.getElementById(modo === "tema" ? "barra-tema-fill" : "barra-upload-fill");
      if (barra && progresso !== null) {
        barra.style.width = `${progresso}%`;
      }
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL DO WIZARD
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
    const key = (tema, nivel) => `liora:wizard:${(tema || "").toLowerCase()}::${(nivel || "").toLowerCase()}`;
    const saveProgress = () => {
      if (!wizard.tema || !wizard.nivel) return;
      localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    };
    const loadProgress = (tema, nivel) => {
      if (!tema || !nivel) return null;
      return JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");
    };

    // --------------------------------------------------------
    // MODO (TEMA / UPLOAD)
    // --------------------------------------------------------
    function setMode(mode) {
      const tema = mode === "tema";
      if (els.painelTema) els.painelTema.classList.toggle("hidden", !tema);
      if (els.painelUpload) els.painelUpload.classList.toggle("hidden", tema);
      if (els.modoTema) els.modoTema.classList.toggle("selected", tema);
      if (els.modoUpload) els.modoUpload.classList.toggle("selected", !tema);
    }
    if (els.modoTema) els.modoTema.addEventListener("click", () => setMode("tema"));
    if (els.modoUpload) els.modoUpload.addEventListener("click", () => setMode("upload"));
    setMode("tema");

    // --------------------------------------------------------
    // CHAMADA À API /api/liora
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

    // --------------------------------------------------------
    // GERAÇÃO DE PLANO (TEMA DIGITADO)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Você é Liora, tutora especialista em microlearning.

Crie um plano de sessões bem estruturado para o tema "${tema}" (nível: ${nivel}).
Pense como um professor que está montando um curso completo.

Regras:
- Foque na progressão pedagógica (do básico ao avançado).
- Use de 4 a 10 sessões, conforme a complexidade do tema.
- Cada sessão deve avançar o entendimento em relação à anterior.

Retorne APENAS JSON puro, no formato:
[
  { "numero":1, "nome":"Fundamentos do tema" },
  { "numero":2, "nome":"Conceitos intermediários" }
]`.trim();

      const raw = await callLLM("Você gera somente JSON válido.", prompt);
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO (TEMA DIGITADO)
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, sessaoAnterior = null) {
      const contexto = sessaoAnterior
        ? `Na sessão anterior o aluno estudou "${sessaoAnterior.nome}". Agora aprofunde em "${nome}", evitando repetição e conectando os conceitos.`
        : `Esta é a primeira sessão do tema "${tema}". Introduza o assunto com clareza.`;

      const prompt = `
${contexto}

Crie uma sessão de aula completa em português, com riqueza de detalhes,
mas em linguagem clara e objetiva.

Retorne APENAS JSON, no formato exato:

{
 "titulo": "Sessão ${numero} — ${nome}",
 "objetivo": "frase única clara sobre o que o aluno será capaz de fazer ao final",
 "conteudo": {
   "introducao": "2 a 3 parágrafos contextualizando o tema da sessão.",
   "conceitos": [
     "conceito 1 explicado em 2 a 3 frases",
     "conceito 2 explicado em 2 a 3 frases",
     "conceito 3 explicado em 2 a 3 frases"
   ],
   "exemplos": [
     "exemplo concreto 1 aplicado ao dia a dia ou contexto profissional",
     "exemplo concreto 2"
   ],
   "aplicacoes": [
     "descrição de uma aplicação prática em estudo, trabalho ou concurso",
     "outra aplicação prática relevante"
   ]
 },
 "resumoRapido": "parágrafo único recapitulando os pontos principais da sessão.",
 "analogias": [
   "analogia 1 comparando o conteúdo com algo cotidiano",
   "analogia 2 (opcional)"
 ],
 "ativacao": [
   "pergunta ou desafio 1 que faça o aluno pensar ativamente sobre o conteúdo",
   "pergunta ou desafio 2"
 ],
 "quiz": {
   "pergunta": "pergunta objetiva de múltipla escolha",
   "alternativas": [
     "alternativa A",
     "alternativa B",
     "alternativa C"
   ],
   "corretaIndex": 0,
   "explicacao": "explique por que a alternativa correta está certa e as demais não."
 },
 "flashcards": [
   { "q": "pergunta de revisão 1", "a": "resposta curta 1" },
   { "q": "pergunta de revisão 2", "a": "resposta curta 2" }
 ]
}

Regras importantíssimas:
- Use apenas conhecimento geral sobre "${tema}" e contextualize com o nível "${nivel}".
- Não repita literalmente textos de sessões anteriores.
- Mantenha coerência terminológica ao longo das sessões.`.trim();

      const raw = await callLLM(
        "Você é Liora, tutora em microlearning. Responda somente com JSON válido.",
        prompt
      );
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO (CARDS LADO DIREITO)
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      if (!els.plano) return;
      els.plano.innerHTML = "";
      if (!Array.isArray(plano) || !plano.length) {
        els.plano.innerHTML = `<p class="text-[var(--muted)] text-sm">Nenhum plano gerado ainda.</p>`;
        return;
      }

      plano.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.textContent = `Sessão ${index + 1} — ${p.nome}`;
        div.addEventListener("click", () => {
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
    // RENDERIZAÇÃO DO WIZARD (CONTEÚDO HIERÁRQUICO + RESUMO RÁPIDO)
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s || !els.wizardContainer) return;

      // limpa feedback de quiz sempre que trocar de sessão
      if (els.wizardQuizFeedback) {
        els.wizardQuizFeedback.textContent = "";
        els.wizardQuizFeedback.style.opacity = 0;
      }

      els.wizardContainer.classList.remove("hidden");
      if (els.wizardTema) els.wizardTema.textContent = wizard.tema || "";
      if (els.wizardTitulo) els.wizardTitulo.textContent = s.titulo || `Sessão ${wizard.atual + 1}`;

      if (els.wizardObjetivo) els.wizardObjetivo.textContent = s.objetivo || "";

      // Conteúdo hierárquico
      const c = s.conteudo || {};
      if (els.wizardConteudo) {
        let html = "";

        if (c.introducao) {
          html += `
          <div class="liora-section">
            <h5>INTRODUÇÃO</h5>
            <p>${c.introducao}</p>
          </div>
          <hr class="liora-divider">`;
        }

        if (Array.isArray(c.conceitos) && c.conceitos.length) {
          html += `
          <div class="liora-section">
            <h5>CONCEITOS PRINCIPAIS</h5>
            <ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">`;
        }

        if (Array.isArray(c.exemplos) && c.exemplos.length) {
          html += `
          <div class="liora-section">
            <h5>EXEMPLOS</h5>
            <ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>
          <hr class="liora-divider">`;
        }

        if (Array.isArray(c.aplicacoes) && c.aplicacoes.length) {
          html += `
          <div class="liora-section">
            <h5>APLICAÇÕES</h5>
            <ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul>
          </div>`;
        }

        els.wizardConteudo.innerHTML = html;
      }

      if (els.wizardAnalogias) {
        els.wizardAnalogias.innerHTML = Array.isArray(s.analogias)
          ? s.analogias.map(a => `<p>${a}</p>`).join("")
          : "";
      }

      if (els.wizardAtivacao) {
        els.wizardAtivacao.innerHTML = Array.isArray(s.ativacao)
          ? s.ativacao.map(q => `<li>${q}</li>`).join("")
          : "";
      }

      // Resumo rápido (se existir)
      if (els.wizardResumo) {
        els.wizardResumo.textContent = s.resumoRapido || "";
      }

      // ---------- QUIZ ----------
      if (els.wizardQuiz) {
        els.wizardQuiz.innerHTML = "";

        if (!s.quiz) {
          els.wizardQuiz.innerHTML = `<p class="text-[var(--muted)] text-sm">Nenhuma questão disponível para esta sessão.</p>`;
        } else {
          const pergunta = document.createElement("p");
          pergunta.textContent = s.quiz.pergunta || "";
          els.wizardQuiz.appendChild(pergunta);

          const alternativas = (s.quiz.alternativas || []).map((alt, i) => ({
            texto: String(alt || "")
              .replace(/\n/g, " ")
              .replace(/<\/?[^>]+(>|$)/g, ""),
            correta: i === Number(s.quiz.corretaIndex || 0),
          }));

          // embaralha alternativas
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
              document.querySelectorAll(".liora-quiz-option").forEach(o => o.classList.remove("selected"));
              opt.classList.add("selected");
              const input = opt.querySelector("input");
              if (input) input.checked = true;

              if (!els.wizardQuizFeedback) return;

              els.wizardQuizFeedback.style.opacity = 0;
              setTimeout(() => {
                if (altObj.correta) {
                  els.wizardQuizFeedback.textContent = `✅ Correto! ${s.quiz.explicacao || ""}`;
                  els.wizardQuizFeedback.style.color = "var(--brand)";
                  tentativasErradas = 0;
                } else {
                  tentativasErradas++;
                  if (tentativasErradas >= 2) {
                    els.wizardQuizFeedback.textContent = `💡 Dica: ${s.quiz.explicacao || ""}`;
                    els.wizardQuizFeedback.style.color = "var(--brand)";
                  } else {
                    els.wizardQuizFeedback.textContent = "❌ Tente novamente.";
                    els.wizardQuizFeedback.style.color = "var(--muted)";
                  }
                }
                els.wizardQuizFeedback.style.transition = "opacity .4s ease";
                els.wizardQuizFeedback.style.opacity = 1;
              }, 100);
            });
            els.wizardQuiz.appendChild(opt);
          });
        }
      }

      if (els.wizardFlashcards) {
        els.wizardFlashcards.innerHTML = Array.isArray(s.flashcards)
          ? s.flashcards.map(f => `<li><b>${f.q}</b>: ${f.a}</li>`).join("")
          : "";
      }

      if (els.wizardProgressBar && wizard.sessoes.length) {
        els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
      }
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO (ANTERIOR / PRÓXIMA SESSÃO)
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
          atualizarStatus("tema", "Tema concluído!", 100);
        }
      });
    }

    // --------------------------------------------------------
    // EXTRAÇÃO DE TEXTO DO PDF (USANDO pdf.js)
    // --------------------------------------------------------
    async function extrairTextoDoPDF(file) {
      if (!window.pdfjsLib) {
        throw new Error("pdf.js não está carregado.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let texto = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        texto += strings.join(" ") + "\n\n";
      }

      return texto;
    }

    // --------------------------------------------------------
    // GERAÇÃO COMPLETA VIA UPLOAD (PLANO + SESSÕES)
    // --------------------------------------------------------
    async function gerarPlanoESessoesViaUpload(textoPDF, nivel) {
      // opcional: limitar tamanho caso o PDF seja enorme
      const textoLimitado = textoPDF.length > 120000
        ? textoPDF.slice(0, 120000)
        : textoPDF;

      const prompt = `
Você é Liora, tutora de microlearning.

Você receberá o TEXTO REAL de uma apostila ou livro didático em PDF.
Seu trabalho é:

1) Identificar os principais capítulos ou seções macro do material.
2) Criar um plano de estudo em sessões, onde:
   - Cada sessão corresponde a um capítulo ou seção principal.
   - A ordem das sessões segue a ordem do material.
3) Para cada sessão, criar um RESUMO detalhado do capítulo correspondente,
   usando EXCLUSIVAMENTE o conteúdo desse material. Não invente assuntos que
   não existam no texto.

IMPORTANTE:
- Use APENAS o texto fornecido abaixo como fonte.
- Conteúdo da sessão (introdução, conceitos, exemplos, aplicações, resumo rápido)
  deve refletir o capítulo original.
- Você pode criar analogias, perguntas de ativação, quiz e flashcards usando
  conhecimento pedagógico geral, mas SEM deturpar o conteúdo central do capítulo.
- Nível do aluno: ${nivel}.

Retorne APENAS JSON válido, no formato exato:

{
  "plano": [
    { "numero": 1, "nome": "Título do capítulo 1" },
    { "numero": 2, "nome": "Título do capítulo 2" }
  ],
  "sessoes": [
    {
      "numero": 1,
      "nome": "Título do capítulo 1",
      "titulo": "Sessão 1 — Título do capítulo 1",
      "objetivo": "objetivo da sessão",
      "conteudo": {
        "introducao": "2 a 3 parágrafos resumindo o capítulo",
        "conceitos": [
          "conceito 1 com explicação",
          "conceito 2"
        ],
        "exemplos": [
          "exemplo baseado em algo que aparece no próprio texto ou em situações coerentes",
          "outro exemplo coerente"
        ],
        "aplicacoes": [
          "aplicação prática coerente com o texto do capítulo",
          "outra aplicação"
        ]
      },
      "resumoRapido": "parágrafo único recapitulando os pontos mais importantes do capítulo.",
      "analogias": [
        "analogia 1",
        "analogia 2 (opcional)"
      ],
      "ativacao": [
        "pergunta ou desafio 1 de reflexão",
        "pergunta ou desafio 2"
      ],
      "quiz": {
        "pergunta": "pergunta objetiva sobre o conteúdo do capítulo",
        "alternativas": [
          "alternativa A",
          "alternativa B",
          "alternativa C"
        ],
        "corretaIndex": 0,
        "explicacao": "explique por que a alternativa correta está certa e as demais não."
      },
      "flashcards": [
        { "q": "pergunta de revisão 1", "a": "resposta curta 1" },
        { "q": "pergunta de revisão 2", "a": "resposta curta 2" }
      ]
    }
  ]
}

TEXTO DO PDF (use apenas este conteúdo como base):

"""${textoLimitado}"""`.trim();

      const raw = await callLLM(
        "Você é Liora, tutora. Responda SOMENTE com JSON válido no formato pedido.",
        prompt
      );

      const parsed = JSON.parse(raw);

      if (!parsed.plano || !parsed.sessoes) {
        throw new Error("Estrutura inesperada da IA (faltam 'plano' ou 'sessoes').");
      }

      // garantia mínima
      parsed.plano = Array.isArray(parsed.plano) ? parsed.plano : [];
      parsed.sessoes = Array.isArray(parsed.sessoes) ? parsed.sessoes : [];

      // alinhar numero/nome se necessário
      parsed.plano = parsed.plano.map((p, idx) => ({
        numero: p.numero != null ? p.numero : idx + 1,
        nome: p.nome || parsed.sessoes[idx]?.nome || `Sessão ${idx + 1}`,
      }));

      parsed.sessoes = parsed.sessoes.map((s, idx) => ({
        numero: s.numero != null ? s.numero : idx + 1,
        nome: s.nome || parsed.plano[idx]?.nome || `Sessão ${idx + 1}`,
        ...s,
      }));

      return parsed;
    }

    // --------------------------------------------------------
    // FLUXO GERAL DE GERAÇÃO (TEMA vs UPLOAD)
    // --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo, textoArquivo = null) {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;
      if (!btn) return;

      btn.disabled = true;
      atualizarStatus(modo, "Criando plano de estudo...", 0);

      try {
        if (modo === "upload" && textoArquivo) {
          // 🔹 NOVO FLUXO: plano + sessões em UMA chamada, baseado no texto real do PDF
          const out = await gerarPlanoESessoesViaUpload(textoArquivo, nivel);

          wizard = {
            tema: tema || "Plano gerado a partir do PDF",
            nivel,
            plano: out.plano,
            sessoes: out.sessoes,
            atual: 0,
          };

          renderPlanoResumo(wizard.plano);
          atualizarStatus("upload", "Sessões geradas a partir do PDF.", 100);
          renderWizard();
          saveProgress();
        } else {
          // 🔹 Fluxo original (tema digitado): plano + sessões em chamadas separadas
          const plano = await gerarPlanoDeSessoes(tema, nivel);
          wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
          renderPlanoResumo(plano);

          for (let i = 0; i < plano.length; i++) {
            const sessaoAnterior = i > 0 ? plano[i - 1] : null;
            atualizarStatus(
              "tema",
              `Gerando sessão ${i + 1}/${plano.length}: ${plano[i].nome}`,
              ((i + 1) / plano.length) * 100
            );
            const sessao = await gerarSessao(tema, nivel, plano[i].numero || i + 1, plano[i].nome, sessaoAnterior);
            wizard.sessoes.push(sessao);
            saveProgress();
          }

          atualizarStatus("tema", "Sessões concluídas!", 100);
          renderWizard();
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao gerar o plano/sessões. Veja o console para detalhes.");
      } finally {
        btn.disabled = false;
      }
    }

    // --------------------------------------------------------
    // BOTÃO GERAR — TEMA
    // --------------------------------------------------------
    if (els.btnGerar) {
      els.btnGerar.addEventListener("click", async () => {
        const tema = (els.inpTema && els.inpTema.value.trim()) || "";
        const nivel = els.selNivel ? els.selNivel.value : "iniciante";
        if (!tema) return alert("Digite um tema.");
        gerarFluxo(tema, nivel, "tema");
      });
    }

    // --------------------------------------------------------
    // BOTÃO GERAR — UPLOAD (PDF)
    // --------------------------------------------------------
    if (els.btnGerarUpload) {
      els.btnGerarUpload.addEventListener("click", async () => {
        const file = els.inpFile?.files?.[0];
        const nivel = els.selNivel ? els.selNivel.value : "iniciante";
        if (!file) return alert("Selecione um arquivo PDF.");

        // apenas PDF na primeira versão
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          return alert("Por enquanto, a Liora aceita apenas arquivos PDF.");
        }

        atualizarStatus("upload", "Lendo PDF...", 20);

        try {
          const textoPDF = await extrairTextoDoPDF(file);
          if (!textoPDF || textoPDF.trim().length < 200) {
            throw new Error("Texto extraído muito curto ou vazio.");
          }

          const tema = file.name.replace(/\.pdf$/i, "");
          atualizarStatus("upload", "Gerando plano e sessões a partir do PDF...", 40);

          await gerarFluxo(tema, nivel, "upload", textoPDF);
        } catch (err) {
          console.error(err);
          alert("Erro ao processar o PDF ou gerar o plano. Veja o console.");
          atualizarStatus("upload", "Falha ao processar o PDF.", 0);
        }
      });
    }

    // --------------------------------------------------------
    // ATUALIZA NOME DO ARQUIVO NA UI
    // --------------------------------------------------------
    if (els.inpFile) {
      els.inpFile.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        const uploadText = document.getElementById("upload-text");
        const spinner = document.getElementById("upload-spinner");

        if (uploadText) {
          uploadText.textContent = file
            ? `Selecionado: ${file.name}`
            : "Clique ou arraste um arquivo (.pdf)";
        }
        if (spinner) spinner.style.display = "none";
      });
    }

    console.log("🟢 core.js v59 carregado com sucesso");
  });
})();
