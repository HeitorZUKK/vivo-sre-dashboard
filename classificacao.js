// =============================================================================
// CLASSIFICAÇÃO DE CHAMADOS — arquivo COMPARTILHADO
//
// Usado por DOIS lugares, que precisam dar exatamente o mesmo resultado:
//   1. O dashboard (Dashboard.jsx importa daqui)
//   2. O script de análise semanal (analise-semanal.js baixa este arquivo do
//      GitHub a cada execução e usa as mesmas funções)
//
// Assim, toda categoria que aparece no site é a mesma que o script analisa.
// Para mudar uma regra, edite SÓ este arquivo, faça commit + push, e os dois
// lados passam a usar a regra nova.
//
// Sem dependências — JavaScript puro, roda no navegador e no Node.
// =============================================================================

// Categoria usada quando o chamado não tem tag CATEGORIA: nem bate em nenhuma regra
export const SEM_CATEGORIA = "SEM CATEGORIA";

// ── Regras por palavra-chave (usadas só quando NÃO há tag "CATEGORIA:") ─────────
// A ordem importa: a primeira regra que bater vence.
export const CLASSIFIER_CONFIG = {
  Fly: {
    defaultCategoria: SEM_CATEGORIA,
    rules: [
      { keywords: ["altitude", "decimal digit"],                       categoria: "ALTURA" },
      { keywords: ["altura estrutura", "altura da estrutura"],         categoria: "ALTURA" },
      { keywords: ["distrito", "municipio", "município"],              categoria: "DISTRITO/MUNICÍPIO" },
      { keywords: ["object object", "<br>", "quebra de linha"],        categoria: "CARACTERE ESPECIAL" },
      { keywords: ["mapa", "coordenada", "latitude", "longitude"],     categoria: "CANDIDATO" },
      { keywords: ["feign", "abrir sci", "disparar sci"],              categoria: "SCI" },
      { keywords: ["unique query", "empresa duplicada"],               categoria: "EMPRESA DUPLICADA" },
      { keywords: ["subprocesso", "camunda", "modalidade em aberto"],  categoria: "SOI" },
      { keywords: ["botão", "botao", "permissão", "permissao", "keycloak"], categoria: "PERMISSÃO/BOTÃO" },
    ],
  },

  // Atlas: ainda sem planilha. Reutiliza as regras do Fly até ter padrões próprios.
  Atlas: {
    defaultCategoria: SEM_CATEGORIA,
    rules: null, // null = usa as regras do Fly
  },

  // Valoriza: benefícios e parceiros do App Vivo
  Valoriza: {
    defaultCategoria: "Valoriza — Geral",
    rules: [
      { keywords: ["como resgat", "como habilit", "como ativ", "caminho", "app vivo → benefícios"], categoria: "Dúvida de Resgate — App Vivo" },
      { keywords: ["chamado indevido", "nao se refere ao valoriza", "fila correta"],                 categoria: "Chamado Indevido — Redirecionamento" },
      { keywords: ["perplexity", "perplexity pro", "conta pausada", "cartão de crédito perplexity"], categoria: "Perplexity — Conta Pausada / Validação" },
      { keywords: ["perplexity", "descontinuado", "encerrado", "não está disponível"],               categoria: "Perplexity — Benefício Descontinuado" },
      { keywords: ["cinemark", "cpf cinemark"],                                                      categoria: "Cinemark — Problema com CPF/Voucher" },
      { keywords: ["voucher", "site parceiro", "carregamento de voucher"],                           categoria: "Site Parceiro — Falha no Voucher" },
      { keywords: ["vale bonus", "vale bônus", "saldo do bonus"],                                    categoria: "Vale Bônus — Validação com Terceiro" },
      { keywords: ["vivo easy"],                                                                     categoria: "Chamado Indevido — Vivo Easy" },
      { keywords: ["mve", "meu vivo empresa", "vivo empresa"],                                       categoria: "Chamado Indevido — MVE" },
      { keywords: ["clusterizado", "clusterizados", "elegibilidade", "grupo específico"],            categoria: "Benefício Clusterizado — Elegibilidade" },
      { keywords: ["esgotado", "esgotamento", "não está mais disponível", "sem estoque"],            categoria: "Benefício Esgotado" },
      { keywords: ["falta de informação", "mais detalhes", "envio de print", "evidências"],          categoria: "Chamado Incompleto — Falta de Evidência" },
      { keywords: ["data incorreta", "data da reward", "correção da data"],                          categoria: "Erro de Data na Descrição do Benefício" },
    ],
  },
};

// ── Aliases da tag "CATEGORIA:" → nome canônico (legenda do Fly) ────────────────
// Chave: texto normalizado (minúsculas, sem acento, sem pontuação, sem stopwords).
// Quando a tag contém mais de um alias, vence o MAIS LONGO (o mais específico):
// "rejeitar candidato soi" → REJEITAR (e não CANDIDATO nem SOI).
export const CATEGORY_ALIASES = {
  Fly: {
    // VENDOR
    "impossibilitando vendor":   "IMPOSSIBILITANDO VENDOR",
    "vendor impossibilitado":    "IMPOSSIBILITANDO VENDOR",
    "vendor bloqueado":          "IMPOSSIBILITANDO VENDOR",
    "grupo vendor":              "GRUPO VENDOR",
    "vendor grupo":              "GRUPO VENDOR",
    "cancelar vendor":           "CANCELAR VENDOR",
    "cancelamento vendor":       "CANCELAR VENDOR",
    "vendor cancelar":           "CANCELAR VENDOR",
    "cancelar acionamento":      "CANCELAR VENDOR",
    "acionamento":               "CANCELAR VENDOR",
    // CANDIDATO (inclui endereço e coordenadas, conforme a legenda)
    "candidato":                 "CANDIDATO",
    "editar endereco candidato": "CANDIDATO",
    "correcao coordenadas":      "CANDIDATO",
    "coordenadas candidato":     "CANDIDATO",
    "coordenadas":               "CANDIDATO",
    "mudanca candidato":         "CANDIDATO",
    "endereco":                  "CANDIDATO",
    "correcao endereco":         "CANDIDATO",
    "cep":                       "CANDIDATO",
    // ALTURA
    "altura":                    "ALTURA",
    "altitude":                  "ALTURA",
    // DISTRITO / MUNICÍPIO
    "distrito":                  "DISTRITO/MUNICÍPIO",
    "municipio":                 "DISTRITO/MUNICÍPIO",
    // STATUS SOI
    "status soi":                "STATUS SOI",
    "mudanca status soi":        "STATUS SOI",
    "alteracao status soi":      "STATUS SOI",
    "apenas mudanca status soi": "STATUS SOI",
    // CANCELAMENTOS
    "cancelar candidato":        "CANCELAR CANDIDATO",
    "cancelamento candidato":    "CANCELAR CANDIDATO",
    "cancelar soi":              "CANCELAR SOI",
    "cancelamento soi":          "CANCELAR SOI",
    "cancelar fcu":              "CANCELAR FCU",
    "cancelamento fcu":          "CANCELAR FCU",
    "fcu nula":                  "CANCELAR FCU",
    "fcu null":                  "CANCELAR FCU",
    // REGREDIR
    "regredir candidato":        "REGREDIR CANDIDATO",
    "regressao candidato":       "REGREDIR CANDIDATO",
    "regredir state":            "REGREDIR CANDIDATO",
    // NOME SOI
    "nome soi":                  "NOME SOI",
    "correcao nome soi":         "NOME SOI",
    "nome incorreto soi":        "NOME SOI",
    "uf sigla":                  "NOME SOI",
    // E-MAIL
    "email":                     "E-MAIL",
    "e mail":                    "E-MAIL",
    "anexar email":              "E-MAIL",
    "email fcu":                 "E-MAIL",
    // REJEITAR
    "rejeitar":                  "REJEITAR",
    "rejeicao candidato":        "REJEITAR",
    "rejeitar candidato":        "REJEITAR",
    "rejeicao":                  "REJEITAR",
    // DETENTORA
    "detentora":                 "DETENTORA",
    "id detentora":              "DETENTORA",
    "alteracao detentora":       "DETENTORA",
    // STAGE SCI
    "stage sci":                 "STAGE SCI",
    "alteracao stage sci":       "STAGE SCI",
    "alterar stage sci":         "STAGE SCI",
    "stage camunda":             "STAGE SCI",
    // VALOR FCU
    "valor fcu":                 "VALOR FCU",
    "valores fcu":               "VALOR FCU",
    "inserir valor fcu":         "VALOR FCU",
    "mudanca valor fcu":         "VALOR FCU",
    "alteracao valor fcu":       "VALOR FCU",
    // OMNI (deleção de linhas e correção de campos)
    "omni":                      "OMNI",
    "delecao omni":              "OMNI",
    "delecao linhas omni":       "OMNI",
    "deletar linhas omni":       "OMNI",
    "delecao linhas":            "OMNI",
    "deletar linha":             "OMNI",
    "deletar linhas":            "OMNI",
    "remover linha":             "OMNI",
    "delecao":                   "OMNI",
    // RELATÓRIO
    "relatorio":                 "RELATÓRIO",
    "mudanca dados processo":    "RELATÓRIO",
    "correcao dados processo":   "RELATÓRIO",
    // FALTA DE RETORNO
    "chamado sem resposta":      "FALTA DE RETORNO",
    "sem retorno":               "FALTA DE RETORNO",
    "falta retorno":             "FALTA DE RETORNO",
    // SCI e SOI genéricos (curtos — só vencem se nada mais específico bater)
    "definicao modalidade":      "SOI",
    "sci":                       "SCI",
    "soi":                       "SOI",
  },
  Valoriza: {},
};

// Tags que NÃO são categorias (nível de suporte, nome do sistema...).
// Quando a tag é uma destas, o chamado é classificado pelas palavras-chave.
const TAGS_IGNORADAS = new Set(["n1", "n2", "n3", "fly", "atlas", "valoriza"]);

// ── Descrição de cada categoria (aparece no detalhe do card) ───────────────────
export const CATEGORY_DESCRIPTIONS = {
  "IMPOSSIBILITANDO VENDOR": "Vendor está impossibilitado de ser lançado.",
  "GRUPO VENDOR":            "Grupo vendor não corresponde a nenhum no banco de dados.",
  "CANCELAR VENDOR":         "Solicitação de cancelar acionamento vendor.",
  "CANDIDATO":               "Mudança no candidato: editar endereço ou correção de coordenadas.",
  "ALTURA":                  "Altura ou altitude errada / inválida.",
  "DISTRITO/MUNICÍPIO":      "Distrito ou município ausente ou divergente.",
  "SOI":                     "Mudança da SOI no banco de dados.",
  "STATUS SOI":              "Apenas mudança de status da SOI.",
  "CANCELAR CANDIDATO":      "Cancelamento de candidato.",
  "REGREDIR CANDIDATO":      "Regressão de state de candidato.",
  "CANCELAR SOI":            "Cancelamento de SOI.",
  "NOME SOI":                "Correção da uf_sigla da SOI.",
  "E-MAIL":                  "Solicitação para anexar e-mail na FCU.",
  "REJEITAR":                "Rejeição de candidato.",
  "DETENTORA":               "Alteração de id_detentora.",
  "STAGE SCI":               "Alteração de stage da SCI e do processo no Camunda.",
  "OMNI":                    "Deleção de linhas e correção de campos no Omni.",
  "CANCELAR FCU":            "Mudar o valor da FCU para NULL ou cancelá-la.",
  "RELATÓRIO":               "Mudança de dados de processo na base.",
  "VALOR FCU":               "Inserção ou mudança de valores de FCU.",
  "SCI":                     "Qualquer mudança ou inserção de dados na SCI.",
  "CARACTERE ESPECIAL":      "Erro [object Object] por caractere especial ou quebra de linha.",
  "EMPRESA DUPLICADA":       "Empresa duplicada no VivoGo (unique query result).",
  "PERMISSÃO/BOTÃO":         "Botão não aparece ou usuário sem permissão.",
  "FALTA DE RETORNO":        "Chamado encerrado sem resposta do solicitante.",
  [SEM_CATEGORIA]:           "Chamados sem a tag CATEGORIA e sem palavra-chave conhecida.",
};

export function getCategoryDescription(categoria) {
  if (!categoria) return null;
  if (CATEGORY_DESCRIPTIONS[categoria]) return CATEGORY_DESCRIPTIONS[categoria];
  const upper = categoria.toUpperCase().trim();
  for (const [key, desc] of Object.entries(CATEGORY_DESCRIPTIONS)) {
    if (key.toUpperCase() === upper) return desc;
  }
  return null;
}

// ── Normalização de texto ──────────────────────────────────────────────────────

// Minúsculas, sem acento, sem pontuação e sem stopwords
export function normText(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(de|da|do|dos|das|em|para|com|no|na|o|a|e|um|uma)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Chave usada para casar o nome de uma análise publicada com o card do site,
// tolerando maiúsculas, acentos e descrição depois de ":".
export function normCatKey(nome) {
  return (nome || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[:;–—].*$/, "")
    .replace(/[^A-Z0-9\s/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Similaridade Sørensen-Dice entre duas strings (0 a 1)
function similaridade(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigramas = (s) => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.substring(i, i + 2);
      m.set(bg, (m.get(bg) || 0) + 1);
    }
    return m;
  };
  const A = bigramas(a), B = bigramas(b);
  let inter = 0, tA = 0, tB = 0;
  A.forEach((v) => (tA += v));
  B.forEach((v) => (tB += v));
  A.forEach((c, bg) => { if (B.has(bg)) inter += Math.min(c, B.get(bg)); });
  return (2 * inter) / (tA + tB);
}

const SIMILARITY_THRESHOLD = 0.82;

/**
 * Normaliza o texto de uma tag CATEGORIA para o nome canônico.
 * `registro` guarda as categorias novas já vistas NESTE carregamento, para
 * unificar variações parecidas. Precisa ser criado com criarRegistro() e
 * reaproveitado para todas as linhas da planilha, NA MESMA ORDEM.
 */
export function normalizarCategoria(categoriaRaw, mode, registro) {
  const aliases = CATEGORY_ALIASES[mode === "Atlas" ? "Fly" : mode] || {};

  // Usa só o nome base: "VALOR FCU: inserção de valores" → "VALOR FCU"
  const base = categoriaRaw.split(/[:;–—]|\s-\s/)[0].trim() || categoriaRaw.trim();
  const norm = normText(base);
  if (!norm) return null;

  // 1. Alias exato
  if (aliases[norm]) return aliases[norm];

  // 2. Alias contido na tag (palavras inteiras) — vence o mais longo
  const padded = ` ${norm} `;
  let melhor = null;
  for (const [key, canonical] of Object.entries(aliases)) {
    if (padded.includes(` ${key} `) && (!melhor || key.length > melhor.key.length)) {
      melhor = { key, canonical };
    }
  }
  if (melhor) return melhor.canonical;

  // 3. Parecida com uma categoria nova já vista neste carregamento
  for (const vista of registro) {
    if (similaridade(norm, vista.norm) >= SIMILARITY_THRESHOLD) return vista.canonical;
  }

  // 4. Categoria nova — registra e devolve em maiúsculas
  const canonical = base.toUpperCase();
  registro.push({ norm, canonical });
  return canonical;
}

export function criarRegistro() {
  return [];
}

/**
 * Classifica um comentário.
 * Prioridade: 1) tag CATEGORIA: válida → 2) palavra-chave → 3) categoria padrão
 */
export function classificarComentario(texto, mode, registro) {
  const cfg = CLASSIFIER_CONFIG[mode] || CLASSIFIER_CONFIG.Fly;
  const rules = cfg.rules || CLASSIFIER_CONFIG.Fly.rules;

  const tag = (texto || "").match(/CATEGORIA:\s*([^\n\r"]+)/i);
  if (tag && tag[1].trim().length > 1 && !TAGS_IGNORADAS.has(normText(tag[1]))) {
    const cat = normalizarCategoria(tag[1].trim(), mode, registro);
    if (cat) return cat;
  }

  const txt = (texto || "").toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((kw) => txt.includes(kw.toLowerCase()))) return rule.categoria;
  }
  return cfg.defaultCategoria;
}

/**
 * Converte os formatos de data das planilhas em Date (ou null).
 *   - Número serial do Excel (46189.59)
 *   - "16/06/2026 14:28:18" ou "16/06/2026"
 *   - ISO: "2026-06-16 14:28:18.123" ou "2026-06-16T14:28:18"
 */
export function parseDate(raw) {
  if (raw == null || raw === "") return null;
  const num = Number(raw);
  if (!isNaN(num) && num > 40000 && num < 55000) {
    const d = new Date((num - 25569) * 86400 * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(raw).trim();
  const br = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (br) {
    const [, dd, mm, yyyy, hh = "0", mi = "0", ss = "0"] = br;
    const d = new Date(+yyyy, +mm - 1, +dd, +hh, +mi, +ss);
    return isNaN(d.getTime()) ? null : d;
  }
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/);
  if (iso) {
    const [, yyyy, mm, dd, hh = "0", mi = "0", ss = "0"] = iso;
    const d = new Date(+yyyy, +mm - 1, +dd, +hh, +mi, +ss);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// ── Filtro por executor ────────────────────────────────────────────────────────
// A planilha do Fly tem a coluna "chamado_executor" (Zukk, Vivo, Minsait, Nenhum ou
// vazio). Só os chamados executados pela Zukk entram no site e na análise da IA:
// os demais são descartados ANTES de qualquer contagem ou classificação.
// Planilhas sem essa coluna (formato antigo, Valoriza) passam sem filtro.
export const EXECUTOR_ACEITO = "zukk";

// Posição de uma coluna pelo nome do cabeçalho (ignora maiúsculas, acentos e "_")
export function indiceColuna(cabecalho, nome) {
  const alvo = normText(nome);
  return (cabecalho || []).findIndex((h) => normText(h) === alvo);
}

/**
 * Recebe TODAS as linhas da planilha (com o cabeçalho na primeira) e devolve
 * { cabecalho, rows, ignorados } — rows já sem cabeçalho e só com executor Zukk.
 */
export function filtrarPorExecutor(values) {
  const [cabecalho = [], ...rows] = values || [];
  const col = indiceColuna(cabecalho, "chamado_executor");
  if (col === -1) return { cabecalho, rows, ignorados: 0 };
  const aceitos = rows.filter((r) => normText(r[col]) === EXECUTOR_ACEITO);
  return { cabecalho, rows: aceitos, ignorados: rows.length - aceitos.length };
}

/**
 * Classifica TODAS as linhas da planilha, na ordem em que aparecem.
 * O site e o script chamam esta mesma função, então o resultado é idêntico.
 *
 * @param rows  linhas da planilha SEM o cabeçalho (use filtrarPorExecutor antes)
 * @param opts  { mode, colDate, colComment, colId, colTitulo?, colPedido? }
 * @returns     [{ id, date, category, description, titulo, pedido }]
 */
export function classificarLinhas(rows, { mode, colDate = 0, colComment = 1, colId, colTitulo = -1, colPedido = -1 }) {
  const registro = criarRegistro();
  const tickets = [];
  rows.forEach((row, idx) => {
    const comentario = String(row[colComment] || "").trim();
    const date = parseDate(row[colDate]);
    if (!comentario || !date) return;
    const idReal = colId != null ? String(row[colId] || "").trim() : "";
    tickets.push({
      id:          idReal || `#${idx + 1}`,
      date,
      category:    classificarComentario(comentario, mode, registro),
      description: comentario,
      // O que o usuário pediu ao abrir o chamado (quando a planilha traz essas colunas)
      titulo:      colTitulo >= 0 ? String(row[colTitulo] || "").trim() : "",
      pedido:      colPedido >= 0 ? String(row[colPedido] || "").trim() : "",
    });
  });
  return tickets;
}
