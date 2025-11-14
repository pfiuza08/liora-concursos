// ===============================
// 🧠 outline-generator.js
// Gera outline por seção, unifica e cria plano de estudo (sessões)
// Depende de: LioraPDF.construirSecoesAPartirDosBlocos
// ===============================
(function () {
  console.log("🔵 Liora Outline Generator carregado...");

  /**
   * Função adaptadora para sua camada de IA.
   * TROQUE este miolo para usar sua infra real (OpenAI, SemanticLiora, etc.)
   *
   * @param {Array<{role:string,content:string}>} messages
   * @param {Object} [options]
   * @returns {Promise<string>} - conteúdo textual da resposta
   */
  /**
 * Adaptador para a IA usando o backend da Liora
 * (usa exatamente a mesma rota que o modo TEMA usa)
 */
async function chamarIA(messages, options = {}) {
  if (typeof window.callLLM === "function") {
    // Mensagem de system + user concatenada, como no fluxo de TEMA
    const system = messages.find(m => m.role === "system")?.content || "";
    const user = messages.find(m => m.role === "user")?.content || "";

    const raw = await window.callLLM(system, user);

    // callLLM já retorna apenas output
    return raw;
  }

  throw new Error("callLLM() não encontrado. Certifique-se de que core.js foi carregado antes.");
}

  /**
   * Gera um mini-outline para cada seção do PDF
   * @param {Array<{titulo:string,conteudo:string}>} secoes
   * @returns {Promise<Array<{secaoTitulo:string, outline:Array}>>}
   */
  async function gerarOutlinesPorSecao(secoes) {
    const resultados = [];

    for (const secao of secoes) {
      const promptUsuario = `
Você receberá uma seção de uma apostila ou livro didático.

Título da seção: "${secao.titulo}"

Conteúdo da seção (parcial do PDF):
"""
${secao.conteudo}
"""

Sua tarefa: gerar um outline estruturado SOMENTE do que está nesse texto.

Formato da resposta (JSON válido, sem comentários):

{
  "secaoTitulo": "Título coerente da seção (pode ajustar levemente o original)",
  "topicos": [
    {
      "titulo": "Subtítulo ou tópico principal",
      "subtopicos": [
        "subtópico 1",
        "subtópico 2"
      ]
    }
  ]
}

Regras:
- Não invente conteúdos que não aparecem no texto.
- Não resuma o texto em parágrafos, apenas crie a estrutura de tópicos.
- Respeite a ordem pedagógica do conteúdo.
      `.trim();

      const messages = [
        {
          role: "system",
          content: "Você é uma IA especialista em design instrucional e organização de conteúdo educacional."
        },
        {
          role: "user",
          content: promptUsuario
        }
      ];

      const resposta = await chamarIA(messages, { temperature: 0.2, max_tokens: 1200 });

      let json;
      try {
        const limpo = resposta.trim().replace(/```json/g, "").replace(/```/g, "");
        json = JSON.parse(limpo);
      } catch (e) {
        console.warn("⚠️ Falha ao parsear JSON do outline da seção, retornando estrutura mínima.", e);
        json = {
          secaoTitulo: secao.titulo || "Seção",
          topicos: [
            {
              titulo: secao.titulo || "Tópicos principais",
              subtopicos: []
            }
          ]
        };
      }

      resultados.push(json);
    }

    console.log("🧠 Outlines por seção:", resultados);
    return resultados;
  }

  /**
   * Unifica os outlines por seção em um único outline global
   * @param {Array<Object>} outlinesSecao
   * @returns {Promise<Array<{sessao:string,topicos:Array}>>}
   */
  async function unificarOutlines(outlinesSecao) {
    const entrada = JSON.stringify(outlinesSecao, null, 2);

    const promptUsuario = `
Você receberá uma lista de outlines de seções de um PDF educacional, no formato:

${entrada}

Sua tarefa:
1. Unificar tudo em um único OUTLINE global.
2. Remover repetições.
3. Manter a ordem pedagógica.
4. Organizar em "sessões" ou "grandes blocos" de estudo.

Formato da resposta (JSON válido, sem comentários):

{
  "outline": [
    {
      "sessao": "Nome da sessão ou grande bloco de estudo",
      "topicos": [
        {
          "titulo": "Tópico principal dentro da sessão",
          "subtopicos": [
            "subtópico 1",
            "subtópico 2"
          ]
        }
      ]
    }
  ]
}

Não invente assuntos novos, apenas reorganize o que já existe.
    `.trim();

    const messages = [
      {
        role: "system",
        content: "Você é uma IA especialista em currículos, outlines e organização de conteúdo para estudo."
      },
      {
        role: "user",
        content: promptUsuario
      }
    ];

    const resposta = await chamarIA(messages, { temperature: 0.2, max_tokens: 1800 });

    try {
      const limpo = resposta.trim().replace(/```json/g, "").replace(/```/g, "");
      const json = JSON.parse(limpo);
      console.log("🧠 Outline unificado:", json);
      return json.outline || [];
    } catch (e) {
      console.error("❌ Erro ao parsear JSON do outline unificado.", e);
      return [];
    }
  }

  /**
   * Gera as sessões de estudo da Liora a partir do outline global.
   * Aqui você pode alinhar com o formato que já usa para TEMA.
   *
   * @param {Array<Object>} outlineGlobal
   * @param {string} nivel - "iniciante" | "intermediario" | "avancado"
   * @returns {Promise<Object>} planoDeEstudo
   */
  async function gerarPlanoDeEstudoAPartirDoOutline(outlineGlobal, nivel) {
    const entrada = JSON.stringify(outlineGlobal, null, 2);

    const promptUsuario = `
Você receberá um OUTLINE global de um conteúdo educacional, com sessões e tópicos:

${entrada}

Crie um PLANO DE ESTUDO no formato Liora, com sessões de microlearning.

Formato da resposta (JSON válido, sem comentários):

{
  "nivel": "${nivel}",
  "sessoes": [
    {
      "id": 1,
      "titulo": "Título da sessão",
      "objetivos": [
        "Objetivo 1",
        "Objetivo 2"
      ],
      "topicos": [
        "Tópico 1",
        "Tópico 2"
      ],
      "atividades": [
        "Atividade sugerida 1",
        "Atividade sugerida 2"
      ],
      "revisao": "Sugestão de revisão curta"
    }
  ]
}

Regras:
- Mantenha a fidelidade total ao outline.
- Distribua o conteúdo em sessões curtas e focadas (microlearning).
- Ajuste a profundidade das explicações ao nível "${nivel}".
    `.trim();

    const messages = [
      {
        role: "system",
        content: "Você é uma IA instrucional que transforma outlines em planos de estudo em microlearning."
      },
      {
        role: "user",
        content: promptUsuario
      }
    ];

    const resposta = await chamarIA(messages, { temperature: 0.3, max_tokens: 2200 });

    try {
      const limpo = resposta.trim().replace(/```json/g, "").replace(/```/g, "");
      const json = JSON.parse(limpo);
      console.log("📚 Plano de estudo gerado a partir do outline:", json);
      return json;
    } catch (e) {
      console.error("❌ Erro ao parsear o plano de estudo JSON.", e);
      return {
        nivel,
        sessoes: []
      };
    }
  }

  // Expõe no escopo global
  window.LioraAI = window.LioraAI || {};
  window.LioraAI.gerarOutlinesPorSecao = gerarOutlinesPorSecao;
  window.LioraAI.unificarOutlines = unificarOutlines;
  window.LioraAI.gerarPlanoDeEstudoAPartirDoOutline = gerarPlanoDeEstudoAPartirDoOutline;
})();
