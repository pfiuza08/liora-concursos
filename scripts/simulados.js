// ==========================================================
// 🧠 LIORA — SIMULADOS v1
// - Simulado por Tema ou por PDF
// - Perfil de banca (FGV, CESPE, VUNESP, FCC...)
// - Geração de questões fake por template (para testar UX)
// - Estado: config → questões → respostas → correção
// ==========================================================

(function () {
  console.log("🔵 Liora Simulados v1 carregado...");

  document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------------
    // ELEMENTOS DA TELA
    // --------------------------------------------------------
    const els = {
      // modos
      modoTema: document.getElementById("sim-modo-tema"),
      modoUpload: document.getElementById("sim-modo-upload"),
      painelTema: document.getElementById("sim-painel-tema"),
      painelUpload: document.getElementById("sim-painel-upload"),

      // campos comuns
      selBanca: document.getElementById("sim-banca"),
      selQtd: document.getElementById("sim-qtd"),
      selNivel: document.getElementById("sim-nivel"),

      // tema
      inpTema: document.getElementById("sim-tema"),

      // upload (você pode ligar esse campo ao módulo de PDF)
      infoUpload: document.getElementById("sim-info-upload"), // pode ser só um textinho com "Baseado no PDF carregado"

      // ação
      btnGerar: document.getElementById("sim-btn-gerar"),

      // saída
      areaSimulado: document.getElementById("sim-area"),
      areaResultado: document.getElementById("sim-resultado"),
    };

    // Guardar estado do simulado atual
    const estado = {
      modo: "tema", // "tema" | "upload"
      config: null,
      questoes: [],
      indiceAtual: 0,
      finalizado: false,
    };

    // --------------------------------------------------------
    // PERFIS DE BANCA (templates de estilo)
    // --------------------------------------------------------
    const PERFIS_BANCA = {
      FGV: {
        id: "FGV",
        nome: "FGV",
        estilo: "contextual",
        alternativas: 5,
        enunciadoLongo: true,
      },
      CESPE: {
        id: "CESPE",
        nome: "CESPE/CEBRASPE",
        estilo: "certo_errado",
        alternativas: 2, // "Certo" / "Errado"
        enunciadoLongo: true,
      },
      VUNESP: {
        id: "VUNESP",
        nome: "VUNESP",
        estilo: "direto",
        alternativas: 5,
        enunciadoLongo: false,
      },
      FCC: {
        id: "FCC",
        nome: "FCC",
        estilo: "objetivo",
        alternativas: 5,
        enunciadoLongo: false,
      },
    };

    // --------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------
    function alternarModo(modo) {
      estado.modo = modo;

      if (!els.painelTema || !els.painelUpload) return;

      if (modo === "tema") {
        els.painelTema.classList.remove("hidden");
        els.painelUpload.classList.add("hidden");
        els.modoTema?.classList.add("selected");
        els.modoUpload?.classList.remove("selected");
      } else {
        els.painelTema.classList.add("hidden");
        els.painelUpload.classList.remove("hidden");
        els.modoTema?.classList.remove("selected");
        els.modoUpload?.classList.add("selected");
      }
    }

    function getPerfilBanca(id) {
      return PERFIS_BANCA[id] || PERFIS_BANCA["FGV"];
    }

    function montarConfigDoForm() {
      const bancaId = els.selBanca?.value || "FGV";
      const qtd = parseInt(els.selQtd?.value || "5", 10) || 5;
      const nivel = els.selNivel?.value || "basico";

      const perfil = getPerfilBanca(bancaId);

      if (estado.modo === "tema") {
        const tema = (els.inpTema?.value || "").trim();
        if (!tema) {
          alert("Informe um tema para gerar o simulado.");
          return null;
        }
        return {
          origem: "tema",
          tema,
          nivel,
          banca: perfil,
          qtd,
        };
      } else {
        // origem upload → posteriormente podemos receber um "outline" do PDF
        return {
          origem: "upload",
          base: "pdf",
          descricaoBase: els.infoUpload?.textContent || "Baseado no PDF carregado",
          nivel,
          banca: perfil,
          qtd,
        };
      }
    }

    // --------------------------------------------------------
    // GERADOR DE QUESTÕES FAKE (para testes de UX)
    // Depois, aqui entra a IA de verdade
    // --------------------------------------------------------
    function gerarQuestoesFake(config) {
      const questoes = [];
      for (let i = 0; i < config.qtd; i++) {
        questoes.push(criarQuestaoFake(config, i + 1));
      }
      return questoes;
    }

    function criarQuestaoFake(config, indice) {
      const banca = config.banca;
      const baseTexto =
        config.origem === "tema"
          ? `sobre o tema "${config.tema}"`
          : `com base no material enviado (PDF)`;

      if (banca.estilo === "certo_errado") {
        // CESPE
        const enunciado =
          `A seguinte afirmação ${baseTexto} está correta para o padrão da banca ${banca.nome}: ` +
          `“No contexto de ${config.nivel}, considera-se que o candidato deve ser capaz de ` +
          `interpretar, analisar e julgar assertivas complexas, identificando exceções e detalhes relevantes.”`;

        const correta = Math.random() > 0.5 ? "Certo" : "Errado";

        return {
          id: `Q${indice}`,
          indice,
          tipo: "certo_errado",
          enunciado,
          alternativas: ["Certo", "Errado"],
          correta,
          explicacao:
            "Questão em estilo CESPE: o foco está em julgar a assertiva como certa ou errada, prestando atenção a termos absolutos, exceções e detalhes semânticos.",
          respostaAluno: null,
        };
      }

      // Demais bancas (objetivas)
      const enunciadoBaseLongo = `Considerando o que se estuda ${baseTexto}, especialmente no nível ${config.nivel}, ` +
        `analise a situação hipotética a seguir e, em seguida, responda à questão. ` +
        `Um candidato se prepara para provas da banca ${banca.nome} e precisa dominar conceitos, aplicações ` +
        `e relações entre os tópicos abordados em ${baseTexto}.`;

      const enunciadoBaseCurto = `No contexto ${baseTexto}, assinale a alternativa correta.`;

      const enunciado = banca.enunciadoLongo
        ? `${enunciadoBaseLongo}\n\nCom base nessas informações, assinale a alternativa correta.`
        : enunciadoBaseCurto;

      const alternativas = [];
      const qtdAlt = banca.alternativas || 5;
      const idxCorreta = Math.floor(Math.random() * qtdAlt);

      for (let i = 0; i < qtdAlt; i++) {
        const letra = String.fromCharCode(65 + i); // A, B, C, ...
        const textoAlt =
          i === idxCorreta
            ? `${letra}) Alternativa correta, coerente com o conteúdo ${baseTexto} e compatível com o estilo da banca ${banca.nome}.`
            : `${letra}) Alternativa incorreta, apresentando erro conceitual, generalização indevida ou detalhe incompatível com o padrão da banca ${banca.nome}.`;
        alternativas.push(textoAlt);
      }

      return {
        id: `Q${indice}`,
        indice,
        tipo: "objetiva",
        enunciado,
        alternativas,
        correta: alternativas[idxCorreta].slice(0, 2), // "A)" , "B)" etc. (poderíamos guardar índice também)
        corretaIndex: idxCorreta,
        explicacao:
          "Questão criada em estilo objetivo, simulando o padrão da banca escolhida. Em uma versão com IA, o enunciado e as alternativas seriam baseados em tópicos reais do conteúdo.",
        respostaAluno: null,
      };
    }

    // --------------------------------------------------------
    // RENDERIZAÇÃO DO SIMULADO
    // --------------------------------------------------------
    function renderizarQuestaoAtual() {
      if (!els.areaSimulado) return;

      els.areaResultado.innerHTML = "";
      els.areaSimulado.innerHTML = "";

      if (!estado.questoes || estado.questoes.length === 0) {
        els.areaSimulado.innerHTML = "<p>Nenhum simulado gerado ainda.</p>";
        return;
      }

      if (estado.finalizado) {
        renderizarResultado();
        return;
      }

      const q = estado.questoes[estado.indiceAtual];

      const wrapper = document.createElement("div");
      wrapper.className = "sim-questao";

      const header = document.createElement("div");
      header.className = "sim-questao-header";
      header.innerHTML = `
        <div class="sim-questao-indice">Questão ${q.indice} de ${estado.questoes.length}</div>
        <div class="sim-questao-banca">${estado.config.banca.nome}</div>
      `;
      wrapper.appendChild(header);

      const enu = document.createElement("p");
      enu.className = "sim-enunciado";
      enu.textContent = q.enunciado;
      wrapper.appendChild(enu);

      const lista = document.createElement("div");
      lista.className = "sim-alternativas";

      if (q.tipo === "certo_errado") {
        q.alternativas.forEach((alt) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className =
            "sim-alt-btn" + (q.respostaAluno === alt ? " sim-alt-selecionada" : "");
          btn.textContent = alt;
          btn.addEventListener("click", () => {
            q.respostaAluno = alt;
            renderizarQuestaoAtual();
          });
          lista.appendChild(btn);
        });
      } else {
        q.alternativas.forEach((altTexto, idx) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className =
            "sim-alt-btn" +
            (q.respostaAluno === idx ? " sim-alt-selecionada" : "");
          btn.textContent = altTexto;
          btn.addEventListener("click", () => {
            q.respostaAluno = idx;
            renderizarQuestaoAtual();
          });
          lista.appendChild(btn);
        });
      }

      wrapper.appendChild(lista);

      // Navegação
      const nav = document.createElement("div");
      nav.className = "sim-nav";

      const btnAnterior = document.createElement("button");
      btnAnterior.type = "button";
      btnAnterior.textContent = "Anterior";
      btnAnterior.disabled = estado.indiceAtual === 0;
      btnAnterior.addEventListener("click", () => {
        if (estado.indiceAtual > 0) {
          estado.indiceAtual--;
          renderizarQuestaoAtual();
        }
      });

      const btnProxima = document.createElement("button");
      btnProxima.type = "button";
      btnProxima.textContent =
        estado.indiceAtual === estado.questoes.length - 1
          ? "Finalizar simulado"
          : "Próxima";
      btnProxima.addEventListener("click", () => {
        if (estado.indiceAtual < estado.questoes.length - 1) {
          estado.indiceAtual++;
          renderizarQuestaoAtual();
        } else {
          finalizarSimulado();
        }
      });

      nav.appendChild(btnAnterior);
      nav.appendChild(btnProxima);

      wrapper.appendChild(nav);

      els.areaSimulado.appendChild(wrapper);
    }

    // --------------------------------------------------------
    // FINALIZAÇÃO E RESULTADO
    // --------------------------------------------------------
    function finalizarSimulado() {
      estado.finalizado = true;
      renderizarResultado();
    }

    function renderizarResultado() {
      if (!els.areaResultado || !estado.questoes.length) return;

      els.areaSimulado.innerHTML = "";

      let acertos = 0;

      estado.questoes.forEach((q) => {
        if (q.tipo === "certo_errado") {
          if (q.respostaAluno === q.correta) acertos++;
        } else {
          if (q.respostaAluno === q.corretaIndex) acertos++;
        }
      });

      const total = estado.questoes.length;
      const perc = Math.round((acertos / total) * 100);

      const resumo = document.createElement("div");
      resumo.className = "sim-resumo";

      resumo.innerHTML = `
        <h3>Resultado do simulado (${estado.config.banca.nome})</h3>
        <p><strong>Acertos:</strong> ${acertos} de ${total} (${perc}%)</p>
        <p><strong>Nível:</strong> ${estado.config.nivel}</p>
        <p><strong>Origem:</strong> ${
          estado.config.origem === "tema"
            ? `Tema: "${estado.config.tema}"`
            : `Base: ${estado.config.descricaoBase}`
        }</p>
      `;

      // Lista comentada de questões
      const lista = document.createElement("div");
      lista.className = "sim-lista-questoes";

      estado.questoes.forEach((q) => {
        const bloco = document.createElement("div");
        bloco.className = "sim-questao-resumo";

        let respostaAlunoTexto;
        let corretaTexto;

        if (q.tipo === "certo_errado") {
          respostaAlunoTexto = q.respostaAluno || "Não respondida";
          corretaTexto = q.correta;
        } else {
          respostaAlunoTexto =
            q.respostaAluno == null
              ? "Não respondida"
              : q.alternativas[q.respostaAluno];
          corretaTexto = q.alternativas[q.corretaIndex];
        }

        const acertou =
          q.tipo === "certo_errado"
            ? q.respostaAluno === q.correta
            : q.respostaAluno === q.corretaIndex;

        bloco.innerHTML = `
          <div class="sim-questao-resumo-header">
            <span>Questão ${q.indice}</span>
            <span class="${
              acertou ? "sim-acerto" : "sim-erro"
            }">${acertou ? "Acertou" : "Errou"}</span>
          </div>
          <p class="sim-enunciado-resumo">${q.enunciado}</p>
          <p><strong>Sua resposta:</strong> ${respostaAlunoTexto}</p>
          <p><strong>Gabarito:</strong> ${corretaTexto}</p>
          <p class="sim-explicacao"><strong>Comentário:</strong> ${
            q.explicacao
          }</p>
        `;
        lista.appendChild(bloco);
      });

      els.areaResultado.innerHTML = "";
      els.areaResultado.appendChild(resumo);
      els.areaResultado.appendChild(lista);
    }

    // --------------------------------------------------------
    // AÇÃO PRINCIPAL: GERAR SIMULADO
    // --------------------------------------------------------
    function gerarSimulado() {
      const config = montarConfigDoForm();
      if (!config) return;

      console.log("🧪 Gerando simulado com config:", config);

      // Aqui, por enquanto, usamos o gerador fake.
      // No futuro: chamar backend/IA passando (config + tópicos/outline do PDF, etc.)
      const questoes = gerarQuestoesFake(config);

      estado.config = config;
      estado.questoes = questoes;
      estado.indiceAtual = 0;
      estado.finalizado = false;

      renderizarQuestaoAtual();
    }

    // --------------------------------------------------------
    // EVENTOS
    // --------------------------------------------------------
    els.modoTema?.addEventListener("click", () => alternarModo("tema"));
    els.modoUpload?.addEventListener("click", () => alternarModo("upload"));
    els.btnGerar?.addEventListener("click", gerarSimulado);

    // modo inicial
    alternarModo("tema");

    console.log("🟢 Liora Simulados v1 inicializado com sucesso.");
  });
})();
