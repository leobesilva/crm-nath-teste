import { ok } from "@/lib/api";
import { dataMode } from "@/lib/db-adapter";
import { isDatabaseConfigured } from "@/lib/prisma";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  return ok({
    dataMode: dataMode(),
    databaseConfigured: isDatabaseConfigured(),
    supabaseConfigured: isSupabaseConfigured(),
    requiredEnv: [
      "DATABASE_URL",
      "DIRECT_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  });
}
