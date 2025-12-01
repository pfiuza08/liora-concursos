// /api/gerarPlano.js — ROBUSTO, COMPATÍVEL COM CORE v74
import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const { tema, nivel, sessoes } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({ error: "Parâmetros incompletos." });
    }

    // número de sessões adaptativo
    const qtdSessoes = Math.max(6, Math.min(12, Number(sessoes) || 8));

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // -------------------------------------------------------
    // PROMPT DEFINITIVO: sessões densas + JSON válido
    // -------------------------------------------------------
    const prompt = `
Você é a IA da Liora, especialista em aprendizado adaptativo.

Gere EXATAMENTE ${qtdSessoes} sessões completas e densas,
seguindo o formato JSON OBRIGATÓRIO abaixo.

⚠️ SAÍDA OBRIGATÓRIA: JSON **PURO**, sem NENHUM texto antes ou depois.

{
  "origem": "tema",
  "tema": "${tema}",
  "nivel": "${nivel}",
  "sessoes": [
    {
      "titulo": "",
      "objetivo": "",
      "conteudo": {
        "introducao": "",
        "conceitos": ["", ""],
        "exemplos": ["", ""],
        "aplicacoes": ["", ""],
        "resumoRapido": ["", ""]
      },
      "ativacao": ["", ""],
      "quiz": {
        "pergunta": "",
        "alternativas": ["A", "B", "C", "D"],
        "corretaIndex": 0,
        "explicacao": ""
      },
      "flashcards": [
        { "q": "", "a": "" },
        { "q": "", "a": "" }
      ],
      "mindmap": "A > B > C | X > Y"
    }
  ]
}

REGRAS DE OURO:
- Nunca escreva texto fora do JSON.
- Nunca explique nada.
- NUNCA coloque comentários.
- Todos os campos devem vir preenchidos.
- Os itens “conceitos”, “exemplos” e “aplicacoes” devem ser úteis e didáticos.
- O JSON deve ser 100% válido e pronto para parse.
    `;

    // -------------------------------------------------------
    // Função auxiliar: garantir JSON válido
    // -------------------------------------------------------
    function tryParseJSON(str) {
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    }

    // -------------------------------------------------------
    // Função para gerar com retry automático
    // -------------------------------------------------------
    async function gerarComRetry() {
      for (let tentativa = 1; tentativa <= 2; tentativa++) {
        try {
          const completion = await client.chat.completions.create({
            model: "gpt-4.1",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
          });

          let output = completion.choices[0].message.content.trim();

          // Se vier com ```json, remover
          output = output.replace(/```json/g, "").replace(/```/g, "").trim();

          const test = tryParseJSON(output);
          if (test && test.sessoes && test.sessoes.length) {
            return output; // STRING válida
          }

          console.warn(`⚠️ Tentativa ${tentativa} retornou JSON inválido`);
        } catch (err) {
          console.warn(`⚠️ Tentativa ${tentativa} falhou`, err);
        }
      }

      throw new Error("A IA não retornou JSON válido após 2 tentativas.");
    }

    // -------------------------------------------------------
    // Execução real
    // -------------------------------------------------------
    const output = await gerarComRetry();

    // -------------------------------------------------------
    // RESPOSTA FINAL — EXATAMENTE o formato que o CORE v74 espera
    // NÃO FAZER JSON.parse(output) aqui!
    // -------------------------------------------------------
    return res.status(200).json({ plano: output });

  } catch (error) {
    console.error("❌ Erro ao gerar plano:", error);
    return res.status(500).json({ error: "Erro ao gerar plano." });
  }
}
