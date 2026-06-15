import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Dados inválidos", issues: error.issues }, { status: 422 });
  }
  const message = error instanceof Error ? error.message : "Erro inesperado";
  return NextResponse.json({ error: message }, { status: 500 });
}

export function parseMoney(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(normalized) || 0;
}
