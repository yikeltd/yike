import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPhoneForTel } from "@/lib/utils";
import { getActiveUserSubscription } from "@/lib/subscriptions/service";

export type SellerPhoneAccessResult = {
  canRevealPhone: boolean;
  phone: string | null;
  telUrl: string | null;
  reason: string;
  messageForBuyer: string;
};

const PHONE_UNAVAILABLE_COPY =
  "This seller's phone number is unavailable on their current plan. Message them securely on Yike or start an available in-app call.";

/** Paid plans that include buyer-visible phone when direct WhatsApp is enabled by policy. */
const PHONE_REVEAL_PLAN_CODES = new Set(["pro_agent", "agency", "developer"]);

/**
 * Authoritative seller phone visibility for buyers.
 * Requires active paid subscription AND allow_direct_whatsapp (staff-enabled routing flag).
 */
export async function resolveSellerPhoneAccessForBuyer(
  admin: SupabaseClient,
  sellerId: string
): Promise<SellerPhoneAccessResult> {
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, phone, whatsapp, allow_direct_whatsapp, subscription_plan_code, account_status, is_banned"
    )
    .eq("id", sellerId)
    .maybeSingle();

  if (!profile || profile.is_banned) {
    return {
      canRevealPhone: false,
      phone: null,
      telUrl: null,
      reason: "seller_unavailable",
      messageForBuyer: PHONE_UNAVAILABLE_COPY,
    };
  }

  const activeSub = await getActiveUserSubscription(admin, sellerId);
  const planCode =
    activeSub?.plan?.plan_code ??
    (profile.subscription_plan_code as string | null) ??
    "free";

  const subscriptionEligible = PHONE_REVEAL_PLAN_CODES.has(planCode);
  const entitled = subscriptionEligible && Boolean(profile.allow_direct_whatsapp);

  if (!entitled) {
    return {
      canRevealPhone: false,
      phone: null,
      telUrl: null,
      reason: subscriptionEligible ? "direct_whatsapp_disabled" : "plan_no_phone_reveal",
      messageForBuyer: PHONE_UNAVAILABLE_COPY,
    };
  }

  const phone = (profile.phone?.trim() || profile.whatsapp?.trim() || "") || null;
  if (!phone) {
    return {
      canRevealPhone: false,
      phone: null,
      telUrl: null,
      reason: "no_phone_on_file",
      messageForBuyer: PHONE_UNAVAILABLE_COPY,
    };
  }

  return {
    canRevealPhone: true,
    phone,
    telUrl: `tel:${formatPhoneForTel(phone)}`,
    reason: "entitled",
    messageForBuyer: "",
  };
}
