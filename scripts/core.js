// ==========================================================
// 🧠 Liora — Núcleo principal (core.js)
// Versão com painel flutuante de estrutura detectada
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
  const verboRegex = /\b(é|s|representa|define|explica|trata|apresenta|demonstra|envolve|caracteriza|consiste|mostra)\b/i;
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
// 📁 Upload e leitura de arquivo + painel flutuante
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
  document.querySelectorAll('#diagnostico-sinais, #sugestao-sessoes, #btn-estrutura').forEach(e => e.remove());

  try {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    let text = '';
    if (ext === 'txt') text = await file.text();
    else if (ext === 'pdf') text = await extractTextPDFSmart(await file.arrayBuffer());
    else { alert('Formato não suportado. Use .txt ou .pdf'); spinner.style.display = 'none'; return; }

    state.materialTexto = text;
    state.tipoMaterial = detectarTipoMaterial(text);

    fileName.textContent = `✅ ${file.name} carregado`;
    fileType.textContent =
      state.tipoMaterial === 'programa'
        ? '🗂️ Detectado: programa de conteúdo (estrutura de tópicos)'
        : state.tipoMaterial === 'hibrido'
        ? '📘 Detectado: conteúdo híbrido (mistura de tópicos e texto)'
        : '📖 Detectado: conteúdo explicativo (texto narrativo)';

    // === Diagnóstico
    const dbg = medirSinais(normalizarTextoParaPrograma(text));
    const diag = `
🔎 Diagnóstico:
• Linhas: ${dbg.total}
• Bullets: ${(dbg.pBullets*100).toFixed(1)}%
• Longas: ${(dbg.pLongas*100).toFixed(1)}%
• Caps: ${(dbg.pCaps*100).toFixed(1)}%
• Sequência máx.: ${dbg.maxRunBullets}
    `.trim();
    const hint = document.createElement('pre');
    hint.id = 'diagnostico-sinais';
    hint.style.fontSize = '11px';
    hint.style.whiteSpace = 'pre-wrap';
    hint.style.background = 'rgba(255,255,255,0.03)';
    hint.style.padding = '6px 8px';
    hint.style.borderRadius = '8px';
    hint.style.marginTop = '6px';
    hint.style.color = 'var(--muted)';
    hint.textContent = diag;
    fileType.insertAdjacentElement('afterend', hint);

    // === Estrutura detectada (botão)
    const btn = document.createElement('button');
    btn.id = 'btn-estrutura';
    btn.className = 'btn w-full mt-3';
    btn.textContent = '📋 Ver estrutura detectada';
    btn.onclick = () => abrirEstruturaModal(text);
    hint.insertAdjacentElement('afterend', btn);

    // === Sugestão automática de sessões (mantida)
    const linhas = state.tipoMaterial === 'programa'
      ? normalizarTextoParaPrograma(text).split(/\n+/).filter(Boolean)
      : text.split(/(?<=[.!?])\s+/).filter(Boolean);

    let sugestao = 5;
    if (state.tipoMaterial === 'programa') {
      sugestao = Math.min(30, Math.max(5, Math.round(linhas.length / 10)));
    } else if (state.tipoMaterial === 'conteudo') {
      sugestao = Math.min(10, Math.max(3, Math.round(linhas.length / 80)));
    } else {
      sugestao = Math.min(15, Math.max(5, Math.round(linhas.length / 40)));
    }

    const selDias = document.getElementById('sel-dias');
    if (selDias) selDias.value = sugestao;

  } catch (err) {
    console.error(err);
    fileName.textContent = '⚠️ Erro ao processar o arquivo.';
  } finally {
    spinner.style.display = 'none';
  }
}

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
      animation:fadeIn 0.3s ease;
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
        ${amostra.map(l => `<li style="margin-bottom:4px;">${l.replace(/</g,'&lt;')}</li>`).join('')}
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
// 📘 Construção e renderização do plano
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
    const blocos = Math.ceil(linhas.length / dias);
    for (let i = 0; i < dias; i++) {
      const grupo = linhas.slice(i * blocos, (i + 1) * blocos);
      if (!grupo.length) break;
      plano.push({
        dia: i + 1,
        titulo: `Sessão ${i + 1}`,
        topico: (grupo[0] || '').replace(/^[\d•\-–\s]+/, ""),
        descricao: grupo.map(t => "• " + t).join("\n")
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
        descricao: grupo.join("\n\n")
      });
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

  if (!state.tema && !state.materialTexto) {
    alert("Defina um tema ou envie um material.");
    return;
  }

  const tipo = state.tipoMaterial || detectarTipoMaterial(state.materialTexto || "");
  const plano = construirPlanoInteligente(state.materialTexto, tipo, state.dias, state.tema || "Tema");
  state.plano = plano;
  setStatus(tipo === "programa"
    ? "🗂️ Material identificado como programa de conteúdo."
    : tipo === "hibrido"
    ? "📘 Material híbrido detectado."
    : "📖 Material identificado como conteúdo explicativo.");
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
      <h3>${sessao.titulo}</h3>
      <div class="topico">${sessao.topico}</div>
      <p>${sessao.descricao.replace(/</g,'&lt;')}</p>
    `;
    els.plano.appendChild(div);
  });
}
