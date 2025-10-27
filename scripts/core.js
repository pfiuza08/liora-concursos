// ==========================================================
// 🧠 Liora — Núcleo principal (core.js)
// Versão Inteligente com Agrupamento Semântico + Painel Flutuante + Resumo Cognitivo
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
// 🧪 Detecção de tipo de material
// ==========================================================
function medirSinais(textoNormalizado) {
  const linhas = textoNormalizado.split(/\n+/).filter(Boolean);
  const total = linhas.length || 1;
  let bullets = 0, longas = 0, caps = 0;
  const marcadores = /^(\d+\.|\•|\-|\–)/;

  for (const l of linhas) {
    if (marcadores.test(l)) bullets++;
    if (l.length > 80) longas++;
    if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ]{6,}$/.test(l)) caps++;
  }

  return { total, pBullets: bullets/total, pLongas: longas/total, pCaps: caps/total };
}

function detectarTipoMaterial(texto) {
  const s = medirSinais(normalizarTextoParaPrograma(texto));
  if (s.pBullets > 0.3 && s.pCaps > 0.1) return "programa";
  if (s.pLongas > 0.6 && s.pBullets < 0.2) return "conteudo";
  return "hibrido";
}

// ==========================================================
// 🧠 Agrupamento semântico automático
// ==========================================================
function extrairPalavrasChave(texto) {
  return texto
    .toLowerCase()
    .replace(/[.,;:!?()\-–—"']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['para','como','onde','quando','porque','isso','esta','esse','essa','qual','com','sem','dos','das','nos','nas','uma','pela','entre','sobre','após','cada','pode','ser','estão','tem','mais','menos','ainda','assim','muito','pouco','todo','toda','cada','seja'].includes(w));
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
      width:90%;
      max-width:640px;
      max-height:80%;
      overflow-y:auto;
    ">
      <h3 style="font-weight:600;margin-bottom:0.5rem;">
        ${state.tipoMaterial === 'programa' ? '🗂️ Estrutura de conteúdo programático' :
          state.tipoMaterial === 'hibrido' ? '📘 Estrutura híbrida detectada' :
          '📖 Estrutura narrativa'}
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
// 📘 Construção e renderização do plano reorganizado + resumo cognitivo
// ==========================================================
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
        densidade: grupo.length > 5 ? "📙 densa" : grupo.length > 2 ? "📘 média" : "📗 leve",
        conceitos: extrairPalavrasChave(descricao).slice(0,4)
      });
    }
  } else {
    const blocos = texto.split(/(?<=[.!?])\s+/);
    const blocosPorDia = Math.ceil(blocos.length / dias);
    for (let i = 0; i < dias; i++) {
      const grupo = blocos.slice(i * blocosPorDia, (i + 1) * blocosPorDia);
      if (!grupo.length) break;
      plano.push({
        dia: i + 1,
        titulo: `Sessão ${i + 1}`,
        topico: `Leitura guiada ${i + 1}`,
        descricao: grupo.join(" "),
        resumo: gerarResumoSintetico(grupo),
        densidade: grupo.length > 10 ? "📙 densa" : grupo.length > 5 ? "📘 média" : "📗 leve",
        conceitos: extrairPalavrasChave(grupo.join(" ")).slice(0,4)
      });
    }
  }
  return plano;
}

// ==========================================================
// ⚙️ Geração e renderização com gráfico + ícone flutuante ⚖️
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
  if (!state.tema && !state.materialTexto) return alert("Defina um tema ou envie um material.");

  const tipo = state.tipoMaterial || detectarTipoMaterial(state.materialTexto || "");
  state.plano = construirPlanoInteligente(state.materialTexto, tipo, state.dias, state.tema || "Tema");

  setStatus(tipo === "programa"
    ? "🗂️ Programa reorganizado semanticamente."
    : tipo === "hibrido"
    ? "📘 Material híbrido detectado."
    : "📖 Texto narrativo identificado.");

  updateCtx();
  renderPlano();
});

// ==========================================================
// 📊 Renderização do plano + painel recolhível de densidade + ícone flutuante ⚖️
// ==========================================================
function renderPlano() {
  els.plano.innerHTML = '';
  if (!state.plano.length) {
    els.plano.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano de estudo gerado.</p>`;
    return;
  }

  // Sessões
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

  // --- Painel de resumo cognitivo ---
  const graficoWrapper = document.createElement('div');
  graficoWrapper.id = 'grafico-densidade-wrapper';
  graficoWrapper.style.marginTop = '1.5rem';
  graficoWrapper.style.background = 'var(--card)';
  graficoWrapper.style.borderRadius = '1rem';
  graficoWrapper.style.boxShadow = 'var(--shadow)';
  graficoWrapper.style.overflow = 'hidden';
 ...continuação do arquivo `core.js`:  

```js
  graficoWrapper.style.transition = 'max-height 0.4s ease';
  graficoWrapper.style.maxHeight = '3rem';
  graficoWrapper.style.position = 'relative';

  const header = document.createElement('div');
  header.style.padding = '1rem';
  header.style.cursor = 'pointer';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.innerHTML = `
    <h4 style="margin:0;">⚖️ Resumo Cognitivo</h4>
    <span id="toggle-arrow" style="transition:transform 0.3s;">▼</span>
  `;

  const content = document.createElement('div');
  content.id = 'grafico-densidade';
  content.style.padding = '0 1rem 1rem';
  content.style.display = 'none';
  content.style.borderTop = '1px solid var(--stroke)';

  // --- Dados de densidade ---
  const contagens = { leve: 0, media: 0, densa: 0 };
  state.plano.forEach(s => {
    if (s.densidade.includes('📗')) contagens.leve++;
    else if (s.densidade.includes('📘')) contagens.media++;
    else if (s.densidade.includes('📙')) contagens.densa++;
  });

  const total = state.plano.length || 1;
  const pctLeve = (contagens.leve / total) * 100;
  const pctMedia = (contagens.media / total) * 100;
  const pctDensa = (contagens.densa / total) * 100;

  content.innerHTML = `
    <div style="display:flex;height:20px;border-radius:10px;overflow:hidden;margin-top:1rem;margin-bottom:0.8rem;">
      <div style="background:#48bb78;width:${pctLeve}%;"></div>
      <div style="background:#4299e1;width:${pctMedia}%;"></div>
      <div style="background:#c44b04;width:${pctDensa}%;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--muted);padding:0 0.2rem;">
      <span>📗 Leve (${contagens.leve})</span>
      <span>📘 Média (${contagens.media})</span>
      <span>📙 Densa (${contagens.densa})</span>
    </div>
  `;

  // --- Evento de expansão ---
  header.addEventListener('click', () => {
    const open = content.style.display === 'block';
    content.style.display = open ? 'none' : 'block';
    graficoWrapper.style.maxHeight = open ? '3rem' : '12rem';
    document.getElementById('toggle-arrow').style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
  });

  graficoWrapper.appendChild(header);
  graficoWrapper.appendChild(content);
  els.plano.appendChild(graficoWrapper);

  // Cria o ícone flutuante
  criarIconeFlutuanteResumo();
}

// ==========================================================
// ⚖️ Ícone flutuante para abrir/fechar o resumo cognitivo
// ==========================================================
function criarIconeFlutuanteResumo() {
  document.getElementById('icone-resumo')?.remove();

  const icone = document.createElement('div');
  icone.id = 'icone-resumo';
  icone.innerHTML = '⚖️';
  icone.title = 'Ver resumo cognitivo';
  icone.style.position = 'fixed';
  icone.style.bottom = '24px';
  icone.style.right = '24px';
  icone.style.background = 'var(--brand)';
  icone.style.color = '#fff';
  icone.style.fontSize = '1.4rem';
  icone.style.borderRadius = '50%';
  icone.style.width = '52px';
  icone.style.height = '52px';
  icone.style.display = 'flex';
  icone.style.alignItems = 'center';
  icone.style.justifyContent = 'center';
  icone.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
  icone.style.cursor = 'pointer';
  icone.style.transition = 'transform 0.2s ease, box-shadow 0.3s ease';
  icone.style.zIndex = '2000';

  icone.addEventListener('mouseenter', () => {
    icone.style.transform = 'scale(1.08)';
    icone.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)';
  });
  icone.addEventListener('mouseleave', () => {
    icone.style.transform = 'scale(1)';
    icone.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
  });

  icone.addEventListener('click', () => {
    const wrapper = document.getElementById('grafico-densidade-wrapper');
    if (!wrapper) return;
    const content = wrapper.querySelector('#grafico-densidade');
    const arrow = wrapper.querySelector('#toggle-arrow');
    const isOpen = content && content.style.display === 'block';

    if (isOpen) {
      content.style.display = 'none';
      wrapper.style.maxHeight = '3rem';
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
      content.style.display = 'block';
      wrapper.style.maxHeight = '12rem';
      if (arrow) arrow.style.transform = 'rotate(180deg)';
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  document.body.appendChild(icone);
}
