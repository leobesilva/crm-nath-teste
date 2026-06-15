import { prisma, isDatabaseConfigured } from "./prisma";
import { createSupabaseServiceClient, isSupabaseConfigured } from "./supabase";
import { AuthProfile, normalizeRole, UserRole } from "./auth";

export async function getProfileFromRequest(request: Request): Promise<AuthProfile | null> {
  const token = bearerToken(request);
  if (!token || !isSupabaseConfigured() || !isDatabaseConfigured()) return null;

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return null;

  const profile = await prisma.profile.upsert({
    where: { email: data.user.email },
    update: { ativo: true },
    create: {
      nome: String(data.user.user_metadata?.name || data.user.email.split("@")[0]),
      email: data.user.email,
      role: "Usuario Basico",
      ativo: true,
    },
  });

  return mapProfile(profile);
}

export async function requireProfile(request: Request) {
  const profile = await getProfileFromRequest(request);
  if (!profile || !profile.ativo) throw new Error("Nao autenticado");
  return profile;
}

export function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  return authorization.slice(7);
}

export function mapProfile(profile: { id: string; nome: string; email: string; role: string; ativo: boolean }): AuthProfile {
  return {
    id: profile.id,
    nome: profile.nome,
    email: profile.email,
    role: normalizeRole(profile.role),
    ativo: profile.ativo,
  };
}

export function dbRole(role: UserRole) {
  return role;
}
