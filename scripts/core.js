// ==========================================================
// 🧠 Liora — core.js (Tema x Upload) + fixes
// ==========================================================

console.log("🟣 core.js carregado");

// -----------------------------
// Estado global
// -----------------------------
const state = {
  tema: "",
  nivel: "",
  dias: 5,
  materialTexto: "",
  tipoMaterial: "",
  plano: []
};

// -----------------------------
// Seletores (devem existir no index)
// -----------------------------
const els = {
  // Tema x Upload
  modoTemaBtn: document.getElementById("modo-tema"),
  modoUploadBtn: document.getElementById("modo-upload"),
  painelTema: document.getElementById("painel-tema"),
  painelUpload: document.getElementById("painel-upload"),

  // Campos Tema
  inpTema: document.getElementById("inp-tema"),
  selNivel: document.getElementById("sel-nivel"),
  selDias: document.getElementById("sel-dias"),

  // Campos Upload
  uploadZone: document.getElementById("upload-zone"),
  inpFile: document.getElementById("inp-file"),
  fileName: document.getElementById("file-name"),
  fileType: document.getElementById("file-type"),
  uploadSpinner: document.getElementById("upload-spinner"),
  selDiasUpload: document.getElementById("sel-dias-upload"),

  // Ações
  btnGerarTema: document.getElementById("btn-gerar"),
  btnGerarUpload: document.getElementById("btn-gerar-upload"),

  // UI
  plano: document.getElementById("plano"),
  status: document.getElementById("status"),
  statusUpload: document.getElementById("status-upload"),
  ctx: document.getElementById("ctx"),
  themeBtn: document.getElementById("btn-theme"),
};

// ==========================================================
// 🌗 Tema claro/escuro (robusto)
// ==========================================================
(function initTheme() {
  const html = document.documentElement;
  const body = document.body;
  const key = "liora_theme";

  function apply(mode) {
    const isLight = mode === "light";
    html.classList.toggle("light", isLight);
    html.classList.toggle("dark", !isLight);
    body.classList.toggle("light", isLight);
    body.classList.toggle("dark", !isLight);
    localStorage.setItem(key, mode);
    if (els.themeBtn) els.themeBtn.textContent = isLight ? "☀️" : "🌙";
  }

  const saved = localStorage.getItem(key) || "dark";
  apply(saved);

  els.themeBtn?.addEventListener("click", () => {
    const cur = localStorage.getItem(key) || "dark";
    apply(cur === "light" ? "dark" : "light");
  });

  // Touch (iOS)
  els.themeBtn?.addEventListener("touchend", (e) => {
    e.preventDefault();
    const cur = localStorage.getItem(key) || "dark";
    apply(cur === "light" ? "dark" : "light");
  }, { passive: false });
})();

// ==========================================================
// 🧼 Cleanup de FAB/tema antigo (caso tenha sobrado no DOM)
// ==========================================================
(function cleanupOldFab() {
  const idsPossiveis = ["temas-fab", "fab-tema", "btn-temas", "fab-choose-theme"];
  idsPossiveis.forEach(id => document.getElementById(id)?.remove());
})();

// ==========================================================
// 🔀 Alternância entre Modo Tema x Upload
// ==========================================================
els.modoTemaBtn?.addEventListener("click", () => {
  els.painelTema?.classList.remove("hidden");
  els.painelUpload?.classList.add("hidden");
  statusUI("Modo Tema & Nível selecionado.");
});
els.modoUploadBtn?.addEventListener("click", () => {
  els.painelUpload?.classList.remove("hidden");
  els.painelTema?.classList.add("hidden");
  statusUI("Modo Upload selecionado.");
});

function statusUI(msg) {
  if (els.status) els.status.textContent = msg;
  if (els.statusUpload) els.statusUpload.textContent = msg;
}

// ==========================================================
// 🧩 Normalização e detecção (mesmo que antes)
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
// 🧠 “AnalisarSemantica” leve (para título/resumo/conceitos)
// ==========================================================
function analisarSemantica(texto) {
  const palavras = texto.split(/\s+/).filter(w => w.length > 3);
  const freq = {};
  for (const w of palavras) {
    const key = w.toLowerCase().replace(/[.,;:!?()"]/g, "");
    if (!key.match(/^(para|com|como|onde|quando|entre|pois|este|esta|isso|aquele|aquela|são|estão|pode|ser|mais|menos|muito|cada|outro|porque|seja|todo|toda|essa|aquele|essa|essa)$/))
      freq[key] = (freq[key] || 0) + 1;
  }
  const chaves = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,10).map(e => e[0]);
  const resumo = texto.split(/[.!?]/).filter(s => s.trim().length > 40).slice(0,2).join('. ') + '.';
  const titulo = chaves[0] ? chaves[0][0].toUpperCase() + chaves[0].slice(1) : "Conteúdo";

  const mediaPalavras = palavras.length / (texto.split(/[.!?]/).length || 1);
  let densidade = "📗 leve";
  if (mediaPalavras > 18 && chaves.length > 7) densidade = "📙 densa";
  else if (mediaPalavras > 12) densidade = "📘 média";

  return { titulo, resumo, conceitos: chaves, densidade };
}

// ==========================================================
// 📄 Upload (drag&drop + change) — igual versão estável
// ==========================================================
["dragenter","dragover","dragleave","drop"].forEach(evt =>
  document.addEventListener(evt, e => e.preventDefault(), true)
);

els.uploadZone?.addEventListener("dragover", () => els.uploadZone.classList.add("dragover"));
els.uploadZone?.addEventListener("dragleave", () => els.uploadZone.classList.remove("dragover"));
els.uploadZone?.addEventListener("drop", async (e) => {
  els.uploadZone.classList.remove("dragover");
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    await handleFile(file);
  }
});
els.inpFile?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (file) {
    await handleFile(file);
  }
});

async function handleFile(file) {
  try {
    if (els.uploadSpinner) els.uploadSpinner.style.display = "block";
    if (els.fileName) els.fileName.textContent = `Carregando ${file.name}...`;
    if (els.fileType) els.fileType.textContent = "";

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    let text = "";

    if (ext === "txt") {
      text = await file.text();
    } else if (ext === "pdf") {
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      text = await extractTextPDFSmart(pdf);
    } else {
      alert("Formato não suportado. Use .txt ou .pdf");
      return;
    }

    state.materialTexto = text;
    state.tipoMaterial = detectarTipoMaterial(text);

    if (els.fileName) els.fileName.textContent = `✅ ${file.name} carregado`;
    if (els.fileType) {
      els.fileType.textContent =
        state.tipoMaterial === "programa"
          ? "🗂️ Programa de conteúdo detectado."
          : state.tipoMaterial === "hibrido"
          ? "📘 Conteúdo híbrido detectado."
          : "📖 Conteúdo narrativo detectado.";
    }

  } catch (err) {
    console.error(err);
    if (els.fileName) els.fileName.textContent = "⚠️ Erro ao processar o arquivo.";
  } finally {
    if (els.uploadSpinner) els.uploadSpinner.style.display = "none";
  }
}

async function extractTextPDFSmart(pdf) {
  let full = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items.map(it => ({
      x: it.transform[4],
      y: Math.round(it.transform[5]),
      str: it.str
    })).sort((a,b) => b.y - a.y || a.x - b.x);

    const rows = [];
    let currentY = null, currentLine = [];
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
// 🧰 Construção do plano (Tema x Upload)
// ==========================================================
function dividirEmBlocos(texto, maxTamanho = 800) {
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

function construirPlanoInteligente(texto, tipo, dias) {
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
    const porDia = Math.ceil(blocos.length / dias);
    for (let i = 0; i < dias; i++) {
      const grupo = blocos.slice(i * porDia, (i + 1) * porDia);
      if (!grupo.length) break;
      plano.push(gerarSessao(grupo, i));
    }
  }
  return plano;
}

// ==========================================================
// 🤖 MODO TEMA — usa gerarPlanoPorTema do plano-simulador.js
// ==========================================================
els.btnGerarTema?.addEventListener("click", async () => {
  const tema = els.inpTema?.value.trim();
  const nivel = els.selNivel?.value || "iniciante";
  const dias = parseInt(els.selDias?.value || "5", 10);

  if (!tema) return alert("Digite um tema.");

  try {
    els.status.textContent = "⏳ Gerando plano (tema)...";
    if (typeof gerarPlanoPorTema !== "function") {
      console.error("gerarPlanoPorTema não encontrado. Confira plano-simulador.js.");
      alert("Módulo de plano por tema não carregado.");
      return;
    }
    state.plano = await gerarPlanoPorTema(tema, nivel, dias);
    renderPlano();
    els.status.textContent = "✅ Plano gerado!";
  } catch (e) {
    console.error(e);
    els.status.textContent = "⚠️ Erro ao gerar plano por tema.";
  }
});

// ==========================================================
// 📄 MODO UPLOAD — usa análise local
// ==========================================================
els.btnGerarUpload?.addEventListener("click", async () => {
  if (!state.materialTexto) return alert("Envie um arquivo primeiro.");
  const dias = parseInt(els.selDiasUpload?.value || "5", 10);
  try {
    els.statusUpload.textContent = "⏳ Analisando material...";
    state.plano = construirPlanoInteligente(state.materialTexto, state.tipoMaterial, dias);
    renderPlano();
    els.statusUpload.textContent = "✅ Plano gerado a partir do material!";
  } catch (e) {
    console.error(e);
    els.statusUpload.textContent = "⚠️ Erro ao gerar plano a partir do material.";
  }
});

// ==========================================================
// 🖼️ Renderização do plano
// ==========================================================
function renderPlano() {
  if (!els.plano) return;
  els.plano.innerHTML = "";

  if (!state.plano.length) {
    els.plano.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano de estudo gerado.</p>`;
    return;
  }

  state.plano.forEach(sessao => {
    const div = document.createElement("div");
    div.className = "session-card";
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <h3>${sessao.titulo}</h3>
        <span class="text-xs opacity-70">${sessao.densidade || ""}</span>
      </div>
      <p style="font-style:italic;font-size:0.85rem;color:var(--muted);margin-bottom:0.4rem;">
        ${sessao.resumo || ""}
      </p>
      <p>${(sessao.descricao || "").replace(/</g,'&lt;')}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        ${(sessao.conceitos || []).map(c => `<span class="chip">${c}</span>`).join('')}
      </div>
    `;
    els.plano.appendChild(div);
  });

  if (els.ctx) els.ctx.textContent = `${state.plano.length} sessões geradas`;
}
