// ==========================================================
// 🎓 Liora — Planos de estudo por tema, nível e ritmo
// ==========================================================

function gerarPlanoPorPrompt(tema, nivel, dias, intensidade) {
  const descricoesNivel = {
    iniciante: {
      foco: "Compreensão dos conceitos básicos",
      carga: intensidade === "intensivo" ? "40 min" : intensidade === "equilibrado" ? "30 min" : "20 min",
      densidade: intensidade === "intensivo" ? "📘 média" : "📗 leve",
      verbo: "Introduzir",
      tarefas: ["leitura guiada", "anotações", "questões simples"]
    },
    intermediario: {
      foco: "Aprofundamento e prática aplicada",
      carga: intensidade === "intensivo" ? "60 min" : intensidade === "equilibrado" ? "45 min" : "30 min",
      densidade: intensidade === "intensivo" ? "📙 densa" : "📘 média",
      verbo: "Explorar",
      tarefas: ["resumo crítico", "mapa mental", "questões de bancas"]
    },
    avancado: {
      foco: "Domínio conceitual e prática avançada",
      carga: intensidade === "intensivo" ? "90 min" : intensidade === "equilibrado" ? "60 min" : "45 min",
      densidade: intensidade === "intensivo" ? "📙 densa" : "📘 média",
      verbo: "Aprofundar",
      tarefas: ["simulados complexos", "revisão teórica", "redação discursiva"]
    }
  };

  const base = descricoesNivel[nivel] || descricoesNivel.iniciante;
  const plano = [];

  for (let i = 0; i < dias; i++) {
    const sessao = i + 1;
    const focoDoDia = `${base.verbo} aspectos de ${tema} (parte ${sessao})`;
    const tarefas = base.tarefas
      .slice(0, 2 + (i % base.tarefas.length))
      .map(t => `• ${t}`)
      .join("\n");

    plano.push({
      dia: sessao,
      titulo: `Sessão ${sessao} — ${tema}`,
      objetivo: `${base.foco}.`,
      tarefa: tarefas,
      tempo: base.carga,
      revisao: `${2 + (i % 3)} dias`,
      densidade: base.densidade,
      descricao: `${focoDoDia}. Nesta sessão, ${base.verbo.toLowerCase()} os pontos-chave e desenvolva autonomia no tema.`
    });
  }

  return plano;
}

// ==========================================================
// 🔊 Fala da Liora — emocional + voz feminina + chime
// ==========================================================
function falar(texto, tipo = "neutro") {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // 🎵 som de sininho leve
    const tocarChime = (freq = 880, dur = 0.25) => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    };

    // 🧠 configurações emocionais por tipo
    const tons = {
      saudacao: { rate: 1.3, pitch: 1.45, freq: 950 },
      instrucao: { rate: 1.2, pitch: 1.25, freq: 820 },
      encerramento: { rate: 1.1, pitch: 1.15, freq: 700 },
      neutro: { rate: 1.15, pitch: 1.25, freq: 850 }
    };
    const tom = tons[tipo] || tons.neutro;

    const falarAgora = () => {
      const utter = new SpeechSynthesisUtterance(texto);
      utter.lang = "pt-BR";
      utter.rate = tom.rate;
      utter.pitch = tom.pitch;
      utter.volume = 1.0;

      const vozes = synth.getVoices();
      const preferidas = [
        "Google português do Brasil",
        "Microsoft Maria - Portuguese (Brazil)",
        "Microsoft Francisca - Portuguese (Brazil)",
        "Luciana",
        "Camila"
      ];

      const voz = vozes.find(v =>
        v.lang === "pt-BR" &&
        preferidas.some(n => v.name.includes(n))
      ) || vozes.find(v => v.lang === "pt-BR");

      if (voz) utter.voice = voz;

      tocarChime(tom.freq);
      utter.onend = () => tocarChime(tom.freq * 0.8);

      synth.cancel();
      synth.speak(utter);
    };

    if (synth.getVoices().length === 0) synth.onvoiceschanged = falarAgora;
    else falarAgora();
  } catch (e) {
    console.warn("Falha ao usar SpeechSynthesis:", e);
  }
}

// ==========================================================
// 💬 Modal Interativo da Liora com voz motivacional
// ==========================================================
function perguntarNivelEIntensidade(tema, callback) {
  document.getElementById("liora-dialogo")?.remove();

  const modal = document.createElement("div");
  modal.id = "liora-dialogo";
  modal.innerHTML = `
    <div class="liora-backdrop">
      <div class="liora-modal">
        <h2>💪 Olá! Eu sou a Liora.</h2>
        <p>Antes de montar seu plano sobre <b>${tema}</b>, me diga:</p>

        <div id="step-1">
          <p class="pergunta">Qual o seu nível de conhecimento?</p>
          <div class="opcoes">
            <button class="chip" data-nivel="iniciante">🟢 Iniciante</button>
            <button class="chip" data-nivel="intermediario">🔵 Intermediário</button>
            <button class="chip" data-nivel="avancado">🟣 Avançado</button>
          </div>
        </div>

        <div id="step-2" style="display:none;">
          <p class="pergunta">Como quer o ritmo do plano?</p>
          <div class="opcoes">
            <button class="chip" data-int="leve">🌿 Leve</button>
            <button class="chip" data-int="equilibrado">⚖️ Equilibrado</button>
            <button class="chip" data-int="intensivo">🔥 Intensivo</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // === estilo modal
  const style = document.createElement("style");
  style.textContent = `
    .liora-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.3s ease;
    }
    .liora-modal {
      background: var(--card);
      color: var(--fg);
      padding: 2rem;
      border-radius: 1rem;
      width: 90%;
      max-width: 480px;
      box-shadow: 0 0 25px rgba(0,0,0,0.4);
      text-align: center;
      transform: scale(0.95);
      opacity: 0;
      animation: modalIn 0.35s ease forwards;
    }
    @keyframes modalIn {
      to { transform: scale(1); opacity: 1; }
    }
    .liora-modal h2 {
      font-weight: 700;
      font-size: 1.3rem;
      margin-bottom: 0.3rem;
      color: var(--brand, #c44b04);
    }
    .liora-modal p {
      font-size: 0.9rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }
    .pergunta {
      font-weight: 500;
      color: var(--fg);
      margin-bottom: 0.5rem;
    }
    .opcoes {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .chip {
      background: var(--brand, #c44b04);
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 0.4rem 0.9rem;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .chip:hover {
      background: #e05700;
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);

  // === fala guiada ===
  setTimeout(() => {
    falar("Olá! Eu sou a Liora, sua mentora de estudos. Vamos definir o seu plano!", "saudacao");
    setTimeout(() => {
      falar(`Qual é o seu nível de conhecimento sobre ${tema}? Iniciante, intermediário ou avançado?`, "instrucao");
    }, 2500);
  }, 500);

  let nivelEscolhido = null;

  modal.querySelectorAll("[data-nivel]").forEach(btn => {
    btn.addEventListener("click", e => {
      nivelEscolhido = e.target.dataset.nivel;
      modal.querySelector("#step-1").style.display = "none";
      modal.querySelector("#step-2").style.display = "block";
      falar("Excelente! Agora me diga qual ritmo prefere: leve, equilibrado ou intensivo?", "instrucao");
    });
  });

  modal.querySelectorAll("[data-int]").forEach(btn => {
    btn.addEventListener("click", e => {
      const intensidade = e.target.dataset.int;
      modal.remove();
      falar("Show! Estou montando seu plano de estudos agora. Prepare-se para evoluir!", "encerramento");
      callback(nivelEscolhido, intensidade);
    });
  });

  modal.addEventListener("click", e => {
    if (e.target.classList.contains("liora-backdrop")) modal.remove();
  });
}

// ==========================================================
// 🔗 Integração com o botão “Gerar plano”
// ==========================================================
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-gerar");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const s = window.state;
    s.tema = document.getElementById("inp-tema").value.trim();
    if (!s.tema || s.materialTexto) return;

    perguntarNivelEIntensidade(s.tema, (nivel, intensidade) => {
      s.nivel = nivel;
      s.intensidade = intensidade;
      const plano = gerarPlanoPorPrompt(s.tema, nivel, s.dias, intensidade);
      s.plano = plano;

      const container = document.getElementById("plano");
      container.innerHTML = "";

      plano.forEach(sessao => {
        const div = document.createElement("div");
        div.className = "session-card";
        div.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <h3>${sessao.titulo}</h3>
            <span class="text-xs opacity-70">${sessao.densidade}</span>
          </div>
          <p class="text-sm text-[var(--muted)] italic mb-2">🎯 ${sessao.objetivo}</p>
          <p>${sessao.descricao}</p>
          <p class="text-sm mt-2">💬 <b>Tarefas:</b><br>${sessao.tarefa.replace(/\n/g, "<br>")}</p>
          <p class="text-xs text-[var(--muted)] mt-1">🕐 Tempo: ${sessao.tempo} · 🔁 Revisar em ${sessao.revisao}</p>
        `;
        container.appendChild(div);
      });

      document.getElementById("status").textContent =
        `📚 Plano de estudo (${nivel}, ${intensidade}) gerado para “${s.tema}”.`;
    });
  });
});
