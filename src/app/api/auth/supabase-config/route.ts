import { NextResponse } from "next/server";
import { readEnv } from "@/lib/supabase";

export async function GET() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return NextResponse.json({
    configured: Boolean(url && anonKey),
    url: url ?? null,
    anonKey: anonKey ?? null,
  });
}
