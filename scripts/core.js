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
// 🧠 Processamento semântico (resumo, conceitos e densidade)
// ==========================================================
function analisarSemantica(texto) {
  const palavras = texto.split(/\s+/).filter(w => w.length > 3);
  const freq = {};
  for (const w of palavras) {
    const key = w.toLowerCase().replace(/[.,;:!?()"]/g, "");
    if (!key.match(/^(para|com|como|onde|quando|entre|pois|este|esta|isso|aquele|aquela|são|estão|pode|ser|mais|menos|muito|cada|outro|porque|seja|todo|toda|essa|aquele|essa|essa)$/))
      freq[key] = (freq[key] || 0) + 1;
  }
  const chaves = Object.entries(freq)
    .sort((a,b) => b[1]-a[1])
    .slice(0,10)
    .map(e => e[0]);

  const resumo = texto.split(/[.!?]/)
    .filter(s => s.trim().length > 40)
    .slice(0,2)
    .join('. ') + '.';

  const titulo = chaves[0] ? chaves[0][0].toUpperCase() + chaves[0].slice(1) : "Conteúdo";

  const mediaPalavras = palavras.length / (texto.split(/[.!?]/).length || 1);
  let densidade = "📗 leve";
  if (mediaPalavras > 18 && chaves.length > 7) densidade = "📙 densa";
  else if (mediaPalavras > 12) densidade = "📘 média";

  return { titulo, resumo, conceitos: chaves, densidade };
}

// ==========================================================
// 📁 Upload e leitura + painel flutuante
// ==========================================================
const inputFile = document.getElementById('inp-file');
const fileName = document.getElementById('file-name');
const fileType = document.getElementById('file-type');

inputFile?.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  fileName.textContent = `Carregando ${file.name}...`;

  try {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    let text = '';
    if (ext === 'txt') text = await file.text();
    else if (ext === 'pdf') text = await extractTextPDFSmart(await file.arrayBuffer());
    else { alert('Formato não suportado. Use .txt ou .pdf'); return; }

    state.materialTexto = text;
    state.tipoMaterial = detectarTipoMaterial(text);

    fileName.textContent = `✅ ${file.name} carregado`;
    fileType.textContent =
      state.tipoMaterial === 'programa'
        ? '🗂️ Programa de conteúdo detectado.'
        : state.tipoMaterial === 'hibrido'
        ? '📘 Conteúdo híbrido detectado.'
        : '📖 Conteúdo narrativo detectado.';

    const btn = document.createElement('button');
    btn.id = 'btn-estrutura';
    btn.className = 'btn w-full mt-3';
    btn.textContent = '📋 Ver estrutura detectada';
    btn.onclick = () => abrirEstruturaModal(text);
    fileType.insertAdjacentElement('afterend', btn);

  } catch {
    fileName.textContent = '⚠️ Erro ao processar o arquivo.';
  }
});

// ==========================================================
// 🪟 Painel flutuante — Estrutura detectada
// ==========================================================
function abrirEstruturaModal(texto) {
  document.querySelector('#estrutura-modal')?.remove();
  const normal = normalizarTextoParaPrograma(texto);
  const linhas = normal.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const amostra = linhas.slice(0, 10);

  const modal = document.createElement('div');
  modal.id = 'estrutura-modal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.75)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';
  modal.innerHTML = `
    <div style="
      background:var(--card);
      color:var(--fg);
      padding:1.5rem;
      border-radius:1rem;
      box-shadow:var(--shadow);
      width:90%;
      max-width:640px;
      max-height:80%;
      overflow-y:auto;
    ">
      <h3 style="font-weight:600;margin-bottom:0.5rem;">
        ${state.tipoMaterial === 'programa' ? '🗂️ Estrutura de conteúdo programático' :
          state.tipoMaterial === 'hibrido' ? '📘 Estrutura híbrida detectada' :
          '📖 Estrutura narrativa (blocos de leitura)'}
      </h3>
      <p style="font-size:0.85rem;color:var(--muted);margin-bottom:0.8rem;">
        Exibindo os primeiros ${amostra.length} tópicos detectados (de ${linhas.length} blocos totais).
      </p>
      <ul style="font-size:0.9rem;line-height:1.5;margin-left:1rem;">
        ${amostra.map(l => `<li>${l.replace(/</g,'&lt;')}</li>`).join('')}
      </ul>
      <div style="text-align:right;margin-top:1rem;">
        <button id="fechar-modal" class="chip">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('fechar-modal').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
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

  const gerarSessao = (grupo, i) => {
    const sem = analisarSemantica(grupo.join(" "));
    return {
      dia: i + 1,
      titulo: `Sessão ${i + 1} — ${sem.titulo}`,
      resumo: sem.resumo,
      conceitos: sem.conceitos,
      densidade: sem.densidade,
      descricao: grupo.map(t => "• " + t).join("\n")
    };
  };

  if (tipo === "programa") {
    const blocos = Math.ceil(linhas.length / dias);
    for (let i = 0; i < dias; i++) {
      const grupo = linhas.slice(i * blocos, (i + 1) * blocos);
      if (!grupo.length) break;
      plano.push(gerarSessao(grupo, i));
    }
  } else {
    const blocos = dividirEmBlocos(texto, 800);
    const blocosPorDia = Math.ceil(blocos.length / dias);
    for (let i = 0; i < dias; i++) {
      const grupo = blocos.slice(i * blocosPorDia, (i + 1) * blocosPorDia);
      if (!grupo.length) break;
      plano.push(gerarSessao(grupo, i));
    }
  }
  return plano;
}

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
  if (!state.tema && !state.materialTexto) return alert("Defina um tema ou envie um material.");

  const tipo = state.tipoMaterial || detectarTipoMaterial(state.materialTexto || "");
  state.plano = construirPlanoInteligente(state.materialTexto, tipo, state.dias, state.tema || "Tema");

  setStatus(tipo === "programa"
    ? "🗂️ Programa de conteúdo identificado."
    : tipo === "hibrido"
    ? "📘 Material híbrido detectado."
    : "📖 Texto narrativo identificado.");

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
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <h3>${sessao.titulo}</h3>
        <span class="text-xs opacity-70">${sessao.densidade}</span>
      </div>
      <p style="font-style:italic;font-size:0.85rem;color:var(--muted);margin-bottom:0.4rem;">${sessao.resumo}</p>
      <p>${sessao.descricao.replace(/</g,'&lt;')}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        ${sessao.conceitos.map(c => `<span class="chip">${c}</span>`).join('')}
      </div>
    `;
    els.plano.appendChild(div);
  });
}
