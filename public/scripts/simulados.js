// =============================================================
// 🧠 LIORA — SIMULADOS v103.7-FREEMIUM-STABLE
// - Free: experiência completa com limites
// - Premium: ilimitado + histórico
// - Shuffle real das alternativas
// - Resultado + explicações no final
// =============================================================

(function () {
  console.log("🟢 Liora Simulados v103.7 carregado");

  // -------------------------------------------------
  // STATE LOCAL
  // -------------------------------------------------
  const STATE = {
    questoes: [],
    atual: 0,
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
      resultado: qs("sim-resultado")
    };
  }

  // -------------------------------------------------
  // 🔐 ACESSO CANÔNICO
  // -------------------------------------------------
  function getSimuladoAccess() {
    const user = window.lioraAuth?.user;
    const plan = window.lioraState?.plan || "free";

    if (!user) return { ok: false, reason: "login" };

    const limits = window.lioraLimits?.[plan];
    if (!limits) return { ok: false, reason: "config" };

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

    const isFree = access.plan === "free";
    if (els.qtd) {
      els.qtd.value = access.maxQuestoes;
      els.qtd.disabled = isFree;
    }

    bindIniciarSimulado();
  }

  function fecharModal() {
    const els = getEls();
    if (!els.modal) return;

    els.modal.classList.remove("visible");
    els.modal.classList.add("hidden");
    STATE.modalOpen = false;
  }

  // -------------------------------------------------
  // EVENTO CANÔNICO
  // -------------------------------------------------
  window.addEventListener("liora:abrir-simulado", () => {
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
      alert("Erro ao verificar acesso.");
      return;
    }

    abrirModal(access);
  });

  // -------------------------------------------------
  // BIND DO BOTÃO INICIAR
  // -------------------------------------------------
  function bindIniciarSimulado() {
    const els = getEls();
    if (!els.iniciar || els.iniciar.dataset.bound) return;

    els.iniciar.dataset.bound = "1";

    els.iniciar.addEventListener("click", async () => {
      const access = getSimuladoAccess();
      if (!access.ok) return;

      STATE.config = {
        banca: els.banca?.value,
        qtd: access.maxQuestoes,
        dificuldade: els.dif?.value,
        tema: els.tema?.value,
        tempo: Number(els.tempo?.value)
      };

      fecharModal();
      window.lioraLoading?.show("Gerando simulado...");

      try {
        const raw = await gerarQuestoes(STATE.config);
        STATE.questoes = prepararQuestoes(raw);
        STATE.atual = 0;

        window.lioraUsage?.registrarSimulado();
        window.lioraLoading?.hide();
        renderQuestao();
      } catch (e) {
        console.error(e);
        window.lioraLoading?.hide();
        window.lioraError?.show("Erro ao gerar simulado.");
      }
    });
  }

  // -------------------------------------------------
  // IA
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
    "corretaIndex": 0,
    "explicacaoCorreta": "...",
    "explicacoesErradas": ["...", "...", "..."]
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

    return JSON.parse(raw);
  }

  // -------------------------------------------------
  // SHUFFLE + NORMALIZAÇÃO
  // -------------------------------------------------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function prepararQuestoes(lista) {
    return lista.map((q, idx) => {
      const correta = q.alternativas[q.corretaIndex];
      const alternativas = shuffle(q.alternativas);
      const novaCorreta = alternativas.indexOf(correta);

      return {
        indice: idx + 1,
        enunciado: q.enunciado,
        alternativas,
        corretaIndex: novaCorreta,
        explicacaoCorreta: q.explicacaoCorreta || "",
        explicacoesErradas: q.explicacoesErradas || [],
        resp: null
      };
    });
  }

  // -------------------------------------------------
  // RENDER QUESTÃO
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
      STATE.atual === STATE.questoes.length - 1 ? "Finalizar ▶" : "Próxima ▶";
    els.btnVoltar.disabled = STATE.atual === 0;
  }

  // -------------------------------------------------
  // FINALIZAR + RESULTADO
  // -------------------------------------------------
  function finalizar() {
    const els = getEls();
    const plan = window.lioraState?.plan || "free";
    const isPremium = plan === "premium";

    let acertos = 0;
    STATE.questoes.forEach((q) => {
      if (q.resp === q.corretaIndex) acertos++;
    });

    const total = STATE.questoes.length;
    const erros = total - acertos;
    const percentual = Math.round((acertos / total) * 100);

    els.container.innerHTML = "";
    els.nav.classList.add("hidden");

    const explicacoesHTML = STATE.questoes
      .map((q, i) => {
        const acertou = q.resp === q.corretaIndex;
        return `
          <div class="sim-explicacao-bloco">
            <h4>Questão ${i + 1}</h4>
            <p class="${acertou ? "correta" : "errada"}">
              ${acertou ? "✅ Você acertou" : "❌ Você errou"}
            </p>
            <p><strong>Resposta correta:</strong> ${q.alternativas[q.corretaIndex]}</p>
            ${q.explicacaoCorreta ? `<p>${q.explicacaoCorreta}</p>` : ""}
            ${
              isPremium && q.explicacoesErradas.length
                ? `<ul>${q.explicacoesErradas.map((e) => `<li>${e}</li>`).join("")}</ul>`
                : ""
            }
          </div>
        `;
      })
      .join("");

    els.resultado.innerHTML = `
      <div class="sim-resultado-card">
        <h3>📊 Resultado do Simulado</h3>

        <div class="sim-resultado-metricas">
          <div><strong>${acertos}</strong><span>Acertos</span></div>
          <div><strong>${erros}</strong><span>Erros</span></div>
          <div><strong>${percentual}%</strong><span>Aproveitamento</span></div>
        </div>

        <div class="sim-explicacoes-wrapper">${explicacoesHTML}</div>

        ${
          isPremium
            ? `<p class="sim-msg-premium">✅ Histórico salvo.</p>`
            : `<p class="sim-msg-free">
                No <strong>Liora+</strong> você vê explicações completas.
              </p>`
        }

        <div class="sim-resultado-acoes">
          ${
            isPremium
              ? `<button class="btn-secundario" id="sim-refazer">🔁 Novo simulado</button>`
              : `<button class="btn-primario" id="sim-upgrade">🚀 Conhecer o Liora+</button>`
          }
          <button class="btn-secundario" id="sim-voltar-home">⬅ Voltar</button>
        </div>
      </div>
    `;

    els.resultado.classList.remove("hidden");

    qs("sim-voltar-home")?.addEventListener("click", () =>
      qs("fab-home")?.click()
    );

    qs("sim-refazer")?.addEventListener("click", () =>
      window.dispatchEvent(new Event("liora:abrir-simulado"))
    );

    qs("sim-upgrade")?.addEventListener("click", () =>
      window.lioraPremium?.openUpgradeModal?.("simulado")
    );
  }

  // -------------------------------------------------
  // NAVEGAÇÃO
  // -------------------------------------------------
  document.addEventListener("click", (e) => {
    if (e.target.closest("#sim-btn-proxima")) {
      STATE.atual < STATE.questoes.length - 1
        ? (STATE.atual++, renderQuestao())
        : finalizar();
    }

    if (e.target.closest("#sim-btn-voltar") && STATE.atual > 0) {
      STATE.atual--;
      renderQuestao();
    }

    if (e.target.closest("#sim-modal-close-btn") || e.target === getEls().modal) {
      fecharModal();
    }
  });
})();
