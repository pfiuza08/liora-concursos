/* ================================================================
   LIORA — CORE.JS (versão com listeners corretos)
   ================================================================ */

console.log("🟢 core.js carregado");

// Estado global
const state = {
  modo: "tema", // "tema" ou "upload"
  materialTexto: "",
  tipoMaterial: "",
  plano: [],
  tema: "",
  nivel: "",
  dias: 5,
};

/* ================================================================
   🌓 Tema claro / escuro
   ================================================================ */
const themeBtn = document.getElementById("btn-theme");
const html = document.documentElement;
const body = document.body;

if (!localStorage.getItem("liora_theme")) {
  localStorage.setItem("liora_theme", "dark");
}

function setTheme(mode) {
  const isLight = mode === "light";
  html.classList.toggle("light", isLight);
  html.classList.toggle("dark", !isLight);
  body.classList.toggle("light", isLight);
  body.classList.toggle("dark", !isLight);
  themeBtn.textContent = isLight ? "☀️" : "🌙";
  localStorage.setItem("liora_theme", mode);
}

themeBtn.addEventListener("click", () => {
  const current = localStorage.getItem("liora_theme");
  setTheme(current === "light" ? "dark" : "light");
});

setTheme(localStorage.getItem("liora_theme"));

/* ================================================================
   🔀 Alternância entre modo Tema vs Upload
   ================================================================ */

const painelTema = document.getElementById("painel-tema");
const painelUpload = document.getElementById("painel-upload");

document.getElementById("modo-tema").addEventListener("click", () => {
  state.modo = "tema";
  painelTema.classList.remove("hidden");
  painelUpload.classList.add("hidden");
});

document.getElementById("modo-upload").addEventListener("click", () => {
  state.modo = "upload";
  painelUpload.classList.remove("hidden");
  painelTema.classList.add("hidden");
});

/* ================================================================
   📁 Upload — captura de arquivo
   ================================================================ */
async function extractTextPDFSmart(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let texto = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map(i => i.str).join(" ");
    texto += pageText + "\n\n";
  }

  return texto.trim();
}

document.getElementById("inp-file").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("file-name").textContent = `Carregando ${file.name} ...`;

  try {
    let text = "";

    if (file.type.includes("text")) text = await file.text();
    else if (file.type.includes("pdf")) text = await extractTextPDFSmart(await file.arrayBuffer());
    else return alert("Formato não suportado. Envie TXT ou PDF.");

    state.materialTexto = text;
    document.getElementById("file-name").textContent = `✅ ${file.name}`;
    document.getElementById("file-type").textContent = "Arquivo carregado com sucesso.";

  } catch (err) {
    document.getElementById("file-name").textContent = "⚠️ Erro ao processar arquivo.";
    console.error(err);
  }
});

/* ================================================================
   🧠 Listener — Gerar plano por TEMA + NÍVEL
   ================================================================ */
document.getElementById("btn-gerar").addEventListener("click", async () => {
  console.log("▶️ Botão Gerar (TEMA)");

  state.tema = document.getElementById("inp-tema").value.trim();
  state.nivel = document.getElementById("sel-nivel").value;
  state.dias = parseInt(document.getElementById("sel-dias").value);

  if (!state.tema) return alert("Digite um tema.");

  if (typeof window.generatePlanByTheme !== "function") {
    console.error("❌ generatePlanByTheme NÃO encontrado.");
    alert("Erro: módulo de plano por tema não carregado.");
    return;
  }

  document.getElementById("status").textContent = "Gerando plano com IA...";

  try {
    const plano = await window.generatePlanByTheme({
      tema: state.tema,
      nivel: state.nivel,
      dias: state.dias
    });

    state.plano = plano;
    renderPlano();

  } catch (err) {
    console.error(err);
    alert("Falha ao gerar plano por tema.");
  }
});

/* ================================================================
   📁 Listener — Gerar plano por UPLOAD de MATERIAL
   ================================================================ */
document.getElementById("btn-gerar-upload").addEventListener("click", () => {
  console.log("▶️ Botão Gerar (UPLOAD)");

  if (!state.materialTexto) return alert("Envie um arquivo primeiro.");

  state.dias = parseInt(document.getElementById("sel-dias-upload").value);
  state.plano = construirPlanoInteligente(state.materialTexto, "upload", state.dias);

  renderPlano();
});

/* ================================================================
   🧩 Renderização do plano
   ================================================================ */
function renderPlano() {
  const container = document.getElementById("plano");
  const ctx = document.getElementById("ctx");

  container.innerHTML = "";

  if (!state.plano.length) {
    container.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano gerado.</p>`;
    return;
  }

  ctx.textContent = `${state.plano.length} sessões geradas`;

  state.plano.forEach(sessao => {
    const div = document.createElement("div");
    div.classList.add("session-card");
    div.innerHTML = `
      <h3>${sessao.titulo}</h3>
      <p class="text-xs opacity-70">${sessao.densidade}</p>
      <p style="font-style:italic">${sessao.resumo}</p>
      <ul>${sessao.topicos.map(t => `<li>• ${t}</li>`).join("")}</ul>
    `;
    container.appendChild(div);
  });
}

console.log("✅ core.js pronto");
