// ==========================================================
// 🧩 LIORA — OUTLINE GENERATOR v74-C3
// Compatível com core v74 (usa: window.lioraOutlineGenerator.gerar())
// Mantém a estrutura Modelo D v72 (seções → tópicos → sessões completas)
// ==========================================================
(function () {
  console.log("🔵 Liora Outline Generator v74-C3 carregado...");

  const MIN = 6;
  const MAX = 12;

  // -----------------------------
  // JSON seguro
  // -----------------------------
  function safeParse(raw) {
    if (!raw || typeof raw !== "string") throw new Error("Resposta vazia.");

    const block =
      raw.match(/```json([\s\S]*?)```/i) ||
      raw.match(/```([\s\S]*?)```/i);

    if (block) raw = block[1];

    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last !== -1) raw = raw.slice(first, last + 1);

    raw = raw.replace(/[\u0000-\u001F]/g, " ");
    return JSON.parse(raw);
  }

  // -----------------------------
  // Chamada IA
  // -----------------------------
  async function call(system, user) {
    if (!window.callLLM) throw new Error("callLLM() não disponível");
    return await window.callLLM(system, user);
  }

  // -----------------------------
  // 1) OUTLINES por seção
  // -----------------------------
  async function gerarOutlinesPorSecao(secoes) {
    const resultados = [];

    for (let i = 0; i < secoes.length; i++) {
      const sec = secoes[i];
      const titulo = sec.titulo || `Seção ${i + 1}`;
      const linhas = Array.isArray(sec.conteudo)
        ? sec.conteudo
        : [String(sec.conteudo || "")];

      const texto = window.LioraSemantic
        ? window.LioraSemantic.construirTextoBase(linhas)
        : linhas.join("\n");

      const trecho =
        texto.length > 2500
          ? texto.slice(0, 2300) + "\n[trecho truncado]"
          : texto;

      const prompt = `Você é Liora.
Extraia de 3 a 8 tópicos centrais do trecho abaixo.
Retorne SOMENTE JSON válido:

{
  "topicos": [
    { "nome": "...", "resumoTexto": "...", "importancia": 1 }
  ]
}

TÍTULO: ${titulo}

TEXTO:
${trecho}
`;

      let json;
      try {
        const raw = await call("Você responde apenas JSON válido.", prompt);
        json = safeParse(raw);
      } catch (err) {
        console.error("❌ Erro no outline da seção", titulo, err);
        json = { topicos: [] };
      }

      const topicos = (json.topicos || [])
        .map((t) => ({
          nome: (t.nome || "").trim(),
          resumoTexto: (t.resumoTexto || "").trim(),
          importancia: Number(t.importancia) || 3,
          secaoTitulo: titulo,
          secaoIndex: i,
        }))
        .filter((t) => t.nome);

      resultados.push({ secaoTitulo: titulo, secaoIndex: i, topicos });
    }

    console.log("🧠 Outlines por seção:", resultados);
    return resultados;
  }

  // -----------------------------
  // 2) Unificar tópicos
  // -----------------------------
  function unificarOutlines(lista) {
    const mapa = new Map();

    lista.forEach((sec) => {
      sec.topicos.forEach((t) => {
        const chave = t.nome.toLowerCase();

        if (!mapa.has(chave)) {
          mapa.set(chave, {
            nome: t.nome,
            importancia: 0,
            count: 0,
            texto: [],
            secoes: new Set(),
          });
        }

        const ref = mapa.get(chave);
        ref.importancia += t.importancia;
        ref.count++;
        if (t.resumoTexto) ref.texto.push(t.resumoTexto);
        ref.secoes.add(t.secaoTitulo);
      });
    });

    const vet = Array.from(mapa.values())
      .map((x) => ({
        nome: x.nome,
        importancia: x.importancia / x.count,
        textoBase: x.texto.join("\n\n"),
        secoes: Array.from(x.secoes),
      }))
      .sort((a, b) => b.importancia - a.importancia);

    console.log("🧠 Outline unificado:", vet);
    return vet;
  }

  // -----------------------------
  // 3) Agrupar tópicos em sessões
  // -----------------------------
  function agrupar(topicos) {
    const total = topicos.length;
    if (!total) return [];

    let n = Math.round(total / 6);
    n = Math.max(MIN, Math.min(MAX, n));

    const sessoes = [];
    const base = Math.floor(total / n);
    let resto = total % n;

    let idx = 0;

    for (let i = 0; i < n; i++) {
      const tam = base + (resto > 0 ? 1 : 0);
      if (resto > 0) resto--;

      const grupo = topicos.slice(idx, idx + tam);
      idx += tam;

      if (!grupo.length) continue;

      const titulo = grupo[0].nome.replace(/^Sessão\s+\d+\s+—\s+/i, "");

      const textoBase = grupo
        .map((g) => g.textoBase)
        .filter(Boolean)
        .join("\n----------------------\n");

      sessoes.push({
        tituloBase: titulo,
        topicos: grupo.map((g) => g.nome),
        textoBase,
      });
    }

    return sessoes;
  }

  // -----------------------------
  // 4) Sessões completas
  // -----------------------------
  async function gerarPlanoDeEstudo(outline) {
    const topicos = Array.isArray(outline) ? outline : [];
    if (!topicos.length) return { nivel: null, sessoes: [] };

    const grupos = agrupar(topicos);
    const sessoes = [];

    for (let i = 0; i < grupos.length; i++) {
      const g = grupos[i];

      const titulo = `Sessão ${i + 1} — ${g.tituloBase}`;
      const listaTopicos = g.topicos.join("; ");

      const texto =
        g.textoBase.length > 2500
          ? g.textoBase.slice(0, 2300) + "\n[trecho truncado]"
          : g.textoBase;

      const prompt = `Você é Liora.
Monte a sessão abaixo APENAS com base no texto.
Retorne SOMENTE JSON válido.

TEXTO:
${texto}

TÓPICOS:
${listaTopicos}

FORMATO:
{
  "titulo": "${titulo}",
  "objetivo": "...",
  "conteudo": {
    "introducao": "...",
    "conceitos": ["...", "..."],
    "exemplos": ["..."],
    "aplicacoes": ["..."],
    "resumoRapido": ["..."]
  },
  "analogias": ["..."],
  "ativacao": ["..."],
  "quiz": {
    "pergunta": "...",
    "alternativas": ["...", "...", "..."],
    "corretaIndex": 0,
    "explicacao": "..."
  },
  "flashcards": [ {"q":"...", "a":"..."} ],
  "mapaMental": "mapa mental textual com 3 níveis"
}`;

      let sessao;

      try {
        const raw = await call("Você é Liora. Responda SOMENTE JSON.", prompt);
        sessao = safeParse(raw);
        sessao.mapaMental = sessao.mapaMental || "";
      } catch (err) {
        console.error("❌ Erro sessão", g, err);

        sessao = {
          titulo,
          objetivo: `Compreender: ${listaTopicos}`,
          conteudo: {
            introducao: "Sessão parcialmente gerada.",
            conceitos: g.topicos,
            exemplos: [],
            aplicacoes: [],
            resumoRapido: g.topicos.slice(0, 3),
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
          mapaMental: "Mapa mental não pôde ser gerado automaticamente.",
        };
      }

      // fallback mapa mental
      if (!sessao.mapaMental && window.LioraSemantic) {
        try {
          const mm = await window.LioraSemantic.gerarMapaMental(
            titulo,
            texto
          );
          sessao.mapaMental = mm || "";
        } catch {}
      }

      sessoes.push(sessao);
    }

    return { nivel: null, sessoes };
  }

  // ========================================================
  // 🌟 API GLOBAL COMPATÍVEL COM core v74
  // ========================================================
  async function gerar(secoes) {
    console.log("🚀 OutlineGenerator.gerar() iniciando pipeline…");

    const outlinePorSecao = await gerarOutlinesPorSecao(secoes);
    const outlineUnificado = unificarOutlines(outlinePorSecao);
    const plano = await gerarPlanoDeEstudo(outlineUnificado);

    console.log("📘 OutlineGenerator → plano final:", plano);
    return plano;
  }

  window.lioraOutlineGenerator = {
    gerar,
    gerarOutlinesPorSecao,
    unificarOutlines,
    gerarPlanoDeEstudo,
  };
})();
