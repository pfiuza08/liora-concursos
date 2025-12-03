// ==========================================================
// 🔐 LIORA — SECRET RESET TOOL v2 (COMERCIAL)
// - Reset completo APENAS quando pressionar: CTRL + SHIFT + ALT + R
// - Limpa localStorage, sessionStorage, caches e estados da Liora
// - Painel visual de confirmação + reload automático
// ==========================================================

(function () {
  console.log("🕵️‍♂️ Liora Reset Secreto carregado. Aguardando combinação...");

  // ---------------------------------------------------------
  // Função principal de reset
  // ---------------------------------------------------------
  function executarResetSecreto() {
    console.log("🧹 Executando reset secreto da Liora...");

    // 1. Storages
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log("✔️ Storages limpos");
    } catch (e) {
      console.warn("⚠️ Erro ao limpar storages:", e);
    }

    // 2. Caches
    if (window.caches) {
      caches.keys().then(keys =>
        keys.forEach(k => {
          caches.delete(k);
          console.log("✔️ Cache removido:", k);
        })
      );
    }

    // 3. Estados globais
    try {
      window.liora = {};
      window.lioraEstudos = null;
      window.lioraPlano = null;
      window.lioraSessoes = [];
      window.lioraCache = {};
      console.log("✔️ Estados internos resetados");
    } catch (e) {
      console.warn("⚠️ Erro ao resetar estados:", e);
    }

    // 4. Painel de confirmação
    const box = document.createElement("div");
    box.style = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: #111;
      color: #fff;
      padding: 16px 22px;
      border-radius: 12px;
      font-family: Inter, sans-serif;
      font-size: 14px;
      box-shadow: 0 0 20px rgba(0,0,0,0.4);
    `;
    box.innerHTML = `
      <div style="font-weight:600; font-size:15px; margin-bottom:6px;">🔄 Reset SECRETO da Liora concluído!</div>
      <div>Todos os dados foram apagados.</div>
      <div style="opacity:0.7">Recarregando em 1.5s...</div>
    `;
    document.body.appendChild(box);

    // 5. Recarregar automaticamente
    setTimeout(() => location.reload(true), 1500);
  }

  // ---------------------------------------------------------
  // Listener da combinação secreta
  // ---------------------------------------------------------
  document.addEventListener("keydown", (e) => {
    // CTRL + SHIFT + ALT + R
    if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === "r") {
      executarResetSecreto();
    }
  });
})();
