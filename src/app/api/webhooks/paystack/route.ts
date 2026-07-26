import { getFinancialPlatform } from "@/lib/financial";

export const runtime = "nodejs";

/**
 * Legacy Paystack webhook path — keep registered until dashboard migrates to
 * https://yike.ng/api/payments/webhook
 *
 * Auth: HMAC-SHA512(raw body, PAYSTACK_SECRET_KEY) vs x-paystack-signature.
 * Gateway traffic enters only through Financial Platform → Payment module.
 */
export async function POST(request: Request) {
  return getFinancialPlatform().payment.processWebhook(request, "paystack webhook");
}
