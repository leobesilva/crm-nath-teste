import { randomUUID } from "crypto";
import { IntegrationSource as PrismaIntegrationSource, Lead as PrismaLead, Prisma } from "@prisma/client";
import { prisma, isDatabaseConfigured } from "./prisma";
import { applyLeadRules, detectDuplicate } from "./rules";
import { buildWebhookPath, defaultIntegrationSources } from "./integrations";
import { calculateDashboard, listIntegrationSources as listMemoryIntegrationSources, listLeads, store, upsertIntegrationSource as upsertMemoryIntegrationSource } from "./store";
import { DashboardData, IntegrationSource, Lead, Product, RawEntry } from "./types";
import { PRODUTOS_INICIAIS } from "./constants";

type LeadWithRelations = PrismaLead & {
  origem?: { nome: string } | null;
  campanha?: { nome: string } | null;
  produtoInteresse?: { nome: string } | null;
  responsavel?: { nome: string } | null;
};

export function dataMode() {
  return isDatabaseConfigured() ? "database" : "memory";
}

export async function getLeads(): Promise<Lead[]> {
  if (!isDatabaseConfigured()) return listLeads();
  const leads = await prisma.lead.findMany({
    where: { deletadoEm: null },
    include: {
      origem: true,
      campanha: true,
      produtoInteresse: true,
      responsavel: true,
    },
    orderBy: { criadoEm: "desc" },
  });
  return leads.map(mapLead);
}

export async function getLead(id: string): Promise<Lead | undefined> {
  if (!isDatabaseConfigured()) return listLeads().find((lead) => lead.id === id);
  const lead = await prisma.lead.findFirst({
    where: { id, deletadoEm: null },
    include: {
      origem: true,
      campanha: true,
      produtoInteresse: true,
      responsavel: true,
    },
  });
  return lead ? mapLead(lead) : undefined;
}

export async function getProducts(): Promise<Product[]> {
  if (!isDatabaseConfigured()) {
    return PRODUTOS_INICIAIS.map((product, index) => ({
      id: `product-${index}`,
      nome: product.nome,
      categoria: product.categoria,
      preco: product.preco,
      recorrente: product.recorrente,
      ativo: true,
    }));
  }
  const products = await prisma.product.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
  return products.map((product) => ({
    id: product.id,
    nome: product.nome,
    categoria: product.categoria,
    preco: Number(product.preco ?? 0),
    recorrente: product.recorrente,
    ativo: product.ativo,
  }));
}

export async function upsertProduct(input: Partial<Product> & { nome: string }) {
  if (!isDatabaseConfigured()) {
    return {
      id: input.id || `product-${randomUUID().slice(0, 8)}`,
      nome: input.nome,
      categoria: input.categoria || "Oferta",
      preco: Number(input.preco ?? 0),
      recorrente: Boolean(input.recorrente),
      ativo: input.ativo ?? true,
    };
  }
  const data = {
    nome: input.nome,
    categoria: input.categoria || "Oferta",
    preco: new Prisma.Decimal(Number(input.preco ?? 0)),
    recorrente: Boolean(input.recorrente),
    ativo: input.ativo ?? true,
  };
  const product = input.id
    ? await prisma.product.update({ where: { id: input.id }, data })
    : await prisma.product.upsert({ where: { nome: input.nome }, update: data, create: data });
  return {
    id: product.id,
    nome: product.nome,
    categoria: product.categoria,
    preco: Number(product.preco ?? 0),
    recorrente: product.recorrente,
    ativo: product.ativo,
  };
}

export async function deleteProduct(id: string) {
  if (!isDatabaseConfigured()) return { id };
  await prisma.product.update({ where: { id }, data: { ativo: false } });
  return { id };
}

export async function createLead(payload: Record<string, unknown>) {
  if (!isDatabaseConfigured()) {
    const { createLeadFromPayload } = await import("./store");
    return createLeadFromPayload(payload);
  }

  const normalized = applyLeadRules({
    nome: String(payload.nome ?? ""),
    cpfCnpj: asString(payload.cpfCnpj ?? payload.cpf_cnpj),
    telefone: asString(payload.telefone),
    whatsapp: asString(payload.whatsapp ?? payload.celular),
    email: asString(payload.email),
    instagram: asString(payload.instagram),
    origem: asString(payload.origem),
    campanha: asString(payload.campanha),
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

  const existing = await getLeads();
  const duplicates = detectDuplicate({ ...normalized, id: "novo" }, existing);
  if (duplicates.length) return { lead: duplicates[0]?.lead, created: false, duplicates };

  const origem = normalized.origem ? await connectOrCreateOrigin(normalized.origem) : undefined;
  const campanha = normalized.campanha ? await connectOrCreateCampaign(normalized.campanha, normalized.origem) : undefined;
  const produto = normalized.produtoInteresse || normalized.produtoSugerido ? await connectOrCreateProduct(normalized.produtoInteresse || normalized.produtoSugerido) : undefined;

  const created = await prisma.lead.create({
    data: {
      nome: normalized.nome,
      cpfCnpj: normalized.cpfCnpj,
      telefone: normalized.telefone,
      whatsapp: normalized.whatsapp,
      email: normalized.email,
      instagram: normalized.instagram,
      cidade: asString(payload.cidade),
      estado: asString(payload.estado),
      dorPrincipal: normalized.dorPrincipal,
      momentoArtistico: asString(payload.momentoArtistico ?? payload.momento_artistico),
      etapaFunil: normalized.etapaFunil || "Novo Lead",
      statusComercial: "Novo Lead",
      temperatura: normalized.temperatura,
      score: normalized.score,
      proximaAcao: normalized.proximaAcao,
      consentimentoContato: normalized.consentimentoContato,
      dataConsentimento: normalized.consentimentoContato ? new Date() : null,
      origemConsentimento: normalized.consentimentoContato ? "CRM" : null,
      statusFinanceiro: normalized.statusFinanceiro,
      valorPago: new Prisma.Decimal(normalized.valorPago),
      valorVencido: new Prisma.Decimal(normalized.valorVencido),
      valorAVencer: new Prisma.Decimal(normalized.valorAVencer),
      observacoes: asString(payload.observacoes),
      origem: origem ? { connect: { id: origem.id } } : undefined,
      campanha: campanha ? { connect: { id: campanha.id } } : undefined,
      produtoInteresse: produto ? { connect: { id: produto.id } } : undefined,
    },
    include: {
      origem: true,
      campanha: true,
      produtoInteresse: true,
      responsavel: true,
    },
  });

  await prisma.interaction.create({
    data: {
      leadId: created.id,
      tipo: "Sistema",
      descricao: `Lead criado automaticamente. Próxima ação: ${normalized.proximaAcao}`,
      resultado: "Processado",
    },
  });
  await prisma.task.create({
    data: {
      leadId: created.id,
      titulo: normalized.proximaAcao || "Follow-up",
      tipo: normalized.proximaAcao?.includes("WhatsApp") ? "Contato inicial" : "Follow-up",
      status: "Pendente",
      dataVencimento: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return { lead: mapLead(created), created: true, duplicates };
}

export async function createInboundRawEntry(payload: Record<string, unknown>, fonte = "Webhook"): Promise<RawEntry> {
  if (!isDatabaseConfigured()) {
    const { createRawEntry } = await import("./store");
    return createRawEntry(payload, fonte);
  }
  const jsonPayload = JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonObject;
  const entry = await prisma.leadRawEntry.create({
    data: {
      fonte,
      payloadJson: jsonPayload,
      nomeOriginal: asString(payload.nome),
      telefoneOriginal: asString(payload.whatsapp ?? payload.telefone),
      emailOriginal: asString(payload.email),
      instagramOriginal: asString(payload.instagram),
      origemOriginal: asString(payload.origem ?? payload.utmSource ?? payload.utm_source),
      campanhaOriginal: asString(payload.campanha ?? payload.utmCampaign ?? payload.utm_campaign),
      statusProcessamento: "Pendente",
    },
  });
  return {
    id: entry.id,
    fonte: entry.fonte,
    payloadJson: entry.payloadJson as Record<string, unknown>,
    nomeOriginal: entry.nomeOriginal,
    telefoneOriginal: entry.telefoneOriginal,
    emailOriginal: entry.emailOriginal,
    instagramOriginal: entry.instagramOriginal,
    origemOriginal: entry.origemOriginal,
    campanhaOriginal: entry.campanhaOriginal,
    statusProcessamento: entry.statusProcessamento as RawEntry["statusProcessamento"],
    leadId: entry.leadId,
    erroProcessamento: entry.erroProcessamento,
    criadoEm: entry.criadoEm.toISOString(),
  };
}

export async function updateInboundRawEntryStatus(
  id: string,
  input: { statusProcessamento: RawEntry["statusProcessamento"]; leadId?: string | null; erroProcessamento?: string | null },
) {
  if (!isDatabaseConfigured()) return;
  await prisma.leadRawEntry.update({
    where: { id },
    data: {
      statusProcessamento: input.statusProcessamento,
      leadId: input.leadId,
      erroProcessamento: input.erroProcessamento,
    },
  });
}

export async function getIntegrationSources(): Promise<IntegrationSource[]> {
  if (!isDatabaseConfigured()) return listMemoryIntegrationSources();
  await ensureDefaultIntegrationSources();
  const [sources, rawEntries] = await Promise.all([
    prisma.integrationSource.findMany({ orderBy: [{ status: "asc" }, { nome: "asc" }] }),
    prisma.leadRawEntry.findMany({
      select: {
        fonte: true,
        payloadJson: true,
        origemOriginal: true,
        statusProcessamento: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: "desc" },
    }),
  ]);
  return sources.map((source) => withIntegrationMetrics(mapIntegrationSource(source), rawEntries));
}

export async function getIntegrationSource(idOrToken?: string | null): Promise<IntegrationSource | undefined> {
  if (!idOrToken) return undefined;
  if (!isDatabaseConfigured()) return listMemoryIntegrationSources().find((source) => source.id === idOrToken || source.webhookToken === idOrToken);
  await ensureDefaultIntegrationSources();
  const source = await prisma.integrationSource.findFirst({
    where: { OR: [{ id: idOrToken }, { webhookToken: idOrToken }] },
  });
  return source ? mapIntegrationSource(source) : undefined;
}

export async function upsertIntegrationSourceConfig(input: Partial<IntegrationSource> & { nome: string }) {
  if (!isDatabaseConfigured()) return upsertMemoryIntegrationSource(input);
  const id = input.id || slugifySource(input.nome);
  const current = input.id ? await prisma.integrationSource.findUnique({ where: { id: input.id } }) : null;
  const token = input.webhookToken || current?.webhookToken || `crm_${randomUUID().replace(/-/g, "")}`;
  const tipo = input.tipo || "Outro";
  const webhookPath = input.webhookPath || current?.webhookPath || buildWebhookPath(id, tipo, token);
  const data = {
    nome: input.nome,
    tipo,
    status: input.status || "Rascunho",
    origemPadrao: input.origemPadrao || "Cadastro Manual",
    campanhaPadrao: input.campanhaPadrao || input.nome,
    produtoPadrao: input.produtoPadrao || "Diagnostico ALIANCA",
    webhookPath,
    webhookToken: token,
    provider: input.provider || null,
    accountName: input.accountName || null,
    externalId: input.externalId || null,
    fieldMapping: input.fieldMapping ? (input.fieldMapping as Prisma.InputJsonObject) : Prisma.JsonNull,
  };
  const source = await prisma.integrationSource.upsert({
    where: { id },
    update: data,
    create: { id, ...data },
  });
  return mapIntegrationSource(source);
}

export async function deleteIntegrationSourceConfig(id: string) {
  if (!isDatabaseConfigured()) {
    store.integrationSources = store.integrationSources.filter((source) => source.id !== id);
    return { id };
  }
  await prisma.integrationSource.delete({ where: { id } });
  return { id };
}

export async function markLeadWon(id: string, input: { produtoInteresse?: string | null }) {
  if (!isDatabaseConfigured()) {
    const { addInteraction, findLead } = await import("./store");
    const lead = findLead(id);
    if (!lead) return null;
    lead.etapaFunil = "Venda Realizada";
    lead.statusComercial = "Cliente Ativo";
    lead.produtoInteresse = input.produtoInteresse ?? lead.produtoInteresse;
    addInteraction({ leadId: id, tipo: "Sistema", descricao: "Lead marcado como venda realizada.", resultado: "Venda realizada" });
    return lead;
  }
  const produto = input.produtoInteresse ? await connectOrCreateProduct(input.produtoInteresse) : undefined;
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      etapaFunil: "Venda Realizada",
      statusComercial: "Cliente Ativo",
      produtoInteresse: produto ? { connect: { id: produto.id } } : undefined,
    },
    include: { origem: true, campanha: true, produtoInteresse: true, responsavel: true },
  });
  await prisma.interaction.create({
    data: { leadId: id, tipo: "Sistema", descricao: "Lead marcado como venda realizada.", resultado: "Venda realizada" },
  });
  return mapLead(lead);
}

export async function markLeadLost(id: string, motivoPerda: string) {
  if (!isDatabaseConfigured()) {
    const { addInteraction, findLead } = await import("./store");
    const lead = findLead(id);
    if (!lead) return null;
    lead.etapaFunil = "Perdido";
    lead.motivoPerda = motivoPerda;
    addInteraction({ leadId: id, tipo: "Sistema", descricao: `Lead marcado como perdido: ${motivoPerda}.`, resultado: "Perdido" });
    return lead;
  }
  const lead = await prisma.lead.update({
    where: { id },
    data: { etapaFunil: "Perdido", motivoPerda },
    include: { origem: true, campanha: true, produtoInteresse: true, responsavel: true },
  });
  await prisma.interaction.create({
    data: { leadId: id, tipo: "Sistema", descricao: `Lead marcado como perdido: ${motivoPerda}.`, resultado: "Perdido" },
  });
  return mapLead(lead);
}

export async function updateLeadFields(id: string, input: Record<string, unknown>) {
  if (!isDatabaseConfigured()) {
    const { findLead } = await import("./store");
    const lead = findLead(id);
    if (!lead) return null;
    Object.assign(lead, input);
    return lead;
  }
  const current = await getLead(id);
  if (!current) return null;
  const merged = { ...current, ...input };
  const dynamic = merged as Record<string, unknown>;
  const rules = applyLeadRules({
    nome: String(merged.nome ?? ""),
    cpfCnpj: asString(merged.cpfCnpj ?? dynamic.cpf_cnpj),
    telefone: asString(merged.telefone),
    whatsapp: asString(merged.whatsapp ?? dynamic.celular),
    email: asString(merged.email),
    instagram: asString(merged.instagram),
    origem: asString(merged.origem),
    campanha: asString(merged.campanha),
    dorPrincipal: asString(merged.dorPrincipal ?? dynamic.dor_principal),
    produtoInteresse: asString(merged.produtoInteresse ?? dynamic.produto_interesse),
    etapaFunil: asString(merged.etapaFunil ?? dynamic.etapa_funil),
    consentimentoContato: Boolean(merged.consentimentoContato ?? dynamic.consentimento_contato),
    valorPago: Number(merged.valorPago ?? dynamic.valor_pago ?? 0),
    valorVencido: Number(merged.valorVencido ?? dynamic.valor_vencido ?? 0),
    valorAVencer: Number(merged.valorAVencer ?? dynamic.valor_a_vencer ?? 0),
  });
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      etapaFunil: asString(input.etapaFunil) ?? undefined,
      statusComercial: asString(input.statusComercial) ?? undefined,
      motivoPerda: input.motivoPerda === null ? null : asString(input.motivoPerda),
      proximaAcao: asString(input.proximaAcao) ?? rules.proximaAcao,
      score: rules.score,
      temperatura: rules.temperatura,
      statusFinanceiro: rules.statusFinanceiro,
    },
    include: { origem: true, campanha: true, produtoInteresse: true, responsavel: true },
  });
  await prisma.interaction.create({
    data: { leadId: id, tipo: "Sistema", descricao: "Lead atualizado pelo perfil.", resultado: lead.etapaFunil },
  });
  return mapLead(lead);
}

export async function getDashboard(): Promise<DashboardData> {
  if (!isDatabaseConfigured()) return calculateDashboard();
  const leads = await getLeads();
  const original = store.leads;
  store.leads = leads;
  try {
    return calculateDashboard();
  } finally {
    store.leads = original;
  }
}

function mapLead(lead: LeadWithRelations): Lead {
  return {
    id: lead.id,
    nome: lead.nome,
    cpfCnpj: lead.cpfCnpj,
    telefone: lead.telefone,
    whatsapp: lead.whatsapp,
    email: lead.email,
    instagram: lead.instagram,
    cidade: lead.cidade,
    estado: lead.estado,
    origem: lead.origem?.nome ?? null,
    campanha: lead.campanha?.nome ?? null,
    produtoInteresse: lead.produtoInteresse?.nome ?? null,
    dorPrincipal: lead.dorPrincipal,
    momentoArtistico: lead.momentoArtistico,
    etapaFunil: lead.etapaFunil,
    statusComercial: lead.statusComercial,
    temperatura: lead.temperatura,
    score: lead.score,
    responsavel: lead.responsavel?.nome ?? null,
    proximaAcao: lead.proximaAcao,
    dataProximaAcao: lead.dataProximaAcao?.toISOString() ?? null,
    ultimaInteracao: lead.ultimaInteracao?.toISOString() ?? null,
    consentimentoContato: lead.consentimentoContato,
    statusFinanceiro: lead.statusFinanceiro,
    valorPago: Number(lead.valorPago),
    valorVencido: Number(lead.valorVencido),
    valorAVencer: Number(lead.valorAVencer),
    observacoes: lead.observacoes,
    motivoPerda: lead.motivoPerda,
    deletadoEm: lead.deletadoEm?.toISOString() ?? null,
  };
}

async function connectOrCreateOrigin(nome: string) {
  return prisma.origin.upsert({
    where: { nome },
    update: { ativo: true },
    create: { nome, ativo: true },
  });
}

async function connectOrCreateCampaign(nome: string, origem?: string | null) {
  const origin = origem ? await connectOrCreateOrigin(origem) : null;
  const existing = await prisma.campaign.findFirst({ where: { nome } });
  if (existing) return existing;
  return prisma.campaign.create({
    data: {
      nome,
      status: "Ativa",
      origemId: origin?.id,
    },
  });
}

async function connectOrCreateProduct(nome: string) {
  const existing = await prisma.product.findUnique({ where: { nome } });
  if (existing) return existing;
  return prisma.product.create({
    data: {
      nome,
      categoria: "Diagnóstico",
      ativo: true,
      recorrente: nome === "Estrada do Artista",
    },
  });
}

async function ensureDefaultIntegrationSources() {
  const count = await prisma.integrationSource.count();
  if (count > 0) return;
  for (const source of defaultIntegrationSources) {
    const token = source.webhookToken || `crm_${randomUUID().replace(/-/g, "")}`;
    await prisma.integrationSource.create({
      data: {
        id: source.id,
        nome: source.nome,
        tipo: source.tipo,
        status: source.status,
        origemPadrao: source.origemPadrao,
        campanhaPadrao: source.campanhaPadrao,
        produtoPadrao: source.produtoPadrao,
        webhookPath: buildWebhookPath(source.id, source.tipo, token),
        webhookToken: token,
        provider: source.provider,
        accountName: source.accountName,
        externalId: source.externalId,
        fieldMapping: source.fieldMapping ? (source.fieldMapping as Prisma.InputJsonObject) : Prisma.JsonNull,
      },
    });
  }
}

function mapIntegrationSource(source: PrismaIntegrationSource): IntegrationSource {
  return {
    id: source.id,
    nome: source.nome,
    tipo: source.tipo as IntegrationSource["tipo"],
    status: source.status as IntegrationSource["status"],
    origemPadrao: source.origemPadrao,
    campanhaPadrao: source.campanhaPadrao,
    produtoPadrao: source.produtoPadrao,
    webhookPath: source.webhookPath,
    webhookToken: source.webhookToken,
    provider: source.provider,
    accountName: source.accountName,
    externalId: source.externalId,
    fieldMapping: source.fieldMapping && typeof source.fieldMapping === "object" && !Array.isArray(source.fieldMapping) ? (source.fieldMapping as Record<string, string>) : null,
    recebidos: 0,
    processados: 0,
    duplicados: 0,
    erros: 0,
    ultimaEntrada: null,
  };
}

function withIntegrationMetrics(
  source: IntegrationSource,
  rawEntries: Pick<Awaited<ReturnType<typeof prisma.leadRawEntry.findMany>>[number], "fonte" | "payloadJson" | "origemOriginal" | "statusProcessamento" | "criadoEm">[],
) {
  const entries = rawEntries.filter((entry) => {
    const payload = entry.payloadJson as Record<string, unknown>;
    const sourceId = String(payload.integrationSourceId ?? payload.integration_source_id ?? "");
    return sourceId === source.id || entry.fonte === source.nome || entry.origemOriginal === source.origemPadrao;
  });
  source.recebidos = entries.length;
  source.processados = entries.filter((entry) => entry.statusProcessamento === "Processado").length;
  source.duplicados = entries.filter((entry) => entry.statusProcessamento === "Duplicado").length;
  source.erros = entries.filter((entry) => entry.statusProcessamento === "Erro").length;
  source.ultimaEntrada = entries[0]?.criadoEm.toISOString() ?? null;
  return source;
}

function slugifySource(value: string) {
  return `source-${value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${randomUUID().slice(0, 6)}`;
}

function asString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}
