// /scripts/plano-simulador.js  (v13)
(function () {
  const LOG = (...a) => console.log('[plano-simulador]', ...a);

  // ===== utils de robustez =====
  const bulletJoin = (arr) =>
    Array.isArray(arr) && arr.length
      ? '• ' + arr.map(x => String(x).trim()).filter(Boolean).join('\n• ')
      : '';

  function extractJSONObject(text) {
    if (!text) return null;
    let t = String(text).trim().replace(/```json|```/g, '').trim();
    // tenta parse direto
    try { return JSON.parse(t); } catch {}
    // fallback: pega o maior bloco entre { ... }
    const first = t.indexOf('{'); const last = t.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    try { return JSON.parse(t.slice(first, last + 1)); } catch { return null; }
  }

  function normalizeSession(item, idx, tema, nivel) {
    const o = item || {};
    const titulo = o.titulo || o.title || o['título'] || `Sessão ${idx + 1} — ${tema}`;
    const resumo = o.resumo || o.summary || o['síntese'] || `Objetivo da sessão ${idx + 1} sobre ${tema} (nível ${nivel}).`;

    let conteudo =
      o.conteudo || o['conteúdo'] || o.content || o.items || o.topicos || o['tópicos'];

    if (Array.isArray(conteudo)) conteudo = bulletJoin(conteudo);
    else if (conteudo && typeof conteudo === 'object') {
      const maybe = conteudo.items || conteudo.topicos || conteudo['tópicos'] || conteudo.points || conteudo.bullets;
      conteudo = bulletJoin(maybe);
    } else if (typeof conteudo === 'string') {
      conteudo = conteudo.trim();
    }

    if (!conteudo) conteudo = '• Conceitos principais\n• Exemplos práticos\n• Exercícios de fixação';

    return { titulo: String(titulo).trim(), resumo: String(resumo).trim(), conteudo: String(conteudo).trim() };
  }

  function normalizePlanObject(obj, tema, nivel) {
    // aceita { sessoes, plano } ou { total_sessoes, plano } ou até um array legado
    if (Array.isArray(obj)) {
      return { sessoes: obj.length, plano: obj.map((it, i) => normalizeSession(it, i, tema, nivel)) };
    }
    const sessoes = Number(obj?.sessoes || obj?.total_sessoes || (obj?.plano?.length || 0));
    const planoRaw = Array.isArray(obj?.plano) ? obj.plano : [];
    const plano = planoRaw.map((it, i) => normalizeSession(it, i, tema, nivel));
    return { sessoes: sessoes || plano.length, plano };
  }

  // ===== geração principal (automática) =====
  window.generatePlanByTheme = async function (tema, nivel) {
    LOG('parâmetros recebidos:', { tema, nivel });

    if (!tema || !nivel) {
      throw new Error('Parâmetros inválidos (tema, nivel)');
    }

   const prompt = `
Você é especialista em microlearning (Barbara Oakley) e design instrucional.

Crie um plano de estudo COMPLETO e PROGRESSIVO para o tema abaixo.
Antes de gerar o plano, identifique os PRINCIPAIS SUBTÓPICOS.

REGRAS IMPORTANTES:

1. Cada sessão deve tratar um subtópico específico (não repita temas).
2. Cada sessão deve ter conteúdo diferente e aprofundamento progressivo.
3. Não use "conceitos principais" repetidamente.
4. O conteúdo deve ter bullets específicos e aplicáveis.

FORMATO OBRIGATÓRIO DA RESPOSTA (somente JSON válido):

{
  "sessoes": <numero>,
  "plano": [
    {
      "titulo": "Sessão X — Nome do Subtópico",
      "resumo": "Objetivo da sessão (1 parágrafo)",
      "conteudo": "• bullet 1\\n• bullet 2\\n• bullet 3"
    }
  ]
}

Tema: "${tema}"
Nível do aluno: "${nivel}"

Agora produza o JSON.
`.trim();


    // 1) OpenAI direta (se houver chave)
    if (window.OPENAI_API_KEY) {
      try {
        LOG('chamada direta à OpenAI (automática)');
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${window.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            temperature: 0.2,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('IA retornou vazio');

        const obj = extractJSONObject(content);
        if (!obj) throw new Error('Não foi possível extrair JSON válido.');

        const normalized = normalizePlanObject(obj, tema, nivel);
        LOG('plano (IA automática) normalizado:', normalized);
        return normalized; // { sessoes, plano }
      } catch (err) {
        LOG('OpenAI automática falhou:', err.message);
      }
    }

    // 2) Backend opcional (/api/plan-auto)
    try {
      LOG('tentando backend /api/plan-auto...');
      const resp = await fetch('/api/plan-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, nivel }),
      });

      if (resp.ok) {
        const result = await resp.json();
        const normalized = normalizePlanObject(result, tema, nivel);
        LOG('plano (backend auto) normalizado:', normalized);
        return normalized;
      }
      LOG('backend auto não retornou formato válido.');
    } catch (err) {
      LOG('Erro no backend /api/plan-auto:', err.message);
    }

    // 3) Fallback local (estima nº de sessões pelo nível)
    const estimativa = (nivel === 'avancado' ? 5 : (nivel === 'intermediario' ? 6 : 8));
    const plano = Array.from({ length: estimativa }, (_, i) =>
      normalizeSession({}, i, tema, nivel)
    );
    return { sessoes: estimativa, plano };
  };

  LOG('✅ plano-simulador.js carregado');
})();
