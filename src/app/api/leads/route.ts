import { handleApiError, ok } from "@/lib/api";
import { createLead, getLeads } from "@/lib/db-adapter";

export async function GET() {
  return ok({ data: await getLeads() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createLead(body);
    return ok({ data: result.lead, created: result.created, duplicates: result.duplicates }, result.created ? 201 : 200);
  } catch (error) {
    return handleApiError(error);
  }
}
