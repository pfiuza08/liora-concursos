// /scripts/plano-simulador.js  (v9)
(function () {
  const LOG = (...a) => console.log('[plano-simulador]', ...a);

 // ==========================================================
// 📚 GERADOR DE PLANO POR TEMA (IA real)
// ==========================================================

window.generatePlanByTheme = async function (tema, nivel, sessoes) {
  console.log("[plano-simulador] parâmetros recebidos:", { tema, nivel, sessoes });

  // VALIDAR mas sem bloquear quando número vem como string
  if (!tema || !nivel || !sessoes || isNaN(parseInt(sessoes))) {
    throw new Error("Parâmetros inválidos (tema, nivel, sessoes)");
  }

  sessoes = parseInt(sessoes);

  // MONTA O PROMPT PARA A IA
  const prompt = `
Você é uma especialista em ensino e microlearning.

Tema: **${tema}**
Nível do aluno: **${nivel}**
Quantidade de sessões: **${sessoes}**

➤ Gere um PLANO DE ESTUDO dividido em ${sessoes} sessões numeradas.
➤ Para cada sessão, retorne exatamente nesta estrutura:

Sessão X — Título curto
Resumo: (1 parágrafo, objetivo da sessão)
Conteúdo:
• item 1
• item 2
• item 3

Responda em JSON válido.

EXEMPLO:
[
  { "titulo": "Sessão 1 — Fundamentos", "resumo": "...", "conteudo": "• ..." }
]
  `;

  try {
    console.log("[plano-simulador] solicitando IA...");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.OPENAI_API_KEY}`, // 🔑 API KEY
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",  // pode trocar pelo modelo desejado
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();

    console.log("[plano-simulador] retorno da IA:", data);

    let json = data.choices?.[0]?.message?.content;

    if (!json) throw new Error("Resposta da IA vazia");

    json = json.replace(/```json|```/g, "").trim(); // remove markdown

    const plano = JSON.parse(json);

    if (!Array.isArray(plano)) throw new Error("Formato inválido da IA");

    return plano; // ✅ garante lista
  } catch (err) {
    console.error("[plano-simulador] Exceção ao gerar plano:", err);
    throw err;
  }
};


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
