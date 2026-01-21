// ==========================================================
// 🧠 /api/gerarPlano.js — LIORA Plano por TEMA (AUTO sessões)
// ----------------------------------------------------------
// Entrada:  { tema, nivel }
// Saída:    { plano: "<string JSON com array de sessões>" }
//
// - IA escolhe a quantidade de sessões (4..10) com base em:
//   nível + complexidade do tema
// - Compatível com core v78
// ==========================================================

export const config = { runtime: "edge" };

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.LIORA_PLAN_MODEL || "gpt-4.1-mini";

function normalizarNivel(nivelRaw) {
  const n = String(nivelRaw || "").toLowerCase();

  if (n.includes("inic")) return "iniciante";
  if (n.includes("inter")) return "intermediario";
  if (n.includes("avan")) return "avancado";
  if (n.includes("revis")) return "revisao";

  return "intermediario";
}

function safeJsonFromLLM(raw) {
  if (!raw || typeof raw !== "string") throw new Error("Resposta vazia.");

  let txt = raw.trim();

  const block =
    txt.match(/```json([\s\S]*?)```/i) ||
    txt.match(/```([\s\S]*?)```/i);

  if (block) txt = block[1];

  const first = txt.search(/[\[\{]/);
  const last = Math.max(txt.lastIndexOf("]"), txt.lastIndexOf("}"));

  if (first !== -1 && last !== -1 && last > first) {
    txt = txt.slice(first, last + 1);
  }

  txt = txt.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, " ");

  const parsed = JSON.parse(txt);
  if (!Array.isArray(parsed)) throw new Error("Plano não é array.");

  return parsed;
}

function systemPrompt() {
  return `
Você é Liora, IA educacional especializada em criar sessões completas de estudo
de forma didática e comercial.

REGRAS OBRIGATÓRIAS:
- Retorne APENAS JSON válido: um ARRAY JSON (sem texto antes ou depois).
- Não use markdown. Não use blocos de código.
- Linguagem clara, profissional, objetiva.
- Cada sessão deve ser útil sozinha (não dependa de outra para fazer sentido).
- Evite invenções externas e mantenha consistência.
`;
}

function userPrompt(tema, nivel) {
  const nivelHumano =
    nivel === "iniciante"
      ? "iniciante (base fraca ou zero)"
      : nivel === "intermediario"
      ? "intermediário (já viu, mas não domina)"
      : nivel === "avancado"
      ? "avançado (quer profundidade e pegadinhas)"
      : "revisão (consolidar e acelerar)";

  return `
TEMA:
"${tema}"

NÍVEL:
${nivelHumano}

TAREFA:
Crie um PLANO com SESSÕES COMPLETAS.

✅ A IA DEVE ESCOLHER a quantidade de sessões automaticamente,
entre 4 e 10, baseado na complexidade do tema e no nível.

FORMATO EXATO:
Retorne APENAS um ARRAY JSON com as sessões.

Cada sessão precisa ter OBRIGATORIAMENTE este formato:

[
  {
    "titulo": "Sessão 1 — ...",
    "objetivo": "...",
    "duracaoMinutos": 40,
    "conteudo": {
      "introducao": "...",
      "conceitos": ["...", "..."],
      "exemplos": ["...", "..."],
      "aplicacoes": ["...", "..."],
      "resumoRapido": ["...", "...", "..."]
    },
    "analogias": ["..."],
    "ativacao": ["Pergunta 1", "Pergunta 2", "Pergunta 3"],
    "quiz": {
      "pergunta": "...",
      "alternativas": ["A", "B", "C", "D"],
      "corretaIndex": 0,
      "explicacao": "...",
      "explicacoes": ["...", "...", "...", "..."]
    },
    "flashcards": [
      { "q": "...", "a": "..." },
      { "q": "...", "a": "..." },
      { "q": "...", "a": "..." }
    ],
    "mindmap": "Mapa mental textual com 2-3 níveis e quebras de linha."
  }
]

REGRAS DE QUALIDADE:
- Iniciante: mais intuição e exemplos fáceis.
- Intermediário: equilíbrio definição + prática.
- Avançado: detalhes, confusões comuns e “pegadinhas”.
- Revisão: mais resumo, flashcards fortes, sessões compactas.
- resumoRapido: 3 a 6 bullets essenciais.
- quiz: sempre 4 alternativas e corretaIndex válido.
- flashcards: 3 a 6 cards por sessão.
`;
}

function sanitizarSessao(s, idx, tema, nivel) {
  const dur = Number(s?.duracaoMinutos);
  const duracaoMinutos = Number.isFinite(dur) ? dur : 40;

  const conteudo = s?.conteudo || {};

  const quiz = s?.quiz || {};
  const alternativas = Array.isArray(quiz.alternativas) ? quiz.alternativas : [];

  let corretaIndex =
    typeof quiz.corretaIndex === "number" ? quiz.corretaIndex : 0;

  if (corretaIndex < 0 || corretaIndex >= alternativas.length) corretaIndex = 0;

  return {
    titulo: s?.titulo || `Sessão ${idx + 1} — ${tema}`,
    objetivo:
      s?.objetivo ||
      `Compreender o tema "${tema}" em nível ${nivel}.`,
    duracaoMinutos,
    conteudo: {
      introducao: String(conteudo.introducao || ""),
      conceitos: Array.isArray(conteudo.conceitos) ? conteudo.conceitos : [],
      exemplos: Array.isArray(conteudo.exemplos) ? conteudo.exemplos : [],
      aplicacoes: Array.isArray(conteudo.aplicacoes) ? conteudo.aplicacoes : [],
      resumoRapido: Array.isArray(conteudo.resumoRapido)
        ? conteudo.resumoRapido
        : [],
    },
    analogias: Array.isArray(s?.analogias) ? s.analogias : [],
    ativacao: Array.isArray(s?.ativacao) ? s.ativacao : [],
    quiz: {
      pergunta: String(quiz.pergunta || ""),
      alternativas,
      corretaIndex,
      explicacao: String(quiz.explicacao || ""),
      explicacoes: Array.isArray(quiz.explicacoes) ? quiz.explicacoes : [],
    },
    flashcards: Array.isArray(s?.flashcards) ? s.flashcards : [],
    mindmap: String(s?.mindmap || s?.mapaMental || ""),
  };
}

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST." }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY ausente." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const tema = String(body.tema || "").trim();
    const nivel = normalizarNivel(body.nivel);

    if (!tema) {
      return new Response(JSON.stringify({ error: "Tema obrigatório." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const system = systemPrompt();
    const user = userPrompt(tema, nivel);

    const openaiRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.55,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      console.error("❌ OpenAI erro:", openaiRes.status, errText);
      return new Response(JSON.stringify({ error: "Falha na IA." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const json = await openaiRes.json();
    const content = json?.choices?.[0]?.message?.content || "";

    let planoArray = safeJsonFromLLM(content);

    // limita segurança (anti explosão)
    if (planoArray.length > 12) planoArray = planoArray.slice(0, 12);
    if (planoArray.length < 3) {
      throw new Error("Plano curto demais, inválido para Liora.");
    }

    const planoSanitizado = planoArray.map((s, idx) =>
      sanitizarSessao(s, idx, tema, nivel)
    );

    return new Response(
      JSON.stringify({ plano: JSON.stringify(planoSanitizado) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("❌ gerarPlano.js erro:", e);
    return new Response(JSON.stringify({ error: "Erro ao gerar plano." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
