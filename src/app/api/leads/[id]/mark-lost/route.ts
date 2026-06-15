import { ok } from "@/lib/api";
import { markLeadLost } from "@/lib/db-adapter";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  if (!body.motivoPerda) {
    return ok({ error: "Informe o motivo de perda para marcar o lead como perdido." }, 422);
  }
  const lead = await markLeadLost(id, body.motivoPerda);
  if (!lead) return ok({ error: "Lead nao encontrado" }, 404);
  return ok({ status: "lost", lead_id: id, data: lead });
}
