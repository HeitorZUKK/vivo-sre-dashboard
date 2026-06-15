import { useState, useCallback, useMemo } from "react";
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
//       VITE_SHEET_NAME=resultado
//       VITE_GEMINI_API_KEY=sua_chave_aqui
//
//     Acesse com: import.meta.env.VITE_NOME_DA_VARIAVEL
// =============================================================================

const SHEETS_API_KEY = import.meta.env.VITE_SHEETS_API_KEY || "AIzaSyAOcJU0bourcAH-rw-zIkQLI_oOo79H9bk";
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID || "1Ne5pMhMk0eXnZt9n6whQJi2BD9weUTo40INFHK5zUus";
const SHEET_NAME     = import.meta.env.VITE_SHEET_NAME     || "resultado";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AQ.Ab8RN6LhbAiy2mzUHKpmUvDkb0LIeCRe4C17-2P3Os6Z_eij1A";

// Sistemas monitorados — adicione novos sistemas aqui
const SYSTEMS = ["Fly", "Atlas"];

// Configurações de análise em lote (análise SRE de causas/sugestões)
const BATCH_SIZE     = 5;      // categorias por requisição Gemini
const BATCH_DELAY_MS = 10_000; // pausa entre lotes (ms) — respeita rate limit
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
// Lógica que transforma o texto do comentário em { sistema, categoria }.
//
// COMO ADICIONAR UMA NOVA REGRA:
//   1. Adicione um objeto em KEYWORD_RULES abaixo.
//   2. A ordem importa: a primeira regra que bater vence.
//   3. Use `sistema: null` para herdar a detecção automática (Fly/Atlas).
// =============================================================================

const KEYWORD_RULES = [
  { keywords: ["altitude", "decimal digit"],                             sistema: null,    categoria: "Erro de Tipo: Alfabetivo em Campo Altitude (SOI)"           },
  { keywords: ["altura estrutura", "virgula", "vírgula"],                sistema: null,    categoria: "Erro de Sintaxe: Vírgula em Altura Estrutura (SOI)"          },
  { keywords: ["distrito", "municipio", "município"],                    sistema: null,    categoria: "Divergência Cadastral: Distrito/Município ausente no Science" },
  { keywords: ["object object", "<br>", "quebra de linha"],              sistema: null,    categoria: "Falha de Renderização: Caractere Especial no Endereço"        },
  { keywords: ["mapa", "coordenadas", "latitude", "longitude"],          sistema: null,    categoria: "Erro de Indentação: Coordenada Positiva no Mapa"              },
  { keywords: ["feign", "feignexception", "abrir sci"],                  sistema: null,    categoria: "Bloqueio de Integração: FCU Duplicada ao Disparar SCI"        },
  { keywords: ["unique query", "empresa duplicada"],                     sistema: null,    categoria: "Duplicidade de Registro: Empresa Duplicada no VivoGo"         },
  { keywords: ["subprocesso", "camunda", "modalidade em aberto"],        sistema: null,    categoria: "Violação de Regra BPM: Multiplas Modalidades na SOI"          },
  { keywords: ["botão", "permissão", "keycloak"],                        sistema: null,    categoria: "Falha de Atribuição: Grupo Designado no Camunda Workflow"     },
  { keywords: ["atlas"],                                                  sistema: "Atlas", categoria: "Suporte Atlas Geral"                                         },
];

const DEFAULT_CATEGORIA = "Suporte Operacional Técnico Geral";

function classificarComentario(texto) {
  const txt    = (texto || "").toLowerCase();
  const sistema = txt.includes("atlas") ? "Atlas" : "Fly";

  const catMatch = texto.match(/CATEGORIA:\s*([^\n\r"]+)/i);
  if (catMatch && catMatch[1].trim().length > 1) {
    return { sistema, categoria: catMatch[1].trim() };
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => txt.includes(kw))) {
      return { sistema: rule.sistema ?? sistema, categoria: rule.categoria };
    }
  }

  return { sistema, categoria: DEFAULT_CATEGORIA };
}

// =============================================================================
// SEÇÃO 3 — GOOGLE SHEETS API
// Busca todos os dados da planilha.
// Os gráficos usam o histórico completo.
// A IA usa apenas o período selecionado pelo filtro — controlado em tempo real.
// =============================================================================

async function fetchSheetData() {
  if (!SHEETS_API_KEY || !SPREADSHEET_ID) {
    throw new Error(
      "Variáveis de ambiente não configuradas. " +
      "Crie um arquivo .env com VITE_SHEETS_API_KEY e VITE_SPREADSHEET_ID."
    );
  }

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `/values/${encodeURIComponent(SHEET_NAME)}?key=${SHEETS_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  const rows = (json.values || []).slice(1);
  const data = {};

  rows.forEach((row, idx) => {
    const rawDate    = row[0];
    const comentario = String(row[1] || "").trim();
    if (!rawDate || !comentario) return;

    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return;

    const { sistema, categoria } = classificarComentario(comentario);
    const ticket = { id: `#${idx + 1}`, date, system: sistema, category: categoria, description: comentario };

    if (!data[sistema])            data[sistema] = {};
    if (!data[sistema][categoria]) data[sistema][categoria] = { tickets: [] };
    data[sistema][categoria].tickets.push(ticket);
  });

  return data;
}

// =============================================================================
// SEÇÃO 4 — GEMINI API
// Análise SRE: envia categorias e retorna causa raiz, sugestão e prioridade.
// =============================================================================

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// ── Helper de retry ───────────────────────────────────────────────────────────

async function callGemini(promptText) {
  if (!GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY não configurada. Adicione a chave no arquivo .env.");
  }

  const body = JSON.stringify({
    contents: [{ parts: [{ text: promptText }] }],
    // Limita o tamanho da resposta para evitar JSON truncado
    generationConfig: { maxOutputTokens: 2048 },
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(GEMINI_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
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

function buildAnalysisPrompt(system, categories) {
  const payload = categories.map((c) => ({
    id_categoria:      c.name,
    contexto_real:     c.samples.slice(0, 3).join(" | "),
    total_ocorrencias: c.total,
    ultimos_30_dias:   c.last30,
  }));

  return `Você é um Engenheiro de Confiabilidade de Sistemas (SRE) e Especialista ITIL Sênior do Ecossistema Vivo ${system}.

O sistema ${system} gerencia infraestrutura core da Vivo (antenas, Camunda BPM, Angular 14, Spring Boot).

Analise os chamados recorrentes abaixo e para cada categoria retorne OBRIGATORIAMENTE os 4 campos:
1. "titulo": Nome técnico resumido (máx 6 palavras)
2. "motivo": Causa raiz técnica detalhada (2-3 frases) — NUNCA deixe vazio
3. "sugestao": Proposta de automação ou regra de negócio (2-3 frases concretas) — NUNCA deixe vazio
4. "prioridade": exatamente "Alta", "Média" ou "Baixa"

DADOS DAS CATEGORIAS:
${JSON.stringify(payload, null, 2)}

RETORNE APENAS O OBJETO JSON PURO, SEM MARKDOWN, SEM TEXTO EXTRA, NESTE FORMATO EXATO:
{
  "Nome_da_Categoria": {
    "titulo": "...",
    "motivo": "...",
    "sugestao": "...",
    "prioridade": "..."
  }
}

IMPORTANTE: Use exatamente o valor de "id_categoria" como chave do objeto de retorno.`;
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
  // Caso 1: formato correto { "NomeCategoria": { titulo, motivo, ... } }
  if (result[categoryName]) return result[categoryName];

  // Caso 2: resposta com chave diferente mas estrutura correta
  const firstVal = result[Object.keys(result)[0]];
  if (firstVal && typeof firstVal === "object" && firstVal.motivo) return firstVal;

  // Caso 3: Gemini retornou a análise diretamente no nível raiz
  // ex: { "titulo": "...", "motivo": "...", "sugestao": "...", "prioridade": "..." }
  if (result.motivo && result.sugestao) return result;

  // Caso 4: não reconheceu o formato — retorna o que veio para não perder dados
  return firstVal || result;
}

async function callGeminiForAnalysis(system, categories) {
  return callGemini(buildAnalysisPrompt(system, categories));
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

// ── FilterPanel ───────────────────────────────────────────────────────────────

function FilterPanel({ filters, onChange, onReset, allCategories }) {
  const bg     = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
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
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500">Sistema</FormLabel>
          <Select size="sm" borderRadius="lg" value={filters.system} onChange={(e) => onChange("system", e.target.value)}>
            <option value="">Todos</option>
            {SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500">Categoria</FormLabel>
          <Select size="sm" borderRadius="lg" value={filters.category} onChange={(e) => onChange("category", e.target.value)}>
            <option value="">Todas</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c.length > 55 ? c.substring(0, 55) + "…" : c}</option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500">Período para análise IA</FormLabel>
          <Select size="sm" borderRadius="lg" value={filters.period} onChange={(e) => onChange("period", e.target.value)}>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
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

  const trend            = getMonthlyTrend(categoryData.tickets);
  const totalPages       = Math.ceil(categoryData.tickets.length / TICKETS_PER_PAGE);
  const paginatedTickets = categoryData.tickets.slice(
    ticketPage * TICKETS_PER_PAGE,
    (ticketPage + 1) * TICKETS_PER_PAGE
  );

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
              <Text fontWeight="600" fontSize="sm">Chamados ({categoryData.tickets.length})</Text>
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
                <Tr><Th w="60px">Linha</Th><Th w="90px">Data</Th><Th>Descrição</Th></Tr>
              </Thead>
              <Tbody>
                {paginatedTickets.map((t) => (
                  <Tr key={t.id} _hover={{ bg: statBg }} cursor="pointer"
                    onClick={() => setExpandedTicket(expandedTicket === t.id ? null : t.id)}>
                    <Td><Text fontSize="11px" fontFamily="mono" color="purple.500">{t.id}</Text></Td>
                    <Td fontSize="11px" whiteSpace="nowrap">{t.date.toLocaleDateString("pt-BR")}</Td>
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
                {Math.min((ticketPage + 1) * TICKETS_PER_PAGE, categoryData.tickets.length)} de{" "}
                {categoryData.tickets.length} chamados
              </Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  );
}

// ── OverviewCharts ────────────────────────────────────────────────────────────

function OverviewCharts({ data }) {
  const systemsToShow = SYSTEMS.filter((s) => data[s]);

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

const INITIAL_FILTERS = { system: "", category: "", period: "90", priority: "" };

export default function VivoDashboard() {
  // ── Estado ──────────────────────────────────────────────────────────────────
  const [data,            setData]            = useState({});
  const [sheetLoading,    setSheetLoading]    = useState(false);
  const [sheetError,      setSheetError]      = useState(null);
  const [lastSync,        setLastSync]        = useState(null);
  const [analyses,        setAnalyses]        = useState({});
  const [loadingKeys,     setLoadingKeys]     = useState({});
  const [bulkLoading,     setBulkLoading]     = useState(false);
  const [mockMode,        setMockMode]        = useState(false); // quando true, substitui Gemini por dados simulados
  const [filters,         setFilters]         = useState(INITIAL_FILTERS);

  const toast  = useToast();
  const bg     = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  // ── Derivados ────────────────────────────────────────────────────────────────

  const filteredSystems = filters.system ? [filters.system] : SYSTEMS;

  const allCategories = useMemo(() => {
    const cats = new Set();
    Object.values(data).forEach((sys) => Object.keys(sys).forEach((c) => cats.add(c)));
    return [...cats].sort();
  }, [data]);

  const filteredCards = useMemo(() => {
    const cards = [];
    filteredSystems.forEach((sys) => {
      if (!data[sys]) return;
      Object.entries(data[sys]).forEach(([cat, val]) => {
        if (filters.category && cat !== filters.category) return;
        const key      = `${sys}::${cat}`;
        const analysis = analyses[key];
        if (filters.priority && analysis?.prioridade !== filters.priority) return;
        cards.push({ sys, cat, val, key, analysis });
      });
    });
    return cards;
  }, [data, filteredSystems, filters, analyses]);

  const totalTickets = useMemo(() => {
    let t = 0;
    filteredSystems.forEach((s) =>
      Object.values(data[s] || {}).forEach((v) => (t += v.tickets.length))
    );
    return t;
  }, [data, filteredSystems]);

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
      const result = await fetchSheetData();
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
  }, [toast]);

  // Roteador de análise: usa mock ou Gemini real dependendo do estado mockMode
  const analyzeCategories = useCallback(
    (system, categories) =>
      mockMode ? callGeminiMock(categories) : callGeminiForAnalysis(system, categories),
    [mockMode]
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

  const requestBulkAnalysis = useCallback(async () => {
    if (!filters.system) {
      toast({ title: "Selecione um sistema", description: "Configure o filtro antes de solicitar análise em lote.", status: "warning", duration: 4000 });
      return;
    }
    setBulkLoading(true);
    try {
      const sys    = filters.system;
      const period = parseInt(filters.period || "90");

      // Filtra pelo período selecionado — categorias sem atividade no período são ignoradas
      const allCats = Object.entries(data[sys] || {})
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

      if (allCats.length === 0) {
        toast({ title: "Sem chamados no período", description: `Nenhuma categoria com chamados nos últimos ${period} dias para ${sys}.`, status: "warning", duration: 4000 });
        setBulkLoading(false);
        return;
      }

      toast({
        title:       `${allCats.length} categorias ativas encontradas`,
        description: `Analisando chamados dos últimos ${period} dias. Categorias inativas foram ignoradas.`,
        status:      "info",
        duration:    5000,
      });

      const batches = [];
      for (let i = 0; i < allCats.length; i += BATCH_SIZE) {
        batches.push(allCats.slice(i, i + BATCH_SIZE));
      }

      let totalAnalysed = 0;
      for (let i = 0; i < batches.length; i++) {
        toast({
          title:       `Analisando lote ${i + 1} de ${batches.length}…`,
          description: `${batches[i].length} categorias. Aguarde entre lotes.`,
          status:      "info",
          duration:    BATCH_DELAY_MS - 1000,
        });

        const result      = await analyzeCategories(sys, batches[i]);
        const newAnalyses = {};

        // Para cada categoria do lote, tenta encontrar a análise correspondente
        // no resultado do Gemini — independente do nome que ele usou como chave.
        batches[i].forEach((cat) => {
          // 1. Busca pelo nome exato
          let analysis = result[cat.name];

          // 2. Busca case-insensitive / parcial (Gemini às vezes abrevia o nome)
          if (!analysis) {
            const geminiKey = Object.keys(result).find((k) =>
              k.toLowerCase().includes(cat.name.toLowerCase().substring(0, 20)) ||
              cat.name.toLowerCase().includes(k.toLowerCase().substring(0, 20))
            );
            if (geminiKey) analysis = result[geminiKey];
          }

          // 3. Se só veio uma categoria no lote e não achou pelo nome, pega a primeira
          if (!analysis && batches[i].length === 1) {
            analysis = Object.values(result)[0];
          }

          // 4. Se a análise veio no nível raiz (sem envelope de categoria)
          if (!analysis && result.motivo) analysis = result;

          if (analysis) {
            // Garante que motivo e sugestao estão presentes
            const normalized = analysis.motivo ? analysis : normalizeAnalysisResult(result, cat.name);
            newAnalyses[`${sys}::${cat.name}`] = normalized;
          }
        });
        setAnalyses((prev) => ({ ...prev, ...newAnalyses }));
        totalAnalysed += Object.keys(newAnalyses).length;

        if (i < batches.length - 1) {
          await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
        }
      }

      toast({ title: "Análise em lote concluída!", description: `${totalAnalysed} categorias analisadas para ${sys} (últimos ${period} dias)`, status: "success", duration: 5000 });
    } catch (e) {
      toast({ title: "Erro na análise em lote", description: String(e.message), status: "error", duration: 6000 });
    } finally {
      setBulkLoading(false);
    }
  }, [data, filters.system, filters.period, analyzeCategories, toast]);

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
              <Text fontWeight="700" fontSize="lg" lineHeight="1.2">Vivo SRE Dashboard</Text>
              <Text fontSize="11px" color="gray.500">
                {lastSync ? `Última sincronização: ${lastSync}` : "Planilha não carregada"}
              </Text>
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
              onClick={requestBulkAnalysis}
            >
              Análise IA em lote
            </Button>
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
        />

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing="4" mb="6">
          <StatCard label="Total de chamados"      value={totalTickets.toLocaleString("pt-BR")} color="purple" />
          <StatCard label="Últimos 30 dias"        value={tickets30.count.toLocaleString("pt-BR")} delta={tickets30.delta} color="blue" />
          <StatCard label="Categorias ativas"      value={filteredCards.length} color="teal" />
          <StatCard label="Categorias analisadas"  value={`${analysedCount}/${filteredCards.length}`} color="orange" />
        </SimpleGrid>

        <Tabs colorScheme="purple" variant="soft-rounded" defaultIndex={0}>
          <TabList mb="5" bg={cardBg} p="1" borderRadius="xl" borderWidth="1px" borderColor={border} gap="1">
            <Tab fontSize="sm" borderRadius="lg">Visão Geral</Tab>
            <Tab fontSize="sm" borderRadius="lg">Chamados por Categoria</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px="0">
              <OverviewCharts data={data} />
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
