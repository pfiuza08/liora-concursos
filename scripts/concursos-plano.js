// ==========================================================
// 🎯 Liora Concursos — Plano de Estudos Inteligente
// ==========================================================

window.LioraConcursos = {
  // ----------------------------------------------------------
  // 🧠 Classifica os tópicos por nível de profundidade semântica
  // ----------------------------------------------------------
  classificarTopicos(linhas) {
    const grupos = { basicos: [], intermediarios: [], avancados: [] };
    linhas.forEach(l => {
      const lower = l.toLowerCase();
      if (lower.match(/introdu|conceito|defini|fundamento|princ[ií]pio|no[cç][aã]o/))
        grupos.basicos.push(l);
      else if (lower.match(/aplic|exemplo|crit[eé]rio|regra|classifica|propriedade|procedimento/))
        grupos.intermediarios.push(l);
      else
        grupos.avancados.push(l);
    });
    return grupos;
  },

  // ----------------------------------------------------------
  // 📊 Organiza sessões de forma progressiva
  // ----------------------------------------------------------
  organizarSessões(topicos, dias) {
    const grupos = this.classificarTopicos(topicos);
    const todos = [...grupos.basicos, ...grupos.intermediarios, ...grupos.avancados];
    const blocos = Math.ceil(todos.length / dias);

    return Array.from({ length: dias }, (_, i) => {
      const subset = todos.slice(i * blocos, (i + 1) * blocos);
      const dificuldade =
        i < dias / 3 ? "leve" :
        i < (2 * dias) / 3 ? "média" : "densa";
      return { subset, dificuldade };
    });
  },

  // ----------------------------------------------------------
  // 🧩 Gera o plano de estudos completo para concursos
  // ----------------------------------------------------------
  gerarPlanoConcursos(planoBase, dias) {
    const novoPlano = [];
    const topicos = planoBase.flatMap(s => s.descricao.split("\n").filter(Boolean));
    const organizadas = this.organizarSessões(topicos, dias);

    organizadas.forEach((sessao, i) => {
      const textoSessao = sessao.subset.join(" ");
      const sem = window.analisarSemantica(textoSessao);

      const foco = sem.conceitos.slice(0, 3).join(", ") || "tópico principal";
      const revisao =
        sessao.dificuldade === "densa" ? "Revisar em 2 dias" :
        sessao.dificuldade === "média" ? "Revisar em 3 dias" :
        "Revisar em 5 dias";
      const tempo =
        sessao.dificuldade === "densa" ? "60 min" :
        sessao.dificuldade === "média" ? "45 min" : "30 min";

      const tarefa =
        sessao.dificuldade === "densa"
          ? "Elabore 5 flashcards e resolva questões da banca correspondente."
          : sessao.dificuldade === "média"
          ? "Crie um mapa mental e destaque palavras-chave."
          : "Releia o material e explique com suas próprias palavras.";

      novoPlano.push({
        dia: i + 1,
        titulo: `Sessão ${i + 1} — ${sem.titulo}`,
        resumo: sem.resumo,
        conceitos: sem.conceitos,
        densidade: `📘 ${sessao.dificuldade}`,
        descricao: sessao.subset.map(t => "• " + t).join("\n"),
        objetivo: `Dominar os conceitos de ${foco}.`,
        tarefaPratica: tarefa,
        tempoSugerido: tempo,
        revisaoSugerida: revisao
      });
    });

    return novoPlano;
  },

  // ----------------------------------------------------------
  // 🎨 Renderiza o plano especializado (substitui o padrão)
  // ----------------------------------------------------------
  renderizarPlanoConcursos(plano) {
    const container = document.getElementById("plano");
    container.innerHTML = "";

    if (!plano || !plano.length) {
      container.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano de estudo disponível.</p>`;
      return;
    }

    plano.forEach(sessao => {
      const div = document.createElement("div");
      div.className = "session-card";
      div.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <h3>${sessao.titulo}</h3>
          <span class="text-xs opacity-70">${sessao.densidade}</span>
        </div>
        <p class="text-sm text-[var(--muted)] italic mb-1">${sessao.objetivo}</p>
        <p style="font-style:italic;font-size:0.85rem;color:var(--muted);margin-bottom:0.4rem;">
          ${sessao.resumo}
        </p>
        <p>${sessao.descricao.replace(/</g,'&lt;')}</p>
        <div class="mt-2 flex flex-wrap gap-2">
          ${sessao.conceitos.map(c => `<span class="chip">${c}</span>`).join("")}
        </div>
        <div class="mt-3 text-xs text-[var(--muted)] grid grid-cols-2 gap-2">
          <div>🕐 ${sessao.tempoSugerido}</div>
          <div>🔁 ${sessao.revisaoSugerida}</div>
        </div>
        <div class="mt-2 text-sm">📚 <b>Tarefa:</b> ${sessao.tarefaPratica}</div>
      `;
      container.appendChild(div);
    });
  }
};

// ==========================================================
// 🔗 Integração automática com o núcleo Liora
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-gerar");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const s = window.state;
    if (!s.plano || !s.plano.length) return;

    // Gera o plano otimizado
    const planoConcursos = window.LioraConcursos.gerarPlanoConcursos(s.plano, s.dias);

    // Atualiza o estado global e re-renderiza
    s.plano = planoConcursos;
    window.LioraConcursos.renderizarPlanoConcursos(s.plano);
  });
});
