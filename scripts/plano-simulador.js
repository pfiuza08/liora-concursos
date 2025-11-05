/* ==========================================================
   📘 plano-simulador.js (versão 9)
   Gera plano de estudos baseado em TEMA + NÍVEL.
   Exposto para o core.js através de: window.gerarPlanoPorTema
   ========================================================== */

console.log("🧩 plano-simulador.js carregado");

/**
 * Gera um plano de estudo baseado em:
 *  - tema digitado
 *  - nível de conhecimento (iniciante / intermediário / avançado)
 *  - número de sessões
 */
function gerarPlanoPorTema({ tema, nivel, dias }) {

  if (!tema || tema.trim() === "") {
    console.warn("⚠️ gerarPlanoPorTema chamado sem tema.");
    return [];
  }

  console.log(`🚀 Gerando plano baseado no tema "${tema}" | nível: ${nivel} | sessões: ${dias}`);

  // ✨ Prompt base para criação de plano
  const estruturaBase = [
    {
      nivel: "iniciante",
      descricao: "Foco em fundamentos, conceitos essenciais e visão geral.",
      distribuicao: ["Introdução", "Visão geral", "Conceitos básicos", "Exemplos práticos", "Resumo final"]
    },
    {
      nivel: "intermediario",
      descricao: "Aprofundamento, exercícios e leitura interpretativa.",
      distribuicao: ["Revisão rápida", "Conceitos médios", "Aplicação prática", "Exercícios dirigidos", "Autoavaliação"]
    },
    {
      nivel: "avancado",
      descricao: "Síntese, resolução de questões, mapas mentais, simulados.",
      distribuicao: ["Síntese", "Estudo dirigido", "Questões comentadas", "Análise crítica", "Simulado + revisão"]
    }
  ];

  const modelo = estruturaBase.find(x => x.nivel === nivel);

  if (!modelo) {
    console.error("❌ Nível não encontrado na estrutura.");
    return [];
  }

  const etapas = modelo.distribuicao;
  const sessoes = [];

  for (let i = 0; i < dias; i++) {

    const etapa = etapas[i % etapas.length];

    sessoes.push({
      dia: i + 1,
      titulo: `Sessão ${i + 1} — ${etapa}`,
      resumo: `${etapa} sobre o tema "${tema}".`,
      conceitos: [tema, etapa],
      densidade: i % 2 === 0 ? "📘 média" : "📗 leve",
      descricao: `Atividades relacionadas à sessão: ${etapa}.`
    });
  }

  console.log("📘 Plano por tema gerado:", sessoes);
  return sessoes;
}

/* ==========================================================
   🔁 EXPORTAÇÃO PARA O core.js
   ========================================================== */

window.gerarPlanoPorTema = gerarPlanoPorTema;
console.log("✅ plano-simulador.js exposto ao core.js");


/* ==========================================================
   🧪 LOG VISUAL PARA TESTE NO CONSOLE
   ========================================================== */
setTimeout(() => {
  console.log("%c✅ plano-simulador.js pronto e conectado ao core.js",
    "background:#00b894;color:white;padding:4px;border-radius:4px");
}, 100);
