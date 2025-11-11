// 🔵 Liora Core v38 — tema/upload → plano → sessões completas
console.log("🔵 Inicializando Liora Core v38...");

document.addEventListener("DOMContentLoaded", () => {
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
    ctx: document.getElementById("ctx"),

    // upload
    inpFile: document.getElementById("inp-file"),
    uploadText: document.getElementById("upload-text"),
    btnGerarUpload: document.getElementById("btn-gerar-upload"),
    statusUpload: document.getElementById("status-upload"),

    // plano e wizard
    plano: document.getElementById("plano"),
    wizardContainer: document.getElementById("liora-sessoes"),
    wizardTema: document.getElementById("liora-tema-ativo"),
    wizardProgressBar: document.getElementById("liora-progress-bar"),
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
    themeBtn: document.getElementById("btn-theme"),
  };

  // ===== Tema (light/dark) =====
  (function themeSetup(){
    function apply(theme){
      document.documentElement.classList.remove("light","dark");
      document.body.classList.remove("light","dark");
      document.documentElement.classList.add(theme);
      document.body.classList.add(theme);
      els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      localStorage.setItem("liora_theme", theme);
    }
    apply(localStorage.getItem("liora_theme") || "dark");
    els.themeBtn.addEventListener("click", ()=> {
      apply(document.documentElement.classList.contains("light") ? "dark" : "light");
    });
  })();

  // ===== Alterna modo =====
  function setMode(mode){
    const tema = mode === "tema";
    els.painelTema.classList.toggle("hidden", !tema);
    els.painelUpload.classList.toggle("hidden",  tema);
    els.modoTema.classList.toggle("selected", tema);
    els.modoUpload.classList.toggle("selected", !tema);
  }
  els.modoTema.onclick = () => setMode("tema");
  els.modoUpload.onclick = () => setMode("upload");
  setMode("tema");

  // ===== Estado =====
  let wizard = { tema:null, nivel:null, plano:[], sessoes:[], atual:0 };

  // ===== Helpers =====
  function renderPlanoResumo(plano){
    els.plano.innerHTML = "";
    if (!plano?.length) {
      els.plano.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano gerado.</p>`;
      return;
    }
    plano.forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "liora-card-topico";
      div.textContent = `Sessão ${p.numero} — ${p.nome}`;
      div.addEventListener("click", () => {
        wizard.atual = i;
        renderWizard();
        window.scrollTo({ top: els.wizardContainer.offsetTop - 16, behavior: "smooth" });
      });
      els.plano.appendChild(div);
    });
  }

  function renderWizard(){
    const s = wizard.sessoes[wizard.atual];
    if (!s) return;
    els.wizardContainer.classList.remove("hidden");

    els.wizardTema.textContent = wizard.tema;

    const pct = ((wizard.atual+1)/wizard.sessoes.length)*100;
    els.wizardProgressBar.style.width = `${pct}%`;

    els.wizardTitulo.textContent = s.titulo || `Sessão ${wizard.atual+1} — ${s.nome||""}`;
    els.wizardObjetivo.textContent = s.objetivo || "";
    els.wizardConteudo.innerHTML = (s.conteudo||[]).map(p=>`<p>${p}</p>`).join("");
    els.wizardAnalogias.innerHTML = (s.analogias||[]).map(a=>`<p>${a}</p>`).join("");
    els.wizardAtivacao.innerHTML = (s.ativacao||[]).map(q=>`<li>${q}</li>`).join("");

    // quiz
    els.wizardQuiz.innerHTML = "";
    els.wizardQuizFeedback.textContent = "";
    if (s.quiz?.alternativas?.length) {
      s.quiz.alternativas.forEach((alt, i) => {
        const opt = document.createElement("label");
        opt.className = "liora-quiz-option";
        opt.innerHTML = `<input type="radio" name="quiz" value="${i}"> <span>${alt}</span>`;
        opt.addEventListener("click", () => {
          els.wizardQuizFeedback.textContent =
            i === Number(s.quiz.corretaIndex) ? "Correto!" : "Tente novamente.";
        });
        els.wizardQuiz.appendChild(opt);
      });
    }

    els.wizardFlashcards.innerHTML = (s.flashcards||[])
      .map(f=>`<li><strong>${f.q}</strong> — ${f.a}</li>`).join("");
  }

  async function gerarSessaoLLM(tema, nivel, numero, nome){
    const prompt = `
Gere a sessão ${numero} do tema "${tema}" (nível: ${nivel}).
Retorne JSON PURO:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"resultado claro e mensurável",
 "conteudo":["tópico 1","tópico 2","tópico 3"],
 "analogias":["exemplo 1","exemplo 2"],
 "ativacao":["pergunta 1","pergunta 2"],
 "quiz":{"pergunta":"...?","alternativas":["a","b","c"],"corretaIndex":1,"explicacao":"por quê"},
 "flashcards":[{"q":"pergunta","a":"resposta"}]
}
Não repita prefixos "Sessão X —" no campo 'nome' interno, se já houver.
`;
    const res = await fetch("/api/liora", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ system:"Você é Liora.", user: prompt })
    });
    const json = await res.json();
    const s = JSON.parse(json.output);
    // Normaliza título
    const base = (s.titulo || `${nome}`).replace(/^Sessão\s*\d+\s*[—-]\s*/i,"");
    s.titulo = `Sessão ${numero} — ${base}`;
    return s;
  }

  // ===== Navegação wizard =====
  els.wizardVoltar.onclick = () => {
    if (wizard.atual>0){ wizard.atual--; renderWizard(); }
  };
  els.wizardProxima.onclick = () => {
    if (wizard.atual < wizard.sessoes.length-1){ wizard.atual++; renderWizard(); }
  };

  // ===== Gerar por TEMA =====
  els.btnGerar.onclick = async () => {
    const tema  = (els.inpTema.value||"").trim();
    const nivel = els.selNivel.value;
    if (!tema) return alert("Digite um tema.");

    els.btnGerar.disabled = true;
    els.ctx.textContent = "Criando plano...";

    try {
      const plan = await window.generatePlanFromTemaAI(tema, nivel);
      wizard = { tema: plan.tema || tema, nivel, plano: plan.sessoes, sessoes: [], atual: 0 };
      renderPlanoResumo(plan.sessoes);

      // gera sessões completas
      for (let i=0; i<plan.sessoes.length; i++){
        els.ctx.textContent = `Gerando sessão ${i+1}/${plan.sessoes.length}: ${plan.sessoes[i].nome}`;
        const sessao = await gerarSessaoLLM(wizard.tema, nivel, plan.sessoes[i].numero, plan.sessoes[i].nome);
        wizard.sessoes.push(sessao);
      }
      els.ctx.textContent = "";
      renderWizard();

    } catch (e) {
      console.error(e);
      alert("Erro ao gerar plano por tema.");
    } finally {
      els.btnGerar.disabled = false;
    }
  };

  // ===== Gerar por UPLOAD =====
  els.inpFile.onchange = (e) => {
    const f = e.target.files?.[0];
    els.uploadText.textContent = f ? `Selecionado: ${f.name}` : "Clique ou arraste um arquivo (.txt, .pdf)";
  };

  els.btnGerarUpload.onclick = async () => {
    const nivel = els.selNivel.value;
    const file = els.inpFile.files?.[0];
    if (!file) return alert("Selecione um arquivo.");

    els.btnGerarUpload.disabled = true;
    els.statusUpload.textContent = "Lendo arquivo...";

    try {
      await window.processarArquivoUpload(file);
      els.statusUpload.textContent = "Criando plano...";
      const plan = await window.generatePlanFromUploadAI(nivel);

      wizard = { tema: plan.tema || file.name, nivel, plano: plan.sessoes, sessoes: [], atual: 0 };
      renderPlanoResumo(plan.sessoes);

      // gera sessões completas
      for (let i=0; i<plan.sessoes.length; i++){
        els.statusUpload.textContent = `Gerando sessão ${i+1}/${plan.sessoes.length}: ${plan.sessoes[i].nome}`;
        const sessao = await gerarSessaoLLM(wizard.tema, nivel, plan.sessoes[i].numero, plan.sessoes[i].nome);
        wizard.sessoes.push(sessao);
      }
      els.statusUpload.textContent = "Pronto.";
      renderWizard();

    } catch (e) {
      console.error(e);
      alert("Erro ao gerar plano via upload.");
    } finally {
      setTimeout(()=> els.statusUpload.textContent="", 1000);
      els.btnGerarUpload.disabled = false;
    }
  };

  console.log("🟢 core.js v38 carregado");
});
