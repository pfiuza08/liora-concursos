// ==========================================================
// 🧠 Liora — Núcleo principal (core.js)
// Versão com Painel Flutuante + Processamento Semântico + Densidade Cognitiva
// ==========================================================

const state = {
  tema: '',
  dias: 5,
  materialTexto: '',
  tipoMaterial: '',
  plano: [],
};

// ==========================================================
// 🌓 Tema claro/escuro (desktop + mobile)
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
// 📄 Extração de texto de PDF com estrutura preservada
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
    ).filter(Boolean);

    full += lines.join('\n') + '\n';
  }

  return full.replace(/\n{3,}/g, '\n\n').trim();
}

// ==========================================================
// 🧪 Sinais e decisão de tipo de material
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
  const verboRegex = /\b(é|são|representa|define|explica|trata|apresenta|demonstra|envolve|caracteriza|consiste|mostra)\b/i;
  const fimParagrafoRegex = /[.!?]\s*$/;

  let bullets = 0, longas = 0, verbais = 0, fimPar = 0, capsLike = 0;
  let maxRunBullets = 0, run = 0;

  for (const l of linhas) {
    const palavras = l.split(/\s+/);
    const isBullet = marcadoresRegex.test(l);
    const isLonga = palavras.length >= 12;
    const isVerbal = verboRegex.test(l);
    const isParagrafo = fimParagrafoRegex.test(l);
    const isCapsLike = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ]{6,}$/.test(l) && !/[.!?]$/.test(l);

    if (isBullet) bullets++;
    if (isLonga) longas++;
    if (isVerbal) verbais++;
    if (isParagrafo) fimPar++;
    if (isCapsLike) capsLike++;

    run = isBullet ? run + 1 : 0;
    if (run > maxRunBullets) maxRunBullets = run;
  }

  return { total, pBullets: bullets/total, pLongas: longas/total, pVerbais: verbais/total, pFimPar: fimPar/total, pCaps: capsLike/total, maxRunBullets };
}

function decidirTipo(s) {
  if (s.pBullets >= 0.25 && (s.maxRunBullets >= 2 || s.pCaps >= 0.1)) return { tipo: "programa", conf: 0.9 };
  if (s.pLongas >= 0.55 && s.pFimPar >= 0.45 && s.pBullets < 0.25) return { tipo: "conteudo", conf: 0.85 };
  if (s.pCaps >= 0.1 && s.pBullets >= 0.15 && s.pLongas >= 0.4) return { tipo: "hibrido", conf: 0.7 };
  if (s.total < 15 && s.pLongas >= 0.4) return { tipo: "conteudo", conf: 0.6 };
  return { tipo: "hibrido", conf: 0.5 };
}

function detectarTipoMaterial(texto) {
  if (!texto || texto.trim().length < 80) return "conteudo";
  const normalizado = normalizarTextoParaPrograma(texto);
  const sinais = medirSinais(normalizado);
  const { tipo } = decidirTipo(sinais);
  return tipo;
}

// ==========================================================
// 🧠 Análise Semântica — Agrupamento e resumos automáticos
// ==========================================================
function extrairPalavrasChave(texto) {
  return texto
    .toLowerCase()
    .replace(/[.,;:!?()\-–—"']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['para','como','onde','quando','porque','isso','esta','esse','essa','qual','com','sem','dos','das','nos','nas','uma','pela','pela','entre','sobre','após','cada','pode','ser','estão','tem','mais','menos','ainda','assim'].includes(w));
}

function similaridadeSemantica(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const inter = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return inter / union;
}

function agruparTopicosSemelhantes(linhas) {
  const grupos = [];
  const usado = new Set();

  for (let i = 0; i < linhas.length; i++) {
    if (usado.has(i)) continue;
    const base = extrairPalavrasChave(linhas[i]);
    const grupo = [linhas[i]];
    usado.add(i);

    for (let j = i + 1; j < linhas.length; j++) {
      if (usado.has(j)) continue;
      const cand = extrairPalavrasChave(linhas[j]);
      const sim = similaridadeSemantica(base, cand);
      if (sim > 0.35) {
        grupo.push(linhas[j]);
        usado.add(j);
      }
    }
    grupos.push(grupo);
  }

  return grupos.map(g => ({
    topicoPrincipal: g[0],
    subitens: g.slice(1),
    resumo: gerarResumoSintetico(g)
  }));
}

function gerarResumoSintetico(grupo) {
  const texto = grupo.join(' ');
  const palavras = extrairPalavrasChave(texto);
  const freq = {};
  palavras.forEach(p => freq[p] = (freq[p] || 0) + 1);
  const top = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,5).map(([p])=>p);
  return `Foco: ${top.join(', ')}`;
}

// ==========================================================
// 📘 Construção e renderização do plano (com semântica)
// ==========================================================
function dividirEmBlocos(texto, maxTamanho = 700) {
  const frases = texto.split(/(?<=[.!?])\s+/);
  const blocos = [];
  let bloco = "";
  for (const f of frases) {
    if ((bloco + f).length > maxTamanho) {
      blocos.push(bloco.trim());
      bloco = "";
    }
    bloco += f + " ";
  }
  if (bloco.trim()) blocos.push(bloco.trim());
  return blocos;
}

function construirPlanoInteligente(texto, tipo, dias, tema) {
  const plano = [];
  const linhas = normalizarTextoParaPrograma(texto).split(/\n+/).map(l => l.trim()).filter(Boolean);

  if (tipo === "programa") {
    const grupos = agruparTopicosSemelhantes(linhas);
    const blocos = Math.ceil(grupos.length / dias);

    for (let i = 0; i < dias; i++) {
      const grupo = grupos.slice(i * blocos, (i + 1) * blocos);
      if (!grupo.length) break;
      const topico = grupo[0].topicoPrincipal.replace(/^[\d•\-–\s]+/, "");
      const descricao = grupo.map(g => "• " + g.topicoPrincipal + (g.subitens.length ? "\n   " + g.subitens.join("\n   ") : "")).join("\n");

      plano.push({
        dia: i + 1,
        titulo: `Sessão ${i + 1}`,
        topico,
        descricao,
        resumo: grupo.map(g => g.resumo).join('; '),
        densidade: grupo.length > 5 ? "alta (📙 densa)" : grupo.length > 2 ? "média (📘 moderada)" : "leve (📗 leve)",
        conceitos: extrairPalavrasChave(descricao).slice(0,4)
      });
    }
  } else {
    const blocos = dividirEmBlocos(texto, 800);
    const blocosPorDia = Math.ceil(blocos.length / dias);
    for (let i = 0; i < dias; i++) {
      const grupo = blocos.slice(i * blocosPorDia, (i + 1) * blocosPorDia);
      if (!grupo.length) break;
      plano.push({
        dia: i + 1,
        titulo: `Sessão ${i + 1}`,
        topico: `Leitura guiada ${i + 1}`,
        descricao: grupo.join("\n\n"),
        resumo: gerarResumoSintetico(grupo),
        densidade: grupo.join(' ').length > 1200 ? "alta (📙 densa)" : "média (📘 moderada)",
        conceitos: extrairPalavrasChave(grupo.join(' ')).slice(0,4)
      });
    }
  }
  return plano;
}
