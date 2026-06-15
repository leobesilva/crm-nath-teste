import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export function readEnv(name: string) {
  const raw = process.env[name]?.trim().replace(/^["']|["']$/g, "");
  const withoutName = raw?.startsWith(`${name}=`) ? raw.slice(name.length + 1) : raw;
  return withoutName?.trim().replace(/^["']|["']$/g, "").replace(/\s+/g, "");
}

export function isSupabaseConfigured() {
  return Boolean(readEnv("NEXT_PUBLIC_SUPABASE_URL") && readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
}

export function createSupabaseBrowserClient() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Supabase não configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  return createClient(url, key);
}

let browserClient: SupabaseClient | null = null;

export async function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (url && key) {
    browserClient = createClient(url, key);
    return browserClient;
  }

  const response = await fetch("/api/auth/supabase-config", { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok || !payload.configured || !payload.url || !payload.anonKey) {
    throw new Error("Supabase não configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel e faça redeploy.");
  }

  browserClient = createClient(payload.url, payload.anonKey);
  return browserClient;
}

export function createSupabaseServiceClient() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase service role não configurado. Preencha SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
