import { handleApiError, ok } from "@/lib/api";
import { anonymizeLead, can, softDeleteLead } from "@/lib/store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = request.headers.get("x-crm-role") ?? "Admin";
    if (!can(role, "lgpd")) return ok({ error: "Ações LGPD são permitidas somente para Admin." }, 403);
    const body = await request.json();
    if (body.action === "anonymize") return ok({ data: anonymizeLead(id, role) });
    if (body.action === "soft-delete") return ok({ data: softDeleteLead(id, role) });
    return ok({ error: "Ação LGPD inválida." }, 422);
  } catch (error) {
    return handleApiError(error);
  }
}
