import { processPaystackWebhookPost } from "@/lib/payments/webhooks/paystack";

export const runtime = "nodejs";

/**
 * Preferred Paystack webhook endpoint:
 * https://yike.ng/api/payments/webhook
 *
 * Auth: HMAC-SHA512(raw body, PAYSTACK_SECRET_KEY) vs x-paystack-signature.
 * Legacy alias: /api/webhooks/paystack
 */
export async function POST(request: Request) {
  return processPaystackWebhookPost(request, "payments webhook");
}
