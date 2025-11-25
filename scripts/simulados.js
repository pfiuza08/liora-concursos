// ==============================================================
// 🧠 LIORA — SIMULADOS v95-IA-COMMERCIAL
// - Usa IA real via /api/liora para gerar questões
// - IA-C: seletor de IAs (chips) no modal
// - IA-D: badges de IA nas questões e resultado
// - Barra de loading linear enquanto a IA gera as questões
// - Remove duplicações de alternativas (por conteúdo, não só por string)
// - Mantém <u> e <mark> para destaques no enunciado
// - Compatível com FAB comercial (#sim-fab)
// - Timer, navegação, resultado, histórico (localStorage)
// ==============================================================

(function () {
  console.log("🔵 Liora Simulados v95-IA-COMMERCIAL carregado...");

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
    // CONFIG DE IAs (C/D)
    // -------------------------------------------------------
    const IA_CONFIG = {
      banca: {
        id: "banca",
        label: "IA Banca",
        emoji: "🏛️",
        badgeClass: "sim-ia-badge--banca",
        prompt:
          "ajuste o estilo das questões (vocabulário, pegadinhas, estrutura) para refletir fielmente a banca selecionada.",
      },
      explica: {
        id: "explica",
        label: "IA Explica",
        emoji: "💡",
        badgeClass: "sim-ia-badge--explica",
        prompt:
          "garanta que cada questão tenha gabarito consistente, com foco didático, permitindo explicações claras se solicitado.",
      },
      reforco: {
        id: "reforco",
        label: "IA Reforço",
        emoji: "📈",
        badgeClass: "sim-ia-badge--reforco",
        prompt:
          "priorize questões que reforcem conceitos centrais do tema e revisem armadilhas comuns do assunto.",
      },
      historico: {
        id: "historico",
        label: "IA Histórico",
        emoji: "🧠",
        badgeClass: "sim-ia-badge--historico",
        prompt:
          "simule adaptação com base em histórico de desempenho, variando levemente o nível de dificuldade.",
      },
    };

    const iaState = {
      selecionadas: new Set(["banca", "explica"]), // default
    };

    // -------------------------------------------------------
    // ESTADO GERAL DOS SIMULADOS
    // -------------------------------------------------------
    const HIST_KEY = "liora:simulados:historico";

    const STATE = {
      questoes: [],
      atual: 0,
      banca: "FGV",
      qtd: 10,
      dificuldade: "misturado",
      tema: "",
      tempoMin: 30,
      tempoRestante: 0,
      timerID: null,
      loadingIA: false,
      loadingIntervalID: null,
    };

    function loadHistorico() {
      try {
        const raw = localStorage.getItem(HIST_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function salvarNoHistorico(resumo) {
      try {
        const hist = loadHistorico();
        hist.push(resumo);
        localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      } catch (e) {
        console.warn("⚠️ Não foi possível salvar histórico de simulados", e);
      }
    }

    // -------------------------------------------------------
    // HELPER: seletor de IA (C) – cria chips no modal
    // -------------------------------------------------------
    function setupIaSelector() {
      const modalBody = document.querySelector("#sim-modal-backdrop .sim-modal-body");
      if (!modalBody) return;

      // Evita duplicar se já existir
      if (modalBody.querySelector(".sim-ia-row")) return;

      const row = document.createElement("div");
      row.className = "sim-ia-row";

      const label = document.createElement("div");
      label.className = "sim-ia-label";
      label.textContent = "IAs auxiliares (beta)";

      const options = document.createElement("div");
      options.className = "sim-ia-options";

      Object.values(IA_CONFIG).forEach((cfg) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "sim-ia-option";
        if (iaState.selecionadas.has(cfg.id)) {
          chip.classList.add("active");
        }
        chip.dataset.iaId = cfg.id;
        chip.innerHTML = `
          <span class="emoji">${cfg.emoji}</span>
          <span>${cfg.label}</span>
        `;
        chip.addEventListener("click", () => {
          if (iaState.selecionadas.has(cfg.id)) {
            // nunca deixe tudo desligado: mantém pelo menos IA Banca
            if (iaState.selecionadas.size === 1) return;
            iaState.selecionadas.delete(cfg.id);
            chip.classList.remove("active");
          } else {
            iaState.selecionadas.add(cfg.id);
            chip.classList.add("active");
          }
        });
        options.appendChild(chip);
      });

      row.appendChild(label);
      row.appendChild(options);
      modalBody.appendChild(row);
    }

    setupIaSelector();

    // -------------------------------------------------------
    // BADGES DE IA (D) – renderização
    // -------------------------------------------------------
    function renderIaBadges() {
      const selected = Array.from(iaState.selecionadas);
      if (!selected.length) return "";

      return `
        <span class="sim-ia-badges">
          ${selected
            .map((id) => {
              const cfg = IA_CONFIG[id];
              if (!cfg) return "";
              return `<span class="sim-ia-badge ${cfg.badgeClass}">${cfg.emoji} ${cfg.label}</span>`;
            })
            .join("")}
        </span>
      `;
    }

    function getIaPromptFragment() {
      const selected = Array.from(iaState.selecionadas);
      if (!selected.length) return "";

      const lines = selected
        .map((id) => IA_CONFIG[id])
        .filter(Boolean)
        .map((cfg) => `- Use o modo "${cfg.label}": ${cfg.prompt}`);

      return `
Além das regras acima, considere que o usuário ativou os seguintes modos de IA auxiliares:
${lines.join("\n")}
`;
    }

    // -------------------------------------------------------
    // 🔥 OPENAI / LLM HELPER
    // -------------------------------------------------------
    async function gerarQuestoesIA(banca, qtd, tema, dificuldade) {
      const iaFragmento = getIaPromptFragment();

      const prompt = `
Gere ${qtd} questões originais de concurso da banca ${banca}, tema: "${tema || "tema geral do edital"}".
Níveis possíveis: fácil, médio, difícil. O simulado solicitado: ${dificuldade}.

Regras obrigatórias:

1) Retorne APENAS JSON. NUNCA inclua explicações fora do JSON.
2) Cada questão deve ter esta estrutura mínima:
{
  "enunciado": "...",
  "alternativas": ["A...", "B...", "C...", "D..."],
  "corretaIndex": 0-3,
  "nivel": "facil|medio|dificil"
}

3) Regras de qualidade:
- NUNCA gere alternativas repetidas, parecidas ou semanticamente equivalentes.
- Evite alternativas genéricas como "todas as anteriores" ou "nenhuma das anteriores", a menos que realmente faça sentido.
- Se precisar destacar um trecho, use <u>trecho</u> ou <mark>trecho</mark>.
- Não use formatação Markdown (*, **, __) no enunciado nem nas alternativas.
- O enunciado deve ser 100% autossuficiente e não pode depender de imagens.

${iaFragmento}

Retorne o JSON final com uma lista:
[
  {...},
  {...}
]
`;

      const res = await fetch("/api/liora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "Você é Liora, criadora de simulados para concursos, extremamente cuidadosa com a qualidade das questões.",
          user: prompt,
        }),
      });

      const json = await res.json().catch(() => ({}));
      let data = [];

      if (!json || !json.output) {
        console.warn("⚠ Resposta da IA sem campo output", json);
        return [];
      }

      try {
        // tenta extrair apenas o JSON (caso venha rodeado por texto)
        let raw = json.output;
        const block =
          raw.match(/```json([\s\S]*?)```/i) ||
          raw.match(/```([\s\S]*?)```/i);
        if (block) {
          raw = block[1];
        }
        const first = raw.search(/[\[\{]/);
        const lastBrace = raw.lastIndexOf("}");
        const lastBracket = raw.lastIndexOf("]");
        const last = Math.max(lastBrace, lastBracket);
        if (first !== -1 && last > first) {
          raw = raw.slice(first, last + 1);
        }

        data = JSON.parse(raw);
      } catch (e) {
        console.warn("⚠ JSON inválido da IA, tentando fallback bruto.", e);
        try {
          data = JSON.parse(json.output);
        } catch {
          data = [];
        }
      }

      return Array.isArray(data) ? data : [];
    }

    // -------------------------------------------------------
    // AJUSTES DE QUALIDADE (remove duplicações de alternativas)
    // -------------------------------------------------------
    function limparQuestoes(raw) {
      return raw
        .filter((q) => q && q.enunciado && Array.isArray(q.alternativas))
        .map((q, idx) => {
          const seen = new Set();
          const alternativas = [];

          q.alternativas.forEach((alt) => {
            if (!alt) return;
            const original = String(alt).trim();
            if (!original) return;
            const norm = original
              .toLowerCase()
              .replace(/\s+/g, " ")
              .replace(/[.,;:!?]/g, "");
            if (seen.has(norm)) return;
            seen.add(norm);
            alternativas.push(original);
          });

          // se IA devolveu menos que 4 alternativas, completa artificialmente
          const letras = ["A", "B", "C", "D", "E", "F"];
          while (alternativas.length < 4) {
            const idxAlt = alternativas.length;
            alternativas.push(`Alternativa ${letras[idxAlt] || idxAlt + 1}`);
          }

          const limpaEnunciado = String(q.enunciado || "")
            .replace(/[_*~`]/g, "") // remove marcas markdown
            // remove tags HTML exceto <u> e <mark>
            .replace(/<(?!\/?(u|mark)\b)[^>]+>/gi, "");

          let corretaIdx = Number(q.corretaIndex);
          if (Number.isNaN(corretaIdx) || corretaIdx < 0) corretaIdx = 0;
          if (corretaIdx >= alternativas.length) corretaIdx = alternativas.length - 1;

          return {
            enunciado: limpaEnunciado,
            alternativas,
            corretaIndex: corretaIdx,
            nivel: q.nivel || "medio",
            indice: idx + 1,
            resp: null,
          };
        })
        .filter(Boolean);
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
    if (els.modalClose) els.modalClose.onclick = fecharModal;
    els.modal.onclick = (e) => {
      if (e.target === els.modal) fecharModal();
    };

    // -------------------------------------------------------
    // LOADING DA IA — barra linear
    // -------------------------------------------------------
    function setIaLoading(ativo) {
      STATE.loadingIA = ativo;

      if (ativo) {
        // Estado visual: mensagem e barra enchendo
        if (els.questaoContainer) {
          els.questaoContainer.innerHTML = `
            <div class="sim-questao-card">
              <p class="text-sm text-[var(--muted)] mb-2">
                Gerando questões com IA${STATE.tema ? ` para <b>${STATE.tema}</b>` : ""}...
              </p>
              <div class="sim-progress w-full mb-1">
                <div id="sim-ia-loading-bar" class="sim-progress-fill" style="width: 8%;"></div>
              </div>
              <p class="text-[0.75rem] text-[var(--muted)]">
                Isso pode levar alguns instantes. As questões serão ajustadas para o estilo da banca e das IAs selecionadas.
              </p>
            </div>
          `;
        }
        if (els.nav) els.nav.classList.add("hidden");
        if (els.resultado) {
          els.resultado.classList.add("hidden");
          els.resultado.innerHTML = "";
        }

        let pct = 8;
        const bar = () => document.getElementById("sim-ia-loading-bar");
        STATE.loadingIntervalID = setInterval(() => {
          if (!STATE.loadingIA) return;
          pct += Math.random() * 5;
          if (pct > 92) pct = 92;
          const el = bar();
          if (el) el.style.width = pct + "%";
        }, 400);
      } else {
        if (STATE.loadingIntervalID) {
          clearInterval(STATE.loadingIntervalID);
          STATE.loadingIntervalID = null;
        }
        // barra normal será reposicionada pelo renderQuestao()
      }
    }

    // -------------------------------------------------------
    // TIMER
    // -------------------------------------------------------
    const formatTime = (sec) =>
      `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

    function startTimer() {
      STATE.tempoRestante = STATE.tempoMin * 60;
      if (els.timer) {
        els.timer.classList.remove("hidden");
        els.timer.textContent = formatTime(STATE.tempoRestante);
      }

      STATE.timerID = setInterval(() => {
        STATE.tempoRestante--;
        if (els.timer) {
          els.timer.textContent = formatTime(Math.max(STATE.tempoRestante, 0));
        }

        if (STATE.tempoRestante <= 0) {
          clearInterval(STATE.timerID);
          STATE.timerID = null;
          finalizarSimulado(true);
        }
      }, 1000);
    }

    function stopTimer() {
      if (STATE.timerID) {
        clearInterval(STATE.timerID);
        STATE.timerID = null;
      }
    }

    // -------------------------------------------------------
    // RENDER QUESTÃO
    // -------------------------------------------------------
    function renderQuestao() {
      const total = STATE.questoes.length;
      if (!total || !els.questaoContainer || !els.progressBar) return;

      const q = STATE.questoes[STATE.atual];

      els.questaoContainer.innerHTML = "";
      els.progressBar.style.width = ((STATE.atual + 1) / total) * 100 + "%";

      // Cabeçalho
      const header = document.createElement("div");
      header.className = "flex justify-between items-center text-xs text-[var(--muted)] mb-2";
      header.innerHTML = `
        <span>Questão ${STATE.atual + 1} de ${total}</span>
        ${renderIaBadges()}
      `;
      els.questaoContainer.appendChild(header);

      // Card da questão
      const card = document.createElement("div");
      card.className = "sim-questao-card";

      const p = document.createElement("p");
      p.className = "sim-enunciado mb-2 whitespace-pre-line";
      // mantém <u> e <mark> como HTML
      p.innerHTML = q.enunciado;
      card.appendChild(p);

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
        card.appendChild(div);
      });

      els.questaoContainer.appendChild(card);

      if (els.nav) els.nav.classList.remove("hidden");
      if (els.btnProxima) {
        els.btnProxima.textContent =
          STATE.atual === total - 1 ? "Finalizar ▶" : "Próxima ▶";
      }
      if (els.btnVoltar) {
        els.btnVoltar.disabled = STATE.atual === 0;
      }
    }

    // -------------------------------------------------------
    // FINALIZAR SIMULADO
    // -------------------------------------------------------
    function finalizarSimulado(porTempo = false) {
      stopTimer();

      const total = STATE.questoes.length;
      let acertos = 0;
      STATE.questoes.forEach((q) => {
        if (q.resp === q.corretaIndex) acertos++;
      });

      const perc = total ? Math.round((acertos / total) * 100) : 0;
      const tempoTotal = STATE.tempoMin * 60;
      const tempoUsado = Math.max(0, tempoTotal - STATE.tempoRestante);
      const tempoFmt = formatTime(tempoUsado);

      if (els.questaoContainer) els.questaoContainer.innerHTML = "";
      if (els.nav) els.nav.classList.add("hidden");

      if (els.resultado) {
        els.resultado.innerHTML = `
          <div class="sim-resultado-card">
            <div class="flex justify-between items-start gap-3">
              <div>
                <div class="sim-resultado-titulo">Resultado do simulado</div>
                <p class="text-xs text-[var(--muted)] mb-1">
                  ${STATE.banca} · ${STATE.tema || "Tema não informado"}
                </p>
                <div>${renderIaBadges()}</div>
              </div>
              <div class="text-right">
                <div class="sim-score">${perc}%</div>
                <p class="text-[0.7rem] text-[var(--muted)]">
                  ${acertos} acertos em ${total} questões
                </p>
              </div>
            </div>

            <p class="sim-feedback">
              Tempo utilizado: ${tempoFmt}${porTempo ? " · Encerrado por tempo." : ""}<br>
              Este simulado foi gerado em modo beta com IAs auxiliares. Em breve, a Liora vai usar
              seu histórico real para calibrar ainda mais as questões.
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button" id="sim-refazer" class="btn-secondary">Fazer outro simulado</button>
              <button type="button" id="sim-dashboard" class="btn-primary">Ver meu desempenho</button>
            </div>
          </div>
        `;

        els.resultado.classList.remove("hidden");
      }

      // Salva no histórico (para o dashboard)
      const resumo = {
        dataISO: new Date().toISOString(),
        banca: STATE.banca,
        tema: STATE.tema,
        qtd: total,
        acertos,
        perc,
        tempoSeg: tempoUsado,
        ia: Array.from(iaState.selecionadas),
      };
      salvarNoHistorico(resumo);

      // Handlers dos botões
      const btnRefazer = document.getElementById("sim-refazer");
      if (btnRefazer) {
        btnRefazer.onclick = () => window.location.reload();
      }

      const btnDash = document.getElementById("sim-dashboard");
      if (btnDash) {
        btnDash.onclick = () => {
          if (window.homeDashboard) {
            window.homeDashboard();
          } else {
            window.location.reload();
          }
        };
      }
    }

    // -------------------------------------------------------
    // NAVEGAÇÃO
    // -------------------------------------------------------
    if (els.btnVoltar) {
      els.btnVoltar.onclick = () => {
        if (STATE.atual > 0) {
          STATE.atual--;
          renderQuestao();
        }
      };
    }

    if (els.btnProxima) {
      els.btnProxima.onclick = () => {
        if (!STATE.questoes.length) return;
        if (STATE.atual < STATE.questoes.length - 1) {
          STATE.atual++;
          renderQuestao();
        } else {
          finalizarSimulado(false);
        }
      };
    }

    // -------------------------------------------------------
    // INICIAR (BOTÃO DO MODAL)
    // -------------------------------------------------------
    if (els.btnIniciar) {
      els.btnIniciar.onclick = async () => {
        if (!els.selBanca || !els.selQtd || !els.selTempo || !els.selDif) return;

        STATE.banca = els.selBanca.value || "FGV";
        STATE.qtd = Number(els.selQtd.value || "10");
        STATE.tempoMin = Number(els.selTempo.value || "30");
        STATE.dificuldade = els.selDif.value || "misturado";
        STATE.tema = els.inpTema ? els.inpTema.value.trim() : "";

        fecharModal();

        // LOADING IA ON
        setIaLoading(true);

        try {
          let raw = await gerarQuestoesIA(
            STATE.banca,
            STATE.qtd,
            STATE.tema,
            STATE.dificuldade
          );

          const limpas = limparQuestoes(raw);

          if (!limpas.length) {
            if (els.questaoContainer) {
              els.questaoContainer.innerHTML = `
                <p class="text-sm text-[var(--muted)]">
                  Não foi possível gerar questões com a IA neste momento. Tente novamente em instantes.
                </p>
              `;
            }
            setIaLoading(false);
            return;
          }

          STATE.questoes = limpas;
          STATE.atual = 0;

          if (els.resultado) {
            els.resultado.classList.add("hidden");
            els.resultado.innerHTML = "";
          }

          // LOADING IA OFF → inicia simulado
          setIaLoading(false);
          renderQuestao();
          startTimer();
        } catch (e) {
          console.error("❌ Erro ao gerar questões IA", e);
          setIaLoading(false);
          if (els.questaoContainer) {
            els.questaoContainer.innerHTML = `
              <p class="text-sm text-red-400">
                Ocorreu um erro ao falar com a IA. Verifique sua conexão e tente novamente.
              </p>
            `;
          }
        }
      };
    }

    console.log("🟢 Liora Simulados IA v95 inicializado.");
  });
})();
