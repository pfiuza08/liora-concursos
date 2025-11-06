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

      // ✅ barra de evolução
      progressBar: document.getElementById("progress-bar"),
      progressFill: document.getElementById("progress-fill"),
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
    // 📊 BARRA DE EVOLUÇÃO (PROGRESS BAR)
    // ==========================================================
    function iniciarProgresso() {
      els.progressFill.style.width = "0%";
      els.progressBar.classList.remove("hidden");

      let progresso = 0;
      const intervalo = setInterval(() => {
        progresso += Math.random() * 15;
        if (progresso > 90) progresso = 90;   // mantém até finalização
        els.progressFill.style.width = `${progresso}%`;
      }, 350);

      return intervalo;
    }

    function finalizarProgresso(intervalo) {
      clearInterval(intervalo);
      els.progressFill.style.width = "100%";
      setTimeout(() => els.progressBar.classList.add("hidden"), 600);
    }



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

      if (!window.processarArquivoUpload) {
        alert("❌ O módulo de processamento do arquivo ainda não está pronto.");
        return;
      }

      try {
        const resultado = await window.processarArquivoUpload(file);
        els.statusUpload.textContent = resultado.tipoMsg;

        const previewItems = (resultado.topicos || [])
          .slice(0, 12)
          .map((t) => {
            if (typeof t === "string") return t;
            const titulo = t?.titulo || "Tópico";
            const conceitos = Array.isArray(t?.conceitos)
              ? t.conceitos.slice(0, 3).join(", ")
              : "";
            return conceitos ? `${titulo} — ${conceitos}` : titulo;
          });

        mostrarPreview(previewItems);
      } catch (err) {
        console.error(err);
        els.statusUpload.textContent = "❌ Falha ao ler o arquivo.";
      }
    });



    // ==========================================================
    // ✅ Modal de preview dos tópicos detectados
    // ==========================================================
    function mostrarPreview(lista) {
      document.querySelector("#preview-modal")?.remove();

      const modal = document.createElement("div");
      modal.id = "preview-modal";
      modal.className = "preview-modal-overlay";
      modal.innerHTML = `
        <div class="preview-modal">
          <h3>📋 Tópicos detectados</h3>
          <ul style="max-height:300px; overflow:auto; padding-left:1rem; margin-top:.5rem;">
            ${lista.map(txt => `<li>• ${txt}</li>`).join("")}
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
    // 🚀 GERAR PLANO — UPLOAD (PDF/TXT)
    // ==========================================================
    els.btnGerarUpload?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (UPLOAD)");

      if (!window.gerarPlanoPorUpload) {
        alert("❌ Módulo semantic.js não está pronto.");
        return;
      }

      const loading = iniciarProgresso();  // ✅ Inicia barra

      try {
        const plano = await window.gerarPlanoPorUpload(parseInt(els.selDiasUpload.value));
        finalizarProgresso(loading);       // ✅ Finaliza barra
        renderizarPlano(plano);
      } catch (err) {
        finalizarProgresso(loading);
        console.error(err);
        alert("❌ Erro ao gerar plano por upload.");
      }
    });



    // ==========================================================
    // 🚀 GERAR PLANO — POR TEMA (IA / plano-simulador.js)
    // ==========================================================
    els.btnGerar?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (TEMA)");

      const tema = els.inpTema.value.trim();
      if (!tema) return alert("Digite um tema.");

      if (!window.generatePlanByTheme) {
        alert("❌ Módulo de plano por tema não está pronto.");
        return;
      }

      const loading = iniciarProgresso(); // ✅ Inicia barra

      try {
        const plano = await window.generatePlanByTheme(
          tema,
          els.selNivel.value,
          parseInt(els.selDias.value)
        );

        finalizarProgresso(loading);      // ✅ Finaliza barra
        renderizarPlano(plano);
      } catch (err) {
        finalizarProgresso(loading);
        console.error(err);
        alert("❌ Falha ao gerar plano.");
      }
    });



    // ==========================================================
    // ✅ Renderização final do plano no painel direito
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


    window.LioraCore = { els, renderizarPlano };
    console.log("🟢 core.js carregado com sucesso");
  });
})();
