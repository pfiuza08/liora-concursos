// ======================================================================
// 🎯 plano-simulador.js
// Gera plano de estudo baseado em TEMA + NÍVEL + RITMO (nº de sessões)
// Integra com core.js via window.LioraCore.previewAndConfirmPlan()
// ======================================================================

console.log("🧩 plano-simulador.js carregado com sucesso");

// ----------------------------------------------------------------------
// 🧠 Base de geração do plano (sem IA por enquanto)
// Posteriormente podemos substituir por chamada GPT via backend
// ----------------------------------------------------------------------

/**
 * Fragmenta um conteúdo em sessões balanceadas.
 * @param {Array<string>} topicos
 * @param {number} sessoes
 */
function distribuirPorSessoes(topicos, sessoes) {
  const porDia = Math.ceil(topicos.length / sessoes);
  const resultado = [];

  for (let i = 0; i < sessoes; i++) {
    const slice = topicos.slice(i * porDia, (i + 1) * porDia);
    if (!slice.length) break;

    resultado.push({
      titulo: slice[0].length > 50 ? `Sessão ${i + 1}` : slice[0],
      resumo: slice.join(". ").substring(0, 180) + "...",
      descricao: slice.map(t => "• " + t).join("\n"),
      conceitos: slice.slice(0, 4),
      densidade: slice.length > 4 ? "📙 densa" : "📘 média"
    });
  }

  return resultado;
}

/**
 * Modelos por nível de conhecimento
 */
const MAPA_NIVEL = {
  iniciante: (tema) => [
    `Introdução ao tema: ${tema}`,
    `Por que esse tema é importante`,
    `Principais conceitos básicos`,
    `Exemplos práticos do dia a dia`,
    `Mini revisão dos conceitos`
  ],

  intermediario: (tema) => [
    `Revisão dos fundamentos essenciais de ${tema}`,
    `Subtemas importantes dentro de ${tema}`,
    `Aplicações práticas com estudos de caso`,
    `Identificação de padrões e erros comuns`,
    `Exercícios práticos para fixação`
  ],

  avancado: (tema) => [
    `Aspectos avançados e detalhes técnicos de ${tema}`,
    `Solução de problemas complexos`,
    `Análise crítica e comparação com outros temas`,
    `Aplicação avançada e experimentação`,
    `Preparação para prova ou apresentação`
  ],
};

// ----------------------------------------------------------------------
// 🚀 Função principal chamada pelo core.js
// ----------------------------------------------------------------------

function generatePlanTema({ tema, nivel, sessoes }) {
  console.log("➡️ Gerando plano por tema:", { tema, nivel, sessoes });

  if (!tema || !nivel) {
    throw new Error("Tema e nível são obrigatórios para gerar plano.");
  }

  const topicosGerados =
    typeof MAPA_NIVEL[nivel] === "function"
      ? MAPA_NIVEL[nivel](tema)
      : MAPA_NIVEL.iniciante(tema);

  const sessoesGeradas = distribuirPorSessoes(topicosGerados, sessoes);

  return {
    origem: "tema",
    sessoes: sessoesGeradas,
    meta: { tema, nivel }
  };
}

// ----------------------------------------------------------------------
// 📡 Exporta para core.js
// ----------------------------------------------------------------------
window.LioraSim = {
  generatePlan: generatePlanTema,
};

console.log("✅ plano-simulador.js pronto e conectado ao core.js");
