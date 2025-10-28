// ==========================================================
// 🎓 Liora — Geração dinâmica de planos por tema e nível
// ==========================================================

function gerarPlanoPorPrompt(tema, nivel, dias, intensidade) {
  const descricoesNivel = {
    iniciante: {
      foco: "Compreensão dos conceitos básicos",
      carga: intensidade === "intensivo" ? "40 min" : intensidade === "equilibrado" ? "30 min" : "20 min",
      densidade: intensidade === "intensivo" ? "📘 média" : "📗 leve",
      verbo: "Introduzir",
      tarefas: ["leitura guiada", "anotações", "questões simples"]
    },
    intermediario: {
      foco: "Aprofundamento e prática aplicada",
      carga: intensidade === "intensivo" ? "60 min" : intensidade === "equilibrado" ? "45 min" : "30 min",
      densidade: intensidade === "intensivo" ? "📙 densa" : "📘 média",
      verbo: "Explorar",
      tarefas: ["resumo crítico", "mapa mental", "questões de bancas"]
    },
    avancado: {
      foco: "Domínio conceitual e prática avançada",
      carga: intensidade === "intensivo" ? "90 min" : intensidade === "equilibrado" ? "60 min" : "45 min",
      densidade: intensidade === "intensivo" ? "📙 densa" : "📘 média",
      verbo: "Aprofundar",
      tarefas: ["simulados complexos", "revisão teórica", "redação discursiva"]
    }
  };

  const base = descricoesNivel[nivel] || descricoesNivel.iniciante;
  const plano = [];

  for (let i = 0; i < dias; i++) {
    const sessao = i + 1;
    const focoDoDia = `${base.verbo} aspectos de ${tema} (parte ${sessao})`;
    const tarefas = base.tarefas
      .slice(0, 2 + (i % base.tarefas.length))
      .map(t => `• ${t}`)
      .join("\n");

    plano.push({
      dia: sessao,
      titulo: `Sessão ${sessao} — ${tema}`,
      objetivo: `${base.foco}.`,
      tarefa: tarefas,
      tempo: base.carga,
      revisao: `${2 + (i % 3)} dias`,
      densidade: base.densidade,
      descricao: `${focoDoDia}. Nesta sessão, ${base.verbo.toLowerCase()} os pontos-chave e desenvolva autonomia no tema.`
    });
  }

  return plano;
}

// ==========================================================
// 💬 Janela interativa da Liora
// ==========================================================

function perguntarNivelEIntensidade(tema, callback) {
  const modal = document.createElement("div");
  modal.id = "liora-dialogo";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.75)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "2000";

  modal.innerHTML = `
    <div style="
      background: var(--card);
      color: var(--fg);
      padding: 1.8rem;
      border-radius: 1rem;
      width: 90%;
      max-width: 480px;
      box-shadow: var(--shadow);
      text-align: center;">
      <h2 style="margin-bottom: 0.6rem;">👋 Oi! Eu sou a Liora.</h2>
      <p style="font-size: 0.9rem; margin-bottom: 1rem;">
        Antes de montar seu plano sobre <b>${tema}</b>, me diga:
      </p>

      <div id="step-1">
        <p><b>Qual o seu nível de conhecimento?</b></p>
        <div class="flex justify-center gap-2 my-3">
          <button class="chip" data-nivel="iniciante">🟢 Iniciante</button>
          <button class="chip" data-nivel="intermediario">🔵 Intermediário</button>
          <button class="chip" data-nivel="avancado">🟣 Avançado</button>
        </div>
      </div>

      <div id="step-2" style="display:none;">
        <p><b>Como quer o ritmo do plano?</b></p>
        <div class="flex justify-center gap-2 my-3">
          <button class="chip" data-int="leve">🌿 Leve</button>
          <button class="chip" data-int="equilibrado">⚖️ Equilibrado</button>
          <button class="chip" data-int="intensivo">🔥 Intensivo</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let nivelEscolhido = null;

  modal.querySelectorAll("[data-nivel]").forEach(btn => {
    btn.addEventListener("click", e => {
      nivelEscolhido = e.target.dataset.nivel;
      document.getElementById("step-1").style.display = "none";
      document.getElementById("step-2").style.display = "block";
    });
  });

  modal.querySelectorAll("[data-int]").forEach(btn => {
    btn.addEventListener("click", e => {
      const intensidade = e.target.dataset.int;
      modal.remove();
      callback(nivelEscolhido, intensidade);
    });
  });

  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
}

// ==========================================================
// 🔗 Integração com o core.js (botão "Gerar plano")
// ==========================================================

window.addEventListener("load", () => {
  const btn = document.getElementById("btn-gerar");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const s = window.state;
    if (!s.tema || s.materialTexto) return; // só ativa se não há arquivo

    perguntarNivelEIntensidade(s.tema, (nivel, intensidade) => {
      s.nivel = nivel;
      s.intensidade = intensidade;
      const plano = gerarPlanoPorPrompt(s.tema, nivel, s.dias, intensidade);
      s.plano = plano;

      const container = document.getElementById("plano");
      container.innerHTML = "";

      plano.forEach(sessao => {
        const div = document.createElement("div");
        div.className = "session-card";
        div.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <h3>${sessao.titulo}</h3>
            <span class="text-xs opacity-70">${sessao.densidade}</span>
          </div>
          <p class="text-sm text-[var(--muted)] italic mb-2">🎯 ${sessao.objetivo}</p>
          <p>${sessao.descricao}</p>
          <p class="text-sm mt-2">💬 <b>Tarefas:</b><br>${sessao.tarefa.replace(/\n/g, "<br>")}</p>
          <p class="text-xs text-[var(--muted)] mt-1">🕐 Tempo: ${sessao.tempo} · 🔁 Revisar em ${sessao.revisao}</p>
        `;
        container.appendChild(div);
      });

      document.getElementById("status").textContent =
        `📚 Plano de estudo (${nivel}, ${intensidade}) gerado para “${s.tema}”.`;
    });
  });
});
