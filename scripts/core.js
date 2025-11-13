// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v48)
// Upload validado (somente PDF + limite 10 MB) + preserva v47
// Estrutura hierárquica + continuidade entre sessões
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v48...");

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
    // 🌗 TEMA
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
      const barra = document.getElementById(
        modo === "tema" ? "barra-tema-fill" : "barra-upload-fill"
      );
      if (barra && progresso !== null) barra.style.width = `${progresso}%`;
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
    const key = (tema, nivel) =>
      `liora:wizard:${tema.toLowerCase()}::${nivel.toLowerCase()}`;
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
    // GERAÇÃO DE PLANO
    // --------------------------------------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Crie um plano de sessões para o tema "${tema}" (nível: ${nivel}).
Formato JSON:
[
 {"numero":1,"nome":"Fundamentos"},
 {"numero":2,"nome":"Aplicações"}
]`;
      const raw = await callLLM("Você é Liora, especialista em microlearning.", prompt);
      return JSON.parse(raw);
    }

    // --------------------------------------------------------
    // GERAÇÃO DE SESSÃO — HIERARQUIA + CONTEXTO
    // --------------------------------------------------------
    async function gerarSessao(tema, nivel, numero, nome, sessaoAnterior = null) {
      const contexto = sessaoAnterior
        ? `Na sessão anterior o aluno estudou "${sessaoAnterior.nome}". Agora avance naturalmente para "${nome}". Evite repetição.`
        : `Esta é a primeira sessão do tema "${tema}".`;

      const prompt = `
${contexto}
Crie uma sessão estruturada:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"resultado claro",
 "conteudo":{
   "introducao":"texto mais completo",
   "conceitos":["conceito 1","conceito 2"],
   "exemplos":["exemplo 1","exemplo 2"],
   "aplicacoes":["aplicação 1","aplicação 2"],
   "resumo":"fechamento rápido"
 },
 "analogias":["comparação didática"],
 "ativacao":["pergunta 1","pergunta 2"],
 "quiz":{"pergunta":"?","alternativas":["a","b","c"],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."}]
}`;
      const raw = await callLLM("Você é Liora, tutora especializada em microlearning.", prompt);
      return JSON.parse(raw);
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
          window.scrollTo({
            top: els.wizardContainer.offsetTop - 20,
            behavior: "smooth",
          });
        });
        els.plano.appendChild(div);
      });
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO WIZARD
    // --------------------------------------------------------
    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      // limpa quiz
      els.wizardQuizFeedback.textContent = "";
      els.wizardQuizFeedback.style.opacity = 0;

      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent = wizard.tema;
      els.wizardTitulo.textContent = s.titulo;
      els.wizardObjetivo.textContent = s.objetivo;

      const c = s.conteudo;
      els.wizardConteudo.innerHTML = `
        <div class="liora-section"><h5>INTRODUÇÃO</h5><p>${c.introducao}</p></div><hr class="liora-divider">
        <div class="liora-section"><h5>CONCEITOS PRINCIPAIS</h5><ul>${c.conceitos.map(x=>`<li>${x}</li>`).join("")}</ul></div><hr class="liora-divider">
        <div class="liora-section"><h5>EXEMPLOS</h5><ul>${c.exemplos.map(x=>`<li>${x}</li>`).join("")}</ul></div><hr class="liora-divider">
        <div class="liora-section"><h5>APLICAÇÕES</h5><ul>${c.aplicacoes.map(x=>`<li>${x}</li>`).join("")}</ul></div><hr class="liora-divider">
        <div class="liora-section"><h5>RESUMO RÁPIDO</h5><p>${c.resumo}</p></div>
      `;

      els.wizardAnalogias.innerHTML = s.analogias.map(a => `<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML = s.ativacao.map(q => `<li>${q}</li>`).join("");

      // QUIZ ➜ embaralhado
      els.wizardQuiz.innerHTML = "";
      const alternativas = s.quiz.alternativas.map((text, idx)=>({
        texto:text,
        correta: idx === Number(s.quiz.corretaIndex)
      }));

      for (let i = alternativas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
      }

      const pergunta = document.createElement("p");
      pergunta.textContent = s.quiz.pergunta;
      els.wizardQuiz.appendChild(pergunta);

      let tentativas = 0;
      alternativas.forEach((alt,i)=>{
        const opt = document.createElement("label");
        opt.className="liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz" value="${i}"><span>${alt.texto}</span>`;
        
        opt.addEventListener("click", () => {
          document.querySelectorAll(".liora-quiz-option").forEach(o=>o.classList.remove("selected"));
          opt.classList.add("selected");
          opt.querySelector("input").checked=true;

          els.wizardQuizFeedback.style.opacity=0;
          setTimeout(()=>{
            if(alt.correta){
              els.wizardQuizFeedback.textContent = `✅ Correto! ${s.quiz.explicacao}`;
              els.wizardQuizFeedback.style.color = "var(--brand)";
              tentativas=0;
            } else {
              tentativas++;
              if(tentativas>=2){
                els.wizardQuizFeedback.textContent = `💡 Dica: ${s.quiz.explicacao}`;
                els.wizardQuizFeedback.style.color = "var(--brand)";
              } else {
                els.wizardQuizFeedback.textContent = "❌ Tente novamente.";
                els.wizardQuizFeedback.style.color = "var(--muted)";
              }
            }
            els.wizardQuizFeedback.style.opacity=1;
          },80);
        });

        els.wizardQuiz.appendChild(opt);
      });

      els.wizardFlashcards.innerHTML = s.flashcards.map(
        f => `<li><b>${f.q}</b>: ${f.a}</li>`
      ).join("");

      els.wizardProgressBar.style.width =
        `${((wizard.atual+1) / wizard.sessoes.length)*100}%`;
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO
    // --------------------------------------------------------
    els.wizardVoltar.addEventListener("click", () => {
      if (wizard.atual > 0){
        wizard.atual--;
        renderWizard();
        saveProgress();
      }
    });

    els.wizardProxima.addEventListener("click", () => {
      if (wizard.atual < wizard.sessoes.length - 1){
        wizard.atual++;
        renderWizard();
        saveProgress();
      } else {
        atualizarStatus("tema", "🎉 Tema concluído!", 100);
      }
    });

    // --------------------------------------------------------
    // FLUXO ÚNICO (tema + upload)
    // --------------------------------------------------------
    async function gerarFluxo(tema, nivel, modo) {
      const btn = modo === "tema" ? els.btnGerar : els.btnGerarUpload;
      btn.disabled = true;
      atualizarStatus(modo, "🧩 Criando plano...", 0);

      try {
        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual:0 };
        renderPlanoResumo(plano);

        for(let i=0;i<plano.length;i++){
          const anterior = i>0 ? plano[i-1] : null;
          atualizarStatus(modo, `⏳ Sessão ${i+1}/${plano.length}: ${plano[i].nome}`,
            ((i+1)/plano.length)*100);
          const sessao = await gerarSessao(tema, nivel, i+1, plano[i].nome, anterior);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        atualizarStatus(modo,"✅ Sessões concluídas!",100);
        renderWizard();

      } catch {
        alert("Erro ao gerar plano.");
      } finally {
        btn.disabled=false;
      }
    }

    // --------------------------------------------------------
    // BOTÕES GERAR
    // --------------------------------------------------------
    els.btnGerar.addEventListener("click", ()=>{
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if(!tema) return alert("Digite um tema.");
      gerarFluxo(tema,nivel,"tema");
    });

    els.btnGerarUpload.addEventListener("click", ()=>{
      const file = els.inpFile.files?.[0];
      const nivel = els.selNivel.value;
      if(!file) return alert("Selecione um arquivo.");
      const tema = file.name.replace(/\.pdf$/i,"");
      gerarFluxo(tema,nivel,"upload");
    });

    // --------------------------------------------------------
    // 🗂️ VALIDAÇÃO DE ARQUIVO — SOMENTE PDF + LIMITE DE TAMANHO
    // --------------------------------------------------------
    const MAX_SIZE_MB = 10;

    els.inpFile.addEventListener("change",(e)=>{
      const file = e.target.files?.[0];
      const uploadText = document.getElementById("upload-text");
      const spinner = document.getElementById("upload-spinner");

      if(!file){
        uploadText.textContent="Clique ou arraste um arquivo (.pdf)";
        return;
      }

      // 🛑 Apenas PDF
      if(file.type !== "application/pdf"){
        uploadText.textContent="❌ Apenas arquivos PDF são aceitos.";
        els.inpFile.value="";
        return;
      }

      // 🛑 Máximo permitido
      const sizeMB = file.size/(1024*1024);
      if(sizeMB > MAX_SIZE_MB){
        uploadText.textContent=`❌ Arquivo muito grande (${sizeMB.toFixed(1)}MB). Máx: ${MAX_SIZE_MB}MB.`;
        els.inpFile.value="";
        return;
      }

      // ✔ Arquivo válido
      uploadText.textContent=`Selecionado: ${file.name}`;
      if(spinner) spinner.style.display="none";
    });

    console.log("🟢 core.js v48 carregado com sucesso");
  });
})();
