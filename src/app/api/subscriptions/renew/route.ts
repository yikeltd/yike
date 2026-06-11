import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  renewSubscriptionCheckout,
  activateSubscriptionFromPayment,
} from "@/lib/subscriptions/service";
import { SUBSCRIPTION_DURATION_DAYS } from "@/lib/subscriptions/constants";
import { isFeaturedPaymentsEnabled } from "@/lib/feature-flags";
import { isPaystackConfigured } from "@/lib/payments/config";
import {
  createPaymentOrder,
  initializePayment,
} from "@/lib/payments/services/payment-service";
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

  const renewal = await renewSubscriptionCheckout(admin, user.id);
  if (!renewal) {
    return NextResponse.json({ error: "No paid plan to renew" }, { status: 400 });
  }

  const { data: profileRow } = await admin
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  const paymentsLive = isFeaturedPaymentsEnabled() && isPaystackConfigured();

  if (!paymentsLive) {
    const result = await activateSubscriptionFromPayment(admin, {
      userId: user.id,
      planCode: renewal.plan.plan_code,
      paymentOrderId: "",
      paymentReference: `renew-offline-${user.id.slice(0, 8)}`,
      durationDays: SUBSCRIPTION_DURATION_DAYS,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, paymentsLive: false });
  }

  const order = await createPaymentOrder(admin, {
    userId: user.id,
    orderType: "subscription",
    amount: renewal.amount,
    entityId: renewal.plan.id,
    metadata: {
      plan_code: renewal.plan.plan_code,
      duration_days: SUBSCRIPTION_DURATION_DAYS,
      user_id: user.id,
      renewal: true,
    },
  });

  const email = user.email ?? (profileRow as Profile | null)?.email ?? "";
  const init = await initializePayment(admin, order.id, email);
  if (!init.authorizationUrl) {
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    authorizationUrl: init.authorizationUrl,
    reference: order.reference,
    amount: renewal.amount,
    paymentsLive: true,
  });
}
