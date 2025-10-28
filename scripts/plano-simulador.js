// ==========================================================
// 🎯 Liora — Simulador Inteligente de Plano de Estudos (v3 semântico)
// ==========================================================
// Integra o módulo semantic.js para gerar planos adaptativos
// com base no tema, nível de dificuldade e ritmo de estudo.
// ==========================================================

console.log("🧩 plano-simulador.js (v3) carregado com sucesso");

// ==========================================================
// 🧠 Função principal — geração adaptativa do plano
// ==========================================================
window.addEventListener("DOMContentLoaded", () => {
  const btnGerar = document.getElementById("btn-gerar");
  const temaInput = document.getElementById("inp-tema");
  const planoDiv = document.getElementById("plano");
  const status = document.getElementById("status");
  const ctx = document.getElementById("ctx");
  const selDias = document.getElementById("sel-dias");

  if (!btnGerar) {
    console.warn("⚠️ Botão 'Gerar plano' não encontrado — verifique o ID.");
    return;
  }

  btnGerar.addEventListener("click", async () => {
    const tema = temaInput.value.trim() || "Estudo Personalizado";
    const dias = parseInt(selDias.value || "5", 10);
    const nivel = window.lioraNivel || "Intermediário";
    const ritmo = window.lioraRitmo || "Moderado";
    const textoBase = (state?.materialTexto || "").trim();

    planoDiv.innerHTML = "";
    ctx.textContent = "";
    status.textContent = "🔄 Gerando plano adaptativo...";

    await new Promise(r => setTimeout(r, 500));

    const plano = [];

    // ======================================================
    // 📘 Cenário 1: Material enviado pelo usuário
    // ======================================================
    if (textoBase.length > 200) {
      const blocos = textoBase.split(/\n{2,}/).filter(b => b.length > 40);
      const blocosPorDia = Math.ceil(blocos.length / dias);

      for (let i = 0; i < dias; i++) {
        const grupo = blocos.slice(i * blocosPorDia, (i + 1) * blocosPorDia);
        if (!grupo.length) break;

        const textoSessao = grupo.join(" ");
        const sem = typeof analisarSemantica === "function" ? analisarSemantica(textoSessao) : {
          titulo: tema, resumo: textoSessao.slice(0, 100), conceitos: [], densidade: "📘 média"
        };

        const diversidade = typeof diversidadeLexical === "function"
          ? diversidadeLexical(textoSessao)
          : "⚖️ Moderado";

        plano.push({
          titulo: `Sessão ${i + 1} — ${sem.titulo}`,
          resumo: sem.resumo,
          densidade: sem.densidade,
          diversidade,
          atividades: [
            `📖 Ler o trecho principal e identificar conceitos-chave: ${sem.conceitos.slice(0, 5).join(", ")}`,
            "🧠 Fazer anotações em tópicos e resumo pessoal.",
            "💬 Explicar o conteúdo em voz alta com suas palavras.",
            ritmo === "Intensivo" ? "⏱️ Estudar por 30–40 minutos com pausas curtas." :
            ritmo === "Lento" ? "⏱️ Estudar 60–75 minutos de forma leve e reflexiva." :
            "⏱️ Estudar 45–60 minutos mantendo foco moderado."
          ]
        });
      }
    }

    // ======================================================
    // 📗 Cenário 2: Tema textual sem material
    // ======================================================
    else {
      const estruturas = {
        Iniciante: [
          "Introdução aos fundamentos do tema.",
          "Conceitos básicos e primeiros exemplos.",
          "Exercícios guiados simples.",
          "Mini revisão e autoexplicação.",
          "Aplicação leve em contexto prático."
        ],
        Intermediário: [
          "Revisão dos fundamentos e ampliação de vocabulário técnico.",
          "Estudo de caso e análise comparativa.",
          "Resolução de exercícios práticos com feedback.",
          "Síntese de ideias e conexões entre conceitos.",
          "Revisão geral e simulado parcial."
        ],
        Avançado: [
          "Exploração de tópicos complexos e debates conceituais.",
          "Resolução de problemas desafiadores.",
          "Leitura crítica de artigos técnicos ou papers.",
          "Produção de resumo técnico e mapa conceitual.",
          "Revisão final com simulado abrangente."
        ]
      };

      const base = estruturas[nivel] || estruturas.Intermediário;
      const blocosPorDia = Math.ceil(base.length / dias);

      for (let i = 0; i < dias; i++) {
        const bloco = base.slice(i * blocosPorDia, (i + 1) * blocosPorDia);
        if (!bloco.length) break;

        plano.push({
          titulo: `Sessão ${i + 1} — ${tema}`,
          resumo: `Exploração de "${tema}" no nível ${nivel.toLowerCase()}, ritmo ${ritmo.toLowerCase()}.`,
          densidade: ritmo === "Intensivo" ? "📙 densa" : ritmo === "Lento" ? "📗 leve" : "📘 média",
          diversidade: "⚖️ Moderado",
          atividades: bloco.map(a => "• " + a)
        });
      }
    }

    // ======================================================
    // 🧾 Renderização final
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
        <p class="text-xs text-[var(--muted)] mt-2">${sessao.diversidade}</p>
      </div>
    `).join("");

    status.textContent = "✅ Plano de estudo semântico gerado com sucesso!";
    ctx.textContent = `Tema: ${tema} · ${dias} sessões (${nivel}, ritmo ${ritmo})`;
    console.log("📘 Plano semântico final:", plano);
  });
});

// ==========================================================
// 🌐 Exporta função principal (opcional, para debug externo)
// ==========================================================
window.LioraGerarPlano = true;
console.log("✅ plano-simulador.js pronto e conectado ao semantic.js");
