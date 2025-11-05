// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL
// Coordena a UI + geração do plano por TEMA (IA) e por UPLOAD (PDF/TXT)
// ==========================================================

// ==========================================================
// 📌 Referências ao DOM (corrige "els não definido")
// ==========================================================
const els = {
  // PAINEL DE TEMA
  inpTema: document.getElementById("inp-tema"),
  selNivel: document.getElementById("sel-nivel"),
  selDias: document.getElementById("sel-dias"),
  btnGerar: document.getElementById("btn-gerar"),
  status: document.getElementById("status"),

  // PAINEL DE UPLOAD
  inpFile: document.getElementById("inp-file"),
  selDiasUpload: document.getElementById("sel-dias-upload"),
  btnGerarUpload: document.getElementById("btn-gerar-upload"),
  statusUpload: document.getElementById("status-upload"),

  // OUTROS
  plano: document.getElementById("plano"),
  ctx: document.getElementById("ctx"),
  painelTema: document.getElementById("painel-tema"),
  painelUpload: document.getElementById("painel-upload"),
  modoTema: document.getElementById("modo-tema"),
  modoUpload: document.getElementById("modo-upload"),
};

// ==========================================================
// 🌗 Tema claro/escuro
// ==========================================================
const themeBtn = document.getElementById("btn-theme");

function aplicarTema(mode) {
  document.documentElement.classList.toggle("light", mode === "light");
  document.body.classList.toggle("light", mode === "light");
  localStorage.setItem("liora_theme", mode);
  themeBtn.textContent = mode === "light" ? "☀️" : "🌙";
}

themeBtn.addEventListener("click", () => {
  const mode = localStorage.getItem("liora_theme") === "light" ? "dark" : "light";
  aplicarTema(mode);
});

aplicarTema(localStorage.getItem("liora_theme") || "dark");

// ==========================================================
// 🔄 Alternância entre modo Tema e Upload
// ==========================================================
els.modoTema.addEventListener("click", () => {
  els.painelTema.classList.remove("hidden");
  els.painelUpload.classList.add("hidden");

  els.modoTema.classList.add("selected");
  els.modoUpload.classList.remove("selected");
});

els.modoUpload.addEventListener("click", () => {
  els.painelUpload.classList.remove("hidden");
  els.painelTema.classList.add("hidden");

  els.modoUpload.classList.add("selected");
  els.modoTema.classList.remove("selected");
});

// ==========================================================
// 📂 UPLOAD DE ARQUIVO (PDF/TXT)
// ==========================================================

// Conexão com semantic.js
if (!window.processarArquivoUpload) {
  console.warn("⚠️ semantic.js ainda não carregado.");
}

els.inpFile?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  els.statusUpload.textContent = "⏳ Processando arquivo...";

  try {
    const resultado = await window.processarArquivoUpload(file); // <-- semantic.js
    els.statusUpload.textContent = resultado.tipoMsg;

    // Exibir preview dos tópicos detectados
    mostrarPreview(resultado.topicos.slice(0, 12));
  } catch (err) {
    console.error(err);
    els.statusUpload.textContent = "❌ Falha ao ler o arquivo.";
  }
});

// EXIBE MODAL COM PRÉVIA DOS TÓPICOS
function mostrarPreview(lista) {
  document.querySelector("#preview-modal")?.remove();

  const modal = document.createElement("div");
  modal.id = "preview-modal";
  modal.style = `
      position:fixed; inset:0; background:rgba(0,0,0,.6);
      display:flex; align-items:center; justify-content:center; z-index:5000;
  `;
  modal.innerHTML = `
      <div style="background:var(--card); color:var(--fg); padding:1.5rem; max-width:600px; border-radius:1rem;">
          <h3 class="mb-2">📋 Tópicos detectados</h3>
          <ul style="max-height:300px; overflow:auto; padding-left:1rem;">
             ${lista.map(t => `<li>• ${t}</li>`).join("")}
          </ul>
          <div class="text-right mt-4">
             <button class="chip" id="fechar-preview">Fechar</button>
          </div>
      </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("fechar-preview").onclick = () => modal.remove();
}

// ==========================================================
// 🚀 GERAR PLANO POR UPLOAD (PDF / TXT)
// usando processamento semântico do semantic.js
// ==========================================================
els.btnGerarUpload?.addEventListener("click", async () => {
  console.log("▶️ Botão Gerar (UPLOAD)");

  const sessoes = parseInt(els.selDiasUpload.value);
  if (!window.gerarPlanoPorUpload) {
    alert("❌ Módulo semantic.js não carregado.");
    return;
  }

  const plano = await window.gerarPlanoPorUpload(sessoes);
  renderizarPlano(plano);
});

// ==========================================================
// 🚀 GERAR PLANO POR TEMA + NÍVEL
// usando IA — plano-simulador.js
// ==========================================================
els.btnGerar?.addEventListener("click", async () => {
  console.log("▶️ Botão Gerar (TEMA)");

  const tema = els.inpTema.value.trim();
  const nivel = els.selNivel.value;
  const sessoes = parseInt(els.selDias.value);

  if (!tema) return alert("Digite um tema para estudo.");

  if (!window.generatePlanByTheme) {
    alert("❌ Módulo de plano por tema não carregado.");
    return;
  }

  try {
    const plano = await window.generatePlanByTheme(tema, nivel, sessoes);
    renderizarPlano(plano);
  } catch (err) {
    console.error(err);
    alert("❌ Falha ao gerar plano por tema.");
  }
});

// ==========================================================
// ✅ Renderização final do plano no painel direito
// ==========================================================
function renderizarPlano(plano) {
  els.plano.innerHTML = "";
  els.ctx.textContent = `📘 ${plano.length} sessões`;

  plano.forEach(sessao => {
    const div = document.createElement("div");
    div.className = "session-card";
    div.innerHTML = `
      <h3>${sessao.titulo}</h3>
      <p class="text-[var(--muted)] text-sm mb-2">${sessao.resumo}</p>
      <pre>${sessao.conteudo}</pre>
    `;
    els.plano.appendChild(div);
  });

  console.log("✅ Plano renderizado.");
}

// ==========================================================
// ✅ Log final
// ==========================================================
console.log("🟢 core.js carregado com sucesso");
