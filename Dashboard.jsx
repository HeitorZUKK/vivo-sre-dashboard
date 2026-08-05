import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Box, Flex, Heading, Text, Button, Select,
  Badge, Divider, Spinner, useColorModeValue,
  Tabs, TabList, Tab, TabPanels, TabPanel, Table, Thead, Tbody,
  Tr, Th, Td, HStack, VStack, Stat, StatLabel,
  StatNumber, StatHelpText, StatArrow, useToast, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  Alert, AlertIcon, AlertDescription, SimpleGrid, Card,
  CardHeader, CardBody, CardFooter,
  FormControl, FormLabel,
} from "@chakra-ui/react";
import Chart from "react-apexcharts";

// =============================================================================
// SEÇÃO 1 — CONFIGURAÇÃO
// Todas as constantes e variáveis de ambiente ficam aqui.
//
// ⚠️  SEGURANÇA: Nunca coloque chaves de API diretamente neste arquivo em
//     produção. Use um arquivo .env na raiz do projeto:
//
//       VITE_SHEETS_API_KEY=sua_chave_aqui
//       VITE_SPREADSHEET_ID=seu_id_aqui
//
//       # Fly / Atlas
//       VITE_GEMINI_API_KEY_FLY=sua_chave_fly
//       VITE_SHEET_NAME_FLY=resultado
//
//       # Valoriza
//       VITE_GEMINI_API_KEY_VALORIZA=sua_chave_valoriza
//       VITE_SHEET_NAME_VALORIZA=valoriza
//
//     Acesse com: import.meta.env.VITE_NOME_DA_VARIAVEL
// =============================================================================

const SHEETS_API_KEY = import.meta.env.VITE_SHEETS_API_KEY || "";

// Senha única de acesso ao dashboard. Configure VITE_ACCESS_PASSWORD no .env / Vercel.
// Se ficar vazia, o dashboard abre sem pedir senha (útil para desenvolvimento local).
const ACCESS_PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD || "";
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID || "1Ne5pMhMk0eXnZt9n6whQJi2BD9weUTo40INFHK5zUus";

// Configuração por modo — cada modo tem sua própria chave Gemini e aba da planilha
const MODE_CONFIG = {
  "Fly/Atlas": {
    geminiKey:  import.meta.env.VITE_GEMINI_API_KEY_FLY      || "",
    sheetName:  import.meta.env.VITE_SHEET_NAME_FLY          || "resultado",
    systems:    ["Fly", "Atlas"],
    label:      "Fly / Atlas",
    colDate:    0,  // coluna A — única coluna de data na planilha Fly/Atlas
    colComment: 1,  // coluna B — comentários
  },
  "Valoriza": {
    geminiKey:  import.meta.env.VITE_GEMINI_API_KEY_VALORIZA || "",
    sheetName:  import.meta.env.VITE_SHEET_NAME_VALORIZA     || "valoriza",
    systems:    ["Valoriza"],
    label:      "Valoriza",
    colDate:    5,  // coluna F — "Resolvido" (número serial do Excel)
    colComment: 7,  // coluna H — "Comentários" com PROBLEMA/AÇÃO/CATEGORIA
  },
};

// Modo padrão ao abrir o dashboard
const DEFAULT_MODE = "Fly/Atlas";

// Configurações de análise em lote (análise SRE de causas/sugestões)
// Análise em lote — agora processa 1 categoria por requisição (ver requestBulkAnalysis).
// Estas constantes ficaram obsoletas mas são mantidas para referência/ajuste futuro.
const BATCH_SIZE     = 1;      // categorias por requisição (1 = sem ambiguidade de matching)
const BATCH_DELAY_MS = 2_500;  // pausa entre requisições (ms) — respeita rate limit
const MAX_RETRIES    = 3;      // tentativas em caso de erro 429/503
const RETRY_DELAY_MS = 15_000; // espera base entre tentativas (ms)

// Paginação da tabela de chamados no modal
const TICKETS_PER_PAGE = 50;

// =============================================================================
// SEÇÃO 1B — DADOS DE MOCK PARA TESTES
// Usado quando o modo Mock está ativo — nenhuma chamada real é feita ao Gemini.
// Os dados abaixo simulam uma resposta realista da IA para validar o fluxo
// completo (cards, relatório, prioridades) sem gastar tokens.
//
// Para adicionar mais categorias mock, siga o padrão abaixo.
// =============================================================================

const MOCK_ANALYSES = {
  "Erro de Tipo: Alfabetivo em Campo Altitude (SOI)": {
    titulo:     "Campo Altitude com Valor Inválido",
    motivo:     "O campo altitude recebe valores alfabéticos pois não há validação de tipo no frontend antes do envio ao SOI. A ausência de máscara numérica permite que operadores insiram texto livremente, causando falha silenciosa no processamento.",
    sugestao:   "Implementar validação de tipo numérico no campo altitude no formulário Angular antes do submit. Adicionar regra de negócio no backend (Spring Boot) que rejeite e retorne erro 400 descritivo quando o valor não for um número decimal válido.",
    prioridade: "Alta",
  },
  "Bloqueio de Integração: FCU Duplicada ao Disparar SCI": {
    titulo:     "FCU Duplicada Bloqueia Abertura SCI",
    motivo:     "A integração via Feign Client não possui verificação de idempotência antes de acionar o SCI. Quando há retentativa automática por timeout, uma segunda FCU é criada, causando bloqueio por duplicidade na fila de processamento.",
    sugestao:   "Adicionar chave de idempotência (UUID por operação) nas chamadas Feign ao SCI. Implementar verificação prévia de FCU existente para o mesmo processo antes de criar uma nova, retornando a FCU já existente em vez de erro.",
    prioridade: "Alta",
  },
  "Violação de Regra BPM: Multiplas Modalidades na SOI": {
    titulo:     "Múltiplas Modalidades Ativas no Camunda",
    motivo:     "O subprocesso Camunda não valida exclusividade de modalidade antes de avançar o fluxo BPM. Operadores conseguem associar mais de uma modalidade à mesma SOI quando há delays de sincronização entre os nós do cluster.",
    sugestao:   "Adicionar gateway exclusivo (XOR) no fluxo Camunda que verifique modalidades ativas antes de prosseguir. Implementar lock otimista na tabela de modalidades para evitar race conditions em ambientes distribuídos.",
    prioridade: "Média",
  },
  "Divergência Cadastral: Distrito/Município ausente no Science": {
    titulo:     "Distrito ou Município Não Sincronizado",
    motivo:     "A base cadastral do Science não está sincronizada com a base de referência geográfica da Vivo. Novos municípios ou alterações de distrito não são propagados automaticamente, causando divergência em validações de endereço.",
    sugestao:   "Criar job de sincronização periódica (diário) entre a base geográfica IBGE e o Science. Adicionar alerta automático quando um distrito/município não encontrado for tentado mais de 3 vezes no mesmo dia.",
    prioridade: "Média",
  },
  "Suporte Operacional Técnico Geral": {
    titulo:     "Chamados Operacionais Sem Padrão",
    motivo:     "Chamados variados sem categoria técnica específica, indicando lacuna na cobertura das regras de classificação atuais ou ocorrências pontuais que não se repetem com frequência suficiente para formar um padrão.",
    sugestao:   "Revisar mensalmente os chamados desta categoria para identificar novos padrões emergentes. Considerar ampliar as regras de keyword para cobrir termos recorrentes encontrados neste grupo.",
    prioridade: "Baixa",
  },
};

/**
 * Simula a resposta do Gemini sem fazer chamada à API.
 * Retorna análises mock para as categorias recebidas.
 * Categorias sem mock específico recebem uma análise genérica.
 */
async function callGeminiMock(categories) {
  // Simula latência de rede (800ms a 1.5s por categoria)
  await new Promise((r) => setTimeout(r, 800 + categories.length * 200));

  const result = {};
  categories.forEach((cat) => {
    result[cat.name] = MOCK_ANALYSES[cat.name] || {
      titulo:     `Análise Mock — ${cat.name.substring(0, 30)}`,
      motivo:     `[MOCK] Esta categoria teve ${cat.total} chamados no período selecionado. Em modo mock, nenhuma chamada real foi feita ao Gemini. A causa raiz real seria analisada pela IA com base nas amostras de texto dos chamados.`,
      sugestao:   `[MOCK] Sugestão simulada para "${cat.name.substring(0, 40)}…". Ative o modo real desligando o Mock no header para obter sugestões reais do Gemini.`,
      prioridade: cat.total > 10 ? "Alta" : cat.total > 3 ? "Média" : "Baixa",
    };
  });
  return result;
}
// =============================================================================
// SEÇÃO 2 — CLASSIFICAÇÃO DE CHAMADOS
//
// Cada modo tem suas próprias regras de keyword e sistema padrão.
// Novos modos podem ser adicionados criando uma entrada em CLASSIFIER_CONFIG.
//
// COMO ADICIONAR UMA NOVA REGRA:
//   1. Localize o array "rules" do modo correto abaixo.
//   2. Adicione um objeto { keywords, sistema, categoria }.
//   3. A ordem importa — a primeira regra que bater vence.
//   4. Se uma categoria nova surgir com o tempo, basta adicionar aqui.
// =============================================================================

const CLASSIFIER_CONFIG = {
  // ── Fly / Atlas — erros técnicos de infraestrutura ──────────────────────────
  "Fly/Atlas": {
    detectSistema: (txt) => txt.includes("atlas") ? "Atlas" : "Fly",
    defaultCategoria: "Suporte Operacional Técnico Geral",
    rules: [
      { keywords: ["altitude", "decimal digit"],              sistema: null,    categoria: "Erro de Tipo: Alfabetivo em Campo Altitude (SOI)"           },
      { keywords: ["altura estrutura", "virgula", "vírgula"], sistema: null,    categoria: "Erro de Sintaxe: Vírgula em Altura Estrutura (SOI)"          },
      { keywords: ["distrito", "municipio", "município"],     sistema: null,    categoria: "Divergência Cadastral: Distrito/Município ausente no Science" },
      { keywords: ["object object", "<br>", "quebra de linha"],sistema: null,   categoria: "Falha de Renderização: Caractere Especial no Endereço"        },
      { keywords: ["mapa", "coordenadas", "latitude", "longitude"], sistema: null, categoria: "Erro de Indentação: Coordenada Positiva no Mapa"           },
      { keywords: ["feign", "feignexception", "abrir sci"],   sistema: null,    categoria: "Bloqueio de Integração: FCU Duplicada ao Disparar SCI"        },
      { keywords: ["unique query", "empresa duplicada"],      sistema: null,    categoria: "Duplicidade de Registro: Empresa Duplicada no VivoGo"         },
      { keywords: ["subprocesso", "camunda", "modalidade em aberto"], sistema: null, categoria: "Violação de Regra BPM: Multiplas Modalidades na SOI"     },
      { keywords: ["botão", "permissão", "keycloak"],         sistema: null,    categoria: "Falha de Atribuição: Grupo Designado no Camunda Workflow"     },
      { keywords: ["atlas"],                                  sistema: "Atlas", categoria: "Suporte Atlas Geral"                                         },
    ],
  },

  // ── Valoriza — benefícios e parceiros do App Vivo ───────────────────────────
  // Categorias baseadas nos chamados reais do sistema Valoriza.
  // Quando novas categorias surgirem, adicione novas regras aqui.
  "Valoriza": {
    detectSistema: () => "Valoriza", // Valoriza é sistema único — sem subdivisão
    defaultCategoria: "Valoriza — Geral",
    rules: [
      // Resgate e navegação no App Vivo
      { keywords: ["como resgat", "como habilit", "como ativ", "caminho", "app vivo → benefícios"], sistema: "Valoriza", categoria: "Dúvida de Resgate — App Vivo"              },
      { keywords: ["chamado indevido", "nao se refere ao valoriza", "fila correta"],                 sistema: "Valoriza", categoria: "Chamado Indevido — Redirecionamento"         },
      // Perplexity
      { keywords: ["perplexity", "perplexity pro", "conta pausada", "cartão de crédito perplexity"], sistema: "Valoriza", categoria: "Perplexity — Conta Pausada / Validação"    },
      { keywords: ["perplexity", "descontinuado", "encerrado", "não está disponível"],               sistema: "Valoriza", categoria: "Perplexity — Benefício Descontinuado"       },
      // Cinemark e parceiros
      { keywords: ["cinemark", "cpf cinemark"],                                                      sistema: "Valoriza", categoria: "Cinemark — Problema com CPF/Voucher"        },
      { keywords: ["voucher", "site parceiro", "carregamento de voucher"],                           sistema: "Valoriza", categoria: "Site Parceiro — Falha no Voucher"            },
      // Vale Bônus
      { keywords: ["vale bonus", "vale bônus", "saldo do bonus"],                                    sistema: "Valoriza", categoria: "Vale Bônus — Validação com Terceiro"        },
      // Vivo Easy / MVE
      { keywords: ["vivo easy"],                                                                     sistema: "Valoriza", categoria: "Chamado Indevido — Vivo Easy"               },
      { keywords: ["mve", "meu vivo empresa", "vivo empresa"],                                       sistema: "Valoriza", categoria: "Chamado Indevido — MVE"                     },
      // Benefícios
      { keywords: ["clusterizado", "clusterizados", "elegibilidade", "grupo específico"],            sistema: "Valoriza", categoria: "Benefício Clusterizado — Elegibilidade"     },
      { keywords: ["esgotado", "esgotamento", "não está mais disponível", "sem estoque"],            sistema: "Valoriza", categoria: "Benefício Esgotado"                         },
      { keywords: ["falta de informação", "mais detalhes", "envio de print", "evidências"],          sistema: "Valoriza", categoria: "Chamado Incompleto — Falta de Evidência"    },
      { keywords: ["data incorreta", "data da reward", "correção da data"],                          sistema: "Valoriza", categoria: "Erro de Data na Descrição do Benefício"     },
    ],
  },
};

/**
 * Classifica um comentário de chamado para o modo especificado.
 * Prioridade: 1) tag CATEGORIA: explícita → 2) keyword → 3) default do modo
 *
 * @param {string} texto  - Texto do comentário
 * @param {string} mode   - "Fly/Atlas" | "Valoriza"
 * @returns {{ sistema: string, categoria: string }}
 */
function classificarComentario(texto, mode) {
  const cfg = CLASSIFIER_CONFIG[mode] || CLASSIFIER_CONFIG["Fly/Atlas"];
  const txt = (texto || "").toLowerCase();
  const sistema = cfg.detectSistema(txt);

  // Prioridade 1: tag explícita CATEGORIA: no texto
  const catMatch = texto.match(/CATEGORIA:\s*([^\n\r"]+)/i);
  if (catMatch && catMatch[1].trim().length > 1) {
    const categoriaRaw = catMatch[1].trim();
    // Normaliza para evitar duplicatas por variação de escrita
    const categoriaNorm = normalizarCategoria(categoriaRaw, mode);
    return { sistema, categoria: categoriaNorm };
  }

  // Prioridade 2: primeira regra de keyword que bater
  for (const rule of cfg.rules) {
    if (rule.keywords.some((kw) => txt.includes(kw.toLowerCase()))) {
      return { sistema: rule.sistema ?? sistema, categoria: rule.categoria };
    }
  }

  // Prioridade 3: categoria padrão do modo
  return { sistema, categoria: cfg.defaultCategoria };
}

// =============================================================================
// SEÇÃO 2B — NORMALIZAÇÃO DE CATEGORIAS
//
// Unifica variações de escrita em um nome canônico único.
// Isso evita que "Deleção de Linhas", "Deleção de linhas" e
// "Deleção linhas OMNI" virem três categorias separadas.
//
// COMO FUNCIONA:
//   1. Tenta casar com os ALIASES explícitos (mapeamento exato após normalização)
//   2. Se não casar, aplica normalização automática de texto
//
// COMO ADICIONAR UMA NOVA CATEGORIA:
//   Adicione uma entrada em CATEGORY_ALIASES abaixo.
//   A chave é o texto normalizado (minúsculas, sem acento, sem pontuação).
//   O valor é o nome canônico que aparecerá no dashboard.
// =============================================================================

// Remove acentos, pontuação e converte para minúsculas
function normText(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s]/g, " ")                    // remove pontuação
    .replace(/\b(de|da|do|dos|das|em|para|com|no|na|o|a|e|um|uma)\b/g, "") // stopwords
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Mapa de aliases por modo.
 * Chave: texto normalizado (via normText) de qualquer variação conhecida.
 * Valor: nome canônico que aparece no dashboard.
 *
 * Para Fly/Atlas, os nomes canônicos seguem a legenda fornecida.
 * Novas categorias que surgirem podem ser adicionadas aqui.
 */
const CATEGORY_ALIASES = {
  "Fly/Atlas": {
    // VENDOR
    "impossibilitando vendor":    "IMPOSSIBILITANDO VENDOR",
    "vendor impossibilitado":     "IMPOSSIBILITANDO VENDOR",
    "vendor bloqueado":           "IMPOSSIBILITANDO VENDOR",
    "grupo vendor":               "GRUPO VENDOR",
    "vendor grupo":               "GRUPO VENDOR",
    "cancelar vendor":            "CANCELAR VENDOR",
    "cancelamento vendor":        "CANCELAR VENDOR",
    "vendor cancelar":            "CANCELAR VENDOR",
    // CANDIDATO
    "candidato":                  "CANDIDATO",
    "editar endereco candidato":  "CANDIDATO",
    "correcao coordenadas":       "CANDIDATO",
    "coordenadas candidato":      "CANDIDATO",
    "mudanca candidato":          "CANDIDATO",
    // ALTURA
    "altura":                     "ALTURA",
    "altura errada":              "ALTURA",
    "altura incorreta":           "ALTURA",
    "altura estrutura":           "ALTURA",
    // STATUS SOI
    "status soi":                 "STATUS SOI",
    "mudanca status soi":         "STATUS SOI",
    "alteracao status soi":       "STATUS SOI",
    "status da soi":              "STATUS SOI",
    // CANCELAMENTOS
    "cancelar candidato":         "CANCELAR CANDIDATO",
    "cancelamento candidato":     "CANCELAR CANDIDATO",
    "cancelar soi":               "CANCELAR SOI",
    "cancelamento soi":           "CANCELAR SOI",
    "cancelar fcu":               "CANCELAR FCU",
    "cancelamento fcu":           "CANCELAR FCU",
    "fcu nula":                   "CANCELAR FCU",
    "fcu null":                   "CANCELAR FCU",
    // REGREDIR
    "regredir candidato":         "REGREDIR CANDIDATO",
    "regressao candidato":        "REGREDIR CANDIDATO",
    "regredir state":             "REGREDIR CANDIDATO",
    // NOME SOI
    "nome soi":                   "NOME SOI",
    "correcao nome soi":          "NOME SOI",
    "nome incorreto soi":         "NOME SOI",
    // E-MAIL
    "email":                      "E-MAIL",
    "e mail":                     "E-MAIL",
    "anexar email":               "E-MAIL",
    "email fcu":                  "E-MAIL",
    // REJEITAR
    "rejeitar":                   "REJEITAR",
    "rejeicao candidato":         "REJEITAR",
    "rejeitar candidato":         "REJEITAR",
    // DETENTORA
    "detentora":                  "DETENTORA",
    "id detentora":               "DETENTORA",
    "alteracao detentora":        "DETENTORA",
    // STAGE SCI (específico — antes de SCI genérico)
    "stage sci":                  "STAGE SCI",
    "alteracao stage sci":        "STAGE SCI",
    "stage camunda":              "STAGE SCI",
    "stage da sci":               "STAGE SCI",
    // VALOR FCU (específico — antes de CANCELAR FCU e FCU genérico)
    "valor fcu":                  "VALOR FCU",
    "valores fcu":                "VALOR FCU",
    "inserir valor fcu":          "VALOR FCU",
    "mudanca valor fcu":          "VALOR FCU",
    "alteracao valor fcu":        "VALOR FCU",
    // DELEÇÃO OMNI
    "delecao omni":               "DELEÇÃO OMNI",
    "delecao linhas omni":        "DELEÇÃO OMNI",
    "deletar linhas omni":        "DELEÇÃO OMNI",
    "deleção omni":               "DELEÇÃO OMNI",
    "delecao linhas":             "DELEÇÃO OMNI",
    "deleção linhas":             "DELEÇÃO OMNI",
    "deletar linha":              "DELEÇÃO OMNI",
    "deletar linhas":             "DELEÇÃO OMNI",
    "remover linha":              "DELEÇÃO OMNI",
    // RELATÓRIO
    "relatorio":                  "RELATÓRIO",
    "mudanca dados processo":     "RELATÓRIO",
    "correcao dados processo":    "RELATÓRIO",
    // SCI genérico (por último — só bate se não caiu em STAGE SCI/VALOR FCU acima)
    "sci":                        "SCI",
    "mudanca sci":                "SCI",
    "insercao sci":               "SCI",
    "dados sci":                  "SCI",
    // SOI genérico (por último — só bate se não caiu em STATUS/NOME/CANCELAR SOI)
    "soi":                        "SOI",
    "mudanca soi":                "SOI",
    "soi banco":                  "SOI",
  },
  "Valoriza": {}, // Valoriza usa keywords — adicionar aliases aqui se necessário
};

/**
 * Normaliza uma categoria para seu nome canônico.
 * Se não encontrar alias, aplica capitalização padronizada.
 *
 * @param {string} categoria - Texto bruto da categoria (vindo da tag CATEGORIA:)
 * @param {string} mode      - "Fly/Atlas" | "Valoriza"
 * @returns {string}         - Nome canônico padronizado
 */
// Registro de categorias canônicas já vistas nesta sessão de carregamento.
// Usado para unificar variações não mapeadas via similaridade textual.
let _canonicasVistas = [];

// Reseta o registro — chamado no início de cada carregamento de planilha
function resetCanonicas() {
  _canonicasVistas = [];
}

/**
 * Calcula similaridade entre duas strings normalizadas (0 a 1).
 * Usa coeficiente de Sørensen-Dice sobre bigramas — rápido e sem dependências.
 */
function similaridade(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramas = (s) => {
    const pares = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.substring(i, i + 2);
      pares.set(bg, (pares.get(bg) || 0) + 1);
    }
    return pares;
  };

  const mapA = bigramas(a);
  const mapB = bigramas(b);
  let intersecao = 0;
  let totalA = 0, totalB = 0;

  mapA.forEach((v) => (totalA += v));
  mapB.forEach((v) => (totalB += v));
  mapA.forEach((count, bg) => {
    if (mapB.has(bg)) intersecao += Math.min(count, mapB.get(bg));
  });

  return (2 * intersecao) / (totalA + totalB);
}

// Limiar de similaridade para unificar categorias (0.82 = bastante parecidas)
const SIMILARITY_THRESHOLD = 0.82;

function normalizarCategoria(categoria, mode) {
  const aliases = CATEGORY_ALIASES[mode] || {};
  const norm    = normText(categoria);

  // 1. Busca exata no mapa de aliases
  if (aliases[norm]) return aliases[norm];

  // 2. Busca parcial nos aliases mapeados
  for (const [key, canonical] of Object.entries(aliases)) {
    if (norm.includes(key) || key.includes(norm)) return canonical;
  }

  // 3. Similaridade fuzzy com categorias canônicas já vistas nesta sessão
  //    Unifica variações não mapeadas (ex: "Deleção linha" ≈ "Deleção de linhas")
  for (const vista of _canonicasVistas) {
    if (similaridade(norm, vista.norm) >= SIMILARITY_THRESHOLD) {
      return vista.canonical;
    }
  }

  // 4. Nova categoria — registra e devolve padronizada em maiúsculas
  const canonical = categoria.trim().toUpperCase();
  _canonicasVistas.push({ norm, canonical });
  return canonical;
}

/**
 * Extrai um detalhe específico do texto do chamado para exibir como subtítulo no card.
 * Busca por padrões comuns: números de SOI, FCU, SCI, nomes, IDs.
 *
 * @param {string} texto    - Texto completo do comentário
 * @param {string} categoria - Categoria canônica do chamado
 * @returns {string|null}   - Detalhe extraído ou null se não encontrar
 */
function extrairDetalhe(texto, categoria) {
  if (!texto) return null;
  const txt = texto.toUpperCase();

  // Número de SOI (ex: SOI-12345 ou SOI 12345)
  const soiMatch = txt.match(/SOI[\s\-#]?(\d{4,})/);
  if (soiMatch) return `SOI ${soiMatch[1]}`;

  // Número de FCU
  const fcuMatch = txt.match(/FCU[\s\-#]?(\d{4,})/);
  if (fcuMatch) return `FCU ${fcuMatch[1]}`;

  // Número de SCI
  const sciMatch = txt.match(/SCI[\s\-#]?(\d{4,})/);
  if (sciMatch) return `SCI ${sciMatch[1]}`;

  // ID de processo/incidente (ex: INC1234567)
  const incMatch = txt.match(/\b(INC\d{5,})\b/);
  if (incMatch) return incMatch[1];

  // Número de linha telefônica (11 dígitos começando com 0 ou 9)
  const lineMatch = texto.match(/\b(\d{10,11})\b/);
  if (lineMatch) return `Linha ${lineMatch[1]}`;

  return null;
}

// =============================================================================
// SEÇÃO 2C — DESCRIÇÃO E SUBGRUPOS DE CATEGORIAS
//
// Descrição: texto fixo explicando o que cada categoria engloba (legenda).
// Subgrupos: o sistema deduz automaticamente pelas palavras do texto,
//            agrupando chamados semelhantes dentro da mesma categoria.
// Tudo sem IA — dedução puramente textual, sem custo de tokens.
// =============================================================================

// Descrição de cada categoria — aparece no topo do card ao abrir os detalhes.
// A chave é o nome canônico da categoria. Adicione novas conforme necessário.
const CATEGORY_DESCRIPTIONS = {
  "IMPOSSIBILITANDO VENDOR":  "Vendor está impossibilitado de ser lançado.",
  "GRUPO VENDOR":             "Grupo vendor não corresponde a nenhum no banco de dados.",
  "CANCELAR VENDOR":          "Solicitação de cancelar acionamento vendor.",
  "CANDIDATO":                "Problemas relacionados a mudança no candidato: editar endereço ou correção de coordenadas.",
  "ALTURA":                   "Problemas relacionados a altura errada.",
  "SOI":                      "Mudança da SOI no banco de dados.",
  "STATUS SOI":               "Apenas mudança de Status da SOI.",
  "CANCELAR CANDIDATO":       "Cancelamento de Candidato.",
  "REGREDIR CANDIDATO":       "Regressão de state de Candidato.",
  "CANCELAR SOI":             "Cancelamento de SOI.",
  "NOME SOI":                 "Correção da uf_sigla da SOI.",
  "E-MAIL":                   "Solicitação para anexar e-mail na FCU.",
  "REJEITAR":                 "Rejeição de Candidato.",
  "DETENTORA":                "Alteração de id_detentora.",
  "STAGE SCI":                "Alteração de Stage da SCI e o processo no Camunda.",
  "DELEÇÃO OMNI":             "Chamados de deleção de linhas do Omni.",
  "CANCELAR FCU":             "Mudar o valor da FCU para NULL ou cancelá-la.",
  "RELATÓRIO":                "Mudança de dados de processo na base.",
  "VALOR FCU":                "Inserção ou mudança de valores de FCU.",
  "SCI":                      "Campo relacionado a qualquer mudança/inserção de dados na SCI.",
};

/**
 * Retorna a descrição da categoria, ou null se não houver.
 */
function getCategoryDescription(categoria) {
  if (!categoria) return null;
  // Busca exata
  if (CATEGORY_DESCRIPTIONS[categoria]) return CATEGORY_DESCRIPTIONS[categoria];

  const upper = categoria.toUpperCase().trim();

  // Busca exata case-insensitive
  for (const [key, desc] of Object.entries(CATEGORY_DESCRIPTIONS)) {
    if (key.toUpperCase() === upper) return desc;
  }

  // Busca parcial rigorosa: a categoria precisa COMEÇAR com o nome canônico
  // ou o nome canônico precisa começar com a categoria (evita casar só por "SOI" no meio)
  for (const [key, desc] of Object.entries(CATEGORY_DESCRIPTIONS)) {
    const k = key.toUpperCase();
    if (upper.startsWith(k) || k.startsWith(upper)) return desc;
  }

  return null;
}

// Palavras-chave que definem a AÇÃO de um chamado, usadas para deduzir subgrupos.
// Cada entrada: { match: [palavras], label: "Nome do subgrupo" }
const SUBGROUP_RULES = [
  { match: ["cancelar", "cancelamento", "cancelad"],       label: "Cancelamento"          },
  { match: ["inserir", "insercao", "inclusao", "adicionar", "incluir"], label: "Inserção de dados" },
  { match: ["corrigir", "correcao", "corrigid", "ajustar", "ajuste"],   label: "Correção"          },
  { match: ["alterar", "alteracao", "mudar", "mudanca", "modificar"],   label: "Alteração"         },
  { match: ["deletar", "delecao", "remover", "remocao", "excluir"],     label: "Deleção"           },
  { match: ["regredir", "regressao", "voltar state", "retornar"],       label: "Regressão de state" },
  { match: ["rejeitar", "rejeicao", "recusar"],            label: "Rejeição"              },
  { match: ["stage", "state", "status", "etapa"],          label: "Mudança de Stage/Status" },
  { match: ["anexar", "anexo", "email", "e-mail"],         label: "Anexo/E-mail"          },
  { match: ["nome", "renomear"],                           label: "Correção de nome"      },
  { match: ["endereco", "coordenada", "latitude", "longitude"], label: "Endereço/Coordenadas" },
];

/**
 * Deduz o subgrupo de um chamado a partir do texto (sem IA).
 * @returns {string} label do subgrupo, ou "Outros" se nada bater.
 */
function deduzirSubgrupo(texto) {
  const txt = (texto || "").toLowerCase();
  for (const rule of SUBGROUP_RULES) {
    if (rule.match.some((kw) => txt.includes(kw))) return rule.label;
  }
  return "Outros";
}

/**
 * Agrupa os tickets de uma categoria em subgrupos e conta cada um.
 * @param {Array} tickets
 * @returns {Array<{ label, count, pct }>} ordenado do maior para o menor
 */
function calcularSubgrupos(tickets) {
  const freq = {};
  tickets.forEach((t) => {
    const sub = deduzirSubgrupo(t.description);
    freq[sub] = (freq[sub] || 0) + 1;
  });
  const total = tickets.length || 1;
  return Object.entries(freq)
    .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

// =============================================================================
// Busca todos os dados da planilha.
// Os gráficos usam o histórico completo.
// A IA usa apenas o período selecionado pelo filtro — controlado em tempo real.
// =============================================================================

/**
 * Busca os dados da planilha para o modo selecionado.
 * Usa a aba e o classificador corretos para cada modo.
 * @param {string} mode - "Fly/Atlas" | "Valoriza"
 */
async function fetchSheetData(mode) {
  if (!SHEETS_API_KEY || !SPREADSHEET_ID) {
    throw new Error(
      "Variáveis de ambiente não configuradas. " +
      "Crie um arquivo .env com VITE_SHEETS_API_KEY e VITE_SPREADSHEET_ID."
    );
  }

  const cfg       = MODE_CONFIG[mode] || MODE_CONFIG[DEFAULT_MODE];
  const sheetName = cfg.sheetName;
  const colDate   = cfg.colDate   ?? 0;
  const colComment = cfg.colComment ?? 1;

  // Limpa o registro de categorias canônicas para este carregamento
  resetCanonicas();

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `/values/${encodeURIComponent(sheetName)}?key=${SHEETS_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  const rows = (json.values || []).slice(1);
  const data = {};

  rows.forEach((row, idx) => {
    const rawDate    = row[colDate];
    const comentario = String(row[colComment] || "").trim();
    if (!rawDate || !comentario) return;

    // Suporta dois formatos de data:
    // 1. Número serial do Excel (ex: 46189.59) — usado pelo Valoriza
    // 2. String de data legível (ex: "16/06/2026 14:28:18") — usado pelo Fly/Atlas
    const date = parseDate(rawDate);
    if (!date) return;

    // Classifica usando as regras do modo ativo
    const { sistema, categoria } = classificarComentario(comentario, mode);
    const detalhe = extrairDetalhe(comentario, categoria);
    const ticket  = { id: `#${idx + 1}`, date, system: sistema, category: categoria, detalhe, description: comentario };

    if (!data[sistema])            data[sistema] = {};
    if (!data[sistema][categoria]) data[sistema][categoria] = { tickets: [] };
    data[sistema][categoria].tickets.push(ticket);
  });

  return data;
}

/**
 * Converte qualquer formato de data suportado pelas planilhas para um objeto Date.
 * Retorna null se não conseguir converter.
 *
 * Formatos suportados:
 *   - Número serial do Excel: 46189.59 (dias desde 30/12/1899)
 *   - String de data BR: "16/06/2026 14:28:18" ou "16/06/2026"
 *   - String ISO: "2026-06-16T14:28:18"
 */
function parseDate(raw) {
  if (!raw) return null;

  const num = Number(raw);

  // Número serial do Excel (valores típicos entre 40000 e 50000 = anos 2009–2036)
  if (!isNaN(num) && num > 40000 && num < 55000) {
    // Fórmula: dias desde 30/12/1899, com correção do bug do ano 1900 do Excel
    const ms = (num - 25569) * 86400 * 1000;
    const d  = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // Tenta string no formato BR "dd/mm/yyyy hh:mm:ss" ou "dd/mm/yyyy"
  const str = String(raw).trim();
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (brMatch) {
    const [, dd, mm, yyyy, hh = "0", mi = "0", ss = "0"] = brMatch;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), Number(ss));
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback: tenta parse nativo (ISO, etc.)
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// =============================================================================
// SEÇÃO 4 — GEMINI API
// Análise SRE: envia categorias e retorna causa raiz, sugestão e prioridade.
// =============================================================================

// gemini-flash-latest é um alias que sempre aponta para a versão Flash mais
// recente disponível — evita quebrar quando o Google descontinua modelos antigos.
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

// ── Helper de retry ───────────────────────────────────────────────────────────

/**
 * Faz uma chamada ao Gemini usando a chave específica do modo ativo.
 * @param {string} promptText
 * @param {string} geminiKey  - chave da API do modo (Fly/Atlas ou Valoriza)
 */
async function callGemini(promptText, geminiKey) {
  if (!geminiKey) {
    throw new Error(
      "Chave Gemini não configurada para este modo. " +
      "Verifique VITE_GEMINI_API_KEY_FLY ou VITE_GEMINI_API_KEY_VALORIZA no .env."
    );
  }

  const body = JSON.stringify({
    contents: [{ parts: [{ text: promptText }] }],
    // 4096 dá folga suficiente para a resposta não ser cortada no meio.
    // Respostas truncadas geravam JSON inválido e análises vazias.
    generationConfig: { maxOutputTokens: 4096, temperature: 0.4 },
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(GEMINI_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body,
    });

    const data = await response.json();

    if (response.ok) {
      const text  = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return parseGeminiJSON(text);
    }

    const status      = response.status;
    const isRetryable = status === 503 || status === 429;
    if (isRetryable && attempt < MAX_RETRIES) {
      const waitMs = attempt * RETRY_DELAY_MS;
      console.warn(`Gemini ${status} — tentativa ${attempt}/${MAX_RETRIES}, aguardando ${waitMs / 1000}s…`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    throw new Error(`Gemini API error ${status}: ${JSON.stringify(data?.error || data)}`);
  }
}

/**
 * Faz o parse do texto retornado pelo Gemini de forma robusta.
 * Tenta extrair JSON válido mesmo que a resposta venha com markdown,
 * texto extra, ou ligeiramente truncada.
 */
function parseGeminiJSON(text) {
  // 1. Remove blocos de markdown ```json ... ```
  let clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

  // 2. Tenta parse direto
  try {
    return JSON.parse(clean);
  } catch (_) { /* segue para recuperação */ }

  // 3. Extrai apenas o bloco { ... } mais externo
  const start = clean.indexOf("{");
  const end   = clean.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(clean.substring(start, end + 1));
    } catch (_) { /* segue para recuperação parcial */ }
  }

  // 4. Recuperação parcial: extrai pares "chave": "valor" que já vieram completos
  //    Útil quando o JSON foi cortado no meio — aproveita o que chegou
  const partial = {};
  const pairRegex = /"([^"]+)"\s*:\s*"([^"]+)"/g;
  let match;
  let found = false;
  while ((match = pairRegex.exec(clean)) !== null) {
    partial[match[1]] = match[2];
    found = true;
  }
  if (found) {
    console.warn("Gemini retornou JSON incompleto — usando recuperação parcial.");
    return partial;
  }

  // 5. Falhou tudo — lança erro descritivo
  throw new Error(`Não foi possível interpretar a resposta do Gemini. Texto recebido: "${clean.substring(0, 200)}…"`);
}

// ── 4A: Análise SRE (causa raiz / sugestão / prioridade) ─────────────────────

function buildAnalysisPrompt(mode, system, categories) {
  const payload = categories.map((c) => ({
    id_categoria:      c.name,
    contexto_real:     c.samples.slice(0, 3).join(" | "),
    total_ocorrencias: c.total,
    ultimos_30_dias:   c.last30,
  }));

  const jsonBlock = JSON.stringify(payload, null, 2);
  const retorno = `RETORNE APENAS O OBJETO JSON PURO, SEM MARKDOWN, SEM TEXTO EXTRA, NESTE FORMATO EXATO:
{
  "Nome_da_Categoria": {
    "titulo": "...",
    "motivo": "...",
    "sugestao": "...",
    "prioridade": "..."
  }
}
IMPORTANTE: Use exatamente o valor de "id_categoria" como chave do objeto de retorno.`;

  if (mode === "Valoriza") {
    return `Você é um especialista em operações do programa Vivo Valoriza — plataforma de benefícios do App Vivo para clientes dos planos Vivo Total.

CONTEXTO DO SISTEMA VALORIZA:
- O Valoriza oferece benefícios de parceiros (Perplexity, Cinemark, Vale Bônus, etc.) resgatáveis pelo App Vivo
- Os chamados são abertos por analistas de suporte ao relatar problemas de clientes
- Cada chamado tem: PROBLEMA REPORTADO, AÇÃO REALIZADA, CATEGORIA
- Chamados "indevidos" são de outros sistemas (Vivo Easy, MVE) que chegaram na fila errada
- Benefícios podem ser: clusterizados (só para públicos específicos), esgotados, descontinuados ou com problema no site parceiro
- O path de resgate padrão: App Vivo → Benefícios → Vivo Valoriza → Buscar Parceiros

TERMINOLOGIA IMPORTANTE:
- "Benefício clusterizado": disponível apenas para segmentos específicos de clientes
- "Benefício esgotado": acabaram as cotas disponíveis na campanha
- "Benefício descontinuado": parceria encerrada permanentemente
- "Voucher no site parceiro": código de desconto gerado pelo Valoriza para uso no site do parceiro
- "Vale Bônus": serviço de terceiro que aparece integrado no Valoriza

Analise os chamados recorrentes do sistema Valoriza e para cada categoria retorne OBRIGATORIAMENTE os 4 campos:
1. "titulo": Nome resumido do problema (máx 6 palavras), direto ao ponto
2. "motivo": Causa mais provável com base no padrão dos chamados (2-3 frases). Seja específico ao contexto do Valoriza — não use linguagem de infraestrutura técnica
3. "sugestao": Ação concreta para reduzir a reincidência (2-3 frases). Pode ser: melhoria de comunicação, ajuste no fluxo do app, criação de FAQ, automação de resposta, ou melhoria no processo de triagem
4. "prioridade": "Alta" (impacta muitos clientes ou bloqueia uso), "Média" (recorrente mas contornável), "Baixa" (pontual ou redirecionamento simples)

DADOS DAS CATEGORIAS:
${jsonBlock}

${retorno}`;
  }

  // Prompt padrão para Fly / Atlas — contexto técnico SRE
  return `Você é um Engenheiro de Confiabilidade de Sistemas (SRE) e Especialista ITIL Sênior do Ecossistema Vivo ${system}.

CONTEXTO DO SISTEMA FLY:
O Fly é a ferramenta core da Vivo para gerenciamento e cadastro de sites (antenas, armários e clusters).
Stack: Java/Spring Boot (back-end), Angular 14 (front-end), Camunda BPM (workflow/stages).
Módulos: Vivo Go (cadastro da localidade e ID Master), SOI (gestão de candidatos), SAR/Vendor (parte técnica das sharings), SCI/FCU (fase contratual final).
Fluxo de vida do site: Criação na Master → Abertura da SOI → Definição de Candidatos → SAR → FCU.

PADRÕES CONHECIDOS DE CHAMADOS (base de conhecimento real):
- Erro de altitude: campo altitude recebe letras (deveria ser numérico); correção na tabela sharing_outdoor_collo/bts, campo Altitude. Nível N1.
- Erro município/distrito: campo distrito não existe no Science ou município vazio; correção no formulário do candidato. Nível N1.
- Erro [object Object]: caractere especial/quebra de linha (<br>) em campo do formulário; exige debug. Nível N2.
- Mapa não carrega: coordenadas positivas ou com vírgula (devem ser negativas e com ponto). Nível N1.
- Vírgula em altura estrutura: retirar vírgula do campo. Nível N1.
- Feign null: campo FCU preenchido ao disparar SCI; deixar coluna FCU como null. Nível N1.
- Unique query result 2: empresa duplicada na tabela empresa do VivoGo; excluir a mais antiga. Nível N1.
- Subprocesso em andamento: SOI com mais de uma modalidade em aberto; cancelar modalidades extras. Nível N1.
- Botão não aparece: grupo designado no Camunda diferente do grupo do usuário. Nível N1/N2.

Use esse conhecimento para dar causas raiz precisas e sugestões realistas para o contexto do Fly.

Analise os chamados recorrentes abaixo e para cada categoria retorne OBRIGATORIAMENTE os 4 campos:
1. "titulo": Nome técnico resumido (máx 6 palavras)
2. "motivo": Causa raiz técnica detalhada (2-3 frases) — NUNCA deixe vazio
3. "sugestao": Proposta de automação ou regra de negócio (2-3 frases concretas) — NUNCA deixe vazio
4. "prioridade": exatamente "Alta", "Média" ou "Baixa"

DADOS DAS CATEGORIAS:
${jsonBlock}

${retorno}`;
}

/**
 * Normaliza a resposta do Gemini para garantir que sempre retorna
 * { "NomeCategoria": { titulo, motivo, sugestao, prioridade } }.
 *
 * O Gemini às vezes retorna a análise diretamente no nível raiz
 * quando há apenas uma categoria, ex: { "titulo": "...", "motivo": "..." }.
 * Esta função detecta esse caso e encapsula corretamente.
 */
function normalizeAnalysisResult(result, categoryName) {
  if (!result || typeof result !== "object") return null;

  // Completa campos faltantes de uma análise parcial (resposta truncada)
  const completar = (a) => ({
    titulo:     a.titulo     || categoryName,
    motivo:     a.motivo     || "",
    sugestao:   a.sugestao   || "(sugestão não retornada — resposta da IA foi truncada)",
    prioridade: a.prioridade || "Média",
  });

  // Caso 1: chave exata da categoria
  if (result[categoryName]?.motivo) return completar(result[categoryName]);

  // Caso 2: o resultado JÁ É a análise diretamente (nível raiz)
  // Aceita mesmo sem `sugestao` — respostas truncadas cortam o último campo
  if (result.motivo) return completar(result);

  // Caso 3: varre todas as chaves buscando um objeto com motivo preenchido
  for (const val of Object.values(result)) {
    if (val && typeof val === "object" && val.motivo) return completar(val);
  }

  // Caso 4: retorna a primeira chave mesmo sem motivo (Gemini retornou algo parcial)
  const firstVal = result[Object.keys(result)[0]];
  if (firstVal && typeof firstVal === "object" && firstVal.motivo) return completar(firstVal);

  return null;
}

/**
 * Chama o Gemini para análise SRE/Valoriza das categorias.
 * @param {string} mode
 * @param {string} system
 * @param {Array}  categories
 * @param {string} geminiKey
 */
async function callGeminiForAnalysis(mode, system, categories, geminiKey) {
  return callGemini(buildAnalysisPrompt(mode, system, categories), geminiKey);
}

// =============================================================================
// SEÇÃO 5 — UTILITÁRIOS
// Funções puras de cálculo — sem dependências de React.
// =============================================================================

function countInRange(tickets, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return tickets.filter((t) => t.date >= cutoff).length;
}

/**
 * Retorna apenas os tickets dentro do período (dias).
 * Usado para limitar o que é enviado à IA — evita gastar tokens com histórico antigo.
 */
function getTicketsInPeriod(tickets, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return tickets.filter((t) => t.date >= cutoff);
}

/**
 * Seleciona até `max` amostras de texto representativas do período.
 * Descarta duplicatas exatas e textos muito curtos (< 20 chars) antes de amostrar.
 * Isso reduz drasticamente os tokens enviados ao Gemini sem perder contexto.
 */
function sampleTickets(tickets, max = 5) {
  const seen = new Set();
  const unique = tickets.filter((t) => {
    const key = t.description.trim().toLowerCase().substring(0, 80);
    if (seen.has(key) || t.description.trim().length < 20) return false;
    seen.add(key);
    return true;
  });
  // Pega amostras distribuídas: início, meio e fim do período
  if (unique.length <= max) return unique.map((t) => t.description);
  const step = Math.floor(unique.length / max);
  return Array.from({ length: max }, (_, i) => unique[i * step].description);
}

function getMonthlyTrend(tickets) {
  const now    = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleString("pt-BR", { month: "short" }), start: d };
  });
  return months.map(({ label, start }, idx) => {
    const end   = months[idx + 1]?.start ?? new Date();
    const count = tickets.filter((t) => t.date >= start && t.date < end).length;
    return { label, count };
  });
}

function percentChange(current, previous) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// =============================================================================
// SEÇÃO 6 — CONFIGURAÇÕES DOS GRÁFICOS (ApexCharts)
// Centralizado aqui para facilitar ajustes visuais globais.
// =============================================================================

const CHART_COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#F97316", "#84CC16", "#EC4899",
];

const BASE_CHART_CONFIG = { toolbar: { show: false }, fontFamily: "Inter, sans-serif" };

function barChartOptions(categories, title, color = CHART_COLORS[0]) {
  return {
    chart:       { ...BASE_CHART_CONFIG, type: "bar" },
    plotOptions: { bar: { borderRadius: 6, horizontal: true } },
    colors:      [color],
    dataLabels:  { enabled: true, style: { fontSize: "11px" } },
    xaxis:       { categories, labels: { style: { fontSize: "11px" } } },
    tooltip:     { theme: "dark" },
    grid:        { borderColor: "#E2E8F0" },
    title:       { text: title, style: { fontSize: "13px", fontWeight: "600" } },
  };
}

function areaChartOptions(categories, title) {
  return {
    chart:   { ...BASE_CHART_CONFIG, type: "area" },
    stroke:  { curve: "smooth", width: 2 },
    fill:    { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    colors:  CHART_COLORS,
    xaxis:   { categories, labels: { style: { fontSize: "11px" } } },
    tooltip: { theme: "dark" },
    grid:    { borderColor: "#E2E8F0" },
    legend:  { position: "top", fontSize: "12px" },
    title:   { text: title, style: { fontSize: "13px", fontWeight: "600" } },
  };
}

function donutChartOptions(labels, title) {
  return {
    chart:       { ...BASE_CHART_CONFIG, type: "donut" },
    labels,
    colors:      CHART_COLORS,
    legend:      { position: "bottom", fontSize: "11px" },
    plotOptions: { pie: { donut: { size: "65%" } } },
    title:       { text: title, style: { fontSize: "13px", fontWeight: "600" } },
  };
}

function heatmapChartOptions(categories, title) {
  return {
    chart:   { ...BASE_CHART_CONFIG, type: "heatmap" },
    colors:  [CHART_COLORS[0]],
    title:   { text: title, style: { fontSize: "13px", fontWeight: "600" } },
    xaxis:   { categories, labels: { style: { fontSize: "11px" } } },
    tooltip: { theme: "dark" },
  };
}

// =============================================================================
// SEÇÃO 7 — COMPONENTES DE UI
// =============================================================================

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, color = "purple" }) {
  const bg          = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  return (
    <Card bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" shadow="sm">
      <CardBody>
        <Stat>
          <StatLabel fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
            {label}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="700" color={`${color}.500`}>
            {value}
          </StatNumber>
          {delta !== null && delta !== undefined && (
            <StatHelpText mb="0">
              <StatArrow type={delta >= 0 ? "increase" : "decrease"} />
              {Math.abs(delta)}% vs mês anterior
            </StatHelpText>
          )}
        </Stat>
      </CardBody>
    </Card>
  );
}

// ── PriorityBadge ─────────────────────────────────────────────────────────────

function PriorityBadge({ priority }) {
  const map = {
    Alta:  { colorScheme: "red",    label: "Alta"  },
    Média: { colorScheme: "orange", label: "Média" },
    Baixa: { colorScheme: "green",  label: "Baixa" },
  };
  const cfg = map[priority] || { colorScheme: "gray", label: priority || "—" };
  return <Badge colorScheme={cfg.colorScheme} borderRadius="full" px="2">{cfg.label}</Badge>;
}

// ── CategoryMultiSelect ───────────────────────────────────────────────────────
// Dropdown com checkboxes para selecionar múltiplas categorias.
// "Selecionar todas" marca tudo; clicar em uma marcada a desmarca.

function CategoryMultiSelect({ allCategories, selected, onChange }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const ref                   = useRef(null);
  const bg                    = useColorModeValue("white", "gray.800");
  const border                = useColorModeValue("gray.200", "gray.600");
  const hoverBg               = useColorModeValue("purple.50", "purple.900");

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered    = allCategories.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );
  const allSelected = selected.length === allCategories.length;

  function toggleAll() {
    onChange(allSelected ? [] : [...allCategories]);
  }

  function toggleOne(cat) {
    onChange(
      selected.includes(cat)
        ? selected.filter((c) => c !== cat)
        : [...selected, cat]
    );
  }

  const label = selected.length === 0
    ? "Todas as categorias"
    : selected.length === 1
      ? selected[0].length > 30 ? selected[0].substring(0, 30) + "…" : selected[0]
      : `${selected.length} categorias`;

  return (
    <Box position="relative" ref={ref}>
      {/* Botão que abre o dropdown */}
      <Flex
        align="center" justify="space-between"
        px="3" py="1.5" borderRadius="lg" borderWidth="1px" borderColor={border}
        bg={bg} cursor="pointer" fontSize="sm" onClick={() => setOpen((v) => !v)}
        _hover={{ borderColor: "purple.400" }}
        minH="32px"
      >
        <Text fontSize="sm" color={selected.length === 0 ? "gray.400" : "inherit"} noOfLines={1}>
          {label}
        </Text>
        <Text fontSize="10px" color="gray.400" ml="2">{open ? "▲" : "▼"}</Text>
      </Flex>

      {/* Dropdown */}
      {open && (
        <Box
          position="absolute" top="100%" left="0" right="0" zIndex="200"
          bg={bg} borderWidth="1px" borderColor={border} borderRadius="lg"
          shadow="lg" mt="1" maxH="260px" overflowY="auto"
        >
          {/* Busca */}
          <Box px="3" pt="2" pb="1" borderBottomWidth="1px" borderColor={border}>
            <input
              autoFocus
              placeholder="Buscar categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", fontSize: "12px", border: "none", outline: "none",
                background: "transparent", padding: "2px 0",
              }}
            />
          </Box>

          {/* Selecionar todas */}
          <Flex
            align="center" px="3" py="2" gap="2" cursor="pointer"
            _hover={{ bg: hoverBg }} borderBottomWidth="1px" borderColor={border}
            onClick={toggleAll}
          >
            <Box
              w="14px" h="14px" borderRadius="3px" borderWidth="1.5px"
              borderColor={allSelected ? "purple.500" : border}
              bg={allSelected ? "purple.500" : "transparent"}
              display="flex" alignItems="center" justifyContent="center" flexShrink={0}
            >
              {allSelected && <Text fontSize="9px" color="white" lineHeight="1">✓</Text>}
            </Box>
            <Text fontSize="12px" fontWeight="600" color="purple.600">
              {allSelected ? "Desmarcar todas" : "Selecionar todas"}
            </Text>
            <Badge ml="auto" colorScheme="gray" variant="subtle" fontSize="9px">
              {allCategories.length}
            </Badge>
          </Flex>

          {/* Lista de categorias */}
          {filtered.length === 0 ? (
            <Text fontSize="12px" color="gray.400" px="3" py="2">Nenhuma encontrada</Text>
          ) : (
            filtered.map((cat) => {
              const isSelected = selected.includes(cat);
              return (
                <Flex
                  key={cat} align="center" px="3" py="2" gap="2"
                  cursor="pointer" _hover={{ bg: hoverBg }}
                  onClick={() => toggleOne(cat)}
                >
                  <Box
                    w="14px" h="14px" borderRadius="3px" borderWidth="1.5px" flexShrink={0}
                    borderColor={isSelected ? "purple.500" : border}
                    bg={isSelected ? "purple.500" : "transparent"}
                    display="flex" alignItems="center" justifyContent="center"
                  >
                    {isSelected && <Text fontSize="9px" color="white" lineHeight="1">✓</Text>}
                  </Box>
                  <Text fontSize="12px" noOfLines={1}>
                    {cat.length > 50 ? cat.substring(0, 50) + "…" : cat}
                  </Text>
                </Flex>
              );
            })
          )}

          {/* Rodapé com ação de limpar */}
          {selected.length > 0 && (
            <Flex
              justify="flex-end" px="3" py="2"
              borderTopWidth="1px" borderColor={border}
            >
              <Button size="xs" variant="ghost" colorScheme="gray"
                onClick={() => { onChange([]); setOpen(false); }}>
                Limpar seleção
              </Button>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}

// ── FilterPanel ───────────────────────────────────────────────────────────────

function FilterPanel({ filters, onChange, onReset, allCategories, activeMode, onModeChange, systems }) {
  const bg        = useColorModeValue("gray.50", "gray.900");
  const border    = useColorModeValue("gray.200", "gray.700");
  const modeCfg   = MODE_CONFIG[activeMode];
  return (
    <Box bg={bg} borderRadius="xl" p="5" mb="6" borderWidth="1px" borderColor={border}>
      <Flex align="center" mb="4" gap="2">
        <Box w="3" h="3" borderRadius="full" bg="purple.500" />
        <Heading size="sm" fontWeight="600">Filtros de Análise</Heading>
        <Text fontSize="xs" color="gray.500" ml="1">(configure antes de solicitar análise IA)</Text>
        <Button size="xs" variant="ghost" colorScheme="gray" ml="auto" onClick={onReset}>
          Limpar filtros
        </Button>
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="4">

        {/* Seletor de Modo — controla qual sistema/planilha/IA é usado */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500">Modo do Sistema</FormLabel>
          <Select
            size="sm" borderRadius="lg" value={activeMode}
            onChange={(e) => onModeChange(e.target.value)}
            fontWeight="600" color="purple.600"
          >
            {Object.keys(MODE_CONFIG).map((m) => (
              <option key={m} value={m}>{MODE_CONFIG[m].label}</option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" color="gray.500">Sistema</FormLabel>
          <Select size="sm" borderRadius="lg" value={filters.system} onChange={(e) => onChange("system", e.target.value)}>
            <option value="">Todos</option>
            {systems.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500">
            Categoria
            {filters.categories.length > 0 && (
              <Badge ml="2" colorScheme="purple" borderRadius="full" fontSize="9px">
                {filters.categories.length} selecionadas
              </Badge>
            )}
          </FormLabel>
          <CategoryMultiSelect
            allCategories={allCategories}
            selected={filters.categories}
            onChange={(cats) => onChange("categories", cats)}
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500">Período</FormLabel>
          <Select size="sm" borderRadius="lg" value={filters.period} onChange={(e) => onChange("period", e.target.value)}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="9999">Todo o histórico</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500">Prioridade IA</FormLabel>
          <Select size="sm" borderRadius="lg" value={filters.priority} onChange={(e) => onChange("priority", e.target.value)}>
            <option value="">Todas</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </Select>
        </FormControl>
      </SimpleGrid>
    </Box>
  );
}

// ── AnalysisCard ──────────────────────────────────────────────────────────────

function AnalysisCard({ systemName, categoryName, categoryData, analysis, onRequestAnalysis, isLoading }) {
  const bg           = useColorModeValue("white", "gray.800");
  const borderColor  = useColorModeValue("gray.200", "gray.700");
  const statBg       = useColorModeValue("gray.50", "gray.700");
  const textColor    = useColorModeValue("gray.700", "gray.300");
  const causeRootBg  = useColorModeValue("red.50", "red.900");
  const suggestionBg = useColorModeValue("teal.50", "teal.900");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [ticketPage, setTicketPage]         = useState(0);
  const [selectedSubgroup, setSelectedSubgroup] = useState(null); // filtra tabela por subgrupo
  const [editingDesc, setEditingDesc]       = useState(false);
  const [descOverride, setDescOverride]     = useState(null);     // legenda editada pelo usuário

  // Descrição: usa a editada se existir, senão a automática
  const descricaoAuto = getCategoryDescription(categoryName);
  const descricao     = descOverride !== null ? descOverride : descricaoAuto;
  const subgrupos     = useMemo(() => calcularSubgrupos(categoryData.tickets), [categoryData.tickets]);

  // Tickets filtrados pelo subgrupo selecionado (se houver)
  const visibleTickets = useMemo(() => {
    if (!selectedSubgroup) return categoryData.tickets;
    return categoryData.tickets.filter((t) => deduzirSubgrupo(t.description) === selectedSubgroup);
  }, [categoryData.tickets, selectedSubgroup]);

  const trend            = getMonthlyTrend(categoryData.tickets);
  const totalPages       = Math.ceil(visibleTickets.length / TICKETS_PER_PAGE);
  const paginatedTickets = visibleTickets.slice(
    ticketPage * TICKETS_PER_PAGE,
    (ticketPage + 1) * TICKETS_PER_PAGE
  );

  // Coleta os detalhes únicos mais frequentes dos tickets desta categoria
  const detalhesFreq = useMemo(() => {
    const freq = {};
    categoryData.tickets.forEach((t) => {
      if (t.detalhe) freq[t.detalhe] = (freq[t.detalhe] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([d]) => d);
  }, [categoryData.tickets]);

  return (
    <Card bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" shadow="sm" overflow="hidden">
      <CardHeader pb="2" borderBottomWidth="1px" borderColor={borderColor}>
        <Flex align="flex-start" justify="space-between" gap="2">
          <Box flex="1">
            <HStack mb="1" spacing="2">
              <Badge colorScheme="purple" variant="subtle" fontSize="10px">{systemName}</Badge>
              {analysis && <PriorityBadge priority={analysis.prioridade} />}
            </HStack>
            <Text fontWeight="600" fontSize="sm" lineHeight="1.4">
              {analysis?.titulo || categoryName}
            </Text>
            <Text fontSize="11px" color="gray.500" mt="1" noOfLines={1}>{categoryName}</Text>
            {detalhesFreq.length > 0 && (
              <HStack mt="1" spacing="1" flexWrap="wrap">
                {detalhesFreq.map((d) => (
                  <Badge key={d} colorScheme="gray" variant="outline" fontSize="9px" borderRadius="full">
                    {d}
                  </Badge>
                ))}
              </HStack>
            )}
          </Box>
          <VStack align="flex-end" spacing="0">
            <Text fontSize="2xl" fontWeight="700" color="purple.500" lineHeight="1">
              {categoryData.tickets.length}
            </Text>
            <Text fontSize="10px" color="gray.400">total</Text>
          </VStack>
        </Flex>
      </CardHeader>

      <CardBody py="3">
        <SimpleGrid columns={3} spacing="2" mb="3">
          {[30, 60, 90].map((d) => (
            <Box key={d} textAlign="center" bg={statBg} borderRadius="lg" p="2">
              <Text fontSize="lg" fontWeight="700" color="purple.400">
                {countInRange(categoryData.tickets, d)}
              </Text>
              <Text fontSize="10px" color="gray.500">{d}d</Text>
            </Box>
          ))}
        </SimpleGrid>

        {analysis ? (
          <Box>
            <Box mb="2">
              <Text fontSize="11px" fontWeight="600" color="gray.500" textTransform="uppercase" mb="1">Causa raiz</Text>
              <Text fontSize="12px" color={textColor} lineHeight="1.5">{analysis.motivo}</Text>
            </Box>
            <Box>
              <Text fontSize="11px" fontWeight="600" color="teal.500" textTransform="uppercase" mb="1">Sugestão</Text>
              <Text fontSize="12px" color={textColor} lineHeight="1.5">{analysis.sugestao}</Text>
            </Box>
          </Box>
        ) : (
          <Box textAlign="center" py="3">
            <Text fontSize="12px" color="gray.400" mb="3">
              Análise IA ainda não solicitada para esta categoria.
            </Text>
            {isLoading ? (
              <Spinner size="sm" color="purple.500" />
            ) : (
              <Button size="xs" colorScheme="purple" variant="outline" borderRadius="full" onClick={onRequestAnalysis}>
                Solicitar análise IA
              </Button>
            )}
          </Box>
        )}
      </CardBody>

      <CardFooter pt="0" pb="3" px="4">
        <Button size="xs" variant="ghost" colorScheme="purple" onClick={onOpen} width="full">
          Ver detalhes & gráfico de tendência →
        </Button>
      </CardFooter>

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="md">{analysis?.titulo || categoryName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <HStack mb="4" spacing="2">
              <Badge colorScheme="purple">{systemName}</Badge>
              {analysis && <PriorityBadge priority={analysis.prioridade} />}
              <Text fontSize="xs" color="gray.500">{categoryData.tickets.length} chamados totais</Text>
            </HStack>

            {/* Descrição da categoria (legenda) — editável */}
            <Box mb="4" p="3" bg={statBg} borderRadius="lg" borderLeftWidth="3px" borderLeftColor="purple.400">
              <Flex justify="space-between" align="center" mb="1">
                <Text fontSize="10px" fontWeight="700" color="purple.500" textTransform="uppercase">
                  O que esta categoria engloba
                </Text>
                <Button size="xs" variant="ghost" colorScheme="purple" height="18px" fontSize="10px"
                  onClick={() => { setEditingDesc(!editingDesc); if (descOverride === null) setDescOverride(descricao || ""); }}>
                  {editingDesc ? "Salvar" : "✎ Editar"}
                </Button>
              </Flex>
              {editingDesc ? (
                <textarea
                  autoFocus
                  value={descOverride ?? ""}
                  onChange={(e) => setDescOverride(e.target.value)}
                  placeholder="Descreva o que esta categoria engloba..."
                  style={{
                    width: "100%", minHeight: "48px", fontSize: "13px", padding: "6px 8px",
                    border: "1px solid #CBD5E0", borderRadius: "6px", outline: "none",
                    fontFamily: "inherit", resize: "vertical", background: "transparent",
                  }}
                />
              ) : descricao ? (
                <Text fontSize="13px" color={textColor} lineHeight="1.5">{descricao}</Text>
              ) : (
                <Text fontSize="12px" color="gray.400" fontStyle="italic">
                  Sem descrição definida — clique em Editar para adicionar.
                </Text>
              )}
            </Box>

            {/* Subgrupos deduzidos automaticamente — clicáveis para filtrar a tabela */}
            {subgrupos.length > 1 && (
              <Box mb="4">
                <Flex justify="space-between" align="center" mb="2">
                  <Text fontSize="11px" fontWeight="600" color="gray.500" textTransform="uppercase">
                    Tipos de chamado nesta categoria
                  </Text>
                  {selectedSubgroup && (
                    <Button size="xs" variant="ghost" colorScheme="purple" height="18px" fontSize="10px"
                      onClick={() => { setSelectedSubgroup(null); setTicketPage(0); }}>
                      ✕ Limpar filtro
                    </Button>
                  )}
                </Flex>
                <VStack spacing="1.5" align="stretch">
                  {subgrupos.map((sg) => {
                    const isActive = selectedSubgroup === sg.label;
                    return (
                      <Box
                        key={sg.label} cursor="pointer" p="1.5" borderRadius="md"
                        bg={isActive ? "purple.50" : "transparent"}
                        borderWidth="1px" borderColor={isActive ? "purple.300" : "transparent"}
                        _hover={{ bg: isActive ? "purple.50" : statBg }}
                        onClick={() => {
                          setSelectedSubgroup(isActive ? null : sg.label);
                          setTicketPage(0);
                        }}
                      >
                        <Flex justify="space-between" mb="0.5">
                          <Text fontSize="12px" color={textColor} fontWeight={isActive ? "600" : "400"}>
                            {isActive ? "▸ " : ""}{sg.label}
                          </Text>
                          <Text fontSize="11px" color="gray.500">{sg.count} ({sg.pct}%)</Text>
                        </Flex>
                        <Box bg={statBg} borderRadius="full" h="6px" overflow="hidden">
                          <Box bg={isActive ? "purple.500" : "purple.400"} h="6px" borderRadius="full" width={`${sg.pct}%`} />
                        </Box>
                      </Box>
                    );
                  })}
                </VStack>
                {selectedSubgroup && (
                  <Text fontSize="10px" color="purple.500" mt="1">
                    Mostrando apenas chamados do tipo "{selectedSubgroup}" na tabela abaixo.
                  </Text>
                )}
              </Box>
            )}

            <Chart
              type="area"
              height={200}
              options={areaChartOptions(trend.map((t) => t.label), "Tendência mensal")}
              series={[{ name: "Chamados", data: trend.map((t) => t.count) }]}
            />

            {analysis && (
              <Box mt="4">
                <Box mb="3" p="3" bg={causeRootBg} borderRadius="lg">
                  <Text fontSize="11px" fontWeight="700" color="red.600" mb="1">CAUSA RAIZ</Text>
                  <Text fontSize="13px">{analysis.motivo}</Text>
                </Box>
                <Box p="3" bg={suggestionBg} borderRadius="lg">
                  <Text fontSize="11px" fontWeight="700" color="teal.600" mb="1">SUGESTÃO DE AUTOMAÇÃO</Text>
                  <Text fontSize="13px">{analysis.sugestao}</Text>
                </Box>
              </Box>
            )}

            <Divider my="4" />

            <Flex justify="space-between" align="center" mb="3">
              <Text fontWeight="600" fontSize="sm">
                Chamados ({visibleTickets.length}{selectedSubgroup ? ` de ${categoryData.tickets.length}` : ""})
              </Text>
              {totalPages > 1 && (
                <HStack spacing="1">
                  <Button size="xs" variant="outline" isDisabled={ticketPage === 0}
                    onClick={() => setTicketPage((p) => p - 1)}>‹ Anterior</Button>
                  <Text fontSize="xs" color="gray.500">{ticketPage + 1} / {totalPages}</Text>
                  <Button size="xs" variant="outline" isDisabled={ticketPage >= totalPages - 1}
                    onClick={() => setTicketPage((p) => p + 1)}>Próxima ›</Button>
                </HStack>
              )}
            </Flex>

            <Table size="xs">
              <Thead>
                <Tr><Th w="60px">Linha</Th><Th w="90px">Data</Th><Th w="90px">Detalhe</Th><Th>Descrição</Th></Tr>
              </Thead>
              <Tbody>
                {paginatedTickets.map((t) => (
                  <Tr key={t.id} _hover={{ bg: statBg }} cursor="pointer"
                    onClick={() => setExpandedTicket(expandedTicket === t.id ? null : t.id)}>
                    <Td><Text fontSize="11px" fontFamily="mono" color="purple.500">{t.id}</Text></Td>
                    <Td fontSize="11px" whiteSpace="nowrap">{t.date.toLocaleDateString("pt-BR")}</Td>
                    <Td>
                      {t.detalhe && (
                        <Badge colorScheme="purple" variant="subtle" fontSize="9px" borderRadius="full">
                          {t.detalhe}
                        </Badge>
                      )}
                    </Td>
                    <Td fontSize="11px">
                      {expandedTicket === t.id ? (
                        <Box>
                          <Text whiteSpace="pre-wrap" lineHeight="1.5">{t.description}</Text>
                          <Text fontSize="10px" color="purple.400" mt="1">▲ clique para recolher</Text>
                        </Box>
                      ) : (
                        <Box>
                          <Text noOfLines={2} color={textColor}>{t.description}</Text>
                          {t.description.length > 100 && (
                            <Text fontSize="10px" color="purple.400" mt="0.5">▼ clique para expandir</Text>
                          )}
                        </Box>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {totalPages > 1 && (
              <Text fontSize="11px" color="gray.400" mt="2" textAlign="center">
                Exibindo {ticketPage * TICKETS_PER_PAGE + 1}–
                {Math.min((ticketPage + 1) * TICKETS_PER_PAGE, visibleTickets.length)} de{" "}
                {visibleTickets.length} chamados
              </Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  );
}

// ── OverviewCharts ────────────────────────────────────────────────────────────

function OverviewCharts({ data, systems }) {
  const systemsToShow = systems.filter((s) => data[s]);

  // Gráfico de barras: top categorias por volume total (histórico completo)
  const volumeByCategory = useMemo(() => {
    const result = [];
    systemsToShow.forEach((sys) => {
      if (!data[sys]) return;
      Object.entries(data[sys]).forEach(([cat, val]) => {
        if (val.tickets.length > 0)
          result.push({ name: cat.substring(0, 40) + "…", count: val.tickets.length });
      });
    });
    return result.sort((a, b) => b.count - a.count).slice(0, 12);
  }, [data, systemsToShow]);

  const trendBySys = useMemo(() => {
    const now    = new Date();
    const months = Array.from({ length: 6 }, (_, i) =>
      new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    );
    const labels = months.map((d) => d.toLocaleString("pt-BR", { month: "short" }));
    const series = systemsToShow.map((sys) => ({
      name: sys,
      data: months.map((start, idx) => {
        const end = months[idx + 1] || new Date();
        if (!data[sys]) return 0;
        return Object.values(data[sys]).reduce(
          (acc, v) => acc + v.tickets.filter((t) => t.date >= start && t.date < end).length,
          0
        );
      }),
    }));
    return { labels, series };
  }, [data, systemsToShow]);

  const donutData = useMemo(() => {
    const cats = {};
    systemsToShow.forEach((sys) => {
      if (!data[sys]) return;
      Object.entries(data[sys]).forEach(([cat, val]) => {
        cats[cat] = (cats[cat] || 0) + val.tickets.length;
      });
    });
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      labels: sorted.map(([k]) => k.substring(0, 30) + "…"),
      values: sorted.map(([, v]) => v),
    };
  }, [data, systemsToShow]);

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="6" mb="6">
      <Box>
        <Chart
          type="bar"
          height={Math.max(250, volumeByCategory.length * 35)}
          options={barChartOptions(volumeByCategory.map((x) => x.name), "Top categorias — histórico completo")}
          series={[{ name: "Chamados", data: volumeByCategory.map((x) => x.count) }]}
        />
      </Box>
      <Box>
        <Chart
          type="area"
          height={300}
          options={areaChartOptions(trendBySys.labels, "Tendência mensal por sistema")}
          series={trendBySys.series}
        />
      </Box>
      <Box>
        <Chart
          type="donut"
          height={300}
          options={donutChartOptions(donutData.labels, "Distribuição por categoria — histórico completo")}
          series={donutData.values}
        />
      </Box>
      <Box>
        <Chart
          type="heatmap"
          height={300}
          options={heatmapChartOptions(trendBySys.labels, "Volume por sistema × mês (últimos 6m)")}
          series={trendBySys.series}
        />
      </Box>
    </SimpleGrid>
  );
}

// =============================================================================
// SEÇÃO 8 — COMPONENTE PRINCIPAL
// =============================================================================

const INITIAL_FILTERS = { system: "", categories: [], period: "90", priority: "" };

// =============================================================================
// PERSISTÊNCIA DE ANÁLISES (localStorage)
//
// As análises da IA são salvas no navegador, separadas por modo, para não se
// perderem ao recarregar a página. Funciona no ambiente real (Vercel/local);
// não funciona dentro de artifacts do chat (que bloqueiam localStorage).
// =============================================================================

const STORAGE_PREFIX = "vivo-dashboard-analyses";

// Carrega as análises salvas de um modo específico
function loadStoredAnalyses(mode) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}::${mode}`);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {}; // localStorage indisponível ou dado corrompido
  }
}

// Salva as análises de um modo específico
function saveStoredAnalyses(mode, analyses) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}::${mode}`, JSON.stringify(analyses));
  } catch (_) {
    // Silencioso — se localStorage não estiver disponível, apenas não persiste
  }
}

// Remove as análises salvas de um modo específico
function clearStoredAnalyses(mode) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}::${mode}`);
  } catch (_) { /* silencioso */ }
}

function DashboardApp() {
  // ── Estado ──────────────────────────────────────────────────────────────────
  const [activeMode,      setActiveMode]      = useState(DEFAULT_MODE); // "Fly/Atlas" | "Valoriza"
  const [data,            setData]            = useState({});
  const [sheetLoading,    setSheetLoading]    = useState(false);
  const [sheetError,      setSheetError]      = useState(null);
  const [lastSync,        setLastSync]        = useState(null);
  const [analyses,        setAnalyses]        = useState(() => loadStoredAnalyses(DEFAULT_MODE));
  const [loadingKeys,     setLoadingKeys]     = useState({});
  const [bulkLoading,     setBulkLoading]     = useState(false);
  const [mockMode,        setMockMode]        = useState(false); // quando true, substitui Gemini por dados simulados
  const [failedCats,      setFailedCats]      = useState([]);    // categorias que falharam na última análise em lote
  const [filters,         setFilters]         = useState(INITIAL_FILTERS);

  const toast  = useToast();
  const bg     = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  // ── Derivados ────────────────────────────────────────────────────────────────

  // Sistemas disponíveis dependem do modo ativo
  const SYSTEMS         = MODE_CONFIG[activeMode]?.systems || ["Fly", "Atlas"];
  const filteredSystems = filters.system ? [filters.system] : SYSTEMS;

  const periodDays = parseInt(filters.period || "90");

  // periodData: cópia de `data` contendo apenas tickets dentro do período selecionado.
  // Alimenta TUDO na tela (cards, contagens, gráficos, lista) para que o filtro de
  // período afete a visualização inteira — não só a IA.
  // Categorias que ficam sem nenhum ticket no período são removidas.
  const periodData = useMemo(() => {
    // "Todo o histórico" (9999) — não filtra nada
    if (periodDays >= 9999) return data;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);

    const filtered = {};
    Object.entries(data).forEach(([sys, cats]) => {
      Object.entries(cats).forEach(([cat, val]) => {
        const tickets = val.tickets.filter((t) => t.date >= cutoff);
        if (tickets.length > 0) {
          if (!filtered[sys]) filtered[sys] = {};
          filtered[sys][cat] = { ...val, tickets };
        }
      });
    });
    return filtered;
  }, [data, periodDays]);

  const allCategories = useMemo(() => {
    const cats = new Set();
    Object.values(periodData).forEach((sys) => Object.keys(sys).forEach((c) => cats.add(c)));
    return [...cats].sort();
  }, [periodData]);

  const filteredCards = useMemo(() => {
    const cards = [];
    filteredSystems.forEach((sys) => {
      if (!periodData[sys]) return;
      Object.entries(periodData[sys]).forEach(([cat, val]) => {
        if (filters.categories.length > 0 && !filters.categories.includes(cat)) return;
        const key      = `${sys}::${cat}`;
        const analysis = analyses[key];
        if (filters.priority && analysis?.prioridade !== filters.priority) return;
        cards.push({ sys, cat, val, key, analysis });
      });
    });
    // Ordena do maior para o menor volume de chamados
    return cards.sort((a, b) => b.val.tickets.length - a.val.tickets.length);
  }, [periodData, filteredSystems, filters, analyses]);

  const totalTickets = useMemo(() => {
    let t = 0;
    filteredSystems.forEach((s) =>
      Object.values(periodData[s] || {}).forEach((v) => (t += v.tickets.length))
    );
    return t;
  }, [periodData, filteredSystems]);

  const tickets30 = useMemo(() => {
    let current = 0, previous = 0;
    filteredSystems.forEach((s) => {
      Object.values(data[s] || {}).forEach((v) => {
        current  += countInRange(v.tickets, 30);
        previous += countInRange(v.tickets, 60) - countInRange(v.tickets, 30);
      });
    });
    return { count: current, delta: percentChange(current, previous) };
  }, [data, filteredSystems]);

  const analysedCount = useMemo(
    () => filteredCards.filter((c) => c.analysis).length,
    [filteredCards]
  );

  // ── Ações ────────────────────────────────────────────────────────────────────

  const loadSheetData = useCallback(async () => {
    setSheetLoading(true);
    setSheetError(null);
    try {
      const result = await fetchSheetData(activeMode);
      setData(result);
      setLastSync(new Date().toLocaleString("pt-BR"));
      const total = Object.values(result).reduce(
        (acc, sys) => acc + Object.values(sys).reduce((a, v) => a + v.tickets.length, 0), 0
      );
      toast({
        title:       "Planilha carregada!",
        description: `${total} chamados importados. Use o filtro de período para controlar o que a IA analisa.`,
        status:      "success",
        duration:    4000,
      });
    } catch (e) {
      setSheetError(e.message);
      toast({ title: "Erro ao carregar planilha", description: e.message, status: "error", duration: 6000 });
    } finally {
      setSheetLoading(false);
    }
  }, [activeMode, toast]);

  // Roteador de análise: usa mock ou Gemini real dependendo do estado mockMode.
  // Passa a chave Gemini correta para o modo ativo — cada modo consome tokens separados.
  const analyzeCategories = useCallback(
    (system, categories) => {
      const geminiKey = MODE_CONFIG[activeMode]?.geminiKey || "";
      return mockMode
        ? callGeminiMock(categories)
        : callGeminiForAnalysis(activeMode, system, categories, geminiKey);
    },
    [mockMode, activeMode]
  );

  const requestAnalysis = useCallback(async (system, categoryName) => {
    const key     = `${system}::${categoryName}`;
    const catData = data[system]?.[categoryName];
    if (!catData) return;

    const period           = parseInt(filters.period || "90");
    const ticketsNoPeriodo = getTicketsInPeriod(catData.tickets, period);

    if (ticketsNoPeriodo.length === 0) {
      toast({
        title:       "Sem chamados no período",
        description: `Nenhum chamado de "${categoryName.substring(0, 40)}…" nos últimos ${period} dias.`,
        status:      "warning",
        duration:    4000,
      });
      return;
    }

    setLoadingKeys((prev) => ({ ...prev, [key]: true }));
    try {
      const result = await analyzeCategories(system, [{
        name:    categoryName,
        samples: sampleTickets(ticketsNoPeriodo, 5),
        total:   ticketsNoPeriodo.length,
        last30:  countInRange(ticketsNoPeriodo, 30),
      }]);
      const analysis = normalizeAnalysisResult(result, categoryName);
      setAnalyses((prev) => ({ ...prev, [key]: analysis }));
      toast({ title: "Análise concluída", description: categoryName.substring(0, 50) + "…", status: "success", duration: 3000 });
    } catch (e) {
      toast({ title: "Erro na análise IA", description: String(e.message), status: "error", duration: 5000 });
    } finally {
      setLoadingKeys((prev) => ({ ...prev, [key]: false }));
    }
  }, [data, filters.period, analyzeCategories, toast]);

  // `onlyThese` (opcional): array de nomes de categorias para analisar apenas essas.
  // Usado pelo botão "Repetir falhas" — ignora o filtro e o "já analisadas".
  const requestBulkAnalysis = useCallback(async (onlyThese = null) => {
    if (!filters.system) {
      toast({ title: "Selecione um sistema", description: "Configure o filtro antes de solicitar análise em lote.", status: "warning", duration: 4000 });
      return;
    }
    setBulkLoading(true);
    setFailedCats([]);
    try {
      const sys    = filters.system;
      const period = parseInt(filters.period || "90");

      const isRetry      = Array.isArray(onlyThese) && onlyThese.length > 0;
      const selectedCats = filters.categories; // [] = todas, [x,y] = apenas essas

      // Filtra pelo período, pelas categorias do filtro, e pula as já analisadas.
      // No modo "repetir falhas", considera apenas as categorias informadas.
      const allCats = Object.entries(data[sys] || {})
        .filter(([name]) => isRetry
          ? onlyThese.includes(name)
          : (selectedCats.length === 0 || selectedCats.includes(name)))
        .filter(([name]) => isRetry || !analyses[`${sys}::${name}`]) // pula já analisadas (exceto no retry)
        .map(([name, val]) => {
          const ticketsNoPeriodo = getTicketsInPeriod(val.tickets, period);
          return {
            name,
            samples: sampleTickets(ticketsNoPeriodo, 5),
            total:   ticketsNoPeriodo.length,
            last30:  countInRange(ticketsNoPeriodo, 30),
          };
        })
        .filter((c) => c.total > 0);

      // Conta quantas foram puladas por já terem análise (para informar no toast)
      const jaAnalisadas = isRetry ? 0 : Object.entries(data[sys] || {})
        .filter(([name]) => selectedCats.length === 0 || selectedCats.includes(name))
        .filter(([name]) => analyses[`${sys}::${name}`]).length;

      if (allCats.length === 0) {
        toast({
          title:       jaAnalisadas > 0 ? "Tudo já analisado" : "Sem chamados no período",
          description: jaAnalisadas > 0
            ? `Todas as categorias selecionadas já possuem análise. Nenhum token foi gasto.`
            : `Nenhuma categoria com chamados nos últimos ${period} dias para ${sys}.`,
          status:      jaAnalisadas > 0 ? "info" : "warning",
          duration:    4000,
        });
        setBulkLoading(false);
        return;
      }

      const escopoLabel = isRetry
        ? `${allCats.length} categorias que falharam`
        : selectedCats.length > 0
          ? `${selectedCats.length} categorias selecionadas`
          : "todas as categorias";

      toast({
        title:       `${allCats.length} categorias a analisar`,
        description: jaAnalisadas > 0
          ? `Analisando ${escopoLabel} — ${jaAnalisadas} já analisadas foram puladas (economia de tokens).`
          : `Analisando ${escopoLabel} — últimos ${period} dias. Categorias sem atividade serão ignoradas.`,
        status:      "info",
        duration:    5000,
      });

      // Analisa UMA categoria por requisição — elimina ambiguidade de matching.
      // Se a resposta vier vazia/truncada, tenta novamente até ANALYSIS_RETRIES vezes.
      const ANALYSIS_RETRIES = 3;
      let totalAnalysed = 0;
      const falharam    = [];

      for (let i = 0; i < allCats.length; i++) {
        const cat = allCats[i];

        toast({
          title:       `Analisando ${i + 1} de ${allCats.length}…`,
          description: cat.name.length > 45 ? cat.name.substring(0, 45) + "…" : cat.name,
          status:      "info",
          duration:    3000,
        });

        let salvou = false;

        for (let tentativa = 1; tentativa <= ANALYSIS_RETRIES && !salvou; tentativa++) {
          try {
            const result   = await analyzeCategories(sys, [cat]);
            const analysis = normalizeAnalysisResult(result, cat.name);

            // Só salva se a análise tem conteúdo real (motivo preenchido)
            if (analysis && analysis.motivo) {
              setAnalyses((prev) => ({ ...prev, [`${sys}::${cat.name}`]: analysis }));
              totalAnalysed++;
              salvou = true;
            } else {
              console.warn(`Análise vazia para "${cat.name}" (tentativa ${tentativa}/${ANALYSIS_RETRIES})`, result);
              if (tentativa < ANALYSIS_RETRIES) await new Promise((r) => setTimeout(r, 4000));
            }
          } catch (e) {
            // Erro de autenticação/quota: para tudo — não adianta continuar
            if (String(e.message).includes("401") || String(e.message).includes("403")) throw e;

            console.error(`Erro ao analisar "${cat.name}" (tentativa ${tentativa}/${ANALYSIS_RETRIES}):`, e.message);
            if (tentativa < ANALYSIS_RETRIES) await new Promise((r) => setTimeout(r, 6000));
          }
        }

        if (!salvou) falharam.push(cat.name);

        // Pausa entre categorias para respeitar o rate limit do Gemini
        if (i < allCats.length - 1) {
          await new Promise((r) => setTimeout(r, 2500));
        }
      }

      setFailedCats(falharam);

      toast({
        title:       "Análise em lote concluída!",
        description: falharam.length > 0
          ? `${totalAnalysed} analisadas · ${falharam.length} falharam. Use "Repetir falhas" no topo para tentar de novo.`
          : `${totalAnalysed} categorias analisadas para ${sys} (últimos ${period} dias).`,
        status:      falharam.length > 0 ? "warning" : "success",
        duration:    7000,
      });
    } catch (e) {
      toast({ title: "Erro na análise em lote", description: String(e.message), status: "error", duration: 6000 });
    } finally {
      setBulkLoading(false);
    }
  }, [data, filters.system, filters.period, filters.categories, analyses, analyzeCategories, toast]);

  // Gera e baixa um relatório HTML formatado para impressão/PDF
  // com apenas as categorias que já foram analisadas pela IA.
  const downloadReport = useCallback(() => {
    const sys = filters.system;
    if (!sys) {
      toast({ title: "Selecione um sistema para exportar", status: "warning", duration: 3000 });
      return;
    }

    // Coleta apenas categorias que têm análise da IA
    const analysedCategories = Object.entries(data[sys] || {})
      .map(([name, val]) => ({
        name,
        total:    val.tickets.length,
        last30:   countInRange(val.tickets, 30),
        analysis: analyses[`${sys}::${name}`] || null,
      }))
      .filter((c) => c.analysis !== null)
      .sort((a, b) => {
        const order = { Alta: 0, Média: 1, Baixa: 2 };
        return (order[a.analysis.prioridade] ?? 3) - (order[b.analysis.prioridade] ?? 3);
      });

    if (analysedCategories.length === 0) {
      toast({ title: "Nenhuma análise disponível", description: "Solicite ao menos uma análise IA antes de exportar.", status: "warning", duration: 4000 });
      return;
    }

    const geradoEm = new Date().toLocaleString("pt-BR");
    const periodo  = filters.period || "30";

    const priorityColor = { Alta: "#DC2626", Média: "#D97706", Baixa: "#16A34A" };
    const priorityBg    = { Alta: "#FEF2F2", Média: "#FFFBEB", Baixa: "#F0FDF4" };

    const categorySections = analysedCategories.map((c, i) => `
      <div class="category" style="page-break-inside: avoid; margin-bottom: 28px; border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden;">
        <div class="cat-header" style="background: #F9FAFB; padding: 14px 18px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: 600; color: #6366F1; background: #EEF2FF; padding: 2px 8px; border-radius: 999px;">${sys}</span>
              <span style="font-size: 11px; font-weight: 700; color: ${priorityColor[c.analysis.prioridade] || '#374151'}; background: ${priorityBg[c.analysis.prioridade] || '#F9FAFB'}; padding: 2px 8px; border-radius: 999px;">
                ● ${c.analysis.prioridade || '—'}
              </span>
            </div>
            <div style="font-size: 15px; font-weight: 700; color: #111827;">${c.analysis.titulo || c.name}</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">${c.name}</div>
          </div>
          <div style="text-align: right; margin-left: 16px;">
            <div style="font-size: 26px; font-weight: 800; color: #6366F1; line-height: 1;">${c.total}</div>
            <div style="font-size: 10px; color: #9CA3AF;">chamados</div>
            <div style="font-size: 11px; color: #374151; margin-top: 4px;">${c.last30} nos últimos ${periodo}d</div>
          </div>
        </div>
        <div style="padding: 16px 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div style="background: #FEF2F2; border-radius: 8px; padding: 12px;">
            <div style="font-size: 10px; font-weight: 700; color: #DC2626; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Causa Raiz</div>
            <div style="font-size: 12px; color: #374151; line-height: 1.6;">${c.analysis.motivo}</div>
          </div>
          <div style="background: #F0FDFA; border-radius: 8px; padding: 12px;">
            <div style="font-size: 10px; font-weight: 700; color: #0D9488; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Sugestão de Automação</div>
            <div style="font-size: 12px; color: #374151; line-height: 1.6;">${c.analysis.sugestao}</div>
          </div>
        </div>
      </div>
    `).join("");

    const totalAlta  = analysedCategories.filter((c) => c.analysis.prioridade === "Alta").length;
    const totalMedia = analysedCategories.filter((c) => c.analysis.prioridade === "Média").length;
    const totalBaixa = analysedCategories.filter((c) => c.analysis.prioridade === "Baixa").length;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório SRE — ${sys} — ${geradoEm}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #111827; padding: 40px; max-width: 900px; margin: 0 auto; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>

  <!-- Botão de imprimir (só aparece na tela, não no PDF) -->
  <div class="no-print" style="margin-bottom: 24px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="background: #6366F1; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer;">
      ⬇ Salvar como PDF
    </button>
    <button onclick="window.close()" style="background: #F3F4F6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-family: inherit; font-size: 14px; cursor: pointer;">
      Fechar
    </button>
  </div>

  <!-- Cabeçalho do relatório -->
  <div style="border-bottom: 3px solid #6366F1; padding-bottom: 20px; margin-bottom: 28px;">
    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <div style="width: 32px; height: 32px; background: #6366F1; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px;">V</div>
          <span style="font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em;">Vivo SRE Dashboard</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: #111827;">Relatório de Análise SRE</h1>
        <p style="font-size: 14px; color: #6B7280; margin-top: 4px;">Sistema: <strong style="color: #111827;">${sys}</strong> · Gerado em ${geradoEm}</p>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 32px; font-weight: 800; color: #6366F1;">${analysedCategories.length}</div>
        <div style="font-size: 11px; color: #6B7280;">categorias analisadas</div>
      </div>
    </div>
  </div>

  <!-- Resumo executivo -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px;">
    <div style="background: #FEF2F2; border-radius: 10px; padding: 16px; text-align: center;">
      <div style="font-size: 28px; font-weight: 800; color: #DC2626;">${totalAlta}</div>
      <div style="font-size: 11px; font-weight: 600; color: #DC2626; text-transform: uppercase; margin-top: 2px;">Prioridade Alta</div>
    </div>
    <div style="background: #FFFBEB; border-radius: 10px; padding: 16px; text-align: center;">
      <div style="font-size: 28px; font-weight: 800; color: #D97706;">${totalMedia}</div>
      <div style="font-size: 11px; font-weight: 600; color: #D97706; text-transform: uppercase; margin-top: 2px;">Prioridade Média</div>
    </div>
    <div style="background: #F0FDF4; border-radius: 10px; padding: 16px; text-align: center;">
      <div style="font-size: 28px; font-weight: 800; color: #16A34A;">${totalBaixa}</div>
      <div style="font-size: 11px; font-weight: 600; color: #16A34A; text-transform: uppercase; margin-top: 2px;">Prioridade Baixa</div>
    </div>
  </div>

  <!-- Categorias analisadas -->
  <h2 style="font-size: 14px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB;">
    Categorias Analisadas — ordenadas por prioridade
  </h2>

  ${categorySections}

  <!-- Rodapé -->
  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; font-size: 11px; color: #9CA3AF;">
    <span>Vivo SRE Dashboard · Análise gerada pelo Gemini AI</span>
    <span>Gerado em ${geradoEm}</span>
  </div>

</body>
</html>`;

    // Abre o relatório em nova aba
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");
    if (!win) {
      toast({ title: "Pop-up bloqueado", description: "Permita pop-ups para este site e tente novamente.", status: "warning", duration: 5000 });
    }
    // Libera memória após 60s
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [data, filters.system, analyses, toast]);

  const handleFilterChange = useCallback((key, value) => setFilters((f) => ({ ...f, [key]: value })), []);
  const handleFilterReset  = useCallback(() => setFilters(INITIAL_FILTERS), []);

  // Salva as análises no localStorage sempre que mudam (por modo)
  useEffect(() => {
    saveStoredAnalyses(activeMode, analyses);
  }, [analyses, activeMode]);

  // Ao trocar de modo: limpa dados/filtros e carrega as análises SALVAS do novo modo
  const handleModeChange = useCallback((newMode) => {
    setActiveMode(newMode);
    setData({});
    setAnalyses(loadStoredAnalyses(newMode)); // recupera análises persistidas
    setFilters(INITIAL_FILTERS);
    setLastSync(null);
    setSheetError(null);
  }, []);

  // Limpa as análises do modo atual (memória + localStorage)
  const handleClearAnalyses = useCallback(() => {
    setAnalyses({});
    clearStoredAnalyses(activeMode);
    toast({ title: "Análises limpas", description: `As análises de ${MODE_CONFIG[activeMode]?.label} foram removidas.`, status: "info", duration: 3000 });
  }, [activeMode, toast]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box minH="100vh" bg={bg} fontFamily="'Inter', sans-serif">

      {/* HEADER */}
      <Box bg={cardBg} borderBottomWidth="1px" borderColor={border} px="6" py="4" position="sticky" top="0" zIndex="100" shadow="sm">
        <Flex align="center" justify="space-between">
          <HStack spacing="3">
            <Box w="8" h="8" borderRadius="lg" bg="purple.500" display="flex" alignItems="center" justifyContent="center">
              <Text color="white" fontWeight="800" fontSize="14px">V</Text>
            </Box>
            <Box>
              <Flex align="center" gap="2">
                <Text fontWeight="700" fontSize="lg" lineHeight="1.2">Vivo SRE Dashboard</Text>
                <Badge colorScheme="purple" borderRadius="full" fontSize="10px">
                  {MODE_CONFIG[activeMode]?.label}
                </Badge>
              </Flex>
              <Flex align="center" gap="1.5" mt="0.5">
                {sheetLoading ? (
                  <>
                    <Spinner size="xs" color="blue.400" />
                    <Text fontSize="11px" color="blue.500">Atualizando dados…</Text>
                  </>
                ) : lastSync ? (
                  <>
                    <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
                    <Text fontSize="11px" color="gray.500">Atualizado em {lastSync}</Text>
                  </>
                ) : (
                  <Text fontSize="11px" color="gray.500">Planilha não carregada</Text>
                )}
              </Flex>
            </Box>
          </HStack>
          <HStack spacing="2">
            <Button
              size="sm" borderRadius="lg"
              variant={mockMode ? "solid" : "outline"}
              colorScheme={mockMode ? "orange" : "gray"}
              onClick={() => {
                setMockMode((v) => !v);
                toast({
                  title:       mockMode ? "Modo Mock desativado" : "Modo Mock ativado",
                  description: mockMode
                    ? "As análises agora usarão o Gemini real."
                    : "As análises usarão dados simulados — nenhum token será gasto.",
                  status:  mockMode ? "info" : "warning",
                  duration: 3000,
                });
              }}
            >
              {mockMode ? "🧪 Mock ON" : "🧪 Mock"}
            </Button>
            <Button
              size="sm" variant="outline" colorScheme="blue" borderRadius="lg"
              isLoading={sheetLoading} loadingText="Carregando…"
              onClick={loadSheetData}
            >
              {lastSync ? "↻ Sincronizar Planilha" : "⬇ Carregar Planilha"}
            </Button>
            <Button size="sm" variant="outline" colorScheme="teal" borderRadius="lg" onClick={downloadReport}>
              ⬇ Exportar Relatório
            </Button>
            <Button
              size="sm" colorScheme="purple" borderRadius="lg"
              isLoading={bulkLoading} loadingText="Analisando…"
              onClick={() => requestBulkAnalysis()}
            >
              Análise IA em lote
            </Button>
            {failedCats.length > 0 && !bulkLoading && (
              <Button
                size="sm" colorScheme="orange" variant="outline" borderRadius="lg"
                onClick={() => requestBulkAnalysis(failedCats)}
              >
                ↻ Repetir falhas ({failedCats.length})
              </Button>
            )}
            {Object.keys(analyses).length > 0 && (
              <Button size="sm" variant="ghost" colorScheme="red" borderRadius="lg" onClick={handleClearAnalyses}>
                🗑 Limpar análises
              </Button>
            )}
            {ACCESS_PASSWORD && (
              <Button
                size="sm" variant="ghost" colorScheme="gray" borderRadius="lg"
                onClick={() => {
                  try { sessionStorage.removeItem(AUTH_STORAGE_KEY); } catch (_) { /* ignora */ }
                  window.location.reload();
                }}
              >
                Sair
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>

      <Box maxW="1600px" mx="auto" px="6" py="6">

        {/* Banner modo Mock */}
        {mockMode && (
          <Alert status="warning" borderRadius="xl" mb="5" variant="left-accent">
            <AlertIcon />
            <AlertDescription fontSize="sm">
              <strong>Modo Mock ativo</strong> — as análises IA estão usando dados simulados.
              Nenhuma chamada real está sendo feita ao Gemini e nenhum token está sendo gasto.
              Clique em <strong>🧪 Mock ON</strong> no header para voltar ao modo real.
            </AlertDescription>
          </Alert>
        )}

        {/* Erro */}
        {sheetError && (
          <Alert status="error" borderRadius="xl" mb="5" variant="left-accent">
            <AlertIcon />
            <AlertDescription fontSize="sm">
              Erro ao carregar planilha: <strong>{sheetError}</strong>.{" "}
              Verifique se a planilha está pública e as variáveis de ambiente estão configuradas.
            </AlertDescription>
          </Alert>
        )}

        {/* Estado vazio inicial */}
        {!sheetLoading && !lastSync && !sheetError && (
          <Alert status="info" borderRadius="xl" mb="5" variant="left-accent">
            <AlertIcon />
            <AlertDescription fontSize="sm">
              Clique em <strong>"⬇ Carregar Planilha"</strong> para importar os dados do Google Sheets.
            </AlertDescription>
          </Alert>
        )}

        {/* Lembrete de filtro */}
        {lastSync && !filters.system && (
          <Alert status="info" borderRadius="xl" mb="5" variant="left-accent">
            <AlertIcon />
            <AlertDescription fontSize="sm">
              Selecione ao menos um <strong>Sistema</strong> nos filtros para habilitar a análise em lote.
            </AlertDescription>
          </Alert>
        )}

        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
          allCategories={allCategories}
          activeMode={activeMode}
          onModeChange={handleModeChange}
          systems={SYSTEMS}
        />

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing="4" mb="6">
          <StatCard label={periodDays >= 9999 ? "Total de chamados" : `Chamados (${periodDays}d)`} value={totalTickets.toLocaleString("pt-BR")} color="purple" />
          <StatCard label="Últimos 30 dias"        value={tickets30.count.toLocaleString("pt-BR")} delta={tickets30.delta} color="blue" />
          <StatCard label="Categorias ativas"      value={filteredCards.length} color="teal" />
          <StatCard label={`${MODE_CONFIG[activeMode]?.label} — Analisadas`} value={`${analysedCount}/${filteredCards.length}`} color="orange" />
        </SimpleGrid>

        <Tabs colorScheme="purple" variant="soft-rounded" defaultIndex={0}>
          <TabList mb="5" bg={cardBg} p="1" borderRadius="xl" borderWidth="1px" borderColor={border} gap="1">
            <Tab fontSize="sm" borderRadius="lg">Visão Geral</Tab>
            <Tab fontSize="sm" borderRadius="lg">Chamados por Categoria</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px="0">
              <OverviewCharts data={periodData} systems={SYSTEMS} />
            </TabPanel>

            <TabPanel px="0">
              {filteredCards.length === 0 ? (
                <Box textAlign="center" py="16" color="gray.400">
                  <Text>Nenhuma categoria encontrada com os filtros atuais.</Text>
                </Box>
              ) : (
                <>
                  <Flex justify="space-between" align="center" mb="4">
                    <Text fontSize="sm" color="gray.500">
                      {filteredCards.length} categorias · {analysedCount} analisadas pela IA
                    </Text>
                    {analysedCount < filteredCards.length && (
                      <Text fontSize="xs" color="purple.500">
                        {filteredCards.length - analysedCount} aguardando análise
                      </Text>
                    )}
                  </Flex>
                  <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="4">
                    {filteredCards.map(({ sys, cat, val, key, analysis }) => (
                      <AnalysisCard
                        key={key}
                        systemName={sys}
                        categoryName={cat}
                        categoryData={val}
                        analysis={analysis}
                        isLoading={!!loadingKeys[key]}
                        onRequestAnalysis={() => requestAnalysis(sys, cat)}
                      />
                    ))}
                  </SimpleGrid>
                </>
              )}
            </TabPanel>

          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
}

// =============================================================================
// TELA DE LOGIN + WRAPPER DE AUTENTICAÇÃO
//
// Protege o dashboard com uma senha única (VITE_ACCESS_PASSWORD).
// O acesso liberado fica salvo no navegador (sessionStorage) — a pessoa não
// precisa digitar a senha a cada ação, só uma vez por sessão do navegador.
// =============================================================================

const AUTH_STORAGE_KEY = "vivo-dashboard-auth";

function LoginScreen({ onLogin }) {
  const [senha, setSenha]   = useState("");
  const [erro, setErro]     = useState(false);
  const bg      = useColorModeValue("gray.50", "gray.900");
  const cardBg  = useColorModeValue("white", "gray.800");
  const border  = useColorModeValue("gray.200", "gray.700");

  function tentarLogin() {
    if (senha === ACCESS_PASSWORD) {
      try { sessionStorage.setItem(AUTH_STORAGE_KEY, "ok"); } catch (_) { /* ignora */ }
      onLogin();
    } else {
      setErro(true);
      setSenha("");
    }
  }

  return (
    <Box minH="100vh" bg={bg} display="flex" alignItems="center" justifyContent="center" fontFamily="'Inter', sans-serif" px="4">
      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" shadow="lg" maxW="380px" w="full">
        <CardBody p="8">
          <VStack spacing="5" align="stretch">
            <VStack spacing="2">
              <Box w="12" h="12" borderRadius="xl" bg="purple.500" display="flex" alignItems="center" justifyContent="center">
                <Text color="white" fontWeight="800" fontSize="22px">V</Text>
              </Box>
              <Heading size="md" textAlign="center">Vivo SRE Dashboard</Heading>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Digite a senha de acesso para continuar
              </Text>
            </VStack>

            <Box>
              <input
                type="password"
                autoFocus
                placeholder="Senha de acesso"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErro(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") tentarLogin(); }}
                style={{
                  width: "100%", padding: "10px 14px", fontSize: "14px",
                  border: erro ? "1.5px solid #E53E3E" : "1.5px solid #CBD5E0",
                  borderRadius: "10px", outline: "none", fontFamily: "inherit",
                }}
              />
              {erro && (
                <Text fontSize="xs" color="red.500" mt="2">Senha incorreta. Tente novamente.</Text>
              )}
            </Box>

            <Button colorScheme="purple" borderRadius="lg" onClick={tentarLogin} w="full">
              Entrar
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}

export default function VivoDashboard() {
  // Se não há senha configurada, libera direto (modo desenvolvimento).
  // Senão, verifica se já autenticou nesta sessão do navegador.
  const [autenticado, setAutenticado] = useState(() => {
    if (!ACCESS_PASSWORD) return true;
    try { return sessionStorage.getItem(AUTH_STORAGE_KEY) === "ok"; } catch (_) { return false; }
  });

  if (!autenticado) {
    return <LoginScreen onLogin={() => setAutenticado(true)} />;
  }
  return <DashboardApp />;
}
