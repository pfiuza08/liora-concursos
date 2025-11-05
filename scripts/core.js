// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL
// Coordena UI + geração do plano (TEMA e UPLOAD)
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core...");

  document.addEventListener("DOMContentLoaded", () => {

    // ==========================================================
    // 📌 Referências ao DOM
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
      themeBtn: document.getElementById("btn-theme"),
    };


    // ==========================================================
    // 🌗 Tema claro/escuro
    // ==========================================================
    function aplicarTema(mode) {
      document.documentElement.classList.toggle("light", mode === "light");
      document.body.classList.toggle("light", mode === "light");
      localStorage.setItem("liora_theme", mode);
      els.themeBtn.textContent = mode === "light" ? "☀️" : "🌙";
    }

    els.themeBtn?.addEventListener("click", () => {
      const atual = localStorage.getItem("liora_theme") || "dark";
      aplicarTema(atual === "light" ? "dark" : "light");
    });

    aplicarTema(localStorage.getItem("liora_theme") || "dark");


    // ==========================================================
    // 🔄 Alternância entre modo Tema e Upload
    // ==========================================================
    els.modoTema?.addEventListener("click", () => {
      els.painelTema.classList.remove("hidden");
      els.painelUpload.classList.add("hidden");

      els.modoTema.classList.add("selected");
      els.modoUpload.classList.remove("selected");
    });

    els.modoUpload?.addEventListener("click", () => {
      els.painelUpload.classList.remove("hidden");
      els.painelTema.classList.add("hidden");

      els.modoUpload.classList.add("selected");
      els.modoTema.classList.remove("selected");
    });


    // ==========================================================
    // 📂 UPLOAD — Processamento do arquivo (PDF/TXT)
    // ==========================================================
    els.inpFile?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      els.statusUpload.textContent = "⏳ Processando arquivo...";

      // ✅ valida semantic.js somente quando necessário
      if (!window.processarArquivoUpload) {
        alert("❌ O módulo de processamento do arquivo ainda não está pronto.");
        return;
      }

      try {
        const resultado = await window.processarArquivoUpload(file);
        els.statusUpload.textContent = resultado.tipoMsg;
        mostrarPreview(resultado.topicos?.slice(0, 12) || []);
      } catch (err) {
        console.error(err);
        els.statusUpload.textContent = "❌ Falha ao ler o arquivo.";
      }
    });


    // ==========================================================
    // Modal de preview dos tópicos
    // ==========================================================
    function mostrarPreview(lista) {
      document.querySelector("#preview-modal")?.remove();

      const modal = document.createElement("div");
      modal.id = "preview-modal";
      modal.className = "preview-modal-overlay";
      modal.innerHTML = `
        <div class="preview-modal">
          <h3>📋 Tópicos detectados</h3>
          <ul>${lista.map(t => `<li>• ${t}</li>`).join("")}</ul>
          <button id="fechar-preview" class="chip mt-4">Fechar</button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById("fechar-preview").onclick = () => modal.remove();
    }


    // ==========================================================
    // 🚀 GERAR PLANO — UPLOAD (PDF/TXT)
    // ==========================================================
    els.btnGerarUpload?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (UPLOAD)");

      // ✅ valida semantic.js somente no clique
      if (!window.gerarPlanoPorUpload) {
        alert("❌ Módulo semantic.js não está pronto.");
        return;
      }

      els.statusUpload.textContent = "⏳ Gerando plano...";

      try {
        const plano = await window.gerarPlanoPorUpload(parseInt(els.selDiasUpload.value));
        renderizarPlano(plano);
      } catch (err) {
        console.error(err);
        alert("❌ Erro ao gerar plano por upload.");
      }
    });


    // ==========================================================
    // 🚀 GERAR PLANO — POR TEMA usando IA (plano-simulador.js)
    // ==========================================================
    els.btnGerar?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (TEMA)");

      const tema = els.inpTema.value.trim();
      if (!tema) return alert("Digite um tema.");

      if (!window.generatePlanByTheme) {
        alert("❌ Módulo de plano por tema não está pronto.");
        return;
      }

      els.status.textContent = "⏳ Gerando plano...";

      try {
        const plano = await window.generatePlanByTheme(
          tema,
          els.selNivel.value,
          parseInt(els.selDias.value)
        );
        renderizarPlano(plano);
      } catch (err) {
        console.error(err);
        alert("❌ Falha ao gerar plano.");
      }
    });


    // ==========================================================
    // ✅ Renderiza o plano no painel
    // ==========================================================
    function renderizarPlano(plano) {
      if (!Array.isArray(plano)) {
        console.error("❌ Plano inválido:", plano);
        alert("Erro ao construir o plano.");
        return;
      }

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


    // Helper para depuração
    window.LioraCore = { els, renderizarPlano };

    console.log("🟢 core.js carregado com sucesso");
  });
})();
