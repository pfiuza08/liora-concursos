// ==========================================================
// 🧠 LIORA — CORE PRINCIPAL (v13)
// Tema e Upload AUTOMÁTICOS (IA decide sessões)
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

    // Tema claro/escuro
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

    // Progress bar
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

    // Alternância Tema/Upload
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

    // Upload — processamento do arquivo
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

    // Modal de preview
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

    // Gerar plano — Upload (automático: 1 tópico = 1 sessão)
    els.btnGerarUpload?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (UPLOAD)");
      if (!window.gerarPlanoPorUpload) {
        alert("❌ Módulo semantic.js não está pronto.");
        return;
      }

      const loading = iniciarProgresso();

      try {
        const out = await window.gerarPlanoPorUpload(); // agora sem arg
        const { sessoes, plano } = normalizeOutput(out);
        finalizarProgresso(loading);
        els.ctx.textContent = `📘 ${sessoes} sessões geradas automaticamente — baseado na análise do material enviado.`;
        renderizarPlano(plano);
      } catch (err) {
        finalizarProgresso(loading);
        console.error(err);
        alert("❌ Erro ao gerar plano por upload.");
      }
    });

    // Gerar plano — Tema (automático: IA decide nº de sessões)
    els.btnGerar?.addEventListener("click", async () => {
      console.log("▶️ Botão Gerar (TEMA)");

      const tema = els.inpTema.value.trim();
      const nivel = els.selNivel.value;
      if (!tema) return alert("Digite um tema.");

      if (!window.generatePlanByTheme) {
        alert("❌ Módulo de plano por tema não está pronto.");
        return;
      }

      const loading = iniciarProgresso();

      try {
        const out = await window.generatePlanByTheme(tema, nivel); // sem sessoes
        const { sessoes, plano } = normalizeOutput(out);
        finalizarProgresso(loading);
        els.ctx.textContent = `📘 ${sessoes} sessões geradas automaticamente — baseado no nível ${nivel} e na complexidade estimada do tema.`;
        renderizarPlano(plano);
      } catch (err) {
        finalizarProgresso(loading);
        console.error(err);
        alert("❌ Falha ao gerar plano.");
      }
    });

    // Normaliza saída (aceita {sessoes, plano} OU array legado)
    function normalizeOutput(out) {
      if (Array.isArray(out)) {
        return { sessoes: out.length, plano: out };
      }
      const sessoes = Number(out?.sessoes || out?.total_sessoes || (out?.plano?.length || 0));
      const plano = Array.isArray(out?.plano) ? out.plano : [];
      return { sessoes, plano };
    }

    // Renderização do plano
    function renderizarPlano(plano) {
      if (!Array.isArray(plano)) {
        console.error("❌ Plano inválido:", plano);
        alert("Erro ao construir o plano.");
        return;
      }

      els.plano.innerHTML = "";
      plano.forEach(sessao => {
        const titulo = sessao.titulo || "Sessão";
        const resumo = sessao.resumo || "Objetivo não informado.";
        const conteudo = (sessao.conteudo && String(sessao.conteudo).trim()) ||
          "• Conceitos principais\n• Exemplos práticos\n• Exercícios de fixação";

        const div = document.createElement("div");
        div.className = "session-card";
        div.innerHTML = `
          <h3>${titulo}</h3>
          <p class="text-[var(--muted)] text-sm mb-2">${resumo}</p>
          <pre>${conteudo}</pre>
        `;
        els.plano.appendChild(div);
      });

      console.log("✅ Plano renderizado.");
    }

    window.LioraCore = { els, renderizarPlano };
    console.log("🟢 core.js carregado com sucesso");
  });
})();
