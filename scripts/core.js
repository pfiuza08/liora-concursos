// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v42)
// Tema / Upload + Plano + Wizard + Barra de Progresso
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v42...");

  document.addEventListener("DOMContentLoaded", () => {

    const els = {
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),
      uploadZone: document.getElementById("upload-zone"),
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),
      uploadText: document.getElementById("upload-text"),
      uploadSpinner: document.getElementById("upload-spinner"),
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
      progressBar: document.getElementById("liora-progress-bar"),
      themeBtn: document.getElementById("btn-theme"),
    };

    // 🌗 Tema
    (function themeSetup() {
      function apply(theme) {
        document.documentElement.classList.remove("light","dark");
        document.documentElement.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        els.themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
      }
      apply(localStorage.getItem("liora_theme") || "dark");
      els.themeBtn.addEventListener("click", () => {
        const newTheme = document.documentElement.classList.contains("light") ? "dark" : "light";
        apply(newTheme);
      });
    })();

    // Estado global
    let wizard = { tema:null, nivel:null, plano:[], sessoes:[], atual:0 };
    const key = (tema, nivel) => `liora:wizard:${tema}:${nivel}`;
    const save = () => localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    const load = (t, n) => JSON.parse(localStorage.getItem(key(t, n)) || "null");

    // Alternar modo
    function setMode(m) {
      const tema = m === "tema";
      els.painelTema.classList.toggle("hidden", !tema);
      els.painelUpload.classList.toggle("hidden", tema);
      els.modoTema.classList.toggle("selected", tema);
      els.modoUpload.classList.toggle("selected", !tema);
    }
    els.modoTema.onclick = () => setMode("tema");
    els.modoUpload.onclick = () => setMode("upload");
    setMode("tema");

    // Chamada API
    async function callLLM(system, user) {
      const r = await fetch("/api/liora", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system,user})
      });
      const j = await r.json().catch(()=>({}));
      if(!j.output) throw new Error("Resposta inválida da IA");
      return j.output;
    }

    // Gerar plano
    async function gerarPlano(tema,nivel) {
      const prompt = `Crie um plano de sessões para o tema "${tema}" (nível: ${nivel}).
Formato: JSON puro [{"numero":1,"nome":"Fundamentos"}]`;
      const raw = await callLLM("Você é Liora, especialista em microlearning.", prompt);
      const arr = JSON.parse(raw);
      return arr.map((s,i)=>({numero:s.numero??i+1,nome:s.nome??`Sessão ${i+1}`}));
    }

    // Gerar sessão
    async function gerarSessao(tema,nivel,num,nome){
      const prompt = `Gere a sessão ${num} do tema "${tema}". JSON:
{"titulo":"Sessão ${num} — ${nome}","objetivo":"...","conteudo":["p1"],"analogias":["a1"],"ativacao":["q1"],"quiz":{"pergunta":"?","alternativas":["a","b"],"corretaIndex":1,"explicacao":"..."},"flashcards":[{"q":"...","a":"..."}]}`;
      const raw = await callLLM("Você é Liora.", prompt);
      const s = JSON.parse(raw);
      s.titulo = `Sessão ${num} — ${(s.titulo||nome).replace(/^Sessão\\s*\\d+\\s*[—-]\\s*/i,"")}`;
      return s;
    }

    // Render plano
    function renderPlano(plano){
      els.plano.innerHTML="";
      plano.forEach((p,i)=>{
        const d=document.createElement("div");
        d.className="liora-card-topico";
        d.textContent=`Sessão ${i+1} — ${p.nome}`;
        d.onclick=()=>{
          wizard.atual=i;
          renderSessao();
          window.scrollTo({top:els.wizardContainer.offsetTop-20,behavior:"smooth"});
        };
        els.plano.appendChild(d);
      });
    }

    // Render sessão
    function renderSessao(){
      const s=wizard.sessoes[wizard.atual];
      if(!s)return;
      els.wizardContainer.classList.remove("hidden");
      els.wizardTema.textContent=wizard.tema;
      els.wizardTitulo.textContent=s.titulo;
      els.wizardObjetivo.textContent=s.objetivo;
      els.wizardConteudo.innerHTML=s.conteudo.map(p=>`<p>${p}</p>`).join("");
      els.wizardAnalogias.innerHTML=s.analogias.map(a=>`<p>${a}</p>`).join("");
      els.wizardAtivacao.innerHTML=s.ativacao.map(q=>`<li>${q}</li>`).join("");
      // Quiz
      els.wizardQuiz.innerHTML="";
      s.quiz.alternativas.forEach((alt,i)=>{
        const o=document.createElement("div");
        o.className="liora-quiz-option";
        o.innerHTML=`<span>${alt}</span>`;
        o.onclick=()=>{
          document.querySelectorAll(".liora-quiz-option").forEach(el=>el.classList.remove("selected"));
          o.classList.add("selected");
          els.wizardQuizFeedback.textContent=
            i===Number(s.quiz.corretaIndex)?`✅ Correto! ${s.quiz.explicacao}`:"❌ Tente novamente.";
        };
        els.wizardQuiz.appendChild(o);
      });
      els.wizardFlashcards.innerHTML=s.flashcards.map(f=>`<li><strong>${f.q}</strong>: ${f.a}</li>`).join("");
      els.progressBar.style.width=`${((wizard.atual+1)/wizard.sessoes.length)*100}%`;
    }

    // Navegação
    els.wizardVoltar.onclick=()=>{
      if(wizard.atual>0){wizard.atual--;renderSessao();save();}
    };
    els.wizardProxima.onclick=()=>{
      if(wizard.atual<wizard.sessoes.length-1){wizard.atual++;renderSessao();save();}
    };

    // Botão gerar (tema)
    els.btnGerar.onclick=async()=>{
      const tema=els.inpTema.value.trim();
      const nivel=els.selNivel.value;
      if(!tema)return alert("Digite um tema.");
      els.btnGerar.disabled=true;
      els.ctx.textContent="Gerando plano...";
      try{
        const plano=await gerarPlano(tema,nivel);
        wizard={tema,nivel,plano,sessoes:[],atual:0};
        renderPlano(plano);
        for(let i=0;i<plano.length;i++){
          els.ctx.textContent=`Gerando sessão ${i+1}/${plano.length}...`;
          const s=await gerarSessao(tema,nivel,plano[i].numero,plano[i].nome);
          wizard.sessoes.push(s);
          els.progressBar.style.width=`${((i+1)/plano.length)*100}%`;
          save();
        }
        els.ctx.textContent="✅ Sessões prontas!";
        renderSessao();
      }catch(e){console.error(e);alert("Erro ao gerar plano.");}
      finally{els.btnGerar.disabled=false;}
    };

    // Upload
    els.inpFile.onchange=e=>{
      const f=e.target.files?.[0];
      if(f)els.uploadText.textContent=`Selecionado: ${f.name}`;
    };
    els.btnGerarUpload.onclick=async()=>{
      const nivel=els.selNivel.value;
      const file=els.inpFile.files?.[0];
      if(!file)return alert("Selecione um arquivo.");
      els.statusUpload.textContent="Processando arquivo...";
      els.uploadSpinner.style.display="inline-block";
      try{
        await window.processarArquivoUpload(file);
        const out=await window.generatePlanFromUploadAI(nivel);
        const plano=(out?.sessoes||out?.plano||[]).map((s,i)=>({numero:s.numero??i+1,nome:s.nome??s.titulo??`Sessão ${i+1}`}));
        wizard={tema:file.name,nivel,plano,sessoes:[],atual:0};
        renderPlano(plano);
        for(let i=0;i<plano.length;i++){
          els.statusUpload.textContent=`Gerando sessão ${i+1}/${plano.length}...`;
          const s=await gerarSessao(wizard.tema,nivel,plano[i].numero,plano[i].nome);
          wizard.sessoes.push(s);
          els.progressBar.style.width=`${((i+1)/plano.length)*100}%`;
          save();
        }
        els.statusUpload.textContent="✅ Sessões concluídas!";
        renderSessao();
      }catch(e){console.error(e);alert("Erro ao processar upload.");}
      finally{els.uploadSpinner.style.display="none";}
    };

  });
})();
