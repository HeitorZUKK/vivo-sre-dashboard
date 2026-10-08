// =============================================================================
// PAINEL ROTATIVO
//
// Mostra os sistemas em slides que trocam sozinhos — feito para ficar aberto
// numa TV ou segunda tela. Para cada sistema selecionado:
//   1. Resumo         — volume 7/30 dias, chamados por dia e categorias principais
//   2. Onde atacar    — subtipos mais importantes da análise publicada da IA
//   3. Mais recentes  — últimos chamados que entraram na planilha
//
// Os dados são recarregados da planilha a cada 5 minutos.
// Link direto para TV: https://<site>/?painel
// =============================================================================

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Box, Flex, Text, Button, HStack, VStack, Select, Spinner, SimpleGrid,
} from "@chakra-ui/react";
import Chart from "react-apexcharts";

const ATUALIZAR_A_CADA_MS = 5 * 60 * 1000;  // recarrega a planilha a cada 5 min
const PRIORIDADE_ORDEM = { Alta: 0, "Média": 1, Baixa: 2 };
const PRIORIDADE_COR   = { Alta: "red.500", "Média": "orange.400", Baixa: "green.500" };

// ── Utilitários ───────────────────────────────────────────────────────────────

function maisRecente(tickets) {
  let m = null;
  tickets.forEach((t) => { if (!m || t.date > m) m = t.date; });
  return m;
}

function diasAntes(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() - dias);
  return d;
}

function contarEntre(tickets, inicio, fim) {
  return tickets.filter((t) => t.date >= inicio && t.date <= fim).length;
}

// Primeira linha útil do comentário (tira o "PROBLEMA REPORTADO:")
function resumoChamado(texto) {
  const m = String(texto || "").match(/PROBLEMA REPORTADO:\s*([^\n\r]+)/i);
  const linha = (m ? m[1] : String(texto || "").split(/\r?\n/).find((l) => l.trim()) || "").trim();
  return linha.length > 160 ? linha.substring(0, 159) + "…" : linha;
}

function nomeCurto(nome) {
  const p = String(nome || "").split(" · ");
  return p.length > 1 ? p.slice(1).join(" · ") : String(nome || "");
}

// Monta os 3 slides de um sistema
function montarSlides(modo, dados) {
  const { tickets, analisePorCategoria } = dados;
  const ancora = maisRecente(tickets);
  if (!ancora) return [{ tipo: "vazio", modo }];

  const c7 = diasAntes(ancora, 7), c14 = diasAntes(ancora, 14);
  const c30 = diasAntes(ancora, 30), c60 = diasAntes(ancora, 60);
  const ult30 = tickets.filter((t) => t.date >= c30);

  // Chamados por categoria nos últimos 30 dias
  const porCat = {};
  ult30.forEach((t) => { porCat[t.category] = (porCat[t.category] || 0) + 1; });
  const categorias = Object.entries(porCat).sort((a, b) => b[1] - a[1]);

  // Chamados por dia (30 dias)
  const dias = Array.from({ length: 30 }, (_, i) => {
    const d = diasAntes(ancora, 29 - i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const porDia = dias.map((d) => {
    const fim = new Date(d); fim.setDate(fim.getDate() + 1);
    return ult30.filter((t) => t.date >= d && t.date < fim).length;
  });

  const resumo = {
    tipo: "resumo", modo, ancora,
    sete:   { atual: contarEntre(tickets, c7, ancora),  anterior: tickets.filter((t) => t.date >= c14 && t.date < c7).length },
    trinta: { atual: contarEntre(tickets, c30, ancora), anterior: tickets.filter((t) => t.date >= c60 && t.date < c30).length },
    categoriasAtivas: categorias.length,
    topCategorias: categorias.slice(0, 6),
    diasLabels: dias.map((d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })),
    porDia,
  };

  // Subtipos da análise publicada, das categorias ativas nos últimos 30 dias
  const subtipos = [];
  categorias.forEach(([cat]) => {
    const an = analisePorCategoria(cat);
    (an?.subcategorias || []).forEach((s) => subtipos.push({
      nome: nomeCurto(s.nome), categoria: cat, prioridade: s.prioridade,
      qtd: s.ids?.length || 0, sugestao: s.sugestao || "",
    }));
  });
  subtipos.sort((a, b) =>
    (PRIORIDADE_ORDEM[a.prioridade] ?? 3) - (PRIORIDADE_ORDEM[b.prioridade] ?? 3) || b.qtd - a.qtd);

  // Um chamado pode ter vários comentários — mostra cada chamado uma vez só
  const vistos = new Set();
  const recentes = [...tickets].sort((a, b) => b.date - a.date)
    .filter((t) => (vistos.has(t.id) ? false : vistos.add(t.id)))
    .slice(0, 7);

  const slides = [resumo];
  if (subtipos.length > 0) slides.push({ tipo: "atacar", modo, ancora, subtipos: subtipos.slice(0, 5) });
  slides.push({ tipo: "recentes", modo, ancora, recentes });
  return slides;
}

// ── Componentes visuais ───────────────────────────────────────────────────────

function Numero({ titulo, valor, anterior, grande, T }) {
  const diff = anterior == null ? null : valor - anterior;
  return (
    <Box>
      <Text fontSize={grande ? "xl" : "sm"} color={T.muted} fontWeight="600">{titulo}</Text>
      <Text fontSize={grande ? "7xl" : "5xl"} fontWeight="800" lineHeight="1.1" color={T.destaque}>{valor}</Text>
      {diff != null && (
        <Text fontSize={grande ? "xl" : "sm"} fontWeight="600"
          color={diff > 0 ? T.sobe : diff < 0 ? T.desce : T.muted}>
          {diff === 0 ? "igual ao período anterior" : `${diff > 0 ? "+" : ""}${diff} vs período anterior`}
        </Text>
      )}
    </Box>
  );
}

function SlideResumo({ slide, grande, texto, T }) {
  const max = Math.max(1, ...slide.topCategorias.map(([, n]) => n));
  return (
    <Flex direction="column" h="100%" gap={grande ? 8 : 5}>
      <SimpleGrid columns={3} spacing={grande ? 10 : 6}>
        <Numero titulo="Últimos 7 dias"  valor={slide.sete.atual}   anterior={slide.sete.anterior}   grande={grande} T={T} />
        <Numero titulo="Últimos 30 dias" valor={slide.trinta.atual} anterior={slide.trinta.anterior} grande={grande} T={T} />
        <Numero titulo="Categorias com chamados (30 dias)" valor={slide.categoriasAtivas} grande={grande} T={T} />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={grande ? 10 : 6} flex="1" minH="0">
        <Box minH="0">
          <Text fontSize={grande ? "2xl" : "md"} fontWeight="700" mb="2">Chamados por dia</Text>
          <Chart
            type="bar"
            height={grande ? 520 : 260}
            options={{
              chart: { toolbar: { show: false }, fontFamily: "Inter, sans-serif", animations: { enabled: false } },
              plotOptions: { bar: { borderRadius: 3, columnWidth: "70%" } },
              colors: ["#2C98A5"],
              dataLabels: { enabled: false },
              xaxis: {
                categories: slide.diasLabels,
                labels: { rotate: 0, hideOverlappingLabels: true, style: { fontSize: grande ? "15px" : "11px", colors: texto } },
                tickAmount: 6,
              },
              yaxis: { labels: { style: { fontSize: grande ? "15px" : "11px", colors: texto } } },
              grid: { borderColor: T.bordaHex },
              tooltip: { theme: "dark" },
            }}
            series={[{ name: "Chamados", data: slide.porDia }]}
          />
        </Box>
        <Box>
          <Text fontSize={grande ? "2xl" : "md"} fontWeight="700" mb="3">Categorias com mais chamados (30 dias)</Text>
          <VStack align="stretch" spacing={grande ? 4 : 2.5}>
            {slide.topCategorias.map(([cat, n]) => (
              <Box key={cat}>
                <Flex justify="space-between" fontSize={grande ? "2xl" : "md"} mb="1">
                  <Text fontWeight="600" noOfLines={1}>{cat}</Text>
                  <Text fontWeight="700" color={T.destaque} ml="3">{n}</Text>
                </Flex>
                <Box h={grande ? "10px" : "6px"} borderRadius="full" bg={T.barraFundo}>
                  <Box h="100%" borderRadius="full" bg={T.barra} w={`${(n / max) * 100}%`} />
                </Box>
              </Box>
            ))}
          </VStack>
        </Box>
      </SimpleGrid>
    </Flex>
  );
}

function SlideAtacar({ slide, grande, T }) {
  return (
    <VStack align="stretch" spacing={grande ? 5 : 3}>
      {slide.subtipos.map((s, i) => (
        <Flex key={i} gap={grande ? 5 : 3} align="flex-start" p={grande ? 5 : 3}
          borderRadius="xl" borderWidth="1px" borderColor={T.borda}>
          <Box w={grande ? "16px" : "10px"} h={grande ? "16px" : "10px"} mt={grande ? "3" : "2"}
            borderRadius="full" flexShrink={0} bg={PRIORIDADE_COR[s.prioridade] || "gray.400"} />
          <Box flex="1" minW="0">
            <Flex justify="space-between" align="baseline" gap="4">
              <Text fontSize={grande ? "3xl" : "lg"} fontWeight="700" noOfLines={1}>{s.nome}</Text>
              <Text fontSize={grande ? "3xl" : "lg"} fontWeight="800" color={T.destaque} flexShrink={0}>{s.qtd}</Text>
            </Flex>
            <Text fontSize={grande ? "xl" : "sm"} color={T.muted} mb="1">
              {s.categoria} · prioridade {String(s.prioridade || "—").toLowerCase()}
            </Text>
            {s.sugestao && (
              <Text fontSize={grande ? "xl" : "sm"} noOfLines={2}>{s.sugestao}</Text>
            )}
          </Box>
        </Flex>
      ))}
    </VStack>
  );
}

function SlideRecentes({ slide, grande, T }) {
  return (
    <VStack align="stretch" spacing="0">
      {slide.recentes.map((t, i) => (
        <Flex key={`${t.id}-${i}`} gap={grande ? 6 : 4} py={grande ? 4 : 2.5} align="baseline"
          borderBottomWidth="1px" borderColor={T.borda}>
          <Text fontSize={grande ? "xl" : "sm"} color={T.muted} w={grande ? "200px" : "130px"} flexShrink={0}>
            {t.date.toLocaleDateString("pt-BR")} {t.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
          <Text fontSize={grande ? "xl" : "sm"} fontFamily="mono" color={T.destaque} w={grande ? "140px" : "90px"} flexShrink={0}>
            {t.id}
          </Text>
          <Text fontSize={grande ? "xl" : "sm"} fontWeight="700" w={grande ? "280px" : "180px"} flexShrink={0} noOfLines={1}>
            {t.category}
          </Text>
          <Text fontSize={grande ? "xl" : "sm"} noOfLines={1} flex="1">{resumoChamado(t.description)}</Text>
        </Flex>
      ))}
    </VStack>
  );
}

const TITULO_SLIDE = {
  resumo:   "Resumo",
  atacar:   "Onde atacar primeiro",
  recentes: "Chamados mais recentes",
  vazio:    "Sem dados",
};

// ── Painel ────────────────────────────────────────────────────────────────────

export default function Painel({ modos, carregar, modoTV = false }) {
  const [selecionados, setSelecionados] = useState(() => modos.map((m) => m.id));
  const [intervalo, setIntervalo]       = useState(20);       // segundos por slide
  const [pausado, setPausado]           = useState(false);
  const [idx, setIdx]                   = useState(0);
  const [dados, setDados]               = useState({});       // { modo: { tickets, ... } }
  const [erros, setErros]               = useState({});
  const [carregando, setCarregando]     = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [telaCheia, setTelaCheia]       = useState(false);
  const caixaRef = useRef(null);

  const grande = modoTV || telaCheia;

  // Em tela cheia / TV o painel usa o fundo azul-marinho da marca Zukk
  const T = grande
    ? { muted: "navy.100", destaque: "brand.300", borda: "whiteAlpha.300", barraFundo: "whiteAlpha.200",
        barra: "brand.400", bordaHex: "rgba(255,255,255,0.12)", label: "#C3CAD8", sobe: "red.300", desce: "green.300" }
    : { muted: "gray.500", destaque: "brand.600", borda: "blackAlpha.200", barraFundo: "blackAlpha.100",
        barra: "brand.500", bordaHex: "rgba(0,0,0,0.08)", label: "#4A5568", sobe: "red.500", desce: "green.600" };
  const bg     = grande ? "navy.900" : "white";
  const border = grande ? "whiteAlpha.300" : "gray.200";
  const botao  = grande ? { color: "white", borderColor: "whiteAlpha.500", _hover: { bg: "whiteAlpha.200" } } : {};

  // Carrega todos os sistemas (na abertura e a cada 5 minutos)
  const recarregar = useCallback(async () => {
    setCarregando(true);
    const novos = {}, novosErros = {};
    await Promise.all(modos.map(async ({ id }) => {
      try { novos[id] = await carregar(id); }
      catch (e) { novosErros[id] = e.message; }
    }));
    setDados((prev) => ({ ...prev, ...novos }));
    setErros(novosErros);
    setAtualizadoEm(new Date());
    setCarregando(false);
  }, [modos, carregar]);

  useEffect(() => {
    recarregar();
    const t = setInterval(recarregar, ATUALIZAR_A_CADA_MS);
    return () => clearInterval(t);
  }, [recarregar]);

  // Slides dos sistemas selecionados
  const slides = useMemo(() => {
    const lista = [];
    modos.filter((m) => selecionados.includes(m.id)).forEach((m) => {
      if (dados[m.id]) montarSlides(m.id, dados[m.id]).forEach((s) => lista.push({ ...s, label: m.label }));
    });
    return lista;
  }, [modos, selecionados, dados]);

  const total = slides.length;
  const atual = total ? slides[idx % total] : null;

  const avancar = useCallback((passo = 1) => {
    setIdx((i) => (total ? (i + passo + total) % total : 0));
  }, [total]);

  // Troca de slide automática
  useEffect(() => {
    if (pausado || total <= 1) return;
    const t = setTimeout(() => avancar(1), intervalo * 1000);
    return () => clearTimeout(t);
  }, [idx, pausado, intervalo, total, avancar]);

  // Mantém o índice válido quando a seleção muda
  useEffect(() => { if (idx >= total && total > 0) setIdx(0); }, [idx, total]);

  // Tela cheia
  useEffect(() => {
    const onChange = () => setTelaCheia(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const alternarTelaCheia = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else caixaRef.current?.requestFullscreen?.();
  };

  // Teclado: setas trocam de slide, espaço pausa
  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") avancar(1);
    else if (e.key === "ArrowLeft") avancar(-1);
    else if (e.key === " ") { e.preventDefault(); setPausado((p) => !p); }
  };

  const alternarSistema = (id) => {
    setSelecionados((sel) => {
      if (sel.includes(id)) return sel.length > 1 ? sel.filter((s) => s !== id) : sel; // ao menos 1
      return [...sel, id];
    });
    setIdx(0);
  };

  return (
    <Box
      ref={caixaRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      bg={bg}
      color={grande ? "white" : "inherit"}
      borderWidth={modoTV || telaCheia ? "0" : "1px"}
      borderColor={border}
      borderRadius={modoTV || telaCheia ? "0" : "xl"}
      h={grande ? "100vh" : "auto"}
      minH="560px"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      fontFamily="'Inter', sans-serif"
      outline="none"
    >
      {/* Barra superior: título + controles */}
      <Flex px={grande ? 10 : 5} pt={grande ? 6 : 4} pb="3" align="center" justify="space-between" gap="4" wrap="wrap">
        <Box minW="0">
          <Text fontSize={grande ? "lg" : "sm"} color={T.muted} fontWeight="600">
            {atual ? `${atual.label} · ${(idx % total) + 1} de ${total}` : "Painel"}
          </Text>
          <Text fontSize={grande ? "4xl" : "2xl"} fontWeight="800" lineHeight="1.2">
            {atual ? TITULO_SLIDE[atual.tipo] : "Carregando"}
          </Text>
        </Box>

        <HStack spacing="2" wrap="wrap">
          {modos.length > 1 && (
            <HStack spacing="1" p="1" borderRadius="lg" borderWidth="1px" borderColor={border}>
              {modos.map((m) => {
                const ativo = selecionados.includes(m.id);
                return (
                  <Button key={m.id} size="sm" borderRadius="md"
                    variant={ativo ? "solid" : "ghost"} colorScheme={ativo ? "brand" : "gray"}
                    {...(!ativo && grande ? { color: "navy.100", _hover: { bg: "whiteAlpha.200" } } : {})}
                    onClick={() => alternarSistema(m.id)}>
                    {m.label}
                  </Button>
                );
              })}
            </HStack>
          )}
          <Select size="sm" w="auto" borderRadius="lg" value={intervalo} {...botao}
            sx={grande ? { option: { color: "black" } } : undefined}
            onChange={(e) => setIntervalo(Number(e.target.value))} aria-label="Tempo por slide">
            {[10, 20, 30, 60].map((s) => <option key={s} value={s}>{s} s por slide</option>)}
          </Select>
          <Button size="sm" variant="outline" borderRadius="lg" {...botao} onClick={() => avancar(-1)} isDisabled={total <= 1}>Anterior</Button>
          <Button size="sm" variant="outline" borderRadius="lg" {...botao} onClick={() => setPausado((p) => !p)} minW="80px">
            {pausado ? "Continuar" : "Pausar"}
          </Button>
          <Button size="sm" variant="outline" borderRadius="lg" {...botao} onClick={() => avancar(1)} isDisabled={total <= 1}>Próximo</Button>
          <Button size="sm" colorScheme="brand" borderRadius="lg" onClick={alternarTelaCheia}>
            {telaCheia ? "Sair da tela cheia" : "Tela cheia"}
          </Button>
        </HStack>
      </Flex>

      {/* Barra de progresso até o próximo slide */}
      <Box h="3px" mx={grande ? 10 : 5} bg={T.barraFundo} borderRadius="full" overflow="hidden">
        {!pausado && total > 1 && (
          <Box
            key={`${idx}-${intervalo}`}
            h="100%" bg={T.barra}
            sx={{
              animation: `painelProgresso ${intervalo}s linear forwards`,
              "@keyframes painelProgresso": { from: { width: "0%" }, to: { width: "100%" } },
            }}
          />
        )}
      </Box>

      {/* Conteúdo do slide */}
      <Box flex="1" minH="0" overflow={grande ? "hidden" : "visible"} px={grande ? 10 : 5} py={grande ? 8 : 5}>
        {!atual ? (
          <Flex h="100%" align="center" justify="center" direction="column" gap="3" color={T.muted}>
            {carregando ? <Spinner size="lg" color="brand.500" /> : null}
            <Text>{carregando ? "Carregando dados dos sistemas" : "Nenhum dado disponível para os sistemas selecionados."}</Text>
          </Flex>
        ) : atual.tipo === "resumo" ? (
          <SlideResumo slide={atual} grande={grande} texto={T.label} T={T} />
        ) : atual.tipo === "atacar" ? (
          <SlideAtacar slide={atual} grande={grande} T={T} />
        ) : atual.tipo === "recentes" ? (
          <SlideRecentes slide={atual} grande={grande} T={T} />
        ) : (
          <Text color={T.muted}>Sem chamados na planilha deste sistema.</Text>
        )}
      </Box>

      {/* Rodapé */}
      <Flex px={grande ? 10 : 5} py="2" justify="space-between" fontSize={grande ? "md" : "xs"} color={T.muted}
        borderTopWidth="1px" borderColor={border} wrap="wrap" gap="2">
        <Text>
          {atual?.ancora ? `Chamados até ${atual.ancora.toLocaleDateString("pt-BR")} · ` : ""}
          {atualizadoEm ? `dados recarregados às ${atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}, atualiza a cada 5 min` : ""}
          {carregando ? " · atualizando" : ""}
        </Text>
        {Object.keys(erros).length > 0 && (
          <Text color="red.500">Falha ao carregar: {Object.keys(erros).join(", ")}</Text>
        )}
        {!grande && <Text>Setas trocam de slide · espaço pausa</Text>}
      </Flex>
    </Box>
  );
}
