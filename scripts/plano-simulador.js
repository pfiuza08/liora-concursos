// ==========================================================
// 🧠 Liora — Gerador Simulado de Plano de Estudo Inteligente
// ==========================================================

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("plano");
  const status = document.getElementById("status");
  const btn = document.getElementById("btn-gerar");

  if (!container || !btn) return;

  btn.addEventListener("click", () => {
    const tema = document.getElementById("inp-tema").value.trim();
    if (!tema) return alert("Digite um tema antes de continuar.");

    // Verifica se já temos nível e ritmo escolhidos
    const s = window.state || {};
    if (!s.nivel || !s.intensidade) {
      status.textContent = "⏳ Aguarde: coletando informações sobre o tema...";
      return;
    }

    const nivel = s.nivel;
    const intensidade = s.intensidade;
    const dias = s.dias || 7;

    // 🎯 Cria o prompt base
    const prompt = `
Você é uma mentora de estudos chamada Liora.
Crie um plano de estudo detalhado e progressivo sobre o tema "${tema}" considerando:
- nível de conhecimento: ${nivel}
- ritmo de estudo: ${intensidade}
- duração: ${dias} dias

Cada sessão deve conter:
1. Título da sessão
2. Objetivo de aprendizagem
3. Conteúdos principais (3 a 6 tópicos curtos e claros)
4. Atividades práticas de estudo (resumos, mapas mentais, simulados, etc.)
5. Tempo estimado de estudo
6. Indicação de revisão (ex: revisar em 2 dias)

A linguagem deve ser natural, encorajadora e didática, com tom de mentoria.
Evite frases genéricas. Organize o plano em seções numeradas com subtítulos claros.
    `.trim();

    // 💬 Renderiza o prompt na tela
    renderPrompt(tema, nivel, intensidade, dias, prompt);
  });

  function renderPrompt(tema, nivel, intensidade, dias, prompt) {
    container.innerHTML = "";

    const card = document.createElement("div");
    card.className = "card p-5";
    card.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">🧩 Prompt gerado</h3>
      <p class="text-sm text-[var(--muted)] mb-3">
        Este é o texto que será enviado à IA para gerar o plano de estudos.
      </p>
      <pre id="prompt-box" style="
        background: var(--card);
        border: 1px solid var(--stroke);
        border-radius: 0.75rem;
        padding: 1rem;
        white-space: pre-wrap;
        line-height: 1.5;
        max-height: 400px;
        overflow-y: auto;
        font-size: 0.9rem;
      ">${prompt}</pre>
      <div class="flex justify-end gap-2 mt-3">
        <button id="btn-copy" class="chip">📋 Copiar</button>
        <button id="btn-enviar" class="btn">🚀 Gerar com IA</button>
      </div>
    `;

    container.appendChild(card);
    status.textContent = `✅ Prompt gerado para "${tema}" (${nivel}, ${intensidade}, ${dias} dias)`;

    // Copiar prompt
    document.getElementById("btn-copy").addEventListener("click", async () => {
      await navigator.clipboard.writeText(prompt);
      alert("Prompt copiado! Pronto para enviar à IA.");
    });

    // Placeholder: ação do botão “Gerar com IA”
    document.getElementById("btn-enviar").addEventListener("click", () => {
      alert("🚀 (Em breve) O plano será gerado automaticamente pela Liora IA.");
    });

    // 🔊 Fala introdutória
    if (typeof falar === "function") {
      falar(`Tudo certo! Montei o prompt para seu plano de estudos em ${tema}.`, "saudacao");
    }
  }
});
