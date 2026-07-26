import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";
import { sendTransactionalEmail } from "@/lib/notifications/providers/resend";
import { getSiteBaseUrl } from "@/lib/payments/config";
import type { PaymentFulfillmentResult } from "@/lib/payments/services/payment-service";

function purposeLabel(orderType: string): string {
  switch (orderType) {
    case "featured_listing":
      return "Featured listing";
    case "boost_listing":
    case "vehicle_boost":
    case "property_boost":
      return "Listing boost";
    case "subscription":
    case "premium_seller":
      return "Premium seller plan";
    case "property_verification":
      return "Property verification";
    case "verification_fee":
      return "Seller verification";
    case "advertisement":
      return "Advertisement";
    case "lead_insights":
      return "Lead insights";
    default:
      return "Yike payment";
  }
}

function formatNaira(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₦${Math.round(amount).toLocaleString("en-NG")}`;
  }
}

/**
 * Best-effort user notification after webhook fulfillment.
 * Failures are logged and never roll back payment success.
 */
export async function notifyPaymentSuccessful(
  admin: SupabaseClient,
  order: PaymentOrder,
  fulfillment: Extract<PaymentFulfillmentResult, { ok: true }>
): Promise<void> {
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .maybeSingle();

    const email = (profile?.email as string | undefined)?.trim();
    if (!email) return;

    const label = purposeLabel(order.order_type);
    const amount = formatNaira(Number(order.amount), order.currency);
    const base = getSiteBaseUrl();
    const historyUrl = `${base}/payments/history`;

    const detailLines: string[] = [];
    if (fulfillment.featuredUntil) {
      detailLines.push(
        `Featured until ${new Date(fulfillment.featuredUntil).toLocaleDateString("en-NG")}.`
      );
    }
    if (fulfillment.boostedUntil) {
      detailLines.push(
        `Boost active until ${new Date(fulfillment.boostedUntil).toLocaleDateString("en-NG")}.`
      );
    }

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#031B4E">
        <h1 style="font-size:20px;margin:0 0 12px">Payment confirmed</h1>
        <p style="margin:0 0 8px;color:#4b5563">Hi${profile?.full_name ? ` ${profile.full_name}` : ""},</p>
        <p style="margin:0 0 8px;color:#4b5563">
          Your <strong>${label}</strong> payment of <strong>${amount}</strong> was successful.
        </p>
        <p style="margin:0 0 8px;color:#4b5563">Reference: <code>${order.reference}</code></p>
        ${detailLines.map((line) => `<p style="margin:0 0 8px;color:#4b5563">${line}</p>`).join("")}
        <p style="margin:16px 0 0">
          <a href="${historyUrl}" style="display:inline-block;background:#E4B547;color:#031B4E;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:10px">
            View payment history
          </a>
        </p>
      </div>
    `;

    await sendTransactionalEmail({
      to: email,
      subject: `${label} payment confirmed`,
      html,
      idempotencyKey: `payment-success-${order.reference}`,
    });
  } catch (error) {
    console.error("[payments/notify]", error);
  }
}
