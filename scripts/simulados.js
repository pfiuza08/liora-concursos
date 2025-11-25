// ==============================================================
// 🧠 LIORA — SIMULADOS v95-IA-HYBRID
// - Usa IA real via /api/liora para gerar questões
// - Dedup de alternativas + preenchimento até 4 itens
// - Permite destaque com <u> e <mark> no enunciado
// - Selector de IAs (chips) no modal
// - Badges de IA no cabeçalho da questão e no resultado
// - Compatível com FAB comercial (#sim-fab)
// - Timer, navegação, resultado, histórico (Dashboard)
// ==============================================================
(function () {
  console.log("🔵 Liora Simulados v95-IA-HYBRID carregado...");

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

    const modalBody = document.querySelector("#sim-modal-backdrop .sim-modal-body");

    // -------------------------------------------------------
    // ESTADO
    // -------------------------------------------------------
    const HIST_KEY = "liora:simulados:historico";

    const IA_PROFILES = {
      banca: {
        id: "banca",
        label: "IA Banca",
        emoji: "🎯",
        badgeClass: "sim-ia-badge--banca",
        badgeLabel: "IA BANCA",
      },
      explica: {
        id: "explica",
        label: "IA Explica",
        emoji: "🧠",
        badgeClass: "sim-ia-badge--explica",
        badgeLabel: "IA EXPLICADORA",
      },
      reforco: {
        id: "reforco",
        label: "IA Reforço",
        emoji: "📌",
        badgeClass: "sim-ia-badge--reforco",
        badgeLabel: "IA REFORÇO",
      },
      historico: {
        id: "historico",
        label: "IA Histórico",
        emoji: "📊",
        badgeClass: "sim-ia-badge--historico",
        badgeLabel: "IA HISTÓRICO",
      },
    };

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
      ias: new Set(["banca", "explica"]), // IAs ativas por padrão
    };

    // -------------------------------------------------------
    // HISTÓRICO (Dashboard)
    // -------------------------------------------------------
    function carregarHistorico() {
      try {
        const raw = localStorage.getItem(HIST_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function salvarHistorico(resumo) {
      try {
        const hist = carregarHistorico();
        hist.push(resumo);
        localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      } catch (e) {
        console.warn("⚠️ Não foi possível salvar histórico de simulados", e);
      }
    }

    // -------------------------------------------------------
    // 🔥 OPENAI / LLM HELPER
    // -------------------------------------------------------
    async function gerarQuestoesIA(banca, qtd, tema, dificuldade, iasAtivas) {
      const iasTexto = iasAtivas && iasAtivas.length
        ? iasAtivas.join(", ")
        : "banca";

      const prompt = `
Gere ${qtd} questões originais de concurso da banca ${banca}, tema: "${tema || "conhecimento geral"}".
Níveis possíveis: fácil, médio, difícil. O simulado solicitado: ${dificuldade}.
As IAs ativas são: ${iasTexto}.

Regras obrigatórias:

1) Retorne APENAS JSON. NUNCA inclua explicações fora do JSON.
2) Cada questão deve ter esta estrutura:

{
  "enunciado": "texto do enunciado",
  "alternativas": ["A...", "B...", "C...", "D..."],
  "corretaIndex": 0-3,
  "nivel": "facil|medio|dificil"
}

3) Regras de qualidade:
- NUNCA gere alternativas repetidas, parecidas ou equivalentes.
- Evite qualquer marcação do tipo [sublinhado], **texto**, __texto__ ou similares.
- Se for realmente necessário destacar um trecho no enunciado, use APENAS tags HTML simples:
  - <u>texto</u> para sublinhar
  - <mark>texto</mark> para destacar
- Não utilize outras tags HTML além de <u> e <mark>.
- O enunciado deve ser 100% autossuficiente, sem referência a imagens ou anexos.
- Todas as alternativas devem ser curtas, claras e bem distintas.
- Mantenha o estilo e o nível de dificuldade típicos da banca ${banca}.

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
          system: "Você é Liora, criadora de simulados de alta qualidade para concursos.",
          user: prompt,
        }),
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
    // AJUSTES DE QUALIDADE (remove duplicações + sanitiza)
    // -------------------------------------------------------
    function limparQuestoes(raw) {
      return raw.map((q, idx) => {
        const alternativasOrig = Array.isArray(q.alternativas) ? q.alternativas : [];

        // Remove duplicadas (case-insensitive + trim)
        const seen = new Set();
        const alternativas = [];
        for (const alt of alternativasOrig) {
          if (typeof alt !== "string") continue;
          const key = alt.trim().toLowerCase();
          if (!key) continue;
          if (seen.has(key)) continue;
          seen.add(key);
          alternativas.push(alt.trim());
        }

        // se IA devolveu menos que 4 alternativas, completa artificialmente
        while (alternativas.length < 4) {
          alternativas.push("Alternativa ajustada " + (alternativas.length + 1));
        }

        let enunciado = typeof q.enunciado === "string" ? q.enunciado : "";

        // remove formatação markdown simples
        enunciado = enunciado.replace(/[_*~`]/g, "");

        // remove TODAS as tags HTML exceto <u> e <mark>
        enunciado = enunciado.replace(
          /<(?!\/?(u|mark)\b)[^>]*>/gi,
          ""
        );

        const corretaIndex = Number.isInteger(q.corretaIndex)
          ? Math.max(0, Math.min(q.corretaIndex, alternativas.length - 1))
          : 0;

        return {
          enunciado,
          alternativas,
          corretaIndex,
          nivel: q.nivel || "medio",
          indice: idx + 1,
          resp: null,
        };
      });
    }

    // -------------------------------------------------------
    // MODAL — Abrir/Fechar
    // -------------------------------------------------------
    function abrirModal() {
      if (!els.modal) return;
      els.modal.classList.add("visible");
      els.modal.classList.remove("hidden");
    }

    function fecharModal() {
      if (!els.modal) return;
      els.modal.classList.remove("visible");
      els.modal.classList.add("hidden");
    }

    if (els.fabSim) {
      els.fabSim.onclick = abrirModal;
    }

    if (els.modalClose) {
      els.modalClose.onclick = fecharModal;
    }

    if (els.modal) {
      els.modal.onclick = (e) => {
        if (e.target === els.modal) fecharModal();
      };
    }

    // -------------------------------------------------------
    // SELETOR DE IAs (chips no modal)
    // -------------------------------------------------------
    function renderIAChips() {
      if (!modalBody) return;

      const row = document.createElement("div");
      row.className = "sim-ia-row";

      const label = document.createElement("div");
      label.className = "sim-ia-label";
      label.textContent = "IAs inteligentes";

      const optionsWrap = document.createElement("div");
      optionsWrap.className = "sim-ia-options";

      Object.values(IA_PROFILES).forEach((ia) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "sim-ia-option";
        chip.dataset.ia = ia.id;
        chip.innerHTML = `
          <span class="emoji">${ia.emoji}</span>
          <span>${ia.label}</span>
        `;

        chip.addEventListener("click", () => {
          const id = ia.id;
          if (STATE.ias.has(id)) {
            // garante ao menos uma IA ativa
            if (STATE.ias.size === 1) return;
            STATE.ias.delete(id);
          } else {
            STATE.ias.add(id);
          }
          updateIAChips();
        });

        optionsWrap.appendChild(chip);
      });

      row.appendChild(label);
      row.appendChild(optionsWrap);
      modalBody.appendChild(row);

      updateIAChips();
    }

    function updateIAChips() {
      const chips = modalBody
        ? modalBody.querySelectorAll(".sim-ia-option")
        : [];
      chips.forEach((chip) => {
        const id = chip.dataset.ia;
        if (STATE.ias.has(id)) {
          chip.classList.add("active");
        } else {
          chip.classList.remove("active");
        }
      });
    }

    renderIAChips();

    // -------------------------------------------------------
    // TIMER
    // -------------------------------------------------------
    const formatTempo = (sec) =>
      `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

    function startTimer() {
      STATE.tempoRestante = STATE.tempoMin * 60;
      if (els.timer) {
        els.timer.classList.remove("hidden");
        els.timer.textContent = formatTempo(STATE.tempoRestante);
      }

      STATE.timerID = setInterval(() => {
        STATE.tempoRestante--;

        if (els.timer) {
          els.timer.textContent = formatTempo(Math.max(STATE.tempoRestante, 0));
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
    // BADGES DE IA (para cabeçalho / resultado)
    // -------------------------------------------------------
    function renderIABadgesHTML() {
      const ias = Array.from(STATE.ias);
      if (!ias.length) return "";

      const badges = ias
        .map((id) => {
          const ia = IA_PROFILES[id];
          if (!ia) return "";
          return `<span class="sim-ia-badge ${ia.badgeClass}">${ia.badgeLabel}</span>`;
        })
        .join("");

      return `<span class="sim-ia-badges">${badges}</span>`;
    }

    // -------------------------------------------------------
    // RENDER QUESTÃO
    // -------------------------------------------------------
    function renderQuestao() {
      if (!els.questaoContainer || !els.progressBar || !els.nav) return;
      const total = STATE.questoes.length;
      if (!total) {
        els.questaoContainer.innerHTML =
          '<p class="text-sm text-[var(--muted)]">Nenhum simulado em andamento. Use o botão ⚙ no canto inferior direito para configurar um simulado.</p>';
        els.nav.classList.add("hidden");
        if (els.progressBar) els.progressBar.style.width = "0%";
        return;
      }

      const q = STATE.questoes[STATE.atual];
      els.questaoContainer.innerHTML = "";
      els.progressBar.style.width = ((STATE.atual + 1) / total) * 100 + "%";

      // Cabeçalho
      const header = document.createElement("div");
      header.className = "flex justify-between items-center text-xs text-[var(--muted)] mb-2";
      header.innerHTML = `
        <span>Questão ${STATE.atual + 1} de ${total}</span>
        <span class="flex items-center gap-2">
          <span>${(q.nivel || "médio").toUpperCase()}</span>
          ${renderIABadgesHTML()}
        </span>
      `;
      els.questaoContainer.appendChild(header);

      // Cartão da questão
      const card = document.createElement("div");
      card.className = "sim-questao-card";
      els.questaoContainer.appendChild(card);

      // Enunciado
      const p = document.createElement("p");
      p.className = "sim-enunciado mb-2 whitespace-pre-line";
      // usamos innerHTML para permitir <u> e <mark> (após sanitização)
      p.innerHTML = q.enunciado;
      card.appendChild(p);

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
        card.appendChild(div);
      });

      els.nav.classList.remove("hidden");
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

      if (!els.resultado || !els.questaoContainer || !els.nav) return;

      let acertos = 0;
      STATE.questoes.forEach((q) => {
        if (q.resp === q.corretaIndex) acertos++;
      });

      const total = STATE.questoes.length;
      const perc = total ? Math.round((acertos / total) * 100) : 0;

      const tempoTotalSeg = STATE.tempoMin * 60;
      const tempoUsadoSeg = Math.max(
        0,
        tempoTotalSeg - Math.max(STATE.tempoRestante, 0)
      );
      const tempoUsadoFmt = formatTempo(tempoUsadoSeg);

      els.questaoContainer.innerHTML = "";
      els.nav.classList.add("hidden");

      const badgesHTML = renderIABadgesHTML();

      els.resultado.innerHTML = `
        <div class="sim-resultado-card">
          <div class="flex justify-between items-start gap-3">
            <div>
              <div class="sim-resultado-titulo">Resultado do simulado</div>
              <p class="text-xs text-[var(--muted)]">
                ${STATE.banca} · ${STATE.tema || "Sem tema"}
              </p>
              <div class="mt-1">
                ${badgesHTML}
              </div>
            </div>
            <div class="text-right">
              <div class="text-[0.7rem] uppercase tracking-wide text-[var(--muted)]">Desempenho</div>
              <div class="sim-score">${perc}%</div>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <div class="font-semibold">Acertos</div>
              <div>${acertos} de ${total}</div>
            </div>
            <div>
              <div class="font-semibold">Questões respondidas</div>
              <div>${STATE.questoes.filter(q => q.resp != null).length} de ${total}</div>
            </div>
            <div>
              <div class="font-semibold">Tempo utilizado</div>
              <div>
                ${tempoUsadoFmt}
                ${porTempo ? "<span class='sim-resultado-tag ml-1'>Encerrado por tempo</span>" : ""}
              </div>
            </div>
          </div>

          <p class="sim-feedback">
            Nesta versão, as questões são geradas por IA no estilo da banca escolhida.
            Em breve, a Liora vai combinar seu histórico real de estudo para ajustar ainda mais
            o nível das provas.
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" id="sim-refazer" class="btn-secondary">Fazer outro simulado</button>
            <button type="button" id="sim-dashboard" class="btn-primary">Ver meu desempenho</button>
          </div>
        </div>
      `;

      els.resultado.classList.remove("hidden");

      const btnRefazer = document.getElementById("sim-refazer");
      if (btnRefazer) {
        btnRefazer.onclick = () => window.location.reload();
      }

      const btnDash = document.getElementById("sim-dashboard");
      if (btnDash) {
        btnDash.onclick = () => {
          if (window.homeDashboard) {
            window.homeDashboard();
          }
        };
      }

      // Salvar no histórico (Dashboard)
      const resumo = {
        dataISO: new Date().toISOString(),
        banca: STATE.banca,
        tema: STATE.tema,
        qtd: total,
        acertos,
        perc,
        tempoSeg: tempoUsadoSeg,
        ias: Array.from(STATE.ias),
      };
      salvarHistorico(resumo);
    }

    // -------------------------------------------------------
    // NAVEGAÇÃO ENTRE QUESTÕES
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
        STATE.qtd = Number(els.selQtd.value || "20");
        STATE.tempoMin = Number(els.selTempo.value || "30");
        STATE.dificuldade = els.selDif.value || "misturado";
        STATE.tema = (els.inpTema && els.inpTema.value.trim()) || "";

        fecharModal();

        // Reset visual
        if (els.resultado) {
          els.resultado.classList.add("hidden");
          els.resultado.innerHTML = "";
        }
        if (els.timer) {
          els.timer.classList.add("hidden");
          els.timer.textContent = "00:00";
        }
        if (els.progressBar) {
          els.progressBar.style.width = "0%";
        }

        try {
          const raw = await gerarQuestoesIA(
            STATE.banca,
            STATE.qtd,
            STATE.tema,
            STATE.dificuldade,
            Array.from(STATE.ias)
          );

          if (!raw || !raw.length) {
            els.questaoContainer.innerHTML =
              '<p class="text-sm text-[var(--muted)]">Não foi possível gerar questões no momento. Tente novamente em instantes.</p>';
            return;
          }

          STATE.questoes = limparQuestoes(raw);
          STATE.atual = 0;

          renderQuestao();
          startTimer();
        } catch (e) {
          console.error("Erro ao gerar simulado:", e);
          els.questaoContainer.innerHTML =
            '<p class="text-sm text-[var(--muted)]">Ocorreu um erro ao gerar o simulado. Tente novamente.</p>';
        }
      };
    }

    console.log("🟢 Liora Simulados IA v95 pronto.");
  });
})();
