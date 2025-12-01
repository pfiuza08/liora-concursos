// ==========================================================
// 🧠 LIORA — GERADOR DE PLANO POR TEMA v76-P0.5 (PREMIUM)
// - Sessões densas e adaptativas por nível
// - Perfis de banca para concursos/avaliações públicas
// - Quiz forte, flashcards garantidos, mapa mental consistente
// - JSON robusto com limpeza + retry
// - Compatível com CORE v74 (retorna plano: JSON.stringify(sessoes))
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
    const bancaNorm = (String(banca || "").toUpperCase().trim() || "GERAL");

    // número adaptativo de sessões
    const qtdSessoes = Math.max(6, Math.min(12, Number(sessoes) || 8));

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // ----------------------------------------------------------
    // PERFIL POR NÍVEL
    // ----------------------------------------------------------
    let perfilNivel = "";

    if (nivelNorm === "iniciante") {
      perfilNivel = `
NÍVEL DO ESTUDANTE: INICIANTE.
- Linguagem acessível, sem jargão excessivo.
- Mais exemplos e analogias do que detalhes técnicos.
- Introdução um pouco mais explicativa.
- Quiz direto, sem pegadinhas pesadas.
- Flashcards com definições básicas e ideias principais.`;
    } else if (nivelNorm === "avancado" || nivelNorm === "avançado") {
      perfilNivel = `
NÍVEL DO ESTUDANTE: AVANÇADO.
- Conteúdo mais denso e técnico.
- Traga nuances, exceções e distinções conceituais relevantes para prova.
- Use terminologia própria da área.
- Quiz com alternativas muito próximas.
- Flashcards voltados a detalhes e pontos controversos.`;
    } else {
      perfilNivel = `
NÍVEL DO ESTUDANTE: INTERMEDIÁRIO.
- Combinar clareza com boa densidade.
- Explicar conceitos com precisão, usando exemplos de prova.
- Evitar tanto superficialidade quanto excesso de tecnicismo.
- Quiz com complexidade moderada.
- Flashcards misturando conceito e aplicação.`;
    }

    // ----------------------------------------------------------
    // PERFIL POR BANCA / AVALIAÇÃO (apenas concursos/avaliações)
    // ----------------------------------------------------------
    let perfilBanca = `
BANCA/AVALIAÇÃO: GERAL (CONCURSOS OU AVALIAÇÕES PÚBLICAS).
- Estilo objetivo, voltado para múltipla escolha.
- Linguagem clara, com rigor conceitual.
- Exemplos remetem a enunciados de prova.`;

    if (bancaNorm.includes("ENEM")) {
      perfilBanca = `
BANCA/AVALIAÇÃO: ENEM.
- Linguagem acessível e contextualizada.
- Conectar o tema com sociedade, cidadania, tecnologia, meio ambiente etc.
- Questões com enunciado interpretativo seguido de cobrança de conceito.`;
    } else if (bancaNorm.includes("ENAMED")) {
      perfilBanca = `
BANCA/AVALIAÇÃO: ENAMED.
- Foco em casos clínicos, raciocínio diagnóstico e conduta.
- Linguagem técnica da saúde, mas clara.
- Questões baseadas em vinhetas clínicas, com alternativas de conduta.`;
    } else if (
      bancaNorm.includes("CESPE") ||
      bancaNorm.includes("CEBRASPE")
    ) {
      perfilBanca = `
BANCA/AVALIAÇÃO: CESPE/CEBRASPE.
- Máxima precisão conceitual.
- Questões que exploram diferenças sutis entre conceitos.
- Mesmo em múltipla escolha, alternativas muito próximas.
- Destaque nuances, exceções e pegadinhas clássicas.`;
    } else if (bancaNorm.includes("FGV")) {
      perfilBanca = `
BANCA/AVALIAÇÃO: FGV.
- Textos mais densos, foco em interpretação e raciocínio.
- Exemplos com cenários jurídicos, administrativos ou econômicos.
- Alternativas longas e bem articuladas.
- Valorização da fundamentação na explicação do gabarito.`;
    } else if (bancaNorm.includes("OAB")) {
      perfilBanca = `
BANCA/AVALIAÇÃO: OAB.
- Foco em aplicação jurídica prática (normas, princípios, jurisprudência).
- Exemplos de casos, situações concretas e peças.
- Questões de múltipla escolha simulando 1ª fase.
- Flashcards destacando fundamentos legais e distinções entre institutos.`;
    }

    // ----------------------------------------------------------
    // PROMPT PRINCIPAL (P0.5 PREMIUM)
    // ----------------------------------------------------------
    const prompt = `
Você é a IA da Liora, plataforma de estudo inteligente para concursos e avaliações públicas.

Crie EXATAMENTE ${qtdSessoes} sessões de estudo bem estruturadas, densas e úteis para:

TEMA: ${tema}
NÍVEL: ${nivel}
BANCA/ESTILO: ${bancaNorm}

CONSIDERE:
${perfilNivel}

E TAMBÉM:
${perfilBanca}

Toda a saída deve ser APENAS JSON válido, no formato:

{
  "origem": "tema",
  "tema": "${tema}",
  "nivel": "${nivel}",
  "banca": "${bancaNorm}",
  "sessoes": [
    {
      "titulo": "Título claro e específico da sessão",
      "objetivo": "Frase única, iniciando com verbo no infinitivo, descrevendo o que o estudante será capaz de fazer.",
      "conteudo": {
        "introducao": "2–3 frases conectando o assunto com o contexto de prova, de forma clara e direta.",
        "conceitos": [
          "3–5 conceitos centrais, cada um explicado em 1 linha.",
          "Sem repetições, sem frases vazias."
        ],
        "exemplos": [
          "2–4 exemplos aplicados, lembrando enunciados de questões.",
          "Podem ser mini-situações práticas."
        ],
        "aplicacoes": [
          "2–4 aplicações reais ou situações típicas de prova.",
          "Indique como o conceito aparece em concursos."
        ],
        "resumoRapido": [
          "5 bullets com o essencial para revisão, sem repetir texto das listas acima."
        ]
      },
      "analogias": [
        "1–2 comparações que facilitem a compreensão (ex.: 'tratado é como um contrato formal entre Estados')."
      ],
      "ativacao": [
        "2–4 perguntas abertas que obriguem o estudante a explicar, comparar ou aplicar o conteúdo, não apenas decorar."
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
        "explicacao": "Explique claramente por que a alternativa correta é correta e por que as outras não são."
      },
      "flashcards": [
        { "q": "Pergunta-chave sobre conceito importante", "a": "Resposta objetiva e sintética" },
        { "q": "Outra pergunta que poderia cair na prova", "a": "Resposta direta, sem rodeios" },
        { "q": "Ponto que costuma gerar confusão", "a": "Explicação clara, em 1–2 frases" }
      ],
      "mindmap": "Mapa mental textual do conteúdo da sessão, com 2–3 níveis, no formato: Tópico > Subtópico > Detalhe | Outro tópico > Subtópico..."
    }
  ]
}

REGRAS CRÍTICAS:
- NÃO escreva nada fora do JSON.
- NÃO coloque comentários no JSON.
- NÃO deixe listas vazias.
- NÃO repita a mesma ideia com outras palavras.
- Foque em utilidade real para quem estuda para concursos.
- O JSON deve ser 100% válido e parseável em JavaScript.
`;

    // ----------------------------------------------------------
    // Helpers de limpeza/parse
    // ----------------------------------------------------------
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

    // ----------------------------------------------------------
    // Retry inteligente (3 tentativas)
    // ----------------------------------------------------------
    async function gerarComRetry() {
      for (let tentativa = 1; tentativa <= 3; tentativa++) {
        try {
          const completion = await client.chat.completions.create({
            model: "gpt-4.1",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
          });

          let output = sanitizeJSON(
            completion.choices?.[0]?.message?.content || ""
          );
          const json = safeParse(output);

          if (json && Array.isArray(json.sessoes) && json.sessoes.length > 0) {
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

    // ----------------------------------------------------------
    // Normalização das sessões (garante consistência)
    // ----------------------------------------------------------
    function normalizarSessoes(sessoes) {
      return sessoes.map((s, idx) => {
        const sessao = { ...s };

        sessao.titulo =
          (sessao.titulo && String(sessao.titulo).trim()) ||
          `Sessão ${idx + 1} — ${tema}`;

        sessao.objetivo =
          (sessao.objetivo && String(sessao.objetivo).trim()) ||
          `Compreender os principais pontos sobre ${tema}.`;

        if (!sessao.conteudo || typeof sessao.conteudo !== "object") {
          sessao.conteudo = {};
        }

        const c = sessao.conteudo;
        c.introducao = String(c.introducao || "").trim();

        c.conceitos = Array.isArray(c.conceitos)
          ? c.conceitos.map((x) => String(x || "").trim()).filter(Boolean)
          : [];

        c.exemplos = Array.isArray(c.exemplos)
          ? c.exemplos.map((x) => String(x || "").trim()).filter(Boolean)
          : [];

        c.aplicacoes = Array.isArray(c.aplicacoes)
          ? c.aplicacoes.map((x) => String(x || "").trim()).filter(Boolean)
          : [];

        c.resumoRapido = Array.isArray(c.resumoRapido)
          ? c.resumoRapido.map((x) => String(x || "").trim()).filter(Boolean)
          : [];

        // quiz
        if (!sessao.quiz || typeof sessao.quiz !== "object") {
          sessao.quiz = {
            pergunta: "",
            alternativas: [],
            corretaIndex: 0,
            explicacao: "",
          };
        }

        const q = sessao.quiz;
        q.pergunta = String(q.pergunta || "").trim();
        q.explicacao = String(q.explicacao || "").trim();
        q.alternativas = Array.isArray(q.alternativas)
          ? q.alternativas.map((x) => String(x || "").trim()).filter(Boolean)
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

        // flashcards
        let cards = Array.isArray(sessao.flashcards)
          ? sessao.flashcards
              .map((f) => ({
                q: String(f?.q || "").trim(),
                a: String(f?.a || "").trim(),
              }))
              .filter((f) => f.q && f.a)
          : [];

        const baseResumo = c.resumoRapido.length ? c.resumoRapido : c.conceitos;

        while (cards.length < 3 && baseResumo.length > 0) {
          const idxBase = cards.length % baseResumo.length;
          const txt = baseResumo[idxBase];
          cards.push({
            q: `Explique: ${txt}`,
            a: txt,
          });
        }

        while (cards.length < 3) {
          cards.push({
            q: `Revise o conteúdo desta sessão (${idx + 1}).`,
            a: `Releia os pontos principais da sessão sobre ${tema}.`,
          });
        }

        sessao.flashcards = cards;

        if (typeof sessao.mindmap !== "string") {
          sessao.mindmap = "";
        }

        return sessao;
      });
    }

    // ----------------------------------------------------------
    // Execução
    // ----------------------------------------------------------
    const bruto = await gerarComRetry();

    if (!bruto || !Array.isArray(bruto.sessoes) || !bruto.sessoes.length) {
      throw new Error("A IA retornou uma estrutura inválida.");
    }

    const sessoesNorm = normalizarSessoes(bruto.sessoes);

    // ----------------------------------------------------------
    // Saída compatível com CORE v74
    // ----------------------------------------------------------
    return res.status(200).json({
      plano: JSON.stringify(sessoesNorm),
    });
  } catch (error) {
    console.error("❌ Erro ao gerar plano:", error);
    return res.status(500).json({ error: "Erro ao gerar plano." });
  }
}
