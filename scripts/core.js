// ==========================================================
// 🧠 LIORA — CORE v70-G-SIM-FINAL
// - Compatível com o index.html mais recente enviado
// - Corrige bug: wizard/sessões aparecendo em telas erradas
// - Wizard só aparece após sessões estarem prontas
// - Oculta tudo em Simulados, Dashboard e Home
// - Navegação limpa Tema / Upload / Home / Simulados / Dashboard
// ==========================================================

(function () {
  console.log("🔵 Inicializando Liora Core v70-G-SIM-FINAL...");

  document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------------------------
    // ELEMENTOS
    // --------------------------------------------------------
    const els = {
      // HOME
      home: document.getElementById("liora-home"),
      app: document.getElementById("liora-app"),

      homeTema: document.getElementById("home-tema"),
      homeUpload: document.getElementById("home-upload"),
      homeSimulados: document.getElementById("home-simulados"),
      homeDashboard: document.getElementById("home-dashboard"),

      // Botão flutuante INÍCIO
      fabHome: document.getElementById("fab-home"),

      // Painéis da esquerda (Tema / Upload)
      painelTema: document.getElementById("painel-tema"),
      painelUpload: document.getElementById("painel-upload"),

      // Áreas principais
      areaPlano: document.getElementById("area-plano"),
      areaSimulado: document.getElementById("area-simulado"),
      areaDashboard: document.getElementById("area-dashboard"),

      // Inputs Tema
      inpTema: document.getElementById("inp-tema"),
      selNivel: document.getElementById("sel-nivel"),
      btnGerar: document.getElementById("btn-gerar"),
      status: document.getElementById("status"),

      // Upload
      inpFile: document.getElementById("inp-file"),
      btnGerarUpload: document.getElementById("btn-gerar-upload"),
      statusUpload: document.getElementById("status-upload"),

      // Painel de tópicos
      plano: document.getElementById("plano"),
      ctx: document.getElementById("ctx"),

      // Wizard
      wizard: document.getElementById("liora-sessoes"),
      wTema: document.getElementById("liora-tema-ativo"),
      wTitulo: document.getElementById("liora-sessao-titulo"),
      wObjetivo: document.getElementById("liora-sessao-objetivo"),
      wConteudo: document.getElementById("liora-sessao-conteudo"),
      wAnalogias: document.getElementById("liora-sessao-analogias"),
      wAtivacao: document.getElementById("liora-sessao-ativacao"),
      wQuiz: document.getElementById("liora-sessao-quiz"),
      wQuizFeedback: document.getElementById("liora-sessao-quiz-feedback"),
      wFlashcards: document.getElementById("liora-sessao-flashcards"),
      wMapa: document.getElementById("liora-sessao-mapa"),
      wVoltar: document.getElementById("liora-btn-voltar"),
      wProxima: document.getElementById("liora-btn-proxima"),
      wBar: document.getElementById("liora-progress-bar"),

      // Tema claro/escuro
      themeBtn: document.getElementById("btn-theme"),
    };

    // Texto padrão no plano
    if (els.plano) {
      els.plano.innerHTML =
        '<p class="text-sm text-[var(--muted)]">Gere um plano por tema ou upload para visualizar as sessões.</p>';
    }

    // --------------------------------------------------------
    // ESTADO GLOBAL
    // --------------------------------------------------------
    let wizard = {
      tema: null,
      nivel: null,
      plano: [],
      sessoes: [],
      atual: 0,
      origem: "tema"
    };

    // --------------------------------------------------------
    // TEMA ESCURO / CLARO
    // --------------------------------------------------------
    (function themeSetup() {
      const btn = els.themeBtn;
      if (!btn) return;

      function apply(th) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(th);
        localStorage.setItem("liora-theme", th);
        btn.textContent = th === "light" ? "☀️" : "🌙";
      }

      apply(localStorage.getItem("liora-theme") || "dark");

      btn.onclick = () => {
        apply(document.documentElement.classList.contains("light") ? "dark" : "light");
      };
    })();

    // --------------------------------------------------------
    // MODO (HOME / TEMA / UPLOAD / SIMULADOS / DASHBOARD)
    // --------------------------------------------------------
    function showHome() {
      els.home.classList.remove("hidden");
      els.app.classList.add("hidden");

      // Ocultar tudo!
      hideAllPanels();
    }

    function hideAllPanels() {
      if (els.painelTema) els.painelTema.classList.add("hidden");
      if (els.painelUpload) els.painelUpload.classList.add("hidden");

      if (els.areaPlano) els.areaPlano.classList.add("hidden");
      if (els.areaSimulado) els.areaSimulado.classList.add("hidden");
      if (els.areaDashboard) els.areaDashboard.classList.add("hidden");
      if (els.wizard) els.wizard.classList.add("hidden");
    }

    function goto(mode) {
      els.home.classList.add("hidden");
      els.app.classList.remove("hidden");

      hideAllPanels();

      if (mode === "tema") {
        els.painelTema.classList.remove("hidden");
        els.areaPlano.classList.remove("hidden");

        if (wizard.sessoes.length) els.wizard.classList.remove("hidden");
      }

      if (mode === "upload") {
        els.painelUpload.classList.remove("hidden");
        els.areaPlano.classList.remove("hidden");

        if (wizard.sessoes.length) els.wizard.classList.remove("hidden");
      }

      if (mode === "simulados") {
        els.areaSimulado.classList.remove("hidden");
      }

      if (mode === "dashboard") {
        els.areaDashboard.classList.remove("hidden");
      }
    }

    // HOME — botões
    if (els.homeTema) els.homeTema.onclick = () => goto("tema");
    if (els.homeUpload) els.homeUpload.onclick = () => goto("upload");
    if (els.homeSimulados) els.homeSimulados.onclick = () => goto("simulados");
    if (els.homeDashboard) els.homeDashboard.onclick = () => goto("dashboard");

    // FAB — voltar ao início
    if (els.fabHome) els.fabHome.onclick = showHome;

    // Modo inicial
    showHome();

    // --------------------------------------------------------
    // RENDER WIZARD
    // --------------------------------------------------------
    function renderWizard() {
      if (!wizard.sessoes.length) {
        els.wizard.classList.add("hidden");
        return;
      }

      els.wizard.classList.remove("hidden");

      const s = wizard.sessoes[wizard.atual];

      els.wTema.textContent = wizard.tema;
      els.wTitulo.textContent = s.titulo;
      els.wObjetivo.textContent = s.objetivo;

      const c = s.conteudo || {};
      els.wConteudo.innerHTML = `
        ${c.introducao ? `<p>${c.introducao}</p>` : ""}
        ${Array.isArray(c.conceitos) ? `<ul>${c.conceitos.map(x => `<li>${x}</li>`).join("")}</ul>` : ""}
      `;

      els.wAnalogias.innerHTML = (s.analogias || []).map(x => `<p>${x}</p>`).join("");
      els.wAtivacao.innerHTML = (s.ativacao || []).map(x => `<li>${x}</li>`).join("");

      els.wFlashcards.innerHTML = (s.flashcards || [])
        .map(f => `<li><b>${f.q}:</b> ${f.a}</li>`).join("");

      // mapa
      els.wMapa.textContent = JSON.stringify(s.mapaMental || "", null, 2);

      // barra
      els.wBar.style.width =
        `${((wizard.atual + 1) / wizard.sessoes.length) * 100}%`;
    }

    // --------------------------------------------------------
    // NAVEGAÇÃO WIZARD
    // --------------------------------------------------------
    if (els.wVoltar) {
      els.wVoltar.onclick = () => {
        if (wizard.atual > 0) {
          wizard.atual--;
          renderWizard();
        }
      };
    }

    if (els.wProxima) {
      els.wProxima.onclick = () => {
        if (wizard.atual < wizard.sessoes.length - 1) {
          wizard.atual++;
          renderWizard();
        } else {
          alert("Sessões concluídas!");
        }
      };
    }

    // --------------------------------------------------------
    // GERAR PLANO (TEMA)
    // --------------------------------------------------------
    if (els.btnGerar) {
      els.btnGerar.onclick = async () => {
        const tema = els.inpTema.value.trim();
        const nivel = els.selNivel.value;

        if (!tema) return alert("Digite um tema!");

        els.status.textContent = "🔄 Gerando plano...";

        // MOCK simples para testes
        wizard = {
          tema,
          nivel,
          plano: [
            { titulo: "Sessão 1 — Fundamentos" },
            { titulo: "Sessão 2 — Conceitos" }
          ],
          sessoes: [
            {
              titulo: "Sessão 1 — Fundamentos",
              objetivo: "Entender os conceitos básicos.",
              conteudo: { introducao: "Introdução...", conceitos: ["A", "B"] },
              analogias: ["Como construir uma casa..."],
              ativacao: ["Explique X"],
              quiz: {},
              flashcards: [],
              mapaMental: "A > B > C"
            },
            {
              titulo: "Sessão 2 — Conceitos",
              objetivo: "Aprofundamento.",
              conteudo: { introducao: "Detalhes...", conceitos: ["C", "D"] },
              analogias: ["Analogia Y"],
              ativacao: ["Questão 2"],
              quiz: {},
              flashcards: [],
              mapaMental: "X > Y > Z"
            }
          ],
          atual: 0
        };

        renderWizard();

        els.plano.innerHTML = wizard.plano
          .map((p, i) => `<div class="liora-card-topico" data-i="${i}">${p.titulo}</div>`)
          .join("");

        document.querySelectorAll(".liora-card-topico").forEach(div => {
          div.onclick = () => {
            wizard.atual = Number(div.dataset.i);
            renderWizard();
          };
        });

        els.status.textContent = "Pronto!";
      };
    }

    // --------------------------------------------------------
    // GERAR PLANO (UPLOAD) — MOCK
    // --------------------------------------------------------
    if (els.btnGerarUpload) {
      els.btnGerarUpload.onclick = () => {
        const file = els.inpFile.files[0];
        if (!file) return alert("Selecione um PDF!");

        els.statusUpload.textContent = "Lendo PDF...";

        setTimeout(() => {
          wizard = {
            tema: file.name,
            nivel: "iniciante",
            plano: [{ titulo: "Sessão 1 — PDF" }],
            sessoes: [{
              titulo: "Sessão 1 — PDF",
              objetivo: "Analisar conteúdo do PDF.",
              conteudo: { introducao: "PDF...", conceitos: ["1", "2"] },
              analogias: [],
              ativacao: [],
              quiz: {},
              flashcards: [],
              mapaMental: "PDF > Secao > Detalhe"
            }],
            atual: 0
          };

          els.plano.innerHTML =
            `<div class="liora-card-topico">Sessão 1 — PDF</div>`;

          renderWizard();

          els.statusUpload.textContent = "Pronto!";
        }, 1000);
      };
    }

    console.log("🟢 Liora Core v70-G-SIM-FINAL carregado com sucesso!");
  });
})();
