import { ok } from "@/lib/api";
import { store } from "@/lib/store";

export async function GET() {
  return ok({ data: store.auditLogs });
}
