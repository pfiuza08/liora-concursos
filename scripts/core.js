// ==========================================================
// 🧠 Liora — Núcleo principal (core.js) — versão aprimorada
// ==========================================================

const state = {
  tema: '',
  dias: 5,
  materialTexto: '',
  tipoMaterial: '',
  plano: [],
};

// ==========================================================
// 🌓 Tema claro/escuro — versão estável (desktop + mobile)
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
// 🧩 Normalização (robusta para PDF/TOC/listas)
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
// 🧪 Sinais e decisão — com diagnóstico visível
// ==========================================================
function medirSinais(textoNormalizado) {
  const linhas = textoNormalizado.split(/\n+/).map(l => l.trim()).filter(Boolean);
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
  if (s.pBullets >= 0.25 && (s.maxRunBullets >= 2 || s.pCaps >= 0.1)) {
    return { tipo: "programa", conf: 0.9 };
  }

  if (s.pLongas >= 0.55 && s.pFimPar >= 0.45 && s.pBullets < 0.25) {
    return { tipo: "conteudo", conf: 0.85 };
  }

  if (s.pCaps >= 0.1 && s.pBullets >= 0.15 && s.pLongas >= 0.4) {
    return { tipo: "hibrido", conf: 0.7 };
  }

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
  document.querySelectorAll('#diagnostico-sinais').forEach(e => e.remove());

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

    // ======================================================
    // 📊 Diagnóstico visível — análise dos sinais
    // ======================================================
    try {
      const dbg = medirSinais(normalizarTextoParaPrograma(text));
      const diag = `
🔎 Diagnóstico:
• Linhas totais: ${dbg.total}
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
    } catch (err) {
      console.warn("Diagnóstico indisponível:", err);
    }

    // ======================================================
    // 📅 Sugestão automática da quantidade de sessões
    // ======================================================
    const linhas = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    let sugestao = 5;

    if (state.tipoMaterial === 'programa') {
      sugestao = Math.min(30, Math.max(5, Math.round(linhas.length / 10)));
    } else if (state.tipoMaterial === 'conteudo') {
      sugestao = Math.min(10, Math.max(3, Math.round(linhas.length / 80)));
    } else {
      sugestao = Math.min(15, Math.max(5, Math.round(linhas.length / 40)));
    }

    const selDias = document.getElementById('sel-dias');
    selDias.value = sugestao;

    const box = document.createElement('div');
    box.id = 'sugestao-sessoes';
    box.className = 'mt-2 p-3 rounded-lg border border-[var(--stroke)] bg-[var(--card)] text-[13px] shadow-sm animate-fadeIn';
    box.innerHTML = `
      <p>📅 Sugerido: <strong>${sugestao}</strong> sessões (com base em ${linhas.length} blocos detectados).</p>
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
