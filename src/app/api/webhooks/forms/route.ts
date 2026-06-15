import { processLeadWebhook } from "@/lib/webhook-handler";

export async function POST(request: Request) {
  return processLeadWebhook(request, "forms");
}
