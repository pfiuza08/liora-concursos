// ==========================================================
// 🧠 LIORA — SIMULADOS v2 (PRO MOCK)
// - Modal de configuração (banca, dificuldade, qtd, tempo)
// - Timer regressivo
// - Mistura de dificuldades (fácil/médio/difícil)
// - Resultado com análise por nível de dificuldade
// - Histórico salvo em localStorage (para futuros dashboards)
// ==========================================================

(function () {
  console.log("🔵 Liora Simulados v2 (mock) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------
    // ELEMENTOS BASE
    // ------------------------------------------------------
    const els = {
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      modoSimulados: document.getElementById("modo-simulados"),

      areaPlano: document.getElementById("area-plano"),
      areaSimulado: document.getElementById("area-simulado"),

      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),
      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),
    };

    // ------------------------------------------------------
    // ESTADO
    // ------------------------------------------------------
    const estado = {
      emAndamento: false,
      questoes: [],
      indiceAtual: 0,
      banca: "FGV",
      tema: "",
      qtd: 10,
      dificuldade: "misturado", // facil, medio, dificil, misturado
      tempoProvaMin: 60,
      tempoRestanteSeg: 0,
      timerId: null,
    };

    const HIST_KEY = "liora:simulados:historico";

    // ------------------------------------------------------
    // HISTÓRICO (para futuro dashboard)
    // ------------------------------------------------------
    function carregarHistorico() {
      try {
        const raw = localStorage.getItem(HIST_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
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
    // UI: mostrar/ocultar áreas
    // ------------------------------------------------------
    function mostrarPlano() {
      if (els.areaPlano) els.areaPlano.classList.remove("hidden");
      if (els.areaSimulado) els.areaSimulado.classList.add("hidden");
      limparSimulado();
    }

    function mostrarSimulado() {
      if (els.areaPlano) els.areaPlano.classList.add("hidden");
      if (els.areaSimulado) els.areaSimulado.classList.remove("hidden");
      limparSimulado(); // começa a prova do zero
    }

    function limparSimulado() {
      pararTimer();
      estado.emAndamento = false;
      estado.questoes = [];
      estado.indiceAtual = 0;
      estado.tempoRestanteSeg = 0;

      if (els.timer) {
        els.timer.classList.add("hidden");
        els.timer.textContent = "00:00";
      }
      if (els.progressBar) els.progressBar.style.width = "0%";
      if (els.questaoContainer) els.questaoContainer.innerHTML = "";
      if (els.nav) els.nav.classList.add("hidden");
      if (els.resultado) {
        els.resultado.classList.add("hidden");
        els.resultado.innerHTML = "";
      }
    }

    // ------------------------------------------------------
    // TIMER REGRESSIVO
    // ------------------------------------------------------
    function formatarTempo(segundos) {
      const m = Math.floor(segundos / 60);
      const s = segundos % 60;
      const mm = m < 10 ? "0" + m : "" + m;
      const ss = s < 10 ? "0" + s : "" + s;
      return `${mm}:${ss}`;
    }

    function iniciarTimerRegressivo() {
      pararTimer();
      estado.tempoRestanteSeg = estado.tempoProvaMin * 60;

      if (els.timer) {
        els.timer.classList.remove("hidden");
        els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);
      }

      estado.timerId = setInterval(() => {
        estado.tempoRestanteSeg--;
        if (estado.tempoRestanteSeg < 0) {
          pararTimer();
          finalizarSimulado(true); // finalizou por tempo
          return;
        }
        if (els.timer) {
          els.timer.textContent = formatarTempo(estado.tempoRestanteSeg);
        }
      }, 1000);
    }

    function pararTimer() {
      if (estado.timerId) {
        clearInterval(estado.timerId);
        estado.timerId = null;
      }
    }

    // ------------------------------------------------------
    // PERFIL DAS BANCAS (mock)
    // ------------------------------------------------------
    const PERFIS_BANCA = {
      FGV: { id: "FGV", nome: "FGV", estilo: "contextual" },
      CESPE: { id: "CESPE", nome: "CESPE / CEBRASPE", estilo: "certo_errado" },
      VUNESP: { id: "VUNESP", nome: "VUNESP", estilo: "direto" },
      FCC: { id: "FCC", nome: "FCC", estilo: "objetiva" },
      QUADRIX: { id: "QUADRIX", nome: "Quadrix", estilo: "objetiva" },
      IBFC: { id: "IBFC", nome: "IBFC", estilo: "objetiva" },
    };

    function getPerfilBanca(id) {
      return PERFIS_BANCA[id] || PERFIS_BANCA.FGV;
    }

    // ------------------------------------------------------
    // GERAÇÃO MOCK DE QUESTÕES POR DIFICULDADE
    // ------------------------------------------------------
    function gerarQuestoesMock() {
      const perfil = getPerfilBanca(estado.banca);
      const qs = [];
      const total = estado.qtd;

      if (estado.dificuldade === "misturado") {
        const terc = Math.floor(total / 3);
        let restantes = total;

        function adicionarBloco(nivel, qtd) {
          for (let i = 0; i < qtd; i++) {
            qs.push(criarQuestaoMockPorDificuldade(perfil, qs.length + 1, nivel));
          }
        }

        adicionarBloco("facil", terc);
        restantes -= terc;

        adicionarBloco("medio", terc);
        restantes -= terc;

        adicionarBloco("dificil", restantes);
      } else {
        for (let i = 0; i < total; i++) {
          qs.push(
            criarQuestaoMockPorDificuldade(
              perfil,
              qs.length + 1,
              estado.dificuldade
            )
          );
        }
      }

      return qs;
    }

    function criarQuestaoMockPorDificuldade(perfil, indice, nivel) {
      const temaUsado = estado.tema || "o tema de estudos";
      const nivelLabel =
        nivel === "facil"
          ? "Fácil"
          : nivel === "medio"
          ? "Médio"
          : nivel === "dificil"
          ? "Difícil"
          : "Misto";

      // dificuldade afeta o texto
      const baseEnunciado = {
        facil: `Considere o seguinte aspecto introdutório de ${temaUsado}. De acordo com a banca ${perfil.nome}, assinale a alternativa correta.`,
        medio: `Sobre ${temaUsado}, em nível intermediário, analise as alternativas abaixo e assinale a opção correta conforme o padrão da banca ${perfil.nome}.`,
        dificil: `No contexto avançado de ${temaUsado}, levando em conta detalhes conceituais e exceções normalmente exploradas pela banca ${perfil.nome}, assinale a alternativa correta.`,
      };

      // CESPExC/CEBRASPE → certo/errado
      if (perfil.estilo === "certo_errado") {
        const correta = Math.random() > 0.5 ? "Certo" : "Errado";
        return {
          id: `Q${indice}`,
          indice,
          banca: perfil.nome,
          tipo: "certo_errado",
          nivel,
          enunciado:
            (baseEnunciado[nivel] ||
              `No contexto de ${temaUsado}, julgue o item a seguir.`) +
            ` (Nível: ${nivelLabel})`,
          alternativas: ["Certo", "Errado"],
          corretaIndex: correta === "Certo" ? 0 : 1,
          respostaAluno: null,
        };
      }

      // Demais bancas → múltipla escolha
      const alternativas = [];
      const qtdAlt = 4;
      const idxCorreta = Math.floor(Math.random() * qtdAlt);

      for (let i = 0; i < qtdAlt; i++) {
        const letra = String.fromCharCode(65 + i); // A, B, C...
        let texto;

        if (i === idxCorreta) {
          texto = `${letra}) Alternativa correta, compatível com ${temaUsado} e com o padrão de cobrança da banca ${perfil.nome} (nível ${nivelLabel}).`;
        } else {
          if (nivel === "facil") {
            texto = `${letra}) Alternativa com erro conceitual direto ou inversão simples de ideia.`;
          } else if (nivel === "medio") {
            texto = `${letra}) Alternativa com detalhe parcialmente correto, mas com vício conceitual em algum ponto específico.`;
          } else {
            texto = `${letra}) Alternativa com pegadinha típica da banca ${perfil.nome}, exigindo atenção a palavras como "sempre", "nunca" ou "apenas".`;
          }
        }

        alternativas.push(texto);
      }

      return {
        id: `Q${indice}`,
        indice,
        banca: perfil.nome,
        tipo: "objetiva",
        nivel,
        enunciado:
          (baseEnunciado[nivel] ||
            `Com base em ${temaUsado}, assinale a alternativa correta.`) +
          ` (Nível: ${nivelLabel})`,
        alternativas,
        corretaIndex: idxCorreta,
        respostaAluno: null,
      };
    }

    // ------------------------------------------------------
    // MODAL DE CONFIGURAÇÃO
    // ------------------------------------------------------
    let modalBackdrop = null;

    function criarModalConfiguracaoSeNecessario() {
      if (modalBackdrop) return;

      modalBackdrop = document.createElement("div");
      modalBackdrop.className = "sim-modal-backdrop";
      modalBackdrop.id = "sim-modal-backdrop";

      modalBackdrop.innerHTML = `
        <div class="sim-modal">
          <div class="sim-modal-header">
            <div>
              <div class="sim-modal-title">Configurar simulado</div>
              <p class="text-xs text-[var(--muted)]">
                Escolha a banca, dificuldade, quantidade de questões e tempo de prova.
              </p>
            </div>
            <button class="sim-modal-close" id="sim-modal-close-btn">&times;</button>
          </div>

          <div class="sim-modal-body">
            <div>
              <label>Banca</label>
              <select id="sim-modal-banca" class="w-full">
                <option value="FGV">FGV</option>
                <option value="CESPE">CESPE / CEBRASPE</option>
                <option value="VUNESP">VUNESP</option>
                <option value="FCC">FCC</option>
                <option value="QUADRIX">Quadrix</option>
                <option value="IBFC">IBFC</option>
              </select>
            </div>

            <div>
              <label>Dificuldade</label>
              <select id="sim-modal-dificuldade" class="w-full">
                <option value="misturado">Misturar níveis (recomendado)</option>
                <option value="facil">Somente fácil</option>
                <option value="medio">Somente médio</option>
                <option value="dificil">Somente difícil</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label>Questões</label>
                <select id="sim-modal-qtd" class="w-full">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div>
                <label>Tempo (minutos)</label>
                <input id="sim-modal-tempo" type="number" min="5" max="300" value="60" class="w-full">
              </div>
            </div>

            <div>
              <label>Tema (opcional)</label>
              <input id="sim-modal-tema" type="text" class="w-full"
                placeholder="Ex.: Direito Constitucional — Poder Legislativo">
            </div>
          </div>

          <div class="sim-modal-footer">
            <button id="sim-modal-iniciar" class="btn w-full mt-1">
              Iniciar simulado
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modalBackdrop);

      // Eventos do modal
      const closeBtn = document.getElementById("sim-modal-close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", fecharModalConfiguracao);
      }
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) {
          fecharModalConfiguracao();
        }
      });

      const iniciarBtn = document.getElementById("sim-modal-iniciar");
      if (iniciarBtn) {
        iniciarBtn.addEventListener("click", () => {
          aplicarConfiguracaoEIniciar();
        });
      }
    }

    function abrirModalConfiguracao() {
      criarModalConfiguracaoSeNecessario();
      if (modalBackdrop) {
        modalBackdrop.classList.add("visible");
      }
    }

    function fecharModalConfiguracao() {
      if (modalBackdrop) {
        modalBackdrop.classList.remove("visible");
      }
    }

    function aplicarConfiguracaoEIniciar() {
      const selBanca = document.getElementById("sim-modal-banca");
      const selDif = document.getElementById("sim-modal-dificuldade");
      const selQtd = document.getElementById("sim-modal-qtd");
      const inpTempo = document.getElementById("sim-modal-tempo");
      const inpTema = document.getElementById("sim-modal-tema");

      estado.banca = selBanca ? selBanca.value || "FGV" : "FGV";
      estado.dificuldade = selDif ? selDif.value || "misturado" : "misturado";

      const qtdRaw = selQtd ? selQtd.value : "10";
      const qtd = parseInt(qtdRaw || "10", 10);
      estado.qtd = isNaN(qtd) ? 10 : qtd;

      const tempoRaw = inpTempo ? inpTempo.value : "60";
      const tempo = parseInt(tempoRaw || "60", 10);
      estado.tempoProvaMin = isNaN(tempo) ? 60 : Math.max(5, Math.min(tempo, 300));

      estado.tema = inpTema ? (inpTema.value || "").trim() : "";

      fecharModalConfiguracao();
      mostrarSimulado();
      iniciarSimuladoMock();
    }

    // ------------------------------------------------------
    // INICIAR SIMULADO MOCK
    // ------------------------------------------------------
    function iniciarSimuladoMock() {
      estado.questoes = gerarQuestoesMock();
      estado.indiceAtual = 0;
      estado.emAndamento = true;

      if (els.resultado) {
        els.resultado.classList.add("hidden");
        els.resultado.innerHTML = "";
      }
      if (els.nav) els.nav.classList.remove("hidden");

      iniciarTimerRegressivo();
      renderizarQuestaoAtual();
    }

    // ------------------------------------------------------
    // RENDERIZAÇÃO DA QUESTÃO
    // ------------------------------------------------------
    function renderizarQuestaoAtual() {
      if (!els.questaoContainer) return;

      els.questaoContainer.innerHTML = "";

      if (!estado.questoes.length) {
        els.questaoContainer.innerHTML =
          '<p class="sim-loading">Nenhum simulado em andamento.</p>';
        if (els.nav) els.nav.classList.add("hidden");
        return;
      }

      const q = estado.questoes[estado.indiceAtual];
      const total = estado.questoes.length;

      // progresso
      if (els.progressBar) {
        const pct = ((estado.indiceAtual + 1) / total) * 100;
        els.progressBar.style.width = pct + "%";
      }

      const wrapper = document.createElement("div");
      wrapper.className = "sim-questao-card space-y-3";

      // header
      const header = document.createElement("div");
      header.className = "flex justify-between items-center text-xs text-[var(--muted)]";
      const nivelLabel =
        q.nivel === "facil"
          ? "Fácil"
          : q.nivel === "medio"
          ? "Médio"
          : q.nivel === "dificil"
          ? "Difícil"
          : "Misto";

      header.innerHTML = `
        <span>Questão ${q.indice} de ${total}</span>
        <span>${q.banca} · ${nivelLabel}</span>
      `;
      wrapper.appendChild(header);

      const enu = document.createElement("p");
      enu.className = "sim-enunciado";
      enu.textContent = q.enunciado;
      wrapper.appendChild(enu);

      // alternativas
      const lista = document.createElement("div");
      lista.className = "space-y-2";

      q.alternativas.forEach((textoAlt, idx) => {
        const alt = document.createElement("div");
        alt.className =
          "sim-alt" + (q.respostaAluno === idx ? " selected" : "");
        alt.innerHTML = `
          <div class="sim-radio"></div>
          <div class="sim-alt-text">${textoAlt}</div>
        `;
        alt.addEventListener("click", () => {
          q.respostaAluno = idx;
          renderizarQuestaoAtual();
        });
        lista.appendChild(alt);
      });

      wrapper.appendChild(lista);
      els.questaoContainer.appendChild(wrapper);

      // nav
      if (els.nav) els.nav.classList.remove("hidden");
      if (els.btnVoltar) {
        els.btnVoltar.disabled = estado.indiceAtual === 0;
      }
      if (els.btnProxima) {
        els.btnProxima.textContent =
          estado.indiceAtual === total - 1 ? "Finalizar simulado ▶" : "Próxima ▶";
      }
    }

    // ------------------------------------------------------
    // FINALIZAÇÃO E RESULTADO COM ANÁLISE POR NÍVEL
    // ------------------------------------------------------
    function finalizarSimulado(porTempo = false) {
      pararTimer();
      estado.emAndamento = false;

      if (!els.resultado) return;

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
      const tempoUsadoSeg =
        estado.tempoProvaMin * 60 - Math.max(estado.tempoRestanteSeg, 0);
      const tempoUsadoFmt = formatarTempo(tempoUsadoSeg);

      els.resultado.classList.remove("hidden");
      els.resultado.innerHTML = "";

      const card = document.createElement("div");
      card.className = "sim-resultado-card";

      card.innerHTML = `
        <div class="sim-resultado-titulo">Resultado do simulado</div>
        <div class="sim-score">${perc}%</div>
        <p><strong>Acertos:</strong> ${acertos} de ${total}</p>
        <p><strong>Respondidas:</strong> ${respondidas} de ${total}</p>
        <p><strong>Banca:</strong> ${getPerfilBanca(estado.banca).nome}</p>
        <p><strong>Tema:</strong> ${estado.tema || "Não informado"}</p>
        <p><strong>Tempo utilizado:</strong> ${tempoUsadoFmt} ${
        porTempo ? "(prova encerrada por tempo)" : ""
      }</p>
        <p class="sim-feedback">
          Este resultado é gerado em modo de simulação (mock). Em produção, as questões e análises
          serão baseadas na IA e no seu material.
        </p>
      `;

      els.resultado.appendChild(card);

      // Tabela por dificuldade
      const dash = document.createElement("div");
      dash.className = "sim-dashboard";

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
            ${["facil", "medio", "dificil"]
              .map((nivel) => {
                const st = statsPorNiveis[nivel];
                if (!st || !st.total) {
                  return `<tr>
                    <td>${nivel === "facil"
                      ? "Fácil"
                      : nivel === "medio"
                      ? "Médio"
                      : "Difícil"}</td>
                    <td>—</td>
                    <td>0</td>
                    <td>—</td>
                  </tr>`;
              }
                const p = Math.round((st.acertos / st.total) * 100);
                const label =
                  nivel === "facil"
                    ? "Fácil"
                    : nivel === "medio"
                    ? "Médio"
                    : "Difícil";
                return `<tr>
                  <td>${label}</td>
                  <td>${st.acertos}</td>
                  <td>${st.total}</td>
                  <td>${p}%</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      `;

      els.resultado.appendChild(dash);

      // salvar no histórico (para uso futuro)
      salvarNoHistorico({
        dataISO: new Date().toISOString(),
        banca: estado.banca,
        tema: estado.tema,
        qtd: total,
        acertos,
        perc,
        tempoSeg: tempoUsadoSeg,
        statsPorNiveis,
      });

      // lista de questões (como antes)
      const lista = document.createElement("ul");
      lista.className = "sim-lista-resultados";

      estado.questoes.forEach((q) => {
        const li = document.createElement("li");
        li.className = "sim-resultado-item";

        const respAluno =
          q.respostaAluno == null ? "Não respondida" : q.alternativas[q.respostaAluno];
        const respCorreta = q.alternativas[q.corretaIndex];

        const acertou =
          q.respostaAluno != null && q.respostaAluno === q.corretaIndex;

        li.innerHTML = `
          <h4>Questão ${q.indice}</h4>
          <p class="text-xs text-[var(--muted)] mb-1">${q.enunciado}</p>
          <p><strong>Sua resposta:</strong> ${respAluno}</p>
          <p><strong>Gabarito:</strong> ${respCorreta}</p>
          <p class="${acertou ? "correta" : "errada"} mt-1">
            ${acertou ? "Acertou" : "Errou"}
          </p>
        `;

        lista.appendChild(li);
      });

      els.resultado.appendChild(lista);
    }

    // ------------------------------------------------------
    // EVENTOS DE NAVEGAÇÃO DAS QUESTÕES
    // ------------------------------------------------------
    if (els.btnVoltar) {
      els.btnVoltar.addEventListener("click", () => {
        if (estado.indiceAtual > 0) {
          estado.indiceAtual--;
          renderizarQuestaoAtual();
        }
      });
    }

    if (els.btnProxima) {
      els.btnProxima.addEventListener("click", () => {
        if (!estado.questoes.length) return;
        if (estado.indiceAtual < estado.questoes.length - 1) {
          estado.indiceAtual++;
          renderizarQuestaoAtual();
        } else {
          finalizarSimulado(false);
        }
      });
    }

    // ------------------------------------------------------
    // INTEGRAÇÃO COM OS MODOS
    // ------------------------------------------------------
    if (els.modoSimulados) {
      els.modoSimulados.addEventListener("click", () => {
        // abre o modal de configuração
        abrirModalConfiguracao();
      });
    }

    if (els.modoTema) {
      els.modoTema.addEventListener("click", () => {
        mostrarPlano();
      });
    }

    if (els.modoUpload) {
      els.modoUpload.addEventListener("click", () => {
        mostrarPlano();
      });
    }

    // estado inicial
    mostrarPlano();

    console.log("🟢 Liora Simulados v2 (mock) inicializado com sucesso.");
  });
})();
