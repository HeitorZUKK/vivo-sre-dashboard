import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// Logo da Zukk (palavra "ZUKK" sobre o azul-marinho da marca), embutida em base64
const LOGO_ZUKK = "data:image/png;base64,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";
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
  Menu, MenuButton, MenuList, MenuItem, MenuDivider,
} from "@chakra-ui/react";
import Chart from "react-apexcharts";
import {
  classificarLinhas, getCategoryDescription, normCatKey, filtrarPorExecutor, indiceColuna,
} from "./classificacao.js";
import Painel from "./Painel.jsx";

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

// Configuração por modo — cada modo tem sua própria chave Gemini e aba da planilha.
// Fly e Atlas agora são modos separados. O Atlas já está pronto para uso futuro:
// basta configurar VITE_SHEET_NAME_ATLAS e VITE_GEMINI_API_KEY_ATLAS quando houver planilha.
const MODE_CONFIG = {
  "Fly": {
    geminiKey:  import.meta.env.VITE_GEMINI_API_KEY_FLY      || "",
    sheetName:  import.meta.env.VITE_SHEET_NAME_FLY          || "resultado",
    systems:    ["Fly"],
    label:      "Fly",
    colDate:    0,  // coluna A — data
    colComment: 1,  // coluna B — comentários
    colId:      2,  // coluna C — chamado_id
  },
  "Atlas": {
    geminiKey:  import.meta.env.VITE_GEMINI_API_KEY_ATLAS    || "",
    sheetName:  import.meta.env.VITE_SHEET_NAME_ATLAS        || "",  // sem planilha ainda
    systems:    ["Atlas"],
    label:      "Atlas",
    colDate:    0,  // ajustar quando a planilha do Atlas existir
    colComment: 1,
    colId:      2,
    naoConfigurado: !import.meta.env.VITE_SHEET_NAME_ATLAS,  // flag: planilha ainda não definida
  },
  "Valoriza": {
    geminiKey:  import.meta.env.VITE_GEMINI_API_KEY_VALORIZA || "",
    sheetName:  import.meta.env.VITE_SHEET_NAME_VALORIZA     || "valoriza",
    systems:    ["Valoriza"],
    label:      "Valoriza",
    colDate:    5,  // coluna F — "Resolvido" (número serial do Excel)
    colComment: 7,  // coluna H — "Comentários" com PROBLEMA/AÇÃO/CATEGORIA
    colId:      0,  // coluna A — "Número" (INC...)
  },
};

// Modo padrão ao abrir o dashboard
const DEFAULT_MODE = "Fly";

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
      motivo:     `[MOCK] Esta categoria teve ${cat.total} chamados no período selecionado. No modo de teste, nenhuma chamada real é feita à IA. A causa raiz real seria analisada pela IA com base nas amostras de texto dos chamados.`,
      sugestao:   `[MOCK] Sugestão simulada para "${cat.name.substring(0, 40)}…". Desligue o modo de teste para obter sugestões reais.`,
      prioridade: cat.total > 10 ? "Alta" : cat.total > 3 ? "Média" : "Baixa",
    };
  });
  return result;
}

/**
 * Simula a análise detalhada por subtipo no modo Mock — sem chamar o Gemini.
 * Divide os chamados em 2-3 subtipos fictícios com causa raiz e sugestão.
 */
async function callGeminiMockSubgroups(categoryName, tickets) {
  await new Promise((r) => setTimeout(r, 1000));
  const ids = tickets.map((t) => t.id.replace("#", ""));
  const terco = Math.ceil(ids.length / 3) || 1;
  const subs = [];
  const fatias = [ids.slice(0, terco), ids.slice(terco, terco * 2), ids.slice(terco * 2)];
  const nomes  = ["Subtipo A (mock)", "Subtipo B (mock)", "Outros / Diversos (mock)"];
  fatias.forEach((fatia, i) => {
    if (fatia.length === 0) return;
    subs.push({
      nome:       nomes[i],
      motivo:     `[MOCK] Causa raiz simulada para ${fatia.length} chamados de "${categoryName.substring(0, 30)}". Desligue o modo de teste para análise real.`,
      sugestao:   `[MOCK] Sugestão de automação simulada. No modo real, a IA analisa o texto dos chamados.`,
      prioridade: fatia.length > 8 ? "Alta" : fatia.length > 3 ? "Média" : "Baixa",
      ids:        fatia,
    });
  });
  return subs;
}
// =============================================================================
// SEÇÃO 2 — CLASSIFICAÇÃO
// As regras de categoria ficam em classificacao.js (arquivo compartilhado com o
// script de análise semanal). Edite lá para mudar como os chamados são agrupados.
// =============================================================================

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
 * Olha só a parte que descreve o que foi feito ("AÇÃO REALIZADA:"), ou o
 * começo do comentário quando não há esse campo — o resto do texto (respostas
 * longas do suporte) citava "status", "alterar" etc. e jogava quase tudo no
 * mesmo subgrupo.
 * @returns {string} label do subgrupo, ou "Outros" se nada bater.
 */
function trechoParaSubgrupo(texto) {
  const t = String(texto || "");
  const acao = t.match(/A[ÇC][ÃA]O REALIZADA:\s*([^\n\r]+)/i);
  const problema = t.match(/PROBLEMA REPORTADO:\s*([^\n\r]+)/i);
  const base = acao ? acao[1] : problema ? problema[1] : t.substring(0, 200);
  return base.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function deduzirSubgrupo(texto) {
  const txt = trechoParaSubgrupo(texto);
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
 * Busca os dados da planilha para o modo selecionado e classifica cada chamado.
 * A classificação usa classificarLinhas() de classificacao.js — a MESMA função
 * do script de análise, então as categorias batem com as análises publicadas.
 */
async function fetchSheetData(mode) {
  if (!SHEETS_API_KEY || !SPREADSHEET_ID) {
    throw new Error("Variáveis de ambiente não configuradas (VITE_SHEETS_API_KEY / VITE_SPREADSHEET_ID).");
  }
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG[DEFAULT_MODE];
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `/values/${encodeURIComponent(cfg.sheetName)}?key=${SHEETS_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const json = await res.json();
  // Remove o cabeçalho e descarta chamados que não são da Zukk (executor Vivo,
  // Minsait, Nenhum ou vazio): não entram em nenhuma contagem, gráfico ou análise.
  const { cabecalho, rows } = filtrarPorExecutor(json.values || []);

  const sistema = cfg.systems[0];
  const tickets = classificarLinhas(rows, {
    mode, colDate: cfg.colDate, colComment: cfg.colComment, colId: cfg.colId,
    colTitulo: indiceColuna(cabecalho, "chamado_titulo"),
    colPedido: indiceColuna(cabecalho, "chamado_descricao"),
  });

  const data = { [sistema]: {} };
  tickets.forEach((t) => {
    const ticket = { ...t, system: sistema, detalhe: extrairDetalhe(t.description) };
    if (!data[sistema][t.category]) data[sistema][t.category] = { tickets: [] };
    data[sistema][t.category].tickets.push(ticket);
  });
  return data;
}

// =============================================================================
// SEÇÃO 4 — GEMINI API
// Análise SRE: envia categorias e retorna causa raiz, sugestão e prioridade.
// =============================================================================

// Endpoint da Serverless Function que faz a chamada à IA com segurança.
// A chave da API vive no servidor (Vercel), nunca no navegador.
const ANALYZE_ENDPOINT      = "/api/analyze";
const SAVE_ANALYSIS_ENDPOINT = "/api/save-analysis"; // publica a análise compartilhada
const GET_ANALYSIS_ENDPOINT  = "/api/get-analysis";  // lê a análise compartilhada

// Guarda o último uso de tokens reportado pelo servidor (para exibir no dashboard)
let ultimoUsoTokens = null;
export function getUltimoUsoTokens() { return ultimoUsoTokens; }

// ── Helper de retry ───────────────────────────────────────────────────────────

/**
 * Envia o prompt à Serverless Function, que chama a Claude e conta os tokens.
 * O segundo parâmetro (geminiKey) foi mantido na assinatura por compatibilidade
 * com as chamadas existentes, mas NÃO é mais usado — a chave fica no servidor.
 * @param {string} promptText
 * @param {string} _unusedKey  - ignorado (compatibilidade)
 * @param {number} maxTokens
 */
async function callGemini(promptText, _unusedKey, maxTokens = 4096, injectFly = false) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Timeout de 60s por tentativa — evita requisição pendurada indefinidamente
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 60_000);

    let response;
    try {
      response = await fetch(ANALYZE_ENDPOINT, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt: promptText, maxTokens, injectFly }),
        signal:  controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError" && attempt < MAX_RETRIES) {
        console.warn(`IA timeout — tentativa ${attempt}/${MAX_RETRIES}`);
        continue;
      }
      throw new Error(err.name === "AbortError"
        ? "A IA demorou demais para responder (timeout). Tente uma janela menor (7 dias) ou menos categorias."
        : `Erro de rede ao chamar a IA: ${err.message}`);
    }
    clearTimeout(timeoutId);

    const data = await response.json();

    if (response.ok) {
      ultimoUsoTokens = data.uso || null; // guarda o consumo reportado pelo servidor
      return parseGeminiJSON(data.text || "");
    }

    // Limite diário atingido — bloqueia sem retry (não adianta insistir)
    if (data?.bloqueado || response.status === 429) {
      throw new Error(
        `Limite diário de tokens atingido (${data?.usados || "?"}/${data?.limite || "?"}). ` +
        "As análises voltam amanhã ou aumente o limite no servidor."
      );
    }

    // Erros transitórios do servidor — tenta de novo
    if ((response.status === 503 || response.status === 500) && attempt < MAX_RETRIES) {
      const waitMs = attempt * RETRY_DELAY_MS;
      console.warn(`IA erro ${response.status} — tentativa ${attempt}/${MAX_RETRIES}, aguardando ${waitMs / 1000}s…`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    throw new Error(`Erro na análise (${response.status}): ${data?.error || "desconhecido"}`);
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

/**
 * Pede à IA para subcategorizar os chamados de uma categoria.
 * Retorna { subcategorias: [{ nome, descricao, ids }] } ou null.
 */
async function callGeminiForSubgroups(mode, categoryName, tickets, geminiKey) {
  const ticketList = ticketsForSubgrouping(tickets);
  if (ticketList.length === 0) return null;
  // Injeta o conhecimento do Fly (do servidor) quando não é Valoriza
  const injectFly = mode !== "Valoriza";
  // Usa 8192 tokens — a resposta tem vários subtipos + listas de IDs e é maior
  const result = await callGemini(buildSubgroupPrompt(mode, categoryName, ticketList), geminiKey, 8192, injectFly);
  console.log(`[SUBGRUPOS] "${categoryName}" — resposta bruta:`, result);

  // Extrai o array de subcategorias, tolerando formatos diferentes
  let subs = null;
  if (result?.subcategorias && Array.isArray(result.subcategorias)) subs = result.subcategorias;
  else if (Array.isArray(result)) subs = result;
  else if (result && typeof result === "object") {
    for (const val of Object.values(result)) {
      if (Array.isArray(val) && val.length > 0 && val[0]?.nome) { subs = val; break; }
    }
  }
  if (!subs) return null;

  // Valida os IDs: a IA às vezes renumera ou inventa IDs. Mantém só os que
  // foram realmente enviados, garantindo que o filtro por subtipo funcione.
  const idsValidos = new Set(ticketList.map((t) => String(t.id)));
  subs = subs.map((s) => ({
    ...s,
    ids: (s.ids || []).map((id) => String(id).replace("#", "")).filter((id) => idsValidos.has(id)),
  }));

  // Remove subtipos que ficaram sem nenhum chamado válido após a limpeza
  return subs.filter((s) => s.ids.length > 0);
}

// =============================================================================
// SEÇÃO 5 — UTILITÁRIOS
// Funções puras de cálculo — sem dependências de React.
// =============================================================================

function countInRange(tickets, days) {
  if (!tickets || tickets.length === 0) return 0;
  // Ancora no chamado mais recente (não em "hoje"), igual ao getTicketsInPeriod,
  // para as contagens ficarem estáveis entre atualizações da planilha.
  let maisRecente = tickets[0].date;
  for (const t of tickets) {
    if (t.date > maisRecente) maisRecente = t.date;
  }
  const cutoff = new Date(maisRecente);
  cutoff.setDate(cutoff.getDate() - days);
  return tickets.filter((t) => t.date >= cutoff).length;
}

/**
 * Retorna apenas os tickets dentro do período (dias).
 * Usado para limitar o que é enviado à IA — evita gastar tokens com histórico antigo.
 */
// Filtra os chamados dentro de uma janela de N dias.
// A janela é ancorada no CHAMADO MAIS RECENTE da lista (não em "hoje"), para que
// os chamados não "sumam" com o passar dos dias entre uma atualização e outra da
// planilha. Assim, "últimos 7 dias" = os 7 dias anteriores ao chamado mais novo,
// e fica estável a semana toda até a planilha ser atualizada de novo.
function getTicketsInPeriod(tickets, days) {
  if (!tickets || tickets.length === 0) return [];
  if (days >= 9999) return tickets; // "todo histórico"

  // Acha a data do chamado mais recente
  let maisRecente = tickets[0].date;
  for (const t of tickets) {
    if (t.date > maisRecente) maisRecente = t.date;
  }

  const cutoff = new Date(maisRecente);
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

/**
 * Monta a lista de chamados (com ID e texto) para a IA subcategorizar.
 * Quando há muitos chamados, faz uma amostragem distribuída em vez de mandar
 * todos — respostas muito grandes truncavam ou faziam a requisição travar.
 * Prioriza sempre incluir o começo (mais recentes) e distribui o resto.
 */
function ticketsForSubgrouping(tickets, maxTickets = 25, maxCharsEach = 160) {
  if (tickets.length <= maxTickets) {
    return tickets.map((t) => ({
      id:    t.id.replace("#", ""),
      texto: t.description.trim().substring(0, maxCharsEach),
    }));
  }
  // Amostragem distribuída: pega maxTickets espalhados ao longo do conjunto
  const step = tickets.length / maxTickets;
  const sampled = [];
  for (let i = 0; i < maxTickets; i++) {
    const t = tickets[Math.floor(i * step)];
    sampled.push({
      id:    t.id.replace("#", ""),
      texto: t.description.trim().substring(0, maxCharsEach),
    });
  }
  return sampled;
}

/**
 * Prompt de ANÁLISE DETALHADA POR SUBTIPO.
 * A IA agrupa os chamados de uma categoria em subtipos e, para CADA subtipo,
 * fornece causa raiz e sugestão de automação — no estilo da planilha de referência.
 */
// NOTA: o conhecimento do Fly (subcategorias canônicas + princípios) agora vive no
// servidor, no arquivo api/fly-knowledge.md, e é injetado pela Serverless Function
// quando injectFly=true. Editar aquele .md muda a classificação sem tocar aqui.

function buildSubgroupPrompt(mode, categoryName, ticketList) {
  const contexto = mode === "Valoriza"
    ? `Você é um especialista em operações do programa Vivo Valoriza (benefícios do App Vivo).
As sugestões devem focar em: melhoria de comunicação, FAQ, ajuste no fluxo do app, ou processo de triagem. Não use linguagem de infraestrutura técnica.`
    : `Você é um Engenheiro de Confiabilidade de Sistemas (SRE) do ecossistema Vivo Fly.
O Fly gerencia sites da Vivo: SOI (gestão de candidatos), SCI/FCU (fase contratual), Camunda BPM (workflow/stages), banco (tabelas sharing_outdoor_collo/bts, candidato, empresa).
Padrões conhecidos: erro de altitude (campo com letras), município/distrito ausente no Science, [object Object] (caractere especial <br>), mapa não carrega (coordenadas positivas/com vírgula), Feign NULL (campo fcu preenchido ao disparar SCI), unique query result (empresa duplicada no VivoGo), subprocesso em andamento (múltiplas modalidades na SOI), botão não aparece (grupo Camunda ≠ grupo do usuário).
As sugestões devem ser técnicas e acionáveis (automação, validação, regra de negócio).
As subcategorias canônicas e princípios de classificação foram fornecidos acima.`;

  return `${contexto}

Abaixo estão os chamados reais da categoria "${categoryName}". Sua tarefa é:
1. AGRUPAR os chamados em SUBTIPOS específicos e técnicos (com base no que cada um descreve)
2. Para CADA subtipo, fornecer a análise completa: causa raiz e sugestão de automação

REGRAS:
- Crie de 2 a 8 subtipos, cada um representando um problema distinto dentro da categoria
- Prefira os nomes das SUBCATEGORIAS CANÔNICAS acima quando o caso encaixar; crie um nome novo só se nenhum servir
- Siga os PRINCÍPIOS DE CLASSIFICAÇÃO: separe por causa (não por ação), um caso por subtipo, evite "Outros"
- Um chamado pertence a exatamente UM subtipo; liste os IDs de cada um
- CRÍTICO: use EXATAMENTE os valores de "id" fornecidos na lista abaixo, sem alterar, renumerar ou inventar. Copie o id exatamente como aparece.
- Chamados que realmente não se encaixam vão em "Outros / Diversos"

CHAMADOS (id + texto):
${JSON.stringify(ticketList, null, 2)}

RETORNE APENAS JSON PURO, SEM MARKDOWN, NESTE FORMATO EXATO:
{
  "subcategorias": [
    {
      "nome": "Nome do subtipo",
      "motivo": "Causa raiz técnica detalhada (1-2 frases)",
      "sugestao": "Sugestão de automação ou correção concreta (1-2 frases)",
      "prioridade": "Alta",
      "ids": ["6962", "6963"]
    }
  ]
}
A "prioridade" deve ser exatamente "Alta", "Média" ou "Baixa" (Alta = muitos chamados ou bloqueia fluxo; Baixa = pontual).`;
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
  // Cores da marca primeiro (turquesa e azul-marinho), depois cores de apoio
  "#2C98A5", "#04142E", "#58C8D8", "#5A6A8E",
  "#F59E0B", "#EF4444", "#16A34A", "#A3E2EB", "#1B6670",
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

// ── Ícones (SVG simples, sem emoji) ───────────────────────────────────────────

export function IconChevron({ up = false, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true"
      style={{ transform: up ? "rotate(180deg)" : "none", flexShrink: 0 }}>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.8 5.2 4 7.4 8.2 2.8" fill="none" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Cor de cada prioridade (bolinha ao lado do subtipo)
export const PRIORITY_COLOR = { Alta: "red.500", "Média": "orange.400", Baixa: "green.500" };

export function PriorityDot({ priority, size = "8px" }) {
  return <Box w={size} h={size} borderRadius="full" flexShrink={0}
    bg={PRIORITY_COLOR[priority] || "gray.300"} title={priority ? `Prioridade ${priority}` : undefined} />;
}

// Remove o prefixo do subtipo ("SOI · Erro X" → "Erro X"): o card já diz a categoria
export function nomeCurtoSubtipo(nome) {
  const partes = String(nome || "").split(" · ");
  return partes.length > 1 ? partes.slice(1).join(" · ") : String(nome || "");
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, deltaLabel = "vs 30 dias anteriores", color = "brand" }) {
  const bg          = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  return (
    <Card bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" shadow="sm">
      <CardBody>
        <Stat>
          <StatLabel fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
            {label}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="700" color={`${color}.600`}>
            {value}
          </StatNumber>
          {delta !== null && delta !== undefined && (
            <StatHelpText mb="0">
              <StatArrow type={delta >= 0 ? "increase" : "decrease"} />
              {Math.abs(delta)}% {deltaLabel}
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
  const hoverBg               = useColorModeValue("brand.50", "brand.900");

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
        _hover={{ borderColor: "brand.400" }}
        minH="32px"
      >
        <Text fontSize="sm" color={selected.length === 0 ? "gray.400" : "inherit"} noOfLines={1}>
          {label}
        </Text>
        <Box color="gray.400" ml="2"><IconChevron up={open} /></Box>
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
              borderColor={allSelected ? "brand.500" : border}
              bg={allSelected ? "brand.500" : "transparent"}
              display="flex" alignItems="center" justifyContent="center" flexShrink={0}
            >
              {allSelected && <Box color="white"><IconCheck /></Box>}
            </Box>
            <Text fontSize="12px" fontWeight="600" color="brand.600">
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
                    borderColor={isSelected ? "brand.500" : border}
                    bg={isSelected ? "brand.500" : "transparent"}
                    display="flex" alignItems="center" justifyContent="center"
                  >
                    {isSelected && <Box color="white"><IconCheck /></Box>}
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
        <Box w="3" h="3" borderRadius="full" bg="brand.500" />
        <Heading size="sm" fontWeight="600">Filtros</Heading>
        <Button size="xs" variant="ghost" colorScheme="gray" ml="auto" onClick={onReset}>
          Limpar filtros
        </Button>
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="4">

        {/* Seletor de Modo — controla qual sistema/planilha/IA é usado */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500">Sistema</FormLabel>
          <Select
            size="sm" borderRadius="lg" value={activeMode}
            onChange={(e) => onModeChange(e.target.value)}
            fontWeight="600" color="brand.600"
          >
            {Object.keys(MODE_CONFIG).map((m) => (
              <option key={m} value={m}>{MODE_CONFIG[m].label}</option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" color="gray.500">
            Categoria
            {filters.categories.length > 0 && (
              <Badge ml="2" colorScheme="brand" borderRadius="full" fontSize="9px">
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
          <FormLabel fontSize="xs" color="gray.500">Prioridade</FormLabel>
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

function AnalysisCard({ systemName, categoryName, categoryData, fullTickets, analysis, onRequestAnalysis, isLoading, anchor, periodDays }) {
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

  // Subgrupos da IA (se a análise os gerou) têm prioridade sobre a dedução por texto.
  // Formato IA: [{ nome, descricao, ids }]. Convertidos para o formato de exibição.
  const subgruposIA = useMemo(() => {
    if (!analysis?.subcategorias?.length) return null;
    const total = analysis.subcategorias.reduce((acc, s) => acc + (s.ids?.length || 0), 0) || 1;
    return analysis.subcategorias.map((s) => ({
      label:      s.nome,
      desc:       s.descricao || null,
      motivo:     s.motivo || null,
      sugestao:   s.sugestao || null,
      prioridade: s.prioridade || null,
      ids:        (s.ids || []).map((id) => String(id).replace("#", "")),
      count:      (s.ids || []).length,
      pct:        Math.round(((s.ids || []).length / total) * 100),
      fromIA:     true,
    })).sort((a, b) => b.count - a.count);
  }, [analysis]);

  const subgruposTexto = useMemo(() => calcularSubgrupos(categoryData.tickets), [categoryData.tickets]);
  const subgrupos = subgruposIA || subgruposTexto;
  const descricao = getCategoryDescription(categoryName);

  // Tickets filtrados pelo subgrupo selecionado (se houver).
  // Subgrupo da IA filtra por lista de IDs contra o HISTÓRICO COMPLETO (fullTickets),
  // pois a análise pode ter usado uma janela (7/30d) diferente do período do filtro.
  const visibleTickets = useMemo(() => {
    if (!selectedSubgroup) return categoryData.tickets;
    const sg = subgrupos.find((s) => s.label === selectedSubgroup);
    const base = fullTickets || categoryData.tickets;
    if (sg?.fromIA) {
      const idSet = new Set(sg.ids);
      return base.filter((t) => idSet.has(t.id.replace("#", "")));
    }
    return categoryData.tickets.filter((t) => deduzirSubgrupo(t.description) === selectedSubgroup);
  }, [categoryData.tickets, fullTickets, selectedSubgroup, subgrupos]);

  // Base da tabela quando há subtipo selecionado: subtipo da IA usa o histórico
  // completo (os IDs vêm da janela da análise); subtipo automático usa o período.
  const baseFiltro = selectedSubgroup && subgrupos.find((s) => s.label === selectedSubgroup)?.fromIA
    ? (fullTickets || categoryData.tickets)
    : categoryData.tickets;
  // A tendência acompanha o subtipo selecionado
  const trend            = getMonthlyTrend(selectedSubgroup ? visibleTickets : (fullTickets || categoryData.tickets));
  const totalPages       = Math.ceil(visibleTickets.length / TICKETS_PER_PAGE);
  const paginatedTickets = visibleTickets.slice(
    ticketPage * TICKETS_PER_PAGE,
    (ticketPage + 1) * TICKETS_PER_PAGE
  );

  // Variação do período atual vs o período anterior de mesmo tamanho
  const delta = useMemo(() => {
    if (!anchor || !periodDays || periodDays >= 9999) return null;
    const fim    = new Date(anchor);
    const corte  = new Date(anchor); corte.setDate(corte.getDate() - periodDays);
    const inicio = new Date(corte);  inicio.setDate(inicio.getDate() - periodDays);
    const base   = fullTickets || categoryData.tickets;
    const atual    = base.filter((t) => t.date >= corte && t.date <= fim).length;
    const anterior = base.filter((t) => t.date >= inicio && t.date < corte).length;
    return { atual, anterior, diff: atual - anterior };
  }, [anchor, periodDays, fullTickets, categoryData.tickets]);

  const subsOrdenados = useMemo(() => (
    analysis?.subcategorias?.length
      ? [...analysis.subcategorias].sort((a, b) => (b.ids?.length || 0) - (a.ids?.length || 0))
      : []
  ), [analysis]);

  return (
    <Card bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" shadow="sm"
      overflow="hidden" h="100%" display="flex" flexDirection="column">
      <CardBody p="4" flex="1">
        {/* Nome + número do período */}
        <Flex justify="space-between" align="flex-start" gap="3">
          <Box minW="0">
            <Text fontWeight="700" fontSize="md" lineHeight="1.3" noOfLines={2}>{categoryName}</Text>
            {delta && (
              <Text fontSize="xs" mt="1" color={delta.diff > 0 ? "red.500" : delta.diff < 0 ? "green.600" : "gray.500"}>
                {delta.diff === 0
                  ? "igual ao período anterior"
                  : `${delta.diff > 0 ? "+" : ""}${delta.diff} vs período anterior`}
              </Text>
            )}
          </Box>
          <Text fontSize="3xl" fontWeight="700" color="brand.600" lineHeight="1">
            {categoryData.tickets.length}
          </Text>
        </Flex>

        <Divider my="3" borderColor={borderColor} />

        {/* Principais subtipos (da análise da IA) */}
        {subsOrdenados.length > 0 ? (
          <VStack align="stretch" spacing="2">
            {subsOrdenados.slice(0, 3).map((s, i) => (
              <Flex key={i} align="center" gap="2" fontSize="13px">
                <PriorityDot priority={s.prioridade} />
                <Text color={textColor} noOfLines={1} flex="1" title={s.nome}>{nomeCurtoSubtipo(s.nome)}</Text>
                <Text color="gray.500" fontWeight="600">{s.ids?.length || 0}</Text>
              </Flex>
            ))}
          </VStack>
        ) : (
          <Flex align="center" justify="space-between">
            <Text fontSize="13px" color="gray.400">Sem análise</Text>
            {isLoading ? (
              <Spinner size="sm" color="brand.500" />
            ) : (
              <Menu>
                <MenuButton as={Button} size="xs" variant="ghost" colorScheme="brand"
                  rightIcon={<IconChevron size={10} />}>
                  Analisar
                </MenuButton>
                <MenuList fontSize="13px">
                  <MenuItem onClick={() => onRequestAnalysis(7)}>Últimos 7 dias</MenuItem>
                  <MenuItem onClick={() => onRequestAnalysis(30)}>Últimos 30 dias</MenuItem>
                </MenuList>
              </Menu>
            )}
          </Flex>
        )}
      </CardBody>

      <CardFooter pt="0" pb="3" px="4">
        <Button size="sm" variant="link" colorScheme="brand" onClick={onOpen} fontWeight="600">
          {subsOrdenados.length > 3 ? `Ver os ${subsOrdenados.length} subtipos e chamados` : "Ver detalhes e chamados"}
        </Button>
      </CardFooter>

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="md">{categoryName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            <Text fontSize="sm" color="gray.500" mb="1">
              {categoryData.tickets.length} chamados no período
              {analysis?.analisadoEm ? ` · análise dos últimos ${analysis.detailDays || 30} dias, feita em ${analysis.analisadoEm}` : ""}
            </Text>
            {descricao && (
              <Text fontSize="sm" color={textColor} mb="4">{descricao}</Text>
            )}

            {/* Subtipos analisados pela IA (causa raiz + sugestão de cada). Clicáveis para filtrar. */}
            {subgrupos.length >= 1 && (
              <Box mb="4">
                <Flex justify="space-between" align="center" mb="2">
                  <HStack spacing="2">
                    <Text fontSize="11px" fontWeight="600" color="gray.500" textTransform="uppercase">
                      Subtipos
                    </Text>
                    <Text fontSize="11px" color="gray.400">
                      {subgruposIA ? "gerados pela IA" : "agrupamento automático"}
                    </Text>
                  </HStack>
                  {selectedSubgroup && (
                    <Button size="xs" variant="ghost" colorScheme="brand" height="18px" fontSize="10px"
                      onClick={() => { setSelectedSubgroup(null); setTicketPage(0); }}>
                      Limpar filtro
                    </Button>
                  )}
                </Flex>
                <VStack spacing="1.5" align="stretch">
                  {subgrupos.map((sg) => {
                    const isActive = selectedSubgroup === sg.label;
                    return (
                      <Box
                        key={sg.label} cursor="pointer" p="2" borderRadius="md"
                        bg={isActive ? "brand.50" : "transparent"}
                        borderWidth="1px" borderColor={isActive ? "brand.300" : "transparent"}
                        _hover={{ bg: isActive ? "brand.50" : statBg }}
                        onClick={() => {
                          setSelectedSubgroup(isActive ? null : sg.label);
                          setTicketPage(0);
                          setExpandedTicket(null);
                        }}
                      >
                        <Flex justify="space-between" align="center" gap="2" mb="1">
                          {sg.prioridade && <PriorityDot priority={sg.prioridade} />}
                          <Text fontSize="13px" color={textColor} fontWeight={isActive ? "700" : "500"} flex="1" title={sg.label}>
                            {sg.fromIA ? nomeCurtoSubtipo(sg.label) : sg.label}
                          </Text>
                          <Text fontSize="12px" color="gray.500" whiteSpace="nowrap">{sg.count} ({sg.pct}%)</Text>
                        </Flex>
                        <Box bg={statBg} borderRadius="full" h="6px" overflow="hidden" mb={isActive ? "2" : "0"}>
                          <Box bg={isActive ? "brand.500" : "brand.400"} h="6px" borderRadius="full" width={`${sg.pct}%`} />
                        </Box>
                        {/* Ao expandir um subtipo da IA, mostra causa raiz e sugestão */}
                        {isActive && sg.fromIA && (sg.motivo || sg.sugestao) && (
                          <VStack align="stretch" spacing="2" mt="2">
                            {sg.motivo && (
                              <Box p="2" bg={causeRootBg} borderRadius="md">
                                <Text fontSize="10px" fontWeight="700" color="red.600" mb="0.5">CAUSA RAIZ</Text>
                                <Text fontSize="12px" lineHeight="1.4">{sg.motivo}</Text>
                              </Box>
                            )}
                            {sg.sugestao && (
                              <Box p="2" bg={suggestionBg} borderRadius="md">
                                <Text fontSize="10px" fontWeight="700" color="teal.600" mb="0.5">SUGESTÃO DE AUTOMAÇÃO</Text>
                                <Text fontSize="12px" lineHeight="1.4">{sg.sugestao}</Text>
                              </Box>
                            )}
                          </VStack>
                        )}
                        {/* Subtipo por texto (sem IA) mostra só a descrição curta */}
                        {!sg.fromIA && sg.desc && (
                          <Text fontSize="11px" color="gray.500" mt="1" lineHeight="1.4">{sg.desc}</Text>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
                <Text fontSize="10px" color="gray.400" mt="2">
                  {subgruposIA ? "Clique em um subtipo para ver a causa raiz e filtrar os chamados abaixo." : ""}
                </Text>
                {selectedSubgroup && (
                  <Text fontSize="10px" color="brand.500" mt="1">
                    Mostrando apenas os chamados de "{nomeCurtoSubtipo(selectedSubgroup)}".
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

            <Divider my="4" />

            <Flex justify="space-between" align="center" mb="3">
              <Text fontWeight="600" fontSize="sm">
                Chamados ({visibleTickets.length}{selectedSubgroup ? ` de ${baseFiltro.length}` : ""})
              </Text>
              {totalPages > 1 && (
                <HStack spacing="1">
                  <Button size="xs" variant="outline" isDisabled={ticketPage === 0}
                    onClick={() => setTicketPage((p) => p - 1)}>Anterior</Button>
                  <Text fontSize="xs" color="gray.500">{ticketPage + 1} / {totalPages}</Text>
                  <Button size="xs" variant="outline" isDisabled={ticketPage >= totalPages - 1}
                    onClick={() => setTicketPage((p) => p + 1)}>Próxima</Button>
                </HStack>
              )}
            </Flex>

            <Table size="xs" sx={{ tableLayout: "fixed" }}>
              <Thead>
                <Tr>
                  <Th w="90px"  whiteSpace="nowrap" px="2">ID</Th>
                  <Th w="85px"  whiteSpace="nowrap" px="2">Data</Th>
                  <Th w="100px" whiteSpace="nowrap" px="2">Detalhe</Th>
                  <Th whiteSpace="nowrap" px="2">Descrição</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedTickets.map((t, i) => {
                  // Um chamado pode ter vários comentários: a chave da linha precisa ser única
                  const rowKey = `${t.id}-${t.date.getTime()}-${i}`;
                  return (
                  <Tr key={rowKey} _hover={{ bg: statBg }} cursor="pointer"
                    onClick={() => setExpandedTicket(expandedTicket === rowKey ? null : rowKey)}>
                    <Td px="2"><Text fontSize="11px" fontFamily="mono" color="brand.500" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{t.id}</Text></Td>
                    <Td px="2" fontSize="11px" whiteSpace="nowrap">{t.date.toLocaleDateString("pt-BR")}</Td>
                    <Td px="2">
                      {t.detalhe && (
                        <Badge colorScheme="brand" variant="subtle" fontSize="9px" borderRadius="full" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" maxW="100%">
                          {t.detalhe}
                        </Badge>
                      )}
                    </Td>
                    <Td px="2" fontSize="11px">
                      {expandedTicket === rowKey ? (
                        <Box>
                          {(t.titulo || t.pedido) && (
                            <Box mb="2" p="2" bg={statBg} borderRadius="md">
                              <Text fontSize="10px" fontWeight="700" color="gray.500" textTransform="uppercase">Pedido do usuário</Text>
                              {t.titulo && <Text fontWeight="600">{t.titulo}</Text>}
                              {t.pedido && <Text whiteSpace="pre-wrap" lineHeight="1.5">{t.pedido}</Text>}
                            </Box>
                          )}
                          <Text fontSize="10px" fontWeight="700" color="gray.500" textTransform="uppercase">Encerramento</Text>
                          <Text whiteSpace="pre-wrap" lineHeight="1.5">{t.description}</Text>
                          <Text fontSize="10px" color="brand.400" mt="1">Clique para recolher</Text>
                        </Box>
                      ) : (
                        <Box>
                          {t.titulo && <Text fontWeight="600" noOfLines={1}>{t.titulo}</Text>}
                          <Text noOfLines={2} color={textColor}>{t.description}</Text>
                          {t.description.length > 100 && (
                            <Text fontSize="10px" color="brand.400" mt="0.5">Clique para expandir</Text>
                          )}
                        </Box>
                      )}
                    </Td>
                  </Tr>
                  );
                })}
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

// Corta textos longos só quando passam do limite
function encurtar(txt, max) {
  return txt.length > max ? txt.substring(0, max - 1) + "…" : txt;
}

function OverviewCharts({ data, systems }) {
  const systemsToShow = systems.filter((s) => data[s]);

  // Gráfico de barras: top categorias por volume total (histórico completo)
  const volumeByCategory = useMemo(() => {
    const result = [];
    systemsToShow.forEach((sys) => {
      if (!data[sys]) return;
      Object.entries(data[sys]).forEach(([cat, val]) => {
        if (val.tickets.length > 0)
          result.push({ name: encurtar(cat, 40), count: val.tickets.length });
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
      labels: sorted.map(([k]) => encurtar(k, 30)),
      values: sorted.map(([, v]) => v),
    };
  }, [data, systemsToShow]);

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="6" mb="6">
      <Box>
        <Chart
          type="bar"
          height={Math.max(250, volumeByCategory.length * 35)}
          options={barChartOptions(volumeByCategory.map((x) => x.name), "Categorias com mais chamados")}
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
          options={donutChartOptions(donutData.labels, "Distribuição por categoria")}
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

const INITIAL_FILTERS = { system: MODE_CONFIG[DEFAULT_MODE]?.systems[0] || "Fly", categories: [], period: "90", priority: "" };

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

// ── Análise COMPARTILHADA (banco Upstash via Serverless Function) ──────────────
// Diferente do localStorage (que é por navegador), a análise compartilhada fica
// num banco e é a mesma para todos os usuários.

// Lê a análise compartilhada do modo. Retorna { analyses, atualizadoEm } ou null.
async function fetchSharedAnalyses(mode) {
  try {
    const res = await fetch(`${GET_ANALYSIS_ENDPOINT}?modo=${encodeURIComponent(mode)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { analyses: data.analyses || {}, atualizadoEm: data.atualizadoEm || null };
  } catch (_) {
    return null; // sem banco configurado ou erro de rede — segue com o local
  }
}

// Publica as análises atuais no banco compartilhado (todos passam a ver estas).
async function publishSharedAnalyses(mode, analyses) {
  const res = await fetch(SAVE_ANALYSIS_ENDPOINT, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ modo: mode, analyses }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Erro ao publicar (${res.status})`);
  }
  return res.json();
}

function DashboardApp() {
  // ── Estado ──────────────────────────────────────────────────────────────────
  const [activeMode,      setActiveMode]      = useState(DEFAULT_MODE); // "Fly", "Atlas" ou "Valoriza"
  const [data,            setData]            = useState({});
  const [sheetLoading,    setSheetLoading]    = useState(false);
  const [sheetError,      setSheetError]      = useState(null);
  const [lastSync,        setLastSync]        = useState(null);
  const [analyses,        setAnalyses]        = useState(() => loadStoredAnalyses(DEFAULT_MODE));
  const [loadingKeys,     setLoadingKeys]     = useState({});
  const [lastDetailDays,  setLastDetailDays]  = useState(30); // janela usada na última análise em lote
  const [bulkLoading,     setBulkLoading]     = useState(false);
  const [mockMode,        setMockMode]        = useState(false); // quando true, substitui Gemini por dados simulados
  const [failedCats,      setFailedCats]      = useState([]);    // categorias que falharam na última análise em lote
  const [filters,         setFilters]         = useState(INITIAL_FILTERS);
  const [publishing,      setPublishing]      = useState(false); // publicando análise compartilhada
  const [sharedUpdatedAt, setSharedUpdatedAt] = useState(null);  // quando a análise compartilhada foi atualizada

  const toast  = useToast();
  const bg     = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  // ── Derivados ────────────────────────────────────────────────────────────────

  // Cada modo tem exatamente um sistema. O sistema ativo é sempre o do modo.
  const SYSTEMS         = MODE_CONFIG[activeMode]?.systems || ["Fly"];
  const activeSystem    = SYSTEMS[0]; // sistema único do modo
  const filteredSystems = [activeSystem];

  // Mantém filters.system sincronizado com o sistema do modo ativo,
  // já que o filtro visual de sistema foi removido.
  useEffect(() => {
    if (filters.system !== activeSystem) {
      setFilters((f) => ({ ...f, system: activeSystem }));
    }
  }, [activeSystem, filters.system]);

  const periodDays = parseInt(filters.period || "90");

  // periodData: cópia de `data` contendo apenas tickets dentro do período selecionado.
  // Alimenta TUDO na tela (cards, contagens, gráficos, lista) para que o filtro de
  // período afete a visualização inteira — não só a IA.
  // Categorias que ficam sem nenhum ticket no período são removidas.
  // Data do chamado mais recente da planilha — as janelas de período partem dela
  const anchor = useMemo(() => {
    let maisRecente = null;
    Object.values(data).forEach((cats) =>
      Object.values(cats).forEach((val) =>
        val.tickets.forEach((t) => {
          if (!maisRecente || t.date > maisRecente) maisRecente = t.date;
        })
      )
    );
    return maisRecente;
  }, [data]);

  const periodData = useMemo(() => {
    // "Todo o histórico" (9999) — não filtra nada
    if (periodDays >= 9999) return data;
    const maisRecente = anchor;
    if (!maisRecente) return {};

    const cutoff = new Date(maisRecente);
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
  }, [data, periodDays, anchor]);

  const allCategories = useMemo(() => {
    const cats = new Set();
    Object.values(periodData).forEach((sys) => Object.keys(sys).forEach((c) => cats.add(c)));
    return [...cats].sort();
  }, [periodData]);

  // Índice das análises por chave NORMALIZADA — permite casar a análise publicada
  // pelo script (nomes em maiúsculas, com descrição) com o card do dashboard,
  // mesmo quando a grafia da categoria difere.
  const analysesNorm = useMemo(() => {
    const idx = {};
    Object.entries(analyses).forEach(([key, val]) => {
      const [sys, ...rest] = key.split("::");
      const cat = rest.join("::");
      idx[`${sys}::${normCatKey(cat)}`] = val;
    });
    return idx;
  }, [analyses]);

  const filteredCards = useMemo(() => {
    const cards = [];
    filteredSystems.forEach((sys) => {
      if (!periodData[sys]) return;
      Object.entries(periodData[sys]).forEach(([cat, val]) => {
        if (filters.categories.length > 0 && !filters.categories.includes(cat)) return;
        const key      = `${sys}::${cat}`;
        // Busca a análise: primeiro exata, depois por nome normalizado (casa com o script)
        const analysis = analyses[key] || analysesNorm[`${sys}::${normCatKey(cat)}`];
        if (filters.priority) {
          const temPrioridade = analysis?.prioridade === filters.priority ||
            (analysis?.subcategorias || []).some((sub) => sub.prioridade === filters.priority);
          if (!temPrioridade) return;
        }
        // fullVal = histórico completo da categoria (do `data`, não do periodData filtrado).
        // Usado para as janelas 30/60/90 do card, que devem sempre refletir o histórico.
        const fullVal = data[sys]?.[cat] || val;
        cards.push({ sys, cat, val, fullVal, key, analysis });
      });
    });
    // Ordena do maior para o menor volume de chamados
    return cards.sort((a, b) => b.val.tickets.length - a.val.tickets.length);
  }, [periodData, data, filteredSystems, filters, analyses, analysesNorm]);

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

  const loadSheetData = useCallback(async ({ silencioso = false } = {}) => {
    // Modo sem planilha configurada (ex: Atlas ainda não implantado)
    if (MODE_CONFIG[activeMode]?.naoConfigurado) {
      setSheetError(`O modo ${MODE_CONFIG[activeMode].label} ainda não tem planilha configurada. Defina VITE_SHEET_NAME_ATLAS e VITE_GEMINI_API_KEY_ATLAS quando a planilha estiver pronta.`);
      toast({
        title:       `${MODE_CONFIG[activeMode].label} em preparação`,
        description: "Este sistema ainda não foi configurado. A estrutura já está pronta para quando houver planilha.",
        status:      "info",
        duration:    5000,
      });
      return;
    }

    setSheetLoading(true);
    setSheetError(null);
    try {
      const result = await fetchSheetData(activeMode);
      setData(result);
      setLastSync(new Date());
      if (!silencioso) {
        const total = Object.values(result).reduce(
          (acc, sys) => acc + Object.values(sys).reduce((a, v) => a + v.tickets.length, 0), 0
        );
        toast({ title: "Dados atualizados", description: `${total} chamados carregados.`, status: "success", duration: 3000 });
      }
    } catch (e) {
      setSheetError(e.message);
      toast({ title: "Erro ao carregar planilha", description: e.message, status: "error", duration: 6000 });
    } finally {
      setSheetLoading(false);
    }
  }, [activeMode, toast]);

  // Carrega a planilha sozinho ao abrir o site e ao trocar de sistema
  useEffect(() => {
    loadSheetData({ silencioso: true });
  }, [loadSheetData]);

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

  // Análise detalhada por subtipo — a IA quebra a categoria em subtipos e dá
  // causa raiz + sugestão de cada um. `detailDays` é 7 ou 30 (janela da análise).
  const requestAnalysis = useCallback(async (system, categoryName, detailDays = 30) => {
    const key     = `${system}::${categoryName}`;
    const catData = data[system]?.[categoryName];
    if (!catData) return;

    const ticketsNoPeriodo = getTicketsInPeriod(catData.tickets, detailDays);

    if (ticketsNoPeriodo.length === 0) {
      toast({
        title:       "Sem chamados no período",
        description: `Nenhum chamado de "${categoryName.substring(0, 40)}…" nos últimos ${detailDays} dias.`,
        status:      "warning",
        duration:    4000,
      });
      return;
    }

    setLoadingKeys((prev) => ({ ...prev, [key]: true }));
    try {
      const geminiKey = MODE_CONFIG[activeMode]?.geminiKey || "";
      const subs = mockMode
        ? await callGeminiMockSubgroups(categoryName, ticketsNoPeriodo)
        : await callGeminiForSubgroups(activeMode, categoryName, ticketsNoPeriodo, geminiKey);

      if (subs && subs.length > 0) {
        const analysis = {
          detailDays,
          analisadoEm:   new Date().toLocaleString("pt-BR"),
          subcategorias: subs,
        };
        setAnalyses((prev) => ({ ...prev, [key]: analysis }));
        toast({ title: "Análise detalhada concluída", description: `${subs.length} subtipos em "${categoryName.substring(0, 35)}…" (${detailDays}d)`, status: "success", duration: 3500 });
      } else {
        toast({ title: "Nenhum subtipo identificado", description: "A IA não conseguiu detalhar esta categoria.", status: "warning", duration: 4000 });
      }
    } catch (e) {
      toast({ title: "Erro na análise IA", description: String(e.message), status: "error", duration: 5000 });
    } finally {
      setLoadingKeys((prev) => ({ ...prev, [key]: false }));
    }
  }, [data, mockMode, activeMode, toast]);

  // `detailDays` (7 ou 30): janela da análise detalhada.
  // `onlyThese` (opcional): array de nomes de categorias — usado por "Repetir falhas".
  const requestBulkAnalysis = useCallback(async (detailDays = 30, onlyThese = null) => {
    if (!filters.system) {
      toast({ title: "Selecione um sistema", description: "Configure o filtro antes de solicitar análise em lote.", status: "warning", duration: 4000 });
      return;
    }
    setBulkLoading(true);
    setFailedCats([]);
    try {
      const sys    = filters.system;
      const period = detailDays; // análise detalhada usa a janela escolhida (7 ou 30)

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

      // Analisa UMA categoria por requisição, gerando os subtipos com causa raiz.
      // ANALYSIS_RETRIES=2 porque o callGemini já tenta 3x internamente em erros
      // transitórios (503/429). Mais que isso multiplicaria o gasto de tokens.
      const ANALYSIS_RETRIES = 2;
      let totalAnalysed = 0;
      const falharam    = [];
      const geminiKey   = MODE_CONFIG[activeMode]?.geminiKey || "";

      for (let i = 0; i < allCats.length; i++) {
        const cat = allCats[i];
        const ticketsCat = getTicketsInPeriod(data[sys]?.[cat.name]?.tickets || [], detailDays);

        toast({
          title:       `Analisando ${i + 1} de ${allCats.length}…`,
          description: cat.name.length > 45 ? cat.name.substring(0, 45) + "…" : cat.name,
          status:      "info",
          duration:    3000,
        });

        let salvou = false;

        for (let tentativa = 1; tentativa <= ANALYSIS_RETRIES && !salvou; tentativa++) {
          try {
            const subs = mockMode
              ? await callGeminiMockSubgroups(cat.name, ticketsCat)
              : await callGeminiForSubgroups(sys === "Valoriza" ? "Valoriza" : activeMode, cat.name, ticketsCat, geminiKey);

            if (subs && subs.length > 0) {
              setAnalyses((prev) => ({
                ...prev,
                [`${sys}::${cat.name}`]: {
                  detailDays,
                  analisadoEm:   new Date().toLocaleString("pt-BR"),
                  subcategorias: subs,
                },
              }));
              totalAnalysed++;
              salvou = true;
            } else {
              console.warn(`Subtipos vazios para "${cat.name}" (tentativa ${tentativa}/${ANALYSIS_RETRIES})`);
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
      setLastDetailDays(detailDays); // guarda para o botão "Repetir falhas"

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
  }, [data, filters.system, filters.categories, analyses, mockMode, activeMode, toast]);

  // Gera um relatório HTML (para imprimir/salvar em PDF) que segue os FILTROS
  // da tela: período, categorias selecionadas e prioridade.
  const downloadReport = useCallback(() => {
    const sys = filters.system;
    const catsPeriodo = periodData[sys] || {};
    const nomes = Object.keys(catsPeriodo)
      .filter((n) => filters.categories.length === 0 || filters.categories.includes(n));

    if (nomes.length === 0) {
      toast({ title: "Nada para exportar", description: "Não há chamados com os filtros atuais.", status: "warning", duration: 4000 });
      return;
    }

    const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const fmt = (d) => d.toLocaleDateString("pt-BR");

    // Rótulo do período
    let periodoLabel = "Todo o histórico";
    if (periodDays < 9999 && anchor) {
      const ini = new Date(anchor); ini.setDate(ini.getDate() - periodDays);
      periodoLabel = `Últimos ${periodDays} dias (${fmt(ini)} a ${fmt(anchor)})`;
    }

    // Monta cada categoria: subtipos da IA contam só os chamados DENTRO do período
    const categorias = nomes.map((name) => {
      const tickets  = catsPeriodo[name].tickets;
      const idsNoPeriodo = new Set(tickets.map((t) => String(t.id).replace("#", "")));
      const analysis = analyses[`${sys}::${name}`] || analysesNorm[`${sys}::${normCatKey(name)}`] || null;
      let subs = (analysis?.subcategorias || [])
        .map((sub) => {
          const ids = (sub.ids || []).map((id) => String(id).replace("#", "")).filter((id) => idsNoPeriodo.has(id));
          return { ...sub, ids };
        })
        .filter((sub) => sub.ids.length > 0)
        .sort((a, b) => b.ids.length - a.ids.length);
      if (filters.priority) subs = subs.filter((sub) => sub.prioridade === filters.priority);
      return { name, total: tickets.length, subs };
    })
      .filter((c) => !filters.priority || c.subs.length > 0)
      .sort((a, b) => b.total - a.total);

    if (categorias.length === 0) {
      toast({ title: "Nada para exportar", description: "Nenhuma categoria com essa prioridade no período.", status: "warning", duration: 4000 });
      return;
    }

    const totalChamados = categorias.reduce((acc, c) => acc + c.total, 0);
    const comAnalise    = categorias.filter((c) => c.subs.length > 0);
    const todosSubs     = comAnalise.flatMap((c) => c.subs);
    const qtdPrioridade = (p) => todosSubs.filter((sub) => sub.prioridade === p).length;
    const geradoEm      = new Date().toLocaleString("pt-BR");

    const COR = { navy: "#04142E", turquesa: "#2C98A5", turquesaClaro: "#58C8D8", texto: "#1F2937", cinza: "#6B7280", borda: "#E5E7EB" };
    const priorityColor = { Alta: "#DC2626", "Média": "#D97706", Baixa: "#16A34A" };

    // Tabela-resumo com todas as categorias do período
    const linhasResumo = categorias.map((c) => `
      <tr>
        <td style="padding:7px 10px;border-bottom:1px solid ${COR.borda};font-weight:600;">${esc(c.name)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid ${COR.borda};text-align:right;font-weight:700;color:${COR.navy};">${c.total}</td>
        <td style="padding:7px 10px;border-bottom:1px solid ${COR.borda};color:${COR.cinza};">${c.subs[0] ? esc(nomeCurtoSubtipo(c.subs[0].nome)) : "sem análise"}</td>
      </tr>`).join("");

    // Seções detalhadas (só categorias com análise no período)
    const secoes = comAnalise.map((c) => `
      <div style="page-break-inside:avoid;margin-bottom:24px;border:1px solid ${COR.borda};border-radius:10px;overflow:hidden;">
        <div style="padding:12px 16px;border-bottom:3px solid ${COR.turquesa};display:flex;justify-content:space-between;align-items:baseline;">
          <div style="font-size:15px;font-weight:700;color:${COR.navy};">${esc(c.name)}</div>
          <div style="font-size:13px;color:${COR.cinza};"><strong style="font-size:20px;color:${COR.navy};">${c.total}</strong> chamados</div>
        </div>
        <div style="padding:12px 16px;">
          ${c.subs.map((sub) => `
            <div style="padding:10px 0;border-bottom:1px solid ${COR.borda};page-break-inside:avoid;">
              <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:6px;">
                <div style="font-size:13px;font-weight:700;color:${COR.texto};">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${priorityColor[sub.prioridade] || "#9CA3AF"};margin-right:6px;"></span>${esc(nomeCurtoSubtipo(sub.nome))}
                </div>
                <div style="font-size:12px;color:${COR.cinza};white-space:nowrap;">prioridade ${esc(String(sub.prioridade || "-").toLowerCase())} · <strong style="color:${COR.navy};">${sub.ids.length}</strong></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:11.5px;line-height:1.5;color:${COR.texto};">
                <div><div style="font-size:9.5px;font-weight:700;color:${COR.cinza};text-transform:uppercase;margin-bottom:2px;">Causa raiz</div>${esc(sub.motivo || "-")}</div>
                <div><div style="font-size:9.5px;font-weight:700;color:${COR.turquesa};text-transform:uppercase;margin-bottom:2px;">Sugestão de automação</div>${esc(sub.sugestao || "-")}</div>
              </div>
              <div style="font-size:10px;color:#9CA3AF;margin-top:5px;">Chamados: ${sub.ids.map(esc).join(", ")}</div>
            </div>`).join("")}
        </div>
      </div>`).join("");

    const filtrosLabel = [
      `Sistema: ${esc(sys)}`,
      `Período: ${esc(periodoLabel)}`,
      filters.categories.length ? `Categorias: ${filters.categories.map(esc).join(", ")}` : "Todas as categorias",
      filters.priority ? `Prioridade: ${esc(filters.priority)}` : null,
    ].filter(Boolean).join(" · ");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório de Reincidência - ${esc(sys)} - ${esc(periodoLabel)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: ${COR.texto}; padding: 32px; max-width: 900px; margin: 0 auto; }
    @media print { body { padding: 0; } .no-print { display: none !important; } @page { margin: 1.5cm; size: A4; }
      .capa { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:20px;display:flex;gap:10px;">
    <button onclick="window.print()" style="background:${COR.turquesa};color:#fff;border:none;padding:10px 20px;border-radius:8px;font:600 14px Inter,sans-serif;cursor:pointer;">Salvar como PDF</button>
    <button onclick="window.close()" style="background:#F3F4F6;color:#374151;border:none;padding:10px 20px;border-radius:8px;font:14px Inter,sans-serif;cursor:pointer;">Fechar</button>
  </div>

  <div class="capa" style="background:${COR.navy};color:#fff;border-radius:12px;padding:24px 28px;margin-bottom:24px;">
    <div style="font-size:22px;font-weight:300;letter-spacing:0.35em;color:${COR.turquesaClaro};margin-bottom:14px;">ZUKK</div>
    <div style="font-size:24px;font-weight:800;">Relatório de Reincidência</div>
    <div style="font-size:13px;color:#CBD5E1;margin-top:6px;">${filtrosLabel}</div>
    <div style="font-size:12px;color:#94A3B8;margin-top:4px;">Gerado em ${geradoEm}</div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px;">
    ${[["Chamados", totalChamados, COR.navy], ["Categorias", categorias.length, COR.navy],
       ["Subtipos alta", qtdPrioridade("Alta"), priorityColor.Alta], ["Subtipos média", qtdPrioridade("Média"), priorityColor["Média"]]]
      .map(([rot, val, cor]) => `<div style="border:1px solid ${COR.borda};border-radius:10px;padding:14px;">
        <div style="font-size:11px;font-weight:600;color:${COR.cinza};text-transform:uppercase;">${rot}</div>
        <div style="font-size:26px;font-weight:800;color:${cor};">${val}</div></div>`).join("")}
  </div>

  <h2 style="font-size:13px;font-weight:700;color:${COR.navy};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Resumo por categoria</h2>
  <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:28px;">
    <thead><tr style="text-align:left;color:${COR.cinza};font-size:11px;text-transform:uppercase;">
      <th style="padding:6px 10px;border-bottom:2px solid ${COR.turquesa};">Categoria</th>
      <th style="padding:6px 10px;border-bottom:2px solid ${COR.turquesa};text-align:right;">Chamados</th>
      <th style="padding:6px 10px;border-bottom:2px solid ${COR.turquesa};">Principal subtipo</th>
    </tr></thead>
    <tbody>${linhasResumo}</tbody>
  </table>

  ${comAnalise.length ? `<h2 style="font-size:13px;font-weight:700;color:${COR.navy};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Detalhamento da análise</h2>${secoes}` : ""}

  <div style="margin-top:28px;padding-top:12px;border-top:1px solid ${COR.borda};display:flex;justify-content:space-between;font-size:11px;color:#9CA3AF;">
    <span>Dashboard Reincidência · análise gerada por IA (Claude)</span>
    <span>${geradoEm}</span>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");
    if (!win) {
      toast({ title: "Pop-up bloqueado", description: "Permita pop-ups para este site e tente novamente.", status: "warning", duration: 5000 });
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [periodData, periodDays, anchor, filters, analyses, analysesNorm, toast]);

  const handleFilterChange = useCallback((key, value) => setFilters((f) => ({ ...f, [key]: value })), []);
  const handleFilterReset  = useCallback(() => setFilters(INITIAL_FILTERS), []);

  // Salva as análises no localStorage sempre que mudam (por modo)
  useEffect(() => {
    saveStoredAnalyses(activeMode, analyses);
  }, [analyses, activeMode]);

  // Ao montar e ao trocar de modo: busca a análise COMPARTILHADA do banco.
  // Se existir, ela tem prioridade e todos veem a mesma. Se não houver banco
  // configurado ou nada publicado, mantém o que veio do localStorage.
  useEffect(() => {
    let ativo = true;
    fetchSharedAnalyses(activeMode).then((shared) => {
      if (!ativo || !shared) return;
      if (shared.analyses && Object.keys(shared.analyses).length > 0) {
        setAnalyses(shared.analyses);
        setSharedUpdatedAt(shared.atualizadoEm);
      } else {
        setSharedUpdatedAt(null);
      }
    });
    return () => { ativo = false; };
  }, [activeMode]);

  // Ao trocar de modo: limpa dados/filtros e carrega as análises SALVAS do novo modo
  const handleModeChange = useCallback((newMode) => {
    setActiveMode(newMode);
    setData({});
    setAnalyses(loadStoredAnalyses(newMode)); // recupera análises persistidas
    setFilters({ ...INITIAL_FILTERS, system: MODE_CONFIG[newMode]?.systems[0] || "Fly" });
    setLastSync(null);
    setSheetError(null);
  }, []);

  // Limpa as análises do modo atual (memória + localStorage)
  const handleClearAnalyses = useCallback(() => {
    setAnalyses({});
    clearStoredAnalyses(activeMode);
    toast({ title: "Análises limpas", description: `As análises de ${MODE_CONFIG[activeMode]?.label} foram removidas.`, status: "info", duration: 3000 });
  }, [activeMode, toast]);

  // Publica as análises atuais no banco compartilhado — todos passam a ver estas.
  const handlePublishAnalyses = useCallback(async () => {
    if (Object.keys(analyses).length === 0) {
      toast({ title: "Nada para publicar", description: "Gere ao menos uma análise antes de publicar.", status: "warning", duration: 3000 });
      return;
    }
    setPublishing(true);
    try {
      const r = await publishSharedAnalyses(activeMode, analyses);
      setSharedUpdatedAt(r.atualizadoEm);
      toast({
        title:       "Análise publicada!",
        description: `${r.qtd} categorias agora visíveis para todos os usuários de ${MODE_CONFIG[activeMode]?.label}.`,
        status:      "success",
        duration:    5000,
      });
    } catch (e) {
      toast({ title: "Erro ao publicar", description: String(e.message), status: "error", duration: 6000 });
    } finally {
      setPublishing(false);
    }
  }, [analyses, activeMode, toast]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box minH="100vh" bg={bg} fontFamily="'Inter', sans-serif">

      {/* HEADER */}
      <Box bg="navy.900" color="white" px="6" py="3" position="sticky" top="0" zIndex="100" shadow="md">
        <Flex align="center" justify="space-between" gap="4" wrap="wrap">
          <HStack spacing="3">
            <img src={LOGO_ZUKK} alt="Zukk" style={{ height: "30px", width: "auto" }} />
            <Box w="1px" h="8" bg="whiteAlpha.300" />
            <Box>
              <Text fontWeight="700" fontSize="lg" lineHeight="1.2">Dashboard Reincidência</Text>
              <Flex align="center" gap="1.5" mt="0.5" fontSize="12px" color="navy.100" wrap="wrap">
                {sheetLoading ? (
                  <>
                    <Spinner size="xs" color="brand.300" />
                    <Text>Carregando dados…</Text>
                  </>
                ) : anchor ? (
                  <>
                    <Box w="6px" h="6px" borderRadius="full" bg="brand.400" />
                    <Text>Chamados até {anchor.toLocaleDateString("pt-BR")}</Text>
                  </>
                ) : (
                  <Text>Sem dados carregados</Text>
                )}
                {sharedUpdatedAt && (
                  <Text>· análise publicada em {new Date(sharedUpdatedAt).toLocaleDateString("pt-BR")}</Text>
                )}
              </Flex>
            </Box>
          </HStack>

          <HStack spacing="2">
            <Button size="sm" variant="outline" borderRadius="lg" color="white" borderColor="whiteAlpha.500"
              _hover={{ bg: "whiteAlpha.200" }} _active={{ bg: "whiteAlpha.300" }}
              isLoading={sheetLoading} loadingText="Atualizando"
              onClick={() => loadSheetData()}>
              Atualizar dados
            </Button>
            <Button size="sm" variant="outline" borderRadius="lg" color="white" borderColor="whiteAlpha.500"
              _hover={{ bg: "whiteAlpha.200" }} _active={{ bg: "whiteAlpha.300" }} onClick={downloadReport}>
              Exportar relatório
            </Button>
            <Menu>
              <MenuButton as={Button} size="sm" colorScheme="brand" borderRadius="lg"
                isLoading={bulkLoading || publishing} loadingText={bulkLoading ? "Analisando" : "Publicando"}
                rightIcon={<IconChevron />}>
                Ações da IA
              </MenuButton>
              <MenuList fontSize="sm" color="gray.800">
                <MenuItem onClick={() => requestBulkAnalysis(7)}>Analisar categorias sem análise (7 dias)</MenuItem>
                <MenuItem onClick={() => requestBulkAnalysis(30)}>Analisar categorias sem análise (30 dias)</MenuItem>
                {failedCats.length > 0 && (
                  <MenuItem onClick={() => requestBulkAnalysis(lastDetailDays, failedCats)}>
                    Repetir as que falharam ({failedCats.length})
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem isDisabled={Object.keys(analyses).length === 0} onClick={handlePublishAnalyses}>
                  Publicar análise para todos
                </MenuItem>
                <MenuItem isDisabled={Object.keys(analyses).length === 0} onClick={handleClearAnalyses} color="red.500">
                  Limpar análises deste navegador
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={() => {
                  setMockMode((v) => !v);
                  toast({
                    title:    mockMode ? "Modo de teste desligado" : "Modo de teste ligado",
                    description: mockMode ? "As análises voltam a usar a IA real." : "As análises usam dados simulados, sem gastar tokens.",
                    status:   "info",
                    duration: 3000,
                  });
                }}>
                  {mockMode ? "Desligar modo de teste" : "Ligar modo de teste (sem gastar tokens)"}
                </MenuItem>
              </MenuList>
            </Menu>
            {ACCESS_PASSWORD && (
              <Button size="sm" variant="ghost" borderRadius="lg" color="white" _hover={{ bg: "whiteAlpha.200" }}
                onClick={() => {
                  try { sessionStorage.removeItem(AUTH_STORAGE_KEY); } catch (_) { /* ignora */ }
                  window.location.reload();
                }}>
                Sair
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>

      <Box maxW="1600px" mx="auto" px="6" py="6">

        {mockMode && (
          <Alert status="warning" borderRadius="xl" mb="5" variant="left-accent">
            <AlertIcon />
            <AlertDescription fontSize="sm">
              <strong>Modo de teste ligado.</strong> As análises usam dados simulados e não gastam tokens.
              Para desligar, use o menu Ações da IA.
            </AlertDescription>
          </Alert>
        )}

        {sheetError && (
          <Alert status="error" borderRadius="xl" mb="5" variant="left-accent">
            <AlertIcon />
            <AlertDescription fontSize="sm">
              Não foi possível carregar a planilha: <strong>{sheetError}</strong>
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
          <StatCard label={periodDays >= 9999 ? "Chamados (todo o histórico)" : `Chamados (${periodDays} dias)`} value={totalTickets.toLocaleString("pt-BR")} color="navy" />
          <StatCard label="Últimos 30 dias" value={tickets30.count.toLocaleString("pt-BR")} delta={tickets30.delta} color="brand" />
          <StatCard label="Categorias" value={filteredCards.length} color="navy" />
          <StatCard label="Com análise da IA" value={`${analysedCount} de ${filteredCards.length}`} color="navy" />
        </SimpleGrid>

        <Tabs colorScheme="brand" variant="soft-rounded" defaultIndex={1} isLazy>
          <TabList mb="5" bg={cardBg} p="1" borderRadius="xl" borderWidth="1px" borderColor={border} gap="1">
            <Tab fontSize="sm" borderRadius="lg">Visão geral</Tab>
            <Tab fontSize="sm" borderRadius="lg">Chamados por categoria</Tab>
            <Tab fontSize="sm" borderRadius="lg">Painel</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px="0">
              <OverviewCharts data={periodData} systems={SYSTEMS} />
            </TabPanel>

            <TabPanel px="0">
              {filteredCards.length === 0 ? (
                <Box textAlign="center" py="16" color="gray.400">
                  <Text>{sheetLoading ? "Carregando…" : "Nenhuma categoria encontrada com os filtros atuais."}</Text>
                </Box>
              ) : (
                <>
                  <Flex justify="space-between" align="center" mb="4" wrap="wrap" gap="2">
                    <Text fontSize="sm" color="gray.500">
                      {filteredCards.length} categorias, da maior para a menor
                    </Text>
                    <HStack spacing="4" fontSize="xs" color="gray.500">
                      <Text>Prioridade:</Text>
                      {["Alta", "Média", "Baixa"].map((p) => (
                        <HStack key={p} spacing="1.5"><PriorityDot priority={p} /><Text>{p}</Text></HStack>
                      ))}
                    </HStack>
                  </Flex>
                  <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="4">
                    {filteredCards.map(({ sys, cat, val, fullVal, key, analysis }) => (
                      <AnalysisCard
                        key={key}
                        systemName={sys}
                        categoryName={cat}
                        categoryData={val}
                        fullTickets={fullVal.tickets}
                        analysis={analysis}
                        anchor={anchor}
                        periodDays={periodDays}
                        isLoading={!!loadingKeys[key]}
                        onRequestAnalysis={(dias) => requestAnalysis(sys, cat, dias)}
                      />
                    ))}
                  </SimpleGrid>
                </>
              )}
            </TabPanel>

            <TabPanel px="0">
              <Painel modos={MODOS_PAINEL} carregar={carregarSistemaPainel} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
}

// ── Dados para o Painel ───────────────────────────────────────────────────────
// Sistemas que têm planilha configurada (o Atlas fica de fora até ter planilha)
const MODOS_PAINEL = Object.keys(MODE_CONFIG)
  .filter((m) => !MODE_CONFIG[m].naoConfigurado)
  .map((m) => ({ id: m, label: MODE_CONFIG[m].label }));

// Carrega planilha + análise publicada de um sistema, no formato que o Painel usa
async function carregarSistemaPainel(mode) {
  const [data, shared] = await Promise.all([fetchSheetData(mode), fetchSharedAnalyses(mode)]);
  const sistema = MODE_CONFIG[mode].systems[0];
  const categorias = data[sistema] || {};
  const analises = shared?.analyses || {};
  const idx = {};
  Object.entries(analises).forEach(([key, val]) => {
    const cat = key.split("::").slice(1).join("::");
    idx[normCatKey(cat)] = val;
  });
  const tickets = Object.values(categorias).flatMap((c) => c.tickets);
  return {
    tickets,
    analisePorCategoria: (cat) => idx[normCatKey(cat)] || null,
    analisePublicadaEm: shared?.atualizadoEm || null,
  };
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
    <Box minH="100vh" bg="navy.900" display="flex" alignItems="center" justifyContent="center" fontFamily="'Inter', sans-serif" px="4">
      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" shadow="lg" maxW="380px" w="full">
        <CardBody p="8">
          <VStack spacing="5" align="stretch">
            <VStack spacing="2">
              <Box bg="navy.900" borderRadius="lg" px="5" py="3">
                <img src={LOGO_ZUKK} alt="Zukk" style={{ height: "36px", width: "auto" }} />
              </Box>
              <Heading size="md" textAlign="center">Dashboard Reincidência</Heading>
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

            <Button colorScheme="brand" borderRadius="lg" onClick={tentarLogin} w="full">
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
  // Link para TV: https://<site>/?painel abre só o painel rotativo
  const modoTV = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("painel");
  if (modoTV) {
    return <Painel modos={MODOS_PAINEL} carregar={carregarSistemaPainel} modoTV />;
  }
  return <DashboardApp />;
}
