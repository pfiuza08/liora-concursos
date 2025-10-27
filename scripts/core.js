// ==========================================================
// 🧠 Liora Concursos — Núcleo principal (core.js)
// ==========================================================

const state = {
  tema: '',
  dias: 5,
  materialTexto: '',
  tipoMaterial: '',
  plano: [],
};

// ==========================================================
// 🌓 Tema claro/escuro — versão final (desktop + mobile + padrão escuro)
// ==========================================================

const themeBtn = document.getElementById('btn-theme');
const body = document.body;
const html = document.documentElement;

// 🔧 Garante que o tema padrão seja sempre escuro na primeira carga
if (!localStorage.getItem('liora_theme')) {
  localStorage.setItem('liora_theme', 'dark');
}

function setTheme(mode) {
  const isLight = mode === 'light';

  html.classList.toggle('light', isLight);
  html.classList.toggle('dark', !isLight);
  body.classList.toggle('light', isLight);
  body.classList.toggle('dark', !isLight);

  localStorage.setItem('liora_theme', isLight ? 'light' : 'dark');
  themeBtn.textContent = isLight ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = localStorage.getItem('liora_theme') || 'dark';
  setTheme(current === 'light' ? 'dark' : 'light');
}

// 💻 Clique (desktop)
themeBtn.addEventListener('click', toggleTheme);

// 📱 Toque (mobile)
themeBtn.addEventListener('touchend', e => {
  e.preventDefault();
  toggleTheme();
}, { passive: false });

// 🚀 Inicializa com o tema salvo (ou escuro por padrão)
setTheme(localStorage.getItem('liora_theme') || 'dark');


// ==========================================================
// 🧩 Normalização e detecção semântica
// ==========================================================
function normalizarTextoParaPrograma(texto) {
  return texto
    .replace(/(\d+)\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕ])/g, '\n$1 ')
    .replace(/\. (?=\d|\b[A-ZÁÉÍÓÚÂÊÔÃÕ])/g, '.\n')
    .replace(/:\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕ])/g, ':\n')
    .replace(/;\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕ])/g, ';\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function detectarTipoMaterial(texto) {
  if (!texto || texto.length < 80) return 'conteudo';
  const normalizado = normalizarTextoParaPrograma(texto);
  const linhas = normalizado.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (!linhas.length) return 'conteudo';

  let curtas = 0, marcadas = 0, comPonto = 0, verbais = 0, conectivos = 0;
  const verboRegex = /\b(é|são|está|estão|representa|consiste|permite|define|explica|indica|utiliza|refere|aplica|envolve|caracteriza)\b/i;
  const conectivosRegex = /\b(porque|além|entretanto|porém|como|assim|logo|também|portanto|quando|enquanto|ou seja|por isso)\b/i;

  for (const l of linhas) {
    const palavras = l.split(/\s+/);
    if (palavras.length <= 8) curtas++;
    if (/^[\d•\-–]/.test(l)) marcadas++;
    if (/[.!?]$/.test(l)) comPonto++;
    if (verboRegex.test(l)) verbais++;
    if (conectivosRegex.test(l)) conectivos++;
  }

  const total = linhas.length;
  const pCurtas = curtas / total;
  const pMarcadas = marcadas / total;
  const pComPonto = comPonto / total;
  const pVerbais = verbais / total;
  const pConectivos = conectivos / total;

  const scorePrograma = (pCurtas * 0.5 + pMarcadas * 0.4) - (pVerbais * 0.5 + pConectivos * 0.3 + pComPonto * 0.2);
  return scorePrograma > 0.18 ? 'programa' : 'conteudo';
}

// ==========================================================
// 📁 Upload e leitura de arquivo
// ==========================================================
const zone = document.getElementById('upload-zone');
const inputFile = document.getElementById('inp-file');
const fileName = document.getElementById('file-name');
const fileType = document.getElementById('file-type');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt =>
  document.addEventListener(evt, e => e.preventDefault(), true)
);

if (zone && inputFile) {
  zone.addEventListener('dragover', () => zone.classList.add('dragover'));
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files?.[0];
    if (file) {
      inputFile.files = e.dataTransfer.files;
      handleFileSelection(file);
    }
  });

  inputFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleFileSelection(file);
  });
}

async function handleFileSelection(file) {
  const spinner = document.getElementById('upload-spinner');
  spinner.style.display = 'block';
  fileName.textContent = `Carregando ${file.name}...`;
  fileType.textContent = '';
  const antiga = document.getElementById('sugestao-sessoes');
  if (antiga) antiga.remove();

  try {
    const ext = file.name.split('.').pop().toLowerCase();
    let text = '';

    if (ext === 'txt') {
      text = await file.text();
    } else if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
    } else {
      alert('Formato não suportado. Use .txt ou .pdf');
      spinner.style.display = 'none';
      return;
    }

    state.materialTexto = text;
    state.tipoMaterial = detectarTipoMaterial(text);

    fileName.textContent = `✅ ${file.name} carregado`;
    fileType.textContent =
      state.tipoMaterial === 'programa'
        ? '🗂️ Detectado: programa de conteúdo (estrutura de tópicos)'
        : '📘 Detectado: conteúdo explicativo (texto narrativo)';

    // ======================================================
    // 📅 Sugestão automática + interação com o usuário
    // ======================================================
    const linhas = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (state.tipoMaterial === 'programa' && linhas.length > 5) {
      let sugestao = 5;
      if (linhas.length <= 10) sugestao = 3;
      else if (linhas.length <= 30) sugestao = 5;
      else if (linhas.length <= 60) sugestao = 7;
      else if (linhas.length <= 100) sugestao = 10;
      else if (linhas.length <= 200) sugestao = 14;
      else if (linhas.length <= 400) sugestao = 20;
      else sugestao = 30;

      const selDias = document.getElementById('sel-dias');
      selDias.value = sugestao;

      // Remove sugestão anterior
      const antiga = document.getElementById('sugestao-sessoes');
      if (antiga) antiga.remove();

      const box = document.createElement('div');
      box.id = 'sugestao-sessoes';
      box.className = 'mt-2 p-3 rounded-lg border border-[var(--stroke)] bg-[var(--card)] text-[13px] shadow-sm animate-fadeIn';
      box.innerHTML = `
        <p>📅 Sugerido: <strong>${sugestao}</strong> sessões (com base em ${linhas.length} tópicos detectados).</p>
        <p class="mt-1 text-[var(--muted)]">💬 Deseja manter essa sugestão?</p>
        <div class="mt-2 flex gap-2">
          <button id="btn-aceitar" class="btn text-[12px] py-1 px-2">✅ Aceitar</button>
          <button id="btn-ajustar" class="chip text-[12px] py-1 px-2">✏️ Ajustar manualmente</button>
        </div>
      `;
      fileType.insertAdjacentElement('afterend', box);

      const btnAceitar = document.getElementById('btn-aceitar');
      const btnAjustar = document.getElementById('btn-ajustar');

      btnAceitar.addEventListener('click', () => {
        box.innerHTML = `<p>📘 Sessões confirmadas: ${sugestao}.</p>`;
        setTimeout(() => box.remove(), 1500);
      });

      btnAjustar.addEventListener('click', () => {
        box.innerHTML = `<p>✏️ Ajuste o número de sessões manualmente no seletor abaixo.</p>`;
        selDias.focus();
        selDias.classList.add('border-[var(--brand)]', 'shadow-[0_0_8px_rgba(196,75,4,0.4)]');
        setTimeout(() => box.remove(), 2500);
      });
    }

  } catch (err) {
    console.error(err);
    fileName.textContent = '⚠️ Erro ao processar o arquivo.';
  } finally {
    spinner.style.display = 'none';
  }
}

// ==========================================================
// 📘 Geração de plano de estudo
// ==========================================================
const els = {
  inpTema: document.getElementById('inp-tema'),
  selDias: document.getElementById('sel-dias'),
  btnGerar: document.getElementById('btn-gerar'),
  plano: document.getElementById('plano'),
  status: document.getElementById('status'),
  ctx: document.getElementById('ctx')
};

function setStatus(msg) { els.status.textContent = msg; }
function updateCtx() {
  els.ctx.textContent = `${state.tema ? 'Tema: ' + state.tema + ' · ' : ''}${state.plano.length} sessões geradas`;
}

function extrairTopicos(texto, tema, maxTopicos = 7) {
  const palavras = texto.toLowerCase().match(/[a-záéíóúâêîôûãõç]+/gi) || [];
  const freq = {};
  for (const p of palavras) freq[p] = (freq[p] || 0) + 1;
  return Object.entries(freq)
    .filter(([w]) => w.length > 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTopicos)
    .map(([w]) => w);
}

function construirPlano(topicos, dias, tema) {
  const plano = [];
  for (let i = 0; i < dias; i++) {
    const t = topicos[i % topicos.length];
    plano.push({
      dia: i + 1,
      titulo: `Sessão ${i + 1}`,
      topico: t,
      descricao: `Estudo sobre "${t}" no contexto de ${tema}. Explore definições, aplicações e exemplos práticos.`
    });
  }
  return plano;
}

els.btnGerar?.addEventListener('click', () => {
  state.tema = els.inpTema.value.trim();
  state.dias = parseInt(els.selDias.value || '5', 10);

  if (!state.tema && !state.materialTexto) {
    alert('Defina um tema ou envie um material.');
    return;
  }

  const tipo = state.tipoMaterial || detectarTipoMaterial(state.materialTexto || '');
  let plano = [];

  if (tipo === 'programa') {
    const linhas = state.materialTexto.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const blocos = Math.ceil(linhas.length / state.dias);
    for (let i = 0; i < state.dias; i++) {
      const inicio = i * blocos;
      const fim = inicio + blocos;
      const grupo = linhas.slice(inicio, fim);
      if (!grupo.length) break;
      plano.push({
        dia: i + 1,
        titulo: `Sessão ${i + 1}`,
        topico: grupo[0].replace(/^[\d•\-–\s]+/, '').split(':')[0] || `Tópico ${i + 1}`,
        descricao: grupo.map(t => '• ' + t).join('\n')
      });
    }
    setStatus('🗂️ Material identificado como programa de conteúdo.');
  } else {
    const topicos = extrairTopicos(state.materialTexto, state.tema || 'Tema', state.dias);
    plano = construirPlano(topicos, state.dias, state.tema || 'Tema');
    setStatus('📘 Material identificado como conteúdo explicativo.');
  }

  state.plano = plano;
  updateCtx();
  renderPlano();
});

function renderPlano() {
  els.plano.innerHTML = '';
  if (!state.plano.length) {
    els.plano.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano de estudo gerado.</p>`;
    return;
  }
  state.plano.forEach(sessao => {
    const div = document.createElement('div');
    div.className = 'session-card';
    div.innerHTML = `<h3>${sessao.titulo}</h3><div class="topico">${sessao.topico}</div><p>${sessao.descricao}</p>`;
    els.plano.appendChild(div);
  });
}
