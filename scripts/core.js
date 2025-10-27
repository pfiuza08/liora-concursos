// ==========================================================
// 🧠 Liora — Núcleo principal (core.js) — versão com análise hierárquica
// ==========================================================

const state = {
  tema: "",
  dias: 5,
  materialTexto: "",
  tipoMaterial: "",
  plano: [],
};

// ==========================================================
// 🌓 Tema claro/escuro — estável (desktop + mobile)
// ==========================================================
const themeBtn = document.getElementById("btn-theme");
const body = document.body;
const html = document.documentElement;

if (!localStorage.getItem("liora_theme")) {
  localStorage.setItem("liora_theme", "dark");
}

function setTheme(mode) {
  const isLight = mode === "light";
  html.classList.toggle("light", isLight);
  html.classList.toggle("dark", !isLight);
  body.classList.toggle("light", isLight);
  body.classList.toggle("dark", !isLight);
  localStorage.setItem("liora_theme", isLight ? "light" : "dark");
  themeBtn.textContent = isLight ? "☀️" : "🌙";
}

function toggleTheme() {
  const current = localStorage.getItem("liora_theme") || "dark";
  setTheme(current === "light" ? "dark" : "light");
}

themeBtn.addEventListener("click", toggleTheme);
themeBtn.addEventListener(
  "touchend",
  (e) => {
    e.preventDefault();
    toggleTheme();
  },
  { passive: false }
);

setTheme(localStorage.getItem("liora_theme") || "dark");

// ==========================================================
// 🧩 Normalização e extração de estrutura hierárquica
// ==========================================================
function normalizarTextoParaPrograma(texto) {
  return texto
    .replace(/\r/g, "")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(
      /(\s|^)((\d+(\.\d+){0,3}[\.\)])|([IVXLCDM]+\.)|([A-Z]\))|([a-z]\))|[•\-–])\s+/g,
      "\n$2 "
    )
    .replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "$1\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function extrairHierarquia(linhas) {
  const estrutura = [];
  let atual = null;

  for (const l of linhas) {
    const matchNum = l.match(/^(\d+(\.\d+){0,3})[\.\)]/);
    const matchLetra = l.match(/^([A-Z]\))/);
    const nivel = matchNum
      ? matchNum[1].split(".").length
      : matchLetra
      ? 1
      : /^[•\-–]/.test(l)
      ? 2
      : 3;

    if (nivel === 1) {
      atual = { titulo: l, subtopicos: [] };
      estrutura.push(atual);
    } else if (atual) {
      atual.subtopicos.push(l);
    }
  }

  return estrutura;
}

// ==========================================================
// 📄 PDF — extração com preservação de linhas
// ==========================================================
async function extractTextPDFSmart(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let full = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items.map((it) => ({
      x: it.transform[4],
      y: Math.round(it.transform[5]),
      str: it.str,
    }));

    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const tolY = 2;
    const rows = [];
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

    const lines = rows
      .map((line) =>
        line
          .sort((a, b) => a.x - b.x)
          .map((seg) => seg.str)
          .join(" ")
          .trim()
      )
      .filter(Boolean);

    full += lines.join("\n") + "\n";
  }

  return full.replace(/\n{3,}/g, "\n\n").trim();
}

// ==========================================================
// 🧪 Detecção de tipo de material
// ==========================================================
function linhasParaSinais(texto) {
  let linhas = texto.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (linhas.length < 30) {
    const pseudo = texto.split(/(?<=[.!?])\s+/).map((l) => l.trim());
    if (pseudo.length > linhas.length) linhas = pseudo;
  }
  return linhas;
}

function medirSinais(textoNormalizado) {
  const linhas = linhasParaSinais(textoNormalizado);
  const total = linhas.length || 1;

  const marcadoresRegex =
    /^((\d+(\.\d+){0,3}[\.\)])|([IVXLCDM]+\.)|([A-Z]\))|([a-z]\))|[•\-–])/;
  const verboRegex =
    /\b(é|são|está|representa|consiste|define|explica|indica|utiliza|caracteriza|permite|demonstra|apresenta|analisa)\b/i;
  const fimParagrafoRegex = /[.!?]\s*$/;

  let bullets = 0,
    longas = 0,
    verbais = 0,
    fimPar = 0,
    capsLike = 0,
    run = 0,
    maxRun = 0;

  for (const l of linhas) {
    const palavras = l.split(/\s+/);
    const isBullet = marcadoresRegex.test(l);
    const isLonga = palavras.length >= 12;
    const isVerbal = verboRegex.test(l);
    const isParagrafo = fimParagrafoRegex.test(l);
    const isCaps = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ]{6,}$/.test(l);

    if (isBullet) bullets++;
    if (isLonga) longas++;
    if (isVerbal) verbais++;
    if (isParagrafo) fimPar++;
    if (isCaps) capsLike++;

    run = isBullet ? run + 1 : 0;
    if (run > maxRun) maxRun = run;
  }

  return {
    total,
    pBullets: bullets / total,
    pLongas: longas / total,
    pVerbais: verbais / total,
    pFimPar: fimPar / total,
    pCaps: capsLike / total,
    maxRun,
  };
}

function decidirTipo(s) {
  if (s.pBullets >= 0.25 && (s.maxRun >= 2 || s.pCaps >= 0.1))
    return { tipo: "programa" };
  if (s.pLongas >= 0.55 && s.pFimPar >= 0.45 && s.pBullets < 0.25)
    return { tipo: "conteudo" };
  if (s.pCaps >= 0.1 && s.pBullets >= 0.15 && s.pLongas >= 0.4)
    return { tipo: "hibrido" };
  return { tipo: "hibrido" };
}

function detectarTipoMaterial(texto) {
  if (!texto || texto.trim().length < 80) return "conteudo";
  const normalizado = normalizarTextoParaPrograma(texto);
  const sinais = medirSinais(normalizado);
  const { tipo } = decidirTipo(sinais);
  return tipo;
}

// ==========================================================
// 📁 Upload e análise
// ==========================================================
const inputFile = document.getElementById("inp-file");
const fileName = document.getElementById("file-name");
const fileType = document.getElementById("file-type");

inputFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFileSelection(file);
});

async function handleFileSelection(file) {
  fileName.textContent = `Carregando ${file.name}...`;
  fileType.textContent = "";

  document.querySelectorAll("#diagnostico-sinais, #painel-estrutura").forEach(
    (e) => e.remove()
  );

  try {
    const ext = file.name.split(".").pop().toLowerCase();
    let text = "";

    if (ext === "txt") text = await file.text();
    else if (ext === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      text = await extractTextPDFSmart(arrayBuffer);
    } else {
      alert("Formato não suportado. Use .txt ou .pdf");
      return;
    }

    state.materialTexto = text;
    state.tipoMaterial = detectarTipoMaterial(text);

    // Diagnóstico
    const dbg = medirSinais(normalizarTextoParaPrograma(text));
    const diag = `
🔎 Diagnóstico:
• Linhas detectadas: ${dbg.total}
• Marcadores: ${(dbg.pBullets * 100).toFixed(1)}%
• Parágrafos: ${(dbg.pFimPar * 100).toFixed(1)}%
• Sequência máxima: ${dbg.maxRun}
    `.trim();

    const hint = document.createElement("pre");
    hint.id = "diagnostico-sinais";
    hint.textContent = diag;
    hint.style.fontSize = "11px";
    hint.style.whiteSpace = "pre-wrap";
    hint.style.color = "var(--muted)";
    fileType.insertAdjacentElement("afterend", hint);

    // Estrutura detectada (modo explicativo)
    const linhas = normalizarTextoParaPrograma(text)
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const estrutura = extrairHierarquia(linhas);
    const totalTop = estrutura.length;
    const totalSub = estrutura.reduce((acc, e) => acc + e.subtopicos.length, 0);
    console.log(
      `📊 ${linhas.length} linhas detectadas · ${totalTop} tópicos principais · ${totalSub} subtópicos`
    );

    const sugestao = Math.min(30, Math.max(5, Math.round(totalTop / 1.5)));
    const painel = document.createElement("div");
    painel.id = "painel-estrutura";
    painel.className =
      "mt-2 p-3 border border-[var(--stroke)] rounded-lg text-xs text-[var(--muted)]";
    painel.innerHTML = `<strong>📋 Estrutura detectada:</strong><br>
Tópicos principais: ${totalTop} · Subtópicos: ${totalSub}<br>
Sessões sugeridas: <strong>${sugestao}</strong><br><br>
<em>Prévia dos 10 primeiros:</em><br>
${estrutura
  .slice(0, 10)
  .map(
    (e, i) =>
      `<span style='color:var(--brand)'>${i + 1}.</span> ${e.titulo.replace(
        /</g,
        "&lt;"
      )}`
  )
  .join("<br>")}
`;
    hint.insertAdjacentElement("afterend", painel);

    console.log(`🗂️ ${sugestao} sessões sugeridas`);
  } catch (err) {
    console.error(err);
    fileName.textContent = "⚠️ Erro ao processar o arquivo.";
  }
}
