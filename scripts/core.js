// ==========================================================
// 🧠 Liora — Núcleo principal (core.js) — versão com PDF Smart
// ==========================================================

const state = {
  tema: '',
  dias: 5,
  materialTexto: '',
  tipoMaterial: '',
  plano: [],
};

// ==========================================================
// 🌓 Tema claro/escuro — estável (desktop + mobile)
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
// 🧩 Normalização/TOC
// ==========================================================
function normalizarTextoParaPrograma(texto) {
  return texto
    .replace(/\r/g, "")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    // quebras antes de marcadores/numeração
    .replace(/(\s|^)((\d+(\.\d+){0,3}[\.\)])|([IVXLCDM]+\.)|([A-Z]\))|([a-z]\))|[•\-–])\s+/g, "\n$2 ")
    // quebra após ponto + maiúscula (parágrafo novo)
    .replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "$1\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ==========================================================
// 📄 PDF — extração com preservação de linhas (X/Y)
// ==========================================================
async function extractTextPDFSmart(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let full = '';

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // Agrupa por Y aproximado
    const rows = [];
    const tolY = 2; // tolerância vertical
    // Vamos acumular linhas ordenando por Y decrescente (PDF coord. origem no canto inferior)
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

    // Ordena cada linha por X e junta com espaços
    const lines = rows.map(line =>
      line.sort((a,b) => a.x - b.x)
          .map((seg, idx, arr) => {
            const prev = arr[idx-1];
            const gap = prev ? seg.x - (prev.x + (prev.str?.length || 1) * 4) : 0; // heurística gap
            const glue = (idx > 0 && gap > 2) ? ' ' : (idx > 0 ? ' ' : '');
            return glue + seg.str;
          }).join('').trim()
    )
    .map(l => l.replace(/\s+([.,;:!?])/g, '$1')) // limpa espaços antes de pontuação
    .filter(Boolean);

    let pageText = lines.join('\n');

    // reforça listas internas na mesma linha
    pageText = pageText
      .replace(/(\b\d{1,3})(\.)\s/g, '\n$1$2 ')
      .replace(/([•\-–])\s/g, '\n$1 ')
      .replace(/\n{3,}/g, '\n\n');

    full += pageText + '\n';
  }

  // normalização final
  full = full.replace(/\n{3,}/g, '\n\n').trim();
  return full;
}

// ==========================================================
// 🧪 Sinais e decisão — com fallback e diagnóstico
// ==========================================================
function linhasParaSinais(texto) {
  // usa quebras existentes; se poucas linhas, cria pseudo-linhas por frases
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
  const verboRegex = /\b(é|são|está|estão|representa|consiste|define|explica|indica|utiliza|refere|aplica|envolve|caracteriza|permite|demonstra|revela|trata|apresenta|mostra|describe|analisa|discorre)\b/i;
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

  const pBullets = bullets / total;
  const pLongas = longas / total;
  const pVerbais = verbais / total;
  const pFimPar = fimPar / total;
  const pCaps = capsLike / total;

  return { total, pBullets, pLongas, pVerbais, pFimPar, pCaps, maxRunBullets };
}

function decidirTipo(s) {
  // Listas compactas agora contam mais
  if (s.pBullets >= 0.25 && (s.maxRunBullets >= 2 || s.pCaps >= 0.1)) {
    return { tipo: "programa", conf: 0.9 };
  }
  // Texto narrativo claro
  if (s.pLongas >= 0.55 && s.pFimPar >= 0.45 && s.pBullets < 0.25) {
    return { tipo: "conteudo", conf: 0.85 };
  }
  // Mistos
  if (s.pCaps >= 0.1 && s.pBullets >= 0.15 && s.pLongas >= 0.4) {
    return { tipo: "hibrido", conf: 0.7 };
  }
  // Curto → privilegia conteúdo
  if (s.total < 15 && s.pLongas >= 0.4) {
    return { tipo: "conteudo", conf: 0.6 };
  }
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
  document.querySelectorAll('#diagnostico-sinais, #sugestao-sessoes').forEach(e => e.remove());

  try {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    let text = '';

    if (ext === 'txt') {
      text = await file.text();
    } else if (ext === 'pdf') {
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
        ? '🗂️ Detectado: programa de conteúdo (estrutura de tópicos)'
        : state.tipoMaterial === 'hibrido'
        ? '📘 Detectado: conteúdo híbrido (mistura de tópicos e texto)'
        : '📖 Detectado: conteúdo explicativo (texto narrativo)';

    // 📊 Diagnóstico visível
    try {
      const dbg = medirSinais(normalizarTextoParaPrograma(text));
      const diag = `
🔎 Diagnóstico:
• Linhas totais (para sinais): ${dbg.total}
• Marcadores (bullets): ${(dbg.pBullets * 100).toFixed(1)}%
• Parágrafos longos: ${(dbg.pLongas * 100).toFixed(1)}%
• Frases com pontuação final: ${(dbg.pFimPar * 100).toFixed(1)}%
• Títulos em CAIXA ALTA: ${(dbg.pCaps * 100).toFixed(1)}%
• Sequência máxima de marcadores: ${dbg.maxRunBullets}
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
    } catch {}

    // 📅 Sugestão automática de sessões
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

    const box = document.createElement('div');
    box.id = 'sugestao-sessoes';
    box.className = 'mt-2 p-3 rounded-lg border border-[var(--stroke)] bg-[var(--card)] text-[13px] shadow-sm';
    box.innerHTML = `
      <p>📅 Sugerido: <strong>${sugestao}</strong> sessões (com base em ${linhas.length} blocos detectados).</p>
      <p class="mt-1 text-[var(--muted)]">💬 Deseja manter essa sugestão?</p>
      <div class="mt-2 flex gap-2">
        <button id="btn-aceitar" class="btn text-[12px] py-1 px-2">✅ Aceitar</button>
        <button id="btn-ajustar" class="chip text-[12px] py-1 px-2">✏️ Ajustar manualmente</button>
      </div>
    `;
    fileType.insertAdjacentElement('afterend', box);

    document.getElementById('btn-aceitar')?.addEventListener('click', () => {
      box.innerHTML = `<p>📘 Sessões confirmadas: ${sugestao}.</p>`;
      setTimeout(() => box.remove(), 1500);
    });
    document.getElementById('btn-ajustar')?.addEventListener('click', () => {
      box.innerHTML = `<p>✏️ Ajuste o número de sessões manualmente no seletor abaixo.</p>`;
      selDias?.focus();
      setTimeout(() => box.remove(), 2500);
    });

  } catch (err) {
    console.error(err);
    fileName.textContent = '⚠️ Erro ao processar o arquivo.';
  } finally {
    spinner.style.display = 'none';
  }
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
        topico: grupo[0].replace(/^[\d•\-–\s]+/, ""),
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
        topico: "Leitura guiada",
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
  setStatus(
    tipo === "programa"
      ? "🗂️ Material identificado como programa de conteúdo estruturado."
      : tipo === "hibrido"
      ? "📘 Material híbrido detectado (combinação de tópicos e texto explicativo)."
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
