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
// Fly: quando o comentário não tem a tag "CATEGORIA:", as regras são testadas
//   0) regras de CAUSA técnica (causa: true) no comentário de encerramento —
//      ex.: o título diz "falha ao abrir SCI", mas o analista achou a altitude;
//   1) no título e na descrição do chamado (o problema que o usuário relatou);
//   2) no comentário de encerramento (quando o título não diz o assunto);
//   3) regras genéricas por módulo (SCI/FCU, SOI, candidato);
//   4) encerrado sem retorno do solicitante;
// e só então o chamado fica SEM CATEGORIA. A palavra-chave casa com PALAVRAS
// inteiras (e o plural), sem diferenciar maiúsculas e acentos ("conecta" não
// pega "conectadas"; "distrito" pega "distritos"). Com "*" no fim, casa com o começo da palavra ("desvincul*"
// pega "desvinculado" e "desvínculo").
export const CLASSIFIER_CONFIG = {
  Fly: {
    defaultCategoria: SEM_CATEGORIA,
    porPalavra: true,
    rules: [
      { keywords: ["fractal", "airflow", "dag", "dags"],                                 categoria: "FRACTAL" },
      { keywords: ["conecta"],                                                           categoria: "CONECTA" },
      { keywords: ["omni", "rf projeto*", "historico rf"],                               categoria: "OMNI" },
      { keywords: ["vivo go", "vivogo"],                                                 categoria: "VIVO GO" },
      { keywords: ["rpa"],                                                               categoria: "RPA" },
      { keywords: ["desvincul*", "site declinado", "vinculo idmaster", "vinculo id master"], categoria: "ID MASTER" },
      { keywords: ["altitude", "decimal digit", "altura estrutura", "altura da estrutura"], categoria: "ALTURA", causa: true },
      { keywords: ["distrito", "municipio"],                                             categoria: "DISTRITO/MUNICÍPIO", causa: true },
      { keywords: ["[object object]", "object object", "<br>", "quebra de linha"],       categoria: "CARACTERE ESPECIAL", causa: true },
      { keywords: ["limite de caracteres", "limite do campo", "limite de campo", "limite de 100", "caracteres", "tamanho do campo", "tamanho de coluna", "value too long"], categoria: "LIMITE DE CAMPO", causa: true },
      { keywords: ["upload", "tamanho do arquivo", "limite de upload", "anexar documento*", "anexar arquivo*", "anexar o contrato", "anexar contrato", "nao consigo anexar", "erro ao anexar", "falha ao anexar"], categoria: "ANEXO/UPLOAD" },
      { keywords: ["unique query", "empresa duplicada"],                                 categoria: "EMPRESA DUPLICADA", causa: true },
      { keywords: ["criacao da empresa", "criacao de empresa", "criar empresa", "criar a empresa", "cadastro da empresa", "cadastrar empresa", "sharing criada", "nova sharing", "criacao da sharing"], categoria: "CRIAÇÃO DE EMPRESA" },
      { keywords: ["instabilidade", "jdbc", "fora do ar", "lentidao", "estouro de memoria", "indisponibilidade", "banco de homologacao", "conexoes no banco"], categoria: "INSTABILIDADE", causa: true },
      { keywords: ["botao", "botoes", "permissao", "keycloak", "perfil", "apropriar", "sem acesso", "liberar acesso", "solicitacao de acesso", "role"], categoria: "PERMISSÃO/BOTÃO" },
      { keywords: ["regress*", "regredir"],                                               categoria: "REGREDIR CANDIDATO" },
      { keywords: ["stage", "voltar etapa", "voltar a etapa", "voltar para etapa", "voltar para a etapa", "retornar etapa", "retornar a etapa", "retornar para a etapa", "retorno de etapa", "retorno da etapa", "votar etapa", "avancar etapa"], categoria: "STAGE SCI" },
      { keywords: ["fcu cancelad*", "fcus cancelad*", "cancelar fcu", "cancelar a fcu", "cancelar as fcu*", "cancelamento da fcu", "cancelamento das fcu*", "cancelamento de fcu*"], categoria: "CANCELAR FCU" },
      { keywords: ["candidato cancelad*", "cancelar candidato", "cancelar o candidato", "cancelamento do candidato", "cancelamento de candidato"], categoria: "CANCELAR CANDIDATO" },
      { keywords: ["soi cancelad*", "sois cancelad*", "cancelar soi", "cancelar a soi", "cancelamento da soi", "site cancelado", "cancelamento do site"], categoria: "CANCELAR SOI" },
      { keywords: ["cancelar acionamento", "cancelamento do acionamento", "cancelar vendor", "rejeicao manual"], categoria: "CANCELAR VENDOR" },
      { keywords: ["vendor", "acionamento"],                                             categoria: "VENDOR" },
      { keywords: ["rejeit*", "rejeic*"],                                                  categoria: "REJEITAR" },
      { keywords: ["feign", "abrir sci", "disparar sci", "abertura sci", "abertura de sci", "abertura da sci"], categoria: "SCI" },
      { keywords: ["detentora"],                                                         categoria: "DETENTORA" },
      { keywords: ["aluguel", "valor de locacao", "valor da locacao", "valor alterado", "valores alterados", "valor fcu", "valor da fcu"], categoria: "VALOR FCU" },
      { keywords: ["alteracao sigla", "alteracao da sigla", "alteracao de sigla", "alterar sigla", "alterar a sigla", "troca de sigla", "trocar sigla", "sigla erb", "siglalogica", "renomead*", "nome do site"], categoria: "NOME SOI" },
      { keywords: ["mapa", "coordenada*", "latitude", "longitude", "endereco", "cep"],   categoria: "CANDIDATO" },
      { keywords: ["mimo", "ponto de irradiacao", "pontos de irradiacao", "quantidade de antenas", "id centennial", "grupo aprovador", "cidade atualizada", "campo atualizado", "campos atualizados", "campos alterados", "campo alterado"], categoria: "ALTERAÇÃO DE CAMPO" },
      { keywords: ["soi state", "status da soi", "status soi", "state da soi"],          categoria: "STATUS SOI" },
      { keywords: ["subprocesso", "camunda", "modalidade"],                              categoria: "SOI" },
      { keywords: ["export*", "extracao", "extrair"],                                     categoria: "EXTRAÇÃO DE DADOS" },
    ],
    // Passo 3: só o módulo citado (quando nada mais específico bateu)
    regrasGenericas: [
      { keywords: ["sci", "fcu"],                                                        categoria: "SCI" },
      { keywords: ["soi"],                                                               categoria: "SOI" },
      { keywords: ["candidato"],                                                         categoria: "CANDIDATO" },
    ],
    // Passo 4: encerrado sem resposta / sem informação do solicitante
    regrasSemRetorno: [
      { keywords: ["falta de retorno", "falta de resposta", "nao retorno", "sem retorno", "prazo expirado", "ausencia de informac*", "falta de evidenc*", "falta de informac*", "nao houve retorno"], categoria: "FALTA DE RETORNO" },
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
    "impossibilitando vendor":   "VENDOR",
    "vendor impossibilitado":    "VENDOR",
    "vendor bloqueado":          "VENDOR",
    "grupo vendor":              "VENDOR",
    "vendor grupo":              "VENDOR",
    "cancelar vendor":           "CANCELAR VENDOR",
    "cancelamento vendor":       "CANCELAR VENDOR",
    "vendor cancelar":           "CANCELAR VENDOR",
    "cancelar acionamento":      "CANCELAR VENDOR",
    "acionamento":               "VENDOR",
    "vendor":                    "VENDOR",
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
    // Tags com nomes diferentes para a mesma coisa
    "vivo go":                   "VIVO GO",
    "vivogo":                    "VIVO GO",
    "correcao campo vivogo":     "VIVO GO",
    "stage":                     "STAGE SCI",
    "alterar stage":             "STAGE SCI",
    "alteracao stage":           "STAGE SCI",
    "state":                     "REGREDIR CANDIDATO",
    "regressao state":           "REGREDIR CANDIDATO",
    "editar":                    "PERMISSÃO/BOTÃO",
    "botao editar":              "PERMISSÃO/BOTÃO",
    "botao":                     "PERMISSÃO/BOTÃO",
    "permissao":                 "PERMISSÃO/BOTÃO",
    "correcao":                  "ALTERAÇÃO DE CAMPO",
    "alteracao campo":           "ALTERAÇÃO DE CAMPO",
    "alteracao id centennial":   "ALTERAÇÃO DE CAMPO",
    "id master":                 "ID MASTER",
    "idmaster":                  "ID MASTER",
    "desvinculo id master":      "ID MASTER",
    "site declinado":            "ID MASTER",
    "fractal":                   "FRACTAL",
    "conecta":                   "CONECTA",
    "rpa":                       "RPA",
    "instabilidade":             "INSTABILIDADE",
    "limite caracteres":         "LIMITE DE CAMPO",
    "limite campo":              "LIMITE DE CAMPO",
    "falta evidencia":           "FALTA DE RETORNO",
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
  "STAGE SCI":               "Voltar ou avançar o stage/etapa da SCI/FCU (e do processo no Camunda).",
  "OMNI":                    "Deleção de linhas e correção de campos no Omni.",
  "CANCELAR FCU":            "Mudar o valor da FCU para NULL ou cancelá-la.",
  "RELATÓRIO":               "Mudança de dados de processo na base.",
  "VALOR FCU":               "Inserção ou mudança de valores de FCU.",
  "SCI":                     "Qualquer mudança ou inserção de dados na SCI.",
  "SCI/FCU":                 "SCI e FCU: abertura, valores, cancelamento, stage, detentora e demais dados.",
  "CARACTERE ESPECIAL":      "Erro [object Object] por caractere especial ou quebra de linha.",
  "EMPRESA DUPLICADA":       "Empresa duplicada no VivoGo (unique query result).",
  "PERMISSÃO/BOTÃO":         "Botão não aparece ou usuário sem permissão.",
  "FALTA DE RETORNO":        "Chamado encerrado sem resposta ou sem as informações/evidências do solicitante.",
  "VENDOR":                  "Acionamento de vendor: disparo, grupo, sigla ou vendor impossibilitado.",
  "VIVO GO":                 "Falhas e correções no Vivo GO (consultas, tabela Master, exportações).",
  "FRACTAL":                 "Fractal: processamentos, cadastros e deploy das DAGs no Airflow.",
  "CONECTA":                 "Conecta: módulos de locação, processos e aquisição.",
  "ID MASTER":               "Site declinado: cancelar a SOI e desvincular o ID Master.",
  "LIMITE DE CAMPO":         "Texto maior que o limite de caracteres do campo.",
  "CRIAÇÃO DE EMPRESA":      "Criação de empresa/sharing no Fly.",
  "INSTABILIDADE":           "Instabilidade ou indisponibilidade do sistema (banco, serviços).",
  "RPA":                     "RPA parado ou com falha.",
  "ANEXO/UPLOAD":            "Falha ao anexar arquivos (tamanho acima do limite, formato).",
  "EXTRAÇÃO DE DADOS":       "Pedido de exportação ou extração de dados.",
  "ALTERAÇÃO DE CAMPO":      "Correção pontual de um campo na base (ex.: ID Centennial, quantidade de antenas).",
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

// Categorias que aparecem juntas no site e na análise (a IA separa em subtipos).
// As regras e tags continuam reconhecendo cada assunto; aqui só se junta o card.
export const CATEGORIAS_UNIFICADAS = {
  Fly: {
    "SCI":          "SCI/FCU",
    "VALOR FCU":    "SCI/FCU",
    "CANCELAR FCU": "SCI/FCU",
    "STAGE SCI":    "SCI/FCU",
    "DETENTORA":    "SCI/FCU",
    "E-MAIL":       "SCI/FCU",
  },
};

function unificar(categoria, mode) {
  const mapa = CATEGORIAS_UNIFICADAS[mode === "Atlas" ? "Fly" : mode] || {};
  return mapa[categoria] || categoria;
}

export function criarRegistro() {
  return [];
}

/**
 * Classifica um comentário.
 * Prioridade: 1) tag CATEGORIA: válida → 2) palavra-chave → 3) categoria padrão
 * `contexto` = { titulo, pedido } do chamado, usado quando o comentário não basta.
 */
export function classificarComentario(texto, mode, registro, contexto = {}) {
  return unificar(classificarSemUnificar(texto, mode, registro, contexto), mode);
}

function classificarSemUnificar(texto, mode, registro, contexto = {}) {
  const cfg = CLASSIFIER_CONFIG[mode] || CLASSIFIER_CONFIG.Fly;
  const rules = cfg.rules || CLASSIFIER_CONFIG.Fly.rules;

  const tag = (texto || "").match(/CATEGORIA:\s*([^\n\r"]+)/i);
  if (tag && tag[1].trim().length > 1 && !TAGS_IGNORADAS.has(normText(tag[1]))) {
    const cat = normalizarCategoria(tag[1].trim(), mode, registro);
    if (cat) return cat;
  }

  if (!cfg.porPalavra) {
    const txt = (texto || "").toLowerCase();
    for (const rule of rules) {
      if (rule.keywords.some((kw) => txt.includes(kw.toLowerCase()))) return rule.categoria;
    }
    return cfg.defaultCategoria;
  }

  const comentario = textoBusca(texto);
  const pedido     = textoBusca(contexto.titulo, contexto.pedido);
  return aplicarRegras(rules.filter((r) => r.causa), comentario)
      || aplicarRegras(rules, pedido)
      || aplicarRegras(rules, comentario)
      || aplicarRegras(cfg.regrasGenericas, comentario, pedido)
      || aplicarRegras(cfg.regrasSemRetorno, comentario)
      || cfg.defaultCategoria;
}

// Texto em minúsculas, sem acentos e sem pontuação, com espaço nas pontas
function textoBusca(...partes) {
  const t = partes.filter(Boolean).join(" ").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return { bruto: t, limpo: ` ${t.replace(/[^a-z0-9]+/g, " ").trim()} ` };
}

// Primeira regra cuja palavra-chave aparece no texto como palavra inteira
// (ou como começo de palavra, se terminar com "*"). Palavras-chave com
// símbolos (ex.: "<br>") são buscadas no texto original.
function aplicarRegras(regras, ...textos) {
  for (const rule of regras || []) {
    for (const kw of rule.keywords) {
      const prefixo = kw.endsWith("*");
      const k = (prefixo ? kw.slice(0, -1) : kw).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const simbolo = /[^a-z0-9\s]/.test(k);
      // palavra inteira aceita o plural ("distrito" pega "distritos")
      const alvo = prefixo ? ` ${k}` : null;
      const casa = (t) => (simbolo ? t.bruto.includes(k)
        : prefixo ? t.limpo.includes(alvo)
        : t.limpo.includes(` ${k} `) || t.limpo.includes(` ${k}s `) || t.limpo.includes(` ${k}es `));
      if (textos.some(casa)) return rule.categoria;
    }
  }
  return null;
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

// Chamados que ficam com executor Zukk no ITSM, mas que a Zukk só recebe e
// ENCAMINHA para outro time (ex.: desvínculo de ID Master, tratado pelo time do
// Bertelli). Se QUALQUER comentário do chamado tiver um destes trechos, o
// chamado inteiro é ignorado — igual a um chamado com executor Vivo.
// Para incluir outro time/serviço, basta acrescentar um trecho aqui.
// (Maiúsculas, acentos e palavras como "do"/"da" não importam.)
export const ENCAMINHADO_PARA_OUTRO_TIME = [
  "time do Bertelli",
  "equipe do Bertelli",
];

/**
 * Recebe TODAS as linhas da planilha (com o cabeçalho na primeira) e devolve
 * { cabecalho, rows, ignorados, encaminhados } — rows já sem cabeçalho, só com
 * executor Zukk e sem os chamados encaminhados para outro time.
 */
export function filtrarPorExecutor(values) {
  const [cabecalho = [], ...todas] = values || [];
  const colExec = indiceColuna(cabecalho, "chamado_executor");
  let rows = colExec === -1 ? todas : todas.filter((r) => normText(r[colExec]) === EXECUTOR_ACEITO);
  const ignoradosExecutor = todas.length - rows.length;

  const colId = indiceColuna(cabecalho, "chamado_id");
  const colCom = indiceColuna(cabecalho, "comentario");
  const trechos = ENCAMINHADO_PARA_OUTRO_TIME.map(normText).filter(Boolean);
  let encaminhados = 0;
  if (colId !== -1 && colCom !== -1 && trechos.length) {
    const idsFora = new Set(
      rows
        .filter((r) => { const t = normText(r[colCom]); return trechos.some((p) => t.includes(p)); })
        .map((r) => String(r[colId]).trim())
    );
    encaminhados = idsFora.size;
    if (encaminhados) rows = rows.filter((r) => !idsFora.has(String(r[colId]).trim()));
  }
  return { cabecalho, rows, ignorados: todas.length - rows.length, ignoradosExecutor, encaminhados };
}

/**
 * Subtipos da análise da IA com cada chamado em UM único subtipo.
 * Um chamado com vários comentários podia cair em mais de um subtipo; aqui ele
 * fica só no subtipo maior (o primeiro em que aparece, do maior para o menor).
 * Se `idsPermitidos` (Set) for passado, descarta IDs fora dele (ex.: fora do
 * período). Subtipos que ficam sem chamados são removidos.
 */
export function subtiposUnicos(subcategorias, idsPermitidos = null) {
  const limpa = (id) => String(id).replace("#", "").trim();
  const usados = new Set();
  return [...(subcategorias || [])]
    .map((s) => ({ ...s, ids: [...new Set((s.ids || []).map(limpa))] }))
    .sort((a, b) => b.ids.length - a.ids.length)
    .map((s) => {
      const ids = s.ids.filter((id) => !usados.has(id) && (!idsPermitidos || idsPermitidos.has(id)));
      ids.forEach((id) => usados.add(id));
      return { ...s, ids };
    })
    .filter((s) => s.ids.length > 0)
    .sort((a, b) => b.ids.length - a.ids.length);
}

/**
 * Classifica TODAS as linhas da planilha, na ordem em que aparecem.
 * O site e o script chamam esta mesma função, então o resultado é idêntico.
 *
 * @param rows  linhas da planilha SEM o cabeçalho (use filtrarPorExecutor antes)
 * @param opts  { mode, colDate, colComment, colId, colTitulo?, colPedido? }
 * @returns     [{ id, date, category, description, titulo, pedido, autor }]
 */
const idReal = (t) => !String(t.id).startsWith("#");

export function classificarLinhas(rows, { mode, colDate = 0, colComment = 1, colId, colTitulo = -1, colPedido = -1, colAutor = -1 }) {
  const registro = criarRegistro();
  const tickets = [];
  rows.forEach((row, idx) => {
    const comentario = String(row[colComment] || "").trim();
    const date = parseDate(row[colDate]);
    if (!comentario || !date) return;
    const idReal = colId != null ? String(row[colId] || "").trim() : "";
    // O que o usuário pediu ao abrir o chamado (quando a planilha traz essas colunas)
    const titulo = colTitulo >= 0 ? String(row[colTitulo] || "").trim() : "";
    const pedido = colPedido >= 0 ? String(row[colPedido] || "").trim() : "";
    tickets.push({
      id:          idReal || `#${idx + 1}`,
      date,
      category:    classificarComentario(comentario, mode, registro, { titulo, pedido }),
      description: comentario,
      titulo,
      pedido,
      // Quem escreveu o comentário (coluna comentario_autor, quando existir)
      autor:       colAutor >= 0 ? String(row[colAutor] || "").trim() : "",
    });
  });

  // Um chamado tem vários comentários (andamento, pedido de informação...).
  // Comentários que ficaram SEM CATEGORIA ou FALTA DE RETORNO herdam a categoria
  // do comentário mais recente desse mesmo chamado que tenha uma categoria real.
  const fracas = new Set([SEM_CATEGORIA, "FALTA DE RETORNO"]);
  const porChamado = new Map();
  tickets.forEach((t) => {
    if (!idReal(t) || fracas.has(t.category)) return;
    const atual = porChamado.get(t.id);
    if (!atual || t.date > atual.date) porChamado.set(t.id, t);
  });
  tickets.forEach((t) => {
    if (fracas.has(t.category) && porChamado.has(t.id)) t.category = porChamado.get(t.id).category;
  });
  return tickets;
}
