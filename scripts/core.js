// =============================================
// 🧠 LIORA — CORE v70 CONSOLIDADO (Tema + Upload)
// Compatível com semantic.js v40 e outline-generator v2 (Modelo D)
// =============================================

(function () {
  console.log("🔵 Inicializando Liora Core v70...");

  document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------------
    // ELEMENTOS
    // --------------------------------------------------------
    const els = {
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),

      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
    };

    // --------------------------------------------------------
    // WIZARD
    // --------------------------------------------------------
    window.wizard = {
      tema: null,
      nivel: null,
      sessoes: [],
      plano: [],
      atual: 0,
      origem: null,
    };

    // --------------------------------------------------------
    // Status no painel
    // --------------------------------------------------------
    function atualizarStatus(modo, msg, pct = 0) {
      if (!els.status) return;
      els.status.textContent = msg;
      els.status.dataset.progresso = pct;
    }

    // --------------------------------------------------------
    // callLLM → wrapper geral para IA
    // --------------------------------------------------------
    window.callLLM = async function (systemPrompt, userPrompt) {
      const body = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      };

      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      const data = await r.json();
      return data.choices[0].message.content;
    };

    // --------------------------------------------------------
    // Organização de UI (tema/upload)
    // --------------------------------------------------------
    function ativarTema() {
      els.painelTema.style.display = "block";
      els.painelUpload.style.display = "none";
    }

    function ativarUpload() {
      els.painelTema.style.display = "none";
      els.painelUpload.style.display = "block";
    }

    if (els.modoTema) els.modoTema.onclick = ativarTema;
    if (els.modoUpload) els.modoUpload.onclick = ativarUpload;

    ativarTema(); // padrão

    // --------------------------------------------------------
    // Funções de render (resumo/wizard)
    // --------------------------------------------------------
    window.renderPlanoResumo = function (plano) {
      const el = document.getElementById("plano-resumo");
      if (!el) return;

      el.innerHTML = plano
        .map(p => `<div class='sessao-resumo'>${p.numero}. ${p.nome}</div>`)\
        .join("");
    };

    window.renderWizard = function () {
      const area = document.getElementById("wizard-area");
      if (!area) return;

      const sessao = wizard.sessoes[wizard.atual];
      if (!sessao) return;

      area.innerHTML = `
        <h2>${sessao.titulo}</h2>
        <p><strong>Objetivo:</strong> ${sessao.objetivo || ""}</p>
        <h3>Conteúdo</h3>
        <p>${sessao.conteudo?.introducao || ""}</p>
        <ul>
          ${(sessao.conteudo?.conceitos || []).map(c => `<li>${c}</li>`).join("")}
        </ul>
        <h3>Quiz</h3>
        <p>${sessao.quiz?.pergunta || "Sem quiz gerado"}</p>
        <ol>
          ${(sessao.quiz?.alternativas || []).map(a => `<li>${a}</li>`).join("")}
        </ol>
      `;
    };

    // --------------------------------------------------------
    // GERAR POR TEMA
    // --------------------------------------------------------
    if (els.btnGerar) {
      els.btnGerar.onclick = async () => {
        const tema = (els.inpTema?.value || "").trim();
        const nivel = els.selNivel?.value || "iniciante";

        if (!tema) {
          alert("Digite um tema.");
          return;
        }

        wizard.tema = tema;
        wizard.nivel = nivel;
        wizard.origem = "tema";

        atualizarStatus("tema", "🎯 Gerando plano por tema...", 20);

        const prompt = `Gere um plano de estudo sobre o tema: ${tema}. Formato JSON:
{
  "sessoes": [
    { "titulo": "Título", "objetivo": "..." }
  ]
}`;

        try {
          const raw = await callLLM("Responda apenas JSON.", prompt);
          const json = JSON.parse(raw);

          wizard.sessoes = json.sessoes;
          wizard.plano = json.sessoes.map((s, i) => ({ numero: i + 1, nome: s.titulo }));
          wizard.atual = 0;

          atualizarStatus("tema", "✅ Plano gerado!", 100);
          renderPlanoResumo(wizard.plano);
          renderWizard();
        } catch (err) {
          console.error(err);
          alert("Erro ao gerar plano por tema.");
        }
      };
    }

    // --------------------------------------------------------
    // UPLOAD DE ARQUIVO → Fluxo Modelo D
    // --------------------------------------------------------
    if (els.inpFile) {
      els.inpFile.addEventListener("change", e => {
        const file = e.target.files?.[0];
        let label = document.getElementById("upload-text") || document.querySelector("[data-upload-label]");
        if (label) {
          label.textContent = file ? `Selecionado: ${file.name}` : "Clique ou arraste um arquivo (.pdf)";
        }
      });
    }

    if (els.btnGerarUpload) {
      els.btnGerarUpload.onclick = async () => {
        const file = els.inpFile?.files?.[0];
        const nivel = els.selNivel?.value || "iniciante";

        if (!file) {
          alert("Selecione um PDF.");
          return;
        }

        await fluxoUpload(file, nivel);
      };
    }

    // --------------------------------------------------------
    // FLUXO UPLOAD COMPLETO (Modelo D)
    // --------------------------------------------------------
    async function fluxoUpload(file, nivel) {
      els.btnGerarUpload.disabled = true;
      wizard.origem = "upload";

      try {
        if (file.type !== "application/pdf") {
          alert("Por enquanto a Liora lê apenas PDFs.");
          return;
        }

        atualizarStatus("upload", "📄 Lendo PDF...", 10);

        const blocos = await LioraPDFExtractor.extrairBlocos(file);
        console.log("📄 Blocos extraídos:", blocos);

        const secoes = LioraPDF.construirSecoesAPartirDosBlocos(blocos);
        console.log("🧱 Seções heurísticas:", secoes);

        atualizarStatus("upload", "🧩 Gerando outline...", 30);

        const outlines = await LioraOutline.gerarOutlinesPorSecao(secoes);
        console.log("🧠 Outlines por seção:", outlines);

        const outlineUnico = LioraOutline.unificarOutlines(outlines);
        console.log("🧠 Outline unificado:", outlineUnico);

        atualizarStatus("upload", "📚 Gerando sessões...", 55);

        const planoFinal = await LioraOutline.gerarPlanoDeEstudo(outlineUnico);
        console.log("📘 Plano final:", planoFinal);

        wizard.tema = file.name.replace(/\.pdf$/i, "");
        wizard.nivel = nivel;
        wizard.sessoes = planoFinal.sessoes;
        wizard.plano = planoFinal.sessoes.map((s, i) => ({ numero: i + 1, nome: s.titulo || `Sessão ${i+1}` }));
        wizard.atual = 0;

        atualizarStatus("upload", "✅ Tudo pronto!", 100);
        renderPlanoResumo(wizard.plano);
        renderWizard();

      } catch (err) {
        console.error("Erro no fluxoUpload:", err);
        atualizarStatus("upload", "❌ Erro.", 100);
        alert("Erro ao gerar o plano de estudos a partir do PDF.");
      } finally {
        els.btnGerarUpload.disabled = false;
      }
    }

    console.log("🟢 Liora Core v70 carregado com sucesso");
  });
})();
