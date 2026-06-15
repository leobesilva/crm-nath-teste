import { createClient } from "@supabase/supabase-js";

function readEnv(name: string) {
  return process.env[name]?.trim().replace(/^["']|["']$/g, "");
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
