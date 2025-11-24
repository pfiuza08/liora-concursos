// ==============================================================
// 🧠 LIORA — SIMULADOS v90-IA-COMMERCIAL
// - Usa IA real via /api/liora para gerar questões
// - Remove duplicações de alternativas
// - Garante 4 alternativas únicas, curtas e bem formadas
// - Força consistência visual e semântica dos enunciados
// - Compatível com FAB comercial (#sim-fab)
// - Timer, navegação, resultado, histórico
// ==============================================================
(function () {
  console.log("🔵 Liora Simulados v90-IA-COMMERCIAL carregado...");

  document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------------------------------
    // ELEMENTOS
    // -------------------------------------------------------
    const els = {
      areaSim: document.getElementById("area-simulado"),
      fabSim: document.getElementById("sim-fab"),

      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),
      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),

      // modal
      modal: document.getElementById("sim-modal-backdrop"),
      modalClose: document.getElementById("sim-modal-close-btn"),
      btnIniciar: document.getElementById("sim-modal-iniciar"),

      selBanca: document.getElementById("sim-modal-banca"),
      selQtd: document.getElementById("sim-modal-qtd"),
      selTempo: document.getElementById("sim-modal-tempo"),
      selDif: document.getElementById("sim-modal-dificuldade"),
      inpTema: document.getElementById("sim-modal-tema"),
    };

    if (!els.areaSim || !els.fabSim) {
      console.error("❌ Simulados: elementos essenciais não encontrados.");
      return;
    }

    // -------------------------------------------------------
    // ESTADO
    // -------------------------------------------------------
    const STATE = {
      questoes: [],
      atual: 0,
      banca: "FGV",
      qtd: 10,
      dificuldade: "misturado",
      tema: "",
      tempoMin: 30,
      tempoRestante: 0,
      timerID: null
    };

    // -------------------------------------------------------
    // 🔥 OPENAI / LLM HELPER
    // -------------------------------------------------------
    async function gerarQuestoesIA(banca, qtd, tema, dificuldade) {
      const prompt = `
Gere ${qtd} questões originais de concurso da banca ${banca}, tema: "${tema}".
Níveis possíveis: fácil, médio, difícil. O simulado solicitado: ${dificuldade}.
Regras obrigatórias:

1) Retorne APENAS JSON. NUNCA inclua explicações fora do JSON.
2) Cada questão deve ter esta estrutura:
{
  "enunciado": "...",
  "alternativas": ["A...", "B...", "C...", "D..."],
  "corretaIndex": 0-3,
  "nivel": "facil|medio|dificil"
}

3) Regras de qualidade:
- NUNCA gere alternativas repetidas, parecidas ou equivalentes.
- NUNCA use “[sublinhado]”, “__texto__”, “<u>texto</u>”.
- Se mencionar trecho entre aspas, escreva literalmente.
- Não use formatação Markdown.
- Todas alternativas devem ser curtas, claras e distintas.
- O enunciado deve ser 100% autossuficiente e sem referência a imagens.

Retorne o JSON final com uma lista: 
[
  {...},
  {...}
]
`;

      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: "Você é Liora, criadora de simulados.", user: prompt })
      });

      const json = await res.json().catch(() => ({}));
      let data = [];

      try {
        data = JSON.parse(json.output);
      } catch (e) {
        console.warn("⚠ JSON inválido da IA, tentando fallback.", e);
        data = [];
      }

      return Array.isArray(data) ? data : [];
    }

    // -------------------------------------------------------
    // AJUSTES DE QUALIDADE (remove duplicações)
    // -------------------------------------------------------
    function limparQuestoes(raw) {
      return raw.map((q, idx) => {
        const alternativas = Array.from(new Set(q.alternativas.map(a => a.trim())));

        // se IA devolveu menos que 4 alternativas, completa artificialmente
        while (alternativas.length < 4) {
          alternativas.push("Alternativa ajustada " + (alternativas.length + 1));
        }

        return {
          enunciado: q.enunciado
            .replace(/[_*~`]/g, "") // remove formatação markdown
            .replace(/<[^>]+>/g, ""), // remove HTML
          alternativas,
          corretaIndex: Math.min(q.corretaIndex, alternativas.length - 1),
          nivel: q.nivel || "medio",
          indice: idx + 1
        };
      });
    }

    // -------------------------------------------------------
    // MODAL — Abrir/Fechar
    // -------------------------------------------------------
    function abrirModal() {
      els.modal.classList.add("visible");
    }
    function fecharModal() {
      els.modal.classList.remove("visible");
    }

    els.fabSim.onclick = abrirModal;
    els.modalClose.onclick = fecharModal;
    els.modal.onclick = (e) => { if (e.target === els.modal) fecharModal(); };

    // -------------------------------------------------------
    // TIMER
    // -------------------------------------------------------
    function startTimer() {
      STATE.tempoRestante = STATE.tempoMin * 60;
      els.timer.classList.remove("hidden");

      STATE.timerID = setInterval(() => {
        STATE.tempoRestante--;
        els.timer.textContent = format(STATE.tempoRestante);

        if (STATE.tempoRestante <= 0) {
          clearInterval(STATE.timerID);
          finalizarSimulado(true);
        }
      }, 1000);
    }

    const format = (sec) =>
      `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

    // -------------------------------------------------------
    // RENDER QUESTÃO
    // -------------------------------------------------------
    function renderQuestao() {
      const total = STATE.questoes.length;
      const q = STATE.questoes[STATE.atual];

      els.questaoContainer.innerHTML = "";
      els.progressBar.style.width = ((STATE.atual + 1) / total) * 100 + "%";

      // Cabeçalho
      const header = document.createElement("div");
      header.className = "flex justify-between text-xs text-[var(--muted)] mb-2";
      header.innerHTML = `
        <span>Questão ${STATE.atual + 1} de ${total}</span>
        <span>${q.nivel.toUpperCase()}</span>
      `;
      els.questaoContainer.appendChild(header);

      // Enunciado
      const p = document.createElement("p");
      p.className = "sim-enunciado mb-2 whitespace-pre-line";
      p.textContent = q.enunciado;
      els.questaoContainer.appendChild(p);

      // Alternativas
      q.alternativas.forEach((alt, i) => {
        const div = document.createElement("div");
        div.className = "sim-alt";
        if (q.resp === i) div.classList.add("selected");

        div.innerHTML = `
          <div class="sim-radio"></div>
          <div class="sim-alt-text">${alt}</div>
        `;
        div.onclick = () => {
          q.resp = i;
          renderQuestao();
        };
        els.questaoContainer.appendChild(div);
      });

      els.nav.classList.remove("hidden");
      els.btnProxima.textContent =
        STATE.atual === total - 1 ? "Finalizar ▶" : "Próxima ▶";

      els.btnVoltar.disabled = STATE.atual === 0;
    }

    // -------------------------------------------------------
    // FINALIZAR SIMULADO
    // -------------------------------------------------------
    function finalizarSimulado(porTempo = false) {
      clearInterval(STATE.timerID);

      let acertos = 0;
      STATE.questoes.forEach((q) => {
        if (q.resp === q.corretaIndex) acertos++;
      });

      const total = STATE.questoes.length;
      const perc = Math.round((acertos / total) * 100);

      els.questaoContainer.innerHTML = "";
      els.nav.classList.add("hidden");

      els.resultado.innerHTML = `
        <div class="sim-resultado-card">
          <div class="sim-resultado-titulo">Resultado</div>
          <p class="text-sm text-[var(--muted)] mb-3">
            ${STATE.banca} · ${STATE.tema || "Sem tema"}
          </p>
          <div class="sim-score">${perc}%</div>
          <p class="sim-feedback">${porTempo ? "Encerrado por tempo." : ""}</p>

          <div class="mt-4 flex flex-wrap gap-2">
            <button id="sim-refazer" class="btn-secondary">Fazer outro</button>
            <button id="sim-dashboard" class="btn-primary">Ver desempenho</button>
          </div>
        </div>
      `;

      els.resultado.classList.remove("hidden");

      document.getElementById("sim-refazer").onclick = () =>
        window.location.reload();

      document.getElementById("sim-dashboard").onclick = () => {
        if (window.homeDashboard) window.homeDashboard();
      };
    }

    // -------------------------------------------------------
    // NAVEGAÇÃO
    // -------------------------------------------------------
    els.btnVoltar.onclick = () => {
      if (STATE.atual > 0) {
        STATE.atual--;
        renderQuestao();
      }
    };

    els.btnProxima.onclick = () => {
      if (STATE.atual < STATE.questoes.length - 1) {
        STATE.atual++;
        renderQuestao();
      } else {
        finalizarSimulado(false);
      }
    };

    // -------------------------------------------------------
    // INICIAR (BOTÃO DO MODAL)
    // -------------------------------------------------------
    els.btnIniciar.onclick = async () => {
      STATE.banca = els.selBanca.value;
      STATE.qtd = Number(els.selQtd.value);
      STATE.tempoMin = Number(els.selTempo.value);
      STATE.dificuldade = els.selDif.value;
      STATE.tema = els.inpTema.value.trim();

      fecharModal();

      // Gera IA → limpa → renderiza
      let raw = await gerarQuestoesIA(
        STATE.banca,
        STATE.qtd,
        STATE.tema,
        STATE.dificuldade
      );

      STATE.questoes = limparQuestoes(raw);
      STATE.atual = 0;

      els.resultado.classList.add("hidden");

      renderQuestao();
      startTimer();
    };

    console.log("🟢 Liora Simulados IA v90 carregado.");
  });
})();
