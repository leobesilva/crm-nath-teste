import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api";
import { createInboundRawEntry, createLead, getIntegrationSource, updateInboundRawEntryStatus } from "@/lib/db-adapter";
import { normalizeInboundPayload } from "@/lib/store";

const webhookSchema = z.object({
  nome: z.string().optional(),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  instagram: z.string().optional(),
  origem: z.string().optional(),
  campanha: z.string().optional(),
  dor_principal: z.string().optional(),
  produto_interesse: z.string().optional(),
  consentimento_contato: z.boolean().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  landing_page: z.string().optional(),
  referrer: z.string().optional(),
  integration_source_id: z.string().optional(),
  payload_original: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export async function processLeadWebhook(request: Request, channel = "generic") {
  try {
    const url = new URL(request.url);
    const payload = webhookSchema.parse(await request.json());
    const source = await getIntegrationSource(url.searchParams.get("source") || payload.integration_source_id);
    if (source?.webhookToken && !isValidWebhookToken(request, url, source.webhookToken)) {
      return NextResponse.json({ error: "Token de webhook invalido" }, { status: 401 });
    }
    const normalized = normalizeInboundPayload(payload, source, channel);
    const rawEntry = await createInboundRawEntry({
      ...payload,
      ...normalized.utm,
      integrationSourceId: normalized.integrationSourceId,
      integrationChannel: normalized.integrationChannel,
      mensagem: normalized.mensagem,
      normalized_preview: normalized,
    }, source?.nome || payload.origem || "Webhook");
    const result = await createLead({
      nome: normalized.nome,
      telefone: normalized.telefone,
      whatsapp: normalized.whatsapp,
      email: normalized.email,
      instagram: normalized.instagram,
      origem: normalized.origem,
      campanha: normalized.campanha,
      dorPrincipal: normalized.dorPrincipal,
      produtoInteresse: normalized.produtoInteresse,
      consentimentoContato: normalized.consentimentoContato,
      observacoes: normalized.utm.landingPage ? `Landing page: ${normalized.utm.landingPage}` : undefined,
    });
    rawEntry.statusProcessamento = result.created ? "Processado" : "Duplicado";
    rawEntry.leadId = result.lead?.id ?? null;
    rawEntry.erroProcessamento = result.duplicates[0]?.reason ?? null;
    await updateInboundRawEntryStatus(rawEntry.id, {
      statusProcessamento: rawEntry.statusProcessamento,
      leadId: rawEntry.leadId,
      erroProcessamento: rawEntry.erroProcessamento,
    });
    return ok(
      {
        status: result.created ? "processado" : "duplicado_sinalizado",
        raw_entry: rawEntry,
        lead_id: result.lead?.id,
        acao_recomendada: result.lead?.proximaAcao,
        score: result.lead?.score,
        temperatura: result.lead?.temperatura,
        origem: normalized.origem,
        campanha: normalized.campanha,
        utm: normalized.utm,
        canal: normalized.integrationChannel,
        integration_source: source?.nome ?? null,
        duplicados: result.duplicates,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

function isValidWebhookToken(request: Request, url: URL, expectedToken: string) {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7) : "";
  const token = url.searchParams.get("token") || request.headers.get("x-crm-webhook-token") || bearer;
  return token === expectedToken;
}
