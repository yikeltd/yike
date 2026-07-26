import { getFinancialPlatform } from "@/lib/financial";

export const runtime = "nodejs";

/**
 * Preferred Paystack webhook endpoint:
 * https://yike.ng/api/payments/webhook
 *
 * Auth: HMAC-SHA512(raw body, PAYSTACK_SECRET_KEY) vs x-paystack-signature.
 * Legacy alias: /api/webhooks/paystack
 *
 * Gateway traffic enters only through Financial Platform → Payment module.
 */
export async function POST(request: Request) {
  return getFinancialPlatform().payment.processWebhook(request, "payments webhook");
}
