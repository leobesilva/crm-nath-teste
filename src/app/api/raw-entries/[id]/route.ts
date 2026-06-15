import { handleApiError, ok } from "@/lib/api";
import { ignoreRawEntry, processRawEntry, store } from "@/lib/store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.action === "ignore") return ok({ data: ignoreRawEntry(id) });
    if (body.action === "process" || body.action === "reprocess") return ok({ data: processRawEntry(id) });
    if (body.action === "link") {
      const entry = store.rawEntries.find((item) => item.id === id);
      if (!entry) return ok({ error: "Entrada bruta não encontrada" }, 404);
      entry.leadId = body.leadId;
      entry.statusProcessamento = "Processado";
      entry.erroProcessamento = null;
      return ok({ data: entry });
    }
    return ok({ error: "Ação inválida" }, 422);
  } catch (error) {
    return handleApiError(error);
  }
}
