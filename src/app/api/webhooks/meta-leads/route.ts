import { NextResponse } from "next/server";
import { processLeadWebhook } from "@/lib/webhook-handler";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && challenge && expected && token === expected) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verificacao invalida" }, { status: 403 });
}

export async function POST(request: Request) {
  return processLeadWebhook(request, "meta-leads");
}
