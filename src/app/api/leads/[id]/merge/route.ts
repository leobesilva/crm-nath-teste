import { ok } from "@/lib/api";
import { mergeLeads } from "@/lib/store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const lead = mergeLeads(id, body.sourceLeadId);
  return ok({ status: "merged", lead_id: id, merged_with: body.sourceLeadId, data: lead });
}
