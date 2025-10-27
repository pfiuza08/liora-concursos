// ==========================================================
// 🧠 Liora — Núcleo principal (core.js) — versão completa e aprimorada
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

themeBtn.addEventListener('click', toggleTheme);
themeBtn.addEventListener('touchend', e => {
  e.preventDefault();
  toggleTheme();
}, { passive: false });

setTheme(localStorage.getItem('liora_theme') || 'dark');

// ==========================================================
// 🧩 Normalização e detecção semântica — versão aprimorada
// ==========================================================

function normalizarTextoParaPrograma(texto) {
  return texto
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/(\d+\.)\s*/g, "\n$1 ")
    .replace(/([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})(?=\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "\n$1")
    .replace(/([•\-–])\s*/g, "\n$1 ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function detectarTipoMaterial(texto) {
  if (!texto || texto.length < 80) return "conteudo";

  const normalizado = normalizarTextoParaPrograma(texto);
  const linhas = normalizado.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (!linhas.length) return "conteudo";

  let curtas = 0, marcadas = 0, verbais = 0, paragrafos = 0, longas = 0;

  const verboRegex = /\b(é|são|está|estão|representa|consiste|define|explica|indica|utiliza|refere|aplica|envolve|caracteriza|permite|demonstra|revela|trata|apresenta)\b/i;
  const marcadoresRegex = /^(\d+\.|[A-Z]\.|[a-z]\)|•|\-|\–)/;
  const fimDeParagrafoRegex = /[.!?]\s*$/;

  for (const l of linhas) {
    const palavras = l.split(/\s+/);
    if (palavras.length <= 8) curtas++;
    else longas++;

    if (marcadoresRegex.test(l)) marcadas++;
    if (verboRegex.test(l)) verbais++;
    if (fimDeParagrafoRegex.test(l)) paragrafos++;
  }

  const total = linhas.length;
  const pCurtas = curtas / total;
  const pMarcadas = marcadas / total;
  const pVerbais = verbais / total;
  const pLongas = longas / total;
  const pParagrafos = paragrafos / total;

  const scorePrograma = (pCurtas * 0.5 + pMarcadas * 0.6) - (pVerbais * 0.3 + pLongas * 0.4);
  const scoreConteudo = (pLongas * 0.6 + pVerbais * 0.4) - (pMarcadas * 0.5);

  if (scorePrograma > 0.25 && pMarcadas > 0.2) return "programa";
  if (scoreConteudo > 0.25 && pLongas > 0.4) return "conteudo";
  return "hibrido";
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
        : state.tipoMaterial === 'hibrido'
        ? '📘 Detectado: conteúdo híbrido (mistura de tópicos e texto)'
        : '📖 Detectado: conteúdo explicativo (texto narrativo)';

  } catch (err) {
    console.error(err);
    fileName.textContent = '⚠️ Erro ao processar o arquivo.';
  } finally {
    spinner.style.display = 'none';
  }
}

// ==========================================================
// 📘 Geração de plano de estudo — aprimorada
// ==========================================================

function dividirEmBlocos(texto, maxTamanho = 600) {
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
  const linhas = texto.split(/\n+/).map(l => l.trim()).filter(Boolean);

  if (tipo === "programa") {
    const blocos = Math.ceil(linhas.length / dias);
    for (let i = 0; i < dias; i++) {
      const grupo = linhas.slice(i * blocos, (i + 1) * blocos);
      if (!grupo.length) break;
      plano.push({
        dia: i + 1,
        titulo: `Sessão ${i + 1}`,
        topico: grupo[0].replace(/^[\d•\-–\s]+/, ""),
        descricao: grupo.map(t => "• " + t).join("\n")
      });
    }
  }

  else if (tipo === "conteudo") {
    const blocos = dividirEmBlocos(texto, 800);
    const blocosPorDia = Math.ceil(blocos.length / dias);
    for (let i = 0; i < dias; i++) {
      const grupo = blocos.slice(i * blocosPorDia, (i + 1) * blocosPorDia);
      if (!grupo.length) break;
      plano.push({
        dia: i + 1,
        titulo: `Sessão ${i + 1}`,
        topico: `Leitura guiada`,
        descricao: grupo.join("\n\n")
      });
    }
  }

  else { // híbrido
    const linhasPrograma = linhas.filter(l => /^[\d•\-–A-Za-z]/.test(l));
    const blocosConteudo = dividirEmBlocos(texto, 700);
    const qtdProg = Math.min(dias - 2, Math.ceil(linhasPrograma.length / 10));
    const qtdCont = dias - qtdProg;

    for (let i = 0; i < qtdCont; i++) {
      plano.push({
        dia: i + 1,
        titulo: `Sessão ${i + 1}`,
        topico: `Fundamentos`,
        descricao: blocosConteudo[i] || ""
      });
    }
    for (let j = 0; j < qtdProg; j++) {
      plano.push({
        dia: qtdCont + j + 1,
        titulo: `Sessão ${qtdCont + j + 1}`,
        topico: linhasPrograma[j] || `Tópico ${j + 1}`,
        descricao: linhasPrograma.slice(j * 5, j * 5 + 5).join("\n")
      });
    }
  }

  return plano;
}

// ==========================================================
// 🚀 Geração do plano de estudo (listener principal)
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

els.btnGerar?.addEventListener("click", () => {
  state.tema = els.inpTema.value.trim();
  state.dias = parseInt(els.selDias.value || "5", 10);

  if (!state.tema && !state.materialTexto) {
    alert("Defina um tema ou envie um material.");
    return;
  }

  const tipo = state.tipoMaterial || detectarTipoMaterial(state.materialTexto || "");
  const plano = construirPlanoInteligente(state.materialTexto, tipo, state.dias, state.tema || "Tema");

  state.plano = plano;
  setStatus(
    tipo === "programa"
      ? "🗂️ Material identificado como programa de conteúdo estruturado."
      : tipo === "hibrido"
      ? "📘 Material híbrido detectado (combinação de conteúdo explicativo e estrutura de tópicos)."
      : "📖 Material identificado como conteúdo explicativo."
  );
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
