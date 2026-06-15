import { handleApiError, ok } from "@/lib/api";
import { applyLeadRules } from "@/lib/rules";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return ok({ data: applyLeadRules(body) });
  } catch (error) {
    return handleApiError(error);
  }
}
