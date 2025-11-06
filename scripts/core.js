// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v14)
// Tema e Upload AUTOMÁTICOS — IA decide número de sessões
// Exibe apenas TÍTULO + RESUMO (detalhamento via modal)
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora Core...");

  document.addEventListener("DOMContentLoaded", () => {
    const els = {
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      themeBtn: document.getElementById("btn-theme"),

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
    // 📊 Barra de progresso
    // ==========================================================
    function iniciarProgresso() {
      els.progressFill.style.width = "0%";
      els.progressBar.classList.remove("hidden");
      let progresso = 0;

      const intervalo = setInterval(() => {
        progresso += Math.random() * 15;
        if (progresso > 90) progresso = 90;
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
    // 🔄 Alternância Tema / Upload
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
    // 📂 UPLOAD — leitura + preview + plano
    // ==========================================================
    els.inpFile?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      els.statusUpload.textContent = "⏳ Processando arquivo...";

      if (!window.processarArquivoUpload) {
        alert("❌ Módulo semantic.js não está pronto.");
        return;
      }

      try {
        const resultado = await window.processarArquivoUpload(file);
        els.statusUpload.textContent = resultado.tipoMsg;

        const previewItems = (resultado.topicos || [])
          .slice(0, 12)
          .map((t) =>
            typeof t === "string"
              ? t
              : `${t?.titulo || "Tópico"} — ${Array.isArray(t?.conceitos) ? t.conceitos.slice(0, 3).join(", ") : ""}`
          );

        mostrarPreview(previewItems);
      } catch (err) {
        console.error(err);
        els.statusUpload.textContent = "❌ Falha ao ler o arquivo.";
      }
    });

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
    // 🚀 Gerar plano (UPLOAD)
    // ==========================================================
    els.btnGerarUpload?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (UPLOAD)");

      const loading = iniciarProgresso();

      try {
        const out = await window.gerarPlanoPorUpload();
        const { sessoes, plano } = normalizeOutput(out);

        finalizarProgresso(loading);
        els.ctx.textContent = `📘 ${sessoes} sessões geradas automaticamente — com base no material enviado.`;

        renderizarPlano(plano);
      } catch (err) {
        finalizarProgresso(loading);
        console.error(err);
        alert("❌ Erro ao gerar plano por upload.");
      }
    });

    // ==========================================================
    // 🚀 Gerar plano (TEMA)
    // ==========================================================
    els.btnGerar?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (TEMA)");

      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      const loading = iniciarProgresso();

      try {
        const out = await window.generatePlanByTheme(tema, nivel);
        const { sessoes, plano } = normalizeOutput(out);

        finalizarProgresso(loading);
        els.ctx.textContent =
          `📘 ${sessoes} sessões geradas automaticamente — baseado no nível ${nivel} e na complexidade do tema.`;

        renderizarPlano(plano);
      } catch (err) {
        finalizarProgresso(loading);
        console.error(err);
        alert("❌ Falha ao gerar plano.");
      }
    });

    // ==========================================================
    // 🔧 Normaliza output
    // ==========================================================
    function normalizeOutput(out) {
      if (Array.isArray(out)) return { sessoes: out.length, plano: out };
      const sessoes = Number(out?.sessoes || out?.plano?.length || 0);
      const plano = Array.isArray(out?.plano) ? out.plano : [];
      return { sessoes, plano };
    }

    // ==========================================================
    // ✅ Renderização do Plano (TÍTULO + RESUMO + DETALHES)
    // ==========================================================
    function renderizarPlano(plano) {
      els.plano.innerHTML = "";

      plano.forEach((sessao, index) => {
        const div = document.createElement("div");
        div.className = "session-card";

        div.innerHTML = `
          <h3>${sessao.titulo || "Sessão"}</h3>
          <p class="text-[var(--muted)] text-sm mb-2">${sessao.resumo || "Resumo não disponível."}</p>

          <button class="chip btn-detalhar" data-id="${index}">
            Ver detalhes →
          </button>
        `;

        els.plano.appendChild(div);
      });

      document.querySelectorAll(".btn-detalhar").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.target.dataset.id;
          abrirDetalhamento(plano[id]);
        });
      });
    }

    // ==========================================================
    // 🪟 Modal com detalhamento da sessão
    // ==========================================================
    function abrirDetalhamento(sessao) {
      document.querySelector("#modal-detalhamento")?.remove();

      const modal = document.createElement("div");
      modal.className = "preview-modal-overlay";
      modal.id = "modal-detalhamento";

      modal.innerHTML = `
        <div class="preview-modal">
          <h3>${sessao.titulo}</h3>
          <pre>${sessao.detalhamento || "Sem detalhamento disponível."}</pre>
          <div class="text-right mt-4">
            <button class="chip" id="fechar-detalhe">Fechar</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      document.getElementById("fechar-detalhe").onclick = () => modal.remove();
    }

    // Debug
    window.LioraCore = { els, renderizarPlano };

    console.log("🟢 core.js carregado com sucesso");
  });
})();
