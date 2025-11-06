// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v16)
// Tema / Upload + Sessões no modo WIZARD (sem lista).
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core...");

  document.addEventListener("DOMContentLoaded", () => {

    const els = {
      // Tema
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v17)
// Tema/Upload + Sessões no modo WIZARD (sem lista).
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core...");

  document.addEventListener("DOMContentLoaded", () => {
    const els = {
      // Tema
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      // Upload
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      // UI (painéis)
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      themeBtn: document.getElementById("btn-theme"),

      // progress
      progressBar: document.getElementById("progress-bar"),
      progressFill: document.getElementById("progress-fill"),

      // WIZARD
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
    };

    // =========================
    //   THEME
    // =========================
    function aplicarTema(mode) {
      document.documentElement.classList.toggle("light", mode === "light");
      document.body.classList.toggle("light", mode === "light");
      localStorage.setItem("liora_theme", mode);
      if (els.themeBtn) els.themeBtn.textContent = mode === "light" ? "☀️" : "🌙";
    }
    els.themeBtn?.addEventListener("click", () => {
      const atual = localStorage.getItem("liora_theme") || "dark";
      aplicarTema(atual === "light" ? "dark" : "light");
    });
    aplicarTema(localStorage.getItem("liora_theme") || "dark");

    // =========================
    //   PROGRESS BAR
    // =========================
    function iniciarProgresso() {
      if (!els.progressBar || !els.progressFill) return null;
      els.progressFill.style.width = "0%";
      els.progressBar.classList.remove("hidden");
      let p = 0;
      const timer = setInterval(() => {
        p += Math.random() * 10;
        if (p > 90) p = 90;
        els.progressFill.style.width = `${p}%`;
      }, 350);
      return timer;
    }
    function finalizarProgresso(ref) {
      if (!ref || !els.progressBar || !els.progressFill) return;
      clearInterval(ref);
      els.progressFill.style.width = "100%";
      setTimeout(() => els.progressBar.classList.add("hidden"), 500);
    }

    // =========================
    //   ALTERNÂNCIA DE MODO
    // =========================
    els.modoTema?.addEventListener("click", () => {
      els.painelTema?.classList.remove("hidden");
      els.painelUpload?.classList.add("hidden");
    });
    els.modoUpload?.addEventListener("click", () => {
      els.painelUpload?.classList.remove("hidden");
      els.painelTema?.classList.add("hidden");
    });

    // =========================================================
    // 🟠 WIZARD — ESTADO
    // =========================================================
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],     // [{numero, nome}]
      sessoes: [],   // [{titulo, objetivo, conteudo[], ...}]
      atual: 0
    };

    const key = (tema, nivel) => `liora:wizard:${(tema||"").toLowerCase()}::${(nivel||"").toLowerCase()}`;

    function saveProgress() {
      try {
        localStorage.setItem(key(wizard.tema, wizard.nivel), JSON.stringify(wizard));
      } catch (e) {
        console.warn("⚠️ Não foi possível salvar progresso:", e);
      }
    }
    function loadProgress(tema, nivel) {
      try {
        const raw = localStorage.getItem(key(tema, nivel));
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    // =======================
    // IA — unificada
    // =======================
    async function callLLM(system, prompt) {
      // ✅ Preferir integração existente
      if (window.LIORA && typeof window.LIORA.ask === "function") {
        const resp = await window.LIORA.ask({ system, user: prompt, stream: false });
        // Pode vir string ou objeto
        if (typeof resp === "string") return resp;
        if (resp && typeof resp === "object") {
          // tenta mapear campos comuns
          if (resp.text) return resp.text;
          if (resp.output) return resp.output;
          if (resp.choices?.[0]?.message?.content) return resp.choices[0].message.content;
          return JSON.stringify(resp);
        }
      }
      // ❌ Não usar /api/liora/generate (não existe no seu projeto)
      throw new Error("⚠️ Nenhum modelo configurado. window.LIORA.ask não encontrado.");
    }

    // =========================================================
    // Geração do PLANO (Tema) — prioriza seu módulo existente
    // =========================================================
    async function gerarPlanoDeSessoes(tema, nivel) {
      // 1) Tenta usar o seu gerador já existente no front
      if (typeof window.generatePlanByTheme === "function") {
        try {
          const out = await window.generatePlanByTheme(tema, nivel); // {plano:[{numero,nome}], ...} ou {sessoes:[]}
          const plano = out?.plano || out?.sessoes;
          if (Array.isArray(plano) && plano.length) {
            // Normaliza formato
            return plano.map((s, i) => ({
              numero: Number(s.numero ?? i + 1),
              nome: String(s.nome ?? s.titulo ?? `Sessão ${i + 1}`)
            }));
          }
        } catch (e) {
          console.warn("Fallback para IA direta (generatePlanByTheme falhou):", e);
        }
      }

      // 2) Fallback: IA direta
      const system = "Você é a Liora, especialista em microlearning e método Oakley.";
      const prompt = `
Gere um plano de sessões para o tema "${tema}" (nível: ${nivel}).
Retorne JSON puro:
[
  {"numero":1,"nome":"Fundamentos"},
  {"numero":2,"nome":"Aplicações"}
]`;
      const raw = await callLLM(system, prompt);
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return (parsed || []).map((s, i) => ({
          numero: Number(s.numero ?? i + 1),
          nome: String(s.nome ?? `Sessão ${i + 1}`)
        }));
      } catch {
        return [
          { numero: 1, nome: "Introdução e visão geral" },
          { numero: 2, nome: "Conceitos essenciais" },
          { numero: 3, nome: "Aplicações práticas" },
          { numero: 4, nome: "Boas práticas e erros comuns" },
          { numero: 5, nome: "Revisão final" }
        ];
      }
    }

    // =========================================================
    // Geração de uma SESSÃO (Tema)
    // =========================================================
    async function gerarSessao(tema, nivel, numero, nome) {
      const system = "Você é a Liora, especialista em microlearning e método Oakley.";
      const prompt = `
Gere a sessão ${numero} do tema "${tema}" (nível: ${nivel}), tópico "${nome}".
Responda em JSON EXATO:
{
 "titulo":"Sessão ${numero} — ${nome}",
 "objetivo":"resultado de aprendizagem claro",
 "conteudo":["parágrafo 1","parágrafo 2","parágrafo 3"],
 "analogias":["analogia 1","analogia 2"],
 "ativacao":["pergunta 1","pergunta 2","pergunta 3"],
 "quiz":{"pergunta":"pergunta","alternativas":["a) ...","b) ...","c) ..."],"corretaIndex":1,"explicacao":"por quê"},
 "flashcards":[{"q":"pergunta","a":"resposta"},{"q":"pergunta","a":"resposta"}]
}`;
      const raw = await callLLM(system, prompt);
      try {
        const sess = typeof raw === "string" ? JSON.parse(raw) : raw;
        // saneamento mínimo
        sess.titulo = sess.titulo || `Sessão ${numero} — ${nome}`;
        sess.objetivo = sess.objetivo || `Entender ${nome}`;
        sess.conteudo = Array.isArray(sess.conteudo) ? sess.conteudo : [String(sess.conteudo || `${nome} no contexto de ${tema}`)];
        sess.analogias = Array.isArray(sess.analogias) ? sess.analogias : [];
        sess.ativacao = Array.isArray(sess.ativacao) ? sess.ativacao : [];
        sess.quiz = sess.quiz || { pergunta: "", alternativas: ["a)","b)","c)"], corretaIndex: 0, explicacao: "" };
        sess.quiz.alternativas = Array.isArray(sess.quiz.alternativas) ? sess.quiz.alternativas : ["a)","b)","c)"];
        sess.quiz.corretaIndex = Number.isInteger(sess.quiz.corretaIndex) ? sess.quiz.corretaIndex : 0;
        sess.flashcards = Array.isArray(sess.flashcards) ? sess.flashcards : [];
        return sess;
      } catch (e) {
        console.warn("Sessão fallback (parse falhou):", e);
        return {
          titulo: `Sessão ${numero} — ${nome}`,
          objetivo: `Entender ${nome}`,
          conteudo: [`${nome} no contexto de ${tema}`],
          analogias: [`Pense em ${nome} como...`],
          ativacao: [`Explique ${nome} com suas palavras.`, `Dê um exemplo prático de ${nome}.`, `Aponte um erro comum.`],
          quiz: { pergunta: `Sobre ${nome}, qual é correto?`, alternativas: ["a) ...", "b) ...", "c) ..."], corretaIndex: 2, explicacao: "" },
          flashcards: [{ q: `${nome} em 1 frase`, a: "..." }]
        };
      }
    }

    // =========================================================
    // WIZARD — RENDERIZAÇÃO
    // =========================================================
    function renderWizard() {
      if (!els.wizardContainer) return;
      const s = wizard.sessoes[wizard.atual];
      if (!s) return;

      // Mostrar wizard, esconder lista antiga
      els.wizardContainer.style.display = "block";
      if (els.plano) els.plano.innerHTML = "";

      // Cabeçalho + progresso
      if (els.wizardTema) els.wizardTema.textContent = wizard.tema || "";
      if (els.wizardProgressLabel) els.wizardProgressLabel.textContent = `Sessão ${wizard.atual + 1}/${wizard.sessoes.length}`;
      if (els.wizardProgressBar) els.wizardProgressBar.style.width = `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;

      // Conteúdo
      if (els.wizardTitulo) els.wizardTitulo.textContent = s.titulo || `Sessão ${wizard.atual + 1}`;
      if (els.wizardObjetivo) els.wizardObjetivo.textContent = s.objetivo || "—";

      if (els.wizardConteudo) {
        els.wizardConteudo.innerHTML = (s.conteudo || []).map(p => `<p>${p}</p>`).join("");
      }
      if (els.wizardAnalogias) {
        els.wizardAnalogias.innerHTML = (s.analogias || []).map(a => `<p>${a}</p>`).join("");
      }
      if (els.wizardAtivacao) {
        els.wizardAtivacao.innerHTML = (s.ativacao || []).map(q => `<li>${q}</li>`).join("");
      }

      // Quiz
      if (els.wizardQuiz) {
        els.wizardQuiz.innerHTML = "";
        const quizName = `liora-quiz-${wizard.atual}`;
        if (s.quiz?.alternativas && s.quiz.alternativas.length) {
          const perguntaP = document.createElement("p");
          perguntaP.textContent = s.quiz.pergunta || "—";
          els.wizardQuiz.appendChild(perguntaP);

          s.quiz.alternativas.forEach((alt, i) => {
            const opt = document.createElement("label");
            opt.className = "liora-quiz-option";
            opt.innerHTML = `<input type="radio" name="${quizName}" value="${i}"> ${alt}`;
            opt.onclick = () => {
              if (!els.wizardQuizFeedback) return;
              els.wizardQuizFeedback.textContent =
                i === Number(s.quiz.corretaIndex) ? `✅ Correto! ${s.quiz.explicacao || ""}` : "❌ Tente novamente.";
            };
            els.wizardQuiz.appendChild(opt);
          });
        }
      }

      if (els.wizardFlashcards) {
        els.wizardFlashcards.innerHTML = (s.flashcards || [])
          .map(f => `<li><strong>${f.q}</strong>: ${f.a}</li>`).join("");
      }

      // Controles
      if (els.wizardVoltar) els.wizardVoltar.disabled = wizard.atual === 0;
      if (els.wizardProxima) els.wizardProxima.textContent = (wizard.atual === wizard.sessoes.length - 1) ? "Concluir tema" : "Próxima sessão";
    }

    // =========================================================
    // EVENTOS DO WIZARD
    // =========================================================
    els.wizardVoltar?.addEventListener("click", () => {
      if (wizard.atual > 0) {
        wizard.atual--;
        renderWizard();
        saveProgress();
      }
    });

    els.wizardSalvar?.addEventListener("click", () => {
      saveProgress();
      if (els.status) {
        els.status.textContent = "💾 Progresso salvo";
        setTimeout(() => (els.status.textContent = ""), 1200);
      }
    });

    els.wizardProxima?.addEventListener("click", () => {
      if (wizard.atual >= wizard.sessoes.length - 1) {
        if (els.status) els.status.textContent = "✨ Tema finalizado!";
        return;
      }
      wizard.atual++;
      renderWizard();
      saveProgress();
    });

    // =========================================================
    // BOTÃO GERAR (TEMA) → ABRE WIZARD
    // =========================================================
    els.btnGerar?.addEventListener("click", async () => {
      const tema = (els.inpTema?.value || "").trim();
      const nivel = els.selNivel?.value || "iniciante";
      if (!tema) return alert("Digite um tema.");

      // Retomar
      const cached = loadProgress(tema, nivel);
      if (cached && Array.isArray(cached.sessoes) && cached.sessoes.length) {
        wizard = cached;
        renderWizard();
        if (els.ctx) els.ctx.textContent = `🔁 Retomando estudo: ${wizard.sessoes.length} sessões`;
        return;
      }

      const ref = iniciarProgresso();
      try {
        if (els.ctx) els.ctx.textContent = "🧭 Gerando plano...";
        const plano = await gerarPlanoDeSessoes(tema, nivel);

        wizard = { tema, nivel, plano, sessoes: [], atual: 0 };
        if (els.ctx) els.ctx.textContent = `🧭 Gerando sessões (${plano.length})...`;

        // Geração sequencial (evita estouro e facilita status)
        for (const item of plano) {
          if (els.status) els.status.textContent = `🧠 Sessão ${item.numero}: ${item.nome}`;
          // eslint-disable-next-line no-await-in-loop
          const sess = await gerarSessao(tema, nivel, item.numero, item.nome);
          wizard.sessoes.push(sess);
          saveProgress();
        }

        if (els.status) els.status.textContent = "✅ Sessões prontas!";
        if (els.ctx) els.ctx.textContent = `📘 ${wizard.sessoes.length} sessões geradas`;
        renderWizard();
      } catch (e) {
        console.error(e);
        alert("❌ Falha ao gerar o plano/sessões. Ver console.");
      } finally {
        finalizarProgresso(ref);
      }
    });

    // =========================================================
    // UPLOAD (mantido) — se quiser desativar, basta remover esta seção
    // =========================================================
    els.inpFile?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!window.processarArquivoUpload) {
        alert("❌ Módulo semantic.js não está pronto.");
        return;
      }
      try {
        els.statusUpload && (els.statusUpload.textContent = "⏳ Processando arquivo...");
        const resultado = await window.processarArquivoUpload(file);
        els.statusUpload && (els.statusUpload.textContent = resultado?.tipoMsg || "Arquivo processado.");
        const previewItems = (resultado?.topicos || [])
          .slice(0, 12)
          .map(t => `${t?.titulo || "Tópico"} — ${(t?.conceitos||[]).slice(0,2).join(", ")}`);
        mostrarPreview(previewItems);
      } catch (err) {
        console.error(err);
        els.statusUpload && (els.statusUpload.textContent = "❌ Falha ao ler o arquivo.");
      }
    });

    function mostrarPreview(lista) {
      document.querySelector("#preview-modal")?.remove();
      const modal = document.createElement("div");
      modal.id = "preview-modal";
      modal.className = "preview-modal-overlay";
      modal.innerHTML = `
        <div class="preview-modal">
          <h3>📋 Tópicos detectados</h3>
          <ul style="max-height:300px; overflow:auto; padding-left:1rem; margin-top:.5rem;">
            ${(lista||[]).map(txt => `<li>• ${txt}</li>`).join("")}
          </ul>
          <div class="text-right mt-4">
            <button class="chip" id="fechar-preview">Fechar</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById("fechar-preview").onclick = () => modal.remove();
    }

    els.btnGerarUpload?.addEventListener("click", async () => {
      const loading = iniciarProgresso();
      try {
        if (!window.generatePlanFromUploadAI) {
          alert("❌ Função generatePlanFromUploadAI indisponível.");
          return;
        }
        const nivel = els.selNivel?.value || "iniciante";
        const result = await window.generatePlanFromUploadAI(nivel); // {modulos:[{titulo,sessoes:[]}]}
        if (els.ctx) els.ctx.textContent = `📘 Plano por módulos (upload) — ${result?.modulos?.length || 0} módulos.`;
        renderizarModulos(result?.modulos || []);
      } catch (err) {
        console.error(err);
        alert("❌ Erro ao gerar plano por upload.");
      } finally {
        finalizarProgresso(loading);
      }
    });

    // Renderização de módulos (mantida para upload)
    function renderizarModulos(modulos) {
      if (!els.plano) return;
      els.plano.innerHTML = "";
      if (!Array.isArray(modulos) || !modulos.length) {
        els.plano.innerHTML = `<p class="text-[var(--muted)]">Nenhum módulo gerado.</p>`;
        return;
      }
      modulos.forEach((mod, midx) => {
        const card = document.createElement("div");
        card.className = "card p-4 mb-4";
        card.innerHTML = `
          <h3 class="section-title mb-2">${mod.titulo || `Módulo ${midx+1}`}</h3>
          <div class="space-y-2" id="mod-${midx}"></div>
        `;
        const lista = card.querySelector(`#mod-${midx}`);

        (mod.sessoes || []).forEach((sess, sidx) => {
          const row = document.createElement("div");
          row.className = "session-card";
          row.innerHTML = `
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-semibold">${sess.titulo || `Sessão ${sidx+1}`}</div>
                <div class="text-sm text-[var(--muted)]">${(sess.resumo || "").slice(0,140)}</div>
              </div>
              <button class="chip btn-detalhar" data-mid="${midx}" data-sid="${sidx}">Ver detalhes →</button>
            </div>`;
          lista.appendChild(row);
        });
        els.plano.appendChild(card);
      });

      // bind detalhe (upload)
      els.plano.querySelectorAll(".btn-detalhar").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const mid = Number(e.currentTarget.dataset.mid);
          const sid = Number(e.currentTarget.dataset.sid);
          const sessao = modulos?.[mid]?.sessoes?.[sid];
          abrirDetalhamento(sessao);
        });
      });
    }

    function abrirDetalhamento(sessao) {
      document.querySelector("#modal-detalhamento")?.remove();
      const modal = document.createElement("div");
      modal.className = "preview-modal-overlay";
      modal.id = "modal-detalhamento";
      modal.innerHTML = `
        <div class="preview-modal">
          <h3>${sessao?.titulo || "Sessão"}</h3>
          <pre>${sessao?.detalhamento || "🎯 Objetivo...\n📘 Explicação...\n🧠 Exemplos...\n🧪 Exercício...\n✅ Checklist..."}</pre>
          <div class="text-right mt-4">
            <button class="chip" id="fechar-detalhe">Fechar</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById("fechar-detalhe").onclick = () => modal.remove();
    }

    console.log("🟢 core.js com WIZARD carregado");
  });

})();
