import { NextResponse } from "next/server";
import { getProfileFromRequest } from "@/lib/server-auth";

export async function GET(request: Request) {
  const profile = await getProfileFromRequest(request);
  if (!profile) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  return NextResponse.json({ data: profile });
}
