# Vivo SRE Dashboard 🚀

Dashboard React para monitoramento de reincidência de chamados dos sistemas **Fly** e **Atlas** da Vivo, com análise por IA (Anthropic Claude).

---

## ⚙️ Configuração inicial

### 1. Pré-requisitos
- Node.js 18+
- npm ou yarn

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🗂️ Estrutura do projeto

```
vivo-dashboard/
├── Dashboard.jsx        ← Componente principal (tudo em um arquivo)
├── src/
│   └── main.jsx         ← Entry point React + ChakraProvider
├── index.html
├── vite.config.js
└── package.json
```

---

## 🧩 Como usar

### Carregando seus dados reais

Edite a função `buildInitialData()` em `Dashboard.jsx` para substituir os dados mock pelos seus dados reais.

Cada ticket deve ter o formato:
```js
{
  id: "TCK-12345",
  date: new Date("2024-01-15"),
  system: "Fly",          // ou "Atlas"
  category: "Nome da categoria",
  description: "Texto do chamado"
}
```

### Integração com Google Sheets

Se quiser puxar dados direto da planilha, adicione uma função de fetch no início do componente:

```js
async function fetchFromSheets(sheetId, apiKey) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/resultado?key=${apiKey}`
  const res = await fetch(url)
  const json = await res.json()
  return json.values // retorna linhas da planilha
}
```

Depois chame no `useEffect` inicial do `VivoDashboard`.

---

## 🤖 Análise por IA

O dashboard usa a **API da Anthropic (Claude)** para:
- Identificar a **causa raiz** de cada categoria de chamado
- Sugerir **automações e regras de negócio** para reduzir reincidência
- Classificar a **prioridade** (Alta / Média / Baixa)

### Como funciona o fluxo

1. Configure os **filtros** (sistema, período, categoria)
2. Clique em **"Análise IA em lote"** para analisar todas as categorias do sistema selecionado
3. Ou clique em **"Solicitar análise IA"** em um card individual
4. Após a análise, clique em **"Salvar resultados"** para armazenar o histórico

> ⚠️ **Importante:** A análise só é enviada após configurar os filtros, evitando requisições desnecessárias.

---

## 📊 Gráficos disponíveis

| Gráfico | Descrição |
|---------|-----------|
| Barras horizontais | Top chamados no período filtrado |
| Área (tendência) | Volume mensal por sistema (6 meses) |
| Donut | Distribuição percentual por categoria |
| Heatmap | Densidade de chamados por sistema × mês |

---

## 💾 Resultados salvos

Os resultados de análise são **armazenados em memória** durante a sessão. Para persistência permanente, você pode:

1. Exportar para JSON via `localStorage`
2. Enviar para um backend próprio
3. Usar o [Artifact Storage da Anthropic](https://docs.anthropic.com) se rodar como artifact

---

## 🎨 Personalização

### Adicionar novo sistema
Em `SYSTEMS` e `MOCK_CATEGORIES`:
```js
const SYSTEMS = ["Fly", "Atlas", "MeuSistema"]
const MOCK_CATEGORIES = {
  MeuSistema: ["Categoria 1", "Categoria 2"]
}
```

### Trocar o modelo de IA
Em `callAnthropicForAnalysis()`:
```js
model: "claude-opus-4-20250514"  // modelo mais potente
```

---

## 📦 Dependências principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| `@chakra-ui/react` | ^2.8 | UI components |
| `react-apexcharts` | ^1.4 | Gráficos |
| `apexcharts` | ^3.44 | Engine dos gráficos |
| `framer-motion` | ^10 | Animações Chakra |
