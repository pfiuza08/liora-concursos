// ==========================================================
// 🎯 Liora — Simulador Inteligente de Plano de Estudos (v2 semântico)
// ==========================================================

console.log("🧩 plano-simulador.js (semântico) carregado com sucesso");

window.addEventListener("DOMContentLoaded", () => {
  const btnGerar = document.getElementById("btn-gerar");
  const temaInput = document.getElementById("inp-tema");
  const planoDiv = document.getElementById("plano");
  const status = document.getElementById("status");
  const ctx = document.getElementById("ctx");
  const selDias = document.getElementById("sel-dias");

  if (!btnGerar) {
    console.warn("⚠️ Botão Gerar não encontrado — verifique ID #btn-gerar");
    return;
  }

  btnGerar.addEventListener("click", async () => {
    const tema = temaInput.value.trim() || "Estudo personalizado";
    const dias = parseInt(selDias.value || "5", 10);
    const nivel = window.lioraNivel || "Intermediário";
    const ritmo = window.lioraRitmo || "Moderado";
    const textoBase = state?.materialTexto?.trim() || "";

    status.textContent = "🔄 Analisando tema e gerando plano inteligente...";
    planoDiv.innerHTML = "";
    ctx.textContent = "";

    await new Promise(r => setTimeout(r, 600));

    // ======================================================
    // 🧠 Geração semântica adaptativa
    // ======================================================

    const plano = [];

    if (textoBase.length > 300) {
      // --- Baseado em material enviado ---
      const blocos = textoBase.split(/\n{2,}/).filter(b => b.length > 40);
      const blocosPorDia = Math.ceil(blocos.length / dias);

      for (let i = 0; i < dias; i++) {
        const grupo = blocos.slice(i * blocosPorDia, (i + 1) * blocosPorDia);
        if (!grupo.length) break;

        const textoSessao = grupo.join(" ");
        const analise = typeof analisarSemantica === "function"
          ? analisarSemantica(textoSessao)
          : { titulo: tema, resumo: textoSessao.slice(0, 120) + "...", conceitos: [], densidade: "📘 média" };

        plano.push({
          titulo: `Sessão ${i + 1} — ${analise.titulo}`,
          resumo: analise.resumo,
          densidade: analise.densidade,
          atividades: [
            "📖 Revisar o conteúdo base da sessão",
            "🧩 Anotar conceitos-chave: " + analise.conceitos.slice(0, 5).join(", "),
            "🧠 Realizar autoexplicação e síntese do aprendizado",
            "⏱️ Tempo sugerido: " + (ritmo === "Lento" ? "60–75 min" : ritmo === "Intensivo" ? "25–40 min" : "45–60 min")
          ]
        });
      }
    } else {
      // --- Baseado em tema textual ---
      const estruturaBase = {
        Iniciante: [
          "Compreensão básica dos fundamentos",
          "Exemplos práticos introdutórios",
          "Primeiros exercícios guiados",
          "Pequena revisão com perguntas-chave",
          "Aplicação leve em caso real"
        ],
        Intermediário: [
          "Revisão de fundamentos",
          "Análise de conceitos intermediários",
          "Estudo de caso prático",
          "Exercícios aplicados com desafios",
          "Síntese e revisão final"
        ],
        Avançado: [
          "Exploração de temas complexos",
          "Resolução de problemas avançados",
          "Estudo de artigos e papers",
          "Projeto ou mini pesquisa aplicada",
          "Avaliação e plano de continuidade"
        ]
      };

      const temasBase = estruturaBase[nivel] || estruturaBase.Intermediário;
      const blocosPorDia = Math.ceil(temasBase.length / dias);

      for (let i = 0; i < dias; i++) {
        const bloco = temasBase.slice(i * blocosPorDia, (i + 1) * blocosPorDia);
        if (!bloco.length) break;

        plano.push({
          titulo: `Sessão ${i + 1} — ${tema}`,
          resumo: `Exploração dos conceitos relacionados a "${tema}", em nível ${nivel.toLowerCase()} e ritmo ${ritmo.toLowerCase()}.`,
          densidade: ritmo === "Intensivo" ? "📙 densa" : ritmo === "Lento" ? "📗 leve" : "📘 média",
          atividades: bloco.map(a => "• " + a)
        });
      }
    }

    // ======================================================
    // 🖥️ Renderização do plano
    // ======================================================
    planoDiv.innerHTML = plano.map(sessao => `
      <div class="session-card">
        <div class="flex items-center justify-between mb-1">
          <h3>${sessao.titulo}</h3>
          <span class="text-xs opacity-70">${sessao.densidade}</span>
        </div>
        <p style="font-style:italic;font-size:0.85rem;color:var(--muted);margin-bottom:0.4rem;">
          ${sessao.resumo}
        </p>
        <ul style="margin-left:1rem;list-style:disc;font-size:0.95rem;">
          ${sessao.atividades.map(a => `<li>${a}</li>`).join("")}
        </ul>
      </div>
    `).join("");

    status.textContent = "✅ Plano de estudo gerado com sucesso!";
    ctx.textContent = `Tema: ${tema} · ${dias} sessões (${nivel}, ritmo ${ritmo})`;

    console.log("📘 Plano semântico final:", plano);
  });
});
