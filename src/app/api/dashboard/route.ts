import { ok } from "@/lib/api";
import { getDashboard } from "@/lib/db-adapter";

export async function GET() {
  return ok(await getDashboard());
}
