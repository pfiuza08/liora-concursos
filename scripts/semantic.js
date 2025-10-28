// ==========================================================
// 🧠 Liora — Módulo de Processamento Semântico (semantic.js)
// ==========================================================
// Responsável por analisar blocos de texto e extrair:
// - Palavras-chave relevantes (conceitos)
// - Resumo contextualizado
// - Grau de densidade cognitiva
// ==========================================================

console.log("🧩 semantic.js carregado com sucesso");

// ==========================================================
// 🔍 Função principal — análise semântica
// ==========================================================
function analisarSemantica(texto) {
  if (!texto || texto.trim().length < 20) {
    return {
      titulo: "Conteúdo breve",
      resumo: texto.trim(),
      conceitos: [],
      densidade: "📗 leve"
    };
  }

  // --- Normalização ---
  const textoLimpo = texto
    .replace(/\s+/g, " ")
    .replace(/[“”‘’"']/g, "")
    .trim();

  const palavras = textoLimpo.split(/\s+/).filter(w => w.length > 2);

  // --- Frequência de palavras ---
  const freq = {};
  for (const w of palavras) {
    const key = w.toLowerCase().replace(/[.,;:!?()]/g, "");
    if (!key.match(/^(para|com|como|onde|quando|entre|pois|este|esta|isso|aquele|aquela|são|estão|pode|ser|mais|menos|muito|cada|outro|porque|seja|todo|toda|essa|aquele|essa|essa|que|nos|nas|das|dos|pelos|pelas|tem|há|sobre|após|antes)$/)) {
      freq[key] = (freq[key] || 0) + 1;
    }
  }

  const conceitos = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(e => e[0]);

  // --- Resumo (duas frases principais) ---
  const frases = textoLimpo.split(/(?<=[.!?])\s+/).filter(s => s.length > 40);
  const resumo = frases.slice(0, 2).join(" ") + (frases.length > 2 ? " ..." : "");

  // --- Título gerado automaticamente ---
  const titulo = conceitos.length > 0
    ? conceitos[0].charAt(0).toUpperCase() + conceitos[0].slice(1)
    : "Conteúdo analisado";

  // --- Densidade cognitiva ---
  const mediaPalavras = palavras.length / (frases.length || 1);
  let densidade = "📗 leve";
  if (mediaPalavras > 18 && conceitos.length > 7) densidade = "📙 densa";
  else if (mediaPalavras > 12) densidade = "📘 média";

  return { titulo, resumo, conceitos, densidade };
}

// ==========================================================
// 🧩 Função auxiliar — comparação semântica entre textos
// ==========================================================
// Retorna um índice de similaridade simples entre 0 e 1.
function similaridadeSemantica(a, b) {
  if (!a || !b) return 0;
  const palavrasA = new Set(a.toLowerCase().split(/\s+/));
  const palavrasB = new Set(b.toLowerCase().split(/\s+/));
  const intersecao = [...palavrasA].filter(x => palavrasB.has(x));
  return intersecao.length / Math.max(palavrasA.size, palavrasB.size);
}

// ==========================================================
// 📊 Análise de diversidade lexical
// ==========================================================
// Mede quão variado é o vocabulário usado.
function diversidadeLexical(texto) {
  const palavras = texto.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const unicas = new Set(palavras);
  const indice = (unicas.size / palavras.length) * 100;
  if (indice > 60) return "🎨 Diverso";
  if (indice > 40) return "⚖️ Moderado";
  return "🧩 Reduzido";
}

// ==========================================================
// 🌐 Exportação para o escopo global (necessário p/ integração)
// ==========================================================
window.analisarSemantica = analisarSemantica;
window.similaridadeSemantica = similaridadeSemantica;
window.diversidadeLexical = diversidadeLexical;

console.log("✅ semantic.js pronto e integrado ao escopo global");
