// =============================================================================
// SERVERLESS FUNCTION — Salvar análise compartilhada
//
// Recebe as análises geradas e as salva no Upstash Redis (banco compartilhado),
// para que TODOS os usuários vejam a mesma análise, sem cada um reprocessar.
//
// Requer a integração Upstash Redis instalada no Vercel (Marketplace → Storage).
// Ela injeta automaticamente KV_REST_API_URL e KV_REST_API_TOKEN.
//
// Chave usada no banco:
//   analyses:<modo>   — ex: "analyses:Fly", "analyses:Valoriza"
// =============================================================================

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv(); // usa KV_REST_API_URL e KV_REST_API_TOKEN do ambiente

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { modo, analyses } = body || {};

  if (!modo || typeof modo !== "string") {
    return res.status(400).json({ error: "Campo 'modo' é obrigatório (ex: 'Fly')." });
  }
  if (!analyses || typeof analyses !== "object") {
    return res.status(400).json({ error: "Campo 'analyses' é obrigatório (objeto)." });
  }

  try {
    const registro = {
      analyses,
      atualizadoEm: new Date().toISOString(),
    };
    // Salva o objeto inteiro sob a chave do modo
    await redis.set(`analyses:${modo}`, JSON.stringify(registro));

    return res.status(200).json({
      ok:           true,
      modo,
      qtd:          Object.keys(analyses).length,
      atualizadoEm: registro.atualizadoEm,
    });
  } catch (e) {
    return res.status(500).json({ error: `Erro ao salvar no banco: ${e.message}` });
  }
}
