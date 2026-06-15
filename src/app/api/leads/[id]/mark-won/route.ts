import { ok } from "@/lib/api";
import { markLeadWon } from "@/lib/db-adapter";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  if (!body.produtoId && !body.produtoInteresse) {
    return ok({ error: "Nao e permitido marcar venda realizada sem produto." }, 422);
  }
  const lead = await markLeadWon(id, { produtoInteresse: body.produtoInteresse });
  if (!lead) return ok({ error: "Lead nao encontrado" }, 404);
  return ok({ status: "won", lead_id: id, data: lead });
}
