// /scripts/plano-simulador.js — v15 (subtópicos garantidos + fallback específico)
(function () {
  const LOG = (...a) => console.log("[plano-simulador]", ...a);

  // =======================
  // 🔧 Utils
  // =======================
  const isNonEmptyStr = (s) => typeof s === "string" && s.trim().length > 0;

  // Remove cercas e tenta extrair JSON válido ({...} ou {...} com ruído)
  function extractJSONObject(text) {
    if (!text) return null;
    let t = String(text).replace(/```json|```/g, "").trim();
    try { return JSON.parse(t); } catch {}
    const first = t.indexOf("{"), last = t.lastIndexOf("}");
    if (first === -1 || last === -1 || last <= first) return null;
    try { return JSON.parse(t.slice(first, last + 1)); } catch { return null; }
  }

  // Heurística: conteúdo “genérico demais”?
  function looksGeneric(content) {
    const c = String(content || "").toLowerCase();
    return (
      c.includes("conceitos principais") ||
      c.includes("aplicação prática") ||
      c.includes("exercícios") && c.split("\n").length <= 4
    );
  }

  // Constrói subtópicos determinísticos a partir do tema e nível
  function buildSubtopics(theme, level, wanted) {
    const base = [
      "Fundamentos e Terminologia de {TEMA}",
      "Arquiteturas/Modelos em {TEMA}",
      "Dados, Pré-processamento e Qualidade em {TEMA}",
      "Técnicas/Procedimentos essenciais em {TEMA}",
      "Ferramentas/Frameworks para {TEMA}",
      "Boas práticas e Erros comuns em {TEMA}",
      "Aplicações no mundo real de {TEMA}",
      "Métricas, Avaliação e Iteração em {TEMA}",
      "Ética, Riscos e Conformidade em {TEMA}",
      "Projeto Guiado: {TEMA} end-to-end",
    ];

    // Ajusta quantidade sugerida por nível caso "wanted" não seja informado
    const suggested =
      level === "avancado" ? 6 :
      level === "intermediario" ? 7 :
      8;

    const n = Math.max(3, Math.min(wanted || suggested, base.length));
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push(base[i].replaceAll("{TEMA}", theme));
    }
    return out;
  }

  // Gera bullets específicos para um subtópico (sem frases genéricas)
  function bulletsFor(subtopic, theme, level) {
    const lvlHint =
      level === "avancado" ? "aprofundamento técnico" :
      level === "intermediario" ? "aplicação prática orientada" :
      "compreensão básica com prática guiada";

    return [
      `Definição e escopo de **${subtopic}** (${lvlHint}).`,
      `Exemplo concreto: aplique ${subtopic.toLowerCase()} em um mini-caso relacionado a **${theme}**.`,
      `Checklist de verificação rápida para ${subtopic.toLowerCase()}.`,
      `Tarefa: produzir um pequeno artefato (nota, código, mapa mental) sobre **${subtopic}**.`
    ].map(s => "• " + s).join("\n");
  }

  // Normaliza uma sessão recebida da IA; se genérica, substitui bullets
  function normalizeSession(item, idx, theme, level, fallbackTitle) {
    const titulo = (item?.titulo && String(item.titulo)) || fallbackTitle || `Sessão ${idx + 1} — ${theme}`;
    const resumo = (item?.resumo && String(item.resumo)) || `Objetivo da sessão ${idx + 1} sobre ${theme} (nível ${level}).`;

    let conteudo = item?.conteudo;
    if (Array.isArray(conteudo)) {
      conteudo = conteudo.map(x => `• ${String(x).trim()}`).join("\n");
    }

    if (!isNonEmptyStr(conteudo) || looksGeneric(conteudo)) {
      // Extrai subtítulo (após “—”) para gerar bullets específicos
      const afterDash = titulo.split("—")[1]?.trim() || theme;
      conteudo = bulletsFor(afterDash, theme, level);
    }

    return { titulo: titulo.trim(), resumo: resumo.trim(), conteudo: String(conteudo).trim() };
  }

  // Deduplica títulos; se repetidos, força nome do subtópico da lista
  function dedupeAndEnforceSubtopics(plan, subtopics, theme, level) {
    const seen = new Set();
    return plan.map((s, i) => {
      let titulo = s.titulo || `Sessão ${i + 1} — ${theme}`;
      const dash = titulo.indexOf("—");
      const prefix = dash !== -1 ? titulo.slice(0, dash).trim() : `Sessão ${i + 1}`;
      let suffix = dash !== -1 ? titulo.slice(dash + 1).trim() : subtopics[i] || theme;

      if (seen.has(titulo)) {
        suffix = subtopics[i] || `${suffix} (${i + 1})`;
        titulo = `${prefix} — ${suffix}`;
      }
      seen.add(titulo);

      // Regera conteúdo se ficou genérico
      const fixed = normalizeSession({ ...s, titulo }, i, theme, level, titulo);
      return fixed;
    });
  }

  // Monta um plano completo, garantindo especificidade
  function buildSpecificPlanFromSubtopics(theme, level, subtopics) {
    const plano = subtopics.map((st, i) => {
      const titulo = `Sessão ${i + 1} — ${st}`;
      const resumo = `Nesta sessão, você dominará o subtópico **${st}**, conectando-o ao tema **${theme}** no nível ${level}.`;
      const conteudo = bulletsFor(st, theme, level);
      return { titulo, resumo, conteudo };
    });
    return { sessoes: plano.length, plano };
  }

  // =======================
  // 🚀 IA — Geração Automática
  // =======================
  window.generatePlanByTheme = async function (tema, nivel) {
    LOG("🚀 Geração por TEMA (auto sessões):", { tema, nivel });

    // 1) Se não houver API ou se der erro, usar gerador local específico
    if (!window.OPENAI_API_KEY) {
      LOG("⚠️ Sem OPENAI_API_KEY — usando gerador local específico.");
      const subtopics = buildSubtopics(tema, nivel);
      return buildSpecificPlanFromSubtopics(tema, nivel, subtopics);
    }

    // 2) Tentar IA com prompt que pede subtópicos + plano
    const prompt = `
Você é especialista em microlearning (Barbara Oakley) e design instrucional.
TAREFA: crie um plano PROGRESSIVO baseado em **subtópicos distintos** do tema.

Etapas:
1) Liste os subtópicos (ordem pedagógica do básico ao avançado).
2) Cada subtópico vira uma sessão com bullets **concretos e acionáveis** (evite "conceitos principais", "exercícios" genéricos).

RETORNE APENAS JSON VÁLIDO:
{
  "sessoes": <numero>,
  "plano": [
    { "titulo": "Sessão X — Nome do Subtópico",
      "resumo": "Objetivo da sessão (1 parágrafo).",
      "conteudo": "• bullet 1\\n• bullet 2\\n• bullet 3"
    }
  ]
}

Tema: "${tema}"
Nível: "${nivel}"
`.trim();

    try {
      LOG("🌐 Chamando OpenAI…");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          temperature: 0.15, // menos aleatório = mais obediente
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      const obj = extractJSONObject(content);

      if (!obj || !Array.isArray(obj.plano) || !Number(obj.sessoes)) {
        throw new Error("Resposta da IA fora do formato esperado.");
      }

      // 3) Pós-processamento: garantir subtópicos únicos e bullets específicos
      let plan = obj.plano.map((s, i) => normalizeSession(s, i, tema, nivel, s?.titulo));
      const wanted = Number(obj.sessoes) || plan.length;

      // Se títulos repetidos, força subtópicos determinísticos
      const deterministicSubtopics = buildSubtopics(tema, nivel, wanted);
      plan = dedupeAndEnforceSubtopics(plan, deterministicSubtopics, tema, nivel);

      // Ajusta contagem
      if (plan.length > wanted) plan = plan.slice(0, wanted);
      if (plan.length < wanted) {
        const missing = deterministicSubtopics.slice(plan.length);
        plan = plan.concat(
          missing.map((st, i) => {
            const idx = plan.length + i;
            return normalizeSession({ titulo: `Sessão ${idx + 1} — ${st}` }, idx, tema, nivel);
          })
        );
      }

      return { sessoes: plan.length, plano: plan };

    } catch (e) {
      LOG("❌ Falha IA, usando gerador local específico. Motivo:", e.message);
      const subtopics = buildSubtopics(tema, nivel);
      return buildSpecificPlanFromSubtopics(tema, nivel, subtopics);
    }
  };

  LOG("✅ plano-simulador.js carregado (v15)");
})();
