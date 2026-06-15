import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { createSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase";

const schema = z.object({
  nome: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    return NextResponse.json({ error: "Supabase ou banco nao configurado." }, { status: 500 });
  }

  const input = schema.parse(await request.json());
  const supabase = createSupabaseServiceClient();
  const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (users.error) return NextResponse.json({ error: users.error.message }, { status: 500 });
  if ((users.data.users?.length ?? 0) > 0) {
    return NextResponse.json({ error: "Primeiro acesso ja foi criado. Peça a um Admin para criar novos usuarios." }, { status: 403 });
  }

  const created = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.nome },
  });
  if (created.error) return NextResponse.json({ error: created.error.message }, { status: 400 });

  const profile = await prisma.profile.upsert({
    where: { email: input.email },
    update: { nome: input.nome, role: "Admin", ativo: true },
    create: { nome: input.nome, email: input.email, role: "Admin", ativo: true },
  });

  return NextResponse.json({ data: { id: profile.id, email: profile.email, role: profile.role } }, { status: 201 });
}
