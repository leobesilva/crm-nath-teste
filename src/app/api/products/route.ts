import { handleApiError, ok } from "@/lib/api";
import { deleteProduct, getProducts, upsertProduct } from "@/lib/db-adapter";

export async function GET() {
  return ok({ data: await getProducts() });
}

export async function POST(request: Request) {
  try {
    return ok({ data: await upsertProduct(await request.json()) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    return ok({ data: await upsertProduct(await request.json()) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return ok({ error: "Informe o produto." }, 422);
    return ok({ data: await deleteProduct(id) });
  } catch (error) {
    return handleApiError(error);
  }
}
