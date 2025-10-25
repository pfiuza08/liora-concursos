// ==========================================================
// 🧠 Liora Concursos — Núcleo principal (core.js)
// ==========================================================

// Estado global
const state = {
  tema: '',
  dias: 5,
  materialTexto: '',
  tipoMaterial: '',
  plano: [],
  simulado: { questoes: [], respostas: {} }
};

// Elementos principais
const els = {
  inpTema: document.getElementById('inp-tema'),
  inpFile: document.getElementById('inp-file'),
  selDias: document.getElementById('sel-dias'),
  btnGerar: document.getElementById('btn-gerar'),
  plano: document.getElementById('plano'),
  status: document.getElementById('status'),
  ctx: document.getElementById('ctx')
};

// ==========================================================
// 🎨 Tema claro/escuro
// ==========================================================
const themeBtn = document.getElementById('btn-theme');
const body = document.body;

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
    setTimeout(() => body.classList.remove('fading'), 150);
  }, 100);
}

themeBtn?.addEventListener('click', () => {
  const current = body.classList.contains('light') ? 'light' : 'dark';
  setTheme(current === 'light' ? 'dark' : 'light');
});

const savedTheme = localStorage.getItem('liora_theme');
setTheme(savedTheme || 'dark');

// ==========================================================
// 📊 Utilitários de interface
// ==========================================================
function setStatus(msg) {
  if (els.status) els.status.textContent = msg;
}

function updateCtx() {
  els.ctx.textContent = `${state.tema ? 'Tema: ' + state.tema + ' · ' : ''}${state.plano.length} sessões geradas`;
}

// ==========================================================
// 🧩 Detecção do tipo de material
// ==========================================================
function detectarTipoMaterial(texto) {
  const linhas = texto.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const curtas = linhas.filter(l => l.split(' ').length <= 6).length;
  const longas = linhas.filter(l => l.split(' ').length > 6).length;
  return curtas > longas * 1.5 ? 'programa' : 'conteudo';
}

// ==========================================================
// 📄 Leitura de arquivos (TXT e PDF via pdf.js)
// ==========================================================
els.inpFile?.addEventListener('change', async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  setStatus(`Carregando ${file.name}...`);

  try {
    if (ext === 'txt') {
      const text = await file.text();
      state.materialTexto = text;
      state.tipoMaterial = detectarTipoMaterial(text);
    }
    else if (ext === 'pdf') {
      // ⚙️ Requer pdf.js (adicionado no <head>)
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let textContent = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        textContent += content.items.map(item => item.str).join(' ') + '\n';
      }
      state.materialTexto = textContent;
      state.tipoMaterial = detectarTipoMaterial(textContent);
    }
    else {
      alert('Formato não suportado. Use .txt ou .pdf');
      return;
    }

    setStatus(`✅ Arquivo "${file.name}" carregado com sucesso.`);
  } catch (err) {
    console.error(err);
    setStatus('⚠️ Erro ao processar o arquivo.');
  }
});

// ==========================================================
// 📘 Extração de tópicos e geração de plano
// ==========================================================
function extrairTopicos(texto, tema, maxTopicos = 7) {
  const sentencas = texto.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
  const palavras = texto.toLowerCase().match(/[a-záéíóúâêîôûãõç]+/gi) || [];
  const freq = {};
  for (const p of palavras) freq[p] = (freq[p] || 0) + 1;

  const top = Object.entries(freq)
    .filter(([w]) => w.length > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTopicos)
    .map(([w]) => w);

  return top;
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

// ==========================================================
// 🚀 Geração do plano de estudo
// ==========================================================
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
    plano = linhas.slice(0, state.dias).map((t, i) => ({
      dia: i + 1,
      titulo: `Sessão ${i + 1}`,
      topico: t,
      descricao: `Estudo do tópico: ${t}. Aprofunde-se nos conceitos principais e busque exemplos aplicados.`
    }));
    setStatus('🗂️ Material identificado como programa de conteúdo.');
  } else {
    const topicos = extrairTopicos(state.materialTexto, state.tema || 'Tema', state.dias);
    plano = construirPlano(topicos, state.dias, state.tema || 'Tema');
    setStatus('📘 Material identificado como conteúdo.');
  }

  state.plano = plano;
  updateCtx();
  renderPlano();
});

// ==========================================================
// 🧱 Renderização do plano
// ==========================================================
function renderPlano() {
  if (!els.plano) return;
  els.plano.innerHTML = '';

  if (!state.plano.length) {
    els.plano.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano de estudo gerado.</p>`;
    return;
  }

  state.plano.forEach(sessao => {
    const div = document.createElement('div');
    div.className = 'session-card';
    div.setAttribute('data-dia', `#${sessao.dia}`);
    div.innerHTML = `
      <h3>${sessao.titulo}</h3>
      <div class="topico">${sessao.topico}</div>
      <p>${sessao.descricao}</p>
    `;
    els.plano.appendChild(div);
  });
// ==========================================================
// 📁 Upload zone — interação e feedback visual
// ==========================================================
const zone = document.getElementById('upload-zone');
const inputFile = document.getElementById('inp-file');
const fileName = document.getElementById('file-name');

if (zone && inputFile) {
  // Clique na zona abre o seletor
  zone.addEventListener('click', () => inputFile.click());

  // Destaque ao arrastar arquivo
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

  // Ao soltar arquivo
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      inputFile.files = e.dataTransfer.files;
      handleFileSelection(file);
    }
  });

  // Ao selecionar arquivo via seletor
  inputFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleFileSelection(file);
  });
}

// Função para feedback de arquivo
async function handleFileSelection(file) {
  fileName.textContent = `Carregando ${file.name}...`;
  setStatus('Processando arquivo...');
  try {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt') {
      const text = await file.text();
      state.materialTexto = text;
      state.tipoMaterial = detectarTipoMaterial(text);
    } else if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let textContent = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        textContent += content.items.map(item => item.str).join(' ') + '\n';
      }
      state.materialTexto = textContent;
      state.tipoMaterial = detectarTipoMaterial(textContent);
    } else {
      alert('Formato não suportado. Use .txt ou .pdf');
      return;
    }
    fileName.textContent = `✅ ${file.name} carregado`;
    setStatus('Arquivo processado com sucesso.');
  } catch (err) {
    console.error(err);
    fileName.textContent = '⚠️ Erro ao processar o arquivo.';
    setStatus('Erro ao ler o arquivo.');
  }
}


  
}
