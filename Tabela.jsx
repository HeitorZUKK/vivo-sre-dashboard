// =============================================================================
// TABELA DE REINCIDÊNCIA — mesmo formato da planilha manual
//
// Grupo → subcategoria (subtipo da análise da IA), com quantidade, percentual,
// descrição (causa raiz) e IDs dos chamados. Cada linha abre os detalhes:
// sugestão de automação, prioridade e a lista de chamados.
// Também exporta o mesmo conteúdo em Excel, com as cores da planilha manual.
// =============================================================================
import { useState, Fragment } from "react";
import { Box, Flex, Text, Button, Badge, HStack, useColorModeValue } from "@chakra-ui/react";

// Cores da planilha manual: [linha do grupo, célula da subcategoria, texto da subcategoria]
export const CORES_GRUPO = {
  "SCI":                        ["#1565C0", "#42A5F5", "#FFFFFF"],
  "Candidato SOI":              ["#00ACC1", "#80DEEA", "#222222"],
  "SOI":                        ["#388E3C", "#66BB6A", "#FFFFFF"],
  "Mudança de Stage/Fluxo":     ["#9C27B0", "#7B1FA2", "#FFFFFF"],
  "Correção de Campo":          ["#E65100", "#FF6E40", "#FFFFFF"],
  "OMNI":                       ["#BF360C", "#E64A19", "#FFFFFF"],
  "Detentora/Vendor":           ["#4E342E", "#8D6E63", "#FFFFFF"],
  "Problemas Técnicos/Sistema": ["#E53935", "#E57373", "#FFFFFF"],
  "Falta de Retorno":           ["#C62828", "#D32F2F", "#FFFFFF"],
  "Outros / Diversos":          ["#78909C", "#B0BEC5", "#FFFFFF"],
};
const COR_CABECALHO = "#1565C0";
const COR_LINHA     = "#EEF2FF";

// Subníveis da Correção de Campo (como na planilha manual), pelo começo do nome
export const NIVEIS_CAMPO = [
  { prefixo: "campo invalido", titulo: "Dado inválido (sistema) — valor rejeitado pelo sistema" },
  { prefixo: "campo correcao", titulo: "Correção solicitada (cliente) — campo não editável na interface" },
];
const COR_NIVEL = "#BF360C";
export function nivelDe(grupo, nome) {
  if (grupo !== "Correção de Campo") return null;
  const n = String(nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const i = NIVEIS_CAMPO.findIndex((x) => n.startsWith(x.prefixo));
  return i === -1 ? null : { ordem: i, titulo: NIVEIS_CAMPO[i].titulo };
}

export const pct = (qtd, total) => (total ? `${((qtd / total) * 100).toFixed(1)}%` : "0.0%");

const PRIORIDADE_COR = { Alta: "red", "Média": "orange", Baixa: "green" };

export default function TabelaReincidencia({ grupos, total, periodoLabel, analiseEm, onExportar, exportando }) {
  const [aberta, setAberta] = useState(null);
  const cardBg   = useColorModeValue("white", "gray.800");
  const linhaBg  = useColorModeValue(COR_LINHA, "gray.700");
  const borda    = useColorModeValue("#D7DCE5", "gray.600");
  const textoCor = useColorModeValue("gray.800", "gray.100");
  const detalheBg = useColorModeValue("white", "gray.800");

  if (!grupos.length) {
    return (
      <Box textAlign="center" py="16" color="gray.400">
        <Text>Nenhum chamado fechado no período com os filtros atuais.</Text>
      </Box>
    );
  }

  const celula = { px: "2.5", py: "1.5", borderWidth: "1px", borderColor: borda, fontSize: "12px", verticalAlign: "top" };

  return (
    <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borda} overflow="hidden">
      <Flex justify="space-between" align="center" px="4" py="3" wrap="wrap" gap="3">
        <Box>
          <Text fontWeight="700" fontSize="md">Reincidências · {periodoLabel}</Text>
          <Text fontSize="xs" color="gray.500">
            {total} chamados{analiseEm ? ` · análise da IA de ${analiseEm}` : ""} · clique numa linha para ver a sugestão e os chamados
          </Text>
        </Box>
        <Button size="sm" colorScheme="brand" borderRadius="lg" onClick={onExportar} isLoading={exportando} loadingText="Gerando">
          Exportar Excel
        </Button>
      </Flex>

      <Box overflowX="auto">
        <Box as="table" w="100%" minW="1100px" style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "170px" }} />
            <col style={{ width: "290px" }} />
            <col style={{ width: "60px" }} />
            <col style={{ width: "64px" }} />
            <col />
            <col style={{ width: "230px" }} />
          </colgroup>
          <thead>
            <tr>
              {["Grupo", "Subcategoria", "Qtd.", "%", "Descrição", "Chamados (IDs)"].map((h) => (
                <Box as="th" key={h} {...celula} bg={COR_CABECALHO} color="white" fontWeight="700" textAlign="center"
                  position="sticky" top="0" zIndex="1">
                  {h}
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => {
              const [corGrupo, corSub, textoSub] = CORES_GRUPO[g.nome] || CORES_GRUPO["Outros / Diversos"];
              return (
                <Fragment key={g.nome}>
                  <tr>
                    <Box as="td" {...celula} bg={corGrupo} color="white" fontWeight="700" fontSize="13px">{g.nome}</Box>
                    <Box as="td" {...celula} bg={corGrupo} color="white" fontWeight="700" fontSize="13px">{g.nome} · Subtotal</Box>
                    <Box as="td" {...celula} bg={corGrupo} color="white" fontWeight="700" fontSize="13px" textAlign="center">{g.qtd}</Box>
                    <Box as="td" {...celula} bg={corGrupo} color="white" fontWeight="700" fontSize="13px" textAlign="center">{pct(g.qtd, total)}</Box>
                    <Box as="td" {...celula} bg={corGrupo} />
                    <Box as="td" {...celula} bg={corGrupo} color="white" fontWeight="600">
                      {g.ids.length > 12 ? `${g.ids.slice(0, 12).join(", ")} e mais ${g.ids.length - 12}` : g.ids.join(", ")}
                    </Box>
                  </tr>
                  {g.linhas.map((l, li) => {
                    const estaAberta = aberta === l.chave;
                    const nivel = l.nivel && (li === 0 || g.linhas[li - 1].nivel?.titulo !== l.nivel.titulo) ? g.niveis[l.nivel.titulo] : null;
                    return (
                      <Fragment key={l.chave}>
                        {nivel && (
                          <tr>
                            <Box as="td" {...celula} bg={COR_NIVEL} color="white" fontWeight="700">{g.nome}</Box>
                            <Box as="td" {...celula} bg={COR_NIVEL} color="white" fontWeight="700">{l.nivel.titulo}</Box>
                            <Box as="td" {...celula} bg={COR_NIVEL} color="white" fontWeight="700" textAlign="center">{nivel.qtd}</Box>
                            <Box as="td" {...celula} bg={COR_NIVEL} color="white" fontWeight="700" textAlign="center">{pct(nivel.qtd, total)}</Box>
                            <Box as="td" {...celula} bg={COR_NIVEL} />
                            <Box as="td" {...celula} bg={COR_NIVEL} color="white" fontWeight="600">{nivel.ids.join(", ")}</Box>
                          </tr>
                        )}
                        <Box as="tr" cursor="pointer" onClick={() => setAberta(estaAberta ? null : l.chave)}
                          _hover={{ filter: "brightness(0.97)" }}>
                          <Box as="td" {...celula} bg={linhaBg} color="gray.500">{g.nome}</Box>
                          <Box as="td" {...celula} bg={l.semAnalise ? "gray.400" : corSub} color={l.semAnalise ? "white" : textoSub} fontWeight="700">
                            {l.nome}
                          </Box>
                          <Box as="td" {...celula} bg={linhaBg} color={textoCor} textAlign="center">{l.qtd}</Box>
                          <Box as="td" {...celula} bg={linhaBg} color={textoCor} textAlign="center">{pct(l.qtd, total)}</Box>
                          <Box as="td" {...celula} bg={linhaBg} color={textoCor}>
                            <Text noOfLines={estaAberta ? undefined : 3} lineHeight="1.45">{l.motivo || "—"}</Text>
                          </Box>
                          <Box as="td" {...celula} bg={linhaBg} color={textoCor}>{l.ids.join(", ")}</Box>
                        </Box>
                        {estaAberta && (
                          <tr>
                            <Box as="td" colSpan={6} {...celula} bg={detalheBg} px="4" py="3">
                              <DetalheLinha linha={l} />
                            </Box>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              );
            })}
            <tr>
              <Box as="td" {...celula} bg={COR_CABECALHO} color="white" fontWeight="700" colSpan={2}>Total</Box>
              <Box as="td" {...celula} bg={COR_CABECALHO} color="white" fontWeight="700" textAlign="center">{total}</Box>
              <Box as="td" {...celula} bg={COR_CABECALHO} color="white" fontWeight="700" textAlign="center">100%</Box>
              <Box as="td" {...celula} bg={COR_CABECALHO} colSpan={2} />
            </tr>
          </tbody>
        </Box>
      </Box>
    </Box>
  );
}

function DetalheLinha({ linha }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  return (
    <Box fontSize="12px">
      <HStack spacing="2" mb="2" wrap="wrap">
        <Badge variant="subtle" colorScheme="gray">Categoria no site: {linha.categoria}</Badge>
        {linha.prioridade && (
          <Badge variant="subtle" colorScheme={PRIORIDADE_COR[linha.prioridade] || "gray"}>Prioridade {linha.prioridade}</Badge>
        )}
      </HStack>
      {linha.sugestao && (
        <Box mb="3">
          <Text fontSize="10px" fontWeight="700" color={muted} textTransform="uppercase">Sugestão de automação</Text>
          <Text lineHeight="1.5">{linha.sugestao}</Text>
        </Box>
      )}
      <Text fontSize="10px" fontWeight="700" color={muted} textTransform="uppercase" mb="1">Chamados</Text>
      {linha.tickets.map((t) => (
        <Flex key={t.id} gap="3" py="1" borderTopWidth="1px" borderColor="gray.100" align="baseline">
          <Text fontFamily="mono" color="brand.500" w="48px" flexShrink={0}>{t.id}</Text>
          <Text color={muted} w="78px" flexShrink={0}>{t.date.toLocaleDateString("pt-BR")}</Text>
          <Text color={muted} w="120px" flexShrink={0} noOfLines={1}>{t.autor || "—"}</Text>
          <Box flex="1" minW="0">
            {t.titulo && <Text fontWeight="600" noOfLines={1}>{t.titulo}</Text>}
            <Text noOfLines={2}>{t.description}</Text>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}

// ── Excel no formato da planilha manual ───────────────────────────────────────
export async function exportarExcel({ grupos, total, periodoLabel, nomeAba, nomeArquivo }) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet((nomeAba || "Reincidências").slice(0, 31).replace(/[\\/*?:[\]]/g, "-"), {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = [
    { header: "Grupo", width: 22 },
    { header: "Subcategoria", width: 38 },
    { header: "Qtd.", width: 8 },
    { header: "%", width: 7 },
    { header: "Descrição", width: 80 },
    { header: "Chamados (IDs)", width: 34 },
  ];

  const argb = (hex) => `FF${hex.replace("#", "").toUpperCase()}`;
  const borda = { style: "thin", color: { argb: "FFBDBDBD" } };
  const estilo = (row, { fill, cor, negrito, tamanho, centro = [] }) => {
    row.eachCell({ includeEmpty: true }, (c, col) => {
      c.font = { bold: !!negrito, size: tamanho, color: cor ? { argb: argb(cor) } : undefined, name: "Calibri" };
      if (fill) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(fill) } };
      c.alignment = { vertical: "top", wrapText: true, horizontal: centro.includes(col) ? "center" : "left" };
      c.border = { top: borda, bottom: borda, left: borda, right: borda };
    });
  };

  estilo(ws.getRow(1), { fill: COR_CABECALHO, cor: "#FFFFFF", negrito: true, tamanho: 10, centro: [1, 2, 3, 4, 5, 6] });
  ws.getRow(1).height = 22;

  grupos.forEach((g, gi) => {
    const [corGrupo, corSub, textoSub] = CORES_GRUPO[g.nome] || CORES_GRUPO["Outros / Diversos"];
    const sub = ws.addRow([g.nome, `${g.nome} · Subtotal`, g.qtd, pct(g.qtd, total), "", g.ids.join(", ")]);
    estilo(sub, { fill: corGrupo, cor: "#FFFFFF", negrito: true, tamanho: 10, centro: [3, 4] });
    g.linhas.forEach((l, li) => {
      if (l.nivel && (li === 0 || g.linhas[li - 1].nivel?.titulo !== l.nivel.titulo)) {
        const n = g.niveis[l.nivel.titulo];
        const rn = ws.addRow([g.nome, l.nivel.titulo, n.qtd, pct(n.qtd, total), "", n.ids.join(", ")]);
        estilo(rn, { fill: COR_NIVEL, cor: "#FFFFFF", negrito: true, tamanho: 9.5, centro: [3, 4] });
      }
      const r = ws.addRow([g.nome, l.nome, l.qtd, pct(l.qtd, total), l.motivo || "", l.ids.join(", ")]);
      estilo(r, { fill: COR_LINHA, tamanho: 9, centro: [3, 4] });
      const b = r.getCell(2);
      b.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(l.semAnalise ? "#9E9E9E" : corSub) } };
      b.font = { bold: true, size: 9, color: { argb: argb(l.semAnalise ? "#FFFFFF" : textoSub) }, name: "Calibri" };
    });
    if (gi < grupos.length - 1) ws.addRow([]);
  });
  const tot = ws.addRow(["Total", "", total, "100%", "", ""]);
  estilo(tot, { fill: COR_CABECALHO, cor: "#FFFFFF", negrito: true, tamanho: 10, centro: [3, 4] });
  ws.autoFilter = { from: "A1", to: `F${ws.rowCount}` };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
