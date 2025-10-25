// ==========================================================
// 🌙 Tema funcional (escuro por padrão, claro opcional)
// ==========================================================
const body = document.body;
const themeBtn = document.getElementById('btn-theme');

function setTheme(mode) {
  body.classList.add('fading');
  setTimeout(() => {
    if (mode === 'light') {
      body.classList.add('light');
      localStorage.setItem('liora_theme', 'light');
      themeBtn.textContent = '☀️';
    } else {
      body.classList.remove('light');
      localStorage.setItem('liora_theme', 'dark');
      themeBtn.textContent = '🌙';
    }
    body.classList.remove('fading');
  }, 150);
}

themeBtn?.addEventListener('click', () => {
  const current = body.classList.contains('light') ? 'light' : 'dark';
  setTheme(current === 'light' ? 'dark' : 'light');
});

const saved = localStorage.getItem('liora_theme') || 'dark';
setTheme(saved);

// ==========================================================
// 🧩 Estado global básico
// ==========================================================
const $ = id => document.getElementById(id);
const els = {
  inpTema: $('inp-tema'),
  inpFile: $('inp-file'),
  selDias: $('sel-dias'),
  btnGerar: $('btn-gerar'),
  status: $('status'),
  ctx: $('ctx'),
  plano: $('plano')
};

const state = {
  tema: '',
  dias: 5,
  materialTexto: '',
  tipoMaterial: '',
  plano: []
};

const setStatus = msg => (els.status.innerHTML = msg || '');
const updateCtx = () =>
  (els.ctx.textContent = `${state.tipoMaterial ? state.tipoMaterial.toUpperCase() + ' · ' : ''}${state.tema || 'Sem tema'} · ${state.dias} sessões`);

// ==========================================================
// 📚 Leitura de arquivos locais (TXT, PDF, DOCX)
// ==========================================================
async function readFileContent(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  setStatus('⏳ Processando arquivo...');

  if (ext === 'txt') {
    return new Promise(res => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result.toString());
      reader.readAsText(file, 'utf-8');
    });
  }

  if (ext === 'pdf' && window.pdfjsLib) {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(it => it.str).join(' ') + '\n';
    }
    setStatus(`✅ PDF lido com sucesso (${pdf.numPages} páginas)`);
    return text;
  }

  if (ext === 'docx' && window.mammoth) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    setStatus('✅ Documento DOCX convertido.');
    return result.value;
  }

  setStatus('⚠️ Formato não suportado. Use TXT, PDF ou DOCX.');
  return '';
}

els.inpFile?.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await readFileContent(file);
  if (text) {
    state.materialTexto = text;
    if (!state.tema) state.tema = file.name.replace(/\.(pdf|txt|docx?)$/i, '');
    updateCtx();
  }
});

// ==========================================================
// 🧭 Detecção automática do tipo de material
// ==========================================================
function detectarTipoMaterial(texto) {
  const linhas = texto.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const curtas = linhas.filter(l => l.split(' ').length <= 6).length;
  const longas = linhas.filter(l => l.split(' ').length > 6).length;
  return curtas > longas * 1.5 ? 'programa' : 'conteudo';
}

// ==========================================================
// 🧠 Geração do plano de estudo
// ==========================================================
function extrairTopicos(texto, tema, n) {
  let candidatos = [];
  if (texto) {
    const tokens = texto.split(/\n+/).map(s => s.trim()).filter(Boolean);
    candidatos = tokens.filter(s => s.split(' ').length < 10).slice(0, 60);
  }
  if (!candidatos.length) {
    candidatos = [
      `Introdução ao tema ${tema}`,
      'Conceitos principais',
      'Aplicações práticas',
      'Revisão',
      'Síntese final'
    ];
  }
  return candidatos.slice(0, n);
}

function descrever(t, tema) {
  return `Sessão sobre ${t}, parte do tema ${tema}. Revisar conceitos e aplicar em exemplos.`;
}

function construirPlano(topicos, dias, tema) {
  const plano = [];
  for (let i = 0; i < dias; i++) {
    const t = topicos[i % topicos.length];
    plano.push({
      dia: i + 1,
      titulo: `Sessão ${i + 1}`,
      topico: t,
      descricao: descrever(t, tema)
    });
  }
  return plano;
}

function renderPlano() {
  els.plano.innerHTML = '';
  if (!state.plano.length) {
    els.plano.innerHTML =
      '<p class="text-sm text-[var(--muted)]">Crie um plano de estudo ao lado e ele aparecerá aqui.</p>';
    return;
  }

  state.plano.forEach(p => {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML = `
      <div class="text-sm font-semibold mb-1">${p.titulo}</div>
      <div class="text-sm text-[var(--muted)] mb-1">${p.topico}</div>
      <p class="text-sm">${p.descricao}</p>
    `;
    els.plano.appendChild(card);
  });
}

// ==========================================================
// 🚀 Geração dinâmica do plano (com detecção de tipo)
// ==========================================================
els.btnGerar?.addEventListener('click', () => {
  state.tema = els.inpTema.value.trim();
  state.dias = parseInt(els.selDias.value || '5', 10);

  if (!state.tema && !state.materialTexto) {
    alert('Defina um tema ou envie um material.');
    return;
  }

  const texto = state.materialTexto || '';
  const tipo = detectarTipoMaterial(texto);
  state.tipoMaterial = tipo;

  let plano = [];

  if (tipo === 'programa') {
    const linhas = texto.split(/\n+/).map(l => l.trim()).filter(Boolean);
    plano = linhas.slice(0, state.dias).map((t, i) => ({
      dia: i + 1,
      titulo: `Sessão ${i + 1}`,
      topico: t,
      descricao: `Estudo do tópico: ${t}. Explore conceitos, definições e exemplos.`
    }));
    setStatus('🗂️ Material identificado como programa de conteúdo.');
  } else {
    const topicos = extrairTopicos(texto, state.tema || 'Tema', state.dias);
    plano = construirPlano(topicos, state.dias, state.tema || 'Tema');
    setStatus('📘 Material identificado como conteúdo.');
  }

  state.plano = plano;
  updateCtx();
  renderPlano();
});

// Inicialização
renderPlano();
updateCtx();
