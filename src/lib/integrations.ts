import { IntegrationSource, UtmData } from "./types";

type InboundChannel = "forms" | "page" | "whatsapp" | "instagram" | "meta-leads" | "generic";

export const defaultIntegrationSources: IntegrationSource[] = [
  {
    id: "source-page-sales",
    nome: "Pagina de Vendas",
    tipo: "Página de Vendas",
    status: "Ativa",
    origemPadrao: "Pagina de Vendas",
    campanhaPadrao: "Pagina de Vendas",
    produtoPadrao: "Diagnostico ALIANCA",
    webhookPath: "/api/webhooks/forms?source=source-page-sales",
    provider: "Site proprio",
    accountName: "Landing page",
    recebidos: 0,
    processados: 0,
    duplicados: 0,
    erros: 0,
  },
  {
    id: "source-forms",
    nome: "Formularios",
    tipo: "Formulário",
    status: "Ativa",
    origemPadrao: "Formulario",
    campanhaPadrao: "Formularios",
    produtoPadrao: "Diagnostico ALIANCA",
    webhookPath: "/api/webhooks/forms?source=source-forms",
    provider: "Google Forms / Typeform / Tally",
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
    produtoPadrao: "Diagnostico ALIANCA",
    webhookPath: "/api/webhooks/whatsapp?source=source-whatsapp",
    provider: "Evolution API / Z-API / ManyChat",
    recebidos: 0,
    processados: 0,
    duplicados: 0,
    erros: 0,
  },
  {
    id: "source-instagram",
    nome: "Instagram Direct",
    tipo: "Instagram",
    status: "Rascunho",
    origemPadrao: "Instagram Organico",
    campanhaPadrao: "Instagram",
    produtoPadrao: "Diagnostico ALIANCA",
    webhookPath: "/api/webhooks/instagram?source=source-instagram",
    provider: "ManyChat / Meta Graph API",
    recebidos: 0,
    processados: 0,
    duplicados: 0,
    erros: 0,
  },
  {
    id: "source-meta-leads",
    nome: "Meta Lead Ads",
    tipo: "Meta Lead Ads",
    status: "Rascunho",
    origemPadrao: "Meta Lead Ads",
    campanhaPadrao: "Meta Lead Ads",
    produtoPadrao: "Diagnostico ALIANCA",
    webhookPath: "/api/webhooks/meta-leads?source=source-meta-leads",
    provider: "Meta",
    recebidos: 0,
    processados: 0,
    duplicados: 0,
    erros: 0,
  },
];

export function adaptInboundPayload(payload: Record<string, unknown>, source?: IntegrationSource, channel: InboundChannel = "generic") {
  const mapped = applyFieldMapping(payload, source?.fieldMapping ?? undefined);
  const metaFields = extractMetaLeadFields(payload);
  const utm = extractUtm({ ...payload, ...mapped, ...metaFields });
  const text = firstString(
    mapped.mensagem,
    payload.mensagem,
    payload.message,
    payload.text,
    getPath(payload, "data.message.conversation"),
    getPath(payload, "data.message.extendedTextMessage.text"),
    getPath(payload, "messages.0.text.body"),
    metaFields.mensagem,
  );

  const channelDefaults = defaultsByChannel(channel, source);
  const nome = firstString(
    mapped.nome,
    mapped.name,
    metaFields.nome,
    payload.nome,
    payload.name,
    payload.full_name,
    payload.fullName,
    payload.contact_name,
    payload.senderName,
    payload.pushName,
    getPath(payload, "contact.name"),
    getPath(payload, "contacts.0.profile.name"),
  );
  const whatsapp = firstString(
    mapped.whatsapp,
    metaFields.whatsapp,
    payload.whatsapp,
    payload.phone,
    payload.telefone,
    payload.celular,
    payload.mobile,
    payload.number,
    payload.remoteJid,
    getPath(payload, "sender.id"),
    getPath(payload, "contacts.0.wa_id"),
  );

  return {
    nome: nome || firstString(whatsapp, payload.email, payload.instagram) || "Lead sem nome",
    telefone: firstString(mapped.telefone, payload.telefone, payload.phone, payload.celular, whatsapp),
    whatsapp,
    email: firstString(mapped.email, metaFields.email, payload.email, payload.mail),
    instagram: firstString(mapped.instagram, metaFields.instagram, payload.instagram, payload.ig, payload.instagram_username, payload.username, getPath(payload, "sender.username")),
    origem: firstString(mapped.origem, payload.origem, payload.source, utm.utmSource, channelDefaults.origem),
    campanha: firstString(mapped.campanha, payload.campanha, payload.campaign, utm.utmCampaign, channelDefaults.campanha),
    produtoInteresse: firstString(mapped.produto_interesse, mapped.produtoInteresse, payload.produto_interesse, payload.produtoInteresse, payload.product, channelDefaults.produto),
    dorPrincipal: firstString(mapped.dor_principal, mapped.dorPrincipal, payload.dor_principal, payload.dorPrincipal, payload.pain, payload.interest, text),
    consentimentoContato: Boolean(payload.consentimento_contato ?? payload.consentimentoContato ?? payload.consent ?? true),
    payloadOriginal: payload,
    integrationSourceId: source?.id,
    integrationChannel: channel,
    mensagem: text,
    utm,
  };
}

export function extractUtm(payload: Record<string, unknown>): UtmData {
  return {
    utmSource: firstString(payload.utm_source, payload.utmSource, payload.source),
    utmMedium: firstString(payload.utm_medium, payload.utmMedium),
    utmCampaign: firstString(payload.utm_campaign, payload.utmCampaign, payload.campaign),
    utmContent: firstString(payload.utm_content, payload.utmContent),
    utmTerm: firstString(payload.utm_term, payload.utmTerm),
    landingPage: firstString(payload.landing_page, payload.landingPage, payload.page_url, payload.url),
    referrer: firstString(payload.referrer, payload.referer),
  };
}

export function buildWebhookPath(sourceId: string, tipo: string, token?: string | null) {
  const channel = tipo === "WhatsApp" ? "whatsapp" : tipo === "Instagram" ? "instagram" : tipo === "Meta Lead Ads" ? "meta-leads" : "forms";
  const params = new URLSearchParams({ source: sourceId });
  if (token) params.set("token", token);
  return `/api/webhooks/${channel}?${params.toString()}`;
}

export function publicWebhookUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function defaultsByChannel(channel: InboundChannel, source?: IntegrationSource) {
  return {
    origem: source?.origemPadrao || (channel === "whatsapp" ? "WhatsApp" : channel === "instagram" ? "Instagram Organico" : channel === "meta-leads" ? "Meta Lead Ads" : "Formulario"),
    campanha: source?.campanhaPadrao || (channel === "meta-leads" ? "Meta Lead Ads" : source?.nome),
    produto: source?.produtoPadrao,
  };
}

function applyFieldMapping(payload: Record<string, unknown>, mapping?: Record<string, string> | null) {
  if (!mapping) return {};
  return Object.fromEntries(
    Object.entries(mapping)
      .map(([target, sourcePath]) => [target, getPath(payload, sourcePath)])
      .filter(([, value]) => value !== undefined && value !== null),
  ) as Record<string, unknown>;
}

function extractMetaLeadFields(payload: Record<string, unknown>) {
  const rawFields = Array.isArray(payload.field_data) ? payload.field_data : Array.isArray(getPath(payload, "leadgen.field_data")) ? getPath(payload, "leadgen.field_data") : [];
  const fields: Record<string, unknown> = {};
  for (const field of rawFields as unknown[]) {
    if (!field || typeof field !== "object") continue;
    const item = field as Record<string, unknown>;
    const name = firstString(item.name, item.key);
    const values = Array.isArray(item.values) ? item.values : [item.value];
    const value = firstString(...values);
    if (name && value) fields[normalizeFieldName(name)] = value;
  }
  return {
    nome: firstString(fields.full_name, fields.nome, fields.name),
    email: firstString(fields.email),
    whatsapp: firstString(fields.phone_number, fields.telefone, fields.whatsapp, fields.celular),
    instagram: firstString(fields.instagram),
    mensagem: firstString(fields.qual_o_seu_maior_desafio_hoje, fields.dor_principal, fields.message),
  };
}

function normalizeFieldName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

function getPath(payload: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === undefined || current === null) return undefined;
    if (Array.isArray(current)) return current[Number(segment)];
    if (typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, payload);
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value !== "string" && typeof value !== "number") continue;
    const trimmed = String(value).replace(/@s\.whatsapp\.net$/, "").trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}
