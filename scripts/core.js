/* ==========================================================
   Liora — core.js (versão final)
   Modo Tema / Modo Upload — sem temas.js
   ========================================================== */

console.log("🟢 core.js carregado");

// ======================================================================
// ESTADO GLOBAL
// ======================================================================
const state = {
  tema: "",
  nivel: "iniciante",
  dias: 5,
  materialTexto: "",
  tipoMaterial: "",
  plano: []
};

// ======================================================================
// TEMA ESCURO / CLARO
// ======================================================================
const themeBtn = document.getElementById("btn-theme");
const html = document.documentElement;

function setTheme(mode) {
  html.classList.remove("light", "dark");
  html.classList.add(mode);
  localStorage.setItem("liora_theme", mode);
  themeBtn.textContent = mode === "light" ? "☀️" : "🌙";
}

function toggleTheme() {
  const atual = localStorage.getItem("liora_theme") || "dark";
  setTheme(atual === "light" ? "dark" : "light");
}

themeBtn.addEventListener("click", toggleTheme);
setTheme(localStorage.getItem("liora_theme") || "dark");

// ======================================================================
// UTILIDADES PARA LEITURA DO INDEX
// ======================================================================
function getTema() {
  return (document.getElementById("inp-tema")?.value || "").trim();
}
function getNivel() {
  return document.getElementById("sel-nivel")?.value || "iniciante";
}
function getDiasTema() {
  return parseInt(document.getElementById("sel-dias")?.value || "5", 10);
}
function getDiasUpload() {
  return parseInt(document.getElementById("sel-dias-upload")?.value || "5", 10);
}

// ======================================================================
// NORMALIZAÇÃO DE TEXTO + CLASSIFICAÇÃO MATERIAL
// ======================================================================
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

function medirSinais(textoNormalizado) {
  const linhas = textoNormalizado.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const total = linhas.length || 1;

  const bullets = linhas.filter(l => /^[\d•\-–]/.test(l)).length;
  const longas = linhas.filter(l => l.split(" ").length >= 12).length;
  const caps = linhas.filter(l => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ]{6,}$/.test(l)).length;

  return {
    pBullets: bullets / total,
    pLongas: longas / total,
    pCaps: caps / total,
    total
  };
}

function detectarTipoMaterial(texto) {
  if (!texto || texto.trim().length < 80) return "conteudo";
  const s = medirSinais(normalizarTextoParaPrograma(texto));
  if (s.pBullets >= 0.25) return "programa";
  if (s.pLongas >= 0.55) return "conteudo";
  return "hibrido";
}

// ======================================================================
// FUNÇÃO — Construção do plano (upload)
// ======================================================================
function construirPlanoInteligente(texto, tipo, dias) {
  const linhas = normalizarTextoParaPrograma(texto).split(/\n+/).filter(Boolean);
  const plano = [];

  const blocos = tipo === "programa"
    ? Math.ceil(linhas.length / dias)
    : Math.ceil(texto.length / dias);

  for (let i = 0; i < dias; i++) {
    let bloco;

    if (tipo === "programa") {
      bloco = linhas.slice(i * blocos, (i + 1) * blocos);
    } else {
      const start = i * blocos;
      bloco = [texto.slice(start, start + blocos)];
    }

    plano.push({
      dia: i + 1,
      titulo: `Sessão ${i + 1}`,
      descricao: bloco.join("\n")
    });
  }

  return plano;
}

// ======================================================================
// UPLOAD DE ARQUIVO (PDF/TXT)
// ======================================================================
async function extractTextPDF(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let full = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    full += content.items.map(i => i.str).join(" ") + "\n";
  }

  return full.trim();
}

document.getElementById("inp-file")?.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();
  let text = "";

  if (ext === "txt") text = await file.text();
  else if (ext === "pdf") text = await extractTextPDF(await file.arrayBuffer());
  else return alert("Formato não suportado");

  document.getElementById("file-name").textContent = "✅ " + file.name;

  state.materialTexto = text;
  state.tipoMaterial = detectarTipoMaterial(text);
});

// ======================================================================
// BOTÃO GERAR PLANO — MODO TEMA (usa plano-simulador.js)
// ======================================================================
document.getElementById("btn-gerar")?.addEventListener("click", () => {
  const tema = getTema();
  const nivel = getNivel();
  const dias = getDiasTema();

  if (!tema) return alert("Digite um tema antes de gerar o plano.");

  if (typeof window.gerarPlanoPorTema !== "function") {
    console.error("❌ plano-simulador.js não carregado");
    alert("Módulo de plano por tema não carregado.");
    return;
  }

  const plano = window.gerarPlanoPorTema({ tema, nivel, dias });

  state.tema = tema;
  state.plano = plano;

  renderPlano();
  document.getElementById("status").textContent = "✅ Plano gerado por tema!";
});

// ======================================================================
// BOTÃO GERAR PLANO — MODO UPLOAD (usa algoritmo antigo)
// ======================================================================
document.getElementById("btn-gerar-upload")?.addEventListener("click", () => {
  if (!state.materialTexto) return alert("Envie um material primeiro");

  const dias = getDiasUpload();
  const tipo = state.tipoMaterial || "conteudo";
  state.plano = construirPlanoInteligente(state.materialTexto, tipo, dias);

  renderPlano();
  document.getElementById("status-upload").textContent = "✅ Plano gerado via material!";
});

// ======================================================================
// RENDERIZAÇÃO DO PLANO
// ======================================================================
function renderPlano() {
  const container = document.getElementById("plano");
  container.innerHTML = "";

  if (!state.plano.length) {
    container.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano de estudo gerado.</p>`;
    return;
  }

  state.plano.forEach(sessao => {
    const div = document.createElement("div");
    div.className = "session-card";
    div.innerHTML = `
      <h3>${sessao.titulo}</h3>
      <pre>${sessao.descricao.replace(/</g, "&lt;")}</pre>
    `;
    container.appendChild(div);
  });

  document.getElementById("ctx").textContent = `${state.plano.length} sessões geradas`;
}
