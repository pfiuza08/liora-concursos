// ==========================================================
// 🧠 LIORA — NAV COMERCIAL v1
// Camada de navegação: Estudo x Avaliação
// ==========================================================
(function () {
  console.log("🔵 Inicializando Liora NAV Comercial v1...");

  document.addEventListener("DOMContentLoaded", () => {
    // Botões de grupo
    const btnGrupoEstudo = document.getElementById("grupo-estudo");
    const btnGrupoAvaliacao = document.getElementById("grupo-avaliacao");

    // Blocos de submodos
    const blocoEstudo = document.getElementById("bloco-estudo");
    const blocoAvaliacao = document.getElementById("bloco-avaliacao");

    // Botões de submodo (já existentes)
    const btnTema = document.getElementById("modo-tema");
    const btnUpload = document.getElementById("modo-upload");
    const btnSimulados = document.getElementById("modo-simulados");
    const btnDashboard = document.getElementById("modo-dashboard");

    // Painéis à esquerda
    const painelTema = document.getElementById("painel-tema");
    const painelUpload = document.getElementById("painel-upload");

    // Áreas à direita
    const areaPlano = document.getElementById("area-plano");
    const areaSessoes = document.getElementById("liora-sessoes");
    const areaSimulado = document.getElementById("area-simulado");
    const areaDashboard = document.getElementById("area-dashboard");

    if (
      !btnGrupoEstudo || !btnGrupoAvaliacao ||
      !blocoEstudo || !blocoAvaliacao ||
      !btnTema || !btnUpload || !btnSimulados || !btnDashboard ||
      !painelTema || !painelUpload ||
      !areaPlano || !areaSimulado || !areaDashboard
    ) {
      console.warn("⚠️ Liora NAV: alguns elementos não foram encontrados. Verifique os IDs.");
      return;
    }

    // Helpers
    function addSelected(el) {
      el.classList.add("selected");
    }
    function removeSelected(el) {
      el.classList.remove("selected");
    }

    function mostrarEstudo() {
      // Grupo
      addSelected(btnGrupoEstudo);
      removeSelected(btnGrupoAvaliacao);

      blocoEstudo.classList.remove("hidden");
      blocoAvaliacao.classList.add("hidden");

      // Painéis: estudo visível, avaliação escondida
      areaPlano.classList.remove("hidden");
      if (areaSessoes) areaSessoes.classList.remove("hidden");
      areaSimulado.classList.add("hidden");
      areaDashboard.classList.add("hidden");

      // Default: Tema
      mostrarTema();
    }

    function mostrarAvaliacao() {
      // Grupo
      addSelected(btnGrupoAvaliacao);
      removeSelected(btnGrupoEstudo);

      blocoEstudo.classList.add("hidden");
      blocoAvaliacao.classList.remove("hidden");

      // Hide tudo de estudo
      areaPlano.classList.add("hidden");
      if (areaSessoes) areaSessoes.classList.add("hidden");
      painelTema.classList.add("hidden");
      painelUpload.classList.add("hidden");

      // Default: Simulados
      mostrarSimulados();
    }

    function mostrarTema() {
      addSelected(btnTema);
      removeSelected(btnUpload);

      painelTema.classList.remove("hidden");
      painelUpload.classList.add("hidden");

      // Áreas de estudo à direita
      areaPlano.classList.remove("hidden");
      if (areaSessoes) areaSessoes.classList.remove("hidden");
      areaSimulado.classList.add("hidden");
      areaDashboard.classList.add("hidden");
    }

    function mostrarUpload() {
      addSelected(btnUpload);
      removeSelected(btnTema);

      painelTema.classList.add("hidden");
      painelUpload.classList.remove("hidden");

      // Continua no contexto de estudo
      areaPlano.classList.remove("hidden");
      if (areaSessoes) areaSessoes.classList.remove("hidden");
      areaSimulado.classList.add("hidden");
      areaDashboard.classList.add("hidden");
    }

    function mostrarSimulados() {
      addSelected(btnSimulados);
      removeSelected(btnDashboard);

      areaSimulado.classList.remove("hidden");
      areaDashboard.classList.add("hidden");

      // Estudo escondido
      areaPlano.classList.add("hidden");
      if (areaSessoes) areaSessoes.classList.add("hidden");
    }

    function mostrarDashboard() {
      addSelected(btnDashboard);
      removeSelected(btnSimulados);

      areaDashboard.classList.remove("hidden");
      areaSimulado.classList.add("hidden");

      // Estudo escondido
      areaPlano.classList.add("hidden");
      if (areaSessoes) areaSessoes.classList.add("hidden");
    }

    // Ligações de eventos
    btnGrupoEstudo.addEventListener("click", mostrarEstudo);
    btnGrupoAvaliacao.addEventListener("click", mostrarAvaliacao);

    btnTema.addEventListener("click", () => {
      // Garante que o grupo correto esteja ativo
      mostrarEstudo();
      mostrarTema();
    });

    btnUpload.addEventListener("click", () => {
      mostrarEstudo();
      mostrarUpload();
    });

    btnSimulados.addEventListener("click", () => {
      mostrarAvaliacao();
      mostrarSimulados();
    });

    btnDashboard.addEventListener("click", () => {
      mostrarAvaliacao();
      mostrarDashboard();
    });

    // Estado inicial: Estudo por Tema
    mostrarEstudo();
  });
})();
