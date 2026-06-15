import { ok } from "@/lib/api";
import { createRawEntry, store } from "@/lib/store";

export async function GET() {
  return ok({ data: store.rawEntries });
}

export async function POST(request: Request) {
  const body = await request.json();
  const entry = createRawEntry(body.payload ?? body, body.fonte ?? "Manual");
  return ok({ data: entry }, 201);
}
