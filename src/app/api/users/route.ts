import { NextResponse } from "next/server";
import { z } from "zod";
import { USER_ROLES, can } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { getProfileFromRequest, mapProfile } from "@/lib/server-auth";

const createSchema = z.object({
  nome: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(USER_ROLES),
});

const updateSchema = z.object({
  id: z.string(),
  role: z.enum(USER_ROLES).optional(),
  ativo: z.boolean().optional(),
});

export async function GET(request: Request) {
  const actor = await getProfileFromRequest(request);
  if (!actor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  if (!can(actor.role, "manageUsers")) return NextResponse.json({ error: "Apenas Admin gerencia usuarios." }, { status: 403 });
  if (!isDatabaseConfigured()) return NextResponse.json({ data: [] });
  const profiles = await prisma.profile.findMany({ orderBy: { criadoEm: "desc" } });
  return NextResponse.json({ data: profiles.map(mapProfile) });
}

export async function POST(request: Request) {
  const actor = await getProfileFromRequest(request);
  if (!actor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  if (!can(actor.role, "manageUsers")) return NextResponse.json({ error: "Apenas Admin cria usuarios." }, { status: 403 });
  if (!isSupabaseConfigured() || !isDatabaseConfigured()) return NextResponse.json({ error: "Supabase ou banco nao configurado." }, { status: 500 });

  const input = createSchema.parse(await request.json());
  const supabase = createSupabaseServiceClient();
  const created = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.nome },
  });
  if (created.error && !created.error.message.toLowerCase().includes("already")) {
    return NextResponse.json({ error: created.error.message }, { status: 400 });
  }

  const profile = await prisma.profile.upsert({
    where: { email: input.email },
    update: { nome: input.nome, role: input.role, ativo: true },
    create: { nome: input.nome, email: input.email, role: input.role, ativo: true },
  });
  return NextResponse.json({ data: mapProfile(profile) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getProfileFromRequest(request);
  if (!actor) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  if (!can(actor.role, "manageUsers")) return NextResponse.json({ error: "Apenas Admin altera usuarios." }, { status: 403 });

  const input = updateSchema.parse(await request.json());
  const profile = await prisma.profile.update({
    where: { id: input.id },
    data: {
      role: input.role,
      ativo: input.ativo,
    },
  });
  return NextResponse.json({ data: mapProfile(profile) });
}
