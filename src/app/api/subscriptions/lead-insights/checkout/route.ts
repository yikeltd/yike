import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRevenuePrice } from "@/lib/revenue-pricing/service";
import { getLeadInsightsAccess } from "@/lib/listing-leads/access";
import { isFeaturedPaymentsEnabled } from "@/lib/feature-flags";
import { isPaystackConfigured } from "@/lib/payments/config";
import {
  createPaymentOrder,
  initializePayment,
} from "@/lib/payments/services/payment-service";
import { SUBSCRIPTION_DURATION_DAYS } from "@/lib/subscriptions/constants";
import type { Profile } from "@/types/database";
import { friendlyPublicError } from "@/lib/copy/public-errors";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const { data: profileRow } = await admin.from("profiles").select("*").eq("id", user.id).single();
  if (!profileRow) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const access = await getLeadInsightsAccess(admin, profileRow as Profile);
  if (access.hasFullHistory) {
    return NextResponse.json({ error: "Lead Insights already included in your plan" }, { status: 409 });
  }

  const leadInsightsAmount = await getRevenuePrice(admin, "lead_insights", "monthly");
  if (leadInsightsAmount == null) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const paymentsLive = isFeaturedPaymentsEnabled() && isPaystackConfigured();

  if (!paymentsLive) {
    const expires = new Date();
    expires.setDate(expires.getDate() + SUBSCRIPTION_DURATION_DAYS);
    await admin
      .from("profiles")
      .update({ lead_insights_until: expires.toISOString(), updated_at: new Date().toISOString() })
      .eq("id", user.id);
    return NextResponse.json({ ok: true, paymentsLive: false });
  }

  const order = await createPaymentOrder(admin, {
    userId: user.id,
    orderType: "lead_insights",
    amount: leadInsightsAmount,
    metadata: { user_id: user.id, product: "lead_insights" },
  });

  const email = user.email ?? (profileRow as Profile).email ?? "";
  const init = await initializePayment(admin, order.id, email);
  if (!init.authorizationUrl) {
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    authorizationUrl: init.authorizationUrl,
    reference: order.reference,
    amount: leadInsightsAmount,
    paymentsLive: true,
  });
}
