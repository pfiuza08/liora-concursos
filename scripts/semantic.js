// ==========================================================
// 🌐 Liora — semantic.js
// Versão compatível com navegador (sem import/export)
// ==========================================================

window.Semantic = {
  /**
   * Análise semântica simples com base em frequência, resumo e densidade
   * Retorna { titulo, resumo, conceitos, densidade }
   */
  analisarSemantica(texto) {
    const palavras = texto.split(/\s+/).filter(w => w.length > 3);
    const freq = {};

    for (const w of palavras) {
      const key = w.toLowerCase().replace(/[.,;:!?()"]/g, "");
      if (!key.match(/^(para|com|como|onde|quando|entre|pois|este|esta|isso|aquele|aquela|são|estão|pode|ser|mais|menos|muito|cada|outro|porque|seja|todo|toda|essa|aquele|essa|essa)$/))
        freq[key] = (freq[key] || 0) + 1;
    }

    const chaves = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(e => e[0]);

    const resumo = texto.split(/[.!?]/)
      .filter(s => s.trim().length > 40)
      .slice(0, 2)
      .join('. ') + '.';

    const titulo = chaves[0]
      ? chaves[0][0].toUpperCase() + chaves[0].slice(1)
      : "Conteúdo";

    const mediaPalavras = palavras.length / (texto.split(/[.!?]/).length || 1);
    let densidade = "📗 leve";
    if (mediaPalavras > 18 && chaves.length > 7) densidade = "📙 densa";
    else if (mediaPalavras > 12) densidade = "📘 média";

    return { titulo, resumo, conceitos: chaves, densidade };
  }
};
