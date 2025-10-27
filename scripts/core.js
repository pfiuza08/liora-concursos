// ==========================================================
// 🧠 Liora — Núcleo principal (core.js) — versão com logger
// ==========================================================

const state = {
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

themeBtn.addEventListener('click', toggleTheme);
themeBtn.addEventListener('touchend', e => {
  e.preventDefault();
  toggleTheme();
}, { passive: false });

setTheme(localStorage.getItem('liora_theme') || 'dark');

// ==========================================================
// 🧩 Normalização
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
// 📄 PDF — extração com logger (preservação de linhas X/Y)
// ==========================================================
async function extractTextPDFSmart(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let full = '';

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const rows = [];
    const tolY = 2;

    const items = content.items.map(it => ({
      x: it.transform[4],
      y: Math.round(it.transform[5]),
      str: it.str
    })).sort((a,b) => b.y - a.y || a.x - b.x);

    let currentY = null;
    let currentLine = [];
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
      line.sort((a,b) => a.x - b.x)
          .map((seg, idx, arr) => {
            const prev = arr[idx-1];
            const gap = prev ? seg.x - (prev.x + (prev.str?.length || 1) * 4) : 0;
            const glue = (idx > 0 && gap > 2) ? ' ' : (idx > 0 ? ' ' : '');
            return glue + seg.str;
          }).join('').trim()
    )
    .map(l => l.replace(/\s+([.,;:!?])/g, '$1'))
    .filter(Boolean);

    console.log(`📄 Página ${p}: ${lines.length} linhas extraídas`);
    let pageText = lines.join('\n');
    pageText = pageText
      .replace(/(\b\d{1,3})(\.)\s/g, '\n$1$2 ')
      .replace(/([•\-–])\s/g, '\n$1 ')
      .replace(/\n{3,}/g, '\n\n');

    full += pageText + '\n';
  }

  full = full.replace(/\n{3,}/g, '\n\n').trim();
  console.log(`✅ PDF processado: ${pdf.numPages} páginas, ${full.split(/\n/).length} linhas totais.`);
  return full;
}

// ==========================================================
// 🧪 Sinais e decisão
// ==========================================================
function linhasParaSinais(texto) {
  let linhas = texto.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (linhas.length < 30) {
    const pseudo = texto.split(/(?<=[.!?])\s+/).map(l => l.trim()).filter(Boolean);
    if (pseudo.length > linhas.length) linhas = pseudo;
  }
  return linhas;
}

function medirSinais(textoNormalizado) {
  const linhas = linhasParaSinais(textoNormalizado);
  const total = linhas.length || 1;

  const marcadoresRegex = /^((\d+(\.\d+){0,3}[\.\)])|([IVXLCDM]+\.)|([A-Z]\))|([a-z]\))|[•\-–])/;
  const fimParagrafoRegex = /[.!?]\s*$/;

  let bullets = 0, longas = 0, fimPar = 0, capsLike = 0, maxRun = 0, run = 0;
  for (const l of linhas) {
    const palavras = l.split(/\s+/);
    const isBullet = marcadoresRegex.test(l);
    const isLonga = palavras.length >= 12;
    const isParagrafo = fimParagrafoRegex.test(l);
    const isCapsLike = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ]{6,}$/.test(l) && !/[.!?]$/.test(l);
    if (isBullet) bullets++;
    if (isLonga) longas++;
    if (isParagrafo) fimPar++;
    if (isCapsLike) capsLike++;
    run = isBullet ? run + 1 : 0;
    if (run > maxRun) maxRun = run;
  }

  return {
    total,
    pBullets: bullets / total,
    pLongas: longas / total,
    pFimPar: fimPar / total,
    pCaps: capsLike / total,
    maxRunBullets: maxRun
  };
}

function decidirTipo(s) {
  if (s.pBullets >= 0.25 && (s.maxRunBullets >= 2 || s.pCaps >= 0.1))
    return { tipo: "programa" };
  if (s.pLongas >= 0.55 && s.pFimPar >= 0.45 && s.pBullets < 0.25)
    return { tipo: "conteudo" };
  if (s.pCaps >= 0.1 && s.pBullets >= 0.15 && s.pLongas >= 0.4)
    return { tipo: "hibrido" };
  if (s.total < 15 && s.pLongas >= 0.4)
    return { tipo: "conteudo" };
  return { tipo: "hibrido" };
}

function detectarTipoMaterial(texto) {
  if (!texto || texto.trim().length < 80) return "conteudo";
  const normalizado = normalizarTextoParaPrograma(texto);
  const sinais = medirSinais(normalizado);
  return decidirTipo(sinais).tipo;
}

// ==========================================================
// 📁 Upload e leitura
// ==========================================================
async function handleFileSelection(file) {
  const spinner = document.getElementById('upload-spinner');
  const fileName = document.getElementById('file-name');
  const fileType = document.getElementById('file-type');
  spinner.style.display = 'block';
  fileName.textContent = `Carregando ${file.name}...`;
  fileType.textContent = '';
  document.querySelectorAll('#diagnostico-sinais, #sugestao-sessoes').forEach(e => e.remove());

  try {
    const ext = file.name.split('.').pop().toLowerCase();
    let text = '';
    if (ext === 'txt') text = await file.text();
    else if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      text = await extractTextPDFSmart(arrayBuffer);
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
        ? '🗂️ Detectado: programa de conteúdo'
        : state.tipoMaterial === 'hibrido'
        ? '📘 Detectado: conteúdo híbrido'
        : '📖 Detectado: conteúdo explicativo';

    // Diagnóstico
    const dbg = medirSinais(normalizarTextoParaPrograma(text));
    const hint = document.createElement('pre');
    hint.id = 'diagnostico-sinais';
    hint.style.fontSize = '11px';
    hint.style.whiteSpace = 'pre-wrap';
    hint.style.background = 'rgba(255,255,255,0.03)';
    hint.style.padding = '6px 8px';
    hint.style.borderRadius = '8px';
    hint.style.marginTop = '6px';
    hint.style.color = 'var(--muted)';
    hint.textContent = `
🔎 Diagnóstico:
• Linhas totais: ${dbg.total}
• Marcadores: ${(dbg.pBullets * 100).toFixed(1)}%
• Parágrafos longos: ${(dbg.pLongas * 100).toFixed(1)}%
• Frases com ponto final: ${(dbg.pFimPar * 100).toFixed(1)}%
• Títulos em CAIXA ALTA: ${(dbg.pCaps * 100).toFixed(1)}%
• Sequência máxima de marcadores: ${dbg.maxRunBullets}
    `.trim();
    fileType.insertAdjacentElement('afterend', hint);

  } catch (err) {
    console.error(err);
    fileName.textContent = '⚠️ Erro ao processar o arquivo.';
  } finally {
    spinner.style.display = 'none';
  }
}
