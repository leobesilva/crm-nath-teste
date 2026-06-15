import { handleApiError, ok } from "@/lib/api";
import { TIPOS_TAREFA } from "@/lib/constants";
import { addTask, store } from "@/lib/store";
import { z } from "zod";

const schema = z.object({
  leadId: z.string().min(1),
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  tipo: z.enum(TIPOS_TAREFA),
  dataVencimento: z.string().datetime(),
  responsavelId: z.string().optional(),
});

export async function GET() {
  return ok({ data: store.tasks });
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    return ok({ data: addTask(body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
