// =============================================================================
// SERVERLESS FUNCTION — Análise via Claude (Anthropic)
//
// Roda no servidor do Vercel, NÃO no navegador. A chave da API fica segura aqui,
// nunca é exposta ao usuário. O dashboard chama esta função em vez de chamar a
// Anthropic diretamente.
//
// Responsabilidades:
//   1. Receber o prompt do dashboard (sem nenhuma chave)
//   2. Chamar a Claude com a chave (só o servidor conhece)
//   3. Contar os tokens usados e acumular o total do dia
//   4. BLOQUEAR se o limite diário de tokens for ultrapassado
//
// Variáveis de ambiente necessárias no Vercel:
//   ANTHROPIC_API_KEY       — a chave nova da Anthropic (nunca a que vazou)
//   DAILY_TOKEN_LIMIT       — teto de tokens por dia (ex: 500000). Opcional; padrão 500000.
//   ANTHROPIC_MODEL         — modelo a usar. Opcional; padrão claude-opus-4-6... (ver abaixo)
// =============================================================================

// Contador de tokens em memória. Reinicia quando a função "esfria" (cold start),
// então NÃO é um limite perfeito entre múltiplas instâncias — mas para um time
// pequeno com uso moderado, funciona como uma trava de segurança eficaz.
// Para um limite rigoroso e persistente, seria preciso um banco (ex: Vercel KV).
let tokenState = {
  dia:    null,  // "2026-08-27"
  usados: 0,     // tokens acumulados no dia (input + output)
};

const DEFAULT_DAILY_LIMIT = 500_000;// Modelo padrão. Pode ser trocado pela variável ANTHROPIC_MODEL no Vercel.
// Opções comuns (verifique quais sua chave corporativa tem acesso):
//   claude-sonnet-4-5-20250929  — equilíbrio custo/qualidade (padrão, recomendado)
//   claude-haiku-4-5-20251001   — mais barato e rápido, para economizar tokens
//   claude-sonnet-4-6           — versão mais recente do Sonnet
// Modelos e disponibilidade mudam; confirme no console.anthropic.com da empresa.
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

function hojeISO() {
  return new Date().toISOString().slice(0, 10); // "AAAA-MM-DD"
}

// Zera o contador se virou o dia
function resetSeVirouODia() {
  const hoje = hojeISO();
  if (tokenState.dia !== hoje) {
    tokenState = { dia: hoje, usados: 0 };
  }
}

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const apiKey     = process.env.ANTHROPIC_API_KEY;
  const dailyLimit = parseInt(process.env.DAILY_TOKEN_LIMIT || "") || DEFAULT_DAILY_LIMIT;
  const model      = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no servidor." });
  }

  resetSeVirouODia();

  // Bloqueio preventivo: se já passou do limite, nem chama a IA
  if (tokenState.usados >= dailyLimit) {
    return res.status(429).json({
      error:      "Limite diário de tokens atingido.",
      limite:     dailyLimit,
      usados:     tokenState.usados,
      bloqueado:  true,
    });
  }

  // Lê o corpo da requisição
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { prompt, maxTokens } = body || {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Campo 'prompt' é obrigatório." });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens || 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({
        error: data?.error?.message || "Erro na chamada à Anthropic.",
      });
    }

    // Contabiliza os tokens realmente usados (vêm na resposta da API)
    const inputTokens  = data?.usage?.input_tokens  || 0;
    const outputTokens = data?.usage?.output_tokens || 0;
    tokenState.usados += inputTokens + outputTokens;

    // Texto da resposta (a Claude devolve em blocos de conteúdo)
    const text = (data?.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return res.status(200).json({
      text,
      uso: {
        inputTokens,
        outputTokens,
        usadosHoje:   tokenState.usados,
        limiteDiario: dailyLimit,
        restante:     Math.max(0, dailyLimit - tokenState.usados),
      },
    });
  } catch (e) {
    return res.status(500).json({ error: `Erro no servidor: ${e.message}` });
  }
}
