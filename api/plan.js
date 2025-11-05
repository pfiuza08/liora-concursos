// /api/plan.js  (Vercel Serverless Function - Node 18+)
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const { tema, nivel, sessoes } = req.body || {};
    if (!tema || !nivel || !sessoes) {
      return res.status(400).json({ error: 'Parâmetros ausentes: tema, nivel, sessoes' });
    }

    // Use a env var no Vercel: OPENAI_API_KEY
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Retorna um plano “dummy” para não quebrar enquanto você configura a chave
      const dummy = gerarPlanoSimples(tema, nivel, sessoes);
      return res.status(200).json({ ok: true, origem: 'fallback', plano: dummy });
    }

    // Prompt compacto (pode ajustar livremente)
    const prompt = [
      `Você é um gerador de planos de estudo de concursos.`,
      `Tema: ${tema}`,
      `Nível: ${nivel} (iniciante|intermediario|avancado)`,
      `Sessões: ${sessoes}`,
      `Retorne um JSON com a chave "plano": array de sessões.`,
      `Cada sessão: { "titulo": string, "topico": string, "resumo": string, "descricao": string, "conceitos": [string], "densidade": "📗 leve"|"📘 média"|"📙 densa" }`,
      `Sem texto fora do JSON.`
    ].join('\n');

    // Chamada a OpenAI Responses API (se preferir, adapte ao provedor que estiver usando)
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini', // pode trocar
        input: prompt,
        max_output_tokens: 1200,
        temperature: 0.4
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      // fallback para não travar a UX
      const dummy = gerarPlanoSimples(tema, nivel, sessoes);
      return res.status(200).json({
        ok: true, origem: 'fallback-error',
        motivo: txt.slice(0, 300),
        plano: dummy
      });
    }

    const data = await resp.json();
    const raw = data?.output?.[0]?.content?.[0]?.text || data?.output_text || '';
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    let plano = null;

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      try {
        const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
        plano = parsed?.plano || null;
      } catch (_) { /* cai no fallback abaixo */ }
    }

    if (!Array.isArray(plano) || plano.length === 0) {
      plano = gerarPlanoSimples(tema, nivel, sessoes);
      return res.status(200).json({ ok: true, origem: 'fallback-parse', plano });
    }

    return res.status(200).json({ ok: true, origem: 'ai', plano });

  } catch (err) {
    const dummy = gerarPlanoSimples('Tema', 'iniciante', 5);
    return res.status(200).json({
      ok: true, origem: 'fallback-exception',
      motivo: String(err).slice(0, 300),
      plano: dummy
    });
  }
}

function gerarPlanoSimples(tema, nivel, sessoes) {
  const dens = nivel === 'avancado' ? '📙 densa' : (nivel === 'intermediario' ? '📘 média' : '📗 leve');
  const arr = [];
  for (let i = 1; i <= Number(sessoes || 5); i++) {
    arr.push({
      dia: i,
      titulo: `Sessão ${i} — ${tema}`,
      topico: `Bloco ${i} (${nivel})`,
      resumo: `Introdução aos conceitos do bloco ${i} para ${nivel}.`,
      descricao: `• Objetivo do bloco ${i}\n• Conteúdos-chave relacionados a "${tema}"\n• Exercícios dirigidos\n• Revisão rápida`,
      conceitos: [tema, nivel, `bloco_${i}`],
      densidade: dens
    });
  }
  return arr;
}
