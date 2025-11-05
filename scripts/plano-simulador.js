// /scripts/plano-simulador.js  (v9)
(function () {
  const LOG = (...a) => console.log('[plano-simulador]', ...a);

  // Hook público para gerar por tema+nivel
  window.generatePlanByTheme = async function ({ tema, nivel, sessoes }) {
    try {
      if (!tema || !nivel || !sessoes) {
        throw new Error('Parâmetros inválidos (tema, nivel, sessoes)');
      }

      // Chamada ao endpoint
      const resp = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, nivel, sessoes })
      });

      if (!resp.ok) {
        const txt = await resp.text();
        LOG('Falha API, code:', resp.status, txt);
        return { origem: 'http-fail', plano: fallbackLocal(tema, nivel, sessoes) };
      }

      const data = await resp.json();
      if (!data?.plano || !Array.isArray(data.plano)) {
        LOG('Formato inválido da resposta. Data:', data);
        return { origem: 'bad-format', plano: fallbackLocal(tema, nivel, sessoes) };
      }

      LOG('Plano gerado com sucesso. Origem:', data.origem);
      return { origem: data.origem, plano: data.plano };

    } catch (err) {
      LOG('Exceção ao gerar plano:', err);
      return { origem: 'exception', plano: fallbackLocal(tema, nivel, sessoes) };
    }
  };

  function fallbackLocal(tema, nivel, sessoes) {
    const dens = nivel === 'avancado' ? '📙 densa' : (nivel === 'intermediario' ? '📘 média' : '📗 leve');
    const out = [];
    for (let i = 1; i <= Number(sessoes || 5); i++) {
      out.push({
        dia: i,
        titulo: `Sessão ${i} — ${tema}`,
        topico: `Tópico ${i} (${nivel})`,
        resumo: `Panorama do tema para ${nivel} — bloco ${i}.`,
        descricao: `• Conceitos do bloco ${i}\n• Leituras e exemplos\n• Exercícios\n• Revisão`,
        conceitos: [tema, nivel, `topico_${i}`],
        densidade: dens
      });
    }
    return out;
  }
})();
