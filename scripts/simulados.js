// ==========================================================
// 🧠 LIORA — SIMULADOS (MODO MOCK)
// - Integra com index v70-G-SIM-FINAL
// - Não usa IA (questões fake para testar UX)
// - Usa a mesma área da direita do plano de estudo
// ==========================================================

(function () {
  console.log("🔵 Liora Simulados (mock) carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------
    // ELEMENTOS
    // ------------------------------------------------------
    const els = {
      // botões de modo (esquerda)
      modoTema: document.getElementById("modo-tema"),
      modoUpload: document.getElementById("modo-upload"),
      modoSimulados: document.getElementById("modo-simulados"),

      // área direita
      areaPlano: document.getElementById("area-plano"),
      areaSimulado: document.getElementById("area-simulado"),

      // simulado (dentro da área direita)
      timer: document.getElementById("sim-timer"),
      progressBar: document.getElementById("sim-progress-bar"),
      questaoContainer: document.getElementById("sim-questao-container"),
      nav: document.getElementById("sim-nav"),
      btnVoltar: document.getElementById("sim-btn-voltar"),
      btnProxima: document.getElementById("sim-btn-proxima"),
      resultado: document.getElementById("sim-resultado"),
    };

    // ------------------------------------------------------
    // ESTADO DO SIMULADO
    // ------------------------------------------------------
    const estado = {
      emAndamento: false,
      questoes: [],
      indiceAtual: 0,
      banca: "FGV",
      tema: "",
      qtd: 5,
      tempoSegundos: 0,
      timerId: null,
    };

    // ------------------------------------------------------
    // HELPERS DE UI
    // ------------------------------------------------------
    function mostrarPlano() {
      if (els.areaPlano) els.areaPlano.classList.remove("hidden");
      if (els.areaSimulado) els.areaSimulado.classList.add("hidden");
      limparSimulado();
    }

    function mostrarSimulado() {
      if (els.areaPlano) els.areaPlano.classList.add("hidden");
      if (els.areaSimulado) els.areaSimulado.classList.remove("hidden");
      prepararTelaConfiguracao();
    }

    function limparSimulado() {
      pararTimer();
      estado.emAndamento = false;
      estado.questoes = [];
      estado.indiceAtual = 0;
      estado.tempoSegundos = 0;
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
    // TIMER
    // ------------------------------------------------------
    function formatarTempo(segundos) {
      const m = Math.floor(segundos / 60);
      const s = segundos % 60;
      const mm = m < 10 ? "0" + m : "" + m;
      const ss = s < 10 ? "0" + s : "" + s;
      return `${mm}:${ss}`;
    }

    function iniciarTimer() {
      pararTimer();
      estado.tempoSegundos = 0;
      if (els.timer) {
        els.timer.classList.remove("hidden");
        els.timer.textContent = "00:00";
      }
      estado.timerId = setInterval(() => {
        estado.tempoSegundos++;
        if (els.timer) {
          els.timer.textContent = formatarTempo(estado.tempoSegundos);
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
    // GERADOR MOCK DE QUESTÕES
    // ------------------------------------------------------
    const PERFIS_BANCA = {
      FGV: {
        id: "FGV",
        nome: "FGV",
        estilo: "contextual",
      },
      CESPE: {
        id: "CESPE",
        nome: "CESPE / CEBRASPE",
        estilo: "certo_errado",
      },
      VUNESP: {
        id: "VUNESP",
        nome: "VUNESP",
        estilo: "direto",
      },
      FCC: {
        id: "FCC",
        nome: "FCC",
        estilo: "objetivo",
      },
    };

    function getPerfilBanca(id) {
      return PERFIS_BANCA[id] || PERFIS_BANCA.FGV;
    }

    function gerarQuestoesMock() {
      const perfil = getPerfilBanca(estado.banca);
      const qs = [];
      for (let i = 0; i < estado.qtd; i++) {
        qs.push(criarQuestaoMock(perfil, i + 1));
      }
      return qs;
    }

    function criarQuestaoMock(perfil, indice) {
      const temaUsado = estado.tema || "tema de estudos";
      if (perfil.estilo === "certo_errado") {
        const correta = Math.random() > 0.5 ? "Certo" : "Errado";
        return {
          id: `Q${indice}`,
          indice,
          banca: perfil.nome,
          tipo: "certo_errado",
          enunciado:
            `No contexto de ${temaUsado}, julgue o item a seguir, ` +
            `de acordo com o estilo da banca ${perfil.nome}: ` +
            `"O candidato deve ser capaz de interpretar, analisar e julgar afirmações detalhadas, ` +
            `identificando exceções, generalizações e armadilhas semânticas."`,
          alternativas: ["Certo", "Errado"],
          corretaIndex: correta === "Certo" ? 0 : 1,
          respostaAluno: null,
        };
      }

      // demais bancas → múltipla escolha
      const alternativas = [];
      const qtdAlt = 5;
      const idxCorreta = Math.floor(Math.random() * qtdAlt);

      for (let i = 0; i < qtdAlt; i++) {
        const letra = String.fromCharCode(65 + i); // A, B, C...
        const texto =
          i === idxCorreta
            ? `${letra}) Alternativa correta, alinhada ao conteúdo de ${temaUsado} e à abordagem da banca ${perfil.nome}.`
            : `${letra}) Alternativa incorreta, com erro conceitual, inversão lógica ou detalhe incompatível com o padrão da banca ${perfil.nome}.`;
        alternativas.push(texto);
      }

      return {
        id: `Q${indice}`,
        indice,
        banca: perfil.nome,
        tipo: "objetiva",
        enunciado:
          perfil.estilo === "contextual"
            ? `Considere a situação hipotética relacionada a ${temaUsado}, de acordo com o estilo da banca ${perfil.nome}. ` +
              `Analise as informações apresentadas e assinale a alternativa correta.`
            : `Com base nos conhecimentos sobre ${temaUsado}, assinale a alternativa correta conforme o padrão da banca ${perfil.nome}.`,
        alternativas,
        corretaIndex: idxCorreta,
        respostaAluno: null,
      };
    }

    // ------------------------------------------------------
    // TELA DE CONFIGURAÇÃO INICIAL
    // ------------------------------------------------------
    function prepararTelaConfiguracao() {
      limparSimulado();
      if (!els.questaoContainer) return;

      els.questaoContainer.innerHTML = `
        <div class="space-y-4">
          <h3 class="text-lg font-bold">Configurar simulado</h3>
          <p class="text-sm text-[var(--muted)]">
            Escolha a banca, o tema (opcional) e a quantidade de questões para gerar um simulado de teste.
          </p>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Banca</label>
              <select id="sim-config-banca" class="w-full">
                <option value="FGV">FGV</option>
                <option value="CESPE">CESPE / CEBRASPE</option>
                <option value="VUNESP">VUNESP</option>
                <option value="FCC">FCC</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium">Quantidade de questões</label>
              <select id="sim-config-qtd" class="w-full">
                <option value="5">5 questões</option>
                <option value="10">10 questões</option>
                <option value="15">15 questões</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium">Tema (opcional)</label>
            <input id="sim-config-tema" type="text" class="w-full"
              placeholder="Ex.: Direito Administrativo — Atos Administrativos">
          </div>

          <button id="sim-config-gerar" class="btn mt-2 w-full">Iniciar simulado</button>
        </div>
      `;

      const btnConfigGerar = document.getElementById("sim-config-gerar");
      const selBanca = document.getElementById("sim-config-banca");
      const selQtd = document.getElementById("sim-config-qtd");
      const inpTema = document.getElementById("sim-config-tema");

      if (btnConfigGerar) {
        btnConfigGerar.addEventListener("click", () => {
          estado.banca = selBanca ? selBanca.value || "FGV" : "FGV";
          const qtdRaw = selQtd ? selQtd.value : "5";
          const qtd = parseInt(qtdRaw || "5", 10);
          estado.qtd = isNaN(qtd) ? 5 : qtd;
          estado.tema = inpTema ? (inpTema.value || "").trim() : "";

          iniciarSimuladoMock();
        });
      }
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
      iniciarTimer();
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

      // Progresso
      if (els.progressBar) {
        const pct = ((estado.indiceAtual + 1) / total) * 100;
        els.progressBar.style.width = pct + "%";
      }

      const wrapper = document.createElement("div");
      wrapper.className = "sim-questao-card space-y-3";

      // header simples
      const header = document.createElement("div");
      header.className = "flex justify-between items-center text-xs text-[var(--muted)]";
      header.innerHTML = `
        <span>Questão ${q.indice} de ${total}</span>
        <span>${q.banca}</span>
      `;
      wrapper.appendChild(header);

      const enu = document.createElement("p");
      enu.className = "sim-enunciado";
      enu.textContent = q.enunciado;
      wrapper.appendChild(enu);

      // alternativas
      const lista = document.createElement("div");
      lista.className = "space-y-2";

      if (q.tipo === "certo_errado") {
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
      } else {
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
      }

      wrapper.appendChild(lista);
      els.questaoContainer.appendChild(wrapper);

      // Navegação
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
    // FINALIZAÇÃO E RESULTADO
    // ------------------------------------------------------
    function finalizarSimulado() {
      pararTimer();
      estado.emAndamento = false;

      if (!els.resultado) return;

      const total = estado.questoes.length;
      let acertos = 0;

      estado.questoes.forEach((q) => {
        if (q.respostaAluno == null) return;
        if (q.respostaAluno === q.corretaIndex) acertos++;
      });

      const perc = total ? Math.round((acertos / total) * 100) : 0;

      els.resultado.classList.remove("hidden");
      els.resultado.innerHTML = "";

      const card = document.createElement("div");
      card.className = "sim-resultado-card";

      card.innerHTML = `
        <div class="sim-resultado-titulo">Resultado do simulado</div>
        <div class="sim-score">${perc}%</div>
        <p><strong>Acertos:</strong> ${acertos} de ${total}</p>
        <p><strong>Banca:</strong> ${getPerfilBanca(estado.banca).nome}</p>
        <p><strong>Tema:</strong> ${estado.tema || "Não informado"}</p>
        <p><strong>Tempo:</strong> ${formatarTempo(estado.tempoSegundos)}</p>
        <p class="sim-feedback">
          Use este resultado apenas para testar a experiência do simulado. 
          Em produção, as questões serão geradas com base na IA e no seu material de estudo.
        </p>
      `;

      els.resultado.appendChild(card);

      // Lista de questões
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
    // EVENTOS DE NAVEGAÇÃO
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
          finalizarSimulado();
        }
      });
    }

    // ------------------------------------------------------
    // INTEGRAÇÃO COM OS MODOS DA LIORA
    // (não interfere no core, apenas controla a área direita)
    // ------------------------------------------------------
    if (els.modoSimulados) {
      els.modoSimulados.addEventListener("click", () => {
        mostrarSimulado();
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

    console.log("🟢 Liora Simulados (mock) inicializado com sucesso.");
  });
})();
