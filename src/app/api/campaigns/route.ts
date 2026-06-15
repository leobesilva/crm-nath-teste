import { handleApiError, ok } from "@/lib/api";
import { listCampaignsWithMetrics, upsertCampaign } from "@/lib/store";

export async function GET() {
  return ok({ data: listCampaignsWithMetrics() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return ok({ data: upsertCampaign(body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
