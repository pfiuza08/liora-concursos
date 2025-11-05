/* ==========================================================
 🧠 Liora — CORE PRINCIPAL
 Versão com:
 - Upload corrigido (click + drag & drop)
 - Barra de progresso
 - Preview dos tópicos detectados
 - Tema claro/escuro
========================================================== */

// Estado global
const state = {
  tema: "",
  nivel: "",
  dias: 5,
  materialTexto: "",
  tipoMaterial: "",
  plano: [],
};

/* ==========================================================
 🌙 Alternância de tema (dark/light)
========================================================== */
const themeBtn = document.getElementById("btn-theme");
const html = document.documentElement;
const body = document.body;

// define padrão dark
if (!localStorage.getItem("liora_theme")) {
  localStorage.setItem("liora_theme", "dark");
}

function aplicarTema(mode) {
  const light = mode === "light";
  html.classList.toggle("light", light);
  html.classList.toggle("dark", !light);
  body.classList.toggle("light", light);
  body.classList.toggle("dark", !light);
  themeBtn.textContent = light ? "☀️" : "🌙";
  localStorage.setItem("liora_theme", mode);
}

function alternarTema() {
  const atual = localStorage.getItem("liora_theme") === "light" ? "dark" : "light";
  aplicarTema(atual);
}

themeBtn.addEventListener("click", alternarTema);
aplicarTema(localStorage.getItem("liora_theme"));

/* ==========================================================
 📁 Upload de arquivos / drag & drop + barra de progresso
========================================================== */
const uploadZone = document.getElementById("upload-zone");
const inpFile = document.getElementById("inp-file");
const fileName = document.getElementById("file-name");
const fileType = document.getElementById("file-type");
const uploadSpinner = document.getElementById("upload-spinner");

// eventos visuais drag/drop
["dragenter", "dragover"].forEach(evt =>
  uploadZone?.addEventListener(evt, e => {
    e.preventDefault();
    uploadZone.classList.add("dragover");
  })
);

["dragleave", "drop"].forEach(evt =>
  uploadZone?.addEventListener(evt, e => {
    e.preventDefault();
    uploadZone.classList.remove("dragover");
  })
);

// click para abrir seletor
uploadZone?.addEventListener("click", () => inpFile.click());

// drop de arquivo
uploadZone?.addEventListener("drop", e => {
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
});

// seleção via input
inpFile?.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) processFile(file);
});

// processamento do arquivo
async function processFile(file) {
  fileName.textContent = `Carregando ${file.name}...`;
  uploadSpinner.style.display = "block";

  try {
    const ext = file.name.split(".").pop().toLowerCase();
    let text = "";

    if (ext === "txt") {
      text = await file.text();
    } else if (ext === "pdf") {
      text = await extractTextPDFSmart(await file.arrayBuffer(), progress => {
        uploadSpinner.style.setProperty("--progress", `${progress}%`);
      });
    } else {
      alert("Formato não suportado. Envie PDF ou TXT.");
      return;
    }

    uploadSpinner.style.display = "none";

    state.materialTexto = text;
    state.tipoMaterial = detectarTipoMaterial(text);

    fileName.textContent = `✅ ${file.name}`;
    fileType.textContent =
      state.tipoMaterial === "programa"
        ? "🗂️ Conteúdo programático detectado"
        : state.tipoMaterial === "hibrido"
        ? "📘 Material híbrido detectado"
        : "📖 Material narrativo detectado";

    abrirPreviewEstrutura(text);
  } catch (err) {
    uploadSpinner.style.display = "none";
    fileName.textContent = "⚠️ Erro ao processar arquivo";
  }
}

/* ==========================================================
 📄 Extração de texto preservando estrutura (PDF.js)
========================================================== */
async function extractTextPDFSmart(arrayBuffer, progressCallback = null) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let resultado = "";

  for (let page = 1; page <= pdf.numPages; page++) {
    const p = await pdf.getPage(page);
    const content = await p.getTextContent();

    resultado += content.items.map(i => i.str).join("\n") + "\n";

    if (progressCallback) {
      progressCallback(Math.round((page / pdf.numPages) * 100));
    }
  }

  return resultado.replace(/\n{2,}/g, "\n").trim();
}

/* ==========================================================
 🔍 Preview de tópicos detectados (janela modal)
========================================================== */
function abrirPreviewEstrutura(texto) {
  document.getElementById("estrutura-modal")?.remove();

  const linhas = texto.split(/\n+/).slice(0, 12);

  const modal = document.createElement("div");
  modal.id = "estrutura-modal";
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-card">
        <h3>🔎 Tópicos detectados</h3>
        <p class="text-sm text-[var(--muted)] mb-2">Primeiros blocos identificados:</p>
        <ul class="modal-list">
          ${linhas.map(l => `<li>• ${l}</li>`).join("")}
        </ul>
        <button class="btn w-full mt-4" id="close-modal">Fechar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById("close-modal").onclick = () => modal.remove();
}

/* ==========================================================
 🎯 GERAR PLANO (tema OU upload)
========================================================== */
const els = {
  inpTema: document.getElementById("inp-tema"),
  selNivel: document.getElementById("sel-nivel"),
  selDias: document.getElementById("sel-dias"),
  selDiasUpload: document.getElementById("sel-dias-upload"),
  btnTema: document.getElementById("btn-gerar"),
  btnUpload: document.getElementById("btn-gerar-upload"),
  status: document.getElementById("status"),
  statusUpload: document.getElementById("status-upload"),
  plano: document.getElementById("plano"),
  ctx: document.getElementById("ctx"),
};

function renderPlano() {
  els.plano.innerHTML = "";

  if (!state.plano.length) {
    els.plano.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano gerado.</p>`;
    return;
  }

  state.plano.forEach(sessao => {
    const card = document.createElement("div");
    card.className = "session-card";
    card.innerHTML = `
      <h3>${sessao.titulo}</h3>
      <p class="text-xs opacity-70">${sessao.densidade}</p>
      <p class="text-sm italic text-[var(--muted)] mb-2">${sessao.resumo}</p>
      <pre>${sessao.descricao}</pre>
    `;
    els.plano.appendChild(card);
  });
}

// gerar plano por tema
els.btnTema?.addEventListener("click", async () => {
  if (!els.inpTema.value.trim()) {
    alert("Digite um tema para estudo.");
    return;
  }

  state.tema = els.inpTema.value.trim();
  state.nivel = els.selNivel.value.trim();
  state.dias = parseInt(els.selDias.value);

  els.status.textContent = "Gerando plano...";

  const plano = await gerarPlanoPorTema(state.tema, state.nivel, state.dias);
  state.plano = plano;

  els.status.textContent = "✅ Plano gerado!";
  renderPlano();
});

// gerar plano via upload
els.btnUpload?.addEventListener("click", () => {
  if (!state.materialTexto) {
    alert("Envie um arquivo primeiro.");
    return;
  }

  state.dias = parseInt(els.selDiasUpload.value);
  els.statusUpload.textContent = "Gerando plano...";

  state.plano = construirPlanoInteligente(state.materialTexto, state.tipoMaterial, state.dias);

  els.statusUpload.textContent = "✅ Plano gerado!";
  renderPlano();
});

// debug
console.log("✅ core.js ativo");
