// =============================================================
// 🧠 LIORA — SIMULADOS v103.6-FREEMIUM-CANONICAL
// - Baseado no v103.5-FLOW-CANONICAL
// - Free = experiência completa com limites
// - Premium = ilimitado
// - Limites via limits.js + usage.js
// =============================================================

(function () {
  console.log("🟢 Liora Simulados v103.6 carregado");

  // -------------------------------------------------
  // STATE LOCAL (isolado)
  // -------------------------------------------------
  const STATE = {
    questoes: [],
    atual: 0,
    timerID: null,
    tempoRestante: 0,
    config: null,
    modalOpen: false
  };

  // -------------------------------------------------
  // HELPERS
  // -------------------------------------------------
  const qs = (id) => document.getElementById(id);

  function getEls() {
    return {
      modal: qs("sim-modal-backdrop"),
      close: qs("sim-modal-close-btn"),
      iniciar: qs("sim-modal-iniciar"),

      banca: qs("sim-modal-banca"),
      qtd: qs("sim-modal-qtd"),
      tempo: qs("sim-modal-tempo"),
      dif: qs("sim-modal-dificuldade"),
      tema: qs("sim-modal-tema"),

      container: qs("sim-questao-container"),
      nav: qs("sim-nav"),
      btnProx: qs("sim-btn-proxima"),
      btnVoltar: qs("sim-btn-voltar"),
      resultado: qs("sim-resultado"),
      timer: qs("sim-timer"),
      progress: qs("sim-progress-bar")
    };
  }

  // -------------------------------------------------
  // 🔐 ACESSO CANÔNICO (FREE vs PREMIUM)
  // -------------------------------------------------
  function getSimuladoAccess() {
    const user = window.lioraAuth?.user || null;
    const plan = window.lioraUserPlan || "free";

    if (!user) {
      return { ok: false, reason: "login" };
    }

    const limits = window.lioraLimits?.[plan];
    if (!limits) {
      return { ok: false, reason: "config" };
    }

    if (!window.lioraUsage?.podeCriarSimulado(plan)) {
      return { ok: false, reason: "limit" };
    }

    return {
      ok: true,
      plan,
      maxQuestoes: limits.simulados.questoesPorSimulado
    };
  }

  // -------------------------------------------------
  // MODAL
  // -------------------------------------------------
  function abrirModal(access) {
    const els = getEls();
    if (!els.modal || STATE.modalOpen) return;

    STATE.modalOpen = true;

    els.modal.classList.remove("hidden");
    els.modal.classList.add("visible");

    if (els.qtd) {
      els.qtd.value = access.maxQuestoes;
      els.qtd.disabled = access.maxQuestoes !== Infinity;
    }
  }
  
 // -------------------------------------------------
  function fecharModal() {
    const els = getEls();
    if (!els.modal) return;

    els.modal.classList.remove("visible");
    els.modal.classList.add("hidden");
    STATE.modalOpen = false;
  }

  // -------------------------------------------------
  // 🔔 EVENTO CANÔNICO — abrir simulado
  // -------------------------------------------------
  window.addEventListener("liora:abrir-simulado", () => {
    console.log("🟢 Evento liora:abrir-simulado recebido");

    const access = getSimuladoAccess();

    if (!access.ok && access.reason === "login") {
      alert("Faça login para iniciar um simulado.");
      return;
    }

    if (!access.ok && access.reason === "limit") {
      window.dispatchEvent(new Event("liora:premium-bloqueado"));
      return;
    }

    if (!access.ok) {
      alert("Erro ao verificar acesso. Recarregue a página.");
      return;
    }

    abrirModal(access);
  });

  // -------------------------------------------------
  // IA — geração das questões
  // -------------------------------------------------
  async function gerarQuestoes(config) {
    const res = await fetch("/api/liora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: "Você é Liora, criadora de simulados educacionais.",
        user: `
Gere ${config.qtd} questões da banca ${config.banca}.
Tema: ${config.tema || "geral"}.
Dificuldade: ${config.dificuldade}.

Retorne APENAS JSON válido no formato:
[
  {
    "enunciado": "...",
    "alternativas": ["A...", "B...", "C...", "D..."],
    "corretaIndex": 0
  }
]
`
      })
    });

    const json = await res.json();
    let raw = json.output;

    if (typeof raw === "string") {
      raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1) {
      throw new Error("Resposta inválida da IA");
    }

    return JSON.parse(raw.slice(start, end + 1));
  }
 // -------------------------------------------------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
 
 
  
 // -------------------------------------------------
  function limparQuestoes(lista) {
  return lista.map((q, idx) => {
    const alternativasOriginais = q.alternativas.slice(0, 4);

    // cria estrutura com flag de correta
    let alternativas = alternativasOriginais.map((texto, i) => ({
      texto: String(texto),
      correta: i === Number(q.corretaIndex)
    }));

    // embaralha
    alternativas = shuffle(alternativas);

    // recalcula o índice correto
    const novaCorretaIndex = alternativas.findIndex(a => a.correta);

    return {
      indice: idx + 1,
      enunciado: String(q.enunciado),
      alternativas: alternativas.map(a => a.texto),
      corretaIndex: novaCorretaIndex >= 0 ? novaCorretaIndex : 0,
      resp: null
    };
  });
}


  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------
  function renderQuestao() {
    const els = getEls();
    const q = STATE.questoes[STATE.atual];
    if (!q) return;

    els.resultado?.classList.add("hidden");
    els.nav?.classList.remove("hidden");

    els.container.innerHTML = `
      <div class="sim-questao-card">
        <div class="sim-status">
         Questão ${STATE.atual + 1} de ${STATE.questoes.length}
        </div>
        <p>${q.enunciado}</p>
        ${q.alternativas
          .map(
            (a, i) =>
              `<button class="sim-alt ${q.resp === i ? "selected" : ""}" data-i="${i}">
                ${a}
              </button>`
          )
          .join("")}
      </div>
    `;

    els.container.querySelectorAll(".sim-alt").forEach((btn) => {
      btn.onclick = () => {
        q.resp = Number(btn.dataset.i);
        renderQuestao();
      };
    });

    els.btnProx.textContent =
      STATE.atual === STATE.questoes.length - 1
        ? "Finalizar ▶"
        : "Próxima ▶";

    els.btnVoltar.disabled = STATE.atual === 0;
  }
 
  function calcularResultado() {
  let acertos = 0;

  STATE.questoes.forEach((q) => {
    if (q.resp === q.corretaIndex) acertos++;
  });

  return {
    total: STATE.questoes.length,
    acertos,
    erros: STATE.questoes.length - acertos,
    percentual: Math.round((acertos / STATE.questoes.length) * 100)
  };
}
  
 // -------------------------------------------------
 // FINALIZAR
 // ------------------------------------------------- 
  
 function finalizar() {
  const els = getEls();
  clearInterval(STATE.timerID);

  // -----------------------------
  // CÁLCULO DE RESULTADOS
  // -----------------------------
  const total = STATE.questoes.length;

  let acertos = 0;
  STATE.questoes.forEach((q) => {
    if (q.resp === q.corretaIndex) acertos++;
  });

  const erros = total - acertos;
  const percentual = Math.round((acertos / total) * 100);

  // -----------------------------
  // LIMPA UI ATUAL
  // -----------------------------
  els.container.innerHTML = "";
  els.nav.classList.add("hidden");

  // -----------------------------
  // MODO DO USUÁRIO
  // -----------------------------
  const plan = window.lioraState?.plan || "free";
  const isPremium = plan === "premium";

  // -----------------------------
  // HTML DO RESULTADO
  // -----------------------------
  els.resultado.innerHTML = `
    <div class="sim-resultado-card">
      <h3>📊 Resultado do Simulado</h3>

      <div class="sim-resultado-metricas">
        <div class="sim-metrica">
          <strong>${acertos}</strong>
          <span>Acertos</span>
        </div>
        <div class="sim-metrica">
          <strong>${erros}</strong>
          <span>Erros</span>
        </div>
        <div class="sim-metrica">
          <strong>${percentual}%</strong>
          <span>Aproveitamento</span>
        </div>
      </div>

      ${
        isPremium
          ? `<p class="sim-msg-premium">✅ Seu desempenho foi salvo no histórico.</p>`
          : `<p class="sim-msg-free">
               Você utilizou seu simulado gratuito de hoje.<br>
               No <strong>Liora+</strong> você pode praticar quantas vezes quiser.
             </p>`
      }

      <div class="sim-resultado-acoes">
        ${
          isPremium
            ? `<button class="btn-secundario" id="sim-refazer">
                 🔁 Novo simulado
               </button>`
            : `<button class="btn-primario" id="sim-upgrade">
                 🚀 Conhecer o Liora Premium
               </button>`
        }

        <button class="btn-secundario" id="sim-voltar-home">
          ⬅ Voltar ao início
        </button>
      </div>
    </div>
  `;

  els.resultado.classList.remove("hidden");

  // -----------------------------
  // AÇÕES DOS BOTÕES
  // -----------------------------
  document.getElementById("sim-voltar-home")?.addEventListener("click", () => {
    document.getElementById("fab-home")?.click();
  });

  document.getElementById("sim-refazer")?.addEventListener("click", () => {
    window.dispatchEvent(new Event("liora:abrir-simulado"));
  });

  document.getElementById("sim-upgrade")?.addEventListener("click", () => {
    window.lioraPremium?.openUpgradeModal?.("simulado-resultado");
  });
}



  // -------------------------------------------------
  // EVENTOS DE UI
  // -------------------------------------------------
  document.addEventListener("click", async (e) => {
    const els = getEls();

    // fechar modal
    if (e.target.closest("#sim-modal-close-btn") || e.target === els.modal) {
      fecharModal();
      return;
    }

    // iniciar simulado
    if (e.target.closest("#sim-modal-iniciar")) {
      const access = getSimuladoAccess();

      if (!access.ok) {
        if (access.reason === "limit") {
          window.dispatchEvent(new Event("liora:premium-bloqueado"));
        } else {
          alert("Faça login para iniciar o simulado.");
        }
        return;
      }

      STATE.config = {
        banca: els.banca?.value,
        qtd: Math.min(
          Number(els.qtd?.value || access.maxQuestoes),
          access.maxQuestoes
        ),
        dificuldade: els.dif?.value,
        tema: els.tema?.value,
        tempo: Number(els.tempo?.value)
      };

      fecharModal();
      window.lioraLoading?.show("Gerando simulado...");

      try {
        const raw = await gerarQuestoes(STATE.config);
        STATE.questoes = limparQuestoes(raw);
        STATE.atual = 0;

        // 🔒 registra uso real
        window.lioraUsage?.registrarSimulado();

        window.lioraLoading?.hide();
        renderQuestao();
      } catch {
        window.lioraLoading?.hide();
        window.lioraError?.show("Erro ao gerar simulado.");
      }

      return;
    }

    // próxima
    if (e.target.closest("#sim-btn-proxima")) {
      STATE.atual < STATE.questoes.length - 1
        ? (STATE.atual++, renderQuestao())
        : finalizar();
    }

    // voltar
    if (e.target.closest("#sim-btn-voltar") && STATE.atual > 0) {
      STATE.atual--;
      renderQuestao();
    }
  });
})();
