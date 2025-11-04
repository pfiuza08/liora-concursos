// ==========================================================
// 🧠 Liora — core.js (versão integrada Tema + Upload)
// ==========================================================

console.log("🟣 core.js carregado");

// Estado global compartilhado
const state = {
  tema: "",
  nivel: "",
  dias: 5,
  materialTexto: "",
  tipoMaterial: "",
  plano: []
};

// Seletores
const els = {
  inpTema: document.getElementById("inp-tema"),
  selNivel: document.getElementById("sel-nivel"),
  selDias: document.getElementById("sel-dias"),
  selDiasUpload: document.getElementById("sel-dias-upload"),
  plano: document.getElementById("plano"),
  status: document.getElementById("status"),
  statusUpload: document.getElementById("status-upload"),
  ctx: document.getElementById("ctx"),
  inpFile: document.getElementById("inp-file"),
};

// =====================================
// 🌙 Tema claro/escuro
// =====================================
const themeBtn = document.getElementById("btn-theme");
const html = document.documentElement;
const body = document.body;

function setTheme(mode) {
  html.classList.toggle("light", mode === "light");
  html.classList.toggle("dark", mode === "dark");
  localStorage.setItem("liora_theme", mode);
  themeBtn.textContent = mode === "light" ? "🌙" : "☀️";
}

themeBtn.addEventListener("click", () => {
  const atual = localStorage.getItem("liora_theme") || "dark";
  setTheme(atual === "dark" ? "light" : "dark");
});

setTheme(localStorage.getItem("liora_theme") || "dark");

// =====================================
// 📌 Alterna entre Modo Tema x Upload
// =====================================
document.getElementById("modo-tema").addEventListener("click", () => {
  document.getElementById("painel-tema").classList.remove("hidden");
  document.getElementById("painel-upload").classList.add("hidden");
});

document.getElementById("modo-upload").addEventListener("click", () => {
  document.getElementById("painel-upload").classList.remove("hidden");
  document.getElementById("painel-tema").classList.add("hidden");
});

// =====================================
// 📄 Upload de arquivo (PDF/TXT)
// =====================================
els.inpFile?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  let text = "";
  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "txt") text = await file.text();
  if (ext === "pdf") text = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
    .then(pdf => extractSmartPDF(pdf));

  state.materialTexto = text;
  state.tipoMaterial = detectarTipoMaterial(text);

  els.statusUpload.textContent = `✅ Arquivo carregado (${state.tipoMaterial})`;
});

// =====================================
// 🤖 Extrator PDF com estrutura preservada
// =====================================
async function extractSmartPDF(pdf) {
  let full = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    full += (await page.getTextContent()).items.map(i => i.str).join(" ") + "\n";
  }
  return full;
}

// =====================================
// 🟦 NORMALIZAÇÃO E CLASSIFICAÇÃO
// (vem do semantic.js — fica disponível em window.semantic)
// =====================================
function safeSemantic() {
  if (!window.semantic) {
    console.error("❌ semantic.js não carregado");
    return false;
  }
  return true;
}

// =====================================
// ✅ MODO 1: GERAR PLANO POR TEMA (SEM ARQUIVO)
// =====================================
document.getElementById("btn-gerar").addEventListener("click", async () => {
  if (!els.inpTema.value.trim()) return alert("Digite um tema.");
  if (!safeSemantic()) return;

  state.tema = els.inpTema.value.trim();
  state.nivel = els.selNivel.value;
  state.dias = parseInt(els.selDias.value, 10);

  els.status.textContent = "⏳ Gerando plano pelo tema...";

  state.plano = await gerarPlanoPorTema(state.tema, state.nivel, state.dias); // vem do plano-simulador.js

  renderPlano();
  els.status.textContent = "✅ Plano gerado!";
});

// =====================================
// ✅ MODO 2: GERAR PLANO POR UPLOAD
// =====================================
document.getElementById("btn-gerar-upload").addEventListener("click", async () => {
  if (!state.materialTexto) return alert("Envie um arquivo primeiro.");
  if (!safeSemantic()) return;

  state.dias = parseInt(els.selDiasUpload.value, 10);

  els.statusUpload.textContent = "⏳ Analisando conteúdo...";

  state.plano = construirPlanoInteligente(
    state.materialTexto,
    state.tipoMaterial,
    state.dias
  );

  renderPlano();
  els.statusUpload.textContent = "✅ Plano gerado a partir do material!";
});

// =====================================
// 🟩 Renderização do plano
// =====================================
function renderPlano() {
  els.plano.innerHTML = "";

  state.plano.forEach(sessao => {
    const div = document.createElement("div");
    div.className = "session-card";
    div.innerHTML = `
      <div class="flex justify-between mb-1">
        <h3>${sessao.titulo}</h3>
        <span class="text-xs opacity-70">${sessao.densidade}</span>
      </div>
      <p class="text-xs italic mb-2">${sessao.resumo}</p>
      <p>${sessao.descricao.replace(/</g, "&lt;")}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        ${sessao.conceitos.map(c => `<span class="chip">${c}</span>`).join("")}
      </div>
    `;
    els.plano.appendChild(div);
  });

  els.ctx.textContent = `${state.plano.length} sessões geradas`;
}
