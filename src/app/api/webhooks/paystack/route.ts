import { processPaystackWebhookPost } from "@/lib/payments/webhooks/paystack";

export const runtime = "nodejs";

/**
 * Legacy Paystack webhook path — keep registered until dashboard migrates to
 * https://yike.ng/api/payments/webhook
 *
 * Auth: HMAC-SHA512(raw body, PAYSTACK_SECRET_KEY) vs x-paystack-signature.
 */
export async function POST(request: Request) {
  return processPaystackWebhookPost(request, "paystack webhook");
}
