// ==========================================================
// semantic.js — Módulo de Análise Semântica e Classificação
// ==========================================================

export function normalizarTextoParaPrograma(texto) {
  return texto
    .replace(/\r/g, "")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(
      /(\s|^)((\d+(\.\d+){0,3}[\.\)])|([IVXLCDM]+\.)|([A-Z]\))|([a-z]\))|[•\-–])\s+/g,
      "\n$2 "
    )
    .replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "$1\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ==========================================================
// 🧪 Classificação do tipo de material
// ==========================================================
export function medirSinais(textoNormalizado) {
  const linhas = textoNormalizado.split(/\n+/).filter(Boolean);
  const total = linhas.length || 1;

  const marcadoresRegex = /^((\d+(\.\d+){0,3}[\.\)])|([IVXLCDM]+\.)|([A-Z]\))|([a-z]\))|[•\-–])/;
  const verboRegex = /\b(é|são|representa|define|explica|trata|apresenta|demonstra|envolve|caracteriza|consiste|mostra)\b/i;
  const fimParagrafoRegex = /[.!?]\s*$/;

  let bullets = 0, longas = 0, verbais = 0, fimPar = 0, capsLike = 0, maxRunBullets = 0, run = 0;

  for (const l of linhas) {
    const palavras = l.split(/\s+/);
    const isBullet = marcadoresRegex.test(l);
    const isLonga = palavras.length >= 12;
    const isVerbal = verboRegex.test(l);
    const isParagrafo = fimParagrafoRegex.test(l);
    const isCapsLike = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ]{6,}$/.test(l) && !/[.!?]$/.test(l);

    if (isBullet) bullets++;
    if (isLonga) longas++;
    if (isVerbal) verbais++;
    if (isParagrafo) fimPar++;
    if (isCapsLike) capsLike++;

    run = isBullet ? run + 1 : 0;
    if (run > maxRunBullets) maxRunBullets = run;
  }

  return { total, pBullets: bullets / total, pLongas: longas / total, pVerbais: verbais / total, pFimPar: fimPar / total, pCaps: capsLike / total, maxRunBullets };
}

export function decidirTipo(s) {
  if (s.pBullets >= 0.25 && (s.maxRunBullets >= 2 || s.pCaps >= 0.1)) return "programa";
  if (s.pLongas >= 0.55 && s.pFimPar >= 0.45 && s.pBullets < 0.25) return "conteudo";
  if (s.pCaps >= 0.1 && s.pBullets >= 0.15 && s.pLongas >= 0.4) return "hibrido";
  if (s.total < 15 && s.pLongas >= 0.4) return "conteudo";
  return "hibrido";
}

export function detectarTipoMaterial(texto) {
  if (!texto || texto.trim().length < 80) return "conteudo";
  const normalizado = normalizarTextoParaPrograma(texto);
  const sinais = medirSinais(normalizado);
  return decidirTipo(sinais);
}

// ==========================================================
// 🧠 Processamento semântico (resumo, conceitos, densidade)
// ==========================================================
export function analisarSemantica(texto) {
  const palavras = texto.split(/\s+/).filter(w => w.length > 3);
  const freq = {};
  for (const w of palavras) {
    const key = w.toLowerCase().replace(/[.,;:!?()"]/g, "");
    if (!key.match(/^(para|com|como|onde|quando|entre|pois|este|esta|isso|aquele|aquela|são|estão|pode|ser|mais|menos|muito|cada|outro|porque|seja|todo|toda|essa|aquele|essa|essa)$/))
      freq[key] = (freq[key] || 0) + 1;
  }
  const chaves = Object.entries(freq)
    .sort((a,b) => b[1]-a[1])
    .slice(0,10)
    .map(e => e[0]);

  const resumo = texto.split(/[.!?]/)
    .filter(s => s.trim().length > 40)
    .slice(0,2)
    .join('. ') + '.';

  const titulo = chaves[0] ? chaves[0][0].toUpperCase() + chaves[0].slice(1) : "Conteúdo";

  const mediaPalavras = palavras.length / (texto.split(/[.!?]/).length || 1);
  let densidade = "📗 leve";
  if (mediaPalavras > 18 && chaves.length > 7) densidade = "📙 densa";
  else if (mediaPalavras > 12) densidade = "📘 média";

  return { titulo, resumo, conceitos: chaves, densidade };
}
