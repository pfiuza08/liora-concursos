// ==========================================================
// 🎯 Liora Concursos — Módulo de Simulados Inteligentes
// ==========================================================

// Referências principais do DOM
const btnSim = document.getElementById('btn-simulado');
const selQtd = document.getElementById('sel-qtd');
const selFormato = document.getElementById('sel-formato');
const areaSim = document.getElementById('simulado');
const bar = document.getElementById('bar-progress');
const resultado = document.getElementById('resultado');

// Estado local do simulado
state.simulado = { questoes: [], respostas: {} };

// ==========================================================
// 🔤 Processamento básico do texto
// ==========================================================
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-záéíóúâêîôûàèìòùãõç0-9\s\-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const STOPWORDS_PT = new Set(
  'a o e de da do das dos em com para por como é são foi era ser estar entre sobre que os as um uma umas uns suas seus seu sua nos nas ao à aos às no na num numa isso este esta aquele aquela aquilo esse essa porém porque todavia contudo ainda assim portanto'.split(
    ' '
  )
);

function keywords(text, max = 15) {
  const tokens = tokenize(text);
  const freq = new Map();
  for (const t of tokens) {
    if (STOPWORDS_PT.has(t) || t.length < 3) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ==========================================================
// 🧮 Geração de questões específicas
// ==========================================================
function gerarQuestoesConcurso(texto, qtd, formato = 'FGV') {
  const kws = keywords(texto, Math.max(10, qtd * 3));
  if (!kws.length) kws.push('tema principal');

  const moldes = [
    k => `Sobre o tema “${k}”, assinale a alternativa correta.`,
    k => `No contexto do conteúdo estudado, “${k}” está relacionado a:`,
    k => `Acerca de “${k}”, é correto afirmar que:`,
    k => `Assinale a alternativa que melhor define “${k}”.`
  ];

  const distratores = [
    k => `Apresenta conceito incorreto de “${k}”.`,
    k => `Confunde “${k}” com outro tema.`,
    k => `Afirmação genérica e incompleta sobre “${k}”.`,
    k => `Aplica “${k}” em contexto inadequado.`
  ];

  const corretas = [
    k => `Definição adequada de “${k}”, conforme o conteúdo estudado.`,
    k => `Explica corretamente o papel de “${k}”.`,
    k => `Aplica “${k}” de forma apropriada no contexto proposto.`
  ];

  const questoes = [];

  for (let i = 0; i < qtd; i++) {
    const k = kws[i % kws.length];
    const enunciado = sample(moldes)(k);
    const corretaIdx = Math.floor(Math.random() * 5);
    let alternativas = [];

    if (formato === 'CESPE') {
      alternativas = ['Certo', 'Errado'];
    } else if (formato === 'VUNESP') {
      alternativas = [];
      for (let j = 0; j < 4; j++) {
        alternativas.push(
          j === corretaIdx ? sample(corretas)(k) : sample(distratores)(k)
        );
      }
    } else {
      alternativas = [];
      for (let j = 0; j < 5; j++) {
        alternativas.push(
          j === corretaIdx ? sample(corretas)(k) : sample(distratores)(k)
        );
      }
    }

    questoes.push({
      id: `q${i + 1}`,
      formato,
      enunciado,
      alternativas,
      correta: corretaIdx,
      explicacao: `A resposta correta reflete o uso adequado de “${k}”.`
    });
  }

  return questoes;
}

// ==========================================================
// 🧩 Renderização das questões e interatividade
// ==========================================================
function renderSimulado() {
  const qs = state.simulado.questoes || [];
  areaSim.innerHTML = '';

  if (!qs.length) {
    areaSim.innerHTML =
      '<p class="text-sm text-[var(--muted)]">Gere um simulado com base no material ou tema.</p>';
    resultado.textContent = '';
    bar.style.width = '0%';
    return;
  }

  const letras = ['A', 'B', 'C', 'D', 'E'];
  qs.forEach((q, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'qcard';
    const alts = q.alternativas
      .map(
        (a, i) =>
          `<div class="opt" data-q="${q.id}" data-i="${i}"><span class="mr-2 text-[var(--muted)]">${letras[i] || i + 1}</span>${a}</div>`
      )
      .join('');

    wrap.innerHTML = `
      <div class="text-sm font-semibold mb-2">${idx + 1}. ${q.enunciado}</div>
      ${alts}
      <div class="text-xs text-[var(--muted)] mt-2 hidden" id="exp-${q.id}">💡 ${q.explicacao}</div>
    `;
    areaSim.appendChild(wrap);
  });

  resultado.textContent = 'Marque suas respostas.';
  bindAnswers();
  atualizarResultado();
}

function bindAnswers() {
  areaSim.querySelectorAll('.opt').forEach(el => {
    el.addEventListener('click', () => {
      const qid = el.getAttribute('data-q');
      const idx = parseInt(el.getAttribute('data-i'), 10);
      const q = state.simulado.questoes.find(x => x.id === qid);

      el.parentElement
        .querySelectorAll('.opt')
        .forEach(o => o.classList.remove('correct', 'wrong'));

      if (q.formato === 'CESPE') {
        state.simulado.respostas[qid] = idx;
        el.classList.add(idx === q.correta ? 'correct' : 'wrong');
      } else {
        if (idx === q.correta) el.classList.add('correct');
        else el.classList.add('wrong');
      }

      document.getElementById(`exp-${qid}`).classList.remove('hidden');
      state.simulado.respostas[qid] = idx;
      atualizarResultado();
    });
  });
}

function atualizarResultado() {
  const qs = state.simulado.questoes || [];
  const r = state.simulado.respostas || {};
  const total = qs.length;
  let resp = 0;
  let ac = 0;

  qs.forEach(q => {
    if (r[q.id] !== undefined) {
      resp++;
      if (r[q.id] === q.correta) ac++;
    }
  });

  const prog = total ? Math.round((resp / total) * 100) : 0;
  bar.style.width = prog + '%';
  const perc = total ? Math.round((ac / total) * 100) : 0;
  resultado.textContent = `Progresso: ${resp}/${total} · Acertos: ${ac} · Pontuação: ${perc}%`;
}

// ==========================================================
// 🚀 Geração do simulado
// ==========================================================
btnSim?.addEventListener('click', () => {
  const qtd = parseInt(selQtd.value, 10) || 5;
  const formato = selFormato.value || 'FGV';
  const base =
    state.materialTexto && state.materialTexto.length > 50
      ? state.materialTexto
      : state.tema || 'Concurso público';

  state.simulado.questoes = gerarQuestoesConcurso(base, qtd, formato);
  state.simulado.respostas = {};
  renderSimulado();
});

// Inicialização
renderSimulado();
