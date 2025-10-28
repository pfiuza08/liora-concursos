// ==========================================================
// 🎯 Liora Concursos — Módulo de plano de estudos inteligente
// Gera sessões com objetivos, tarefas e revisões automáticas
// ==========================================================

// --- Namespace global ---
window.LioraConcursos = {};

// ==========================================================
// 🧩 Funções utilitárias
// ==========================================================
LioraConcursos.normalizar = (texto) =>
  texto.replace(/\s+/g, ' ').replace(/\r/g, '').trim();

LioraConcursos.dividirTopicos = (texto) => {
  const linhas = texto.split(/\n+/).map(l => l.trim()).filter(Boolean);
  return linhas.filter(l => l.length > 3 && !l.match(/^(\d+)?$/));
};

LioraConcursos.definirDensidade = (texto) => {
  const palavras = texto.split(/\s+/).length;
  if (palavras < 80) return '📗 leve';
  if (palavras < 160) return '📘 média';
  return '📙 densa';
};

// ==========================================================
// 🎓 Geração de plano pedagógico (Concursos)
// ==========================================================
LioraConcursos.gerarPlanoConcursos = (planoBase, totalDias) => {
  const novoPlano = [];
  const temasConcursos = [
    'compreensão de conceitos', 'interpretação de textos legais', 'resolução de questões',
    'análise de casos práticos', 'revisão e fixação de conteúdo'
  ];

  planoBase.forEach((sessao, i) => {
    const densidade = LioraConcursos.definirDensidade(sessao.descricao);
    const foco = temasConcursos[i % temasConcursos.length];
    const resumo = sessao.resumo || (sessao.descricao.split(/[.!?]/)[0] || '').trim();

    // gera tarefa conforme tipo de conteúdo
    let tarefa = '';
    if (densidade.includes('leve')) tarefa = 'Leia atentamente e destaque palavras-chave.';
    else if (densidade.includes('média')) tarefa = 'Monte um mapa mental com os conceitos principais.';
    else tarefa = 'Resolva 3 questões anteriores sobre este tema.';

    novoPlano.push({
      ...sessao,
      titulo: `Sessão ${i + 1} — ${sessao.topico || 'Estudo dirigido'}`,
      objetivo: `Aprofundar a ${foco}.`,
      resumo,
      tarefa,
      tempo: densidade.includes('leve') ? '30 min' : densidade.includes('média') ? '45 min' : '60 min',
      revisao: `${2 + (i % 3)} dias`,
      densidade
    });
  });

  return novoPlano;
};

// ==========================================================
// 🧱 Renderização aprimorada (cartões didáticos)
// ==========================================================
LioraConcursos.renderizarPlanoConcursos = (plano) => {
  const container = document.getElementById('plano');
  container.innerHTML = '';

  if (!plano?.length) {
    container.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano gerado.</p>`;
    return;
  }

  plano.forEach(sessao => {
    const div = document.createElement('div');
    div.className = 'session-card';
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <h3>${sessao.titulo}</h3>
        <span class="text-xs opacity-70">${sessao.densidade}</span>
      </div>

      <p class="text-sm text-[var(--muted)] italic mb-2">🎯 ${sessao.objetivo}</p>
      <p style="margin-bottom:0.5rem;">${sessao.resumo}</p>

      <div class="border-l-2 pl-3 border-[var(--brand)] mb-2">
        ${sessao.descricao.replace(/\n/g, '<br>')}
      </div>

      <p class="text-sm mt-2">💬 <b>Tarefa:</b> ${sessao.tarefa}</p>
      <p class="text-xs text-[var(--muted)] mt-1">🕐 Tempo sugerido: ${sessao.tempo} · 🔁 Revisar em ${sessao.revisao}</p>
    `;
    container.appendChild(div);
  });

  // Painel de densidade cognitiva
  LioraConcursos.renderizarDensidade(plano);
};

// ==========================================================
// ⚖️ Gráfico de Densidade Cognitiva — Reaproveita o padrão
// ==========================================================
LioraConcursos.renderizarDensidade = (plano) => {
  const contagens = { leve: 0, media: 0, densa: 0 };
  plano.forEach(s => {
    if (s.densidade.includes('leve')) contagens.leve++;
    else if (s.densidade.includes('média')) contagens.media++;
    else contagens.densa++;
  });

  const total = plano.length || 1;
  const pctLeve = (contagens.leve / total) * 100;
  const pctMedia = (contagens.media / total) * 100;
  const pctDensa = (contagens.densa / total) * 100;

  const grafico = document.createElement('div');
  grafico.id = 'grafico-densidade';
  grafico.style.marginTop = '1.5rem';
  grafico.style.background = 'var(--card)';
  grafico.style.padding = '1rem';
  grafico.style.borderRadius = '1rem';
  grafico.innerHTML = `
    <h4 class="font-semibold mb-2">⚖️ Densidade Cognitiva</h4>
    <div style="display:flex;height:20px;border-radius:10px;overflow:hidden;margin-bottom:0.8rem;">
      <div style="background:#48bb78;width:${pctLeve}%;"></div>
      <div style="background:#4299e1;width:${pctMedia}%;"></div>
      <div style="background:#c44b04;width:${pctDensa}%;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--muted);">
      <span>📗 Leve (${contagens.leve})</span>
      <span>📘 Média (${contagens.media})</span>
      <span>📙 Densa (${contagens.densa})</span>
    </div>
  `;

  document.getElementById('plano').appendChild(grafico);
};

// ==========================================================
// 🔗 Integração automática com o núcleo (core.js)
// ==========================================================
window.addEventListener("load", () => {
  const btn = document.getElementById("btn-gerar");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const s = window.state;
    if (!s || !s.plano || !s.plano.length) return;

    console.log("🔁 Reformatando plano com Liora Concursos...");

    // Gera o plano especializado e renderiza
    const planoConcursos = LioraConcursos.gerarPlanoConcursos(s.plano, s.dias);
    s.plano = planoConcursos;
    LioraConcursos.renderizarPlanoConcursos(s.plano);
  });
});
