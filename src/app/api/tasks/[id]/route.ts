import { ok } from "@/lib/api";
import { updateTask } from "@/lib/store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return ok({ data: updateTask(id, body) });
}
