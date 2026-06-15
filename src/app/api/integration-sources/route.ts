import { handleApiError, ok } from "@/lib/api";
import { deleteIntegrationSourceConfig, getIntegrationSources, upsertIntegrationSourceConfig } from "@/lib/db-adapter";

export async function GET() {
  return ok({ data: await getIntegrationSources() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return ok({ data: await upsertIntegrationSourceConfig(body) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    return ok({ data: await upsertIntegrationSourceConfig(body) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return ok({ error: "Informe o id da integracao." }, 422);
    return ok({ data: await deleteIntegrationSourceConfig(id) });
  } catch (error) {
    return handleApiError(error);
  }
}
