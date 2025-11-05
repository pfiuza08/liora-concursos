// ==========================================================
// 🧠 Liora — Núcleo principal (core.js)
// Fluxo: Tema+Nível (plano-simulador) OU Upload (semantic)
// Com pré-visualização antes de aplicar o plano
// ==========================================================

/* ---------------------- Estado global ---------------------- */
const state = {
  modo: "tema",          // "tema" | "upload"
  tema: "",
  nivel: "iniciante",
  diasTema: 5,
  diasUpload: 5,
  materialTexto: "",
  tipoMaterial: "",
  plano: [],
};

/* ---------------------- DOM refs ---------------------- */
const els = {
  // UI geral
  btnTheme: document.getElementById("btn-theme"),
  ctx: document.getElementById("ctx"),
  status: document.getElementById("status"),
  plano: document.getElementById("plano"),

  // Modo & painéis
  btnModoTema: document.getElementById("modo-tema"),
  btnModoUpload: document.getElementById("modo-upload"),
  painelTema: document.getElementById("painel-tema"),
  painelUpload: document.getElementById("painel-upload"),

  // Tema
  inpTema: document.getElementById("inp-tema"),
  selNivel: document.getElementById("sel-nivel"),
  selDiasTema: document.getElementById("sel-dias"),
  btnGerarTema: document.getElementById("btn-gerar"),

  // Upload
  uploadZone: document.getElementById("upload-zone"),
  inpFile: document.getElementById("inp-file"),
  fileName: document.getElementById("file-name"),
  fileType: document.getElementById("file-type"),
  uploadSpinner: document.getElementById("upload-spinner"),
  selDiasUpload: document.getElementById("sel-dias-upload"),
  btnGerarUpload: document.getElementById("btn-gerar-upload"),
};

/* ---------------------- Tema claro/escuro ---------------------- */
(function setupTheme() {
  const html = document.documentElement;
  const body = document.body;

  if (!localStorage.getItem("liora_theme")) localStorage.setItem("liora_theme", "dark");
  applyTheme(localStorage.getItem("liora_theme"));

  function applyTheme(mode) {
    const isLight = mode === "light";
    html.classList.toggle("light", isLight);
    html.classList.toggle("dark", !isLight);
    body.classList.toggle("light", isLight);
    body.classList.toggle("dark", !isLight);
    localStorage.setItem("liora_theme", isLight ? "light" : "dark");
    if (els.btnTheme) els.btnTheme.textContent = isLight ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const current = localStorage.getItem("liora_theme") || "dark";
    applyTheme(current === "light" ? "dark" : "light");
  }

  els.btnTheme?.addEventListener("click", toggleTheme);
})();

/* ---------------------- Utils de texto/PDF ---------------------- */
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

async function extractTextPDFSmart(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let full = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const rows = [];
    const tolY = 2;
    const items = content.items
      .map((it) => ({ x: it.transform[4], y: Math.round(it.transform[5]), str: it.str }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

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
          .map((seg, idx, arr) => {
            const prev = arr[idx - 1];
            const gap = prev ? seg.x - (prev.x + (prev.str?.length || 1) * 4) : 0;
            const glue = idx > 0 ? " " : "";
            return glue + seg.str;
          })
          .join("")
          .trim()
      )
      .filter(Boolean);

    full += lines.join("\n") + "\n";
  }

  return full.replace(/\n{3,}/g, "\n\n").trim();
}

/* ---------------------- Heurísticas de tipo ---------------------- */
function linhasParaSinais(texto) {
  let linhas = texto.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (linhas.length < 30) {
    const pseudo = texto.split(/(?<=[.!?])\s+/).map((l) => l.trim()).filter(Boolean);
    if (pseudo.length > linhas.length) linhas = pseudo;
  }
  return linhas;
}

function medirSinais(textoNormalizado) {
  const linhas = linhasParaSinais(textoNormalizado);
  const total = linhas.length || 1;

  const marcadoresRegex = /^((\d+(\.\d+){0,3}[\.\)])|([IVXLCDM]+\.)|([A-Z]\))|([a-z]\))|[•\-–])/;
  const fimParagrafoRegex = /[.!?]\s*$/;

  let bullets = 0,
    longas = 0,
    fimPar = 0,
    capsLike = 0,
    maxRunBullets = 0,
    run = 0;

  for (const l of linhas) {
    const palavras = l.split(/\s+/);
    const isBullet = marcadoresRegex.test(l);
    const isLonga = palavras.length >= 12;
    const isParagrafo = fimParagrafoRegex.test(l);
    const isCapsLike = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ]{6,}$/.test(l) && !/[.!?]$/.test(l);

    if (isBullet) bullets++;
    if (isLonga) longas++;
    if (isParagrafo) fimPar++;
    if (isCapsLike) capsLike++;

    run = isBullet ? run + 1 : 0;
    if (run > maxRunBullets) maxRunBullets = run;
  }

  return {
    total,
    pBullets: bullets / total,
    pLongas: longas / total,
    pFimPar: fimPar / total,
    pCaps: capsLike / total,
    maxRunBullets,
  };
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

/* ---------------------- Helpers UI ---------------------- */
function setStatus(msg) {
  if (els.status) els.status.textContent = msg || "";
}

function updateCtx() {
  if (!els.ctx) return;
  const modo = state.modo === "tema" ? "Tema" : "Upload";
  els.ctx.textContent = `${modo} · ${state.plano.length} sessões`;
}

function createProgressBar() {
  const barWrap = document.createElement("div");
  barWrap.style.marginTop = "8px";
  barWrap.style.height = "8px";
  barWrap.style.borderRadius = "999px";
  barWrap.style.background = "var(--stroke)";
  const bar = document.createElement("div");
  bar.style.height = "100%";
  bar.style.width = "0%";
  bar.style.borderRadius = "999px";
  bar.style.background = "var(--brand)";
  barWrap.appendChild(bar);
  return { barWrap, bar };
}

/* ---------------------- Switch Tema/Upload ---------------------- */
(function setupModo() {
  function aplicarModo() {
    const temaAtivo = state.modo === "tema";
    els.painelTema?.classList.toggle("hidden", !temaAtivo);
    els.painelUpload?.classList.toggle("hidden", temaAtivo);
    els.btnModoTema?.classList.toggle("selected", temaAtivo);
    els.btnModoUpload?.classList.toggle("selected", !temaAtivo);
    // limpar mensagens
    setStatus("");
    if (els.fileName) els.fileName.textContent = "";
    if (els.fileType) els.fileType.textContent = "";
    // limpar plano na troca (opcional)
    // state.plano = []; renderPlano();
  }

  els.btnModoTema?.addEventListener("click", () => {
    state.modo = "tema";
    aplicarModo();
  });
  els.btnModoUpload?.addEventListener("click", () => {
    state.modo = "upload";
    aplicarModo();
  });

  aplicarModo();
})();

/* ---------------------- Upload: arrastar/soltar ---------------------- */
(function setupUploadDnD() {
  if (!els.uploadZone || !els.inpFile) return;

  ["dragenter", "dragover", "dragleave", "drop"].forEach((evt) =>
    document.addEventListener(evt, (e) => e.preventDefault(), true)
  );

  els.uploadZone.addEventListener("dragover", () => els.uploadZone.classList.add("dragover"));
  els.uploadZone.addEventListener("dragleave", () => els.uploadZone.classList.remove("dragover"));
  els.uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    els.uploadZone.classList.remove("dragover");
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      els.inpFile.files = e.dataTransfer.files;
      handleFileSelection(file);
    }
  });

  els.inpFile.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelection(file);
  });
})();

/* ---------------------- Upload: leitura + preview ---------------------- */
async function handleFileSelection(file) {
  if (!file) return;
  setStatus("Lendo arquivo…");

  // Barra de progresso (simulada durante parsing)
  const oldBar = document.getElementById("progress-upload");
  oldBar?.remove();
  const { barWrap, bar } = createProgressBar();
  barWrap.id = "progress-upload";
  els.uploadZone?.insertAdjacentElement("afterend", barWrap);

  let progress = 0;
  const tick = setInterval(() => {
    progress = Math.min(progress + 7, 85);
    bar.style.width = progress + "%";
  }, 120);

  try {
    els.fileName.textContent = `Carregando ${file.name}…`;
    els.fileType.textContent = "";

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    let text = "";
    if (ext === "txt") text = await file.text();
    else if (ext === "pdf") text = await extractTextPDFSmart(await file.arrayBuffer());
    else {
      alert("Formato não suportado. Use .txt ou .pdf");
      return;
    }

    state.materialTexto = text;
    state.tipoMaterial = detectarTipoMaterial(text);

    els.fileName.textContent = `✅ ${file.name} carregado`;
    els.fileType.textContent =
      state.tipoMaterial === "programa"
        ? "🗂️ Programa de conteúdo detectado."
        : state.tipoMaterial === "hibrido"
        ? "📘 Conteúdo híbrido detectado."
        : "📖 Conteúdo narrativo detectado.";

    // Mini preview dos primeiros tópicos/blocos
    const normal = normalizarTextoParaPrograma(text);
    const linhas = normal.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const amostra = linhas.slice(0, 10);
    renderPreviewTopicos(amostra, linhas.length);

    // completa progresso
    clearInterval(tick);
    bar.style.width = "100%";
    setTimeout(() => barWrap.remove(), 600);
    setStatus("Arquivo pronto para gerar plano.");

  } catch (err) {
    console.error(err);
    clearInterval(tick);
    barWrap.remove();
    els.fileName.textContent = "⚠️ Erro ao processar o arquivo.";
    setStatus("Falha ao ler o arquivo.");
  }
}

function renderPreviewTopicos(amostra, total) {
  // remove anterior
  document.getElementById("preview-topicos")?.remove();

  const box = document.createElement("div");
  box.id = "preview-topicos";
  box.style.marginTop = "8px";
  box.style.padding = "8px 10px";
  box.style.background = "rgba(255,255,255,0.03)";
  box.style.border = "1px solid var(--stroke)";
  box.style.borderRadius = "10px";
  box.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;">📋 Prévia dos tópicos detectados</div>
    <ul style="font-size:0.9rem;line-height:1.45;margin-left:1rem;">
      ${amostra.map((l) => `<li>${l.replace(/</g, "&lt;")}</li>`).join("")}
    </ul>
    <div style="margin-top:6px;color:var(--muted);font-size:0.8rem;">
      Exibindo ${amostra.length} de ~${total} blocos.
    </div>
  `;
  els.fileType?.insertAdjacentElement("afterend", box);
}

/* ---------------------- Botões: gerar por Tema/Upload ---------------------- */
els.btnGerarTema?.addEventListener("click", async () => {
  state.modo = "tema";
  const tema = (state.tema = (els.inpTema?.value || "").trim());
  state.nivel = els.selNivel?.value || "iniciante";
  state.diasTema = parseInt(els.selDiasTema?.value || "5", 10);

  if (!tema) {
    alert("Informe um tema.");
    return;
  }

  setStatus("Gerando plano por tema…");
  // Integração com plano-simulador.js
  try {
    if (window.LioraSim?.generatePlan) {
      const res = window.LioraSim.generatePlan({
        tema,
        nivel: state.nivel,
        sessoes: state.diasTema,
      });

      const plan = res?.then ? await res : res;
      if (!plan || !Array.isArray(plan.sessoes || plan)) {
        throw new Error("Plano inválido retornado por plano-simulador.js");
      }

      // Normaliza: aceitar {sessoes:[...]} ou [...]
      const plano = Array.isArray(plan) ? plan : plan.sessoes;
      previewAndConfirmPlan({ origem: "tema", sessoes: plano, meta: { tema, nivel: state.nivel } });
      setStatus("Plano por tema pronto (pré-visualização aberta).");
    } else {
      alert("Módulo de plano por tema não carregado.");
      setStatus("Falha: módulo de tema ausente.");
    }
  } catch (err) {
    console.error(err);
    alert("Falha ao gerar plano por tema.");
    setStatus("Falha ao gerar plano por tema.");
  }
});

els.btnGerarUpload?.addEventListener("click", async () => {
  state.modo = "upload";
  state.diasUpload = parseInt(els.selDiasUpload?.value || "5", 10);

  if (!state.materialTexto) {
    alert("Envie um arquivo TXT ou PDF primeiro.");
    return;
  }
  setStatus("Gerando plano a partir do material…");

  try {
    let sessoes = null;

    if (window.LioraSemantic?.buildPlanFromText) {
      const res = window.LioraSemantic.buildPlanFromText({
        texto: state.materialTexto,
        dias: state.diasUpload,
        tipo: state.tipoMaterial || detectarTipoMaterial(state.materialTexto),
      });
      const plan = res?.then ? await res : res;
      sessoes = Array.isArray(plan?.sessoes) ? plan.sessoes : Array.isArray(plan) ? plan : null;
    }

    // fallback simples se semantic.js não existir
    if (!sessoes) {
      const norm = normalizarTextoParaPrograma(state.materialTexto);
      const linhas = norm.split(/\n+/).map((l) => l.trim()).filter(Boolean);
      const porDia = Math.ceil(linhas.length / state.diasUpload);
      sessoes = [];
      for (let i = 0; i < state.diasUpload; i++) {
        const chunk = linhas.slice(i * porDia, (i + 1) * porDia);
        if (!chunk.length) break;
        sessoes.push({
          titulo: `Sessão ${i + 1}`,
          densidade: "📘 média",
          resumo: chunk.slice(0, 3).join(" "),
          conceitos: [],
          descricao: chunk.map((t) => "• " + t).join("\n"),
        });
      }
    }

    previewAndConfirmPlan({
      origem: "upload",
      sessoes,
      meta: { tipoMaterial: state.tipoMaterial, dias: state.diasUpload },
    });
    setStatus("Plano por upload pronto (pré-visualização aberta).");
  } catch (err) {
    console.error(err);
    alert("Falha ao gerar plano por upload.");
    setStatus("Falha ao gerar plano por upload.");
  }
});

/* ---------------------- Pré-visualização + Aplicar ---------------------- */
function buildPreviewModal(planoObj) {
  // remove anterior
  document.getElementById("liora-preview-modal")?.remove();

  const sessoes = planoObj?.sessoes || [];
  const origem = planoObj?.origem || "tema";
  const meta = planoObj?.meta || {};

  const modal = document.createElement("div");
  modal.id = "liora-preview-modal";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.75)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "2000";

  const card = document.createElement("div");
  card.style.width = "92%";
  card.style.maxWidth = "780px";
  card.style.maxHeight = "84%";
  card.style.overflow = "hidden";
  card.style.background = "var(--card)";
  card.style.color = "var(--fg)";
  card.style.borderRadius = "14px";
  card.style.boxShadow = "var(--shadow)";
  card.style.display = "flex";
  card.style.flexDirection = "column";

  const header = document.createElement("div");
  header.style.padding = "16px";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.borderBottom = "1px solid var(--stroke)";
  header.innerHTML = `
    <div>
      <div style="font-weight:700;">Pré-visualização do plano (${origem === "tema" ? "Tema" : "Upload"})</div>
      <div style="font-size:0.85rem;color:var(--muted);">
        ${origem === "tema" ? `Tema: <b>${(meta.tema || "").replace(/</g,"&lt;")}</b> · Nível: <b>${meta.nivel || ""}</b>` :
          `Material: <b>${(meta.tipoMaterial || "").toUpperCase()}</b> · Sessões: <b>${meta.dias || "-"}</b>`}
      </div>
    </div>
    <button id="pv-close" class="chip">Fechar</button>
  `;

  const body = document.createElement("div");
  body.style.padding = "10px 16px 16px";
  body.style.overflow = "auto";

  const list = document.createElement("div");
  list.style.display = "grid";
  list.style.gridTemplateColumns = "1fr";
  list.style.gap = "10px";

  sessoes.forEach((s, i) => {
    const item = document.createElement("div");
    item.className = "session-card";
    const dens = s.densidade || "";
    item.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <h3>Sessão ${i + 1} — ${(s.titulo || "").replace(/</g,"&lt;")}</h3>
        <span class="text-xs opacity-70">${dens}</span>
      </div>
      <p style="font-style:italic;font-size:0.85rem;color:var(--muted);margin-bottom:0.4rem;">${(s.resumo || "").replace(/</g,"&lt;")}</p>
      <p>${(s.descricao || "").replace(/</g,"&lt;")}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        ${(s.conceitos || []).map((c) => `<span class="chip">${c}</span>`).join("")}
      </div>
    `;
    list.appendChild(item);
  });

  const footer = document.createElement("div");
  footer.style.padding = "12px 16px";
  footer.style.borderTop = "1px solid var(--stroke)";
  footer.style.display = "flex";
  footer.style.justifyContent = "flex-end";
  footer.style.gap = "8px";

  const btnApply = document.createElement("button");
  btnApply.className = "btn";
  btnApply.textContent = "Aplicar ao plano";
  btnApply.addEventListener("click", () => {
    // aplica no estado principal e renderiza
    state.plano = sessoes;
    renderPlano();
    updateCtx();
    modal.remove();
  });

  const btnCancel = document.createElement("button");
  btnCancel.className = "btn-secondary";
  btnCancel.textContent = "Cancelar";
  btnCancel.addEventListener("click", () => modal.remove());

  footer.appendChild(btnCancel);
  footer.appendChild(btnApply);

  body.appendChild(list);
  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(footer);
  modal.appendChild(card);
  document.body.appendChild(modal);

  document.getElementById("pv-close")?.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}

/* ---------------------- API global p/ outros módulos ---------------------- */
window.LioraCore = {
  /** Chamado por plano-simulador.js após gerar o plano por tema */
  previewAndConfirmPlan,
};

function previewAndConfirmPlan(planoObj) {
  if (!planoObj || !Array.isArray(planoObj.sessoes)) {
    console.warn("previewAndConfirmPlan: formato inválido; esperado { sessoes: [...] }");
    return;
  }
  buildPreviewModal(planoObj);
}

/* ---------------------- Renderização final do plano ---------------------- */
function renderPlano() {
  els.plano.innerHTML = "";
  if (!state.plano.length) {
    els.plano.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum plano de estudo gerado.</p>`;
    return;
  }

  state.plano.forEach((sessao, idx) => {
    const div = document.createElement("div");
    div.className = "session-card";
    div.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <h3>Sessão ${idx + 1} — ${(sessao.titulo || "").replace(/</g,"&lt;")}</h3>
        <span class="text-xs opacity-70">${sessao.densidade || ""}</span>
      </div>
      <p style="font-style:italic;font-size:0.85rem;color:var(--muted);margin-bottom:0.4rem;">${(sessao.resumo || "").replace(/</g,"&lt;")}</p>
      <p>${(sessao.descricao || "").replace(/</g,"&lt;")}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        ${(sessao.conceitos || []).map((c) => `<span class="chip">${c}</span>`).join("")}
      </div>
    `;
    els.plano.appendChild(div);
  });
  updateCtx();
}

/* ---------------------- Ready log ---------------------- */
console.log("✅ core.js pronto (v9) — modos Tema/Upload com preview.");
