// ==========================
// 🧠 outline-generator.js — Modelo D (6 a 12 sessões) v2
// Usa LioraSemantic para texto-base e gera sessões completas
// ==========================

(function () {
  console.log("🔵 Liora Outline Generator (Modelo D v2) carregado...");

  const MIN_SESSOES = 6;
  const MAX_SESSOES = 12;

  // --------------------------------------
  // Util: parser de JSON mais robusto
  // --------------------------------------
  function safeJsonParse(raw) {
    if (!raw || typeof raw !== "string") {
      throw new Error("Resposta vazia da IA.");
    }

    // Se vier em bloco ```json ... ```
    const block =
      raw.match(/```json([\s\S]*?)```/i) ||
      raw.match(/```([\s\S]*?)```/i);
    if (block) {
      raw = block[1];
    }

    // recorta do primeiro { até o último }
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      raw = raw.slice(first, last + 1);
    }

    // remove caracteres de controle
    raw = raw.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, " ");

    return JSON.parse(raw);
  }

  // --------------------------------------
  // Chamada à IA via core (window.callLLM)
  // --------------------------------------
  async function chamarIA(system, user) {
    if (typeof window.callLLM !== "function") {
      throw new Error("callLLM() não encontrado. Certifique-se de que o core.js já carregou.");
    }
    const raw = await window.callLLM(system, user);
    return raw;
  }

  // --------------------------------------
  // 1) Gerar OUTLINES por seção da apostila
  //    (cada tópico com resumoTexto baseado NA apostila)
// --------------------------------------
  async function gerarOutlinesPorSecao(secoes) {
    const resultados = [];

    for (let i = 0; i < secoes.length; i++) {
      const sec = secoes[i];
      const titulo = sec.titulo || `Seção ${i + 1}`;
      const linhas = Array.isArray(sec.conteudo) ? sec.conteudo : [String(sec.conteudo || "")];

      // usa o semantic se existir
      const textoParaOutlines = window.LioraSemantic
        ? window.LioraSemantic.construirTextoBase(linhas)
        : linhas.join("\n");

      const textoLimitado =
        textoParaOutlines.length > 2500
          ? textoParaOutlines.slice(0, 2300) + "\n\n[trecho truncado]"
          : textoParaOutlines;

      const prompt = `
Você é Liora, especialista em educação.

Analise o trecho de uma apostila abaixo e identifique de 3 a 8 tópicos centrais de estudo.
Cada tópico deve vir com um pequeno resumo textual, baseado SOMENTE neste trecho.

Retorne APENAS JSON válido no formato:

{
  "topicos": [
    {
      "nome": "nome conciso do tópico",
      "resumoTexto": "explicação objetiva com 2 a 4 frases, baseada no texto",
      "importancia": 1
    }
  ]
}

NÃO invente conteúdo que não esteja sugerido ou implícito no texto.

TÍTULO DA SEÇÃO:
${titulo}

TRECHO DA APOSTILA:
${textoLimitado}
`;

      let json;
      try {
        const raw = await chamarIA(
          "Você é Liora e responde APENAS JSON válido.",
          prompt
        );
        json = safeJsonParse(raw);
      } catch (err) {
        console.error("Erro ao gerar outline da seção:", titulo, err);
        json = { topicos: [] };
      }

      const topicos = Array.isArray(json.topicos) ? json.topicos : [];
      const normalizados = topicos
        .filter(t => t && t.nome)
        .map(t => ({
          nome: String(t.nome).trim(),
          resumoTexto: String(t.resumoTexto || "").trim(),
          importancia: Number.isFinite(Number(t.importancia))
            ? Number(t.importancia)
            : 3,
          secaoTitulo: titulo,
          secaoIndex: i,
        }));

      resultados.push({
        secaoTitulo: titulo,
        secaoIndex: i,
        topicos: normalizados,
      });
    }

    console.log("🧠 Outlines por seção:", resultados);
    return resultados;
  }

  // --------------------------------------
  // 2) Unificar tópicos em uma lista global
  // --------------------------------------
  function unificarOutlines(outlinesPorSecao) {
    const mapa = new Map();

    outlinesPorSecao.forEach(sec => {
      (sec.topicos || []).forEach(t => {
        const chave = t.nome.toLowerCase();
        if (!mapa.has(chave)) {
          mapa.set(chave, {
            nome: t.nome,
            importanciaTotal: 0,
            ocorrencias: 0,
            resumos: [],
            secoes: new Set(),
          });
        }
        const ref = mapa.get(chave);
        ref.importanciaTotal += t.importancia || 3;
        ref.ocorrencias += 1;
        if (t.resumoTexto) ref.resumos.push(t.resumoTexto);
        ref.secoes.add(t.secaoTitulo);
      });
    });

    const topicosGlobais = Array.from(mapa.values())
      .map(t => ({
        nome: t.nome,
        importanciaMedia: t.importanciaTotal / (t.ocorrencias || 1),
        textoBase: t.resumos.join("\n\n"),
        secoes: Array.from(t.secoes),
      }))
      .sort((a, b) => b.importanciaMedia - a.importanciaMedia);

    console.log("🧠 Outline unificado:", { outline: topicosGlobais });
    return topicosGlobais;
  }

  // --------------------------------------
  // 3) Agrupar tópicos globais em 6–12 sessões
  // --------------------------------------
  function agruparTopicosEmSessoes(topicos) {
    const total = topicos.length;
    if (!total) return [];

    let numSessoes = Math.round(total / 6);
    if (numSessoes < MIN_SESSOES) numSessoes = Math.min(MIN_SESSOES, total);
    if (numSessoes > MAX_SESSOES) numSessoes = MAX_SESSOES;

    const sessoes = [];
    const base = Math.floor(total / numSessoes);
    let resto = total % numSessoes;

    let idx = 0;
    for (let s = 0; s < numSessoes; s++) {
      const tamanhoGrupo = base + (resto > 0 ? 1 : 0);
      if (resto > 0) resto--;

      const grupo = topicos.slice(idx, idx + tamanhoGrupo);
      idx += tamanhoGrupo;

      if (!grupo.length) continue;

      const tituloTopo = grupo[0].nome;
      const nomesTopicos = grupo.map(g => g.nome);
      const textoBase = grupo
        .map(g => g.textoBase || "")
        .filter(Boolean)
        .join("\n\n----------------------\n\n");

      sessoes.push({
        tituloBase: tituloTopo,
        topicos: nomesTopicos,
        textoBase: textoBase,
      });
    }

    return sessoes;
  }

  // --------------------------------------
  // 4) Gerar SESSÕES COMPLETAS a partir das
  //    sessões planejadas (Modelo D)
// --------------------------------------
  async function gerarPlanoDeEstudo(outlineUnificado) {
    const topicos = Array.isArray(outlineUnificado)
      ? outlineUnificado
      : [];

    if (!topicos.length) {
      console.warn("⚠️ Sem tópicos para montar plano.");
      return { nivel: null, sessoes: [] };
    }

    const sessoesPlanejadas = agruparTopicosEmSessoes(topicos);
    const sessoesFinais = [];

    for (let i = 0; i < sessoesPlanejadas.length; i++) {
      const spec = sessoesPlanejadas[i];

      const tituloSessao = `Sessão ${i + 1} — ${spec.tituloBase}`;
      const listaTopicos = spec.topicos.join("; ");

      const textoBaseLimitado =
        spec.textoBase && spec.textoBase.length > 2500
          ? spec.textoBase.slice(0, 2300) + "\n\n[trecho truncado]"
          : (spec.textoBase || "");

      const prompt = `
Você é Liora, tutora especializada em microlearning.

Com base APENAS no texto da apostila abaixo, monte uma sessão de estudo COMPLETA,
no formato JSON especificado, SEM adicionar conteúdos externos que não estejam
no texto. Use a lista de tópicos como guia de organização.

TEXTO BASE (apostila):
${textoBaseLimitado}

TÓPICOS PARA ESTA SESSÃO:
${listaTopicos}

RETORNE APENAS JSON VÁLIDO no formato:

{
 "titulo": "${tituloSessao}",
 "objetivo": "objetivo de aprendizagem baseado no texto",
 "conteudo": {
   "introducao": "2-3 parágrafos contextualizando a sessão, baseados no texto",
   "conceitos": [
     "conceito importante, explicado em 2-3 frases, fundamentado no texto",
     "outro conceito importante, com explicação baseada no trecho",
     "mais um conceito relevante"
   ],
   "exemplos": [
     "exemplo ou situação descrita ou compatível com o texto",
     "outro exemplo coerente, mas ainda fiel ao conteúdo"
   ],
   "aplicacoes": [
     "formas de aplicar o que o texto ensina",
     "situações práticas relacionadas ao conteúdo"
   ],
   "resumoRapido": [
     "ponto-chave 1 da sessão",
     "ponto-chave 2",
     "ponto-chave 3"
   ]
 },
 "analogias": [
   "uma analogia ou metáfora que ajude a entender um conceito-chave",
   "outra analogia útil"
 ],
 "ativacao": [
   "pergunta reflexiva 1 para o aluno",
   "pergunta reflexiva 2, ligada à prática"
 ],
 "quiz": {
   "pergunta": "crie UMA pergunta objetiva de múltipla escolha baseada EXCLUSIVAMENTE no texto acima",
   "alternativas": [
     "uma alternativa correta, baseada no texto",
     "uma alternativa plausível, mas incorreta",
     "outra alternativa plausível, mas incorreta"
   ],
   "corretaIndex": 0,
   "explicacao": "explique por que a alternativa correta está certa e por que as demais estão erradas, usando SOMENTE o texto fornecido"
 },
 "flashcards": [
   { "q": "pergunta objetiva sobre conceito importante", "a": "resposta direta" },
   { "q": "outra pergunta de revisão", "a": "resposta direta" }
 ]
}

IMPORTANTE:
- O objeto "quiz" é OBRIGATÓRIO.
- "alternativas" deve ter exatamente 3 itens.
- "corretaIndex" deve ser 0, 1 ou 2.
- "explicacao" deve fazer referência ao texto-base.
`;

      let sessao;
      try {
        const raw = await chamarIA(
          "Você é Liora. Responda SOMENTE JSON válido no formato pedido.",
          prompt
        );
        sessao = safeJsonParse(raw);
      } catch (err) {
        console.error("Erro ao gerar sessão a partir dos tópicos:", spec, err);
        sessao = {
          titulo: tituloSessao,
          objetivo: `Compreender os tópicos: ${listaTopicos}.`,
          conteudo: {
            introducao:
              "Sessão gerada parcialmente. Revise e complemente o conteúdo.",
            conceitos: spec.topicos,
            exemplos: [],
            aplicacoes: [],
            resumoRapido: spec.topicos.slice(0, 3),
          },
          analogias: [],
          ativacao: [],
          quiz: {
            pergunta: "",
            alternativas: [],
            corretaIndex: 0,
            explicacao: "",
          },
          flashcards: [],
        };
      }

      sessoesFinais.push(sessao);
    }

    const plano = {
      nivel: null,
      sessoes: sessoesFinais,
    };

    console.log("📘 Plano de estudo (Modelo D):", plano);
    return plano;
  }

  // Expor API pública
  window.LioraOutline = {
    gerarOutlinesPorSecao,
    unificarOutlines,
    gerarPlanoDeEstudo,
    gerarPlanoEstudo: gerarPlanoDeEstudo, // alias, se em algum lugar usar o nome antigo
  };
})();
