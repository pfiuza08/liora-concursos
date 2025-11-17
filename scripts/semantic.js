// ==========================================================
// 🧠 LIORA — SEMANTIC v70.1 (FIX WAIT FOR CORE)
// - Aguarda callLLM ser carregado pelo core.js
// - Remove erro de ordem de carregamento
// ==========================================================

(function () {
  console.log("🔵 Liora Semantic v70 carregado (modo de espera)...");

  function iniciar() {
    if (!window.callLLM) {
      console.log("⏳ Aguardando core.js inicializar callLLM...");
      return false;
    }

    console.log("🟢 Liora Semantic v70 inicializado com sucesso!");

    // --------------------------------------------------------
    // Função auxiliar
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
        `Gere um resumo claro, conciso e coerente. Não invente nada.\n\n${base}`
      );
    }

    // --------------------------------------------------------
    // 2. PLANO DE ESTUDO
    // --------------------------------------------------------
    async function gerarPlanoDeEstudo(titulo, conteudo) {
      const base = montarTextoBase(titulo, conteudo);
      return await callLLM(
        "Você organiza conteúdo em passos curtos.",
        `Gere um plano de estudo curto baseado SOMENTE no texto abaixo.\n\n${base}`
      );
    }

    // --------------------------------------------------------
    // 3. QUESTÕES
    // --------------------------------------------------------
    async function gerarQuestoes(titulo, conteudo) {
      const base = montarTextoBase(titulo, conteudo);
      return await callLLM(
        "Você cria questões apenas com base no texto fornecido.",
        `Crie questões (3 fáceis, 3 médias, 2 profundas, 1 reflexiva).\n\n${base}`
      );
    }

    // --------------------------------------------------------
    // 4. MAPA MENTAL
    // --------------------------------------------------------
    async function gerarMapaMental(titulo, conteudo) {
      const base = montarTextoBase(titulo, conteudo);
      return await callLLM(
        "Você converte conteúdo em mapa mental textual.",
        `Estruture um mapa mental textual derivado do conteúdo.\n\n${base}`
      );
    }

    // --------------------------------------------------------
    // 5. PLANO DE AULA
    // --------------------------------------------------------
    async function gerarPlanoDeAula(titulo, conteudo) {
      const base = montarTextoBase(titulo, conteudo);
      return await callLLM(
        "Você cria planos de aula neutros.",
        `Transforme o conteúdo abaixo em um plano de aula.\n\n${base}`
      );
    }

    // --------------------------------------------------------
    // 6. MICROLEARNING
    // --------------------------------------------------------
    async function gerarMicrolearning(titulo, conteudo) {
      const base = montarTextoBase(titulo, conteudo);
      return await callLLM(
        "Você cria microlearning baseado apenas no texto.",
        `Crie um microlearning com mini explicação, exemplo e desafio.\n\n${base}`
      );
    }

    // Expõe API pública
    window.LioraSemantic = {
      gerarResumoTopico,
      gerarPlanoDeEstudo,
      gerarQuestoes,
      gerarMapaMental,
      gerarPlanoDeAula,
      gerarMicrolearning,
    };

    return true;
  }

  // --------------------------------------------------------
  // Aguarda o core.js expor window.callLLM
  // --------------------------------------------------------
  const intervalo = setInterval(() => {
    if (iniciar()) clearInterval(intervalo);
  }, 50);

})();
