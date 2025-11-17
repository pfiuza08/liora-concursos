// ==========================================================
// 🧠 LIORA — SEMANTIC v70
// - Engine neutra de processamento textual
// - Não assume domínio (100% agnóstica)
// - Focada em gerar resumos, planos, microlearning e questões
// - Usa callLLM() do core v70
// ==========================================================

(function () {
  console.log("🔵 Liora Semantic v70 carregado...");

  if (!window.callLLM) {
    console.error("❌ ERRO: callLLM não encontrado. Carregue o core antes.");
    return;
  }

  // --------------------------------------------------------
  // Função auxiliar para montagem de prompts
  // --------------------------------------------------------
  function montarTextoBase(titulo, conteudo) {
    return `
Título detectado: ${titulo || "(sem título detectado)"}

Conteúdo associado:
${typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo, null, 2)}

Observações:
- Não invente conteúdo.
- Não adicione informações externas.
- Todo texto gerado deve ser derivado APENAS do conteúdo acima.
`.trim();
  }

  // --------------------------------------------------------
  // 1. RESUMO DO TÓPICO
  // --------------------------------------------------------
  async function gerarResumoTopico(titulo, conteudo) {
    const base = montarTextoBase(titulo, conteudo);

    return await callLLM(
      "Você é um agente pedagógico neutro que resume conteúdo fielmente.",
      `
Gere um resumo claro, conciso e coerente do conteúdo abaixo.
Não adicione nada. Não extrapole. Não invente.

${base}
`
    );
  }

  // --------------------------------------------------------
  // 2. PLANO DE ESTUDO
  // --------------------------------------------------------
  async function gerarPlanoDeEstudo(titulo, conteudo) {
    const base = montarTextoBase(titulo, conteudo);

    return await callLLM(
      "Você organiza conteúdo em passos de estudo curtos e práticos.",
      `
Gere um plano de estudo baseado SOMENTE no conteúdo abaixo.
Inclua:
- Objetivo geral (1 frase)
- 3 a 5 passos práticos curtos
- Uma pequena ação aplicada (ex: pensar, revisar, reler, registrar)
- Um fechamento rápido

${base}
`
    );
  }

  // --------------------------------------------------------
  // 3. QUESTÕES
  // --------------------------------------------------------
  async function gerarQuestoes(titulo, conteudo) {
    const base = montarTextoBase(titulo, conteudo);

    return await callLLM(
      "Você cria questões derivadas exclusivamente de um texto fornecido.",
      `
Crie questões baseadas apenas no conteúdo abaixo:
- 3 fáceis
- 3 intermediárias
- 2 profundas
- 1 reflexiva (sem gabarito)
Inclua gabarito apenas para as perguntas objetivas.

${base}
`
    );
  }

  // --------------------------------------------------------
  // 4. MAPA MENTAL
  // --------------------------------------------------------
  async function gerarMapaMental(titulo, conteudo) {
    const base = montarTextoBase(titulo, conteudo);

    return await callLLM(
      "Você converte conteúdo em mapa mental textual neutro.",
      `
Crie um mapa mental textual com a seguinte estrutura:

Tema >
  - Subtema >
      - Detalhes
  - Subtema >
      - Detalhes

Não invente conteúdo. Extraia apenas do texto abaixo.

${base}
`
    );
  }

  // --------------------------------------------------------
  // 5. PLANO DE AULA
  // --------------------------------------------------------
  async function gerarPlanoDeAula(titulo, conteudo) {
    const base = montarTextoBase(titulo, conteudo);

    return await callLLM(
      "Você estrutura conteúdo em forma de aula sem assumir área.",
      `
Transforme o conteúdo abaixo em um plano de aula contendo:
- Objetivos
- Conteúdos organizados
- Explicação progressiva
- Atividade simples (derivada do texto)
- Encerramento

Não invente conteúdo.

${base}
`
    );
  }

  // --------------------------------------------------------
  // 6. MICROLEARNING
  // --------------------------------------------------------
  async function gerarMicrolearning(titulo, conteudo) {
    const base = montarTextoBase(titulo, conteudo);

    return await callLLM(
      "Você cria microlearning derivado apenas do conteúdo fornecido.",
      `
Crie um microlearning contendo:
- Mini explicação
- Mini exemplo simples (derivado do texto)
- Mini desafio (pergunta para pensar)
- Aplicação prática genérica

Não invente conteúdo.

${base}
`
    );
  }

  // --------------------------------------------------------
  // API Pública da Liora Semantic
  // --------------------------------------------------------
  window.LioraSemantic = {
    gerarResumoTopico,
    gerarPlanoDeEstudo,
    gerarQuestoes,
    gerarMapaMental,
    gerarPlanoDeAula,
    gerarMicrolearning,
  };

})();
