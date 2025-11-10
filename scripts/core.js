// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v24)
// Tema robusto + Alternância Tema/Upload (.selected)
// Upload UX + "Gerar plano" (tema & upload)
// Resumo do plano (direita) + Wizard abaixo do grid
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core v24...");

  document.addEventListener("DOMContentLoaded", () => {
    // -------------------------
    // MAPA DE ELEMENTOS
    // -------------------------
    const els = {
      // toggles
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),

      // tema estudo
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      // upload
      uploadZone: document.getElementById("upload-zone"),
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),
      uploadIcon: document.getElementById("upload-icon"),
      uploadText: document.getElementById("upload-text"),
      uploadSpinner: document.getElementById("upload-spinner"),

      // painel direito (resumo)
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

      // wizard (abaixo do grid)
      wizardContainer: document.getElementById("liora-sessoes"),
      wizardTema: document.getElementById("liora-tema-ativo"),
      wizardProgressBar: document.getElementById("liora-progress-bar"),
      wizardProgressLabel: document.getElementById("liora-progress-label"),
      wizardTitulo: document.getElementById("liora-sessao-titulo"),
      wizardObjetivo: document.getElementById("liora-sessao-objetivo"),
      wizardConteudo: document.getElementById("liora-sessao-conteudo"),
      wizardAnalogias: document.getElementById("liora-sessao-analogias"),
      wizardAtivacao: document.getElementById("liora-sessao-ativacao"),
      wizardQuiz: document.getElementById("liora-sessao-quiz"),
      wizardQuizFeedback: document.getElementById("liora-sessao-quiz-feedback"),
      wizardFlashcards: document.getElementById("liora-sessao-flashcards"),
      wizardVoltar: document.getElementById("liora-btn-voltar"),
      wizardSalvar: document.getElementById("liora-btn-salvar"),
      wizardProxima: document.getElementById("liora-btn-proxima"),

      // botão tema UI
      themeBtn: document.getElementById("btn-theme"),
    };

    // -------------------------
    // THEME (light/dark) — robusto
    // -------------------------
    (function setupTheme() {
      const btn = els.themeBtn;

      function applyTheme(theme) {
        document.documentElement.classList.remove("light", "dark");
        document.body.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.body.classList.add(theme);
        localStorage.setItem("liora_theme", theme);
        if (btn) btn.textContent = theme === "light" ? "☀️" : "🌙";
      }

      function initialTheme() {
        const saved = localStorage.getItem("liora_theme");
        if (saved === "light" || saved === "dark") return saved;
        const prefersLight = window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: light)").matches;
        return prefersLight ? "light" : "dark";
      }

      applyTheme(initialTheme());

      btn && btn.addEventListener("click", () => {
        const current = document.documentElement.classList.contains("light") ? "light" : "dark";
        applyTheme(current === "light" ? "dark" : "light");
      });

      const media = window.matchMedia("(prefers-color-scheme: light)");
      media.onchange = () => {
        const saved = localStorage.getItem("liora_theme");
        if (!saved) applyTheme(media.matches ? "light" : "dark");
      };
    })();

    // -------------------------
    // ESTADO
    // -------------------------
    let wizard = { tema: null, nivel: null, plano: [], sessoes: [], atual: 0 };
    const key = (tema, nivel) => `liora:wizard:${(tema||"").toLowerCase()}::${(nivel||"").toLowerCase()}`;
    const saveProgress = () => {
      if (!wizard.tema || !wizard.nivel) return;
      localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
    };
    const loadProgress = (t, n) => {
      try { return JSON.parse(localStorage.getItem(key(t, n)) || "null"); } catch { return null; }
    };

    // -------------------------
    // ALTERNÂNCIA MODO TEMA/UPLOAD (com .selected)
    // -------------------------
    function setMode(mode) {
      const tema = mode === "tema";
      els.painelTema?.classList.toggle("hidden", !tema);
      els.painelUpload?.classList.toggle("hidden", tema);
      els.modoTema?.classList.toggle("selected", tema);
      els.modoUpload?.classList.toggle("selected", !tema);
    }
    els.modoTema?.addEventListener("click", () => setMode("tema"));
    els.modoUpload?.addEventListener("click", () => setMode("upload"));
    setMode("tema"); // default

    // -------------------------
    // API Liora
    // -------------------------
    async function callLLM(system, user) {
      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user })
      });
      if (!res.ok) {
        const text = await res.text().catch(()=> "");
        throw new Error(`Erro API (${res.status}): ${text}`);
      }
      const json = await res.json().catch(()=> ({}));
      if (!json?.output) throw new Error("Resposta inválida da IA");
      return json.output;
    }

    // -------------------------
    // GERAÇÕES (Tema)
    // -------------------------
    async function gerarPlanoDeSessoes(tema, nivel) {
      const prompt = `
Gere um plano de 5 a 7 sessões para o tema "${tema}" (nível: ${nivel}).
Responda com JSON puro (array), ex:
[
  {"numero":1,"nome":"Fundamentos"},
  {"numero":2,"nome":"Aplicações"}
]`.trim();
      const raw = await callLLM("Você é Liora, especialista em microlearning.", prompt);
      let arr;
      try { arr = JSON.parse(raw); } catch { throw new Error("Plano em formato inválido"); }
      return (arr || []).map((s, i) => ({
        numero: Number(s.numero ?? i+1),
        nome: String(s.nome ?? s.titulo ?? `Sessão ${i+1}`)
      }));
    }

    async function gerarSessao(tema, nivel, numero, nome) {
      const prompt = `
Gere a sessão ${numero} do tema "${tema}" (nível: ${nivel}) sobre "${nome}".
JSON EXATO:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"resultado claro",
 "conteudo":["p1","p2","p3"],
 "analogias":["a1","a2"],
 "ativacao":["q1","q2","q3"],
 "quiz":{"pergunta":"?","alternativas":["a) ...","b) ...","c) ..."],"corretaIndex":1,"explicacao":"..."},
 "flashcards":[{"q":"...","a":"..."},{"q":"...","a":"..."}]
}`.trim();
      const raw = await callLLM("Você é Liora.", prompt);
      let s;
      try { s = JSON.parse(raw); } catch { throw new Error("Sessão em formato inválido"); }
      // saneamento mínimo
      s.titulo = s.titulo || `Sessão ${numero} — ${nome}`;
      s.objetivo = s.objetivo || `Entender ${nome}`;
      s.conteudo = Array.isArray(s.conteudo) ? s.conteudo : [String(s.conteudo || "")];
      s.analogias = Array.isArray(s.analogias) ? s.analogias : [];
      s.ativacao = Array.isArray(s.ativacao) ? s.ativacao : [];
      s.quiz = s.quiz || { pergunta:"", alternativas:["a)","b)","c)"], corretaIndex:0, explicacao:"" };
      if (!Array.isArray(s.quiz.alternativas)) s.quiz.alternativas = ["a)","b)","c)"];
      s.flashcards = Array.isArray(s.flashcards) ? s.flashcards : [];
      return s;
    }

    // -------------------------
    // RENDER: RESUMO DO PLANO (painel direito)
    // -------------------------
    // -------------------------
// RENDER: RESUMO DO PLANO (direita)
// -------------------------
function renderPlanoResumo(plano) {
  if (!els.plano) return;
  els.plano.innerHTML = "";

  if (!Array.isArray(plano) || !plano.length) {
    els.plano.innerHTML = `<p class="text-[var(--muted)]">Nenhum plano gerado ainda.</p>`;
    return;
  }

  // ✅ apenas lista de tópicos, sem frase
  const ul = document.createElement("ul");
  ul.className = "liora-topico-lista";

  plano.forEach((p) => {
    const li = document.createElement("li");
    li.className = "liora-topico-item";
    li.textContent = `Sessão ${p.numero} — ${p.nome}`;
    ul.appendChild(li);
  });

  els.plano.appendChild(ul);
}

    // -------------------------
    // WIZARD (abaixo do grid)
    // -------------------------
    function ensureWizardVisible() {
      if (!els.wizardContainer) return;
      els.wizardContainer.classList.remove("hidden");
      els.wizardContainer.style.display = "block";
    }

    function renderWizard() {
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      ensureWizardVisible();

      els.wizardTema && (els.wizardTema.textContent = wizard.tema || "");
      els.wizardProgressLabel && (els.wizardProgressLabel.textContent = `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`);
      els.wizardProgressBar && (els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`);

      els.wizardTitulo && (els.wizardTitulo.textContent = s.titulo);
      els.wizardObjetivo && (els.wizardObjetivo.textContent = s.objetivo);

      els.wizardConteudo && (els.wizardConteudo.innerHTML = (s.conteudo || []).map(p => `<p>${p}</p>`).join(""));
      els.wizardAnalogias && (els.wizardAnalogias.innerHTML = (s.analogias || []).map(a => `<p>${a}</p>`).join(""));
      els.wizardAtivacao && (els.wizardAtivacao.innerHTML = (s.ativacao || []).map(q => `<li>${q}</li>`).join(""));

      // Quiz (pergunta + alternativas alinhadas)
      if (els.wizardQuiz) {
        els.wizardQuiz.innerHTML = "";
        const pergunta = document.createElement("p");
        pergunta.className = "mb-2";
        pergunta.textContent = s.quiz?.pergunta || "—";
        els.wizardQuiz.appendChild(pergunta);

        const quizName = `liora-quiz-${wizard.atual}`;
        (s.quiz?.alternativas || []).forEach((alt, i) => {
          const opt = document.createElement("label");
          opt.className = "liora-quiz-option";
          opt.innerHTML = `<input type="radio" name="${quizName}" value="${i}"><span>${alt}</span>`;
          opt.addEventListener("change", () => {
            if (!els.wizardQuizFeedback) return;
            els.wizardQuizFeedback.textContent =
              i === Number(s.quiz.corretaIndex)
                ? `✅ Correto! ${s.quiz.explicacao || ""}`
                : "❌ Tente novamente.";
          });
          els.wizardQuiz.appendChild(opt);
        });
      }

      els.wizardFlashcards && (els.wizardFlashcards.innerHTML = (s.flashcards || [])
        .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`).join(""));
    }

    // -------------------------
    // NAV WIZARD
    // -------------------------
    els.wizardVoltar?.addEventListener("click", () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
        saveProgress();
      }
    });
    els.wizardSalvar?.addEventListener("click", () => {
      saveProgress();
      els.status && (els.status.textContent = "💾 Progresso salvo!");
      setTimeout(()=> { if (els.status) els.status.textContent = ""; }, 1200);
    });
    els.wizardProxima?.addEventListener("click", () => {
      if (wizard.atual >= wizard.sessoes.length - 1) {
        els.status && (els.status.textContent = "🎉 Tema concluído!");
        return;
      }
      wizard.atual++;
      renderWizard();
      saveProgress();
    });

    // -------------------------
    // BOTÃO: GERAR (TEMA)
    // -------------------------
    els.btnGerar?.addEventListener("click", async () => {
      const tema = (els.inpTema?.value || "").trim();
      const nivel = els.selNivel?.value || "iniciante";
      if (!tema) return alert("Digite um tema.");
      try {
        // retomar
        const cached = loadProgress(tema, nivel);
        if (cached && Array.isArray(cached.sessoes) && cached.sessoes.length) {
          wizard = cached;
          els.ctx && (els.ctx.textContent = `🔁 Retomando (${wizard.sessoes.length} sessões)`);
          renderPlanoResumo(wizard.plano);
          renderWizard();
          return;
        }

        els.ctx && (els.ctx.textContent = "🧭 Gerando plano...");
        els.btnGerar.disabled = true;

        const plano = await gerarPlanoDeSessoes(tema, nivel);
        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        // -------------------------
// BOTÃO: GERAR (TEMA)
// -------------------------
document.getElementById("btn-gerar")?.addEventListener("click", async () => {
  const tema = (els.inpTema?.value || "").trim();
  const nivel = els.selNivel?.value || "iniciante";
  if (!tema) return alert("Digite um tema.");

  const cached = loadProgress(tema, nivel);
  if (cached && Array.isArray(cached.sessoes) && cached.sessoes.length) {
    wizard = cached;
    renderPlanoResumo(wizard.plano);
    renderWizard();
    return;
  }

  try {
    els.btnGerar.disabled = true;
    els.ctx && (els.ctx.textContent = "🔧 Criando plano...");

    // ✅ 1. GERA O PLANO (lista)
    const plano = await gerarPlanoDeSessoes(tema, nivel);
    wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
    renderPlanoResumo(plano);

    // ✅ 2. BARRA DE PROGRESSO para gerar sessões
    let progresso = 0;
    const total = plano.length;
    els.ctx.textContent = `⏳ Preparando sessões (0/${total})`;

    for (const item of plano) {
      progresso++;
      els.ctx.textContent = `⏳ Sessão ${progresso}/${total}: ${item.nome}`;

      // eslint-disable-next-line no-await-in-loop
      const sessao = await gerarSessao(tema, nivel, item.numero, item.nome);
      wizard.sessoes.push(sessao);
      saveProgress();
    }

    els.ctx.textContent = "✅ Sessões prontas!";
    renderWizard();

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar o plano/sessões. Veja o console.");
  } finally {
    els.btnGerar.disabled = false;
  }
});

        
        
        
        
        
        
        
        // gera sessões sequenciais
        for (const item of plano) {
          els.status && (els.status.textContent = `🧠 Sessão ${item.numero} — ${item.nome}`);
          // eslint-disable-next-line no-await-in-loop
          const sessao = await gerarSessao(tema, nivel, item.numero, item.nome);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        els.status && (els.status.textContent = "✅ Sessões prontas!");
        renderWizard();
      } catch (e) {
        console.error(e);
        alert("Erro ao gerar o plano/sessões. Veja o console.");
      } finally {
        els.btnGerar.disabled = false;
        els.ctx && (els.ctx.textContent = "");
      }
    });

    // -------------------------
    // UPLOAD: UX + GERAR
    // -------------------------
    // drag highlight
    ["dragenter","dragover"].forEach(ev =>
      els.uploadZone?.addEventListener(ev, (e)=>{e.preventDefault(); els.uploadZone.classList.add("dragover");})
    );
    ["dragleave","drop"].forEach(ev =>
      els.uploadZone?.addEventListener(ev, (e)=>{e.preventDefault(); els.uploadZone.classList.remove("dragover");})
    );

    // nome do arquivo
    els.inpFile?.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      els.uploadText && (els.uploadText.textContent = `Selecionado: ${f.name}`);
    });

    // GERAR (UPLOAD)
    els.btnGerarUpload?.addEventListener("click", async () => {
      const nivel = els.selNivel?.value || "iniciante";
      const file = els.inpFile?.files?.[0];
      if (!file) return alert("Selecione um arquivo (.pdf ou .txt).");

      if (!window.processarArquivoUpload || !window.generatePlanFromUploadAI) {
        return alert("Módulos de upload indisponíveis (semantic.js / generatePlanFromUploadAI).");
      }

      try {
        els.btnGerarUpload.disabled = true;
        els.statusUpload && (els.statusUpload.textContent = "⏳ Processando arquivo...");
        els.uploadSpinner && (els.uploadSpinner.style.display = "inline-block");

        // 1) extrai tópicos do arquivo
        const r = await window.processarArquivoUpload(file);
        // 2) gera plano via IA com tópicos
        const out = await window.generatePlanFromUploadAI(nivel, r?.topicos || []);

        const plano = (out?.sessoes || out?.plano || []).map((s, i) => ({
          numero: Number(s.numero ?? i+1),
          nome: String(s.nome ?? s.titulo ?? `Sessão ${i+1}`)
        }));

        wizard = { tema: (file.name || "Material"), nivel, plano, sessoes: [], atual: 0 };
        renderPlanoResumo(plano);

        for (const item of plano) {
          els.statusUpload && (els.statusUpload.textContent = `🧠 Sessão ${item.numero} — ${item.nome}`);
          // eslint-disable-next-line no-await-in-loop
          const sessao = await gerarSessao(wizard.tema, nivel, item.numero, item.nome);
          wizard.sessoes.push(sessao);
          saveProgress();
        }

        els.statusUpload && (els.statusUpload.textContent = "✅ Sessões prontas!");
        renderWizard();
      } catch (err) {
        console.error(err);
        alert("Erro ao gerar plano via upload. Veja o console.");
      } finally {
        els.btnGerarUpload.disabled = false;
        els.uploadSpinner && (els.uploadSpinner.style.display = "none");
      }
    });

    console.log("🟢 core.js v24 carregado");
  });
})();
