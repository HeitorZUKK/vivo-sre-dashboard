# Conhecimento de análise de reincidência — Vivo Fly
#
# Este arquivo é lido pela Serverless Function (api/analyze.js) e injetado no
# prompt enviado à Claude quando o modo é "Fly". Edite aqui para mudar como a IA
# classifica os chamados — não precisa mexer no código do dashboard.
# Após editar, faça commit + push e o Vercel aplica no próximo deploy.

PRINCÍPIOS DE CLASSIFICAÇÃO (siga rigorosamente):
1. Cada subtipo representa UM único caso/causa. Nunca junte problemas diferentes no mesmo subtipo, mesmo que pareçam "o mesmo assunto". Ex: "botão não aparece porque o processo_grupo está errado" ≠ "botão não aparece porque o usuário não tem permissão" → dois subtipos distintos.
2. Nomeie pela CAUSA, não pela AÇÃO. "Mudança de state/status" descreve o gesto do suporte e esconde causas distintas. Pergunte: "que correção no produto evitaria este chamado?" — se a resposta difere entre dois chamados, os subtipos devem diferir.
3. Evite subtipos guarda-chuva ("Outros", "Diversos"). Só use se realmente não houver padrão. Prefira sempre granular.
4. A descrição do subtipo deve bater exatamente com o que aconteceu nos chamados dele.

SUBCATEGORIAS CANÔNICAS (use estes nomes quando o caso encaixar; crie um novo só se nenhum servir):
SCI: "SCI · Grupo de processo incorreto (botão)", "SCI · Botão indisponível (sem permissão)", "SCI · Botão não aparece / Disparo", "SCI · FCUs não visíveis (sharing)", "SCI · Falha na abertura", "SCI · Cancelamento"
Candidato SOI: "Candidato SOI · Rejeição manual", "Candidato SOI · Rejeição recusada (política)", "Candidato SOI · Alteração de grupo/processo", "Candidato SOI · Erro de cache (encaminhar)", "Candidato SOI · Candidato com erro (reabertura)", "Candidato SOI · Duplicidade em modalidades", "Candidato SOI · Cancelamento"
SOI: "SOI · Definição de Modalidade", "SOI · Erro ao definir modalidade (Camunda)", "SOI · Processo Camunda encerrado", "SOI · Correção task_name/Camunda", "SOI · Erro nova busca vendor (duplicatas)", "SOI · Cancelamento", "SOI · Botão Novo/Vendor desabilitado"
Stage/Fluxo: "Stage · Regressão SCI/FCU", "Stage · Regressão SOI/Candidato"
Correção de Campo (dado inválido, sistema rejeita): "Campo · Inválido · lat/lon", "Campo · Inválido · altitude", "Campo · Inválido · CEP", "Campo · Inválido · endereço", "Campo · Inválido · caractere especial"
Correção de Campo (cliente pede, campo não editável): "Campo · Correção · endereço", "Campo · Correção · altura", "Campo · Correção · município", "Campo · Correção · ID detentora", "Campo · Correção · UF/sigla", "Campo · Correção · dados SCI", "Campo · Correção · lat/lon"
OMNI: "OMNI · Deleção de linhas", "OMNI · Correção de campos"
Detentora/Vendor: "Vendor · Atualização de detentora/ID", "Vendor · Correção de sigla/vendor"
Sistema: "Sistema · Bug de exibição de sites", "Sistema · Erro de upload (limite 40MB)", "Sistema · Erro distrito/município", "Sistema · Bug polígono/DrawingManager", "Sistema · Erro integração/infraestrutura", "Sistema · Bug exportação VivoGO", "Sistema · Erro anexo (NullPointerException)", "Sistema · Cache do navegador"
Transversal: "Falta de Retorno", "Outros / Diversos"
