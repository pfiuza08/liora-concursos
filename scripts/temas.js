// ==========================================================
// 🎯 Liora — Módulo de Temas com Diagnóstico Integrado
// ==========================================================

console.log("🧩 Iniciando carregamento de temas.js...");

(function () {
  try {
    // ==============================
    // 🔍 Diagnóstico inicial
    // ==============================
    const coreAtivo = typeof window.state !== "undefined";
    const semanticAtivo = typeof window.analisarSemantica !== "undefined";
    const planoAtivo = typeof window.LioraSimulador !== "undefined";

    console.log(`🧠 core: ${coreAtivo ? "🟢 ativo" : "🔴 ausente"}`);
    console.log(`🧩 semantic: ${semanticAtivo ? "🟢 ativo" : "🔴 ausente"}`);
    console.log(`📘 simulador: ${planoAtivo ? "🟢 ativo" : "🔴 ausente"}`);

    // ==============================
    // 🧩 Interface de temas
    // ==============================
    window.LioraTemas = {
      iniciar() {
        console.log("🚀 LioraTemas.iniciar() chamado");
        this.criarBotao();
      },

      criarBotao() {
        const btn = document.createElement("button");
        btn.id = "btn-escolher-tema";
        btn.textContent = "🎯 Escolher Tema";
        btn.className = "btn fixed bottom-6 right-6 z-40";
        btn.style.background = "var(--brand)";
        btn.style.color = "#fff";
        btn.style.borderRadius = "1rem";
        btn.style.padding = "10px 16px";
        btn.style.fontSize = "14px";
        btn.style.boxShadow = "0 4px 10px rgba(0,0,0,0.25)";
        btn.onclick = () => this.abrirModal();
        document.body.appendChild(btn);
        console.log("✅ Botão de tema criado");
      },

      abrirModal() {
        console.log("📋 Abrindo modal de temas...");
        const modal = document.createElement("div");
        modal.id = "modal-temas";
        modal.style.position = "fixed";
        modal.style.inset = "0";
        modal.style.background = "rgba(0,0,0,0.7)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.zIndex = "3000";

        modal.innerHTML = `
          <div style="
            background:var(--card);
            color:var(--fg);
            padding:1.5rem;
            border-radius:1rem;
            box-shadow:var(--shadow);
            width:90%;
            max-width:500px;
            animation:fadeIn 0.3s ease;
          ">
            <h3 style="font-weight:600;margin-bottom:0.8rem;">🎯 Escolher Tema</h3>
            <p style="font-size:0.85rem;color:var(--muted);margin-bottom:0.8rem;">
              Digite o tema de estudo e escolha seu nível de dificuldade.
            </p>
            <input id="tema-nome" type="text" placeholder="Ex.: Inteligência Artificial" style="
              width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;margin-bottom:10px;
              background:var(--bg2);color:var(--fg);
            "/>
            <select id="tema-nivel" style="
              width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;
              background:var(--bg2);color:var(--fg);
            ">
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
            <div style="text-align:right;margin-top:1rem;">
              <button id="btn-confirmar-tema" class="chip">Confirmar</button>
              <button id="btn-cancelar-tema" class="chip">Cancelar</button>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        document.getElementById("btn-cancelar-tema").onclick = () => modal.remove();
        document.getElementById("btn-confirmar-tema").onclick = () => {
          const tema = document.getElementById("tema-nome").value.trim();
          const nivel = document.getElementById("tema-nivel").value;
          if (!tema) return alert("Digite um tema primeiro.");

          console.log(`🎯 Tema selecionado: ${tema} (${nivel})`);
          modal.remove();

          // Atualiza o estado global, se o core estiver ativo
          if (window.state) {
            window.state.tema = tema;
            window.state.nivel = nivel;
            console.log("✅ Estado global atualizado:", window.state);
          } else {
            alert("⚠️ Core não detectado. Tema salvo localmente.");
            localStorage.setItem("liora_tema", tema);
            localStorage.setItem("liora_nivel", nivel);
          }

          // Feedback visual
          const aviso = document.createElement("div");
          aviso.textContent = `✅ Tema "${tema}" (${nivel}) salvo`;
          aviso.style.position = "fixed";
          aviso.style.bottom = "20px";
          aviso.style.right = "20px";
          aviso.style.background = "var(--brand)";
          aviso.style.color = "#fff";
          aviso.style.padding = "10px 16px";
          aviso.style.borderRadius = "10px";
          aviso.style.fontSize = "13px";
          aviso.style.zIndex = "4000";
          aviso.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
          document.body.appendChild(aviso);
          setTimeout(() => aviso.remove(), 2500);
        };
      },
    };

    // Inicia automaticamente após DOM carregado
    document.addEventListener("DOMContentLoaded", () => {
      console.log("✅ temas.js inicializado com sucesso");
      window.LioraTemas.iniciar();
    });

  } catch (err) {
    console.error("💥 Erro ao carregar temas.js:", err);

    // Aviso visual de falha
    const erroBox = document.createElement("div");
    erroBox.textContent = "⚠️ Erro no carregamento de temas.js";
    erroBox.style.position = "fixed";
    erroBox.style.bottom = "20px";
    erroBox.style.right = "20px";
    erroBox.style.background = "#b91c1c";
    erroBox.style.color = "white";
    erroBox.style.padding = "8px 14px";
    erroBox.style.borderRadius = "10px";
    erroBox.style.zIndex = "4000";
    document.body.appendChild(erroBox);
  }
})();
