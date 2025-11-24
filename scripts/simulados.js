// ==============================================================
// 🧠 LIORA — SIMULADOS v12 (LAYOUT COMERCIAL)
// - Gera simulados mock por banca / dificuldade / tema
// - Timer, barra de progresso, navegação entre questões
// - Resultado completo + lista de questões + histórico recente
// - Salva histórico em localStorage (compatível com Dashboard)
// - Botão "Configurar simulado" criado dentro de #area-simulado
// ==============================================================

(function () {
  console.log("🔵 Liora Simulados v12 (layout comercial) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------
    // ELEMENTOS
    // ------------------------------------------------------
    const els = {
      areaSimulado: document.getElementById("area-simulado"),

      // simulado
      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),
      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),

      // modal
      modalBackdrop: document.getElementById("sim-modal-backdrop"),
      modalClose: document.getElementById("sim-modal-close-btn"),
      modalIniciar: document.getElementById("sim-modal-iniciar"),

      selBanca: document.getElementById("sim-modal-banca"),
      selQtd: document.getElementById("sim-modal-qtd"),
      selTempo: document.getElementById("sim-modal-tempo"),
      selDificuldade: document.getElementById("sim-modal-dificuldade"),
      inpTema: document.getElementById("sim-modal-tema"),
    };

    // sanity check
    if (!els.areaSimulado || !els.modalBackdrop || !els.modalIniciar) {
      console.warn("⚠️ Simulados: elementos principais não encontrados.");
      return;
    }

      // 📌 FAB comercial do simulador
      const fabSim = document.getElementById("sim-fab");
      
      if (fabSim) {
        fabSim.addEventListener("click", abrirModal);
      } else {
        console.warn("⚠️ FAB de simulados não encontrado: #sim-fab");
      }

       // ------------------------------------------------------
    // ESTADO
    // ------------------------------------------------------
    const HIST_KEY = "liora:simulados:historico";

    const estado = {
      questoes: [],
      indiceAtual: 0,
      banca: "FGV",
      qtd: 20,
      dificuldade: "misturado", // misturado | facil | medio | dificil
      tempoProvaMin: 30,
      tempoRestanteSeg: 0,
      tema: "",
      timerId: null,
    };

    // ------------------------------------------------------
    // HISTÓRICO
    // ------------------------------------------------------
    function carregarHistorico() {
      try {
        const raw = localStorage.getItem(HIST_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function salvarNoHistorico(resumo) {
      const hist = carregarHistorico();
      hist.push(resumo);
      try {
        localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      } catch (e) {
        console.warn("⚠️ Não foi possível salvar histórico de simulados", e);
      }
    }

    // ------------------------------------------------------
    // MODAL — abrir / fechar
    // ------------------------------------------------------
    function abrirModal() {
      els.modalBackdrop.style.display = "flex";
      els.modalBackdrop.classList.add("visible");
    }

    function fecharModal() {
      els.modalBackdrop.classList.remove("visible");
      els.modalBackdrop.style.display = "none";
    }

    btnConfig.addEventListener("click", abrirModal);

    if (els.modalClose) {
      els.modalClose.addEventListener("click", fecharModal);
    }

    els.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.modalBackdrop) fecharModal();
    });

    // ------------------------------------------------------
    // TIMER
    // ------------------------------------------------------
    function formatarTempo(seg) {
      const m = Math.floor(seg / 60);
      const s = seg % 60;
      return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    function iniciarTimer() {
      estado.tempoRestanteSeg = estado.tempoProvaMin * 60;

      if (els.timer) {
        els.timer.classList.remove("hidden");
        els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);
      }

      estado.timerId = setInterval(() => {
        estado.tempoRestanteSeg--;
        if (els.timer) {
          els.timer.textContent = formatarTempo(Math.max(estado.tempoRestanteSeg, 0));
        }

        if (estado.tempoRestanteSeg <= 0) {
          pararTimer();
          finalizarSimulado(true);
        }
      }, 1000);
    }

    function pararTimer() {
      if (estado.timerId) clearInterval(estado.timerId);
      estado.timerId = null;
    }

    // ------------------------------------------------------
    // PERFIS DE BANCA (mock avançado)
    // ------------------------------------------------------
    const PERFIS = {
      FGV: {
        estilo: "contextual",
        texto:
          "A banca FGV costuma explorar textos mais longos, com interpretação fina e pegadinhas conceituais.",
      },
      CESPE: {
        estilo: "certo_errado",
        texto:
          "A banca Cebraspe (CESPE) trabalha com itens de certo/errado, privilegiando literalidade técnica e coerência lógica.",
      },
      VUNESP: {
        estilo: "objetiva",
        texto:
          "A banca Vunesp tende a trazer questões objetivas mais diretas, mas com detalhe conceitual importante.",
      },
      FCC: {
        estilo: "objetiva",
        texto:
          "A banca FCC combina objetividade com foco em classificações, conceitos formais e exceções de norma.",
      },
      QUADRIX: {
        estilo: "objetiva",
        texto:
          "A banca Quadrix mistura literalidade com cenários práticos, cobrando conceitos aplicados.",
      },
      IBFC: {
        estilo: "objetiva",
        texto:
          "A banca IBFC costuma variar entre questões diretas e enunciados com contexto resumido.",
      },
    };

    function getPerfil(banca) {
      return PERFIS[banca] || PERFIS["FGV"];
    }

    // ------------------------------------------------------
    // BADGE DE DIFICULDADE (pílula visual)
    // ------------------------------------------------------
    function formatarNivelBadge(nivel) {
      let emoji = "🟢";
      let label = "Fácil";
      let bg = "rgba(34,197,94,0.18)";
      let color = "rgb(187,247,208)";

      if (nivel === "medio") {
        emoji = "🟡";
        label = "Médio";
        bg = "rgba(250,204,21,0.18)";
        color = "rgb(254,240,138)";
      } else if (nivel === "dificil") {
        emoji = "🔴";
        label = "Difícil";
        bg = "rgba(248,113,113,0.2)";
        color = "rgb(254,202,202)";
      }

      return `
        <span
          style="
            display:inline-flex;
            align-items:center;
            gap:4px;
            padding:2px 10px;
            border-radius:999px;
            font-size:0.75rem;
            font-weight:600;
            background:${bg};
            color:${color};
            border:1px solid rgba(255,255,255,0.08);
          "
        >
          <span>${emoji}</span>
          <span>${label}</span>
        </span>
      `;
    }

    // ------------------------------------------------------
    // GERA QUESTÕES (mock avançado)
    // ------------------------------------------------------
    function gerarQuestoesMock() {
      const perfil = getPerfil(estado.banca);
      const qs = [];
      const total = estado.qtd;

      let qtdPorNivel = { facil: 0, medio: 0, dificil: 0 };

      if (estado.dificuldade === "misturado") {
        qtdPorNivel.facil = Math.floor(total * 0.3);
        qtdPorNivel.medio = Math.floor(total * 0.4);
        qtdPorNivel.dificil = total - qtdPorNivel.facil - qtdPorNivel.medio;
      } else {
        qtdPorNivel[estado.dificuldade] = total;
      }

      function add(n, nivel) {
        for (let i = 0; i < n; i++) {
          qs.push(criarQuestaoMock(qs.length + 1, nivel, perfil));
        }
      }

      add(qtdPorNivel.facil, "facil");
      add(qtdPorNivel.medio, "medio");
      add(qtdPorNivel.dificil, "dificil");

      return qs;
    }

    function criarQuestaoMock(indice, nivel, perfil) {
      const tema = estado.tema || "o tema escolhido";

      const dificuldadeLabel =
        nivel === "facil"
          ? "Fácil"
          : nivel === "medio"
          ? "Médio"
          : "Difícil";

      // Cebraspe / C/E
      if (perfil.estilo === "certo_errado") {
        const afirmacaoBase =
          nivel === "facil"
            ? `No contexto introdutório de ${tema}, considere a seguinte afirmação.`
            : nivel === "medio"
            ? `Em nível intermediário de ${tema}, avalie o seguinte enunciado.`
            : `Em nível avançado de ${tema}, julgue o item a seguir, típico da banca Cebraspe.`;

        const enunciado = `${perfil.texto}\n\n${afirmacaoBase}\nA afirmação acima está correta? (Nível ${dificuldadeLabel})`;

        return {
          indice,
          nivel,
          banca: estado.banca,
          tipo: "certo_errado",
          enunciado,
          alternativas: ["Certo", "Errado"],
          corretaIndex: Math.random() > 0.5 ? 0 : 1,
          respostaAluno: null,
        };
      }

      // Outras bancas: múltipla escolha contextual
      const intro =
        nivel === "facil"
          ? `Questão introdutória sobre ${tema}, exigindo compreensão básica e identificação direta de conceito.`
          : nivel === "medio"
          ? `Questão intermediária sobre ${tema}, explorando associação entre conceitos e interpretação moderada.`
          : `Questão avançada sobre ${tema}, típica de revisão de alto nível, com foco em detalhes e exceções.`;

      const enunciado = `${perfil.texto}\n\n${intro}\nAssinale a alternativa correta, de acordo com o padrão da banca ${estado.banca}. (Nível ${dificuldadeLabel})`;

      const alternativas = [
        `A) Alternativa alinhada ao gabarito oficial, apresentando a interpretação correta de ${tema}.`,
        `B) Alternativa com erro conceitual direto ou inversão simples de ideia.`,
        `C) Alternativa parcialmente correta, mas com omissão ou generalização indevida.`,
        `D) Alternativa com pegadinha típica da banca, usando termos como "sempre", "nunca" ou "apenas".`,
      ];

      const correta = Math.floor(Math.random() * 4);

      return {
        indice,
        nivel,
        banca: estado.banca,
        tipo: "objetiva",
        enunciado,
        alternativas,
        corretaIndex: correta,
        respostaAluno: null,
      };
    }

    // ------------------------------------------------------
    // RENDERIZAR QUESTÃO
    // ------------------------------------------------------
    function render() {
      if (!els.questaoContainer) return;

      const total = estado.questoes.length;
      if (!total) {
        els.questaoContainer.innerHTML =
          '<p class="text-sm text-[var(--muted)]">Nenhum simulado em andamento. Clique em <b>Configurar simulado</b> para começar.</p>';
        if (els.nav) els.nav.classList.add("hidden");
        if (els.progressBar) els.progressBar.style.width = "0%";
        return;
      }

      const q = estado.questoes[estado.indiceAtual];
      els.questaoContainer.innerHTML = "";

      const header = document.createElement("div");
      header.className =
        "flex justify-between items-center text-xs text-[var(--muted)] mb-3";

      const nivelBadge = formatarNivelBadge(q.nivel);

      header.innerHTML = `
        <span>Questão ${q.indice} de ${total}</span>
        <span>${q.banca} · ${nivelBadge}</span>
      `;
      els.questaoContainer.appendChild(header);

      const p = document.createElement("p");
      p.className = "sim-enunciado mb-3 whitespace-pre-line";
      p.textContent = q.enunciado;
      els.questaoContainer.appendChild(p);

      q.alternativas.forEach((alt, idx) => {
        const div = document.createElement("div");
        div.className =
          "sim-alt" + (q.respostaAluno === idx ? " selected" : "");
        div.innerHTML = `
          <div class="sim-radio"></div>
          <div class="sim-alt-text">${alt}</div>
        `;
        div.onclick = () => {
          q.respostaAluno = idx;
          render();
        };
        els.questaoContainer.appendChild(div);
      });

      if (els.nav) els.nav.classList.remove("hidden");

      if (els.btnProxima) {
        els.btnProxima.textContent =
          estado.indiceAtual === total - 1
            ? "Finalizar simulado ▶"
            : "Próxima ▶";
      }

      if (els.btnVoltar) {
        els.btnVoltar.disabled = estado.indiceAtual === 0;
      }

      if (els.progressBar) {
        els.progressBar.style.width =
          ((estado.indiceAtual + 1) / total) * 100 + "%";
      }
    }

    // ------------------------------------------------------
    // HISTÓRICO VISUAL (mini dashboard no fim do resultado)
    // ------------------------------------------------------
    function renderHistoricoResumo() {
      if (!els.resultado) return;

      const hist = carregarHistorico();
      if (!hist || !hist.length) return;

      const ultimos = hist.slice(-5).reverse(); // últimos 5, do mais recente

      const bloco = document.createElement("div");
      bloco.className = "sim-resultado-card";
      bloco.style.marginTop = "1rem";

      let rows = "";
      ultimos.forEach((item) => {
        const date = new Date(item.dataISO);
        const dataFmt = date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
        const horaFmt = date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        rows += `
          <tr>
            <td>${dataFmt} ${horaFmt}</td>
            <td>${item.banca}</td>
            <td>${item.tema || "—"}</td>
            <td>${item.qtd}</td>
            <td>${item.perc}%</td>
          </tr>
        `;
      });

      bloco.innerHTML = `
        <div class="sim-resultado-titulo">Histórico recente de simulados</div>
        <p class="text-xs text-[var(--muted)] mb-2">
          Últimas tentativas realizadas neste dispositivo.
        </p>
        <div class="overflow-x-auto">
          <table class="sim-dashboard-table">
            <thead>
              <tr>
                <th style="min-width: 90px;">Data</th>
                <th style="min-width: 60px;">Banca</th>
                <th style="min-width: 120px;">Tema</th>
                <th style="min-width: 60px;">Qtd</th>
                <th style="min-width: 50px;">%</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;

      els.resultado.appendChild(bloco);
    }

    // ------------------------------------------------------
    // FINALIZAR SIMULADO
    // ------------------------------------------------------
    function finalizarSimulado(porTempo = false) {
      pararTimer();

      if (!els.resultado || !els.questaoContainer) return;

      const total = estado.questoes.length;
      let acertos = 0;
      let respondidas = 0;

      const statsPorNiveis = {
        facil: { total: 0, acertos: 0 },
        medio: { total: 0, acertos: 0 },
        dificil: { total: 0, acertos: 0 },
      };

      estado.questoes.forEach((q) => {
        const nivel = q.nivel || "medio";
        if (!statsPorNiveis[nivel]) {
          statsPorNiveis[nivel] = { total: 0, acertos: 0 };
        }
        statsPorNiveis[nivel].total++;

        if (q.respostaAluno != null) {
          respondidas++;
          if (q.respostaAluno === q.corretaIndex) {
            acertos++;
            statsPorNiveis[nivel].acertos++;
          }
        }
      });

      const perc = total ? Math.round((acertos / total) * 100) : 0;
      const tempoTotalSeg = estado.tempoProvaMin * 60;
      const tempoUsadoSeg = Math.max(
        0,
        tempoTotalSeg - Math.max(estado.tempoRestanteSeg, 0)
      );
      const tempoUsadoFmt = formatarTempo(tempoUsadoSeg);

      els.questaoContainer.innerHTML = "";
      els.resultado.innerHTML = "";
      els.nav.classList.add("hidden");

      const card = document.createElement("div");
      card.className = "sim-resultado-card";

     card.innerHTML = `
        <div class="sim-resultado-header">
          <div>
            <div class="sim-resultado-titulo">Resultado do simulado</div>
            <p class="text-xs text-[var(--muted)]">
              ${estado.banca} · ${
        estado.tema && estado.tema.trim()
          ? estado.tema
          : "Tema não informado"
      }</p>
          </div>
          <div class="sim-score-badge">
            <span class="sim-score-label">Desempenho</span>
            <span class="sim-score">${perc}%</span>
          </div>
        </div>
      
        <div class="sim-resultado-grid">
          <div class="sim-resultado-item">
            <span class="sim-resultado-item-label">Acertos</span>
            <span class="sim-resultado-item-value">${acertos} de ${total}</span>
          </div>
          <div class="sim-resultado-item">
            <span class="sim-resultado-item-label">Questões respondidas</span>
            <span class="sim-resultado-item-value">${respondidas} de ${total}</span>
          </div>
          <div class="sim-resultado-item">
            <span class="sim-resultado-item-label">Tempo utilizado</span>
            <span class="sim-resultado-item-value">
              ${tempoUsadoFmt} ${
        porTempo ? "<span class='sim-resultado-tag'>Encerrado por tempo</span>" : ""
      }
            </span>
          </div>
        </div>
      
        <div class="sim-resultado-resumo">
          <h4>Resumo rápido</h4>
          <p>
            Este simulado foi gerado em modo de demonstração. Em breve, a Liora vai usar
            seu histórico real de estudo para ajustar o nível de dificuldade, selecionar
            questões mais alinhadas ao seu objetivo e sugerir revisões focadas.
          </p>
        </div>
      
        <div class="sim-resultado-cta">
          <button id="sim-refazer" class="btn-secondary">Fazer outro simulado</button>
          <button id="sim-ir-dashboard" class="btn-primary">Ver meu desempenho</button>
        </div>
      `;

    
      <p class="sim-feedback">
        Nesta versão beta da Liora, as questões são geradas em modo de simulação.
        Em breve, seus simulados serão personalizados com base no seu histórico real
        de estudo e nos materiais que você enviar.
      </p>
    
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" class="btn-secondary sim-btn-refazer" id="sim-refazer">
          Fazer outro simulado
        </button>
        <button type="button" class="btn-primary sim-btn-dashboard" id="sim-ir-dashboard">
          Ver minha evolução
        </button>
      </div>
    `;


      els.resultado.appendChild(card);

      const dash = document.createElement("div");
      dash.className = "sim-dashboard";

      function linhaNivel(nivel, label) {
        const st = statsPorNiveis[nivel];
        if (!st || !st.total) {
          return `
            <tr>
              <td>${label}</td>
              <td>—</td>
              <td>0</td>
              <td>—</td>
            </tr>
          `;
        }
        const p = Math.round((st.acertos / st.total) * 100);
        return `
          <tr>
            <td>${label}</td>
            <td>${st.acertos}</td>
            <td>${st.total}</td>
            <td>${p}%</td>
          </tr>
        `;
      }

      dash.innerHTML = `
        <h4>Desempenho por nível de dificuldade</h4>
        <table class="sim-dashboard-table">
          <thead>
            <tr>
              <th>Nível</th>
              <th>Acertos</th>
              <th>Total</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            ${linhaNivel("facil", "Fácil")}
            ${linhaNivel("medio", "Médio")}
            ${linhaNivel("dificil", "Difícil")}
          </tbody>
        </table>
      `;

      els.resultado.appendChild(dash);

      const lista = document.createElement("ul");
      lista.className = "sim-lista-resultados";

      estado.questoes.forEach((q) => {
        const li = document.createElement("li");
        li.className = "sim-resultado-item";

        const respAluno =
          q.respostaAluno == null
            ? "Não respondida"
            : q.alternativas[q.respostaAluno];
        const respCorreta = q.alternativas[q.corretaIndex];

        const acertou =
          q.respostaAluno != null && q.respostaAluno === q.corretaIndex;

        const badge = formatarNivelBadge(q.nivel);

        li.innerHTML = `
          <h4>Questão ${q.indice} — ${badge}</h4>
          <p class="text-xs text-[var(--muted)] mb-1 whitespace-pre-line">${q.enunciado}</p>
          <p><strong>Sua resposta:</strong> ${respAluno}</p>
          <p><strong>Gabarito:</strong> ${respCorreta}</p>
          <p class="${acertou ? "correta" : "errada"} mt-1">
            ${acertou ? "Acertou" : "Errou"}
          </p>
        `;

        lista.appendChild(li);
      });

      els.resultado.appendChild(lista);
      els.resultado.classList.remove("hidden");

      // ======================================================
      // BOTÕES DA TELA DE RESULTADO — handlers
      // ======================================================
      const btnRefazer = document.getElementById("sim-refazer");
      if (btnRefazer) {
        btnRefazer.onclick = () => {
          window.location.reload();
        };
      }
      
      const btnDash = document.getElementById("sim-ir-dashboard");
      if (btnDash && window.homeDashboard) {
        btnDash.onclick = () => {
          window.homeDashboard();
        };
      } else if (btnDash) {
        btnDash.onclick = () => window.location.reload();
      }


      // salvar no histórico
      const resumo = {
        dataISO: new Date().toISOString(),
        banca: estado.banca,
        tema: estado.tema,
        qtd: total,
        acertos,
        perc,
        tempoSeg: tempoUsadoSeg,
        statsPorNiveis,
      };
      salvarNoHistorico(resumo);

      // bloco de histórico recente
      renderHistoricoResumo();
    }

    // ------------------------------------------------------
    // EVENTOS DE NAVEGAÇÃO
    // ------------------------------------------------------
    if (els.btnVoltar) {
      els.btnVoltar.addEventListener("click", () => {
        if (estado.indiceAtual > 0) {
          estado.indiceAtual--;
          render();
        }
      });
    }

    if (els.btnProxima) {
      els.btnProxima.addEventListener("click", () => {
        if (!estado.questoes.length) return;
        if (estado.indiceAtual < estado.questoes.length - 1) {
          estado.indiceAtual++;
          render();
        } else {
          finalizarSimulado(false);
        }
      });
    }

    // ------------------------------------------------------
    // INICIAR SIMULADO (botão do modal)
    // ------------------------------------------------------
    if (els.modalIniciar) {
      els.modalIniciar.addEventListener("click", () => {
        estado.banca = els.selBanca ? els.selBanca.value || "FGV" : "FGV";
        estado.qtd = els.selQtd ? Number(els.selQtd.value || "20") : 20;
        estado.tempoProvaMin = els.selTempo
          ? Number(els.selTempo.value || "30")
          : 30;
        estado.dificuldade = els.selDificuldade
          ? els.selDificuldade.value || "misturado"
          : "misturado";
        estado.tema = els.inpTema ? (els.inpTema.value || "").trim() : "";

        fecharModal();

        // limpa resultado anterior
        if (els.resultado) {
          els.resultado.classList.add("hidden");
          els.resultado.innerHTML = "";
        }

        estado.questoes = gerarQuestoesMock();
        estado.indiceAtual = 0;
        iniciarTimer();
        render();
      });
    }

    console.log("🟢 Liora Simulados v12 inicializado com sucesso.");
  });
})();
