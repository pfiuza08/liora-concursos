// =============================================================
// 🧠 LIORA — CORE PRINCIPAL
// Gera plano de estudos por TEMA ou por UPLOAD
// =============================================================

// Estado global
window.state = {
  tema: "",
  nivel: "",
  dias: 5,
  materialTexto: "",
  plano: [],
};

// =============================================================
// 🌙 Tema claro / escuro
// =============================================================
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

themeBtn?.addEventListener("click", () => {
  const atual = localStorage.getItem("liora_theme") || "dark";
  setTheme(atual === "light" ? "dark" : "light");
});

setTheme(localStorage.getItem("liora_theme") || "dark");


// =============================================================
// 🧩 Shim — Integrar com semantic.js
// =============================================================
function construirPlanoInteligenteShim(texto, dias, temaOpcional) {
  console.log("⚙️ construirPlanoInteligenteShim() chamado...");

  if (window.Semantic && typeof window.Semantic.construirPlanoInteligente === "function") {
    console.log("✅ Usando Semantic.construirPlanoInteligente()");
    const tipo = window.Semantic.detectarTipoMaterial(texto);
    return window.Semantic.construirPlanoInteligente(texto, tipo, dias, temaOpcional);
  }

  console.warn("⚠️ semantic.js não carregado — usando fallback simples.");

  const linhas = texto.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (!linhas.length) return [];

  const porDia = Math.ceil(linhas.length / dias);
  const plano = [];
  for (let i = 0; i < dias; i++) {
    const grupo = linhas.slice(i * porDia, (i + 1) * porDia);
    if (!grupo.length) break;
    plano.push({
      dia: i + 1,
      titulo: `Sessão ${i + 1}`,
      resumo: grupo[0]?.slice(0, 120) || "",
      descricao: grupo.join("\n"),
      densidade: "📗 leve",
      conceitos: [],
    });
  }
  return plano;
}


// =============================================================
// 📥 UPLOAD DE ARQUIVO
// =============================================================
const inputFile = document.getElementById("inp-file");
const fileName = document.getElementById("file-name");
const fileType = document.getElementById("file-type");

inputFile?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  fileName.textContent = `Carregando ${file.name}...`;

  try {
    const ext = file.name.split(".").pop().toLowerCase();
    let text = "";

    if (ext === "txt") {
      text = await file.text();
    } else if (ext === "pdf") {
      text = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
        .then(async (pdf) => {
          let full = "";
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            full += textContent.items.map((item) => item.str).join(" ") + "\n";
          }
          return full;
        });
    }

    window.state.materialTexto = text;
    fileName.textContent = `✅ ${file.name} carregado (${ext.toUpperCase()})`;
    fileType.textContent = "Material pronto para gerar o plano.";

  } catch (err) {
    console.error("❌ Erro ao ler arquivo:", err);
    fileName.textContent = "Erro ao carregar arquivo.";
  }
});


// ==========================
// GERAR PLANO POR TEMA
// ==========================
els.btnGerar?.addEventListener("click", async () => {
  console.log("▶️ Botão Gerar (TEMA)");

  const tema = document.getElementById("inp-tema").value.trim();
  const nivel = document.getElementById("sel-nivel").value.trim();
  const sessoes = parseInt(document.getElementById("sel-dias").value, 10);

  console.log("[core.js] Valores coletados -> ", { tema, nivel, sessoes });

  if (!tema) {
    alert("Digite um tema para continuar.");
    return;
  }

  try {
    const planoGerado = await window.generatePlanByTheme({ tema, nivel, sessoes });

    if (!planoGerado || !Array.isArray(planoGerado)) {
      throw new Error("Retorno do modelo inválido.");
    }

    state.tema = tema;
    state.plano = planoGerado;
    updateCtx();
    renderPlano();

  } catch (err) {
    console.error("[core.js] Falha ao gerar plano por tema:", err);
    alert("Falha ao gerar plano por tema.");
  }
});


// =============================================================
// ▶️ Botão GERAR PLANO — MODO UPLOAD
// =============================================================
document.getElementById("btn-gerar-upload")?.addEventListener("click", async () => {
  console.log("▶️ Botão Gerar (UPLOAD)");

  const texto = window.state.materialTexto?.trim();
  const sessoes = parseInt(document.getElementById("sel-dias-upload")?.value || "5");

  if (!texto) {
    alert("Envie um arquivo antes de gerar.");
    return;
  }

  const plano = construirPlanoInteligenteShim(texto, sessoes, window.state.tema || "Tema");

  window.state.plano = plano;
  document.getElementById("ctx").textContent = `${plano.length} sessões geradas · origem: upload`;
  renderPlano();
});


// =============================================================
// 🖥 Renderização do plano
// =============================================================
function renderPlano() {
  const cont = document.getElementById("plano");
  cont.innerHTML = "";

  if (!state.plano?.length) {
    cont.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano de estudo gerado.</p>`;
    return;
  }

  state.plano.forEach((sessao) => {
    const div = document.createElement("div");
    div.className = "session-card";
    div.innerHTML = `
      <div class="flex items-center justify-between">
        <h3>${sessao.titulo}</h3>
        <span class="text-xs opacity-70">${sessao.densidade || ""}</span>
      </div>
      <p class="text-sm opacity-70 mb-1">${sessao.resumo || ""}</p>
      <pre>${sessao.descricao}</pre>
    `;
    cont.appendChild(div);
  });
}

console.log("✅ core.js carregado com sucesso.");
