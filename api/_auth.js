// =============================================================================
// AUTENTICAÇÃO DAS SERVERLESS FUNCTIONS (arquivo com "_" não vira rota no Vercel)
//
// Toda chamada às APIs precisa mandar o header "x-publish-token" com:
//   - a senha de acesso do site (ACCESS_PASSWORD), que o navegador envia depois do login; ou
//   - o PUBLISH_TOKEN, usado pelo script de análise semanal (vivo-automacao).
//
// Variáveis de ambiente no Vercel:
//   ACCESS_PASSWORD — senha do site. Se não existir, usa VITE_ACCESS_PASSWORD (nome antigo).
//   PUBLISH_TOKEN   — token do script semanal. Opcional.
//
// Sem nenhuma das duas configurada, as APIs ficam liberadas (modo desenvolvimento),
// igual ao comportamento antigo do site sem senha.
// =============================================================================

import { timingSafeEqual } from "crypto";

function segredosValidos() {
  return [
    process.env.ACCESS_PASSWORD || process.env.VITE_ACCESS_PASSWORD,
    process.env.PUBLISH_TOKEN,
  ].filter(Boolean);
}

// Comparação em tempo constante (não vaza o tamanho do acerto pelo tempo de resposta)
function iguais(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export function exigeSenha() {
  return segredosValidos().length > 0;
}

export function senhaValida(valor) {
  if (!exigeSenha()) return true;
  if (!valor) return false;
  return segredosValidos().some((s) => iguais(valor, s));
}

// Retorna true se autorizado; senão já responde 401 e retorna false.
export function autorizar(req, res) {
  if (senhaValida(req.headers?.["x-publish-token"])) return true;
  res.status(401).json({ error: "Não autorizado. Faça login novamente." });
  return false;
}
