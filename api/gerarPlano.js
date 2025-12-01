// ==========================================================
// 🧠 LIORA — GERADOR DE PLANO POR TEMA v75-P0.4
// - Sessões densas e adaptativas por nível
// - Perfis de banca para concursos/avaliações públicas (ENEM, ENEMED, CESPE, FGV, OAB, GERAL)
// - Quiz forte, flashcards garantidos, mapa mental consistente
// - JSON robusto com limpeza + retry
// - Compatível com CORE v74 (retorna plano como string JSON do array de sessões)
// ==========================================================

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const { tema, nivel, sessoes, banca } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({ error: "Parâmetros incompletos." });
    }

    const nivelNorm = String(nivel || "").toLowerCase();
    const bancaNorm = String(banca || "").toUpperCase().trim() || "GERAL";

    // número adaptativo de sessões
    const qtdSessoes = Math.max(6, Math.min(12, Number(sessoes) || 8));

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // ==========================================================
    // 🎯 PERFIL POR NÍVEL
    // ==========================================================
    let perfilNivel = "";

    if (nivelNorm === "iniciante") {
      perfilNivel = `
NÍVEL DO ESTUDANTE: INICIANTE.
- Use linguagem acessível, mas sem infantilizar.
- Explique termos técnicos quando aparecerem.
- Foque mais em exemplos e analogias do que em detalhes formais.
- Mantenha as sessões mais curtas e bem segmentadas.
- Quiz com perguntas diretas, sem pegadinhas pesadas.
- Flashcards abordam definições básicas e ideias principais.`;
    } else if (nivelNorm === "avancado" || nivelNorm === "avançado") {
      perfilNivel = `
NÍVEL DO ESTUDANTE: AVANÇADO.
- Vá mais fundo em conceitos, premissas e consequências.
- Use terminologia técnica de forma natural.
- Traga aplicações complexas, casos de prova difíceis e nuances.
- Quiz com alternativas muito próximas e explicações detalhadas.
- Flashcards enfatizam detalhes, exceções e comparações finas.`;
    } else {
      // intermediário (padrão)
      perfilNivel = `
NÍVEL DO ESTUDANTE: INTERMEDIÁRIO.
- Combine clareza com boa densidade conceitual.
- Misture exemplos cotidianos com situações de prova.
- Aprofunde além do superficial, mas sem ser hermético.
- Quiz com pegadinhas moderadas, evitando excesso de decoreba.
- Flashcards misturam definições e aplicações.`;
    }

    // ==========================================================
    // 🎯 PERFIL POR BANCA / TIPO DE AVALIAÇÃO
    // (Somente concursos / avaliações públicas, sem TI/Finanças)
// ==========================================================
    let perfilBanca = `
BANCA/AVALIAÇÃO: GERAL (CONCURSOS OU AVALIAÇÕES PÚBLICAS).
- Estilo objetivo, voltado para provas de múltipla escolha.
- Linguagem clara, mas com rigor conceitual.
- Traga exemplos ligados a situações de prova.`;

    if (bancaNorm.includes("ENEM")) {
      perfilBanca = `
BANCA/AVALIAÇÃO: ENEM / AVALIAÇÕES ESTILO ENEM.
- Linguagem acessível, contextualizada e interdisciplinar.
- Conecte os conceitos a situações do cotidiano, cidadania, tecnologia e sociedade.
- Quiz deve simular questões de múltipla escolha em contexto (enunciado interpretativo + cobrança de conceito).
- Evite jargão excessivamente técnico.`;
    } else if (bancaNorm.includes("ENAMED")) {
      perfilBanca = `
BANCA/AVALIAÇÃO: ENAMED (avaliação médica nacional).
- Foco em casos clínicos, raciocínio diagnóstico e conduta.
- Use linguagem técnica da área de saúde, mas clara.
- Quiz deve lembrar questões baseadas em casos, com alternativas que representem condutas diagnósticas ou terapêuticas.`;
    } else if (
      bancaNorm.includes("CESPE") ||
      bancaNorm.includes("CEBRASPE")
    ) {
      perfilBanca = `
BANCA/AVALIAÇÃO: CESPE/CEBRASPE.
- Foco em precisão conceitual e distinção entre afirmações corretas e incorretas.
- Mesmo usando formato de múltipla escolha, construa alternativas que possam ser confundidas se o estudante não dominar o conteúdo.
- Evite enunciados longos, mas garanta alta densidade de informação.
- Destaque nuances, exceções e detalhes que costumam ser cobrados.`;
    } else if (bancaNorm.includes("FGV")) {
      perfilBanca = `
BANCA/AVALIAÇÃO: FGV.
- Textos mais densos, com foco em interpretação e raciocínio lógico/conceitual.
- Traga exemplos extraídos de contextos jurídicos, econômicos ou administrativos, quando fizer sentido.
- Quiz com alternativas longas e muito próximas.
- Explique com cuidado por que as demais alternativas não são corretas.`;
    } else if (bancaNorm.includes("OAB")) {
      perfilBanca = `
BANCA/AVALIAÇÃO: OAB.
- Foco em aplicação jurídica: normas, princípios, jurisprudência e casos.
- Use exemplos de peças, situações práticas e casos hipotéticos.
- Quiz simulando primeira fase: múltipla escolha baseada em cenário jurídico ou norma.
- Flashcards devem destacar fundamentos legais, conceitos e distinções entre institutos.`;
    }

    // ==========================================================
    // 🧠 PROMPT PROFISSIONAL P0.4
    // ==========================================================
    const prompt = `
Você é a IA da Liora, especialista em estudo estratégico para concursos e avaliações públicas.

Crie EXATAMENTE ${qtdSessoes} sessões de estudo densas, didáticas e úteis para:

TEMA: ${tema}
NÍVEL: ${nivel}
BANCA/ESTILO: ${bancaNorm}

CONSIDERE:
${perfilNivel}

E TAMBÉM:
${perfilBanca}

⚠️ SAÍDA OBRIGATÓRIA: APENAS JSON VÁLIDO, NO FORMATO:

{
  "origem": "tema",
  "tema": "${tema}",
  "nivel": "${nivel}",
  "banca": "${bancaNorm}",
  "sessoes": [
    {
      "titulo": "Título claro e específico da sessão",
      "objetivo": "Objetivo único e bem definido, começando com verbo no infinitivo",
      "conteudo": {
        "introducao": "2–3 frases conectando o assunto com o contexto de prova.",
        "conceitos": [
          "3–6 conceitos ou ideias principais da sessão, sem redundância."
        ],
        "exemplos": [
          "2–4 exemplos aplicados, de preferência lembrando enunciados de prova."
        ],
        "aplicacoes": [
          "2–4 aplicações práticas, situações reais ou de prova."
        ],
        "resumoRapido": [
          "4–6 bullets curtos com o que não pode ser esquecido."
        ]
      },
      "analogias": [
        "1–2 analogias que facilitem a compreensão do tema por comparação com algo conhecido."
      ],
      "ativacao": [
        "2–4 perguntas que façam o estudante pensar, não decorar.",
        "Podem ser perguntas abertas ou estilo 'explique por que...'"
      ],
      "quiz": {
        "pergunta": "Pergunta objetiva, típica de prova, baseada no conteúdo da sessão.",
        "alternativas": [
          "Alternativa A coerente",
          "Alternativa B plausível",
          "Alternativa C parcialmente correta ou incompleta",
          "Alternativa D incorreta, mas verossímil"
        ],
        "corretaIndex": 0,
        "explicacao": "Explique claramente por que a alternativa correta está certa e as outras não."
      },
      "flashcards": [
        { "q": "Pergunta-chave sobre conceito importante", "a": "Resposta objetiva e sintética" },
        { "q": "Outra pergunta que poderia cair na prova", "a": "Resposta direta, sem rodeios" },
        { "q": "Ponto que costuma gerar confusão", "a": "Explicação clara, em 1–2 frases" }
      ],
      "mindmap": "Mapa mental textual do conteúdo da sessão, com 2–3 níveis, no formato: A > B > C | X > Y | ..."
    }
  ]
}

REGRAS CRÍTICAS:
- NÃO escreva nada fora do JSON.
- NÃO coloque comentários no JSON.
- NÃO deixe listas vazias.
- NÃO repita a mesma ideia com palavras diferentes.
- Foque em clareza, aplicação em prova e utilidade real para o estudante.
- O JSON deve ser 100% válido e parseável em JavaScript.
`;

    // ==========================================================
    // 🧼 LIMPEZA DE STRING
    // ==========================================================
    function sanitizeJSON(str) {
      return String(str || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/\u0000/g, "")
        .replace(/[\u0001-\u001F]/g, " ")
        .trim();
    }

    function safeParse(str) {
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    }

    // ==========================================================
    // 🔁 RETRY INTELIGENTE (3 tentativas)
    // ==========================================================
    async function gerarComRetry() {
      for (let tentativa = 1; tentativa <= 3; tentativa++) {
        try {
          const completion = await client.chat.completions.create({
            model: "gpt-4.1",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
          });

          let output = sanitizeJSON(completion.choices[0].message.content);
          let json = safeParse(output);

          if (
            json &&
            Array.isArray(json.sessoes) &&
            json.sessoes.length > 0
          ) {
            return json;
          }

          console.warn(
            `⚠️ Tentativa ${tentativa}: JSON inválido ou sem sessões.`
          );
        } catch (err) {
          console.warn(`⚠️ Tentativa ${tentativa} falhou:`, err);
        }
      }

      throw new Error("Falha ao gerar JSON válido após 3 tentativas.");
    }

    // ==========================================================
    // 🛠️ NORMALIZAÇÃO DAS SESSÕES (fallback de flashcards/quiz)
// ==========================================================
    function normalizarSessoes(sessoes) {
      return sessoes.map((s, idx) => {
        const sessao = { ...s };

        if (!sessao.titulo) {
          sessao.titulo = `Sessão ${idx + 1} — ${tema}`;
        }

        if (!sessao.conteudo || typeof sessao.conteudo !== "object") {
          sessao.conteudo = {
            introducao: "",
            conceitos: [],
            exemplos: [],
            aplicacoes: [],
            resumoRapido: [],
          };
        }

        const c = sessao.conteudo;
        c.conceitos = Array.isArray(c.conceitos) ? c.conceitos : [];
        c.resumoRapido = Array.isArray(c.resumoRapido)
          ? c.resumoRapido
          : [];
        c.exemplos = Array.isArray(c.exemplos) ? c.exemplos : [];
        c.aplicacoes = Array.isArray(c.aplicacoes) ? c.aplicacoes : [];

        // Quiz fallback básico
        if (!sessao.quiz || typeof sessao.quiz !== "object") {
          sessao.quiz = {
            pergunta: "",
            alternativas: [],
            corretaIndex: 0,
            explicacao: "",
          };
        }

        const q = sessao.quiz;
        q.alternativas = Array.isArray(q.alternativas)
          ? q.alternativas.filter((a) => !!a && String(a).trim())
          : [];

        if (q.alternativas.length < 4) {
          while (q.alternativas.length < 4) {
            q.alternativas.push("Alternativa adicional");
          }
        } else if (q.alternativas.length > 4) {
          q.alternativas = q.alternativas.slice(0, 4);
        }

        if (
          typeof q.corretaIndex !== "number" ||
          q.corretaIndex < 0 ||
          q.corretaIndex > 3
        ) {
          q.corretaIndex = 0;
        }

        // Flashcards: garante pelo menos 3
        let cards = Array.isArray(sessao.flashcards)
          ? sessao.flashcards.filter(
              (f) => f && typeof f.q === "string" && typeof f.a === "string"
            )
          : [];

        if (cards.length < 3) {
          const baseFonte =
            c.resumoRapido.length > 0
              ? c.resumoRapido
              : c.conceitos.length > 0
              ? c.conceitos
              : [];

          for (let i = cards.length; i < 3 && i < baseFonte.length; i++) {
            const txt = String(baseFonte[i]).trim();
            cards.push({
              q: `Explique: ${txt}`,
              a: txt,
            });
          }

          while (cards.length < 3) {
            cards.push({
              q: `Ponto importante da sessão ${idx + 1}`,
              a: `Revise o conteúdo principal desta sessão sobre ${tema}.`,
            });
          }
        }

        sessao.flashcards = cards;

        if (typeof sessao.mindmap !== "string") {
          sessao.mindmap = "";
        }

        return sessao;
      });
    }

    // ==========================================================
    // EXECUÇÃO
    // ==========================================================
    const bruto = await gerarComRetry();

    if (!bruto || !Array.isArray(bruto.sessoes) || !bruto.sessoes.length) {
      throw new Error("A IA retornou uma estrutura inválida.");
    }

    const sessoesNorm = normalizarSessoes(bruto.sessoes);

    // ==========================================================
    // ✔ SAÍDA FINAL — FORMATO EXIGIDO PELO CORE v74
    // ==========================================================
    return res.status(200).json({
      plano: JSON.stringify(sessoesNorm),
    });
  } catch (error) {
    console.error("❌ Erro ao gerar plano:", error);
    return res.status(500).json({ error: "Erro ao gerar plano." });
  }
}
