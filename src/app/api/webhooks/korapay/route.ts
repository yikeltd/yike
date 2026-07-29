import { processKorapayWebhookPost } from "@/lib/payments/webhooks/korapay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return processKorapayWebhookPost(request, "korapay webhook");
}
