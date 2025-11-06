// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v15)
// Mantém: tema/upload, progress bar, preview, tema claro/escuro
// Novo: Upload → módulos (cards). Sessões abrem MINI-AULA em modal.
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
      // UI
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
    };

    // ===== Tema claro/escuro
    function aplicarTema(mode) {
      document.documentElement.classList.toggle("light", mode === "light");
      document.body.classList.toggle("light", mode === "light");
      localStorage.setItem("liora_theme", mode);
      els.themeBtn.textContent = mode === "light" ? "☀️" : "🌙";
    }
    els.themeBtn?.addEventListener("click", () => {
      const atual = localStorage.getItem("liora_theme") || "dark";
      aplicarTema(atual === "light" ? "dark" : "light");
    });
    aplicarTema(localStorage.getItem("liora_theme") || "dark");

    // ===== Progress bar
    function iniciarProgresso() {
      if (!els.progressBar || !els.progressFill) return null;
      els.progressFill.style.width = "0%";
      els.progressBar.classList.remove("hidden");
      let progresso = 0;
      const intervalo = setInterval(() => {
        progresso += Math.random() * 15;
        if (progresso > 90) progresso = 90;
        els.progressFill.style.width = `${progresso}%`;
      }, 350);
      return intervalo;
    }
    function finalizarProgresso(intervalo) {
      if (!intervalo) return;
      clearInterval(intervalo);
      els.progressFill.style.width = "100%";
      setTimeout(() => els.progressBar.classList.add("hidden"), 600);
    }

    // ===== Alternância Tema/Upload
    els.modoTema?.addEventListener("click", () => {
      els.painelTema.classList.remove("hidden");
      els.painelUpload.classList.add("hidden");
      els.modoTema.classList.add("selected");
      els.modoUpload.classList.remove("selected");
    });
    els.modoUpload?.addEventListener("click", () => {
      els.painelUpload.classList.remove("hidden");
      els.painelTema.classList.add("hidden");
      els.modoUpload.classList.add("selected");
      els.modoTema.classList.remove("selected");
    });

    // ===== Upload — leitura + preview
    els.inpFile?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      els.statusUpload.textContent = "⏳ Processando arquivo...";
      if (!window.processarArquivoUpload) {
        alert("❌ Módulo semantic.js não está pronto.");
        return;
      }
      try {
        const resultado = await window.processarArquivoUpload(file);
        els.statusUpload.textContent = resultado.tipoMsg;
        const previewItems = (resultado.topicos || [])
          .slice(0, 12)
          .map(t => `${t?.titulo || "Tópico"} — ${(t?.conceitos||[]).slice(0,2).join(", ")}`);
        mostrarPreview(previewItems);
      } catch (err) {
        console.error(err);
        els.statusUpload.textContent = "❌ Falha ao ler o arquivo.";
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
            ${lista.map(txt => `<li>• ${txt}</li>`).join("")}
          </ul>
          <div class="text-right mt-4">
            <button class="chip" id="fechar-preview">Fechar</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById("fechar-preview").onclick = () => modal.remove();
    }

    // ===== Gerar plano (UPLOAD → IA em MÓDULOS)
    els.btnGerarUpload?.addEventListener("click", async () => {
      console.log("▶️ Gerar plano (UPLOAD → MÓDULOS)");
      const loading = iniciarProgresso();
      try {
        if (!window.generatePlanFromUploadAI) {
          alert("❌ Função generatePlanFromUploadAI indisponível.");
          finalizarProgresso(loading);
          return;
        }
        const nivel = els.selNivel?.value || "iniciante"; // usa nível atual como dica
        const result = await window.generatePlanFromUploadAI(nivel); // {modulos:[{titulo,sessoes:[]}]}
        finalizarProgresso(loading);

        els.ctx.textContent = `📘 Plano por módulos (upload) — ${result.modulos?.length || 0} módulos.`;
        renderizarModulos(result.modulos || []);
      } catch (err) {
        finalizarProgresso(loading);
        console.error(err);
        alert("❌ Erro ao gerar plano por upload.");
      }
    });

    // ===== Gerar plano (TEMA → sessões simples)
    els.btnGerar?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (TEMA)");
      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");
      if (!window.generatePlanByTheme) {
        alert("❌ Módulo de plano por tema não está pronto.");
        return;
      }
      const loading = iniciarProgresso();
      try {
        const out = await window.generatePlanByTheme(tema, nivel); // {sessoes, plano}
        finalizarProgresso(loading);
        els.ctx.textContent = `📘 ${out.sessoes || out.plano?.length || 0} sessões (tema).`;
        renderizarSessoes(out.plano || []);
      } catch (err) {
        finalizarProgresso(loading);
        console.error(err);
        alert("❌ Falha ao gerar plano.");
      }
    });

    // ===== Renderização — MÓDULOS (cards)
    function renderizarModulos(modulos) {
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
            </div>
          `;
          lista.appendChild(row);
        });

        els.plano.appendChild(card);
      });

      // bind botões
      els.plano.querySelectorAll(".btn-detalhar").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const mid = Number(e.currentTarget.dataset.mid);
          const sid = Number(e.currentTarget.dataset.sid);
          const sessao = modulos?.[mid]?.sessoes?.[sid];
          abrirDetalhamento(sessao);
        });
      });
    }

    // ===== Renderização — SESSÕES (tema)
    function renderizarSessoes(plano) {
      els.plano.innerHTML = "";
      if (!Array.isArray(plano) || !plano.length) {
        els.plano.innerHTML = `<p class="text-[var(--muted)]">Nenhuma sessão gerada.</p>`;
        return;
      }
      plano.forEach((sessao, index) => {
        const div = document.createElement("div");
        div.className = "session-card";
        div.innerHTML = `
          <h3>${sessao.titulo || `Sessão ${index+1}`}</h3>
          <p class="text-[var(--muted)] text-sm mb-2">${(sessao.resumo || "").slice(0,140)}</p>
          <button class="chip btn-detalhar" data-id="${index}">Ver detalhes →</button>
        `;
        els.plano.appendChild(div);
      });

      els.plano.querySelectorAll(".btn-detalhar").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = Number(e.currentTarget.dataset.id);
          abrirDetalhamento(plano[id]);
        });
      });
    }

    // ===== Modal — Detalhamento (mini-aula)
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

    // Debug
    window.LioraCore = { els, renderizarModulos, renderizarSessoes };

    console.log("🟢 core.js carregado com sucesso");
  });
// ==========================================================
// LIORA — SESSÕES POR TEMA (Wizard) — v1
// Integra com: #inp-tema, #sel-nivel, #btn-gerar, #status
// Renderiza em: #liora-sessoes
// ==========================================================
(function () {
  // --- elementos do DOM já existentes + novos ---
  const els = {
    temaInput: document.getElementById("inp-tema"),
    nivelSelect: document.getElementById("sel-nivel"),
    btnGerar: document.getElementById("btn-gerar"),
    status: document.getElementById("status"),

    container: document.getElementById("liora-sessoes"),
    temaAtivo: document.getElementById("liora-tema-ativo"),
    progressBar: document.getElementById("liora-progress-bar"),
    progressLabel: document.getElementById("liora-progress-label"),

    sessaoTitulo: document.getElementById("liora-sessao-titulo"),
    sessaoObjetivo: document.getElementById("liora-sessao-objetivo"),
    sessaoConteudo: document.getElementById("liora-sessao-conteudo"),
    sessaoAnalogias: document.getElementById("liora-sessao-analogias"),
    sessaoAtivacao: document.getElementById("liora-sessao-ativacao"),
    sessaoQuiz: document.getElementById("liora-sessao-quiz"),
    sessaoQuizFeedback: document.getElementById("liora-sessao-quiz-feedback"),
    sessaoFlashcards: document.getElementById("liora-sessao-flashcards"),

    btnVoltar: document.getElementById("liora-btn-voltar"),
    btnSalvar: document.getElementById("liora-btn-salvar"),
    btnProxima: document.getElementById("liora-btn-proxima"),
  };

  // --- estado em memória ---
  let wizard = {
    tema: null,
    nivel: null,
    plano: [],       // [{numero, nome}]
    sessoes: [],     // array de objetos de sessão completa
    atual: 0         // índice da sessão atual (0-based)
  };

  // --- chave de persistência ---
  const key = (tema, nivel) => `liora:wizard:${(tema||"").toLowerCase()}::${(nivel||"").toLowerCase()}`;

  // ====== INTEGRAÇÃO COM O SEU LLM ======
  // Adapte esta função para sua chamada real de IA.
  // Opções: usar sua função global (ex.: window.LIORA.ask), fetch a um endpoint /api, etc.
  async function callLLM(systemPrompt, userPrompt) {
    // EXEMPLO A: se você já tem uma função global de IA:
    if (window.LIORA && typeof window.LIORA.ask === "function") {
      return await window.LIORA.ask({ system: systemPrompt, user: userPrompt });
    }

    // EXEMPLO B: fallback (ajuste o endpoint conforme seu backend)
    const res = await fetch("/api/liora/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({ system: systemPrompt, user: userPrompt })
    });
    if (!res.ok) throw new Error("Falha ao gerar com IA");
    const data = await res.json();
    return data.text || data; // ajuste se necessário
  }

  // Gera o plano de sessões (lista de tópicos)
  async function gerarPlanoDeSessoes(tema, nivel) {
    const system = "Você é a Liora, especialista em microlearning e método Oakley.";
    const user = `
Gere um plano de sessões para estudar o tema: "${tema}" (nível: ${nivel}).
Crie de 4 a 7 sessões, retornando JSON puro:
[
  {"numero": 1, "nome": "título da sessão"},
  {"numero": 2, "nome": "título da sessão"}
]
    `.trim();

    const out = await callLLM(system, user);
    // Tolerante: se vier string, tentar JSON.parse
    let plano;
    try {
      plano = typeof out === "string" ? JSON.parse(out) : out;
    } catch (e) {
      // fallback simples se o modelo não retornar JSON válido
      plano = [
        { numero: 1, nome: "Introdução e visão geral" },
        { numero: 2, nome: "Conceitos essenciais" },
        { numero: 3, nome: "Aplicações práticas" },
        { numero: 4, nome: "Erros comuns e boas práticas" },
        { numero: 5, nome: "Revisão e teste final" }
      ];
    }
    // normaliza e ordena por numero
    plano = (plano || []).map(s => ({ numero: Number(s.numero), nome: String(s.nome) }))
                         .sort((a,b) => a.numero - b.numero);
    return plano;
  }

  // Gera o conteúdo completo de uma sessão
  async function gerarSessao(tema, nivel, numero, nomeTopico) {
    const system = "Você é a Liora, especialista em microlearning e método Oakley.";
    const user = `
Gere a sessão número ${numero} do tema "${tema}" (nível: ${nivel}), tópico: "${nomeTopico}".
Responda em JSON com o seguinte formato EXATO:
{
  "titulo": "Sessão ${numero} — ${nomeTopico}",
  "objetivo": "frase clara de resultado de aprendizagem",
  "conteudo": ["parágrafo 1", "parágrafo 2", "parágrafo 3"],
  "analogias": ["analogia 1", "analogia 2"],
  "ativacao": ["pergunta 1", "pergunta 2", "pergunta 3"],
  "quiz": {
    "pergunta": "pergunta de múltipla escolha",
    "alternativas": ["a) ...", "b) ...", "c) ..."],
    "corretaIndex": 2,
    "explicacao": "por que esta é a correta em 1 linha"
  },
  "flashcards": [
    {"q":"pergunta", "a":"resposta"},
    {"q":"pergunta", "a":"resposta"}
  ]
}
    `.trim();

    const out = await callLLM(system, user);
    let sessao;
    try {
      sessao = typeof out === "string" ? JSON.parse(out) : out;
    } catch (e) {
      // fallback mínimo caso retorne fora do padrão
      sessao = {
        titulo: `Sessão ${numero} — ${nomeTopico}`,
        objetivo: `Compreender ${nomeTopico} no contexto de ${tema}.`,
        conteudo: [
          `${nomeTopico}: visão geral.`,
          `Relação de ${nomeTopico} com ${tema}.`,
          `Pontos-chave para lembrar.`
        ],
        analogias: [`Pense em ${nomeTopico} como ...`],
        ativacao: [
          `Explique ${nomeTopico} com suas palavras.`,
          `Dê um exemplo prático de ${nomeTopico}.`,
          `Qual erro comum em ${nomeTopico}?`
        ],
        quiz: {
          pergunta: `Qual afirmação sobre ${nomeTopico} é correta?`,
          alternativas: ["a) ...", "b) ...", "c) ..."],
          corretaIndex: 2,
          explicacao: "A alternativa c) resume o ponto-chave."
        },
        flashcards: [
          { q: `${nomeTopico} em 1 frase:`, a: "..." },
          { q: `Exemplo de ${nomeTopico}:`, a: "..." }
        ]
      };
    }
    return sessao;
  }

  // Renderização da sessão atual
  function render() {
    const total = wizard.sessoes.length;
    const idx = wizard.atual;
    const sess = wizard.sessoes[idx];
    if (!sess) return;

    els.container.style.display = "block";
    els.temaAtivo.textContent = wizard.tema;

    // progresso
    els.progressLabel.textContent = `Sessão ${idx+1}/${total}`;
    els.progressBar.style.width = `${((idx+1)/total)*100}%`;

    // conteúdo
    els.sessaoTitulo.textContent = sess.titulo || `Sessão ${idx+1}`;
    els.sessaoObjetivo.textContent = sess.objetivo || "—";

    els.sessaoConteudo.innerHTML = "";
    (sess.conteudo || []).forEach(p => {
      const para = document.createElement("p"); para.textContent = p;
      els.sessaoConteudo.appendChild(para);
    });

    els.sessaoAnalogias.innerHTML = "";
    (sess.analogias || []).forEach(a => {
      const para = document.createElement("p"); para.textContent = a;
      els.sessaoAnalogias.appendChild(para);
    });

    els.sessaoAtivacao.innerHTML = "";
    (sess.ativacao || []).forEach(q => {
      const li = document.createElement("li"); li.textContent = q;
      els.sessaoAtivacao.appendChild(li);
    });

    // quiz
    els.sessaoQuiz.innerHTML = "";
    els.sessaoQuizFeedback.textContent = "";
    if (sess.quiz && sess.quiz.pergunta && Array.isArray(sess.quiz.alternativas)) {
      const q = document.createElement("p");
      q.textContent = sess.quiz.pergunta;
      els.sessaoQuiz.appendChild(q);

      sess.quiz.alternativas.forEach((alt, i) => {
        const label = document.createElement("label");
        label.className = "liora-quiz-option";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "liora-quiz";
        input.value = String(i);

        label.appendChild(input);
        const span = document.createElement("span");
        span.textContent = alt;
        label.appendChild(span);

        label.addEventListener("change", () => {
          const ok = Number(input.value) === Number(sess.quiz.corretaIndex);
          els.sessaoQuizFeedback.textContent = ok
            ? `✅ Correto! ${sess.quiz.explicacao || ""}`
            : `❌ Não é essa. ${sess.quiz.explicacao || ""}`;
        });

        els.sessaoQuiz.appendChild(label);
      });
    }

    // flashcards
    els.sessaoFlashcards.innerHTML = "";
    (sess.flashcards || []).forEach(card => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${card.q}</strong> — ${card.a}`;
      els.sessaoFlashcards.appendChild(li);
    });

    // controles
    els.btnVoltar.disabled = idx === 0;
    els.btnProxima.textContent = (idx === total - 1) ? "Concluir tema" : "Próxima sessão";
  }

  // salvar/recuperar progresso local
  function saveProgress() {
    const k = key(wizard.tema, wizard.nivel);
    const data = {
      tema: wizard.tema,
      nivel: wizard.nivel,
      plano: wizard.plano,
      sessoes: wizard.sessoes,
      atual: wizard.atual
    };
    localStorage.setItem(k, JSON.stringify(data));
  }
  function loadProgress(tema, nivel) {
    const k = key(tema, nivel);
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  // eventos
  els.btnVoltar.addEventListener("click", () => {
    if (wizard.atual > 0) {
      wizard.atual -= 1;
      render();
      saveProgress();
    }
  });

  els.btnSalvar.addEventListener("click", () => {
    saveProgress();
    if (els.status) els.status.textContent = "💾 Progresso salvo.";
    setTimeout(()=>{ if (els.status) els.status.textContent = ""; }, 1500);
  });

  els.btnProxima.addEventListener("click", async () => {
    // último passo = concluir
    if (wizard.atual >= wizard.sessoes.length - 1) {
      if (els.status) els.status.textContent = "🎉 Tema concluído! Você pode gerar um novo tema ou revisar.";
      saveProgress();
      return;
    }
    wizard.atual += 1;
    render();
    saveProgress();
  });

  // Hooka o botão GERAR já existente
  if (els.btnGerar) {
    els.btnGerar.addEventListener("click", async () => {
      const tema = (els.temaInput?.value || "").trim();
      const nivel = (els.nivelSelect?.value || "Padrão").trim();
      if (!tema) {
        if (els.status) els.status.textContent = "Informe um tema para começar.";
        return;
      }

      // tentar carregar progresso salvo
      const cached = loadProgress(tema, nivel);
      if (cached && Array.isArray(cached.sessoes) && cached.sessoes.length) {
        wizard = cached;
        els.temaAtivo.textContent = wizard.tema;
        render();
        if (els.status) els.status.textContent = "🔁 Retomando seu estudo salvo.";
        return;
      }

      // gerar novo plano e sessões
      els.status && (els.status.textContent = "🔧 Gerando plano de sessões...");
      const plano = await gerarPlanoDeSessoes(tema, nivel);
      wizard.tema = tema;
      wizard.nivel = nivel;
      wizard.plano = plano;
      wizard.sessoes = [];
      wizard.atual = 0;

      els.temaAtivo.textContent = tema;
      els.container.style.display = "block";

      // gerar sessões de forma sequencial (para evitar sobrecarga de tokens)
      for (const item of plano) {
        els.status && (els.status.textContent = `🧠 Gerando sessão ${item.numero}: ${item.nome}...`);
        // eslint-disable-next-line no-await-in-loop
        const s = await gerarSessao(tema, nivel, item.numero, item.nome);
        wizard.sessoes.push(s);
        saveProgress();
      }

      els.status && (els.status.textContent = "✅ Sessões prontas!");
      render();
    });
  }

  // Exposição opcional para debug
  window.LIORA_WIZARD = {
    getState: () => JSON.parse(JSON.stringify(wizard)),
    reset: () => {
      const k = key(wizard.tema, wizard.nivel);
      localStorage.removeItem(k);
      wizard.atual = 0;
      render();
    }
  };
})();
  
})();
