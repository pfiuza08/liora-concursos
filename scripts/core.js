// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v49)
// Upload inteligente (usa conteúdo do arquivo) +
// conteúdo hierárquico mais denso + continuidade entre sessões
// Mantém comportamento de tema, quiz e UI do v47
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v49...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // MAPA DE ELEMENTOS
    // --------------------------------------------------------
    const els = {
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),

      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

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
      wizardVoltar: document.getElementById("liora-btn-voltar"),
      wizardProxima: document.getElementById("liora-btn-proxima"),
      wizardProgressBar: document.getElementById("liora-progress-bar"),

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
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      }
      apply(localStorage.getItem("liora_theme") || "dark");
      els.themeBtn.addEventListener("click", () => {
        const newTheme = document.documentElement.classList.contains("light") ? "dark" : "light";
        apply(newTheme);
      });
    })();

    // --------------------------------------------------------
    // STATUS + PROGRESSO
    // --------------------------------------------------------
    function atualizarStatus(modo, texto, progresso = null) {
      const statusEl = modo === "tema" ? els.status : els.statusUpload;
      if (statusEl) statusEl.textContent = texto;
      const barra = document.getElementById(modo === "tema" ? "barra-tema-fill" : "barra-upload-fill");
      if (barra && progresso !== null) barra.style.width = `${progresso}%`;
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
    const key = (tema, nivel) => `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
    const saveProgress = () =>
      localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    const loadProgress = (tema, nivel) =>
      JSON.parse(localStorage.getItem(key(tema, nivel)) || "null");

    // --------------------------------------------------------
    // MODO (TEMA / UPLOAD)
    // --------------------------------------------------------
    function setMode(mode) {
      const tema = mode === "tema";
      els.painelTema.classList.toggle("hidden", !tema);
      els.painelUpload.classList.toggle("hidden", tema);
      els.modoTema.classList.toggle("selected", tema);
      els.modoUpload.classList.toggle("selected", !tema);
    }
    els.modoTema.addEventListener("click", () => setMode("tema"));
    els.modoUpload.addEventListener("click", () => setMode("upload"));
    setMode("tema");

    // --------------------------------------------------------
    // CHAMADA À API
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
    // GERAÇÃO DE PLANO (TEMA)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Crie um plano de sessões para o tema "${tema}" (nível: ${nivel}).
Mantenha progressão lógica (fundamentos → aplicações).
Formato: JSON puro, ex:
[
  {"numero":1,"nome":"Fundamentos"},
  {"numero":2,"nome":"Aplicações avançadas"}
]`;
      const raw = await callLLM(
        "Você é Liora, especialista em microlearning. Crie planos de estudo claros, progressivos e bem estruturados.",
        prompt
      );
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // 🔍 ANÁLISE DO CONTEÚDO DO ARQUIVO (UPLOAD INTELIGENTE)
    // --------------------------------------------------------
    async function prepararContextoArquivo(textoBruto) {
      // Limita para evitar prompts gigantes (ajuste se quiser)
      const trecho = textoBruto.slice(0, 16000);

      const prompt = `
Você receberá o conteúdo (ou parte) de um material de estudo.
Sua tarefa é produzir uma ANÁLISE estruturada em JSON com:

{
 "resumoGlobal": "síntese em 2–3 parágrafos do material, em linguagem didática",
 "topicosPrincipais": ["tópico 1","tópico 2","tópico 3","..."],
 "publicoAlvoProvavel": "descrição do perfil do estudante para quem esse material foi escrito"
}

TEXTO DO MATERIAL (trecho condensado):
${trecho}
`;
      const raw = await callLLM(
        "Você é Liora, especialista em análise de materiais didáticos e estruturação de conteúdos para estudo.",
        prompt
      );
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // PLANO A PARTIR DO CONTEÚDO (UPLOAD)
    // --------------------------------------------------------
    async function gerarPlanoDeSessoesFromConteudo(textoBruto, nivel) {
      const analise = await prepararContextoArquivo(textoBruto);

      const prompt = `
Você é Liora, especialista em microlearning.
Com base na ANÁLISE abaixo do material, crie um plano de estudo completo:

ANÁLISE DO MATERIAL:
RESUMO GLOBAL:
${analise.resumoGlobal || ""}

TÓPICOS PRINCIPAIS:
${(analise.topicosPrincipais || []).join(" • ")}

Regras:
- Organize as sessões em progressão pedagógica (fundamentos → aprofundamento → aplicações).
- De 4 a 10 sessões, conforme a densidade do conteúdo.
- Cada nome de sessão deve ser específico e autoexplicativo.

Formato: JSON puro, ex:
[
  {"numero":1,"nome":"Fundamentos do tema X"},
  {"numero":2,"nome":"Conceitos intermediários de Y"}
]`;
      const rawPlano = await callLLM(
        "Você é Liora, responsável por transformar materiais em trilhas de estudo estruturadas.",
        prompt
      );
      const plano = JSON.parse(rawPlano);
      return { plano, resumoGlobal: analise.resumoGlobal || "" };
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO — AULA COMPLETA + CONTEXTO + RESUMO
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, sessaoAnterior = null, contextoGlobal = null) {
      const contextoSessaoAnterior = sessaoAnterior
        ? `Na sessão anterior o aluno estudou: "${sessaoAnterior.titulo || sessaoAnterior.nome}".`
        : `Esta é a primeira sessão do tema "${tema}".`;

      const blocoContextoGlobal = contextoGlobal
        ? `Use o seguinte RESUMO DO MATERIAL como contexto principal (não repita literalmente, use como base didática):

${contextoGlobal}`
        : "";

      const prompt = `
${contextoSessaoAnterior}
${blocoContextoGlobal}

Crie uma sessão de ESTUDO COMPLETA e BEM DETALHADA em JSON:

{
 "titulo": "Sessão ${numero} — ${nome}",
 "objetivo": "descrição clara e específica do que o aluno será capaz de compreender ou fazer ao final da sessão",
 "conteudo": {
   "introducao": "explicação introdutória de 2–3 parágrafos, contextualizando o tema da sessão",
   "conceitos": [
     "conceito 1 explicado com profundidade, incluindo definições, propriedades e nuances importantes",
     "conceito 2 explicado com a mesma profundidade",
     "conceito 3 ... (pode haver mais itens conforme necessário)"
   ],
   "exemplos": [
     "exemplo 1 bem explicado, passo a passo, conectando com os conceitos",
     "exemplo 2 igualmente detalhado, com variação de contexto"
   ],
   "aplicacoes": [
     "aplicação prática 1, mostrando como o conteúdo é usado na vida real, no trabalho ou em provas",
     "aplicação prática 2, em outro contexto relevante"
   ],
   "resumoRapido": "parágrafo único que resume a sessão, em linguagem simples, reforçando as ideias centrais e preparando o aluno para a próxima sessão"
 },
 "analogias": [
   "analogia 1 comparando o conceito central da sessão com algo do cotidiano",
   "analogia 2 (se fizer sentido)"
 ],
 "ativacao": [
   "pergunta reflexiva 1 relacionada diretamente à prática ou ao entendimento profundo",
   "pergunta 2 voltada à autoexplicação ou ao 'por que' do conceito"
 ],
 "quiz": {
   "pergunta": "pergunta de múltipla escolha alinhada ao ponto central da sessão",
   "alternativas": ["alternativa A","alternativa B","alternativa C"],
   "corretaIndex": 1,
   "explicacao": "explique por que a alternativa correta é correta e, se útil, por que as outras estão erradas"
 },
 "flashcards": [
   {"q":"pergunta curta 1 (conceito-chave)","a":"resposta direta, objetiva, mas precisa"},
   {"q":"pergunta curta 2","a":"resposta correspondente"}
 ]
}`;

      const raw = await callLLM(
        "Você é Liora, tutora de microlearning. Crie sessões densas, didáticas e bem estruturadas, como se fossem miniaulas.",
        prompt
      );
      const s = JSON.parse(raw);

      // Garante padrão de título
      s.titulo = `Sessão ${numero} — ${(s.titulo || nome).replace(/^Sessão\s*\d+\s*[—-]\s*/i, "")}`;
      return s;
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO PLANO
    // --------------------------------------------------------
    function renderPlanoResumo(plano) {
      els.plano.innerHTML = "";
      plano.forEach((p, index) => {
        const div = document.createElement("div");
        div.className = "liora-card-topico";
        div.textContent = `Sessão ${index + 1} — ${p.nome}`;
        div.addEventListener("click", () => {
          wizard.atual = index;
          renderWizard();
          window.scrollTo({ top: els.wizardContainer.offsetTop - 20, behavior: "smooth" });
        });
        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO WIZARD (conteúdo hierárquico + quiz)
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      // Limpa feedback do quiz ao mudar de sessão
      if (els.wizardQuizFeedback) {
        els.wizardQuizFeedback.textContent = "";
        els.wizardQuizFeedback.style.opacity = 0;
      }

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;
      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;

      const c = s.conteudo || {};
      els.wizardConteudo.innerHTML = `
        ${c.introducao ? `<div class="liora-section">
          <h5>Introdução</h5>
          <p>${c.introducao}</p>
        </div><hr class="liora-divider">` : ""}

        ${Array.isArray(c.conceitos) ? `<div class="liora-section">
          <h5>Conceitos principais</h5>
          <ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul>
        </div><hr class="liora-divider">` : ""}

        ${Array.isArray(c.exemplos) ? `<div class="liora-section">
          <h5>Exemplos</h5>
          <ul>${c.exemplos.map(x => `<li>${x}</li>`).join("")}</ul>
        </div><hr class="liora-divider">` : ""}

        ${Array.isArray(c.aplicacoes) ? `<div class="liora-section">
          <h5>Aplicações</h5>
          <ul>${c.aplicacoes.map(x => `<li>${x}</li>`).join("")}</ul>
        </div><hr class="liora-divider">` : ""}

        ${c.resumoRapido ? `<div class="liora-section">
          <h5>Resumo rápido</h5>
          <p>${c.resumoRapido}</p>
        </div>` : ""}
      `;

      els.wizardAnalogias.innerHTML = Array.isArray(s.analogias)
        ? s.analogias.map(a => `<p>${a}</p>`).join("")
        : "";

      els.wizardAtivacao.innerHTML = Array.isArray(s.ativacao)
        ? s.ativacao.map(q => `<li>${q}</li>`).join("")
        : "";

      // QUIZ
      els.wizardQuiz.innerHTML = "";
      const pergunta = document.createElement("p");
      pergunta.textContent = s.quiz.pergunta;
      els.wizardQuiz.appendChild(pergunta);

      const alternativas = s.quiz.alternativas.map((alt, i) => ({
        texto: String(alt).replace(/\n/g, " ").replace(/<\/?[^>]+(>|$)/g, ""),
        correta: i === Number(s.quiz.corretaIndex),
      }));

      // Embaralha alternativas (Fisher-Yates)
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
          opt.querySelector("input").checked = true;

          if (!els.wizardQuizFeedback) return;

          els.wizardQuizFeedback.style.opacity = 0;
          setTimeout(() => {
            if (altObj.correta) {
              els.wizardQuizFeedback.textContent = `✅ Correto! ${s.quiz.explicacao}`;
              els.wizardQuizFeedback.style.color = "var(--brand)";
              tentativasErradas = 0;
            } else {
              tentativasErradas++;
              if (tentativasErradas >= 2) {
                els.wizardQuizFeedback.textContent = `💡 Dica: ${s.quiz.explicacao}`;
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

      els.wizardFlashcards.innerHTML = Array.isArray(s.flashcards)
        ? s.flashcards.map(f => `<li><b>${f.q}</b>: ${f.a}</li>`).join("")
        : "";

      if (els.wizardProgressBar && wizard.sessoes.length > 0) {
        els.wizardProgressBar.style.width =
          `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
      }
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO
    // --------------------------------------------------------
    els.wizardVoltar.addEventListener("click", () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
        saveProgress();
      }
    });

    els.wizardProxima.addEventListener("click", () => {
      if (wizard.atual < wizard.sessoes.length - 1) {
        wizard.atual++;
        renderWizard();
        saveProgress();
      } else {
        atualizarStatus("tema", "Tema concluído!", 100);
      }
    });

    // --------------------------------------------------------
    // FLUXO UNIFICADO DE GERAÇÃO (TEMA / UPLOAD)
    // --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo, textoArquivo = null) {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;
      btn.disabled = true;
      atualizarStatus(modo, "Criando plano...", 0);

      try {
        let plano;
        let contextoGlobal = null;

        if (modo === "upload" && textoArquivo) {
          const { plano: planoGerado, resumoGlobal } =
            await gerarPlanoDeSessoesFromConteudo(textoArquivo, nivel);
          plano = planoGerado;
          contextoGlobal = resumoGlobal;
        } else {
          plano = await gerarPlanoDeSessoes(tema, nivel);
        }

        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (let i = 0; i < plano.length; i++) {
          const sessaoAnterior = i > 0 ? wizard.sessoes[i - 1] || null : null;
          atualizarStatus(
            modo,
            `Sessão ${i + 1}/${plano.length}: ${plano[i].nome}`,
            ((i + 1) / plano.length) * 100
          );
          const sessao = await gerarSessao(
            tema,
            nivel,
            i + 1,
            plano[i].nome,
            sessaoAnterior,
            contextoGlobal
          );
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus(modo, "Sessões concluídas!", 100);
        renderWizard();

      } catch (e) {
        console.error(e);
        alert("Erro ao gerar o plano.");
      } finally {
        btn.disabled = false;
      }
    }

    // --------------------------------------------------------
    // BOTÕES (TEMA / UPLOAD)
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", () => {
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");
      gerarFluxo(tema, nivel, "tema");
    });

    els.btnGerarUpload.addEventListener("click", async () => {
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;
      if (!file) return alert("Selecione um arquivo.");
      const tema = file.name.split(".")[0];
      const textoArquivo = await file.text(); // Upload inteligente: usa o conteúdo
      gerarFluxo(tema, nivel, "upload", textoArquivo);
    });

    // Atualiza nome do arquivo no upload
    els.inpFile.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const uploadText = document.getElementById("upload-text");
      const spinner = document.getElementById("upload-spinner");
      if (uploadText) {
        uploadText.textContent = file
          ? `Selecionado: ${file.name}`
          : "Clique ou arraste um arquivo (.txt, .pdf)";
      }
      if (spinner) spinner.style.display = "none";
    });

    console.log("🟢 core.js v49 carregado com sucesso (upload inteligente + aulas densas)");
  });
})();
