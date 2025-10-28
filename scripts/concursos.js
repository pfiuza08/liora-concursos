// ==========================================================
// 🏆 Liora — concursos.js
// Extensão de funcionalidades para estudo de concursos,
// certificações e simulados baseados no plano principal.
// ==========================================================

// Aguarda o carregamento completo
window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Módulo de concursos carregado com sucesso.");

  // ======================================================
  // 🔹 Verificação do estado global
  // ======================================================
  const s = window.state || {};
  if (!s) {
    console.warn("⚠️ Estado global (window.state) não encontrado.");
    return;
  }

  // ======================================================
  // 🧾 Função auxiliar: gerar simulado a partir do plano
  // ======================================================
  window.Concursos = {
    /**
     * Gera questões baseadas nas sessões do plano ativo
     * (modo puramente textual — protótipo inicial)
     */
    gerarSimulado() {
      if (!s.plano || !s.plano.length) {
        alert("⚠️ Nenhum plano gerado ainda. Gere um plano primeiro.");
        return [];
      }

      const questoes = [];

      s.plano.forEach((sessao, i) => {
        const conceitos = sessao.conceitos.slice(0, 3);
        conceitos.forEach((conceito, j) => {
          questoes.push({
            id: `${i + 1}.${j + 1}`,
            pergunta: `O que significa o conceito "${conceito}" no contexto da sessão ${i + 1}?`,
            opcoes: [
              `Está relacionado ao tema principal: ${sessao.titulo}`,
              `É uma palavra-chave sem relevância específica.`,
              `Corresponde ao autor ou referência usada.`,
              `Nenhuma das alternativas anteriores.`
            ],
            correta: 0,
            nivel: sessao.densidade.includes("densa") ? "Avançado" :
                   sessao.densidade.includes("média") ? "Intermediário" : "Básico"
          });
        });
      });

      console.log("🎯 Simulado gerado:", questoes.length, "questões.");
      return questoes;
    },

    /**
     * Exibe um simulado no painel direito
     */
    renderizarSimulado() {
      const questoes = this.gerarSimulado();
      const planoDiv = document.getElementById("plano");
      planoDiv.innerHTML = "";

      if (!questoes.length) {
        planoDiv.innerHTML = `<p class="text-sm text-[var(--muted)]">Nenhum simulado disponível.</p>`;
        return;
      }

      const container = document.createElement("div");
      container.className = "card p-4";

      const header = document.createElement("h3");
      header.textContent = "🧩 Simulado — Teste seus conhecimentos";
      header.className = "text-lg font-semibold mb-4";
      container.appendChild(header);

      questoes.slice(0, 10).forEach((q, idx) => {
        const div = document.createElement("div");
        div.className = "mb-4";
        div.innerHTML = `
          <p class="font-medium mb-2">${idx + 1}. ${q.pergunta}</p>
          <div class="space-y-1">
            ${q.opcoes.map((opt, k) => `
              <label class="block text-sm">
                <input type="radio" name="q${idx}" value="${k}" class="mr-2">
                ${opt}
              </label>
            `).join("")}
          </div>
        `;
        container.appendChild(div);
      });

      // Botão de correção
      const btnCorrigir = document.createElement("button");
      btnCorrigir.className = "btn w-full mt-3";
      btnCorrigir.textContent = "Corrigir simulado";
      btnCorrigir.addEventListener("click", () => window.Concursos.corrigirSimulado(questoes));
      container.appendChild(btnCorrigir);

      planoDiv.appendChild(container);
    },

    /**
     * Corrige o simulado e exibe o resultado com feedback
     */
    corrigirSimulado(questoes) {
      let acertos = 0;

      questoes.slice(0, 10).forEach((q, idx) => {
        const selecionado = document.querySelector(`input[name="q${idx}"]:checked`);
        if (selecionado && parseInt(selecionado.value, 10) === q.correta) {
          acertos++;
        }
      });

      const total = Math.min(10, questoes.length);
      const pct = ((acertos / total) * 100).toFixed(1);

      const resultado = document.createElement("div");
      resultado.className = "card mt-5 p-4 text-center";
      resultado.innerHTML = `
        <h4 class="text-lg font-semibold mb-2">📊 Resultado</h4>
        <p>Você acertou <strong>${acertos}</strong> de <strong>${total}</strong> questões (${pct}%).</p>
        <p class="text-sm text-[var(--muted)] mt-2">
          ${
            pct >= 80
              ? "Excelente desempenho! Continue assim. 🚀"
              : pct >= 60
              ? "Bom resultado! Revise alguns pontos. 💪"
              : "Precisa revisar o conteúdo com mais atenção. 📚"
          }
        </p>
      `;

      const planoDiv = document.getElementById("plano");
      planoDiv.appendChild(resultado);
    }
  };

  // ======================================================
  // 🔘 Botão flutuante para o simulado
  // ======================================================
  function criarIconeSimulado() {
    document.getElementById("icone-simulado")?.remove();

    const icone = document.createElement("div");
    icone.id = "icone-simulado";
    icone.innerHTML = "🧩";
    icone.title = "Gerar simulado";
    icone.style.position = "fixed";
    icone.style.bottom = "24px";
    icone.style.left = "24px";
    icone.style.background = "var(--brand)";
    icone.style.color = "#fff";
    icone.style.fontSize = "1.4rem";
    icone.style.borderRadius = "50%";
    icone.style.width = "52px";
    icone.style.height = "52px";
    icone.style.display = "flex";
    icone.style.alignItems = "center";
    icone.style.justifyContent = "center";
    icone.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";
    icone.style.cursor = "pointer";
    icone.style.transition = "transform 0.2s ease, box-shadow 0.3s ease";
    icone.style.zIndex = "2000";

    icone.addEventListener("mouseenter", () => {
      icone.style.transform = "scale(1.08)";
      icone.style.boxShadow = "0 6px 20px rgba(0,0,0,0.5)";
    });
    icone.addEventListener("mouseleave", () => {
      icone.style.transform = "scale(1)";
      icone.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";
    });

    icone.addEventListener("click", () => window.Concursos.renderizarSimulado());
    document.body.appendChild(icone);
  }

  // Cria o ícone automaticamente
  criarIconeSimulado();
});
