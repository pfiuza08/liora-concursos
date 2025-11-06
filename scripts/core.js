// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL
// Coordena UI + geração dos planos (tema e upload)
// Agora renderiza apenas título + resumo, e abre detalhamento
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
    // 📂 UPLOAD — Processamento do arquivo
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
          .map(t => typeof t === "string"
            ? t
            : `${t?.titulo || "Tópico"} — ${Array.isArray(t?.conceitos) ? t.conceitos.slice(0, 2).join(", ") : ""}`
          );

        mostrarPreview(previewItems);
      } catch (err) {
        console.error(err);
        els.statusUpload.textContent = "❌ Falha ao ler o arquivo.";
      }
    });


    // ==========================================================
    // ✅ Modal de preview dos tópicos detectados (UPLOAD)
    // ==========================================================
    function mostrarPreview(lista) {
      document.querySelector("#preview-modal")?.remove();

      const modal = document.createElement("div");
      modal.className = "preview-modal-overlay";
      modal.id = "preview-modal";

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
    // 🚀 GERAR PLANO — UPLOAD
    // ==========================================================
    els.btnGerarUpload?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (UPLOAD)");

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
    // 🚀 GERAR PLANO — TEMA (via IA)
    // ==========================================================
    els.btnGerar?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (TEMA)");

      const tema = els.inpTema.value.trim();
      if (!tema) return alert("Digite um tema.");

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
    // ✅ Renderização do plano (título + resumo + botão detalhar)
    // ==========================================================
    function renderizarPlano(plano) {
      els.plano.innerHTML = "";
      els.ctx.textContent = `📘 ${plano.length} sessões`;

      plano.forEach((sessao, index) => {
        const div = document.createElement("div");
        div.className = "session-card";

        div.innerHTML = `
          <h3>${sessao.titulo}</h3>
          <p class="text-[var(--muted)] text-sm mb-2">${sessao.resumo}</p>

          <button class="chip btn-detalhar" data-id="${index}">
            Ver detalhes →
          </button>
        `;

        els.plano.appendChild(div);
      });

      document.querySelectorAll(".btn-detalhar").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.target.dataset.id;
          const sessao = plano[id];
          abrirDetalhamento(sessao);
        });
      });
    }


    // ==========================================================
    // 🪟 MODAL — Detalhamento da sessão
    // ==========================================================
    function abrirDetalhamento(sessao) {
      document.querySelector("#modal-detalhamento")?.remove();

      const modal = document.createElement("div");
      modal.className = "preview-modal-overlay";
      modal.id = "modal-detalhamento";

      modal.innerHTML = `
        <div class="preview-modal">
          <h3>${sessao.titulo}</h3>
          <pre>${sessao.detalhamento}</pre>
          <div class="text-right mt-4">
            <button class="chip" id="fechar-detalhe">Fechar</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      document.getElementById("fechar-detalhe").onclick = () => modal.remove();
    }


    // Permite debug no console
    window.LioraCore = { els, renderizarPlano };

    console.log("🟢 core.js carregado com sucesso");
  });
})();
