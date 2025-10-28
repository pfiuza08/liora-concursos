// ==========================================================
// 🧠 Liora — core.js
// Versão compatível com navegador (sem módulos)
// ==========================================================

// Estado global
window.state = {
  tema: '',
  dias: 5,
  materialTexto: '',
  tipoMaterial: '',
  plano: [],
};

// ==========================================================
// 🌓 Tema claro/escuro
// ==========================================================
const themeBtn = document.getElementById('btn-theme');
const body = document.body;
const html = document.documentElement;

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

themeBtn?.addEventListener('click', toggleTheme);
themeBtn?.addEventListener('touchend', e => {
  e.preventDefault();
  toggleTheme();
}, { passive: false });

setTheme(localStorage.getItem('liora_theme') || 'dark');

// ==========================================================
// 🧩 Normalização de texto
// ==========================================================
function normalizarTextoParaPrograma(texto) {
  return texto
    .replace(/\r/g, "")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/(\s|^)((\d+(\.\d+){0,3}[\.\)])|([IVXLCDM]+\.)|([A-Z]\))|([a-z]\))|[•\-–])\s+/g, "\n$2 ")
    .replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "$1\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ==========================================================
// 📄 Extração de texto de PDF
// ==========================================================
async function extractTextPDFSmart(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let full = '';

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const items = content.items.map(it => ({
      x: it.transform[4],
      y: Math.round(it.transform[5]),
      str: it.str
    })).sort((a, b) => b.y - a.y || a.x - b.x);

    let currentY = null;
    const rows = [];
    let currentLine = [];
    const tolY = 2;

    for (const it of items) {
      if (currentY === null) currentY = it.y;
      const newLine = Math.abs(it.y - currentY) > tolY;
      if (newLine) {
        if (currentLine.length) rows.push(currentLine);
        currentLine = [];
        currentY = it.y;
      }
      currentLine.push(it);
    }
    if (currentLine.length) rows.push(currentLine);

    const lines = rows.map(line =>
      line.sort((a, b) => a.x - b.x)
        .map((seg, idx, arr) => {
          const prev = arr[idx - 1];
          const gap = prev ? seg.x - (prev.x + (prev.str?.length || 1) * 4) : 0;
          const glue = (idx > 0 && gap > 2) ? ' ' : (idx > 0 ? ' ' : '');
          return glue + seg.str;
        }).join('').trim()
    ).filter(Boolean);

    full += lines.join('\n') + '\n';
  }

  return full.replace(/\n{3,}/g, '\n\n').trim();
}

// ==========================================================
// 📁 Upload e detecção de tipo
// ==========================================================
const inputFile = document.getElementById('inp-file');
const fileName = document.getElementById('file-name');
const fileType = document.getElementById('file-type');

inputFile?.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;

  fileName.textContent = `Carregando ${file.name}...`;
  let text = '';

  try {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'txt') text = await file.text();
    else if (ext === 'pdf') text = await extractTextPDFSmart(await file.arrayBuffer());
    else { alert('Formato não suportado. Use .txt ou .pdf'); return; }

    window.state.materialTexto = text;
    fileName.textContent = `✅ ${file.name} carregado`;
    fileType.textContent = '🧠 Material detectado. Pronto para análise.';

  } catch (err) {
    console.error(err);
    fileName.textContent = '⚠️ Erro ao processar o arquivo.';
  }
});

// ==========================================================
// 🪟 Geração do plano e análise semântica
// ==========================================================
function construirPlanoInteligente(texto, dias) {
  const linhas = normalizarTextoParaPrograma(texto).split(/\n+/).filter(Boolean);
  const blocosPorDia = Math.ceil(linhas.length / dias);
  const plano = [];

  for (let i = 0; i < dias; i++) {
    const grupo = linhas.slice(i * blocosPorDia, (i + 1) * blocosPorDia);
    if (!grupo.length) break;

    const sem = window.Semantic.analisarSemantica(grupo.join(" "));
    plano.push({
      dia: i + 1,
      titulo: `Sessão ${i + 1} — ${sem.titulo}`,
      resumo: sem.resumo,
      conceitos: sem.conceitos,
      densidade: sem.densidade,
      descricao: grupo.map(t => "• " + t).join("\n")
    });
  }
  return plano;
}

const btnGerar = document.getElementById('btn-gerar');
const planoDiv = document.getElementById('plano');
const selDias = document.getElementById('sel-dias');
const inpTema = document.getElementById('inp-tema');

btnGerar?.addEventListener('click', () => {
  const dias = parseInt(selDias.value || "5", 10);
  const texto = window.state.materialTexto || inpTema.value;
  if (!texto.trim()) return alert("Envie um material ou defina um tema.");

  const plano = construirPlanoInteligente(texto, dias);
  window.state.plano = plano;
  renderPlano(plano);
});

function renderPlano(plano) {
  planoDiv.innerHTML = '';
  plano.forEach(sessao => {
    const div = document.createElement('div');
    div.className = 'session-card';
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <h3>${sessao.titulo}</h3>
        <span class="text-xs opacity-70">${sessao.densidade}</span>
      </div>
      <p style="font-style:italic;font-size:0.85rem;color:var(--muted);margin-bottom:0.4rem;">${sessao.resumo}</p>
      <p>${sessao.descricao}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        ${sessao.conceitos.map(c => `<span class="chip">${c}</span>`).join('')}
      </div>
    `;
    planoDiv.appendChild(div);
  });
}
