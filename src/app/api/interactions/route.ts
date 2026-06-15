import { handleApiError, ok } from "@/lib/api";
import { TIPOS_INTERACAO } from "@/lib/constants";
import { addInteraction, store } from "@/lib/store";
import { z } from "zod";

const schema = z.object({
  leadId: z.string().min(1),
  tipo: z.enum(TIPOS_INTERACAO),
  descricao: z.string().min(1),
  resultado: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    return ok({ data: addInteraction(body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  return ok({ data: store.interactions });
}
