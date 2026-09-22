// =============================================================================
// SERVERLESS FUNCTION — Ler análise compartilhada
//
// O dashboard chama esta função ao carregar, para buscar a análise da semana
// que está salva no banco compartilhado (Upstash Redis). Assim todos os usuários
// veem a MESMA análise, sem cada um reprocessar via IA.
//
// Uso: GET /api/get-analysis?modo=Fly
// =============================================================================

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const modo = req.query?.modo || "Fly";

  try {
    const raw = await redis.get(`analyses:${modo}`);

    if (!raw) {
      // Nenhuma análise salva ainda para este modo
      return res.status(200).json({ analyses: {}, atualizadoEm: null });
    }

    // O valor pode vir como objeto (Upstash desserializa) ou string
    const registro = typeof raw === "string" ? JSON.parse(raw) : raw;

    return res.status(200).json({
      analyses:     registro.analyses     || {},
      atualizadoEm: registro.atualizadoEm || null,
    });
  } catch (e) {
    return res.status(500).json({ error: `Erro ao ler do banco: ${e.message}` });
  }
}
