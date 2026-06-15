import { mockInteractions, mockLeads, mockTasks } from "./mock-data";
import { adaptInboundPayload, defaultIntegrationSources } from "./integrations";
import { applyLeadRules, detectDuplicate, DuplicateCandidate } from "./rules";
import { can as canRole } from "./auth";
import { AuditLog, Campaign, DashboardData, IntegrationSource, Interaction, Lead, RawEntry, Task } from "./types";

type Store = {
  leads: Lead[];
  rawEntries: RawEntry[];
  interactions: Interaction[];
  tasks: Task[];
  campaigns: Campaign[];
  auditLogs: AuditLog[];
  integrationSources: IntegrationSource[];
};

const initialRawEntries: RawEntry[] = [
  {
    id: "raw-1",
    fonte: "Webhook",
    payloadJson: {
      nome: "Lead externo",
      whatsapp: "65999990000",
      email: "externo@example.com",
      origem: "Página de Vendas",
      campanha: "Lançamento",
    },
    nomeOriginal: "Lead externo",
    telefoneOriginal: "65999990000",
    emailOriginal: "externo@example.com",
    origemOriginal: "Página de Vendas",
    campanhaOriginal: "Lançamento",
    statusProcessamento: "Pendente",
    criadoEm: new Date().toISOString(),
  },
  {
    id: "raw-2",
    fonte: "CSV",
    payloadJson: {
      nome: "Ana Clara Mendes",
      whatsapp: "5565999991111",
      email: "ana@example.com",
      origem: "Lista Antiga",
    },
    nomeOriginal: "Ana Clara Mendes",
    telefoneOriginal: "5565999991111",
    emailOriginal: "ana@example.com",
    origemOriginal: "Lista Antiga",
    statusProcessamento: "Duplicado",
    leadId: "lead-1",
    erroProcessamento: "Telefone/WhatsApp igual",
    criadoEm: new Date(Date.now() - 86400000).toISOString(),
  },
];

const globalStore = globalThis as unknown as { crmStore?: Store };

const initialCampaigns: Campaign[] = [
  {
    id: "campaign-1",
    nome: "Diagnóstico Junho",
    origem: "Meta Lead Ads",
    dataInicio: "2026-06-01",
    dataFim: "2026-06-30",
    investimento: 800,
    status: "Ativa",
    observacoes: "Captação para diagnóstico ALIANÇA.",
  },
  {
    id: "campaign-2",
    nome: "Aula Aberta Voz Autoral",
    origem: "Instagram Orgânico",
    dataInicio: "2026-06-05",
    dataFim: null,
    investimento: 0,
    status: "Ativa",
    observacoes: "Orgânico com convite para direção artística contínua.",
  },
];

const initialIntegrationSources: IntegrationSource[] = [
  {
    id: "source-page-sales",
    nome: "Página de Vendas",
    tipo: "Página de Vendas",
    status: "Ativa",
    origemPadrao: "Página de Vendas",
    campanhaPadrao: "Página de Vendas",
    produtoPadrao: "Diagnóstico ALIANÇA",
    webhookPath: "/api/webhooks/forms?source=source-page-sales",
    recebidos: 0,
    processados: 0,
    duplicados: 0,
    erros: 0,
  },
  {
    id: "source-forms",
    nome: "Formulários",
    tipo: "Formulário",
    status: "Ativa",
    origemPadrao: "Cadastro Manual",
    campanhaPadrao: "Formulários",
    produtoPadrao: "Diagnóstico ALIANÇA",
    webhookPath: "/api/webhooks/forms?source=source-forms",
    recebidos: 0,
    processados: 0,
    duplicados: 0,
    erros: 0,
  },
  {
    id: "source-whatsapp",
    nome: "WhatsApp",
    tipo: "WhatsApp",
    status: "Rascunho",
    origemPadrao: "WhatsApp",
    campanhaPadrao: "WhatsApp",
    produtoPadrao: "Diagnóstico ALIANÇA",
    webhookPath: "/api/webhooks/whatsapp?source=source-whatsapp",
    recebidos: 0,
    processados: 0,
    duplicados: 0,
    erros: 0,
  },
  {
    id: "source-instagram",
    nome: "Instagram / Meta",
    tipo: "Instagram",
    status: "Rascunho",
    origemPadrao: "Instagram Orgânico",
    campanhaPadrao: "Instagram",
    produtoPadrao: "Diagnóstico ALIANÇA",
    webhookPath: "/api/webhooks/instagram?source=source-instagram",
    recebidos: 0,
    processados: 0,
    duplicados: 0,
    erros: 0,
  },
];
void initialIntegrationSources;

export const store: Store =
  globalStore.crmStore ??
  {
    leads: [...mockLeads],
    rawEntries: initialRawEntries,
    interactions: [...mockInteractions],
    tasks: [...mockTasks],
    campaigns: initialCampaigns,
    auditLogs: [],
    integrationSources: defaultIntegrationSources,
  };

if (!globalStore.crmStore) globalStore.crmStore = store;
store.campaigns ??= initialCampaigns;
store.auditLogs ??= [];
store.integrationSources ??= defaultIntegrationSources;

export function listLeads() {
  return store.leads;
}

export function findLead(id: string) {
  return store.leads.find((lead) => lead.id === id);
}

export function createLeadFromPayload(payload: Record<string, unknown>) {
  const normalized = applyLeadRules({
    nome: String(payload.nome ?? payload.nomeOriginal ?? ""),
    cpfCnpj: asString(payload.cpfCnpj ?? payload.cpf_cnpj),
    telefone: asString(payload.telefone),
    whatsapp: asString(payload.whatsapp ?? payload.celular),
    email: asString(payload.email),
    instagram: asString(payload.instagram),
    origem: asString(payload.origem ?? payload.origemPadrao),
    campanha: asString(payload.campanha ?? payload.utm_campaign ?? payload.utmCampaign),
    dorPrincipal: asString(payload.dorPrincipal ?? payload.dor_principal),
    produtoInteresse: asString(payload.produtoInteresse ?? payload.produto_interesse),
    etapaFunil: asString(payload.etapaFunil ?? payload.etapa_funil),
    consentimentoContato: Boolean(payload.consentimentoContato ?? payload.consentimento_contato),
    valorPago: Number(payload.valorPago ?? payload.valor_pago ?? 0),
    valorVencido: Number(payload.valorVencido ?? payload.valor_vencido ?? 0),
    valorAVencer: Number(payload.valorAVencer ?? payload.valor_a_vencer ?? 0),
    respondeuContato: Boolean(payload.respondeuContato ?? payload.respondeu_contato),
    pediuPrecoOuDiagnostico: Boolean(payload.pediuPrecoOuDiagnostico ?? payload.pediu_preco_ou_diagnostico),
    clienteAntigo: Boolean(payload.clienteAntigo ?? payload.cliente_antigo),
  });
  const duplicates = detectDuplicate({ ...normalized, id: "novo" }, store.leads);
  const lead: Lead = {
    id: crypto.randomUUID(),
    nome: normalized.nome,
    cpfCnpj: normalized.cpfCnpj,
    telefone: normalized.telefone,
    whatsapp: normalized.whatsapp,
    email: normalized.email,
    instagram: normalized.instagram,
    cidade: asString(payload.cidade),
    estado: asString(payload.estado),
    origem: normalized.origem,
    campanha: normalized.campanha,
    produtoInteresse: normalized.produtoInteresse || normalized.produtoSugerido,
    dorPrincipal: normalized.dorPrincipal,
    momentoArtistico: asString(payload.momentoArtistico ?? payload.momento_artistico),
    etapaFunil: normalized.etapaFunil || "Novo Lead",
    statusComercial: "Novo Lead",
    temperatura: normalized.temperatura,
    score: normalized.score,
    responsavel: asString(payload.responsavel),
    proximaAcao: normalized.proximaAcao,
    dataProximaAcao: null,
    ultimaInteracao: null,
    consentimentoContato: normalized.consentimentoContato,
    statusFinanceiro: normalized.statusFinanceiro,
    valorPago: normalized.valorPago,
    valorVencido: normalized.valorVencido,
    valorAVencer: normalized.valorAVencer,
    observacoes: asString(payload.observacoes),
    motivoPerda: null,
  };

  if (!duplicates.length) {
    store.leads.unshift(lead);
    addInteraction({
      leadId: lead.id,
      tipo: "Sistema",
      descricao: `Lead criado automaticamente. Próxima ação: ${lead.proximaAcao}`,
      resultado: "Processado",
    });
    createInitialTask(lead);
  }

  return { lead: duplicates.length ? duplicates[0]?.lead : lead, created: !duplicates.length, duplicates };
}

export function createRawEntry(payload: Record<string, unknown>, fonte = "Webhook") {
  const entry: RawEntry = {
    id: crypto.randomUUID(),
    fonte,
    payloadJson: payload,
    nomeOriginal: asString(payload.nome),
    telefoneOriginal: asString(payload.whatsapp ?? payload.telefone),
    emailOriginal: asString(payload.email),
    instagramOriginal: asString(payload.instagram),
    origemOriginal: asString(payload.origem),
    campanhaOriginal: asString(payload.campanha),
    statusProcessamento: "Pendente",
    criadoEm: new Date().toISOString(),
  };
  store.rawEntries.unshift(entry);
  return entry;
}

export function listIntegrationSources() {
  refreshIntegrationMetrics();
  return store.integrationSources;
}

export function findIntegrationSource(id?: string | null) {
  if (!id) return undefined;
  return store.integrationSources.find((source) => source.id === id);
}

export function upsertIntegrationSource(input: Partial<IntegrationSource> & { nome: string }) {
  const current = input.id ? store.integrationSources.find((source) => source.id === input.id) : undefined;
  if (current) {
    Object.assign(current, input);
    refreshIntegrationMetrics();
    return current;
  }
  const id = slugify(input.nome);
  const source: IntegrationSource = {
    id,
    nome: input.nome,
    tipo: input.tipo ?? "Outro",
    status: input.status ?? "Rascunho",
    origemPadrao: input.origemPadrao ?? "Cadastro Manual",
    campanhaPadrao: input.campanhaPadrao ?? input.nome,
    produtoPadrao: input.produtoPadrao ?? "Diagnóstico ALIANÇA",
    webhookPath: input.webhookPath ?? `/api/webhooks/forms?source=${id}`,
    recebidos: 0,
    processados: 0,
    duplicados: 0,
    erros: 0,
    ultimaEntrada: null,
  };
  store.integrationSources.unshift(source);
  refreshIntegrationMetrics();
  return source;
}

export function normalizeInboundPayload(payload: Record<string, unknown>, source?: IntegrationSource, channel = "generic") {
  return adaptInboundPayload(payload, source, channel as never);
}

export function refreshIntegrationMetrics() {
  for (const source of store.integrationSources) {
    const entries = store.rawEntries.filter((entry) => {
      const payloadSourceId = String(entry.payloadJson.integrationSourceId ?? entry.payloadJson.integration_source_id ?? "");
      return payloadSourceId === source.id || entry.fonte === source.nome || entry.origemOriginal === source.origemPadrao;
    });
    source.recebidos = entries.length;
    source.processados = entries.filter((entry) => entry.statusProcessamento === "Processado").length;
    source.duplicados = entries.filter((entry) => entry.statusProcessamento === "Duplicado").length;
    source.erros = entries.filter((entry) => entry.statusProcessamento === "Erro").length;
    source.ultimaEntrada = entries[0]?.criadoEm ?? null;
  }
}

export function processRawEntry(id: string) {
  const entry = store.rawEntries.find((item) => item.id === id);
  if (!entry) throw new Error("Entrada bruta não encontrada");
  try {
    const result = createLeadFromPayload(entry.payloadJson);
    entry.statusProcessamento = result.created ? "Processado" : "Duplicado";
    entry.leadId = result.lead?.id ?? null;
    entry.erroProcessamento = result.duplicates[0]?.reason ?? null;
    return { entry, ...result };
  } catch (error) {
    entry.statusProcessamento = "Erro";
    entry.erroProcessamento = error instanceof Error ? error.message : "Erro ao processar";
    return { entry, created: false, duplicates: [] as ReturnType<typeof detectDuplicate> };
  }
}

export function ignoreRawEntry(id: string) {
  const entry = store.rawEntries.find((item) => item.id === id);
  if (!entry) throw new Error("Entrada bruta não encontrada");
  entry.statusProcessamento = "Ignorado";
  entry.erroProcessamento = null;
  return entry;
}

export function addInteraction(input: { leadId: string; tipo: string; descricao: string; resultado?: string | null }) {
  const interaction: Interaction = {
    id: crypto.randomUUID(),
    leadId: input.leadId,
    tipo: input.tipo,
    descricao: input.descricao,
    resultado: input.resultado ?? null,
    criadoEm: new Date().toISOString(),
  };
  store.interactions.unshift(interaction);
  const lead = findLead(input.leadId);
  if (lead) lead.ultimaInteracao = interaction.criadoEm;
  return interaction;
}

export function addTask(input: { leadId: string; titulo: string; descricao?: string | null; tipo: string; dataVencimento: string; responsavel?: string | null }) {
  const lead = findLead(input.leadId);
  const task: Task = {
    id: crypto.randomUUID(),
    leadId: input.leadId,
    leadNome: lead?.nome ?? "Lead não encontrado",
    titulo: input.titulo,
    descricao: input.descricao ?? null,
    tipo: input.tipo,
    status: "Pendente",
    dataVencimento: input.dataVencimento,
    responsavel: input.responsavel ?? lead?.responsavel ?? "Comercial",
    concluidoEm: null,
  };
  store.tasks.unshift(task);
  return task;
}

export function updateTask(id: string, input: Partial<Task>) {
  const task = store.tasks.find((item) => item.id === id);
  if (!task) throw new Error("Tarefa não encontrada");
  Object.assign(task, input);
  if (input.status === "Concluída") task.concluidoEm = new Date().toISOString();
  return task;
}

export function mergeLeads(targetLeadId: string, sourceLeadId: string) {
  const target = findLead(targetLeadId);
  const source = findLead(sourceLeadId);
  if (!target || !source) throw new Error("Lead de origem ou destino não encontrado");
  store.interactions.forEach((interaction) => {
    if (interaction.leadId === sourceLeadId) interaction.leadId = targetLeadId;
  });
  store.tasks.forEach((task) => {
    if (task.leadId === sourceLeadId) {
      task.leadId = targetLeadId;
      task.leadNome = target.nome;
    }
  });
  target.observacoes = [target.observacoes, source.observacoes, `Mesclado com ${source.nome}`].filter(Boolean).join("\n");
  target.ultimaInteracao = new Date().toISOString();
  store.leads = store.leads.filter((lead) => lead.id !== sourceLeadId);
  addInteraction({
    leadId: targetLeadId,
    tipo: "Sistema",
    descricao: `Lead ${source.nome} mesclado neste perfil.`,
    resultado: "Mescla concluída",
  });
  return target;
}

export function candidateDuplicates(input: DuplicateCandidate) {
  return detectDuplicate(input, store.leads.filter((lead) => lead.id !== input.id));
}

export function listCampaignsWithMetrics() {
  return store.campaigns.map((campaign) => {
    const leads = store.leads.filter((lead) => lead.campanha === campaign.nome || lead.origem === campaign.origem);
    const vendas = leads.filter((lead) => lead.etapaFunil === "Venda Realizada" || lead.statusComercial === "Cliente Ativo");
    const receita = vendas.reduce((sum, lead) => sum + lead.valorPago, 0);
    return {
      ...campaign,
      leads: leads.length,
      qualificados: leads.filter((lead) => lead.score >= 60).length,
      diagnosticosAgendados: leads.filter((lead) => lead.etapaFunil === "Diagnóstico Agendado").length,
      vendas: vendas.length,
      receita,
      cac: vendas.length ? campaign.investimento / vendas.length : null,
      conversao: leads.length ? vendas.length / leads.length : 0,
    };
  });
}

export function upsertCampaign(input: Partial<Campaign> & { nome: string }) {
  const current = input.id ? store.campaigns.find((campaign) => campaign.id === input.id) : undefined;
  if (current) {
    Object.assign(current, input);
    return current;
  }
  const campaign: Campaign = {
    id: crypto.randomUUID(),
    nome: input.nome,
    origem: input.origem ?? "Cadastro Manual",
    dataInicio: input.dataInicio ?? null,
    dataFim: input.dataFim ?? null,
    investimento: Number(input.investimento ?? 0),
    status: input.status ?? "Planejada",
    observacoes: input.observacoes ?? null,
  };
  store.campaigns.unshift(campaign);
  return campaign;
}

export function calculateDashboard(): DashboardData {
  const leads = store.leads.filter((lead) => !lead.deletadoEm);
  const totalLeads = leads.length;
  const vendas = leads.filter((lead) => lead.etapaFunil === "Venda Realizada" || lead.statusComercial === "Cliente Ativo");
  const clientesAtivos = leads.filter((lead) => lead.statusComercial === "Cliente Ativo" || lead.etapaFunil === "Cliente Ativo");
  const receitaPaga = sum(leads.map((lead) => lead.valorPago));
  const receitaVencida = sum(leads.map((lead) => lead.valorVencido));
  const receitaAVencer = sum(leads.map((lead) => lead.valorAVencer));
  const ticketMedio = vendas.length ? receitaPaga / vendas.length : null;
  const recurringProducts = ["Estrada do Artista"];
  const mrr = leads
    .filter((lead) => clientesAtivos.includes(lead) && recurringProducts.includes(lead.produtoInteresse ?? ""))
    .reduce((total, lead) => total + (lead.valorAVencer || lead.valorPago || 0), 0);
  const campaignMetrics = listCampaignsWithMetrics();
  const campaignInvestment = sum(campaignMetrics.map((campaign) => campaign.investimento));
  const cac = vendas.length && campaignInvestment ? campaignInvestment / vendas.length : null;
  const lost = leads.filter((lead) => lead.etapaFunil === "Perdido").length;
  const churn = clientesAtivos.length ? lost / clientesAtivos.length : null;
  const responseRate = totalLeads ? leads.filter((lead) => lead.ultimaInteracao).length / totalLeads : 0;

  return {
    metrics: [
      { label: "Total de leads", value: String(totalLeads), hint: `${withWhatsapp(leads)} com WhatsApp` },
      { label: "Leads com e-mail", value: String(leads.filter((lead) => lead.email).length), hint: "Base nutrível" },
      { label: "Diagnósticos agendados", value: String(leads.filter((lead) => lead.etapaFunil === "Diagnóstico Agendado").length), hint: "Agenda comercial" },
      { label: "Propostas enviadas", value: String(leads.filter((lead) => lead.etapaFunil === "Proposta Enviada").length), hint: "Follow-up aberto" },
      { label: "Vendas realizadas", value: String(vendas.length), hint: percent(vendas.length, totalLeads) },
      { label: "Clientes ativos", value: String(clientesAtivos.length), hint: "Base em acompanhamento" },
      { label: "Receita paga", value: money(receitaPaga), hint: ticketMedio ? `Ticket médio ${money(ticketMedio)}` : "Dados insuficientes" },
      { label: "Receita vencida", value: money(receitaVencida), hint: receitaVencida > 0 ? "Ação financeira necessária" : "Sem vencidos" },
      { label: "Receita a vencer", value: money(receitaAVencer), hint: "Previsão financeira" },
      { label: "MRR", value: mrr ? money(mrr) : "Dados insuficientes", hint: "Produtos recorrentes ativos" },
      { label: "CAC", value: cac ? money(cac) : "Dados insuficientes", hint: "Investimento / vendas" },
      { label: "Churn", value: churn === null ? "Dados insuficientes" : `${Math.round(churn * 100)}%`, hint: "Perdidos / ativos" },
      { label: "Taxa de resposta", value: `${Math.round(responseRate * 100)}%`, hint: "Com interação registrada" },
    ],
    funnel: groupBy(leads, "etapaFunil", "etapa"),
    origins: groupBy(leads, "origem", "origem"),
    temperatures: groupBy(leads, "temperatura", "temperatura"),
    revenue: [
      { mes: "Abr", paga: 0, vencida: 0 },
      { mes: "Mai", paga: leads.find((lead) => lead.nome.includes("Carla"))?.valorPago ?? 0, vencida: 0 },
      { mes: "Jun", paga: receitaPaga, vencida: receitaVencida },
    ],
    losses: groupBy(leads.filter((lead) => lead.motivoPerda), "motivoPerda", "motivo"),
    campaigns: campaignMetrics.map((campaign) => ({
      nome: campaign.nome,
      origem: campaign.origem ?? "-",
      investimento: campaign.investimento,
      leads: campaign.leads,
      vendas: campaign.vendas,
      receita: campaign.receita,
      cac: campaign.cac === null ? "Dados insuficientes" : money(campaign.cac),
      conversao: `${Math.round(campaign.conversao * 100)}%`,
    })),
    conversions: conversionByStage(leads),
    productSales: productSales(leads),
  };
}

export function anonymizeLead(id: string, actorRole = "Admin") {
  const lead = findLead(id);
  if (!lead) throw new Error("Lead não encontrado");
  lead.nome = `Lead anonimizado ${id.slice(0, 6)}`;
  lead.cpfCnpj = null;
  lead.telefone = null;
  lead.whatsapp = null;
  lead.email = null;
  lead.instagram = null;
  lead.observacoes = "Dados pessoais anonimizados por solicitação LGPD.";
  audit(actorRole, "ANONYMIZE_LEAD", "lead", id, "Lead anonimizado.");
  return lead;
}

export function softDeleteLead(id: string, actorRole = "Admin") {
  const lead = findLead(id);
  if (!lead) throw new Error("Lead não encontrado");
  lead.deletadoEm = new Date().toISOString();
  lead.etapaFunil = "Perdido";
  audit(actorRole, "SOFT_DELETE_LEAD", "lead", id, "Lead excluído logicamente.");
  return lead;
}

export function audit(actorRole: string, action: string, entity: string, entityId: string, description: string) {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    action,
    entity,
    entityId,
    actorRole,
    description,
    createdAt: new Date().toISOString(),
  };
  store.auditLogs.unshift(log);
  return log;
}

export function can(role: string, action: "export" | "lgpd" | "manageUsers" | "edit") {
  return canRole(role, action);
}

function createInitialTask(lead: Lead) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return addTask({
    leadId: lead.id,
    titulo: lead.proximaAcao || "Follow-up",
    tipo: lead.proximaAcao?.includes("WhatsApp") ? "Contato inicial" : "Follow-up",
    dataVencimento: tomorrow,
    responsavel: lead.responsavel,
  });
}

function asString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function slugify(value: string) {
  return `source-${value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${crypto.randomUUID().slice(0, 6)}`;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function percent(part: number, total: number) {
  if (!total) return "Dados insuficientes";
  return `${Math.round((part / total) * 100)}% de conversão`;
}

function withWhatsapp(leads: Lead[]) {
  return leads.filter((lead) => lead.whatsapp || lead.telefone).length;
}

function groupBy<T extends Lead>(items: T[], key: keyof T, label: string) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const value = String(item[key] || "Não informado");
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, total]) => ({ [label]: name, total })) as never;
}

function conversionByStage(leads: Lead[]) {
  const order = ["Novo Lead", "Contatado", "Respondido", "Qualificado", "Diagnóstico Agendado", "Proposta Enviada", "Venda Realizada"];
  return order.slice(0, -1).map((stage, index) => {
    const current = leads.filter((lead) => lead.etapaFunil === stage).length;
    const next = leads.filter((lead) => lead.etapaFunil === order[index + 1]).length;
    return { etapa: `${stage} → ${order[index + 1]}`, taxa: current ? `${Math.round((next / current) * 100)}%` : "Dados insuficientes" };
  });
}

function productSales(leads: Lead[]) {
  const productMap = new Map<string, { produto: string; vendas: number; receita: number }>();
  leads
    .filter((lead) => lead.etapaFunil === "Venda Realizada" || lead.statusComercial === "Cliente Ativo")
    .forEach((lead) => {
      const produto = lead.produtoInteresse || "Não informado";
      const current = productMap.get(produto) ?? { produto, vendas: 0, receita: 0 };
      current.vendas += 1;
      current.receita += lead.valorPago;
      productMap.set(produto, current);
    });
  return Array.from(productMap.values());
}
