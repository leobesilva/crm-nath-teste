import { handleApiError, ok } from "@/lib/api";
import { updateLeadFields } from "@/lib/db-adapter";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const lead = await updateLeadFields(id, body);
    if (!lead) return ok({ error: "Lead nao encontrado" }, 404);
    return ok({ data: lead });
  } catch (error) {
    return handleApiError(error);
  }
}
