// =============================================================================
// SERVERLESS FUNCTION — Login do dashboard
//
// A senha é conferida AQUI, no servidor. Antes ela ia embutida no JavaScript do
// site (VITE_ACCESS_PASSWORD) e qualquer um podia lê-la no navegador.
//
//   GET  /api/login           → { exigeSenha: true|false }
//   POST /api/login {senha}   → 200 { ok: true } ou 401
// =============================================================================

import { exigeSenha, senhaValida } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ exigeSenha: exigeSenha() });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  if (!senhaValida(body?.senha)) {
    return res.status(401).json({ error: "Senha incorreta." });
  }
  return res.status(200).json({ ok: true });
}
